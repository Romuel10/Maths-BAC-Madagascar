import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {solve} from '../src/engine/index';
import {asReal} from '../src/engine/expression';

const limit=(expression:string,point='0',side='auto')=>solve({operation:'limit',expression,params:{point,side}});
const close=(a:number,b:number)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(b)),a+' != '+b);
test('limites automatiques : point fini, fractions, décimales et constantes',()=>{
 const cases:[string,string,number][]=[['sin(x)/x','0',1],['(x^2-1)/(x-1)','1',2],['(exp(x)-1)/x','0',1],['x^2','1/2',.25],['x','0,5',.5],['cos(x)','pi',-1],['x^2','sqrt(2)',2],['cbrt(x)','-8',-2],['x^(2/3)','-8',4],['sqrt(x^2)','-3',3]];
 for(const [expression,point,expected] of cases){const r=limit(expression,point);close(asReal(r.exact!),expected);assert.match(r.latex,/\\lim/);katex.renderToString(r.latex,{throwOnError:true});for(const s of r.steps)if(s.latex)katex.renderToString(s.latex,{throwOnError:true});}
});
test('le domaine choisit le côté accessible, même sur un petit intervalle',()=>{
 for(const [expression,point,side] of [['sqrt(x)','0','right'],['sqrt(1-x)','1','left'],['sqrt(x*(1e-8-x))','0','right'],['sqrt(x*(1e-8-x))','1e-8','left'],['sqrt(2-x^2)','sqrt(2)','left']]){
  const r=limit(expression,point);assert.equal(r.exact,'0');assert.ok(r.latex.includes(side==='left'?'^-':'^+'),expression);assert.match(r.steps[1].text,/domaine/);
 }
 assert.throws(()=>limit('sqrt(x)','0','left'),/plus grandes/);
 assert.throws(()=>limit('sqrt(1-x)','1','right'),/plus petites/);
 assert.throws(()=>limit('sqrt(x)','0','both'),/plus grandes/);
 assert.throws(()=>limit('sqrt(-x^2)','0'),/ne peut pas s’approcher/);
 assert.throws(()=>limit('sqrt(x-3)','0'),/ne peut pas s’approcher/);
});
test('ln en zéro : infini négatif et domaine réel conservé',()=>{
 for(const [expression,point,suffix] of [['ln(x)','0','^+'],['ln(-x)','0','^-'],['ln(abs(x))','0',''],['ln(x-2)','2','^+'],['ln(sin(x))','0','^+'],['ln(sin(x))','pi','^-']]){
  const r=limit(expression,point);assert.equal(r.exact,'-Inf',expression);assert.match(r.latex,/-\\infty/);if(suffix)assert.ok(r.latex.includes(suffix),expression);
 }
 assert.throws(()=>limit('ln(x)','0','left'),/plus grandes/);
 assert.equal(limit('x*ln(x)','0').exact,'0');
});
test('les deux limites différentes sont expliquées sans réponse moyenne',()=>{
 for(const expression of ['1/x','abs(x)/x','1/(x-1e-9)']){
  const point=expression.includes('1e-9')?'1e-9':'0';
  for(const side of ['auto','both']){const r=limit(expression,point,side);assert.equal(r.title,'La limite n’existe pas');assert.equal(r.exact,undefined);assert.match(r.steps[1].latex!,/\^-/);assert.match(r.steps[1].latex!,/\^\+/);katex.renderToString(r.steps[1].latex!,{throwOnError:true});}
 }
 assert.equal(limit('1/x','0','left').exact,'-Inf');assert.equal(limit('1/x','0','right').exact,'Inf');
 assert.equal(limit('abs(x)/x','0','left').exact,'-1');assert.equal(limit('abs(x)/x','0','right').exact,'1');
 assert.equal(limit('1/x^2').exact,'Inf');
});
test('les infinis sont des destinations, indépendantes du côté conservé',()=>{
 const cases:[string,string,string][]=[['exp(x)','−∞','0'],['exp(x)','+∞','Inf'],['ln(x)','+∞','Inf'],['ln(-x)','-Infinity','Inf'],['(3*x^2+1)/(2*x^2-5)','+inf','3/2'],['ln(x)/x','Infinity','0'],['sin(x)/x','+∞','0']];
 for(const [expression,point,expected] of cases)for(const side of ['auto','both','left','right']){const r=limit(expression,point,side);assert.equal(r.exact,expected,expression);assert.ok(!r.latex.includes('^+')&&!r.latex.includes('^-'));}
 assert.throws(()=>limit('ln(x)','−∞'),/cet infini/);
 assert.throws(()=>limit('sqrt(1-x^2)','+∞'),/cet infini/);
});
test('une saisie incomplète ou un calcul indéterminé reste explicite',()=>{
 assert.throws(()=>limit('x',''),/Indique le nombre/);
 assert.throws(()=>limit('x','sqrt(-1)'),/nombre réel/);
 assert.throws(()=>limit('x','x'));
 assert.throws(()=>limit('x','0','invalide'),/approche/);
 assert.throws(()=>limit('sin(x)','+∞'),/n’a pas établi/);
 assert.throws(()=>limit('sin(1/x)','0'),/n’a pas établi/);
 assert.throws(()=>limit('floor(x)','0'),/discontinue/);
});
test('puissances réelles, valeurs absolues et formes indéterminées',()=>{
 const cases:[string,string,string,string][]=[['cbrt(x)','−∞','auto','-Inf'],['x^(2/3)','−∞','auto','Inf'],['x^(-2/3)','−∞','auto','0'],['sqrt(x^2)/x','−∞','auto','-1'],['sqrt(x^2)/x','+∞','auto','1'],['1/x^(2/3)','0','left','Inf'],['1/x^(2/3)','0','right','Inf'],['1/x^(1/3)','0','left','-Inf'],['1/x^(1/3)','0','right','Inf'],['ln(x^2)','0','auto','-Inf'],['ln(x)^2','0','auto','Inf']];
 for(const [expression,point,side,expected] of cases)assert.equal(limit(expression,point,side).exact,expected,expression+' at '+point+' '+side);
 close(asReal(limit('(exp(-1/x))^x','0','right').exact!),Math.exp(-1));
 close(asReal(limit('x^(1/ln(x))','+∞').exact!),Math.E);
 close(asReal(limit('x^(1/ln(x))','0').exact!),Math.E);
 assert.equal(limit('x^(1/x)','+∞').exact,'1');
 assert.equal(limit('x^0','+∞').exact,'1');
 assert.equal(limit('x*ln(x)','0').exact,'0');
});
