import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {solve,compareAnswer} from '../src/engine/index';
import {asReal,numeric,expression,parse,checkDomain,cas,inputTex} from '../src/engine/expression';
import {numericalRoots,certifiedDomain} from '../src/engine/numerical';
import {lessons} from '../src/data/lessons';
import {guidedRequest} from '../src/data/guided';
import {tools} from '../src/data/tools';
import type {Operation,Result} from '../src/engine/types';
const run=(operation:Operation,expression:string,params:Record<string,string>={})=>solve({operation,expression,params});
const close=(a:number,b:number,tol=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),a+' != '+b);
function values(r:Result){return r.numericValues??(r.exact??'').split(';').filter(Boolean).map(asReal).sort((a,b)=>a-b);}
test('les 17 outils produisent des résultats et des formules valides',()=>{
 for(const t of tools){const r=solve({operation:t.id,expression:t.expression,params:Object.fromEntries(t.fields.map(f=>[f.key,f.initial]))});assert.ok(r.steps.length>=2,t.id);katex.renderToString(r.latex,{throwOnError:true});for(const s of r.steps)if(s.latex)katex.renderToString(s.latex,{throwOnError:true});}
});
test('arithmétique exacte, notation scientifique et puissances réelles',()=>{
 assert.equal(run('calculate','2^53+1').exact,'9007199254740993');
 assert.equal(run('calculate','(2/3+1/4)^2').exact,'121/144');
 assert.equal(run('calculate','0.1+0.2').exact,'3/10');
 close(asReal(run('calculate','1e-9+2e-9').exact!),3e-9,1e-18);
 assert.equal(run('calculate','(-8)^(1/3)').exact,'-2');
 assert.equal(run('calculate','(-8)^(2/3)').exact,'4');
 assert.equal(run('calculate','10!').exact,'3628800');
 assert.throws(()=>run('calculate','1/0'));
 assert.throws(()=>run('calculate','sqrt(-1)'));
});
test('équations : 121 couples de racines entières avec un oracle indépendant',()=>{
 for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++){
  const r=values(run('equation','x^2-('+String(a+b)+')*x+('+String(a*b)+')=0'));
  const expected=[...new Set([a,b])].sort((x,y)=>x-y);
  assert.equal(r.length,expected.length,'racines '+a+','+b);r.forEach((v,i)=>close(v,expected[i]));
 }
});
test('coefficients de 10^-20 à 10^20, racines stables et racines multiples',()=>{
 for(const scale of ['1e-20','1e-15','1e-9','1','1e9','1e15','1e20']){
  const r=values(run('equation',scale+'*(x^2-5*x+6)=0'));assert.equal(r.length,2,scale);close(r[0],2);close(r[1],3);
 }
 const tiny=values(run('equation','1e-15*x^2+x-1=0'));assert.equal(tiny.length,2);close(tiny[0],-1e15-1);close(tiny[1],1-1e-15);
 assert.deepEqual(values(run('equation','x^2=0')),[0]);
 assert.deepEqual(values(run('equation','x^2+1=0')),[]);
 close(values(run('equation','x^3-2=0'))[0],Math.cbrt(2));
});
test('équations : domaine, racines parasites et transcendantes',()=>{
 assert.deepEqual(values(run('equation','(x^2-1)/(x-1)=0')),[-1]);
 assert.deepEqual(values(run('equation','sqrt(x+1)=x-1')),[3]);
 assert.deepEqual(values(run('equation','ln(x)=0')),[1]);
 close(values(run('equation','exp(x)=2'))[0],Math.log(2));
 assert.ok(run('equation','sin(x)=0').latex.includes('\\mathbb Z'));
 assert.ok(run('equation','(x-1)/(x-1)=1').latex.includes('\\ne'));
 assert.equal(run('equation','2=3').latex,'S=\\varnothing');
});
test('inégalités : bornes isolées, valeurs interdites, inclusions',()=>{
 assert.equal(run('inequality','(x-1)^2<=0').latex,'S=\\{1\\}');
 assert.equal(run('inequality','x^2<0').latex,'S=\\varnothing');
 assert.ok(run('inequality','(x-1)/(x+2)>=0').latex.includes(']-\\infty;-2['));
 assert.ok(run('inequality','(x-1)/(x+2)>=0').latex.includes('[1;+\\infty['));
 assert.ok(run('inequality','1/(x-1)>0').latex.includes(']1;+\\infty['));
 assert.throws(()=>run('inequality','sin(x)>0'));
});
test('dérivées contre 81 valeurs calculées indépendamment',()=>{
 for(let degree=1;degree<=9;degree++){const r=run('derivative','x^'+degree+'-3*x+2');for(const x of [-3,-2,-1,-.5,0,.5,1,2,3])close(numeric(r.exact!,x),degree*x**(degree-1)-3);}
 const quotient=run('derivative','(x+1)/(x-1)');for(const x of [-3,0,2,5])close(numeric(quotient.exact!,x),-2/(x-1)**2);
 const composed=run('derivative','ln(2*x+1)');for(const x of [0,1,2,5])close(numeric(composed.exact!,x),2/(2*x+1));
 assert.equal(run('function','0.0005*x').table?.rows[0][1],'croissante');
 const cube=run('function','x^(1/3)');assert.ok(cube.plot?.points.some(p=>p&&p[0]<0&&p[1]<0));assert.ok(cube.table?.rows.every(r=>r[1]==='croissante'));
});
test('primitives, intégrales et singularités',()=>{
 close(asReal(run('integral','x^2+2*x',{kind:'definite',lower:'0',upper:'1'}).exact!),4/3);
 close(asReal(run('integral','x^2',{kind:'definite',lower:'2',upper:'0'}).exact!),-8/3);
 close(asReal(run('integral','1/x',{kind:'definite',lower:'-2',upper:'-1'}).exact!),-Math.log(2));
 assert.throws(()=>run('integral','1/x',{kind:'definite',lower:'-1',upper:'1'}),/impropre/);
 assert.throws(()=>run('integral','1/(x-1)^2',{kind:'definite',lower:'0',upper:'2'}),/impropre/);
 assert.ok(run('integral','1/x').exact?.includes('abs'));
});
test('limites usuelles et latérales',()=>{
 assert.equal(run('limit','sin(x)/x',{point:'0'}).exact,'1');
 assert.equal(run('limit','(x^2-1)/(x-1)',{point:'1'}).exact,'2');
 assert.equal(run('limit','1/x',{point:'0',side:'left'}).exact,'-Inf');
 assert.equal(run('limit','1/x',{point:'0',side:'right'}).exact,'Inf');
 assert.throws(()=>run('limit','1/x',{point:'0',side:'both'}));
 assert.equal(run('limit','(3*x^2+1)/(2*x^2-5)',{point:'Infinity'}).exact,'3/2');
});
test('systèmes, matrices, suites, probabilités et spécialités',()=>{
 assert.equal(run('system','2*x+y=5\nx-y=1').exact,'2;1');
 assert.equal(run('system','x+y=1\n2*x+2*y=3').latex,'S=\\varnothing');
 assert.ok(run('system','x+y=1\n2*x+2*y=2').title.includes('infinité'));
 assert.throws(()=>run('system','x*y=1\nx+y=2'));
 assert.equal(run('matrix','2;1\n1;3').exact,'[["3/5","-1/5"],["-1/5","2/5"]]');
 assert.ok(run('matrix','1;2\n2;4').title.includes('non inversible'));
 close(asReal(run('sequence','3*u',{kind:'recurrence',initial:'2',start:'0',count:'4'}).exact!),54);
 close(asReal(run('sequence','2*n+3',{kind:'explicit',start:'0',count:'6'}).exact!),13);
 assert.equal(run('probability','1/2',{n:'3',k:'2',kind:'exact'}).exact,'3/8');
 assert.equal(run('probability','1/2',{n:'3',k:'1',kind:'atleast'}).exact,'7/8');
 assert.equal(run('probability','0',{n:'5',k:'0'}).exact,'1');
 assert.equal(run('probability','1',{n:'5',k:'5'}).exact,'1');
 assert.throws(()=>run('probability','1.1',{n:'5',k:'3'}));
 assert.equal(run('arithmetic','252;198').exact,'18');
 assert.equal(run('arithmetic','0;0').exact,'0');
 assert.equal(run('geometry','1;2;0\n2;-1;0').exact,'0');
 assert.equal(run('finance','100000',{rate:'5',years:'2',payment:'0'}).exact,'110250');
 assert.equal(run('finance','100',{rate:'0',years:'2',payment:'50'}).exact,'200');
 const ode=run('ode','3',{a:'-2',y0:'1',x0:'0'});close(numeric(ode.exact!,0),1);close(numeric(ode.exact!,1),1.5-.5*Math.exp(-2));
 assert.ok(run('complex','0').steps.some(s=>s.text.includes('n’a pas d’argument')));
});
test('correction de réponses : exemples acceptés et réponses fausses refusées',()=>{
 assert.equal(compareAnswer('0.375','3/8'),true);
 assert.equal(compareAnswer('3*(x^2)-2','3*x^2-2'),true);
 assert.equal(compareAnswer('exp(x)+1','exp(x+1)'),false);
 assert.equal(compareAnswer('2','3'),false);
 assert.equal(compareAnswer('1e-12','0'),false);
 assert.equal(compareAnswer('n’importe quoi','3'),false);
});
test('analyseur restreint, domaines et budgets',()=>{
 for(const raw of ['import("x")','a=2','x.constructor','evaluate(2)','10001!','factorial(2^9999)','x^10001','[1,2]'])assert.throws(()=>parse(raw),raw);
 assert.equal(checkDomain(expression('sqrt(x)'),-1),false);
 assert.equal(checkDomain(expression('ln(x)'),0),false);
 assert.equal(checkDomain(expression('1/(x-1)'),1),false);
 assert.equal(numeric('(-8)^(1/3)'),-2);
 assert.ok(expression('1e-9*x').includes('10'));
});
test('toutes les formules pédagogiques sont rendues sans erreur',()=>{
 assert.equal(lessons.length,15);
 for(const l of lessons)for(const p of [...l.parts,...l.worked])katex.renderToString(p.formula,{throwOnError:true});
 for(const series of ['A','C','D','L','OSE','S'])assert.ok(lessons.filter(l=>l.series.includes(series as any)).length>=7);
});

test('aucune borne réelle : signe et variations sur tout R',()=>{
 assert.equal(run('inequality','x^2+1>0').latex,'S=]-\\infty;+\\infty[');
 assert.equal(run('inequality','x^2+1<0').latex,'S=\\varnothing');
 assert.equal(run('function','x^3+x').table?.rows[0][1],'croissante');
 assert.equal(run('function','-x^3-x').table?.rows[0][1],'décroissante');
});
test('limites : ne jamais moyenner les deux côtés',()=>{
 assert.throws(()=>run('limit','abs(x)/x',{point:'0'}));
 assert.equal(run('limit','abs(x)/x',{point:'0',side:'left'}).exact,'-1');
 assert.equal(run('limit','abs(x)/x',{point:'0',side:'right'}).exact,'1');
 assert.throws(()=>run('limit','floor(x)',{point:'0',side:'left'}));
 assert.throws(()=>run('limit','sqrt(x)',{point:'0',side:'left'}));
 assert.equal(run('limit','sqrt(x)',{point:'0',side:'right'}).exact,'0');
});
test('une correction ne doit pas accepter une restriction ajoutée',()=>{
 assert.equal(compareAnswer('x/x','1'),false);
 assert.equal(compareAnswer('2/(2*x+2)','1/(x+1)'),true);
});

test('données personnelles : valeurs, fractions, premier degré et systèmes',()=>{
 const input=(operation:Operation,params:Record<string,string>)=>solve(guidedRequest({operation,expression:'',params:{...params,entry:'guided'}}));
 assert.deepEqual(values(input('equation',{data_a:'1',data_b:'-7',data_c:'12'})),[3,4]);
 assert.deepEqual(values(input('equation',{data_a:'0',data_b:'2/3',data_c:'-4'})),[6]);
 assert.equal(input('system',{data_a1:'1',data_b1:'1',data_c1:'7',data_a2:'1',data_b2:'-1',data_c2:'1'}).exact,'4;3');
 assert.throws(()=>input('equation',{data_a:'x'}),/Coefficient a/);
 assert.throws(()=>input('equation',{data_b:''}),/Coefficient b/);
 assert.throws(()=>input('complex',{data_a:'1/0'}),/Partie réelle/);
});

test('notations du cahier : racines, multiplication, puissances, virgules et fonctions',()=>{
 assert.equal(run('calculate','√9 + 2²').exact,'7');
 assert.equal(run('calculate','2√9 + ∛27').exact,'9');
 assert.equal(run('calculate','0,1 + 0,2').exact,'3/10');
 assert.equal(run('calculate','2x + 3x').exact,'5*x');
 assert.equal(run('calculate','ln e').exact,'1');
 assert.equal(run('calculate','|−3|').exact,'3');
 const d=run('derivative','f(x) = (x²+1)eˣ');
 for(const x of [-2,-1,0,1,2])close(numeric(d.exact!,x),(x*x+2*x+1)*Math.exp(x));
 assert.equal(run('calculate','sin 30',{angle:'deg'}).exact,'1/2');
 close(asReal(run('calculate','sin 30',{angle:'rad'}).exact!),Math.sin(30));
 assert.equal(run('calculate','arcsin(1/2)',{angle:'deg'}).exact,'30');
 for(const raw of ['√(x²+1)','ln x','3x²−2x+1'])katex.renderToString(inputTex(raw),{throwOnError:true});
 for(const raw of ['x¹⁰⁰⁰¹','x^(10001)','x^(-10001)','sin','sqrt'])assert.throws(()=>parse(raw),raw);
});
test('grands entiers : 500! conserve tous ses chiffres',()=>{
 let expected=1n;for(let n=1n;n<=500n;n++)expected*=n;
 assert.equal(run('calculate','500!').exact,String(expected));
 assert.equal(run('calculate','2^1024').exact,String(1n<<1024n));
 assert.match(run('calculate','exp(-1000)').approximate!,/10\^-435/);
 assert.match(run('calculate','1/10^400').approximate!,/10\^-400/);
 assert.throws(()=>run('calculate','(2^10000)^10000'),/chiffres/);
});
test('une forme inchangée est annoncée et peut être évaluée pour x',()=>{
 const unchanged=run('calculate','x²+1');assert.equal(unchanged.method,'unchanged');assert.match(unchanged.title,/déjà/);
 assert.equal(run('calculate','x²+1',{form:'evaluate',xvalue:'3'}).exact,'10');
 assert.equal(run('calculate','x²+1',{form:'evaluate',xvalue:'2/3'}).exact,'13/9');
 assert.equal(run('calculate','∛x',{form:'evaluate',xvalue:'−8'}).exact,'-2');
 assert.equal(run('calculate','x²',{form:'evaluate',xvalue:'1e200'}).exact,'1'+'0'.repeat(400));
 assert.throws(()=>run('calculate','(x²-1)/(x-1)',{form:'evaluate',xvalue:'1'}),/interdite/);
 assert.deepEqual(values(run('calculate','x²−5x+6=0')),[2,3]);
 assert.equal(run('calculate','x²<0').latex,'S=\\varnothing');
});
test('équations numériques : racines transcendantes, bornes et vérification indépendante',()=>{
 for(const [formula,expected,f] of [
  ['ln x+x=0',.5671432904097839,(x:number)=>Math.log(x)+x],
  ['cos(x)=x',.7390851332151607,(x:number)=>Math.cos(x)-x],
  ['x⁵−x−1=0',1.1673039782614187,(x:number)=>x**5-x-1]
 ] as const){const r=run('equation',formula);assert.equal(r.method,'numeric');assert.equal(r.exact,undefined);assert.equal(r.numericValues?.length,1);close(r.numericValues![0],expected,1e-10);close(f(r.numericValues![0]),0,1e-10);katex.renderToString(r.latex,{throwOnError:true});}
 const outside=run('equation','cos(x)=x',{rootMin:'2',rootMax:'3'});assert.deepEqual(outside.numericValues,[]);assert.match(outside.title,/repérée/);assert.ok(!outside.latex.includes('varnothing'));
 assert.throws(()=>run('equation','cos(x)=x',{rootMin:'3',rootMax:'2'}),/bornes/);
 const shifted=run('equation','cos(x-20)=x-20',{rootMin:'20',rootMax:'21'});close(values(shifted)[0],20.73908513321516,1e-10);
});
test('la recherche numérique rejette les pôles et les faux zéros par sous-dépassement',()=>{
 assert.deepEqual(numericalRoots(expression('1/(x-0.12345)'),expression('0'),-1,1),[]);
 assert.deepEqual(numericalRoots(expression('exp(x)'),expression('0'),-1000,0),[]);
 assert.deepEqual(numericalRoots(expression('x^1000'),expression('0'),-1,1),[0]);
 assert.deepEqual(numericalRoots(expression('1e-20*(x²+1)'),expression('0'),-3,3),[]);
 const tangent=numericalRoots(expression('(cos(x)-x)²'),expression('0'),0,1);assert.equal(tangent.length,1);close(tangent[0],.7390851332151607,1e-8);
});
test('trigonométrie : toutes les branches périodiques, radians et degrés',()=>{
 for(const [formula,target,fn] of [['sin(2x+1)=1/2',.5,Math.sin],['cos(2x+1)=1/2',.5,Math.cos],['tan(2x+1)=1',1,Math.tan]] as const){
  const r=run('equation',formula);assert.equal(r.method,'exact');assert.equal(r.families?.length,formula.startsWith('tan')?1:2);
  for(const family of r.families!)for(const n of [-5,-1,0,1,5]){const x=asReal(cas(family,{n:String(n)}).toString());close(fn(2*x+1),target);}
  katex.renderToString(r.latex,{throwOnError:true});
 }
 const degrees=run('calculate','sin(x)=1/2',{angle:'deg'});for(const family of degrees.families!)close(Math.sin(asReal(cas(family,{n:'0'}).toString())*Math.PI/180),.5);
 assert.equal(run('equation','sin(x)=2').latex,'S=\\varnothing');
 assert.equal(run('equation','exp(x)=-1').latex,'S=\\varnothing');
 close(values(run('equation','ln(x)=0'))[0],1);
 close(values(run('equation','exp(x)=2'))[0],Math.log(2));
});
test('intégrales numériques : oracles indépendants et oscillations',()=>{
 // References obtained from 85-digit sums of the integrated power series.
 for(const [formula,upper,expected] of [['e^(−x²)','1',.7468241328124270254],['cos(x²)','1',.9045242379002720815],['sin(x²)','4',.7471338446481146562],['sin(256πx)²','1',.5]] as const){
  const r=run('integral',formula,{kind:'definite',method:'numeric',lower:'0',upper});assert.equal(r.method,'numeric');assert.equal(r.exact,undefined);close(r.numericValues![0],expected,1e-9);katex.renderToString(r.latex,{throwOnError:true});
 }
 const automatic=run('integral','exp(−x²)',{kind:'definite',lower:'0',upper:'1'});assert.equal(automatic.method,'numeric');close(automatic.numericValues![0],.7468241328124270254);
 close(run('integral','exp(−x²)',{kind:'definite',lower:'1',upper:'0'}).numericValues![0],-.7468241328124270254);
 close(asReal(run('integral','sin(x)',{kind:'definite',lower:'0',upper:'π'}).exact!),2);
 assert.throws(()=>run('integral','exp(−x²)'),/deux bornes/);
});
test('intégrales : certifier les domaines sans rater une singularité entre deux échantillons',()=>{
 assert.equal(certifiedDomain(expression('1/(1+exp(x))'),-10,10),true);
 assert.equal(certifiedDomain(expression('ln(sin(x))'),Math.PI/4,3*Math.PI/4),true);
 assert.equal(certifiedDomain(expression('tan(x)'),0,Math.PI),false);
 assert.equal(certifiedDomain(expression('tan(x)'),0,Math.PI/2),false);
 assert.throws(()=>run('integral','1/(x-0.12345)²',{kind:'definite',lower:'0',upper:'1',method:'numeric'}),/impropre/);
 assert.throws(()=>run('integral','ln(x)',{kind:'definite',lower:'-1',upper:'1',method:'numeric'}));
 const r=run('integral','1/(1+exp(x))',{kind:'definite',lower:'0',upper:'1',method:'numeric'});close(r.numericValues![0],1-Math.log1p(Math.E)+Math.log(2));
});
test('formulaires : modèles d’analyse, suites et grilles sans séparateurs à saisir',()=>{
 const input=(operation:Operation,params:Record<string,string>)=>solve(guidedRequest({operation,expression:'',params}));
 const derivative=input('derivative',{data_model:'logarithm',data_a:'3',data_b:'2'});for(const x of [0,1,2])close(numeric(derivative.exact!,x),3/(3*x+2));
 const geometric=input('sequence',{data_model:'geometric',data_q:'2/3',initial:'9',count:'3'});assert.equal(geometric.exact,'4');
 const arithmetic=input('sequence',{data_model:'arithmetic',data_r:'−2',initial:'10',count:'4'});assert.equal(arithmetic.exact,'4');
 const matrix=input('matrix',{data_size:'3'});assert.equal(matrix.exact,'[["1","0","0"],["0","1","0"],["0","0","1"]]');
 const statistics=input('statistics',{data_rows:'2',data_x0:'2 / 3',data_y0:'4 / 3',data_x1:'2',data_y1:'4'});assert.match(statistics.approximate!,/a = 2 ; b = 0/);
});
