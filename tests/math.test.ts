import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {solve,compareAnswer} from '../src/engine/index';
import {asReal,numeric,expression,parse,checkDomain} from '../src/engine/expression';
import {lessons} from '../src/data/lessons';
import {guidedRequest} from '../src/data/guided';
import {tools} from '../src/data/tools';
import type {Operation,Result} from '../src/engine/types';
const run=(operation:Operation,expression:string,params:Record<string,string>={})=>solve({operation,expression,params});
const close=(a:number,b:number,tol=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),a+' != '+b);
function values(r:Result){return (r.exact??'').split(';').filter(Boolean).map(asReal).sort((a,b)=>a-b);}
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
