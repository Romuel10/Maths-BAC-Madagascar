import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {solve} from '../src/engine/index';
import {numeric,expression,domainTex} from '../src/engine/expression';
import {derivativeTex} from '../src/engine/differentiation';
import {editorExpression} from '../src/math-notation';
import {probePlot} from '../src/engine/plot';

const derive=(f:string,order=1)=>solve({operation:'derivative',expression:f,params:{order:String(order)}});
const close=(a:number,b:number,label:string)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(b)),label+': '+a+' ≠ '+b);
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):Math.abs(a);

test('racines : 1 104 valeurs de dérivées des ordres 1 à 3, avec un oracle indépendant',()=>{
 const polynomials:[string,(x:number)=>number,(x:number)=>number,(x:number)=>number][]=[['2*x-1',x=>2*x-1,()=>2,()=>0],['x^2-2*x-3',x=>x*x-2*x-3,x=>2*x-2,()=>2]];
 let checks=0;
 for(const q of [2,3,4,5,6,7])for(const p of [-5,-2,-1,1,2,5])for(const [u,value,du,ddu] of polynomials){
  if(gcd(Math.abs(p),q)!==1)continue;
  const f='('+u+')^('+p+'/'+q+')',r=p/q;
  for(const order of [1,2,3]){
   const result=derive(f,order);katex.renderToString(result.latex,{throwOnError:true});
   for(const x of [-5,-2,-.5,0,.5,1,2,4,8]){
    const v=value(x);if(v===0||q%2===0&&v<0)continue;
    // Evaluate each integer power of the real qth root, independently of
    // the application's parser, derivative and rational-power evaluator.
    const root=v<0?-Math.pow(-v,1/q):Math.pow(v,1/q),pow=(k:number)=>root**(p-k*q);
    const expected=order===1?r*du(x)*pow(1):order===2?r*(r-1)*du(x)**2*pow(2)+r*ddu(x)*pow(1):r*(r-1)*(r-2)*du(x)**3*pow(3)+3*r*(r-1)*du(x)*ddu(x)*pow(2);
    close(numeric(result.exact!,x),expected,f+' ordre '+order+' en '+x);checks++;
   }
  }
 }
 assert.equal(checks,1104);
});
test('fractions et radicaux affichés : relire la formule donne les mêmes valeurs',()=>{
 const cases:[string,number[]][]=[['sqrt(x)',[.1,1,4]],['1/sqrt(x)',[.1,1,4]],['sqrt(x^2+1)',[-3,0,4]],['cbrt(x)',[-8,-1,1,8]],['x^(2/3)',[-8,-1,1,8]],['sqrt(sqrt(x))',[.1,1,4]],['ln(sqrt(x^2+1))',[-3,0,4]],['x/sqrt(x^2+1)',[-3,0,4]],['sqrt(x+sqrt(x+1))',[0,1,4]]];
 for(const [f,xs] of cases){const r=derive(f),tex=derivativeTex(r.exact!),read=editorExpression(tex);katex.renderToString(tex,{throwOnError:true});for(const x of xs)close(numeric(expression(read),x),numeric(r.exact!,x),'formule affichée : '+f);assert.ok(!tex.includes('\\frac{-'),f);}
 assert.match(derive('sqrt(x)').latex,/\\frac\{1\}.*\\sqrt/);
 assert.match(derive('cbrt(x)').latex,/\\sqrt\[3\]/);
 assert.match(derive('sqrt(sqrt(x))').latex,/\\sqrt\[4\]/);
 const original=derive('(x^2-1)/(x-1)');assert.match(original.steps[0].latex!,/\\frac/);assert.match(original.steps[1].latex!,/1/);
 const chain=derive('sqrt(x^2+1)').steps.find(s=>s.title==='Dériver la racine composée')!;assert.ok(chain);katex.renderToString(chain.latex!,{throwOnError:true});
});
test('zéro : racine lisse, vraie pointe et tangente sont distinguées',()=>{
 for(const f of ['sqrt(x^6)','sqrt((x^3)^2)','abs(x)^3']){
  const first=derive(f),second=derive(f,2),third=derive(f,3);
  for(const x of [-3,-1,0,1,3]){close(numeric(first.exact!,x),3*x*Math.abs(x),f+' dérivée');close(numeric(second.exact!,x),6*Math.abs(x),f+' dérivée seconde');}
  assert.ok(!Number.isFinite(numeric(third.exact!,0)),f+' dérivée troisième inexistante en zéro');
  assert.equal(probePlot(expression(f),first.exact!,0).slope,0,f);
 }
 assert.equal(probePlot(expression('abs(x)'),'sign(x)',0).slope,null);
 assert.equal(probePlot(expression('sqrt(x^2)'),derive('sqrt(x^2)').exact!,0).slope,null);
 assert.equal(probePlot(expression('sqrt(x)'),derive('sqrt(x)').exact!,0).slope,null);
 assert.equal(probePlot(expression('(x^2-1)/(x-1)'),derive('(x^2-1)/(x-1)').exact!,1).slope,null);
});
test('racines de puissances composées : branches réelles et domaines initiaux',()=>{
 const cases:[string,(x:number)=>number,number[]][]=[['sqrt(x^(2/3))',x=>Math.sign(x)/(3*Math.cbrt(x)**2),[-8,-1,1,8]],['sqrt((x^(1/3))^2)',x=>Math.sign(x)/(3*Math.cbrt(x)**2),[-8,-1,1,8]],['(x^(2/3))^(3/2)',Math.sign,[-8,-1,1,8]],['((x^2)^(2/3))^(3/4)',Math.sign,[-8,-1,1,8]],['(x^(3/2))^(2/3)',()=>1,[.1,.5,1,8]],['(x^(1/2))^2',()=>1,[.1,.5,1,8]],['cbrt(x^4)',x=>4*Math.cbrt(x)/3,[-8,-1,0,1,8]]];
 for(const [f,oracle,xs] of cases){const r=derive(f);for(const x of xs)close(numeric(r.exact!,x),oracle(x),f);katex.renderToString(r.latex,{throwOnError:true});}
 for(const f of ['(x^(1/2))^2','(x^(3/2))^(2/3)'])assert.equal(domainTex(expression(f)),'D=[0;+\\infty[');
});
test('saisie de racines indexées, arguments imbriqués et valeurs négatives',()=>{
 for(const degree of [2,3,4,5,6,7]){
  const latex='\\sqrt['+degree+']{x^2+1}',input=editorExpression(latex),r=derive(input);
  for(const x of [-3,-1,0,1,3])close(numeric(r.exact!,x),2*x/degree*(x*x+1)**(1/degree-1),latex);
 }
 const fifth=editorExpression('\\sqrt[5]{x}');close(numeric(derive(fifth).exact!,-32),1/80,'racine cinquième négative');
 const nested=editorExpression('\\sqrt[3]{\\sqrt{x^2}}');close(numeric(derive(nested).exact!,-8),-1/12,'racines imbriquées négatives');
 assert.throws(()=>derive('root(0)(x)'));assert.throws(()=>derive('root(10001)(x)'));
});
