import {useSyncExternalStore} from 'react';
import type {Series,Request} from './engine/types';
import {tools} from './data/tools';
import {exercises} from './data/exercises';
export interface Saved {id:string;date:string;request:Request;favorite:boolean;}
export interface Attempt {id:string;correct:boolean;date:string;assisted:boolean;}
export interface Exam {ids:string[];answers:Record<string,string>;started:number;duration:number;finished:boolean;score?:number;}
export interface State {version:2;series:Series;theme:'light'|'dark'|'system';size:number;motion:boolean;draft:Request;history:Saved[];read:string[];attempts:Attempt[];statement:string;exam:Exam|null;}
const key='maths-bac-v2';
export function defaultRequest(id='equation'):Request{const t=tools.find(v=>v.id===id)??tools[0];return {operation:t.id,expression:t.expression,params:Object.fromEntries(t.fields.map(f=>[f.key,f.initial]))};}
const initial:State={version:2,series:'D',theme:'light',size:100,motion:true,draft:defaultRequest(),history:[],read:[],attempts:[],statement:'',exam:null};
const series=['A','C','D','L','OSE','S'];
function requestValid(v:any):v is Request{return !!v&&tools.some(t=>t.id===v.operation)&&typeof v.expression==='string'&&v.expression.length<=600&&v.params&&typeof v.params==='object'&&!Array.isArray(v.params)&&Object.values(v.params).every(x=>typeof x==='string'&&x.length<=600);}
export function validateState(raw:unknown):State{
 const v=raw as any;if(!v||v.version!==2||!series.includes(v.series)||!['light','dark','system'].includes(v.theme)||!Number.isFinite(v.size)||v.size<85||v.size>135||typeof v.motion!=='boolean'||!requestValid(v.draft)||typeof v.statement!=='string'||v.statement.length>20000)throw new Error('Ce fichier n’est pas une sauvegarde Maths BAC v2 valide.');
 if(!Array.isArray(v.history)||v.history.length>100||v.history.some((h:any)=>!h||typeof h.id!=='string'||typeof h.date!=='string'||typeof h.favorite!=='boolean'||!requestValid(h.request)))throw new Error('Historique de sauvegarde invalide.');
 if(!Array.isArray(v.read)||v.read.some((x:any)=>typeof x!=='string')||v.read.length>100)throw new Error('Chapitres de sauvegarde invalides.');
 if(!Array.isArray(v.attempts)||v.attempts.length>1000||v.attempts.some((x:any)=>!x||typeof x.id!=='string'||typeof x.date!=='string'||typeof x.correct!=='boolean'||typeof x.assisted!=='boolean'))throw new Error('Progression de sauvegarde invalide.');
 if(v.exam!==null){const e=v.exam;if(!e||!Array.isArray(e.ids)||e.ids.length<1||e.ids.length>30||new Set(e.ids).size!==e.ids.length||e.ids.some((x:any)=>typeof x!=='string'||!exercises.some(ex=>ex.id===x))||!Number.isFinite(e.started)||!Number.isFinite(e.duration)||e.duration<60||e.duration>14400||typeof e.finished!=='boolean'||!e.answers||typeof e.answers!=='object'||Array.isArray(e.answers)||Object.values(e.answers).some(x=>typeof x!=='string'||x.length>600)||(e.score!==undefined&&(!Number.isFinite(e.score)||e.score<0||e.score>e.ids.length)))throw new Error('Session d’entraînement invalide.');}
 return {version:2,series:v.series,theme:v.theme,size:v.size,motion:v.motion,draft:v.draft,history:v.history,read:v.read,attempts:v.attempts,statement:v.statement,exam:v.exam};
}
let state:State=initial;let storageError='';
try{const raw=localStorage.getItem(key);if(raw)state=validateState(JSON.parse(raw));}catch{storageError='La sauvegarde locale n’a pas pu être lue. Tu peux restaurer un fichier depuis les réglages.';}
const listeners=new Set<()=>void>();
export function update(patch:Partial<State>|((s:State)=>Partial<State>)){
 state={...state,...(typeof patch==='function'?patch(state):patch)};
 try{localStorage.setItem(key,JSON.stringify(state));storageError='';}catch{storageError='L’enregistrement local est indisponible. Exporte ton travail avant de fermer l’application.';}
 listeners.forEach(f=>f());
}
export function snapshot(){return state;}
export function useStore(){return useSyncExternalStore(f=>{listeners.add(f);return()=>{listeners.delete(f);};},()=>state);}
export function storageWarning(){return storageError;}
export function remember(request:Request){update(s=>({history:[{id:crypto.randomUUID(),date:new Date().toISOString(),request,favorite:false},...s.history].slice(0,100)}));}
export function restore(raw:string){if(raw.length>3_000_000)throw new Error('Le fichier dépasse la taille maximale.');state=validateState(JSON.parse(raw));update({});}
