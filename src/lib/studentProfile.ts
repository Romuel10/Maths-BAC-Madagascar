import type { BacSeries, BacTopic } from '../data/bacSubjects';
import type { LearningQuestion } from '../data/learningCatalog';
import { storageJsonGet, storageJsonSet } from './safeStorage';

const KEY='mathbac_student_profile_v62';

export interface TopicScore { correct:number; total:number; percent:number }
export interface DiagnosticResult { completedAt:string; totalCorrect:number; total:number; byTopic:Partial<Record<BacTopic,TopicScore>> }
export interface QuickSession { id:string; completedAt:string; correct:number; total:number; topics:BacTopic[] }
export interface ChapterProgress { attempts:number; bestPercent:number; completed:boolean; updatedAt:string }
export interface LastActivity { kind:'diagnostic'|'quick'|'chapter'|'solve'|'exam'; label:string; payload?:string; at:string }
export interface AccessibilityPreferences { textScale:'normal'|'large'|'xlarge'; highContrast:boolean; reduceMotion:boolean }

export interface StudentProfile {
 series:BacSeries|null;
 diagnostic:DiagnosticResult|null;
 quickSessions:QuickSession[];
 chapters:Partial<Record<BacTopic,ChapterProgress>>;
 lastActivity:LastActivity|null;
 accessibility:AccessibilityPreferences;
}

function empty():StudentProfile{
 return {series:null,diagnostic:null,quickSessions:[],chapters:{},lastActivity:null,accessibility:{textScale:'normal',highContrast:false,reduceMotion:false}};
}

function validSeries(value:unknown):value is BacSeries{return value==='A'||value==='C'||value==='D'||value==='L'||value==='OSE'||value==='S';}

export function getStudentProfile():StudentProfile{
 const raw=storageJsonGet<Partial<StudentProfile>>(KEY,{});
 const base=empty();
 return {
  series:validSeries(raw.series)?raw.series:null,
  diagnostic:raw.diagnostic&&typeof raw.diagnostic==='object'?raw.diagnostic as DiagnosticResult:null,
  quickSessions:Array.isArray(raw.quickSessions)?raw.quickSessions.slice(0,30):[],
  chapters:raw.chapters&&typeof raw.chapters==='object'?raw.chapters:{},
  lastActivity:raw.lastActivity&&typeof raw.lastActivity==='object'?raw.lastActivity as LastActivity:null,
  accessibility:{...base.accessibility,...(raw.accessibility&&typeof raw.accessibility==='object'?raw.accessibility:{})},
 };
}

function save(profile:StudentProfile){
 if(storageJsonSet(KEY,profile))window.dispatchEvent(new CustomEvent('mathbac-student-profile'));
}

export function setStudentSeries(series:BacSeries){const profile=getStudentProfile();profile.series=series;profile.diagnostic=null;save(profile);}

export function saveDiagnostic(questions:LearningQuestion[],answers:Record<string,number>):DiagnosticResult{
 const byTopic:Partial<Record<BacTopic,TopicScore>>={};let totalCorrect=0;
 for(const question of questions){
  const correct=answers[question.id]===question.correctIndex; if(correct)totalCorrect++;
  const score=byTopic[question.topic]||{correct:0,total:0,percent:0};score.total++;if(correct)score.correct++;score.percent=Math.round(score.correct/score.total*100);byTopic[question.topic]=score;
 }
 const result={completedAt:new Date().toISOString(),totalCorrect,total:questions.length,byTopic};
 const profile=getStudentProfile();profile.diagnostic=result;profile.lastActivity={kind:'diagnostic',label:'Diagnostic BAC terminé',at:result.completedAt};save(profile);return result;
}

export function saveQuickSession(questions:LearningQuestion[],answers:Record<string,number>):QuickSession{
 const correct=questions.filter(question=>answers[question.id]===question.correctIndex).length;
 const session={id:`${Date.now()}`,completedAt:new Date().toISOString(),correct,total:questions.length,topics:[...new Set(questions.map(question=>question.topic))]};
 const profile=getStudentProfile();profile.quickSessions.unshift(session);profile.quickSessions=profile.quickSessions.slice(0,30);profile.lastActivity={kind:'quick',label:`Révision rapide · ${correct}/${questions.length}`,at:session.completedAt};save(profile);return session;
}

export function saveChapterResult(topic:BacTopic,percent:number){
 const profile=getStudentProfile();const current=profile.chapters[topic];
 profile.chapters[topic]={attempts:(current?.attempts||0)+1,bestPercent:Math.max(current?.bestPercent||0,percent),completed:Boolean(current?.completed||percent>=70),updatedAt:new Date().toISOString()};
 profile.lastActivity={kind:'chapter',label:`Parcours ${topic} · ${percent}%`,payload:topic,at:new Date().toISOString()};save(profile);
}

export function setLastActivity(activity:Omit<LastActivity,'at'>){const profile=getStudentProfile();profile.lastActivity={...activity,at:new Date().toISOString()};save(profile);}

export function saveAccessibility(accessibility:AccessibilityPreferences){const profile=getStudentProfile();profile.accessibility=accessibility;save(profile);}

export function weakTopics(profile=getStudentProfile()):BacTopic[]{
 if(!profile.diagnostic)return[];
 return (Object.entries(profile.diagnostic.byTopic) as Array<[BacTopic,TopicScore]>).sort((a,b)=>a[1].percent-b[1].percent).map(([topic])=>topic);
}
