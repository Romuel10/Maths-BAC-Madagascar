import {expression,onlyVariables,asReal,exact,tex,checkConstantDomain} from './expression';
import type {Result,Step} from './types';
export function value(raw:string):string {
 const s=expression(raw);onlyVariables(s,[]);
 if(!checkConstantDomain(s)||!Number.isFinite(asReal(s)))throw new Error('Saisis un nombre réel fini ; vérifie les racines, logarithmes et dénominateurs.');
 return exact(s);
}
export function integer(n:number,min:number,max:number,label:string){if(!Number.isSafeInteger(n)||n<min||n>max)throw new Error(label+' doit être un entier de '+min+' à '+max+'.');}
export function result(title:string,latex:string,steps:Step[],extra:Partial<Result>={}):Result{return {title,latex,steps,notes:[],...extra};}
export function readRows(raw:string):string[][] {
 const lines=raw.trim().split(/\n+/);if(!raw.trim()||lines.length>200)throw new Error('Renseigne de 1 à 200 lignes de données.');
 return lines.map(row=>(row.includes(';')?row.split(';'):row.trim().split(/\s+/)).map(v=>value(v.trim())));
}
export function comb(n:number,k:number):string {if(k<0||k>n)return '0';let v=1n;for(let i=1;i<=Math.min(k,n-k);i++)v=v*BigInt(n-i+1)/BigInt(i);return String(v);}
export function matrixTex(rows:string[][]):string{return '\\begin{pmatrix}'+rows.map(r=>r.map(tex).join('&')).join('\\\\')+'\\end{pmatrix}';}
export function gaussian(input:string[][],columns:number):{rows:string[][];pivots:number[];det:string}{
 const a=input.map(r=>[...r]),pivots:number[]=[];let at=0,det='1';
 for(let col=0;col<columns&&at<a.length;col++){
  const found=a.findIndex((r,i)=>i>=at&&exact(r[col])!=='0');if(found<0){det='0';continue;}
  if(found!==at){[a[found],a[at]]=[a[at],a[found]];det=exact('-('+det+')');}
  const pivot=a[at][col];det=exact('('+det+')*('+pivot+')');a[at]=a[at].map(v=>exact('('+v+')/('+pivot+')'));
  for(let row=0;row<a.length;row++){if(row===at)continue;const scale=a[row][col];a[row]=a[row].map((v,j)=>exact('('+v+')-('+scale+')*('+a[at][j]+')'));}
  pivots.push(col);at++;
 }
 return {rows:a,pivots,det:pivots.length<columns?'0':det};
}
