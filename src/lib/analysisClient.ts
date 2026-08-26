import type { AnalysisResult } from './mathEngine';

interface WorkerReply { id:number; result?:AnalysisResult; error?:string }
type Pending = { resolve:(value:AnalysisResult)=>void; reject:(reason:Error)=>void; timer:number };

class WorkerInfrastructureError extends Error {
 constructor(message:string,readonly allowMainThreadFallback=true){super(message);}
}

const WORKER_TIMEOUT_MS=20000;

let worker:Worker|null=null;
let workerUnavailable=false;
let nextId=1;
const pending=new Map<number,Pending>();

function stopWorker(reason:string,allowMainThreadFallback=true,disableWorker=true){
 const failure=new WorkerInfrastructureError(reason,allowMainThreadFallback);
 for(const item of pending.values()){
  window.clearTimeout(item.timer);
  item.reject(failure);
 }
 pending.clear();
 worker?.terminate();
 worker=null;
 workerUnavailable=disableWorker;
}

function getWorker():Worker|null{
 if(typeof Worker==='undefined'||workerUnavailable)return null;
 if(worker)return worker;
 try{
  worker=new Worker(new URL('../workers/analysis.worker.ts',import.meta.url),{type:'module'});
 }catch{
  workerUnavailable=true;
  return null;
 }
 worker.addEventListener('message',(event:MessageEvent<WorkerReply>)=>{
  const item=pending.get(event.data.id);if(!item)return;
  pending.delete(event.data.id);
  window.clearTimeout(item.timer);
  if(event.data.error)item.reject(new Error(event.data.error));
  else if(event.data.result)item.resolve(event.data.result);
  else item.reject(new Error('Réponse incomplète du moteur de calcul.'));
 });
 worker.addEventListener('error',()=>stopWorker('Le calcul parallèle a été interrompu.'));
 worker.addEventListener('messageerror',()=>stopWorker('Le résultat du calcul parallèle est illisible.'));
 return worker;
}

async function analyzeOnMainThread(expression:string,xMin:number,xMax:number):Promise<AnalysisResult>{
 const {analyzeFunction}=await import('./mathEngine');
 return analyzeFunction(expression,xMin,xMax);
}

export async function analyzeFunctionAsync(expression:string,xMin=-10,xMax=10):Promise<AnalysisResult>{
 const active=getWorker();
 if(!active)return analyzeOnMainThread(expression,xMin,xMax);
 try{
  return await new Promise((resolve,reject)=>{
   const id=nextId++;
   const timer=window.setTimeout(()=>stopWorker('Le calcul parallèle ne répond pas.',false,false),WORKER_TIMEOUT_MS);
   pending.set(id,{resolve,reject,timer});
   try{active.postMessage({id,expression,xMin,xMax});}
   catch{
    stopWorker('Impossible de démarrer le calcul parallèle.');
   }
  });
 }catch(error:unknown){
  if(error instanceof WorkerInfrastructureError){
   if(error.allowMainThreadFallback)return analyzeOnMainThread(expression,xMin,xMax);
   throw new Error('Analyse interrompue après 20 secondes. Réessaie avec un intervalle plus court ou une expression plus simple.');
  }
  throw error;
 }
}
