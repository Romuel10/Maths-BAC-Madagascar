import {useId} from 'react';
import type {ResultChart as Chart} from '../engine/types';
const label=(n:number)=>Number(n.toPrecision(4)).toString();
export function ResultChart({chart:c}:{chart:Chart}){
 const id=useId().replaceAll(':',''),points=c.points.filter(p=>p.every(Number.isFinite));if(!points.length)return null;
 let xmin=Math.min(...points.map(p=>p[0])),xmax=Math.max(...points.map(p=>p[0])),ymin=Math.min(0,...points.map(p=>p[1])),ymax=Math.max(0,...points.map(p=>p[1]));
 if(!Number.isFinite(xmax-xmin)||!Number.isFinite(ymax-ymin))return <p className="note">Les données dépassent l’échelle du graphique. Consulte les valeurs exactes du tableau.</p>;
 if(xmin===xmax){xmin--;xmax++;}if(ymin===ymax){ymin--;ymax++;}const xpad=(xmax-xmin)*.08,ypad=(ymax-ymin)*.12;xmin-=xpad;xmax+=xpad;ymin-=ypad;ymax+=ypad;
 const px=(x:number)=>48+(x-xmin)/(xmax-xmin)*492,py=(y:number)=>238-(y-ymin)/(ymax-ymin)*212,ticks=Array.from({length:5},(_,i)=>i/4),bar=Math.min(36,380/points.length);
 return <figure className="result-chart"><figcaption>{c.label}</figcaption><svg viewBox="0 0 560 282" role="img" aria-label={c.label}><defs><clipPath id={id}><rect x="48" y="26" width="492" height="212"/></clipPath></defs>
 {ticks.map(t=>{const x=xmin+t*(xmax-xmin),y=ymin+t*(ymax-ymin);return <g key={t}><line className="grid-line" x1={48} x2={540} y1={py(y)} y2={py(y)}/><text x="42" y={py(y)+4} textAnchor="end">{label(y)}</text><text x={px(x)} y="260" textAnchor="middle">{label(x)}</text></g>;})}
 <line className="axis-line" x1="48" x2="540" y1={py(0)} y2={py(0)}/><g clipPath={'url(#'+id+')'}>
 {c.line&&<path className="tangent-line" fill="none" d={'M'+px(xmin)+','+py(c.line[0]*xmin+c.line[1])+'L'+px(xmax)+','+py(c.line[0]*xmax+c.line[1])}/>}
 {c.kind==='sequence'&&<path className="sequence-line" fill="none" d={points.map((p,i)=>(i?'L':'M')+px(p[0])+','+py(p[1])).join(' ')}/>}
 {points.map((p,i)=>c.kind==='bars'?<rect key={i} x={px(p[0])-bar/2} y={Math.min(py(p[1]),py(0))} width={bar} height={Math.abs(py(p[1])-py(0))} className="chart-bar"><title>{p[0]} : {p[1]}</title></rect>:<circle key={i} cx={px(p[0])} cy={py(p[1])} r="4.5" className="chart-point"><title>{p[0]} ; {p[1]}</title></circle>)}
 </g></svg><p>Représentation numérique. Les valeurs du tableau permettent une lecture précise.</p></figure>;
}
