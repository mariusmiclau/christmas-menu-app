const CATEGORY_HEADINGS = {
  starters: /^(starters?|to start|first course|appeti[sz]ers?)\s*:?\s*$/i,
  mains: /^(mains?|main courses?|entr[ée]es?|to follow)\s*:?\s*$/i,
  desserts: /^(desserts?|puddings?|sweets?|to finish)\s*:?\s*$/i,
};

const HEADING_WORDS = {
  starter: 'starters',
  starters: 'starters',
  main: 'mains',
  mains: 'mains',
  dessert: 'desserts',
  desserts: 'desserts',
};

const SKIP_LINE = /^(menu|christmas menu|festive menu|allergens?|dietary information|please ask|prices? include|available from|terms|v\s*=|vg\s*=|gf\s*=|celebrating our|in traditional|pre-?order payment)/i;
const TAG_PATTERN = 'vgo|gfo|voa|vegan|vegetarian|vg|gf|v';

export function cleanLine(line) {
  return String(line || '')
    .replace(/^[\s•·▪■◆◇*—–-]+/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/\s+[£$€]\s*\d+(?:[.,]\d{1,2})?\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normaliseOcrText(line) {
  return cleanLine(line)
    .replace(/\b100z\b/gi, '10oz')
    .replace(/\s+4\s+/g, ' & ')
    .replace(/\btenderstern\b/gi, 'tenderstem')
    .replace(/\bchargrilied\b/gi, 'Chargrilled')
    .replace(/\b(?:betries|beries)\b/gi, 'berries')
    .replace(/\bgroen\b/gi, 'green')
    .replace(/\bFrees\b/gi, 'Fries')
    .replace(/\bfst mushroom\b/gi, 'flat mushroom')
    .replace(/\bpeppercorm\b/gi, 'peppercorn')
    .replace(/\bStit+on\b/gi, 'Stilton')
    .replace(/\bhoneyco(?:md|rmd)\b/gi, 'honeycomb')
    .replace(/\bcréme\b/gi, 'crème')
    .replace(/\bfraiche\b/gi, 'fraîche')
    .replace(/\bProvencal\b/gi, 'Provençal')
    .replace(/\s+(?:[a-z]|[$|:])\s*$/i, '')
    .replace(/\s+([,.;:)])/g, '$1')
    .replace(/([(£])\s+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function extractTags(line) {
  const matcher = new RegExp(`\\b(?:${TAG_PATTERN})\\b`, 'gi');
  const matches = line.match(matcher) || [];
  const tags = [...new Set(matches.map((tag) => {
    const value = tag.toLowerCase();
    if (value === 'vegetarian') return 'v';
    if (value === 'vegan') return 'vg';
    return value;
  }))];
  const bracketedTags = new RegExp(`[([]\\s*(?:${TAG_PATTERN})(?:\\s*[,/|]\\s*(?:${TAG_PATTERN}))*\\s*[)\\]]`, 'gi');
  const name = line.replace(bracketedTags, '').replace(/\s{2,}/g, ' ').trim();
  return { name, tags };
}

function makeItem(category, line, index) {
  const { name: itemText, tags } = extractTags(cleanLine(line));
  const [name, ...descriptionParts] = itemText.split(/\s+[—–]\s+/);
  const description = descriptionParts.join(' — ').trim();
  const hashSource = `${name}|${description}`;
  const hash = [...hashSource].reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 7).toString(36);
  return {
    id: `${category[0]}-${index + 1}-${hash}`,
    name: name.trim(),
    ...(description ? { description } : {}),
    tags,
  };
}

function parseCourseOptions(text) {
  const options = {};
  const pattern = /\b([23])\s*courses?\s*(?:[:|-]\s*)?[£$€]\s*(\d+(?:[.,]\d{1,2})?)/gi;
  for (const match of text.matchAll(pattern)) {
    const count = Number(match[1]);
    const price = Number(match[2].replace(',', '.'));
    if (Number.isFinite(price)) options[count] = { label: `${count} Courses`, price };
  }
  return options;
}

export function parseMenuText(text) {
  const lines = String(text || '')
    .replace(/\r/g, '')
    .split('\n')
    .map(cleanLine)
    .filter(Boolean);

  const sections = { starters: [], mains: [], desserts: [] };
  let currentCategory = null;
  let foundHeading = false;

  lines.forEach((line) => {
    const heading = Object.entries(CATEGORY_HEADINGS).find(([, pattern]) => pattern.test(line));
    if (heading) {
      currentCategory = heading[0];
      foundHeading = true;
      return;
    }
    if (!currentCategory || SKIP_LINE.test(line) || /^\d\s*(?:course|courses)/i.test(line) || line.length < 3) return;
    sections[currentCategory].push(line);
  });

  if (!foundHeading) {
    sections.mains = lines.filter((line) => !SKIP_LINE.test(line) && !/^\d\s*(?:course|courses)/i.test(line) && line.length > 2);
  }

  const parsedSections = Object.fromEntries(
    Object.entries(sections).map(([category, items]) => [
      category,
      items.map((line, index) => makeItem(category, line, index)).filter((item) => item.name),
    ]),
  );
  return { ...parsedSections, courseOptions: parseCourseOptions(String(text || '')) };
}

function flattenWords(blocks = []) {
  return blocks.flatMap((block) => block.paragraphs || [])
    .flatMap((paragraph) => paragraph.lines || [])
    .flatMap((line) => line.words || []);
}

export function flattenOcrLines(blocks = []) {
  return blocks.flatMap((block) => block.paragraphs || [])
    .flatMap((paragraph) => paragraph.lines || []);
}

export function mergeOcrLines(primaryLines = [], additionalLines = []) {
  const merged = [...primaryLines];
  additionalLines.forEach((candidate) => {
    if (!candidate?.bbox || (candidate.confidence ?? 100) < 40 || cleanLine(candidate.text).length < 3) return;
    const candidateCenter = (candidate.bbox.y0 + candidate.bbox.y1) / 2;
    const candidateHeight = candidate.bbox.y1 - candidate.bbox.y0;
    const duplicate = merged.some((existing) => {
      if (!existing?.bbox) return false;
      const existingCenter = (existing.bbox.y0 + existing.bbox.y1) / 2;
      const existingHeight = existing.bbox.y1 - existing.bbox.y0;
      return Math.abs(existingCenter - candidateCenter) <= Math.max(14, Math.min(existingHeight, candidateHeight) * 0.6);
    });
    if (!duplicate) merged.push(candidate);
  });
  return merged.sort((a, b) => (a.bbox?.y0 || 0) - (b.bbox?.y0 || 0));
}

export function findMenuColumnHeadings(blocks = []) {
  const candidates = { starters: [], mains: [], desserts: [] };
  flattenWords(blocks).forEach((word) => {
    const normalised = String(word.text || '').toLowerCase().replace(/[^a-z]/g, '');
    const category = HEADING_WORDS[normalised];
    if (category && word.bbox) candidates[category].push({ category, bbox: word.bbox, text: word.text });
  });

  if (Object.values(candidates).some((entries) => !entries.length)) return [];

  let best = null;
  candidates.starters.forEach((starter) => {
    candidates.mains.forEach((main) => {
      candidates.desserts.forEach((dessert) => {
        const trio = [starter, main, dessert];
        const centers = trio.map(({ bbox }) => (bbox.y0 + bbox.y1) / 2);
        const score = Math.max(...centers) - Math.min(...centers);
        if (!best || score < best.score) best = { trio, score };
      });
    });
  });

  const averageHeight = best.trio.reduce((sum, { bbox }) => sum + (bbox.y1 - bbox.y0), 0) / 3;
  if (best.score > Math.max(50, averageHeight * 2.5)) return [];
  return [...best.trio].sort((a, b) => a.bbox.x0 - b.bbox.x0);
}

export function buildColumnRegions(headings, imageWidth, top, bottom) {
  if (headings.length !== 3) return [];
  const sorted = [...headings].sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const spacings = sorted.slice(1).map((heading, index) => heading.bbox.x0 - sorted[index].bbox.x0);
  const spacing = spacings.reduce((sum, value) => sum + value, 0) / spacings.length;

  return sorted.map((heading, index) => {
    const left = Math.max(0, heading.bbox.x0 - (spacing * 0.05));
    const right = index < sorted.length - 1
      ? Math.min(imageWidth, sorted[index + 1].bbox.x0 - (spacing * 0.04))
      : Math.min(imageWidth, heading.bbox.x0 + (spacing * 0.9));
    return {
      category: heading.category,
      left: Math.floor(left),
      top: Math.max(0, Math.floor(top)),
      width: Math.max(1, Math.ceil(right - left)),
      height: Math.max(1, Math.ceil(bottom - top)),
    };
  });
}

function gapThreshold(lines) {
  const gaps = lines.slice(1)
    .map((entry, index) => entry.bbox.y0 - lines[index].bbox.y0)
    .filter((gap) => gap > 0);
  if (gaps.length < 2) return 0;

  let low = Math.min(...gaps);
  let high = Math.max(...gaps);
  for (let iteration = 0; iteration < 8; iteration += 1) {
    const lowGroup = [];
    const highGroup = [];
    gaps.forEach((gap) => (Math.abs(gap - low) <= Math.abs(gap - high) ? lowGroup : highGroup).push(gap));
    if (lowGroup.length) low = lowGroup.reduce((sum, value) => sum + value, 0) / lowGroup.length;
    if (highGroup.length) high = highGroup.reduce((sum, value) => sum + value, 0) / highGroup.length;
  }
  if (high - low < Math.max(12, low * 0.18)) return 0;
  return (low + high) / 2;
}

export function groupOcrColumnLines(inputLines = [], category) {
  const headingPattern = CATEGORY_HEADINGS[category];
  const ordered = inputLines
    .filter((entry) => entry?.bbox && (entry.confidence ?? 100) >= 40)
    .map((entry) => ({ ...entry, text: normaliseOcrText(entry.text) }))
    .filter((entry) => entry.text.length >= 3 && /[a-z0-9]/i.test(entry.text))
    .sort((a, b) => a.bbox.y0 - b.bbox.y0);
  const headingIndex = ordered.findIndex((entry) => headingPattern?.test(entry.text));
  if (headingIndex < 0) return [];

  const menuLines = ordered.slice(headingIndex + 1).filter((entry) => !SKIP_LINE.test(entry.text));
  if (!menuLines.length) return [];
  const threshold = gapThreshold(menuLines);
  if (!threshold) return menuLines.map((entry) => entry.text);

  const items = [];
  let current = { title: menuLines[0].text, details: [] };
  for (let index = 1; index < menuLines.length; index += 1) {
    const entry = menuLines[index];
    const gap = entry.bbox.y0 - menuLines[index - 1].bbox.y0;
    if (gap <= threshold) {
      current.details.push(entry.text);
    } else {
      items.push(current);
      current = { title: entry.text, details: [] };
    }
  }
  items.push(current);

  return items.map(({ title, details }) => {
    const description = details.join(' ').replace(/\(£(\d+(?:\.\d+)?)\s+supplement\)/i, '(£$1 supplement)');
    return description ? `${title} — ${description}` : title;
  });
}

export function itemsToEditorText(items = []) {
  return items.map((item) => {
    const description = item.description ? ` — ${item.description}` : '';
    const tags = item.tags?.length ? ` [${item.tags.join(', ')}]` : '';
    return `${item.name}${description}${tags}`;
  }).join('\n');
}

export function editorTextToItems(text, category, previousItems = []) {
  return String(text || '')
    .split('\n')
    .map(cleanLine)
    .filter(Boolean)
    .map((line, index) => {
      const item = makeItem(category, line, index);
      const previous = previousItems.find((candidate) => candidate.name.toLowerCase() === item.name.toLowerCase());
      return previous ? { ...item, id: previous.id } : item;
    });
}
