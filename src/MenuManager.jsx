import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  FileImage,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { createMenuId, formatEventDate, getClientLink } from './menuData';
import { editorTextToItems, extractTextFromFile, itemsToEditorText, parseMenuText } from './menuImport';

function menuToDraft(menu) {
  return {
    id: menu?.id || '',
    title: menu?.title || '',
    eventDate: menu?.eventDate || '',
    sourceName: menu?.sourceName || '',
    price2: menu?.courseOptions?.[2]?.price ?? 32,
    price3: menu?.courseOptions?.[3]?.price ?? 37,
    startersText: itemsToEditorText(menu?.starters),
    mainsText: itemsToEditorText(menu?.mains),
    dessertsText: itemsToEditorText(menu?.desserts),
  };
}

function sourceTitle(fileName) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      // Some embedded browsers expose Clipboard but block writes. Use the DOM fallback below.
    }
  }
  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
}

export default function MenuManager({ menus, activeMenuId, onActivate, onSave, onDelete }) {
  const [draft, setDraft] = useState(() => menuToDraft(null));
  const [editing, setEditing] = useState(false);
  const [rawText, setRawText] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const beginNew = () => {
    setDraft(menuToDraft(null));
    setRawText('');
    setPreviewUrl('');
    setImportMessage('');
    setNotice('');
    setEditing(true);
  };

  const beginEdit = (menu) => {
    setDraft(menuToDraft(menu));
    setRawText('');
    setPreviewUrl('');
    setImportMessage('');
    setNotice('');
    setEditing(true);
  };

  const importParsedText = (text) => {
    const parsed = parseMenuText(text);
    setDraft((current) => ({
      ...current,
      price2: parsed.courseOptions?.[2]?.price ?? current.price2,
      price3: parsed.courseOptions?.[3]?.price ?? current.price3,
      startersText: itemsToEditorText(parsed.starters),
      mainsText: itemsToEditorText(parsed.mains),
      dessertsText: itemsToEditorText(parsed.desserts),
    }));
    const itemCount = parsed.starters.length + parsed.mains.length + parsed.desserts.length;
    setImportMessage(`Found ${itemCount} menu item${itemCount === 1 ? '' : 's'}. Review the lists before saving.`);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setImporting(true);
    setImportMessage('Preparing import…');
    setNotice('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : '');
    setDraft((current) => ({
      ...current,
      title: current.title || sourceTitle(file.name),
      sourceName: file.name,
    }));

    try {
      const text = await extractTextFromFile(file, setImportMessage);
      if (!text.trim()) throw new Error('No text was found. Try a clearer picture or paste the menu text below.');
      setRawText(text.trim());
      importParsedText(text);
    } catch (error) {
      setImportMessage(error.message || 'The menu could not be read.');
    } finally {
      setImporting(false);
    }
  };

  const saveDraft = () => {
    const title = draft.title.trim();
    const previousMenu = menus.find((menu) => menu.id === draft.id);
    const mains = editorTextToItems(draft.mainsText, 'mains', previousMenu?.mains);
    if (!title) {
      setNotice('Add a name for this menu version.');
      return;
    }
    if (!mains.length) {
      setNotice('Add at least one main course.');
      return;
    }

    const menu = {
      id: draft.id || createMenuId(title),
      title,
      eventDate: draft.eventDate,
      sourceName: draft.sourceName || 'Created in the website',
      courseOptions: {
        2: { label: '2 Courses', price: Number(draft.price2) || 0 },
        3: { label: '3 Courses', price: Number(draft.price3) || 0 },
      },
      starters: editorTextToItems(draft.startersText, 'starters', previousMenu?.starters),
      mains,
      desserts: editorTextToItems(draft.dessertsText, 'desserts', previousMenu?.desserts),
    };
    onSave(menu);
    setDraft(menuToDraft(menu));
    setNotice('Menu version saved. Its client link is ready to share.');
    setEditing(false);
  };

  const copyLink = async (menu) => {
    await copyText(getClientLink(menu));
    setNotice(`Client link copied for “${menu.title}”.`);
  };

  const duplicateMenu = (menu) => {
    setDraft(menuToDraft({ ...menu, id: '', title: `${menu.title} – Copy` }));
    setRawText('');
    setPreviewUrl('');
    setImportMessage('');
    setNotice('Edit the copy, then save it as a new client version.');
    setEditing(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl border border-white/70 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-600 mb-2">Menu studio</p>
            <h2 className="text-3xl font-black text-slate-900">Create client menu versions</h2>
            <p className="text-slate-600 mt-2 max-w-2xl">
              Import a picture, PDF, or text file. Review what was read, save the version, then share its client link.
            </p>
          </div>
          <button type="button" onClick={beginNew} className="px-5 py-3 bg-red-700 text-white rounded-xl font-bold hover:bg-red-800 transition-colors flex items-center justify-center gap-2">
            <Plus size={19} /> New menu
          </button>
        </div>

        {notice && (
          <div className="mx-6 md:mx-8 mt-5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="p-6 md:p-8 grid md:grid-cols-2 gap-4">
          {menus.map((menu) => (
            <article key={menu.id} className={`rounded-2xl border-2 p-5 transition-colors ${menu.id === activeMenuId ? 'border-emerald-600 bg-emerald-50/70' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-xl font-extrabold text-slate-900">{menu.title}</h3>
                    {menu.id === activeMenuId && <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-700 text-white">Active</span>}
                  </div>
                  <p className="text-sm text-slate-600">{formatEventDate(menu.eventDate)}</p>
                  <p className="text-sm text-slate-500 mt-1">{menu.starters.length} starters · {menu.mains.length} mains · {menu.desserts.length} desserts</p>
                  <p className="text-xs text-slate-400 mt-2 truncate max-w-xs">Source: {menu.sourceName}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => onActivate(menu.id)} className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-700">Use version</button>
                <button type="button" onClick={() => copyLink(menu)} className="px-3 py-2 rounded-lg bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 flex items-center justify-center gap-1.5"><Copy size={15} /> Copy client link</button>
                <a href={getClientLink(menu)} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5"><ExternalLink size={15} /> Preview</a>
                <button type="button" onClick={() => beginEdit(menu)} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5"><Pencil size={15} /> Edit</button>
                <button type="button" onClick={() => duplicateMenu(menu)} className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-50 flex items-center justify-center gap-1.5"><Copy size={15} /> Duplicate</button>
                {menus.length > 1 && (
                  <button type="button" onClick={() => onDelete(menu.id)} className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-1.5"><Trash2 size={15} /> Delete</button>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {editing && (
        <section className="bg-white rounded-2xl shadow-2xl border border-white/70 overflow-hidden">
          <div className="p-6 md:p-8 bg-slate-950 text-white flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-amber-300 mb-1">{draft.id ? 'Edit version' : 'New version'}</p>
              <h2 className="text-2xl md:text-3xl font-black">Import and review your menu</h2>
            </div>
            <button type="button" aria-label="Close editor" onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-white/10"><X /></button>
          </div>

          <div className="p-6 md:p-8 space-y-8">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
              <div>
                <div className="w-full min-h-52 rounded-2xl border-2 border-dashed border-red-300 bg-red-50/70 p-7 flex flex-col items-center justify-center text-center">
                  {importing ? <Sparkles size={38} className="text-red-700 animate-pulse mb-4" /> : <Upload size={38} className="text-red-700 mb-4" />}
                  <label htmlFor="menu-file-import" className="text-lg font-extrabold text-slate-900">{importing ? 'Reading your menu' : 'Choose a menu file'}</label>
                  <span className="text-sm text-slate-600 mt-2">Picture (JPG, PNG, WEBP), PDF, or text</span>
                  <input
                    id="menu-file-import"
                    type="file"
                    accept="image/*,.pdf,.txt,.md,.csv"
                    disabled={importing}
                    className="mt-5 block w-full max-w-md cursor-pointer rounded-xl border border-red-200 bg-white text-sm text-slate-700 shadow-sm file:mr-4 file:cursor-pointer file:border-0 file:bg-red-700 file:px-5 file:py-3 file:font-bold file:text-white hover:file:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={async (event) => {
                      const input = event.currentTarget;
                      await handleFile(input.files?.[0]);
                      input.value = '';
                    }}
                  />
                  <span className="mt-2 text-xs text-slate-500">Use the visible file button above. This works in embedded and standard browsers.</span>
                  {importMessage && <span className="mt-4 text-sm font-semibold text-red-800">{importMessage}</span>}
                </div>
              </div>
              <div className="rounded-2xl bg-slate-100 border border-slate-200 min-h-52 overflow-hidden flex items-center justify-center">
                {previewUrl ? <img src={previewUrl} alt="Imported menu preview" className="w-full h-64 object-contain" /> : (
                  <div className="text-center text-slate-500 p-6"><FileImage size={42} className="mx-auto mb-3 opacity-50" /><p className="font-semibold">Picture preview</p><p className="text-sm mt-1">PDF and text imports show their extracted text below.</p></div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-2">Menu version name *</span>
                <input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} className="field" placeholder="e.g. Riverside Hotel Christmas 2026" />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-2">Event date</span>
                <input type="date" value={draft.eventDate} onChange={(event) => updateDraft('eventDate', event.target.value)} className="field" />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-2">2-course price (£)</span>
                <input type="number" min="0" step="0.01" value={draft.price2} onChange={(event) => updateDraft('price2', event.target.value)} className="field" />
              </label>
              <label className="block">
                <span className="block text-sm font-bold text-slate-700 mb-2">3-course price (£)</span>
                <input type="number" min="0" step="0.01" value={draft.price3} onChange={(event) => updateDraft('price3', event.target.value)} className="field" />
              </label>
            </div>

            <details className="rounded-xl border border-slate-200 bg-slate-50 p-4" open={!rawText}>
              <summary className="font-bold text-slate-800 cursor-pointer">Paste or correct menu text</summary>
              <p className="text-sm text-slate-500 mt-2">If your browser cannot access local files, paste the menu text here. Section headings such as Starters, Mains, and Desserts must each be on their own line.</p>
              <textarea value={rawText} onChange={(event) => setRawText(event.target.value)} className="field min-h-52 mt-3 font-mono text-sm" placeholder={'STARTERS\nFirst starter\n\nMAINS\nFirst main\n\nDESSERTS\nFirst dessert'} />
              <button type="button" disabled={!rawText.trim() || importing} onClick={() => importParsedText(rawText)} className="mt-3 px-4 py-2 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">Detect sections</button>
            </details>

            <div>
              <div className="mb-4">
                <h3 className="text-xl font-black text-slate-900">Review menu items</h3>
                <p className="text-sm text-slate-600 mt-1">Use one dish per line. Add its description after an em dash and dietary tags at the end, for example <span className="font-mono">Mushroom tart — garlic sourdough [v, gf]</span>.</p>
              </div>
              <div className="grid lg:grid-cols-3 gap-5">
                {[
                  ['startersText', 'Starters'],
                  ['mainsText', 'Main courses *'],
                  ['dessertsText', 'Desserts'],
                ].map(([field, label]) => (
                  <label key={field} className="block">
                    <span className="block text-sm font-bold text-slate-700 mb-2">{label}</span>
                    <textarea value={draft[field]} onChange={(event) => updateDraft(field, event.target.value)} className="field min-h-72 text-sm leading-relaxed" placeholder={`One ${label.toLowerCase().replace(' *', '')} item per line`} />
                  </label>
                ))}
              </div>
            </div>

            {notice && <p className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-semibold">{notice}</p>}

            <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-200 pt-6">
              <button type="button" onClick={() => setEditing(false)} className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={saveDraft} className="px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-800 flex items-center justify-center gap-2"><Save size={19} /> Save menu version</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
