import { isBacSeries, type BacSeries } from '../data/bacSubjects.js';
import { storageGet, storageJsonSet } from './safeStorage.js';

const KEY = 'mathbac_mg_local_annales_v60';
const LEGACY_KEY = 'mathbac_mg_local_annales_v37';
const MAX_IMPORT_BYTES = 1_000_000;
const MAX_ANNALES = 100;
const MAX_QUESTIONS = 100;

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

function record(value:unknown):Record<string,unknown>|null {
 return typeof value==='object'&&value!==null&&!Array.isArray(value)?value as Record<string,unknown>:null;
}

function cleanText(value:unknown,max:number):string {
 return typeof value==='string'?value.trim().slice(0,max):'';
}

function cleanId(value:unknown,fallback:string):string {
 const id=cleanText(value,120).replace(/[^a-zA-Z0-9_-]/g,'-');
 return id||fallback;
}

function normalizeQuestion(value:unknown,index:number):LocalAnnaleQuestion|null {
 const item=record(value);if(!item)return null;
 const prompt=cleanText(item.prompt,10_000);if(!prompt)return null;
 const expected=cleanText(item.expected,5_000);
 const rawSteps=Array.isArray(item.correctionSteps)?item.correctionSteps.slice(0,100):[];
 return {
  id:cleanId(item.id,`q-${index+1}`),
  number:cleanText(item.number,40)||String(index+1),
  prompt,
  expected:expected||undefined,
  correctionSteps:rawSteps.map(step=>cleanText(step,5_000)).filter(Boolean)
 };
}

function normalizeAnnale(value:unknown,index:number):LocalAnnale|null {
 const item=record(value);if(!item)return null;
 const title=cleanText(item.title,200);
 const series=item.series;
 if(!title||!isBacSeries(series)||!Array.isArray(item.questions))return null;
 const questions=item.questions.slice(0,MAX_QUESTIONS).map(normalizeQuestion).filter((q):q is LocalAnnaleQuestion=>q!==null);
 if(!questions.length)return null;
 const suppliedYear=typeof item.year==='number'?item.year:Number(item.year);
 const year=Number.isInteger(suppliedYear)&&suppliedYear>=1900&&suppliedYear<=2100?suppliedYear:new Date().getFullYear();
 const createdAt=cleanText(item.createdAt,80);
 return {
  id:cleanId(item.id,`local-${Date.now()}-${index}`),
  title,
  series,
  year,
  sourceNote:cleanText(item.sourceNote,500)||'Import local à vérifier avec le document source.',
  questions,
  createdAt:createdAt&&!Number.isNaN(Date.parse(createdAt))?createdAt:new Date().toISOString()
 };
}

function parseStored(raw:string|null):LocalAnnale[] {
 if(!raw)return [];
 try {
  const value:unknown=JSON.parse(raw);
  if(!Array.isArray(value))return [];
  return value.slice(0,MAX_ANNALES).map(normalizeAnnale).filter((item):item is LocalAnnale=>item!==null);
 } catch { return []; }
}

export function getLocalAnnales(): LocalAnnale[] {
 const current=storageGet(KEY);
 if(current)return parseStored(current);
 return parseStored(storageGet(LEGACY_KEY));
}

function save(items: LocalAnnale[]):boolean {
 const ok=storageJsonSet(KEY,items.slice(0,MAX_ANNALES));
 if(ok)window.dispatchEvent(new CustomEvent('mathbac-local-annales'));
 return ok;
}

export function addLocalAnnale(input: Omit<LocalAnnale, 'id' | 'createdAt'>): LocalAnnale {
 const normalized=normalizeAnnale({...input,id:`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,createdAt:new Date().toISOString()},0);
 if(!normalized)throw new Error('Le contenu de l’annale est incomplet ou trop long.');
 if(!save([normalized,...getLocalAnnales()]))throw new Error('Stockage local indisponible : l’annale n’a pas été enregistrée.');
 return normalized;
}

export function removeLocalAnnale(id: string):boolean {
 return save(getLocalAnnales().filter(item=>item.id!==id));
}

export function exportLocalAnnales(): string {
 return JSON.stringify({ format: 'maths-bac-madagascar-annales-v2', exportedAt:new Date().toISOString(), annales: getLocalAnnales() }, null, 2);
}

export function importLocalAnnales(raw: string): { imported: number; error?: string } {
 if(new Blob([raw]).size>MAX_IMPORT_BYTES)return{imported:0,error:'Import refusé : le fichier dépasse 1 Mo.'};
 try {
  const parsed:unknown=JSON.parse(raw);
  const root=record(parsed);
  const list=Array.isArray(parsed)?parsed:root?.annales;
  if(!Array.isArray(list))return{imported:0,error:'Format JSON non reconnu.'};
  if(list.length>MAX_ANNALES)return{imported:0,error:`Import refusé : maximum ${MAX_ANNALES} annales par fichier.`};
  const valid=list.map(normalizeAnnale).filter((item):item is LocalAnnale=>item!==null);
  if(!valid.length)return{imported:0,error:'Aucune annale valide : vérifie la série, le titre et les questions.'};
  const byId=new Map(getLocalAnnales().map(item=>[item.id,item]));
  valid.forEach(item=>byId.set(item.id,item));
  const merged=[...byId.values()].slice(0,MAX_ANNALES);
  if(!save(merged))return{imported:0,error:'Stockage local indisponible : aucune donnée n’a été enregistrée.'};
  return { imported: valid.length };
 } catch { return { imported: 0, error: 'JSON invalide.' }; }
}
