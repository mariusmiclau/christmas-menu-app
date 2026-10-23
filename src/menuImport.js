import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  buildColumnRegions,
  findMenuColumnHeadings,
  flattenOcrLines,
  groupOcrColumnLines,
  mergeOcrLines,
} from './menuParser';

export { editorTextToItems, itemsToEditorText, parseMenuText } from './menuParser';

function findFooterTop(blocks, headingTop, imageHeight) {
  const footerPattern = /^(celebrating our|allergens?|dietary|in traditional|pre-?order payment|terms)/i;
  const footerLine = flattenOcrLines(blocks)
    .filter((line) => line.bbox?.y0 > headingTop + (imageHeight * 0.2))
    .find((line) => footerPattern.test(String(line.text || '').trim()));
  return footerLine?.bbox?.y0 || imageHeight * 0.84;
}

async function loadImage(file) {
  if ('createImageBitmap' in globalThis) return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function renderOcrCrop(image, region) {
  const scale = Math.max(1, Math.min(3, 1800 / region.width, 2400 / region.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(region.width * scale);
  canvas.height = Math.ceil(region.height * scale);
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    region.left,
    region.top,
    region.width,
    region.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

async function extractPdfText(file, onProgress) {
  onProgress?.('Reading PDF text…');
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.(`Reading PDF page ${pageNumber} of ${pdf.numPages}…`);
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let pageText = '';
    content.items.forEach((item) => {
      pageText += item.str;
      pageText += item.hasEOL ? '\n' : ' ';
    });
    pages.push(pageText);
  }
  const extractedText = pages.join('\n').trim();
  if (extractedText.length >= 40) return extractedText;

  const scannedPages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    onProgress?.(`The PDF looks scanned. Reading page ${pageNumber} of ${pdf.numPages} as a picture…`);
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d', { alpha: false });
    await page.render({ canvasContext: context, viewport }).promise;
    const image = await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not render the PDF page.')), 'image/png');
    });
    const pageText = await extractImageText(image, (message) => onProgress?.(`Page ${pageNumber}: ${message}`));
    scannedPages.push(pageText);
  }
  return scannedPages.join('\n');
}

async function extractImageText(file, onProgress) {
  const { createWorker, PSM } = await import('tesseract.js');
  let progressLabel = 'Finding menu layout';
  const worker = await createWorker('eng', 1, {
    logger: (message) => {
      if (message.status === 'recognizing text') {
        onProgress?.(`${progressLabel}… ${Math.round((message.progress || 0) * 100)}%`);
      } else if (message.status) {
        onProgress?.(`${message.status.charAt(0).toUpperCase()}${message.status.slice(1)}…`);
      }
    },
  });
  let image;
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
    });
    const layoutResult = await worker.recognize(file, {}, { text: true, blocks: true });
    const headings = findMenuColumnHeadings(layoutResult.data.blocks || []);
    image = await loadImage(file);

    if (headings.length === 3) {
      const headingTop = Math.min(...headings.map(({ bbox }) => bbox.y0));
      const footerTop = findFooterTop(layoutResult.data.blocks || [], headingTop, image.height);
      const regions = buildColumnRegions(
        headings,
        image.width,
        headingTop - (image.height * 0.035),
        Math.min(image.height, footerTop - (image.height * 0.015)),
      );
      const sections = { starters: [], mains: [], desserts: [] };

      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
      });
      for (let index = 0; index < regions.length; index += 1) {
        const region = regions[index];
        progressLabel = `Reading ${region.category} (${index + 1} of ${regions.length})`;
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          preserve_interword_spaces: '1',
          user_defined_dpi: '300',
        });
        const crop = renderOcrCrop(image, region);
        const result = await worker.recognize(crop, {}, { text: true, blocks: true });
        let columnLines = flattenOcrLines(result.data.blocks || []);
        let groupedItems = groupOcrColumnLines(columnLines, region.category);
        if (groupedItems.length < 3) {
          progressLabel = `Double-checking ${region.category}`;
          await worker.setParameters({
            tessedit_pageseg_mode: PSM.SPARSE_TEXT,
            preserve_interword_spaces: '1',
            user_defined_dpi: '300',
          });
          const sparseResult = await worker.recognize(crop, {}, { text: true, blocks: true });
          const sparseLines = flattenOcrLines(sparseResult.data.blocks || []);
          columnLines = mergeOcrLines(columnLines, sparseLines);
          groupedItems = groupOcrColumnLines(columnLines, region.category);
        }
        sections[region.category] = groupedItems;
      }

      if (Object.values(sections).every((items) => items.length)) {
        const priceLines = layoutResult.data.text
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => /\b[23]\s*courses?\b/i.test(line) && /[£$€]\s*\d/.test(line));
        return [
          ...priceLines,
          'STARTERS',
          ...sections.starters,
          'MAINS',
          ...sections.mains,
          'DESSERTS',
          ...sections.desserts,
        ].join('\n');
      }
    }

    progressLabel = 'Reading enlarged picture';
    const fullRegion = { left: 0, top: 0, width: image.width, height: image.height };
    const preparedImage = renderOcrCrop(image, fullRegion);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });
    const result = await worker.recognize(preparedImage);
    return result.data.text;
  } finally {
    image?.close?.();
    await worker.terminate();
  }
}

export async function extractTextFromFile(file, onProgress) {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return extractPdfText(file, onProgress);
  }
  if (file.type.startsWith('image/')) return extractImageText(file, onProgress);
  if (file.type.startsWith('text/') || /\.(txt|md|csv)$/i.test(file.name)) {
    onProgress?.('Reading text file…');
    return file.text();
  }
  throw new Error('Please choose a picture, PDF, or text file.');
}
