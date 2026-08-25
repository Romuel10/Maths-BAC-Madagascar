declare const process: { exit(code?: number): never };
import { solveEquation, computeIntegral, analyzeSequence, analyzeFunction } from '../src/lib/mathEngine.js';
import { solveInequalityVerified } from '../src/lib/inequalityEngine.js';
import { computeCalculator } from '../src/lib/calculatorEngine.js';

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

console.log(`Math tools audit: ${checks} checks, ${failures} failure(s)`);
if(failures) process.exit(1);
