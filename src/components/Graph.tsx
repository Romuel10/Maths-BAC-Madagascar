import {useMemo,useState} from 'react';
import type {Result} from '../engine/types';
export function Graph({plot}:{plot:NonNullable<Result['plot']>}){
 const [selected,setSelected]=useState<number|null>(null);
 const view=useMemo(()=>{
  const values=plot.points.filter((p):p is number[]=>p!==null).map(p=>p[1]).sort((a,b)=>a-b);
  let lo=Math.min(0,values[Math.floor(values.length*.04)]??-1),hi=Math.max(0,values[Math.floor(values.length*.96)]??1);if(hi-lo<1e-12){lo-=1;hi+=1;}const gap=(hi-lo)*.12;lo-=gap;hi+=gap;
  const px=(x:number)=>40+(x-plot.xmin)/(plot.xmax-plot.xmin)*620,py=(y:number)=>260-(y-lo)/(hi-lo)*230;
  let d='',last:number[]|null=null;
  plot.points.forEach(p=>{if(!p||p[1]<lo||p[1]>hi){last=null;return;}const jump=last&&Math.abs(py(p[1])-py(last[1]))>130;d+=(!last||jump?'M':'L')+px(p[0]).toFixed(2)+','+py(p[1]).toFixed(2)+' ';last=p;});
  return {lo,hi,px,py,d};
 },[plot]);
 const point=selected===null?null:plot.points[selected];
 return <section className="graph-card"><div className="section-heading"><h3>Représentation graphique</h3><span>Toucher la courbe pour lire un point</span></div>
 <svg className="function-graph" viewBox="0 0 700 300" role="img" aria-label="Courbe de la fonction dans la fenêtre choisie" onPointerMove={e=>{const rect=e.currentTarget.getBoundingClientRect();const ratio=((e.clientX-rect.left)/rect.width*700-40)/620;setSelected(Math.max(0,Math.min(plot.points.length-1,Math.round(ratio*(plot.points.length-1)))));}}>
 <defs><pattern id="graph-grid" width="62" height="46" patternUnits="userSpaceOnUse"><path d="M62 0H0V46" fill="none" stroke="currentColor" strokeOpacity=".12"/></pattern><clipPath id="graph-clip"><rect x="40" y="25" width="620" height="240"/></clipPath></defs>
 <rect x="40" y="25" width="620" height="240" fill="url(#graph-grid)"/>
 {plot.xmin<=0&&plot.xmax>=0&&<line x1={view.px(0)} x2={view.px(0)} y1="25" y2="265" stroke="currentColor" opacity=".35"/>}
 {view.lo<=0&&view.hi>=0&&<line x1="40" x2="660" y1={view.py(0)} y2={view.py(0)} stroke="currentColor" opacity=".35"/>}
 <path d={view.d} stroke="var(--accent)" strokeWidth="2.7" fill="none" clipPath="url(#graph-clip)"/>
 <text x="40" y="290">{plot.xmin}</text><text x="650" y="290">{plot.xmax}</text><text x="8" y="30">{Number(view.hi.toPrecision(3))}</text><text x="8" y="260">{Number(view.lo.toPrecision(3))}</text>
 {point&&point[1]>=view.lo&&point[1]<=view.hi&&<circle cx={view.px(point[0])} cy={view.py(point[1])} r="5" fill="var(--accent)" stroke="var(--paper)" strokeWidth="2"/>}
 </svg><p className="graph-readout">{point?'x ≈ '+point[0].toPrecision(5)+'  ·  f(x) ≈ '+point[1].toPrecision(6):'Fenêtre : ['+plot.xmin+' ; '+plot.xmax+'] · valeurs approchées'}</p></section>;
}
