import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {solve} from '../src/engine/index';
import {asReal,numeric,cas} from '../src/engine/expression';
import {guidedRequest} from '../src/data/guided';
import {workbenchTool,setParameter} from '../src/data/workbench';
import type {Operation,Result} from '../src/engine/types';
const run=(operation:Operation,expression:string,params:Record<string,string>={})=>solve({operation,expression,params});
const close=(a:number,b:number,tol=1e-10)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),a+' ≠ '+b);
const render=(r:Result)=>{for(const formula of [r.latex,...r.steps.map(s=>s.latex).filter((v):v is string=>!!v),...(r.table?.latexRows?.flat().filter((v):v is string=>!!v)??[])])katex.renderToString(formula,{throwOnError:true});};
test('algèbre : divisions reconstruites, décomposition et Taylor avec références indépendantes',()=>{
 assert.equal(run('calculate','(x+1)^2',{form:'expand'}).exact,'1+2*x+x^2');assert.match(run('calculate','x^2-1',{form:'factor'}).exact!,/\*\(/);
 for(const d of ['x-1','x^2+1','2*x+3','3']){const r=run('calculate','x^5-2*x^3+7',{form:'divide',divisor:d}),[q,remainder]=r.exact!.split(';');for(const x of [-3,-1,0,2,7])close(numeric(q,x)*numeric(d,x)+numeric(remainder,x),x**5-2*x**3+7);render(r);}
 for(const f of ['1/(x^2-1)','(2*x+3)/(x^2+3*x+2)']){const r=run('calculate',f,{form:'partial'});for(const x of [-4,0,2,7])close(numeric(r.exact!,x),numeric(f,x));render(r);}
 const exp=run('calculate','exp(x)',{form:'taylor',center:'0',degree:'6'});for(const x of [-1,0,.5,2]){let expected=1,term=1;for(let k=1;k<=6;k++){term*=x/k;expected+=term;}close(numeric(exp.exact!,x),expected);}render(exp);
 const log=run('calculate','ln(x)',{form:'taylor',center:'1',degree:'4'});for(const x of [.5,1,1.2,2])close(numeric(log.exact!,x),(x-1)-(x-1)**2/2+(x-1)**3/3-(x-1)**4/4);
 assert.throws(()=>run('calculate','x^2',{form:'divide',divisor:'0'}));assert.throws(()=>run('calculate','1/x',{form:'taylor',center:'0'}));assert.throws(()=>run('calculate','abs(x)',{form:'taylor',center:'0',degree:'2'}));
});
test('systèmes : quatre inconnues, surdétermination et paramètres libres',()=>{
 for(let seed=1;seed<=12;seed++){
  const expected=[seed,seed-2,-seed,2],matrix=Array.from({length:4},(_,i)=>Array.from({length:4},(_,j)=>i===j?10+seed:i+j+1)),vars=['x','y','z','t'];
  const input=matrix.map(row=>row.map((a,j)=>a+'*'+vars[j]).join('+')+'='+row.reduce((s,a,j)=>s+a*expected[j],0)).join('\n'),r=run('system',input);assert.deepEqual(r.exact!.split(';').map(asReal),expected);render(r);
 }
 assert.equal(run('system','x+y=3\nx-y=1\n2*x=4').exact,'2;1');assert.equal(run('system','x+y=3\nx-y=1\n2*x=5').latex,'S=\\varnothing');
 const free=run('system','x+y+z=3\n2*x+2*y+2*z=6');assert.match(free.latex,/r/);assert.match(free.title,/infinité/);render(free);
 assert.throws(()=>run('system','x*y=1\nx+y=2'),/linéaire/);
 assert.throws(()=>run('system','(x^2-1)/(x-1)=2\ny=0'),/dénominateurs/);
});
test('suites : Fibonacci, décalage de rang, somme et limites affines',()=>{
 const fib=run('sequence','u+v',{kind:'second',initial:'0',second:'1',start:'0',count:'12'});assert.equal(fib.exact,'89');assert.match(fib.steps[1].latex!,/232/);render(fib);
 const explicit=run('sequence','n^2+1',{kind:'explicit',start:'5',count:'3',target:'10'});assert.equal(explicit.exact,'50');assert.match(explicit.steps.at(-1)!.latex!,/101/);
 for(const a of [-2,-1,0,.5,1,2]){const r=run('sequence',a+'*u+3',{kind:'recurrence',initial:'5',start:'2',count:'5',target:'6'});let expected=5;for(let i=0;i<4;i++)expected=a*expected+3;close(asReal(r.exact!),expected);assert.ok(r.steps.some(s=>s.title==='Étudier la limite'));render(r);}
 assert.throws(()=>run('sequence','u*v',{kind:'second',initial:'1',second:'1',target:'50'}),/calcul direct/);
});
test('probabilités : références binomiales, sans remise, conditionnelles et grands effectifs',()=>{
 const choose=(n:number,k:number)=>{let a=1;for(let i=1;i<=k;i++)a=a*(n-i+1)/i;return a;};
 for(let n=2;n<=12;n++)for(let k=0;k<=n;k++){const r=run('probability','1/4',{n:String(n),k:String(k)});close(asReal(r.exact!),choose(n,k)*.25**k*.75**(n-k));}
 const hyper=run('probability','0',{model:'hypergeometric',population:'20',successes:'8',n:'5',k:'2'});close(asReal(hyper.exact!),choose(8,2)*choose(12,3)/choose(20,5));render(hyper);
 const cond=run('probability','1/2',{model:'conditional',probB:'2/5',joint:'1/5'});assert.equal(cond.exact,'7/10');render(cond);assert.throws(()=>run('probability','4/5',{model:'conditional',probB:'4/5',joint:'0'}),/incompatibles/);
 const big=run('probability','1/2',{n:'10000',k:'5000',kind:'atleast'});close(big.numericValues![0],.503989323069691,1e-10);render(big);
 assert.equal(run('probability','0',{model:'counting',n:'52',k:'5'}).exact,'2598960');
});
test('lois continues et Poisson : valeurs de référence, symétrie et queues petites',()=>{
 for(const [kind,lower,upper,expected]of [['between','-1','1',.6826894921370859],['atmost','0','0',.5],['atleast','8','9',6.220960574271784e-16]] as const){const r=run('probability','0',{model:'normal',sigma:'1',kind,lower,upper});close(r.numericValues![0]/expected,1,1e-9);render(r);}
 const shifted=run('probability','100',{model:'normal',sigma:'15',kind:'between',lower:'85',upper:'115'});close(shifted.numericValues![0],.6826894921370859);
 for(let k=0;k<12;k++){let factorial=1;for(let i=2;i<=k;i++)factorial*=i;const r=run('probability','3',{model:'poisson',k:String(k),kind:'exact'});close(r.numericValues![0],Math.exp(-3)*3**k/factorial);render(r);}
 assert.throws(()=>run('probability','0',{model:'normal',sigma:'0'}));
});
test('statistiques : effectifs sans expansion, quartiles et régression exacte',()=>{
 const r=run('statistics','1;2\n3;3\n7;1',{model:'descriptive'}),indicators=new Map(r.table!.rows.map(([a,b])=>[a,b] as const));assert.equal(r.exact,'3');assert.equal(indicators.get('Médiane'),'3');assert.equal(indicators.get('Premier quartile Q₁'),'1');assert.equal(indicators.get('Troisième quartile Q₃'),'3');assert.equal(indicators.get('Variance de la série'),'4');render(r);
 const even=run('statistics','1;1\n3;1',{model:'descriptive'});assert.equal(new Map(even.table!.rows.map(([a,b])=>[a,b] as const)).get('Médiane'),'2');
 const huge=run('statistics','1;1000000000\n3;1000000000',{model:'descriptive'});assert.equal(huge.exact,'2');
 const line=run('statistics','1;3\n2;5\n3;7',{predict:'10'});assert.match(line.steps.at(-1)!.latex!,/21/);assert.equal(new Map(line.table!.rows.map(([a,b])=>[a,b] as const)).get('Corrélation'),'1');render(line);
 assert.match(run('statistics','1;3\n2;5\n3;7',{predict:'1/3'}).steps.at(-1)!.latex!,/\\frac\{5\}\{3\}/);
 assert.throws(()=>run('statistics','1;0\n2;0',{model:'descriptive'}));assert.throws(()=>run('statistics','1;-1',{model:'descriptive'}));
});
test('complexes : puissances indépendantes et toutes les racines dans le plan',()=>{
 assert.equal(run('complex','1+i',{model:'power',power:'4'}).exact,'-4');
 for(const n of [-3,-1,1,2,4,10]){const r=run('complex','1+i',{model:'power',power:String(n)}),m=2**(n/2),angle=n*Math.PI/4;close(asReal(cas('realpart('+r.exact+')').toString()),m*Math.cos(angle));close(asReal(cas('imagpart('+r.exact+')').toString()),m*Math.sin(angle));render(r);}
 for(const degree of [2,3,4,5,7]){const r=run('complex','-1+i',{model:'roots',degree:String(degree)});assert.equal(r.chart!.points.length,degree);for(const [a,b]of r.chart!.points){const theta=degree*Math.atan2(b,a),radius=Math.hypot(a,b)**degree;close(radius*Math.cos(theta),-1);close(radius*Math.sin(theta),1);}render(r);}
 assert.equal(run('complex','0',{model:'roots',degree:'4'}).exact,'0');assert.throws(()=>run('complex','0',{model:'power',power:'-1'}));
});
test('étude enrichie et formulaires : signe, parité, tangente, modèles restaurables',()=>{
 const even=run('function','x^2-1',{tangentAt:'1'});assert.match(even.analysis!.symmetry!,/paire/);assert.deepEqual(even.analysis!.signs!.rows.map(r=>r[1]),['+','−','+']);assert.ok(even.analysis!.tangent);render(even);
 assert.match(run('function','x^3').analysis!.symmetry!,/impaire/);assert.match(run('function','sqrt(x)').analysis!.symmetry!,/non établie/);
 assert.equal(run('function','sqrt(x^2)',{tangentAt:'0'}).analysis!.tangent,undefined);
 const normal=setParameter({operation:'probability',expression:'1/2',params:{}},'model','normal');assert.equal(normal.expression,'0');assert.ok(workbenchTool(normal).fields.some(f=>f.key==='sigma'));
 for(const size of ['2','3','4']){const req=guidedRequest({operation:'system',expression:'',params:{data_size:size}});render(solve(req));}
});
