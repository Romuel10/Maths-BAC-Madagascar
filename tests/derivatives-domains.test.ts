import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {solve} from '../src/engine/index';
import {expression,numeric,domainTex,cas} from '../src/engine/expression';
import {probePlot} from '../src/engine/plot';
import {editorExpression} from '../src/math-notation';

const derive=(f:string,order=1)=>solve({operation:'derivative',expression:f,params:{order:String(order)}});
const study=(f:string)=>solve({operation:'function',expression:f,params:{xmin:'-5',xmax:'5'}});
const close=(actual:number,expected:number,label:string)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=(expected===0?1e-12:1e-10*Math.max(1e-28,Math.abs(expected))),label+': '+actual+' ≠ '+expected);

test('dérivées : 41 fonctions et 205 valeurs avec des formules indépendantes',()=>{
 const real=[-3,-1,0,1,3],positive=[.1,.5,1,2,5],nonzero=[-8,-1,.5,1,8];
 const cases:[string,(x:number)=>number,number[]][]=[
  ['ln(x)/x',x=>(1-Math.log(x))/x**2,positive],
  ['ln(x^2+1)',x=>2*x/(x*x+1),real],
  ['ln((x+1)/(x-1))',x=>-2/(x*x-1),[-5,-3,-2,2,3]],
  ['ln(abs(x))',x=>1/x,nonzero],
  ['ln(exp(x))',()=>1,real],
  ['exp(ln(x))',()=>1,positive],
  ['exp(-x^2)',x=>-2*x*Math.exp(-x*x),real],
  ['exp(2*x+1)',x=>2*Math.exp(2*x+1),real],
  ['(x^2+1)*e^x',x=>(x*x+2*x+1)*Math.exp(x),real],
  ['e^(-x)/(x+1)',x=>-(x+2)*Math.exp(-x)/(x+1)**2,[-5,-3,-2,0,3]],
  ['(exp(x)+1)/(exp(x)-1)',x=>-2*Math.exp(x)/(Math.exp(x)-1)**2,nonzero],
  ['(x^2+1)/(x-1)',x=>(x*x-2*x-1)/(x-1)**2,[-3,-1,0,2,3]],
  ['(2*x+1)^5',x=>10*(2*x+1)**4,real],
  ['x^x',x=>x**x*(Math.log(x)+1),positive],
  ['(x^2+1)^(sin(x))',x=>(x*x+1)**Math.sin(x)*(Math.cos(x)*Math.log(x*x+1)+Math.sin(x)*2*x/(x*x+1)),real],
  ['(x^2)^x',x=>(x*x)**x*(2+Math.log(x*x)),nonzero],
  ['2^(3*x)',x=>3*Math.log(2)*2**(3*x),real],
  ['sqrt(x^2+1)',x=>x/Math.sqrt(x*x+1),real],
  ['sqrt(x^2)',Math.sign,nonzero],
  ['sqrt((x-1)^2)',x=>Math.sign(x-1),[-3,-1,0,2,3]],
  ['abs(x)',Math.sign,nonzero],
  ['abs(x^2-1)',x=>Math.sign(x*x-1)*2*x,[-3,-.5,0,.5,3]],
  ['abs(x)^2',x=>2*x,real],
  ['abs(x^2)',x=>2*x,real],
  ['abs(sin(x))',x=>Math.sign(Math.sin(x))*Math.cos(x),nonzero],
  ['abs(x^3)^(1/3)',Math.sign,nonzero],
  ['cbrt(x)',x=>1/(3*Math.cbrt(x)**2),nonzero],
  ['cbrt(x^2)',x=>2*x/(3*Math.cbrt(x*x)**2),nonzero],
  ['x^(2/3)',x=>2/(3*Math.cbrt(x)),nonzero],
  ['x^(-1/3)',x=>-1/(3*Math.cbrt(x)**4),nonzero],
  ['(x^3)^(1/3)',()=>1,real],
  ['cbrt(ln(x)^3)',x=>1/x,positive],
  ['log10(x)',x=>1/(x*Math.log(10)),positive],
  ['sin(x^2)',x=>2*x*Math.cos(x*x),real],
  ['tan(2*x)',x=>2/Math.cos(2*x)**2,real],
  ['asin(x)',x=>1/Math.sqrt(1-x*x),[-.8,-.5,0,.5,.8]],
  ['acos(x)',x=>-1/Math.sqrt(1-x*x),[-.8,-.5,0,.5,.8]],
  ['tanh(x)',x=>1/Math.cosh(x)**2,real],
  ['tanh(2^x)',x=>Math.log(2)*2**x/Math.cosh(2**x)**2,[-2,-1,0,1,2]],
  ['exp(sqrt(x^2))',x=>Math.sign(x)*Math.exp(Math.abs(x)),nonzero],
  ['1e-20*x^2',x=>2e-20*x,real]
 ];
 assert.equal(cases.length,41);
 const studies=new Set(['ln(x)/x','ln(x^2+1)','(x^2+1)/(x-1)','exp(-x^2)','(x^2+1)*e^x','sqrt(x^2+1)','abs(x^3)^(1/3)','tanh(2^x)']);
 for(const [f,oracle,xs] of cases){const r=derive(f);for(const x of xs)close(numeric(r.exact!,x),oracle(x),f+' en '+x);katex.renderToString(r.latex,{throwOnError:true});
  if(studies.has(f)){const s=study(f);for(const x of xs){close(numeric(s.exact!,x),oracle(x),'étude : '+f+' en '+x);close(numeric(s.plot!.derivative,x),oracle(x),'tangente : '+f+' en '+x);}}
 }
});

test('dérivées successives : 100 valeurs et coefficients rationnels exacts',()=>{
 const xs=[-3,-1,.5,1,3];
 const cases:[string,number,(x:number)=>number][]=[
  ['ln(x)',2,x=>-1/x**2],['ln(x)',3,x=>2/x**3],
  ['ln(x)/x',2,x=>(2*Math.log(x)-3)/x**3],['ln(x)/x',3,x=>(11-6*Math.log(x))/x**4],
  ['exp(-x^2)',2,x=>(4*x*x-2)*Math.exp(-x*x)],['exp(-x^2)',3,x=>(12*x-8*x**3)*Math.exp(-x*x)],
  ['(x^2+1)*exp(x)',2,x=>(x*x+4*x+3)*Math.exp(x)],['(x^2+1)*exp(x)',3,x=>(x*x+6*x+7)*Math.exp(x)],
  ['(x+1)/(x-1)',2,x=>4/(x-1)**3],['(x+1)/(x-1)',3,x=>-12/(x-1)**4],
  ['x^(-1/3)',2,x=>4/(9*Math.cbrt(x)**7)],['x^(-1/3)',3,x=>-28/(27*Math.cbrt(x)**10)],
  ['sqrt(x^2+1)',2,x=>1/(x*x+1)**1.5],['sqrt(x^2+1)',3,x=>-3*x/(x*x+1)**2.5],
  ['abs(x)^2',2,()=>2],['abs(x)^2',3,()=>0],
  ['(x^3)^(1/3)',2,()=>0],['(x^3)^(1/3)',3,()=>0],
  ['tanh(x)',2,x=>-2*Math.tanh(x)/Math.cosh(x)**2],['tanh(x)',3,x=>(4*Math.tanh(x)**2-2/Math.cosh(x)**2)/Math.cosh(x)**2]
 ];
 for(const [f,order,oracle] of cases){const r=derive(f,order),points=f.startsWith('ln')?[.1,.5,1,2,5]:f.includes('/(x-1)')?[-3,-1,0,2,3]:xs;for(const x of points)close(numeric(r.exact!,x),oracle(x),f+' ordre '+order+' en '+x);assert.equal(r.steps.find(s=>s.title==='Obtenir la dérivée')!.latex,r.latex);}
 assert.equal(cas.simplify('('+derive('x^(-1/3)',2).exact+')-4/9*x^(-7/3)').toString(),'0');
});

test('domaines : crochets ouverts, fermés, unions et valeurs interdites conservées',()=>{
 const cases:[string,string][]=[
  ['x^2',']-\\infty;+\\infty['],['ln(x)',']0;+\\infty['],['sqrt(x)','[0;+\\infty['],
  ['ln(2*x+1)',']-\\frac{1}{2};+\\infty['],['ln(-2*x+4)',']-\\infty;2['],
  ['1/(x-1)',']-\\infty;1[\\;\\cup\\;]1;+\\infty['],
  ['(x-1)/(x-1)',']-\\infty;1[\\;\\cup\\;]1;+\\infty['],
  ['sqrt(4-x^2)','[-2;2]'],['1/sqrt(4-x^2)',']-2;2['],
  ['sqrt(x^2-2)',']-\\infty;-\\sqrt{2}]\\;\\cup\\;[\\sqrt{2};+\\infty['],
  ['ln(x^2-2)',']-\\infty;-\\sqrt{2}[\\;\\cup\\;]\\sqrt{2};+\\infty['],
  ['ln((x-1)/(x+2))',']-\\infty;-2[\\;\\cup\\;]1;+\\infty['],
  ['sqrt(x^2-1)/(x-2)',']-\\infty;-1]\\;\\cup\\;[1;2[\\;\\cup\\;]2;+\\infty['],
  ['x^(1/3)',']-\\infty;+\\infty['],['x^(-1/3)',']-\\infty;0[\\;\\cup\\;]0;+\\infty['],
  ['x^(-1/2)',']0;+\\infty['],['asin(x)','[-1;1]'],['acos(2*x)','[-\\frac{1}{2};\\frac{1}{2}]'],
  ['sqrt(-x^2)','[0;0]'],['sqrt(-1)','\\varnothing'],['ln(1e-400)',']-\\infty;+\\infty['],
  ['e^ln(x)',']0;+\\infty['],['ln(sqrt(x)-2)',']4;+\\infty[']
 ];
 for(const [f,expected] of cases){const d=domainTex(expression(f));assert.equal(d,'D='+expected,f);katex.renderToString(d,{throwOnError:true});}
 for(const f of ['tan(x)','tan(-2*x+3)','ln(sin(x))','sqrt(cos(2*x+1))']){const d=domainTex(expression(f));assert.ok(d.includes('\\bigcup'),f);katex.renderToString(d,{throwOnError:true});}
 const unresolved=domainTex(expression('sqrt(cos(x)-x)'));assert.ok(unresolved.includes('\\middle|'));katex.renderToString(unresolved,{throwOnError:true});
});

test('fonction, dérivée et tangente : distinguer domaine et points non dérivables',()=>{
 const cusp=study('abs(x^3)^(1/3)');assert.equal(cusp.analysis!.domain,'D=]-\\infty;+\\infty[');assert.ok(cusp.analysis!.derivativeDomain!.includes(']0;'));assert.deepEqual(cusp.analysis!.critical.map(p=>[p.x,p.y,p.kind]),[[0,0,'minimum']]);assert.equal(probePlot(cusp.plot!.expression,cusp.plot!.derivative,0).slope,null);
 const root=study('sqrt(x)');assert.equal(root.analysis!.domain,'D=[0;+\\infty[');assert.ok(root.analysis!.derivativeDomain!.endsWith(']0;+\\infty['));assert.equal(probePlot(root.plot!.expression,root.plot!.derivative,0).slope,null);
 const hole=study('(x^2-1)/(x-1)');assert.ok(!hole.analysis!.domain.includes('[1;'));assert.equal(probePlot(hole.plot!.expression,hole.plot!.derivative,1).slope,null);
 const cube=study('(x^3)^(1/3)');close(probePlot(cube.plot!.expression,cube.plot!.derivative,0).slope!,1,'racine cubique de x³ en zéro');
 const square=derive('abs(x)^2');close(numeric(square.exact!,0),0,'carré de |x| en zéro');
 const smooth=study('abs(x^2)');close(probePlot(smooth.plot!.expression,smooth.plot!.derivative,0).slope!,0,'tangente à |x²| en zéro');
});

test('saisie mathématique : puissances de ln et fonctions trigonométriques',()=>{
 for(const [latex,oracle] of [['\\ln^2(x)',(x:number)=>2*Math.log(x)/x],['\\ln^2\\left(x^2+1\\right)',(x:number)=>4*x*Math.log(x*x+1)/(x*x+1)],['\\sin^2(x)',(x:number)=>2*Math.sin(x)*Math.cos(x)]] as const){const r=derive(editorExpression(latex));for(const x of [.5,1,2,3])close(numeric(r.exact!,x),oracle(x),latex);}
 const unparenthesized=derive('ln² x²');for(const x of [.5,1,2,3])close(numeric(unparenthesized.exact!,x),4*Math.log(x*x)/x,'ln² x²');
});
