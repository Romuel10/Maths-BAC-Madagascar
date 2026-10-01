declare const process:{exit(code?:number):never};
import { extendedGcd, solveLinearCongruence, solveLinearDiophantine } from '../src/lib/arithmeticEngine.js';
import { solveFirstOrderHomogeneous, solveSecondOrderHomogeneous } from '../src/lib/differentialEquationEngine.js';
import { analyzeEllipse, analyzeHyperbola, analyzeParabola, conicTangent } from '../src/lib/conicEngine.js';
import { mayerRegression, uniformRangeProbability, uniformMeanVariance, exponentialRangeProbability, exponentialMeanVariance } from '../src/lib/probabilityEngine.js';
import { simpleInterest, commercialDiscount, compoundFutureValue, presentValue, annuityPresentValue } from '../src/lib/financialMathEngine.js';
import { solveCramer } from '../src/lib/matrix.js';
import { chaptersForSeries, toolRelevance } from '../src/data/bacMadagascarScope.js';
import { BAC_SUBJECTS } from '../src/data/bacSubjects.js';
import { diagnosticQuestions } from '../src/data/learningCatalog.js';

let checks=0,failures=0;
const ok=(v:boolean,label:string)=>{checks++;if(!v){failures++;console.error('FAIL',label);}};
const near=(a:number,b:number,t=1e-8)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));

// Périmètre des séries
ok(BAC_SUBJECTS.some(s=>s.series==='S'),'un entraînement série S doit exister');
ok(BAC_SUBJECTS.some(s=>s.series==='L'),'un entraînement série L doit exister');
ok(BAC_SUBJECTS.some(s=>s.series==='OSE'),'un entraînement série OSE doit exister');
ok(chaptersForSeries('C').some(c=>c.id==='conics-c'),'les coniques doivent être rattachées à C');
ok(chaptersForSeries('S').some(c=>c.id==='matrix-s'),'les matrices doivent être rattachées à S');
ok(toolRelevance('conics','C')==='core'&&toolRelevance('conics','D')==='extra','les coniques ne doivent pas être présentées comme programme D');
ok(toolRelevance('matrix','S')==='core'&&toolRelevance('matrix','C')==='extra','les matrices doivent être ciblées série S');
ok(toolRelevance('ineqxy','A')==='core','les inéquations à deux inconnues doivent être reconnues pour A');
ok(diagnosticQuestions('S').length>0,'le diagnostic série S doit contenir des questions');
ok(diagnosticQuestions('L').length>0,'le diagnostic série L doit contenir des questions');
ok(diagnosticQuestions('OSE').some(q=>q.topic==='Finance'),'le diagnostic OSE doit couvrir les mathématiques financières');
ok(toolRelevance('finance','OSE')==='core'&&toolRelevance('finance','L')==='extra','la finance doit être ciblée OSE');
ok(chaptersForSeries('S').some(c=>c.id==='continuous-laws-s'),'les lois continues doivent être rattachées à S');

// Arithmétique C/S
const bez=extendedGcd(252n,198n);
ok(bez.gcd===18n&&252n*bez.u+198n*bez.v===18n,'Bézout exact');
const congr=solveLinearCongruence(56n,2n,15n);
ok(congr.solvable&&congr.representative===7n&&congr.solutionModulus===15n,'congruence 56x≡2 [15]');
const dio=solveLinearDiophantine(15n,6n,9n);
ok(dio.solvable&&dio.x0!==null&&dio.y0!==null&&15n*dio.x0+6n*dio.y0===9n,'équation diophantienne');

// Équations différentielles C/S
const ode1=solveFirstOrderHomogeneous(2,{x0:0,y0:3});
ok(ode1.constantValue!==null&&near(ode1.constantValue,3)&&ode1.checks.every(c=>c.ok),'ED premier ordre avec condition initiale');
const ode2=solveSecondOrderHomogeneous(1,-3,2,{x0:0,y0:1,dy0:0});
ok(ode2.roots.includes('1')&&ode2.roots.includes('2')&&ode2.constants!==null&&near(ode2.constants[0],2)&&near(ode2.constants[1],-1)&&ode2.checks.every(c=>c.ok),'ED second ordre racines réelles');
const odeDouble=solveSecondOrderHomogeneous(1,-2,1,{x0:0,y0:1,dy0:0});
ok(odeDouble.roots[0]==='1'&&odeDouble.checks.every(c=>c.ok),'ED second ordre racine double');
const odeComplex=solveSecondOrderHomogeneous(1,0,1,{x0:0,y0:1,dy0:0});
ok(odeComplex.roots.some(r=>r.includes('i'))&&odeComplex.checks.every(c=>c.ok),'ED second ordre racines complexes');

// Coniques Terminale C
const ellipse=analyzeEllipse(5,3);
ok(ellipse.foci.length===2&&near(ellipse.eccentricity??NaN,0.8),'ellipse foyers/excentricité');
const et=conicTangent(ellipse,5,0);
ok(et.onConic&&et.equation!==null,'tangente ellipse');
const hyper=analyzeHyperbola(3,2,false);
ok(hyper.asymptotes.length===2&&hyper.foci.length===2,'hyperbole propriétés');
const parab=analyzeParabola(2,'x',1);
const pt=conicTangent(parab,2,4);
ok(pt.onConic&&pt.equation!==null,'parabole et tangente');

// Systèmes Terminale L : Cramer
const cramer=solveCramer([[1,1,1],[2,-1,1],[1,2,-1]],[6,3,2]);
ok(!!cramer&&near(cramer.solution[0],1)&&near(cramer.solution[1],2)&&near(cramer.solution[2],3)&&cramer.checks.every(c=>c.ok),'Cramer 3x3 série L');

// Mathématiques financières Terminale OSE
ok(near(simpleInterest(1000000,0.1,2).result,200000),'intérêt simple OSE');
ok(near(commercialDiscount(1000000,0.08,0.5).result,40000),'escompte commercial OSE');
ok(near(compoundFutureValue(1000000,0.1,2).result,1210000),'capitalisation OSE');
ok(near(presentValue(1210000,0.1,2).result,1000000),'actualisation OSE');
ok(near(annuityPresentValue(100000,0.1,3).result,248685.1990984222,1e-9),'annuités OSE');

// Lois continues Terminale S
ok(near(uniformRangeProbability(0.2,0.8,0,1),0.6),'loi uniforme S');
const um=uniformMeanVariance(0,2);ok(near(um.mean,1)&&near(um.variance,1/3),'moments uniforme S');
ok(near(exponentialRangeProbability(0,2,0.5),1-Math.exp(-1)),'loi exponentielle S');
const em=exponentialMeanVariance(0.5);ok(near(em.mean,2)&&near(em.variance,4),'moments exponentielle S');

// Statistique Terminale A/L : Mayer
const mayer=mayerRegression([1,2,3,4],[3,5,7,9]);
ok(near(mayer.slope,2)&&near(mayer.intercept,1)&&mayer.checks.every(c=>c.ok),'méthode de Mayer A/L');

console.log(`BAC Madagascar scope regression: ${checks} checks, ${failures} failure(s)`);
if(failures)process.exit(1);
