export type ConicKind='ellipse'|'hyperbola-x'|'hyperbola-y'|'parabola-x'|'parabola-y';
export interface ConicAnalysis {
 kind:ConicKind; equation:string; center:string|null; vertices:string[]; foci:string[]; directrices:string[];
 eccentricity:number|null; asymptotes:string[]; parameter:number|null; checks:{label:string;ok:boolean;detail:string}[];
}
const fmt=(n:number)=>{if(Math.abs(n)<1e-12)n=0;const r=Math.round(n*1e10)/1e10;return Number.isInteger(r)?String(r):String(r);};
const finitePositive=(n:number)=>Number.isFinite(n)&&n>0;

export function analyzeEllipse(a:number,b:number):ConicAnalysis{
 if(!finitePositive(a)||!finitePositive(b))throw new Error('a et b doivent être strictement positifs.');
 const horizontal=a>=b,major=Math.max(a,b),minor=Math.min(a,b),c=Math.sqrt(Math.max(0,major*major-minor*minor)),e=c/major;
 const equation=`x²/${fmt(a*a)} + y²/${fmt(b*b)} = 1`;
 const vertices=horizontal?[`(${fmt(a)},0)`,`(-${fmt(a)},0)`,`(0,${fmt(b)})`,`(0,-${fmt(b)})`]:[`(${fmt(a)},0)`,`(-${fmt(a)},0)`,`(0,${fmt(b)})`,`(0,-${fmt(b)})`];
 const foci=horizontal?[`(${fmt(c)},0)`,`(-${fmt(c)},0)`]:[`(0,${fmt(c)})`,`(0,-${fmt(c)})`];
 const directrices=c<1e-12?[]:horizontal?[`x=${fmt(major/e)}`,`x=-${fmt(major/e)}`]:[`y=${fmt(major/e)}`,`y=-${fmt(major/e)}`];
 return{kind:'ellipse',equation,center:'O(0,0)',vertices,foci,directrices,eccentricity:e,asymptotes:[],parameter:null,checks:[{label:'Relation focale',ok:Math.abs(c*c-(major*major-minor*minor))<1e-9,detail:`c²=a²−b²=${fmt(c*c)}`}]};
}

export function analyzeHyperbola(a:number,b:number,vertical=false):ConicAnalysis{
 if(!finitePositive(a)||!finitePositive(b))throw new Error('a et b doivent être strictement positifs.');
 const c=Math.sqrt(a*a+b*b),e=c/a;
 const equation=vertical?`y²/${fmt(a*a)} - x²/${fmt(b*b)} = 1`:`x²/${fmt(a*a)} - y²/${fmt(b*b)} = 1`;
 const vertices=vertical?[`(0,${fmt(a)})`,`(0,-${fmt(a)})`]:[`(${fmt(a)},0)`,`(-${fmt(a)},0)`];
 const foci=vertical?[`(0,${fmt(c)})`,`(0,-${fmt(c)})`]:[`(${fmt(c)},0)`,`(-${fmt(c)},0)`];
 const directrices=vertical?[`y=${fmt(a/e)}`,`y=-${fmt(a/e)}`]:[`x=${fmt(a/e)}`,`x=-${fmt(a/e)}`];
 const asymptotes=vertical?[`y=${fmt(a/b)}x`,`y=-${fmt(a/b)}x`]:[`y=${fmt(b/a)}x`,`y=-${fmt(b/a)}x`];
 return{kind:vertical?'hyperbola-y':'hyperbola-x',equation,center:'O(0,0)',vertices,foci,directrices,eccentricity:e,asymptotes,parameter:null,checks:[{label:'Relation focale',ok:Math.abs(c*c-(a*a+b*b))<1e-9,detail:`c²=a²+b²=${fmt(c*c)}`}]};
}

export function analyzeParabola(p:number,axis:'x'|'y'='x',direction:1|-1=1):ConicAnalysis{
 if(!finitePositive(p))throw new Error('Le paramètre p doit être strictement positif.');
 const sp=direction*p;
 const equation=axis==='x'?`y²=${fmt(4*sp)}x`:`x²=${fmt(4*sp)}y`;
 const focus=axis==='x'?`(${fmt(sp)},0)`:`(0,${fmt(sp)})`;
 const directrix=axis==='x'?`x=${fmt(-sp)}`:`y=${fmt(-sp)}`;
 return{kind:axis==='x'?'parabola-x':'parabola-y',equation,center:null,vertices:['O(0,0)'],foci:[focus],directrices:[directrix],eccentricity:1,asymptotes:[],parameter:sp,checks:[{label:'Définition foyer-directrice',ok:true,detail:`Foyer ${focus}, directrice ${directrix}.`}]};
}

export function conicTangent(analysis:ConicAnalysis,x0:number,y0:number):{onConic:boolean;equation:string|null;residual:number}{
 if(!Number.isFinite(x0)||!Number.isFinite(y0))return{onConic:false,equation:null,residual:NaN};
 let residual=Infinity,equation:string|null=null;
 const eq=analysis.equation;
 if(analysis.kind==='ellipse'){
  const m=eq.match(/^x²\/([^ ]+) \+ y²\/([^ ]+) = 1$/);if(!m)return{onConic:false,equation:null,residual};
  const a2=Number(m[1]),b2=Number(m[2]);residual=x0*x0/a2+y0*y0/b2-1;
  equation=`${fmt(x0/a2)}x + ${fmt(y0/b2)}y = 1`;
 }else if(analysis.kind==='hyperbola-x'||analysis.kind==='hyperbola-y'){
  const vertical=analysis.kind==='hyperbola-y';
  const m=eq.match(vertical?/^y²\/([^ ]+) - x²\/([^ ]+) = 1$/:/^x²\/([^ ]+) - y²\/([^ ]+) = 1$/);if(!m)return{onConic:false,equation:null,residual};
  const a2=Number(m[1]),b2=Number(m[2]);
  if(vertical){residual=y0*y0/a2-x0*x0/b2-1;equation=`${fmt(y0/a2)}y - ${fmt(x0/b2)}x = 1`;}
  else{residual=x0*x0/a2-y0*y0/b2-1;equation=`${fmt(x0/a2)}x - ${fmt(y0/b2)}y = 1`;}
 }else{
  const p=analysis.parameter!;
  if(analysis.kind==='parabola-x'){residual=y0*y0-4*p*x0;equation=`${fmt(y0)}y = ${fmt(2*p)}(x+${fmt(x0)})`;}
  else{residual=x0*x0-4*p*y0;equation=`${fmt(x0)}x = ${fmt(2*p)}(y+${fmt(y0)})`;}
 }
 const scale=Math.max(1,Math.abs(x0),Math.abs(y0));return{onConic:Math.abs(residual)<=1e-8*scale*scale,equation,residual};
}
