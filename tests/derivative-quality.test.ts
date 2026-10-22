import test from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import oracle from './oracles/derivatives.json';
import {differentiate,derivativeTex} from '../src/engine/differentiation';
import {checkDerivative,forwardDerivative} from '../src/engine/derivative-check';
import {expression,numeric,parse,source,math,domainTex,evaluateNode} from '../src/engine/expression';
import {editorExpression} from '../src/math-notation';
import {solve} from '../src/engine/index';
import {probePlot} from '../src/engine/plot';

const close=(a:number,b:number,label:string)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=2e-9*Math.max(1e-12,Math.abs(b))+2e-12,label+': '+a+' ≠ '+b);
test('fonctions composées : 3 093 références SymPy indépendantes aux ordres 1 à 3',()=>{
 const derivatives=new Map<string,string>();let checks=0;
 for(const c of oracle.cases){
  let d=c.expression;
  for(let order=1;order<=c.order;order++){
   const key=c.expression+'#'+order;
   if(!derivatives.has(key))try{derivatives.set(key,differentiate(d));}catch(e){assert.fail(key+' : '+(e as Error).message);}
   d=derivatives.get(key)!;
  }
  katex.renderToString(derivativeTex(d),{throwOnError:true});
  const tree=parse(d);
  for(const {x,value}of c.values){const [n,q='1']=x.split('/');close(evaluateNode(tree,{x:Number(n)/Number(q)}),Number(value),c.expression+' ordre '+c.order+' en '+x);checks++;}
 }
 assert.equal(checks,oracle.checks);assert.equal(oracle.checks,3093);
});

test('racines de quotients : branches négatives, domaine et tangentes conservés',()=>{
 const f='sqrt((x+1)/(x-1))',d=differentiate(f),read=expression(editorExpression(derivativeTex(d)));
 for(const x of [-8,-3,-1.2,1.2,3,8]){
  const expected=-1/((x-1)**2*Math.sqrt((x+1)/(x-1)));
  close(numeric(d,x),expected,'dérivée');close(numeric(read,x),expected,'formule affichée');close(probePlot(f,d,x).slope!,expected,'tangente');
 }
 assert.equal(domainTex(f),'D=]-\\infty;-1]\\;\\cup\\;]1;+\\infty[');
 assert.equal(domainTex([f,d]),'D=]-\\infty;-1[\\;\\cup\\;]1;+\\infty[');
 for(const x of [-1,0,1])assert.equal(probePlot(f,d,x).slope,null);
 assert.equal(checkDerivative(f,'0').matches,false);
 assert.equal(checkDerivative(f,'-1/(sqrt(x+1)*sqrt(1/(x-1))*(x-1)^2)').matches,false);
 assert.equal(checkDerivative(f,d).matches,true);
 close(numeric(differentiate(differentiate('cbrt(x^6)')),0),2,'racine cubique de x⁶ : dérivée seconde en zéro');
});

test('formules réduites, signes usuels, radicaux entiers et exponentielles lisibles',()=>{
 const cases:[string,string,number[]][]=[
  ['x*ln(x)/(x-1)','(x-1-ln(x))/(x-1)^2',[.2,.5,2,5]],
  ['exp(x)/(1+exp(x))','exp(x)/(1+exp(x))^2',[-4,-1,0,1,4]],
  ['x^2*exp(x)/(x+1)','x*exp(x)*(x^2+2*x+2)/(x+1)^2',[-3,-.5,0,1,3]],
  ['ln(x)^2/x','ln(x)*(2-ln(x))/x^2',[.2,.5,1,2,4]],
  ['sqrt((x-2)*(x+1))','(2*x-1)/(2*sqrt((x-2)*(x+1)))',[-4,-2,3,5]]
 ];
 for(const [f,expected,xs]of cases){
  const d=differentiate(f),latex=derivativeTex(d),roundtrip=expression(editorExpression(latex));
  assert.ok(!/\+\s*-|\+\s*\\left\(-/.test(latex),latex);
  for(const x of xs){close(numeric(d,x),numeric(expected,x),f);close(numeric(roundtrip,x),numeric(expected,x),'relecture : '+f);}
  katex.renderToString(latex,{throwOnError:true});
 }
 assert.match(derivativeTex(differentiate('x*ln(x)/(x-1)')),/ x-\\ln.*-1/);
 assert.match(derivativeTex(differentiate('x^2*exp(x)/(x+1)')),/x\}\^\{2\}\+2/);
 assert.match(derivativeTex(differentiate('exp(-x^2)')),/^-2.*e\^/);
});

test('étapes : calcul réel de u′ et v′, composée et dérivées successives',()=>{
 for(const f of ['x*ln(x)/(x-1)','sqrt((x+1)/(x-1))','exp(sin(x^2))']){
  const r=solve({operation:'derivative',expression:f,params:{order:'1'}}),detail=r.steps.find(s=>/Dériver (le numérateur|la fonction intérieure)/.test(s.title));
  assert.ok(detail?.latex?.includes("u'(x)="),f);
  for(const step of r.steps)if(step.latex)katex.renderToString(step.latex,{throwOnError:true});
  assert.equal(r.steps.find(s=>s.title==='Obtenir la dérivée')!.latex,r.latex);
 }
 const higher=solve({operation:'derivative',expression:'ln(x)',params:{order:'3'}});
 assert.equal(higher.steps.filter(s=>s.title.startsWith('Calculer la dérivée d’ordre')).length,2);
});

test('contrôle automatique indépendant et sérialisation des sommes à plusieurs termes',()=>{
 const terms=['x','2','3','4'].map(v=>math.parse(v));
 const sum=new math.OperatorNode('+','add',terms),product=new math.OperatorNode('*','multiply',terms);
 close(numeric(source(sum),5),14,'somme à quatre termes');close(numeric(source(product),5),120,'produit à quatre termes');
 close(forwardDerivative(parse('exp(x)/(1+exp(x))'),.7).slope,Math.exp(.7)/(1+Math.exp(.7))**2,'mode direct');
 assert.equal(checkDerivative('exp(x)/(1+exp(x))','exp(x)').matches,false);
 assert.equal(checkDerivative('sin(x^2)','cos(x^2)').matches,false);
 assert.equal(checkDerivative('ln(x)',differentiate('ln(x)')).matches,true);
 assert.throws(()=>expression('x+'.repeat(300)+'1'),/600/);
 assert.throws(()=>expression('x+'.repeat(95)+'1'),/longue/);
 let reads=0;
 const leaf=()=>({isConstantNode:true,value:{valueOf:()=>{reads++;return 1;}}});
 let chain:any=leaf();for(let i=0;i<12;i++)chain={isOperatorNode:true,op:'+',args:[chain,leaf()]};
 assert.equal(evaluateNode(chain),13);assert.equal(reads,13,'chaque terme est évalué une seule fois');
 reads=0;assert.equal(forwardDerivative(chain,0).value,13);assert.equal(reads,13);
});
