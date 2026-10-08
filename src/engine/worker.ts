import {solve,compareAnswer} from './index';
import type {Request,Reply} from './types';
self.onmessage=(event:MessageEvent<{id:number;request?:Request;answer?:string;expected?:string}>)=>{
 const {id,request,answer,expected}=event.data;
 try{if(request)self.postMessage({id,result:solve(request)} satisfies Reply);else self.postMessage({id,correct:compareAnswer(answer??'',expected??'')});}
 catch(e){self.postMessage({id,error:e instanceof Error?e.message:'Le calcul n’a pas abouti. Vérifie la saisie.'} satisfies Reply);}
};
