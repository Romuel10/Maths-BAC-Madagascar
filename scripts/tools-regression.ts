declare const process: { exit(code?: number): never };
import { solveEquation, computeIntegral, analyzeSequence, analyzeFunction } from '../src/lib/mathEngine.js';
import { solveInequalityVerified } from '../src/lib/inequalityEngine.js';
import { computeCalculator } from '../src/lib/calculatorEngine.js';
import { checkAnswer } from '../src/lib/bacAnswer.js';
import { analyzeStudentRequest, detectSolverTopic } from '../src/lib/solverIntent.js';
import { LEARNING_CHAPTERS, LEARNING_QUESTIONS, diagnosticQuestions } from '../src/data/learningCatalog.js';
import { BAC_SUBJECTS, flattenQuestions } from '../src/data/bacSubjects.js';

let checks=0,failures=0;
const near=(a:number,b:number,t=1e-7)=>Number.isFinite(a)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));
function ok(v:boolean,label:string){checks++; if(!v){failures++; console.error('FAIL',label);}}

const eq=solveEquation('x^2-5*x+6',0,-10,10);
ok(eq.exact&&eq.quality==='verified'&&eq.solutions.length===2&&near(eq.solutions[0],2)&&near(eq.solutions[1],3),'équation quadratique exacte');
const eqRat=solveEquation('1/(x-2)',0,-10,10);
ok(eqRat.exact&&eqRat.quality==='verified'&&eqRat.solutions.length===0,'équation rationnelle : absence de solution prouvée sans faux zéro');

const iq=solveInequalityVerified('x^2-3*x+2','<=',0,-10,10);
ok(iq.exact&&iq.quality==='verified'&&iq.solutionSet.includes('1')&&iq.solutionSet.includes('2'),'inéquation quadratique exacte');
const iqGen=solveInequalityVerified('sin(x)','>',0,-6,6);
ok(iqGen.exact===false&&iqGen.scope==='window'&&iqGen.proof==='numeric'&&iqGen.quality!=='verified'&&!!iqGen.warning&&iqGen.searchInterval[0]===-6&&iqGen.searchInterval[1]===6,'inéquation transcendante explicitement limitée à la fenêtre');

const intPoly=computeIntegral('x^2',0,2);
ok(intPoly.exact===true&&intPoly.quality==='verified'&&near(intPoly.value,8/3,2e-7),'intégrale polynomiale exacte et contrôlée');
const intSin=computeIntegral('sin(x)',0,Math.PI);
ok(intSin.exact===true&&intSin.quality==='verified'&&near(intSin.value,2,2e-7),'intégrale sinus contrôlée');
const intBad=computeIntegral('1/x',-1,1);
ok(intBad.quality==='warning'&&!Number.isFinite(intBad.value),'intégrale impropre interrompue');

const seq=analyzeSequence('0.5*x+1',10,'recursive',30);
ok(seq.quality.level==='verified'&&seq.convergence.converges&&near(seq.convergence.limit!,2)&&seq.behavior==='decreasing','suite affine convergente démontrée');
const seqPoly=analyzeSequence('n^2',0,'explicit',30);
ok(seqPoly.quality.level==='verified'&&!seqPoly.convergence.converges&&seqPoly.behavior==='unknown','suite n² : pas de fausse monotonie prouvée');
const seqObs=analyzeSequence('sin(n)',0,'explicit',30);
ok(seqObs.quality.level==='approximate'&&!seqObs.convergence.converges&&seqObs.behavior==='unknown','suite générale : observation seulement');

const calc=computeCalculator('(3+5)*2','rad');
ok(calc.decimalValue==='16'&&calc.quality.level==='verified','calculatrice arithmétique haute précision');
const trig=computeCalculator('sin(30)','deg');
ok(near(Number(trig.rawValue),0.5,1e-10),'calculatrice mode degrés');
const nestedTrig=computeCalculator('sin(sin(30))','deg');
ok(near(Number(nestedTrig.rawValue),Math.sin((Math.sin(Math.PI/6)*Math.PI)/180),1e-10),'calculatrice degrés imbriqués');

const rat=analyzeFunction('(x^2-1)/(x-2)',-10,10);
const pos=rat.limits.find(l=>l.point==='+∞');
const left=rat.limits.find(l=>l.point==='2'&&l.direction==='⁻');
const right=rat.limits.find(l=>l.point==='2'&&l.direction==='⁺');
ok(pos?.value==='+∞','limite rationnelle à +∞ exacte');
ok(left?.value==='-∞'&&right?.value==='+∞','limites latérales rationnelles exactes');
const removable=analyzeFunction('(x^2-4)/(x-2)',-10,10);
const remL=removable.limits.find(l=>l.point==='2'&&l.direction==='⁻');
const remR=removable.limits.find(l=>l.point==='2'&&l.direction==='⁺');
ok(remL?.value==='4'&&remR?.value==='4','limite de discontinuité amovible');

const tangent=analyzeFunction('tan(x)',-10,10);
ok(tangent.domain.proven&&tangent.domain.type==='restricted'&&tangent.domain.description.includes('k ∈ ℤ')&&tangent.domain.excludedPoints.length===6,'domaine exact de tan(x), pôles sur la fenêtre');
const squareRootPower=analyzeFunction('x^0.5',-10,10);
ok(squareRootPower.domain.proven&&squareRootPower.domain.description==='[0 ; +∞['&&squareRootPower.domain.excludedPoints.length===0,'domaine réel de x^0.5');
let invalidRangeRejected=false;
try{analyzeFunction('x^2',10,-10);}catch(error){invalidRangeRejected=error instanceof Error&&error.message.includes('Intervalle invalide');}
ok(invalidRangeRejected,'analyse de fonction : intervalle inversé refusé clairement');

const boundaryWord=checkAnswer('11',{kind:'text',allOf:['1']});
ok(!boundaryWord.correct&&boundaryWord.scoreRatio===0,'réponse rédigée : un nombre inclus dans un autre ne valide pas le mot-clé');
const partialText=checkAnswer('croissante',{kind:'text',allOf:['croissante','sur R']});
ok(!partialText.correct&&near(partialText.scoreRatio,.5),'réponse rédigée : crédit partiel proportionnel aux éléments essentiels');

const functionIntent=analyzeStudentRequest('On considère f(x)=x²−4x+3. Étudier ses variations et calculer sa dérivée.');
ok(functionIntent.topic==='Analyse'&&functionIntent.goal==='study'&&functionIntent.functionExpression==='x²−4x+3','assistant Résoudre : détecte une étude de fonction et extrait son expression');
ok(functionIntent.givens.some(item=>item.includes('f(x)'))&&functionIntent.suggestedSteps.length===4,'assistant Résoudre : décompose les données et propose un plan');
const proofIntent=analyzeStudentRequest('Démontrer que les droites (AB) et (CD) sont orthogonales.');
ok(proofIntent.topic==='Géométrie'&&proofIntent.goal==='prove'&&proofIntent.functionExpression===null,'assistant Résoudre : distingue une démonstration géométrique');
ok(detectSolverTopic('Calculer le PGCD de 252 et 198 avec Euclide.')==='Arithmétique','assistant Résoudre : reconnaît l’arithmétique avec accents');
const equationIntent=analyzeStudentRequest('Résoudre dans R l’équation x²-5x+6=0.');
ok(equationIntent.topic==='Algèbre'&&equationIntent.goal==='solve','assistant Résoudre : reconnaît une équation algébrique');
ok(equationIntent.unknown.includes('solutions')&&equationIntent.question.includes('Résoudre'),'assistant Résoudre : identifie l’inconnue et la question');

ok(LEARNING_CHAPTERS.length===8&&new Set(LEARNING_CHAPTERS.map(chapter=>chapter.topic)).size===8,'catalogue adaptatif : huit chapitres uniques');
ok(LEARNING_CHAPTERS.every(chapter=>chapter.objectives.length>=2&&chapter.method.length>=3&&chapter.formulas.length>=1),'catalogue adaptatif : chaque parcours contient objectifs, méthode et formules');
ok(LEARNING_CHAPTERS.every(chapter=>chapter.definitions.length>=3&&chapter.lessonSections.length>=4&&chapter.pitfalls.length>=4&&chapter.workedExamples.length>=2),'cours enrichis : définitions, quatre sections, pièges et exemples corrigés par chapitre');
ok(LEARNING_CHAPTERS.reduce((total,chapter)=>total+chapter.formulas.length,0)>=50,'formulaire enrichi : au moins cinquante formules expliquées');
ok(LEARNING_CHAPTERS.reduce((total,chapter)=>total+chapter.lessonSections.length,0)>=32,'leçons enrichies : au moins trente-deux sections structurées');
ok(new Set(LEARNING_CHAPTERS.flatMap(chapter=>chapter.formulas.map(formula=>formula.id))).size===LEARNING_CHAPTERS.flatMap(chapter=>chapter.formulas).length,'formulaire intelligent : identifiants uniques');
ok(LEARNING_QUESTIONS.length>=56,'exercices de chapitre : au moins cinquante-six questions corrigées');
ok(LEARNING_QUESTIONS.every(question=>question.correctIndex>=0&&question.correctIndex<question.choices.length),'quiz adaptatifs : toutes les réponses attendues sont valides');
ok(LEARNING_CHAPTERS.every(chapter=>LEARNING_QUESTIONS.filter(question=>question.topic===chapter.topic).length>=7),'exercices de chapitre : au moins sept questions par thème');
ok(diagnosticQuestions('A').every(question=>question.series.includes('A'))&&diagnosticQuestions('C').every(question=>question.series.includes('C'))&&diagnosticQuestions('D').every(question=>question.series.includes('D')),'diagnostic : filtrage correct par série');
ok(diagnosticQuestions('A').length>=6&&diagnosticQuestions('C').length>=6&&diagnosticQuestions('D').length>=6,'diagnostic : couverture minimale de chaque série');

const subjectQuestions=BAC_SUBJECTS.flatMap(subject=>flattenQuestions(subject));
ok(BAC_SUBJECTS.length>=6&&(['A','C','D'] as const).every(series=>BAC_SUBJECTS.filter(subject=>subject.series===series).length>=2),'sujets guidés : deux entraînements au moins pour chaque série A, C et D');
ok(subjectQuestions.length>=36,'sujets guidés : au moins trente-six questions entièrement accompagnées');
ok(new Set(BAC_SUBJECTS.map(subject=>subject.id)).size===BAC_SUBJECTS.length,'sujets guidés : identifiants de sujets uniques');
ok(new Set(subjectQuestions.map(question=>question.id)).size===subjectQuestions.length,'sujets guidés : identifiants de questions uniques');
ok(subjectQuestions.every(question=>question.hints.length>=1&&question.method.length>=1&&question.finalAnswer.trim().length>0),'sujets guidés : chaque question possède indice, méthode et réponse finale');

console.log(`Math tools audit: ${checks} checks, ${failures} failure(s)`);
if(failures) process.exit(1);
