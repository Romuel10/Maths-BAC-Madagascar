import { storageJsonGet, storageJsonSet } from './safeStorage.js';
import type { SolverTopic } from './solverIntent.js';
import type { TutorExplanationLevel } from './tutorCoach.js';
export interface TutorDraft {
 statement:string; functionExpr:string; workspace:'statement'|'function'|'verify'|'method'; topic:SolverTopic;
 showGuide:boolean; helpMode:'understand'|'start'|'plan'; previousStep:string; nextStep:string;
 blockedStep:number; hintLevel:number; explanationLevel:TutorExplanationLevel;
 revealedResolutionSteps:number; showResolutionAnswer:boolean;
}
const KEY='mathbac_tutor_draft_v102';
export function getTutorDraft():TutorDraft|null {
 const value=storageJsonGet<Partial<TutorDraft>|null>(KEY,null);
 if(!value||typeof value.statement!=='string'||typeof value.functionExpr!=='string')return null;
 const workspace=['statement','function','verify','method'].includes(value.workspace||'')?value.workspace!:'statement';
 const topic=['Analyse','Algèbre','Complexes','Probabilités','Suites','Géométrie','Arithmétique','Finance','Général'].includes(value.topic||'')?value.topic!:'Général';
 const count=(n:unknown,max:number)=>typeof n==='number'&&Number.isInteger(n)?Math.max(0,Math.min(max,n)):0;
 return {statement:value.statement.slice(0,10000),functionExpr:value.functionExpr.slice(0,10000),workspace,topic,
  showGuide:value.showGuide===true,helpMode:value.helpMode==='start'||value.helpMode==='plan'?value.helpMode:'understand',
  previousStep:typeof value.previousStep==='string'?value.previousStep.slice(0,10000):'',nextStep:typeof value.nextStep==='string'?value.nextStep.slice(0,10000):'',
  blockedStep:count(value.blockedStep,100),hintLevel:count(value.hintLevel,10),explanationLevel:value.explanationLevel==='detail'||value.explanationLevel==='bac'?value.explanationLevel:'simple',
  revealedResolutionSteps:count(value.revealedResolutionSteps,100),showResolutionAnswer:value.showResolutionAnswer===true};
}
export function saveTutorDraft(draft:TutorDraft):boolean{return storageJsonSet(KEY,draft);}
