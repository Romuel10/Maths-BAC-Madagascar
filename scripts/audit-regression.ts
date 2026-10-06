import assert from 'node:assert/strict';
import { addLocalAnnale, getLocalAnnales, exportLocalAnnales, importLocalAnnales } from '../src/lib/localAnnales.js';
import { getTutorDraft, saveTutorDraft } from '../src/lib/tutorDraft.js';
import { analyzeFunction } from '../src/lib/mathEngine.js';
import { solveEquationVerified } from '../src/lib/equationEngine.js';
import { solveInequalityVerified } from '../src/lib/inequalityEngine.js';
import { computeCalculator } from '../src/lib/calculatorEngine.js';
import { checkAnswer } from '../src/lib/bacAnswer.js';
import { verifyTransformation } from '../src/lib/pedagogy.js';
import { mathToLatex } from '../src/lib/mathNotation.js';
import { prettyToMath } from '../src/lib/mathInput.js';
import { safeEvaluateExpression } from '../src/lib/expressionCore.js';
let checks=0;
const check=(label:string,run:()=>void)=>{run();checks++;console.log('OK',label);};
const near=(a:number,b:number)=>Math.abs(a-b)<=1e-9*Math.max(1,Math.abs(a),Math.abs(b));
check('B01 : point isolé, même chiffre qu’une borne',()=>{
 const result=solveInequalityVerified('(x-1)^2/(x-10)','>=',0,-20,20);
 assert.match(result.solutionSet,/\{1\}/);assert.match(result.solutionSet,/10/);
 assert.doesNotMatch(solveInequalityVerified('(x-1)^2/(x-10)','>',0,-20,20).solutionSet,/\{1\}/);
});
check('B02 : portée de la puissance exponentielle',()=>{
 assert.equal(checkAnswer('e^x+1',{kind:'expression',expected:'exp(x+1)'}).correct,false);
 assert.equal(checkAnswer('e^x+1',{kind:'expression',expected:'exp(x)+1'}).correct,true);
 assert.equal(checkAnswer('e^(x+1)',{kind:'expression',expected:'exp(x+1)'}).correct,true);
});
for(const scale of [1e-15,1e-11,1e-7,1,1e7,1e11,1e15])check(`B03 : équations/inéquations à l’échelle ${scale}`,()=>{
 const result=solveEquationVerified(`${scale}*x`,scale,-10,10);
 assert.equal(result.solutions.length,1);assert.ok(near(result.solutions[0],1));
 const inequality=solveInequalityVerified(`${scale}*x`,'>',0,-10,10);
 assert.match(inequality.solutionSet,/0/);assert.match(inequality.solutionSet,/\+∞/);assert.ok(inequality.signIntervals.some(i=>i.sign==='+'));
 assert.equal(verifyTransformation(`${scale}*x=${scale}`,'x=2').status,'incorrect');
 assert.equal(checkAnswer(`${scale}*x`,{kind:'expression',expected:`${scale}*x+${scale}`}).correct,false);
 assert.equal(safeEvaluateExpression(`${scale}*x`,{x:2}),2*scale);
});
check('B04 : grands entiers exacts',()=>{
 for(const [input,expected] of [['2^53+1','9007199254740993'],['(2^53+1)*3','27021597764222979'],['-(2^53+1)','-9007199254740993']]){
  const result=computeCalculator(input,'rad');assert.equal(result.decimalValue,expected);assert.equal(result.quality.level,'verified');
 }
});
check('B05 : expressions sans domaine réel refusées',()=>{
 for(const expression of ['1/0','sqrt(-1)','log(-1)','x/(1-1)'])assert.throws(()=>analyzeFunction(expression));
 assert.throws(()=>analyzeFunction('mystery(x)'));
 assert.throws(()=>analyzeFunction('y+x'));
});
check('B05 : domaines des logarithmes et fonctions réciproques',()=>{
 assert.equal(analyzeFunction('log10(x)').domain.description,']0 ; +∞[');
 for(const expression of ['asin(x)','acos(x)']){
  const result=analyzeFunction(expression);assert.equal(result.domain.description,'[-1 ; 1]');assert.equal(result.domain.proven,true);
 }
 assert.equal(analyzeFunction('atan(x)').domain.type,'R');
});
check('B06 : racine cubique réelle',()=>{
 const result=analyzeFunction('x^(1/3)');assert.equal(result.domain.type,'R');assert.equal(result.parity.type,'odd');
 assert.ok(result.plotData.some(p=>p.x<0&&p.y<0));assert.equal(result.variation.intervals.length,2);
 assert.ok(result.variation.intervals.every(i=>i.direction==='increasing'));
 assert.ok(near(safeEvaluateExpression('x^(1/3)',{x:-8})!,-2));
});
check('B07/B10 : petites dérivées et notation scientifique',()=>{
 for(const expression of ['0.0005*x','1e-9*x','1e-15*x']){
  const result=analyzeFunction(expression);assert.ok(result.variation.intervals.every(i=>i.direction==='increasing'));
  assert.equal(result.zeros.length,1);assert.ok(near(result.zeros[0].x,0));
  assert.ok(result.signTable.some(i=>i.sign==='+'));assert.ok(safeEvaluateExpression(result.derivativeExpr,{x:1})!>0);
  assert.equal(prettyToMath(expression),expression);
 }
});
check('B08 : valeur absolue et point non dérivable',()=>{
 const result=analyzeFunction('abs(x)');assert.equal(result.variation.intervals.length,2);
 assert.equal(result.variation.intervals[0].direction,'decreasing');assert.equal(result.variation.intervals[1].direction,'increasing');
 assert.ok(result.variation.criticalPoints.some(p=>p.x===0&&p.type==='minimum local'));
});
check('B09 : vrais zéros, multiplicité et extrémité du domaine',()=>{
 assert.equal(analyzeFunction('exp(-x)').zeros.length,0);
 assert.equal(solveEquationVerified('exp(-x)',0,-10,10).solutions.length,0);
 assert.equal(solveInequalityVerified('exp(-x)','>',0,-10,10).zeros.length,0);
 assert.equal(analyzeFunction('exp(-x)').variation.criticalPoints.length,0);
 const sinus=analyzeFunction('sin(x)^2').zeros;assert.equal(sinus.length,7);
 assert.ok(sinus.every(z=>z.multiplicity===2&&near(z.x/Math.PI,Math.round(z.x/Math.PI))));
 const sqrt=analyzeFunction('sqrt(x)').zeros;assert.equal(sqrt.length,1);assert.equal(sqrt[0].x,0);
 assert.equal(analyzeFunction('1/(x-0.01)').zeros.length,0);
});
check('B11 : mêmes solutions et transformations qui en perdent',()=>{
 assert.equal(verifyTransformation('x^2=0','x=0').status,'verified');
 assert.equal(verifyTransformation('x^2=1','x=1').status,'incorrect');
 assert.equal(verifyTransformation('(x^2-1)/(x-1)=2','x+1=2').status,'incorrect');
});
check('B20 : exposants, signes et racines imbriquées',()=>{
 assert.equal(mathToLatex('x^2+1'),'x^{2}+1');assert.equal(mathToLatex('x^2-4*x+3'),'x^{2}-4\\cdot x+3');
 assert.equal(mathToLatex('x^(n+1)'),'x^{n+1}');assert.equal(mathToLatex('x^-2'),'x^{-2}');
 assert.equal(mathToLatex('2/(x+1)^2'),'\\frac{2}{(x+1)^{2}}');
 assert.equal(mathToLatex('1/sqrt(x)'), '\\frac{1}{\\sqrt{x}}');
 assert.equal(mathToLatex('S={1/2 ; 3}'),'S = \\left\\{\\frac{1}{2} ; 3\\right\\}');
 assert.equal(mathToLatex('a-b/c'), 'a-\\frac{b}{c}');
 assert.equal(mathToLatex('a/b/c'), '\\frac{\\frac{a}{b}}{c}');
 assert.equal(mathToLatex('x^sin(x)+1'),'x^{\\sin(x)}+1');
 assert.equal(mathToLatex('√(x²+1)'), '\\sqrt{x^{2}+1}');
 assert.equal(mathToLatex('sqrt((3-0)^2+(4-0)^2)'), '\\sqrt{(3-0)^{2}+(4-0)^{2}}');
 assert.equal(mathToLatex('sqrt(1+sqrt(x^2+1))'),'\\sqrt{1+\\sqrt{x^{2}+1}}');
});
check('B14/B15 : stockage, export et reprise des séries et du tuteur',()=>{
 const data=new Map<string,string>();
 const previous=globalThis.window;
 globalThis.window={localStorage:{getItem:(key:string)=>data.get(key)||null,setItem:(key:string,value:string)=>{data.set(key,value);},removeItem:(key:string)=>{data.delete(key);}},dispatchEvent:()=>true} as unknown as Window & typeof globalThis;
 try {
  for(const series of ['A','C','D','L','OSE','S'] as const)addLocalAnnale({title:'Test '+series,series,year:2026,sourceNote:'Test',questions:[{id:'q1',number:'1',prompt:'Calculer 2+2',correctionSteps:['2+2=4']}]});
  assert.equal(getLocalAnnales().length,6);const exported=exportLocalAnnales();data.clear();assert.equal(importLocalAnnales(exported).imported,6);assert.equal(getLocalAnnales().length,6);
  const draft={statement:'Énoncé complet '.repeat(30),functionExpr:'x^2+1',workspace:'statement' as const,topic:'Algèbre' as const,showGuide:true,helpMode:'plan' as const,previousStep:'x²=0',nextStep:'x=0',blockedStep:2,hintLevel:1,explanationLevel:'bac' as const,revealedResolutionSteps:5,showResolutionAnswer:true};
  assert.equal(saveTutorDraft(draft),true);assert.deepEqual(getTutorDraft(),draft);
 }finally{globalThis.window=previous;}
});
console.log(`Audit regression: ${checks} scénarios validés.`);
