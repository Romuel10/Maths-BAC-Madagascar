import type { BacSeries } from '../data/bacSubjects';

const KEY = 'mathbac_mg_local_annales_v37';

export interface LocalAnnaleQuestion {
 id: string;
 number: string;
 prompt: string;
 expected?: string;
 correctionSteps: string[];
}

export interface LocalAnnale {
 id: string;
 title: string;
 series: BacSeries;
 year: number;
 sourceNote: string;
 questions: LocalAnnaleQuestion[];
 createdAt: string;
}

export function getLocalAnnales(): LocalAnnale[] {
 try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
}

function save(items: LocalAnnale[]) {
 localStorage.setItem(KEY, JSON.stringify(items));
 window.dispatchEvent(new CustomEvent('mathbac-local-annales'));
}

export function addLocalAnnale(input: Omit<LocalAnnale, 'id' | 'createdAt'>): LocalAnnale {
 const item: LocalAnnale = { ...input, id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, createdAt: new Date().toISOString() };
 save([item, ...getLocalAnnales()]);
 return item;
}

export function removeLocalAnnale(id: string) { save(getLocalAnnales().filter(a => a.id !== id)); }

export function exportLocalAnnales(): string { return JSON.stringify({ format: 'maths-bac-madagascar-annales-v1', annales: getLocalAnnales() }, null, 2); }

export function importLocalAnnales(raw: string): { imported: number; error?: string } {
 try {
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : parsed?.annales;
  if (!Array.isArray(list)) return { imported: 0, error: 'Format JSON non reconnu.' };
  const valid: LocalAnnale[] = list.filter((a: any) => a && ['A','C','D'].includes(a.series) && typeof a.title === 'string' && Array.isArray(a.questions)).map((a: any) => ({
   id: typeof a.id === 'string' ? a.id : `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
   title: a.title,
   series: a.series,
   year: Number(a.year) || new Date().getFullYear(),
   sourceNote: typeof a.sourceNote === 'string' ? a.sourceNote : 'Import local à vérifier',
   createdAt: typeof a.createdAt === 'string' ? a.createdAt : new Date().toISOString(),
   questions: a.questions.map((q: any, i: number) => ({ id: String(q.id || `q-${i+1}`), number: String(q.number || i+1), prompt: String(q.prompt || ''), expected: typeof q.expected === 'string' ? q.expected : undefined, correctionSteps: Array.isArray(q.correctionSteps) ? q.correctionSteps.map(String) : [] })).filter((q: LocalAnnaleQuestion) => q.prompt.trim())
  }));
  const current = getLocalAnnales(); const byId = new Map(current.map(a => [a.id, a]));
  valid.forEach(a => byId.set(a.id, a)); save([...byId.values()]);
  return { imported: valid.length };
 } catch { return { imported: 0, error: 'JSON invalide.' }; }
}
