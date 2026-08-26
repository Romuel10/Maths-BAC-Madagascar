import { analyzeFunction } from '../lib/mathEngine';

interface AnalysisRequest { id:number; expression:string; xMin:number; xMax:number }

self.addEventListener('message',(event:MessageEvent<AnalysisRequest>)=>{
 const {id,expression,xMin,xMax}=event.data;
 try{
  self.postMessage({id,result:analyzeFunction(expression,xMin,xMax)});
 }catch(error:unknown){
  self.postMessage({id,error:error instanceof Error?error.message:'Erreur pendant l’analyse'});
 }
});

export {};
