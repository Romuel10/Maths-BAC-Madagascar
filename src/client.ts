import type {Request,Result,Reply,Plot} from './engine/types';
let worker:Worker|undefined;let next=0;
const pending=new Map<number,{resolve:(v:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
function stop(message:string){worker?.terminate();worker=undefined;for(const job of pending.values()){clearTimeout(job.timer);job.reject(new Error(message));}pending.clear();}
function start(){
 if(worker)return worker;
 worker=new Worker(new URL('./engine/worker.ts',import.meta.url),{type:'module'});
 worker.onmessage=(e:MessageEvent<Reply&{correct?:boolean;preview?:{latex?:string;hint?:string};plot?:object;point?:object}>)=>{const p=pending.get(e.data.id);if(!p)return;clearTimeout(p.timer);pending.delete(e.data.id);e.data.error?p.reject(new Error(e.data.error)):p.resolve(e.data.result??e.data.preview??e.data.plot??e.data.point??e.data.correct);};
 worker.onerror=()=>stop('Le moteur a été relancé après une erreur. Essaie un calcul plus court.');
 return worker;
}
function send<T>(payload:object):Promise<T>{
 return new Promise((resolve,reject)=>{const id=++next;const w=start();const timer=setTimeout(()=>stop('Le calcul dépasse le temps disponible. Simplifie l’expression ou traite une partie à la fois.'),12000);pending.set(id,{resolve,reject,timer});w.postMessage({id,...payload});});
}
export const compute=(request:Request)=>send<Result>({request});
export const previewInput=(expression:string)=>send<{latex?:string;hint?:string}>({previewExpression:expression});
export const checkAnswer=(answer:string,expected:string)=>send<boolean>({answer,expected});
export const cancelCalculation=()=>stop('Calcul annulé.');
export const redrawPlot=(plot:Plot,xmin:number,xmax:number)=>send<Pick<Plot,'expression'|'derivative'|'points'|'xmin'|'xmax'|'breaks'|'yRange'>>({plotRequest:{expression:plot.expression,derivative:plot.derivative,xmin,xmax,breaks:plot.breaks}});
export const readPlotPoint=(plot:Plot,x:number)=>send<{x:number;y:number|null;slope:number|null}>({pointRequest:{expression:plot.expression,derivative:plot.derivative,x}});
