import { DETAILED_LESSONS } from '../src/data/detailedLessons.js';

const entries=Object.entries(DETAILED_LESSONS);
if(entries.length!==9)throw new Error(`9 chapitres détaillés attendus, reçu ${entries.length}`);
let blocks=0,examples=0;
for(const [topic,lessons] of entries){
 if(lessons.length<5)throw new Error(`${topic}: au moins 5 parties détaillées attendues`);
 for(const lesson of lessons){
  blocks++;
  if(lesson.explanation.trim().length<120)throw new Error(`${topic}/${lesson.title}: explication trop courte`);
  if(lesson.method.length<4||lesson.method.some(step=>step.trim().length<8))throw new Error(`${topic}/${lesson.title}: méthode insuffisante`);
  if(!lesson.example.statement.trim()||lesson.example.steps.length<3||!lesson.example.answer.trim())throw new Error(`${topic}/${lesson.title}: exemple corrigé incomplet`);
  if(lesson.bacTip.trim().length<30)throw new Error(`${topic}/${lesson.title}: conseil BAC insuffisant`);
  examples++;
 }
}
console.log(`Detailed lessons regression: ${blocks} parties, ${examples} exemples guidés validés.`);
