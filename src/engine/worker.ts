import {solve,compareAnswer} from './index';
import type {Request,Reply} from './types';
import {inputTex} from './expression';
import {withoutFunctionLabel} from './notation';
self.onmessage=(event:MessageEvent<{id:number;request?:Request;answer?:string;expected?:string;previewExpression?:string}>)=>{
 const {id,request,answer,expected,previewExpression}=event.data;
 if(previewExpression!==undefined){
  try{const raw=withoutFunctionLabel(previewExpression),parts=raw.split(/(<=|>=|[=<>≤≥])/);if(parts.length>3)throw new Error('Traite une seule relation à la fois.');const latex=parts.length===3?inputTex(parts[0])+({'<=':'\\le','>=':'\\ge','≤':'\\le','≥':'\\ge'}[parts[1]]??parts[1])+inputTex(parts[2]):inputTex(raw);self.postMessage({id,preview:{latex}});}
  catch(e){self.postMessage({id,preview:{hint:e instanceof Error?e.message:'Complète la formule.'}});}return;
 }
 try{if(request)self.postMessage({id,result:solve(request)} satisfies Reply);else self.postMessage({id,correct:compareAnswer(answer??'',expected??'')});}
 catch(e){self.postMessage({id,error:e instanceof Error?e.message:'Le calcul n’a pas abouti. Vérifie la saisie.'} satisfies Reply);}
};
