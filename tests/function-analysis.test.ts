import {test} from 'node:test';
import assert from 'node:assert/strict';
import katex from 'katex';
import {solve} from '../src/engine/index';
import {expression,cas,asReal} from '../src/engine/expression';
import {samplePlot,probePlot} from '../src/engine/plot';
import {editorExpression,editorLatex} from '../src/math-notation';
import {validateState,snapshot,defaultRequest} from '../src/store';
const study=(f:string,xmin='-5',xmax='5')=>solve({operation:'function',expression:f,params:{xmin,xmax}});
const close=(a:number,b:number,tolerance=1e-9)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),a+' ≠ '+b);
test('saisie visuelle : fractions imbriquées, ln, exponentielles, racines et relations',()=>{
 const cases:[string,string][]=[['\\frac{2}{3}+\\frac{1}{4}','11/12'],['\\frac{\\ln(e^2)}{\\sqrt{4}}','1'],['e^{\\ln(3)}','3'],['\\sqrt[3]{-8}','-2'],['\\log_{10}(100)','2'],['\\frac{1}{1+\\frac{1}{2}}','2/3']];
 for(const [latex,expected] of cases)assert.equal(solve({operation:'calculate',expression:editorExpression(latex),params:{}}).exact,expected,latex);
 for(const raw of ['x²+1','ln x','e^(−x²)','(x^2+1)/(x-1)','√(3x+1)','∛x','1,5x']){
  const roundtrip=editorExpression(editorLatex(raw));
  for(const x of [2,3,4])close(asReal(cas(expression(roundtrip),{x:String(x)}).toString()),asReal(cas(expression(raw),{x:String(x)}).toString()));
 }
 assert.equal(solve({operation:'equation',expression:editorExpression('\\frac{x}{2}=3'),params:{}}).exact,'6');
 assert.ok(solve({operation:'inequality',expression:editorExpression('x^2\\leq4'),params:{}}).latex.includes('2'));
 assert.throws(()=>solve({operation:'calculate',expression:editorExpression('\\frac{\\placeholder{}}{2}'),params:{}}));
 assert.throws(()=>solve({operation:'calculate',expression:'e^ln(-1)',params:{}}));
 assert.ok(solve({operation:'calculate',expression:'e^ln(x)',params:{}}).steps.some(s=>s.latex?.includes('>0')));
});
test('étude rationnelle : extrema, asymptotes verticale et oblique, domaine initial',()=>{
 const r=study('(x^2+1)/(x-1)'),a=r.analysis!;
 assert.equal(a.variation,'global');assert.equal(a.zerosComplete,true);assert.equal(a.zeros.length,0);
 assert.deepEqual(a.critical.map(p=>p.kind),['maximum','minimum']);
 close(a.critical[0].x,1-Math.SQRT2);close(a.critical[0].y,2-2*Math.SQRT2);
 close(a.critical[1].x,1+Math.SQRT2);close(a.critical[1].y,2+2*Math.SQRT2);
 const vertical=a.asymptotes.find(v=>v.kind==='vertical')!,oblique=a.asymptotes.find(v=>v.kind==='oblique')!;
 close(vertical.x!,1);close(oblique.slope!,1);close(oblique.intercept!,1);
 const hole=study('(x-1)/(x-1)');assert.equal(hole.analysis!.asymptotes.some(v=>v.kind==='vertical'),false);assert.ok(hole.analysis!.domain.includes('\\ne'));assert.ok(hole.analysis!.stationaryIdentity);
});
test('ln(x)/x : zéro, maximum exact, inflexion, limites et convexité',()=>{
 const a=study('ln(x)/x').analysis!;assert.equal(a.variation,'global');assert.equal(a.zerosComplete,true);close(a.zeros[0].x,1);
 assert.equal(a.critical[0].kind,'maximum');assert.equal(a.critical[0].exact,true);close(a.critical[0].x,Math.E);close(a.critical[0].y,1/Math.E);
 close(a.inflections[0].x,Math.exp(1.5));close(a.inflections[0].y,1.5*Math.exp(-1.5));assert.equal(a.inflections[0].exact,true);
 assert.ok(a.asymptotes.some(v=>v.kind==='vertical'&&v.x===0));assert.ok(a.asymptotes.some(v=>v.kind==='horizontal'&&v.intercept===0));
 assert.ok(a.limits.some(v=>v.latex.includes('0^+')&&v.latex.includes('-\\infty')));assert.equal(a.curvature!.global,true);
});
test('polynômes cubiques : facteurs exacts et trois racines approchées vérifiées',()=>{
 const factored=study('x^3-x').analysis!;assert.equal(factored.zerosComplete,true);assert.deepEqual(factored.zeros.map(p=>p.x),[-1,0,1]);assert.ok(factored.zeros.every(p=>p.exact));
 const cubic=study('x^3-3*x+1','-4','4').analysis!;
 const expected=[2*Math.cos(8*Math.PI/9),2*Math.cos(4*Math.PI/9),2*Math.cos(2*Math.PI/9)];
 assert.equal(cubic.zerosComplete,false);assert.equal(cubic.zeros.length,3);cubic.zeros.forEach((p,i)=>{close(p.x,expected[i]);close(p.x**3-3*p.x+1,0);assert.equal(p.exact,false);});
 assert.equal(cubic.variation,'global');assert.deepEqual(cubic.critical.map(p=>[p.x,p.y,p.kind]),[[-1,3,'maximum'],[1,-1,'minimum']]);close(cubic.inflections[0].x,0);close(cubic.inflections[0].y,1);
});
test('exponentielles : maxima, inflexions et aucune racine créée par sous-dépassement',()=>{
 const a=study('x*e^(-x)').analysis!;close(a.zeros[0].x,0);close(a.critical[0].x,1);close(a.critical[0].y,1/Math.E);close(a.inflections[0].x,2);
 const gaussian=study('e^(-x^2)').analysis!;assert.equal(gaussian.zeros.length,0);assert.equal(gaussian.zerosComplete,true);assert.equal(gaussian.critical[0].kind,'maximum');close(gaussian.critical[0].x,0);close(gaussian.critical[0].y,1);
 assert.equal(gaussian.inflections.length,2);gaussian.inflections.forEach(p=>close(Math.abs(p.x),1/Math.SQRT2));assert.ok(gaussian.asymptotes[0].direction.includes('−∞ et +∞'));
 // Underflow is reported as non-representable rather than a false root or a
 // completed study of a function whose values could not be evaluated.
 for(const f of ['e^x-1e-400','exp(x)-1e-400'])assert.throws(()=>study(f,'-1','1'),/Aucun point réel représentable/);
});
test('fonctions transcendantes : repérage borné et absence de preuve globale inventée',()=>{
 const sin=study('sin(x)','-4','4').analysis!;assert.equal(sin.variation,'window');assert.equal(sin.zerosComplete,false);assert.equal(sin.zeros.length,3);assert.equal(sin.inflections.length,3);
 assert.equal(sin.critical.length,2);close(sin.critical[0].x,-Math.PI/2);close(sin.critical[1].x,Math.PI/2);assert.ok(sin.critical.every(v=>!v.exact));
 const log=study('ln(x)/(x+1)','0.1','5').analysis!;assert.equal(log.variation,'window');close(log.critical[0].x,3.591121476668622);assert.equal(log.critical[0].exact,false);
 const abs=study('abs(x)').analysis!;assert.ok(abs.curvature!.rows.every(row=>!row[0].includes('−∞ ; +∞')));assert.equal(probePlot(expression('abs(x)'),'sign(x)',0).slope,null);
});
test('graphe adaptatif : aucune liaison à travers les pôles ou un trou',()=>{
 for(const f of ['1/(x-0.12345)','(x-0.12345)/(x-0.12345)','tan(x)']){
  const raw=expression(f),d=cas.diff(raw,'x').toString(),p=samplePlot(raw,d,-2,2);let last:number[]|null=null;
  const forbidden=f.includes('tan')?[-Math.PI/2,Math.PI/2]:[.12345];
  for(const point of p.points){if(last&&point)for(const cut of forbidden)assert.ok(!(last[0]<cut&&point[0]>cut),f+' traverse '+cut);last=point;}
  assert.ok(p.points.includes(null),f);
 }
 const p=samplePlot(expression('1/x'),'-x^(-2)',-5,5,[0]);assert.ok(p.yRange.every(v=>Math.abs(v)<10));
 const tiny=samplePlot(expression('1e-30*x'),expression('1e-30'),-5,5);assert.ok(tiny.yRange[1]-tiny.yRange[0]<1e-28);
 assert.throws(()=>samplePlot('x','1',5,-5));assert.throws(()=>samplePlot('x','1',0,1e7));
 const point=probePlot(expression('ln(x)/x'),expression('(1-ln(x))/x^2'),2);close(point.y!,Math.log(2)/2);close(point.slope!,(1-Math.log(2))/4);
 assert.equal(probePlot(expression('ln(x)/x'),expression('(1-ln(x))/x^2'),0).y,null);
});
test('toutes les nouvelles formules de l’étude passent le rendu mathématique',()=>{
 for(const f of ['ln(x)/x','(x^2+1)/(x-1)','e^(-x^2)','sin(x)','sqrt(x)','abs(x)']){
  const a=study(f).analysis!,texes=[a.domain,a.derivative,a.secondDerivative,...a.zeros.map(p=>p.latex),...a.critical.map(p=>p.latex),...a.inflections.map(p=>p.latex),...a.limits.map(v=>v.latex),...a.asymptotes.map(v=>v.latex)];
  for(const tex of texes)if(tex)katex.renderToString(tex,{throwOnError:true});
 }
});
test('les brouillons visuels et les anciennes sauvegardes v2 restent compatibles',()=>{
 const base=snapshot(),draft=defaultRequest('function');draft.params.mathLatex='\\frac{\\ln(x)}{x}';draft.expression='(ln (x))/(x)';draft.params.mathSource=draft.expression;
 assert.deepEqual(validateState({...base,draft}).draft,draft);assert.doesNotThrow(()=>validateState(base));
 assert.throws(()=>validateState({...base,draft:{...draft,params:{mathLatex:'x'.repeat(6001)}}}));
 assert.throws(()=>validateState({...base,draft:{...draft,params:{xmin:'x'.repeat(601)}}}));
});
