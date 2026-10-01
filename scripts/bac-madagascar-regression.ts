declare const process:{exit(code?:number):never};
import { extendedGcd, solveLinearCongruence, solveLinearDiophantine } from '../src/lib/arithmeticEngine.js';
import { solveFirstOrderHomogeneous, solveSecondOrderHomogeneous } from '../src/lib/differentialEquationEngine.js';
import { analyzeEllipse, analyzeHyperbola, analyzeParabola, conicTangent } from '../src/lib/conicEngine.js';
import { mayerRegression } from '../src/lib/probabilityEngine.js';
import { chaptersForSeries, toolRelevance } from '../src/data/bacMadagascarScope.js';
import { BAC_SUBJECTS } from '../src/data/bacSubjects.js';
import { diagnosticQuestions } from '../src/data/learningCatalog.js';

let checks=0,failures=0;
const ok=(v:boolean,label:string)=>{checks++;if(!v){failures++;console.error('FAIL',label);}};
const near=(a:number,b:number,t=1e-8)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b));

// Périmètre des séries
ok(BAC_SUBJECTS.some(s=>s.series==='S'),'un entraînement série S doit exister');
ok(chaptersForSeries('C').some(c=>c.id==='conics-c'),'les coniques doivent être rattachées à C');
ok(chaptersForSeries('S').some(c=>c.id==='matrix-s'),'les matrices doivent être rattachées à S');
ok(toolRelevance('conics','C')==='core'&&toolRelevance('conics','D')==='extra','les coniques ne doivent pas être présentées comme programme D');
ok(toolRelevance('matrix','S')==='core'&&toolRelevance('matrix','C')==='extra','les matrices doivent être ciblées série S');
ok(toolRelevance('ineqxy','A')==='core','les inéquations à deux inconnues doivent être reconnues pour A');
ok(diagnosticQuestions('S').length>0,'le diagnostic série S doit contenir des questions');

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

// Statistique Terminale A : Mayer
const mayer=mayerRegression([1,2,3,4],[3,5,7,9]);
ok(near(mayer.slope,2)&&near(mayer.intercept,1)&&mayer.checks.every(c=>c.ok),'méthode de Mayer');

console.log(`BAC Madagascar scope regression: ${checks} checks, ${failures} failure(s)`);
if(failures)process.exit(1);
