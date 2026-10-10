import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {redrawPlot,readPlotPoint} from '../client';
import {MathView} from './Math';
import type {Plot} from '../engine/types';
const label=(n:number)=>Number(n.toPrecision(6)).toString().replace('e+','e');
const mathNumber=(n:number)=>Number(n.toPrecision(8)).toString().replace(/e([+-]?\d+)/,'\\times10^{$1}');
function ticks(a:number,b:number,count:number){const step=b/count-a/count,power=10**Math.floor(Math.log10(step));if(!Number.isFinite(power)||power===0)return [0];const u=step/power,size=(u<1.5?1:u<3?2:u<7?5:10)*power;return Array.from({length:Math.min(20,Math.ceil(b/size-a/size)+1)},(_,i)=>(Math.ceil(a/size)+i)*size).filter(x=>x>=a&&x<=b);}
const names={zero:'Zéro',minimum:'Minimum local',maximum:'Maximum local',stationary:'Point stationnaire',inflection:'Inflexion'};
export function Graph({plot}:{plot:Plot}){
 const clip=useId().replaceAll(':',''),[data,setData]=useState(plot),[bounds,setBounds]=useState([String(plot.xmin),String(plot.xmax)]);
 const [yrange,setYrange]=useState<[number,number]|null>(null),[ybounds,setYbounds]=useState(['','']);
 const [error,setError]=useState(''),[loading,setLoading]=useState(false),[selected,setSelected]=useState<number|null>(null),[xinput,setXinput]=useState('0');
 const [point,setPoint]=useState<{x:number;y:number|null;slope:number|null}|null>(null),[tangent,setTangent]=useState(false),[markers,setMarkers]=useState(true),[asymptotes,setAsymptotes]=useState(true);
 const version=useRef(0),reading=useRef(0);
 const surface=useRef<HTMLDivElement>(null),drag=useRef<{x:number;y:number;xmin:number;xmax:number}|null>(null),dragged=useRef(false),[width,setWidth]=useState(720);
 useLayoutEffect(()=>{const el=surface.current!;const resize=()=>setWidth(Math.max(240,el.clientWidth));resize();const observer=new ResizeObserver(resize);observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>()=>{version.current++;reading.current++;},[]);
 const view=useMemo(()=>{
  let [lo,hi]=data.yRange;
  for(const p of plot.markers)if(p.x>=data.xmin&&p.x<=data.xmax){lo=Math.min(lo,p.y);hi=Math.max(hi,p.y);}
  if(hi===lo){const gap=Math.abs(lo)*.1||1;lo-=gap;hi+=gap;}
  const gap=(hi/2-lo/2)*.24;lo=Math.max(-Number.MAX_VALUE,lo-gap);hi=Math.min(Number.MAX_VALUE,hi+gap);if(yrange)[lo,hi]=yrange;
  const height=Math.min(420,Math.max(260,width*.52)),left=55,right=width-16,top=22,bottom=height-36;
  const magnitude=Math.max(Math.abs(lo),Math.abs(hi),Number.MIN_VALUE);
  const px=(x:number)=>left+(x-data.xmin)/(data.xmax-data.xmin)*(right-left),py=(y:number)=>bottom-Math.max(-1e4,Math.min(1e4,(y/magnitude-lo/magnitude)/(hi/magnitude-lo/magnitude)))*(bottom-top);
  let path='',last=false;for(const p of data.points){if(!p){last=false;continue;}const x=px(p[0]),y=py(p[1]);if(!Number.isFinite(x)||!Number.isFinite(y)){last=false;continue;}path+=(last?'L':'M')+x.toFixed(2)+','+y.toFixed(2)+' ';last=true;}
  return {lo,hi,px,py,path,width,height,left,right,top,bottom,xticks:ticks(data.xmin,data.xmax,width<480?4:8),yticks:ticks(lo,hi,width<480?4:6)};
 },[data,plot.markers,yrange,width]);
 async function windowTo(a:number,b:number){
  if(!Number.isFinite(a)||!Number.isFinite(b)||a>=b||b-a>1e6){setError('Choisis deux bornes croissantes, de largeur au plus égale à 1 000 000.');return;}
  const id=++version.current;setLoading(true);setError('');reading.current++;setPoint(null);setSelected(null);
  try{const next=await redrawPlot(plot,a,b);if(id!==version.current)return;setData({...plot,...next});setBounds([String(a),String(b)]);setYrange(null);setYbounds(['','']);}catch(e){if(id===version.current)setError(e instanceof Error?e.message:'La courbe n’a pas pu être tracée.');}finally{if(id===version.current)setLoading(false);}
 }
 useEffect(()=>{
  const id=++reading.current;setPoint(null);if(selected===null)return;
  const timer=setTimeout(()=>{void readPlotPoint(plot,selected).then(value=>{if(id===reading.current)setPoint(value);}).catch(e=>{if(id===reading.current)setError(e instanceof Error?e.message:'Lecture impossible.');});},90);
  return()=>clearTimeout(timer);
 },[selected,plot]);
 const select=(x:number)=>{setSelected(x);setXinput(label(x));};
 const zoom=(factor:number)=>{const center=selected!==null&&selected>=data.xmin&&selected<=data.xmax?selected:(data.xmin+data.xmax)/2,half=(data.xmax-data.xmin)*factor/2;void windowTo(center-half,center+half);};
 const pan=(direction:number)=>{const shift=(data.xmax-data.xmin)*.3*direction;void windowTo(data.xmin+shift,data.xmax+shift);};
 const line=(slope:number,intercept:number)=>'M'+view.px(data.xmin)+','+view.py(slope*data.xmin+intercept)+'L'+view.px(data.xmax)+','+view.py(slope*data.xmax+intercept);
 const xAt=(clientX:number,svg:SVGSVGElement)=>{const rect=svg.getBoundingClientRect(),ratio=((clientX-rect.left)/rect.width*view.width-view.left)/(view.right-view.left);return data.xmin+Math.max(0,Math.min(1,ratio))*(data.xmax-data.xmin);};
 return <section className="graph-card" aria-busy={loading}>
  <div className="section-heading"><div><p className="eyebrow">EXPLORATION NUMÉRIQUE</p><h3>La fonction, en mouvement.</h3></div><span className="graph-status">{loading?'Nouveau tracé…':'Courbe interactive'}</span></div>
  <div className="graph-toolbar"><div role="group" aria-label="Navigation du graphique"><button type="button" aria-label="Zoom avant" disabled={loading} onClick={()=>zoom(.5)}>+</button><button type="button" aria-label="Zoom arrière" disabled={loading} onClick={()=>zoom(2)}>−</button><button type="button" aria-label="Déplacer la fenêtre à gauche" disabled={loading} onClick={()=>pan(-1)}>←</button><button type="button" aria-label="Déplacer la fenêtre à droite" disabled={loading} onClick={()=>pan(1)}>→</button></div><button type="button" className="text-button" disabled={loading} onClick={()=>void windowTo(plot.xmin,plot.xmax)}>Réinitialiser</button></div>
  <div className="graph-surface" ref={surface}><svg className="function-graph" viewBox={'0 0 '+view.width+' '+view.height} role="img" aria-label="Courbe de la fonction avec points remarquables et asymptotes" onPointerDown={e=>{dragged.current=false;if(loading||(e.target as Element).closest('circle'))return;drag.current={x:e.clientX,y:e.clientY,xmin:data.xmin,xmax:data.xmax};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerUp={e=>{const start=drag.current;drag.current=null;if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)>16&&Math.abs(dx)>Math.abs(dy)){dragged.current=true;const shift=-dx/e.currentTarget.getBoundingClientRect().width*view.width/(view.right-view.left)*(start.xmax-start.xmin);void windowTo(start.xmin+shift,start.xmax+shift);}}} onPointerCancel={()=>{drag.current=null;}} onPointerMove={e=>{if(e.pointerType==='mouse'&&!loading&&!drag.current)select(xAt(e.clientX,e.currentTarget));}} onClick={e=>{if(dragged.current){dragged.current=false;return;}if(!loading)select(xAt(e.clientX,e.currentTarget));}}>
   <defs><clipPath id={clip}><rect x={view.left} y={view.top} width={view.right-view.left} height={view.bottom-view.top}/></clipPath></defs>
   <rect x={view.left} y={view.top} width={view.right-view.left} height={view.bottom-view.top} fill="var(--paper)"/>
   {view.xticks.map(x=><g key={x}><line x1={view.px(x)} x2={view.px(x)} y1={view.top} y2={view.bottom} className="grid-line"/><text x={view.px(x)} y={view.bottom+23} textAnchor="middle">{label(x)}</text></g>)}
   {view.yticks.map(y=><g key={y}><line x1={view.left} x2={view.right} y1={view.py(y)} y2={view.py(y)} className="grid-line"/><text x={view.left-8} y={view.py(y)+4} textAnchor="end">{label(y)}</text></g>)}
   {data.xmin<=0&&data.xmax>=0&&<line x1={view.px(0)} x2={view.px(0)} y1={view.top} y2={view.bottom} className="axis-line"/>}
   {view.lo<=0&&view.hi>=0&&<line x1={view.left} x2={view.right} y1={view.py(0)} y2={view.py(0)} className="axis-line"/>}
   <g clipPath={'url(#'+clip+')'}>
    {asymptotes&&plot.asymptotes.map((a,i)=>a.kind==='vertical'?<line key={i} x1={view.px(a.x!)} x2={view.px(a.x!)} y1={view.top} y2={view.bottom} className="asymptote-line"/>:<path key={i} d={line(a.slope!,a.intercept!)} className="asymptote-line" fill="none"/>)}
    <path key={data.xmin+';'+data.xmax} className="curve-path" d={view.path} fill="none" pathLength="1"/>
    {tangent&&point?.y!==null&&point?.y!==undefined&&point.slope!==null&&<path d={line(point.slope,point.y-point.x*point.slope)} className="tangent-line" fill="none"/>}
    {markers&&plot.markers.filter(p=>p.x>=data.xmin&&p.x<=data.xmax).map((p,i)=><circle key={i} cx={view.px(p.x)} cy={view.py(p.y)} r="5" className={'plot-marker '+(p.kind==='inflection'?'inflection-marker':'')} role="button" tabIndex={0} aria-label={names[p.kind]+' : x '+label(p.x)} onClick={e=>{e.stopPropagation();select(p.x);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(p.x);}}}><title>{names[p.kind]} · x ≈ {label(p.x)}</title></circle>)}
    {point?.y!==null&&point?.y!==undefined&&<><line x1={view.px(point.x)} x2={view.px(point.x)} y1={view.top} y2={view.bottom} className="probe-line"/><circle cx={view.px(point.x)} cy={view.py(point.y)} r="6" className="probe-marker"/></>}
   </g><text x={view.width-9} y={view.bottom+23}>x</text><text x="12" y="17">y</text>
  </svg></div>
  <div className="graph-legend"><span><i/>f(x)</span>{tangent&&<span className="tangent-legend"><i/>Tangente</span>}{asymptotes&&plot.asymptotes.length>0&&<span className="asymptote-legend"><i/>Asymptotes</span>}</div>
  <div className="graph-readout" aria-live="polite"><span>{selected===null?'Touche la courbe pour lire un point':!point?'Lecture…':point.y===null?'Point hors domaine ou non représentable':'x ≈ '+label(point.x)+' · f(x) ≈ '+label(point.y)}</span>{point&&point.y!==null&&<small>{point.slope===null?'Dérivée non représentable en ce point':'f′(x) ≈ '+label(point.slope!)}</small>}</div>
  <div className="graph-options"><label><input type="checkbox" checked={tangent} onChange={e=>{setTangent(e.target.checked);if(selected===null)select((data.xmin+data.xmax)/2);}}/> Tangente au point lu</label><label><input type="checkbox" checked={markers} onChange={e=>setMarkers(e.target.checked)}/> Points remarquables</label><label><input type="checkbox" checked={asymptotes} onChange={e=>setAsymptotes(e.target.checked)}/> Asymptotes</label></div>
  <div className="probe-controls"><label>Abscisse à lire<input aria-label="Abscisse à lire" value={xinput} onChange={e=>setXinput(e.target.value)} inputMode="decimal"/></label><button className="button secondary" type="button" onClick={()=>{const x=Number(xinput.replace(',','.'));if(!xinput.trim()||!Number.isFinite(x)){setError('Saisis une abscisse numérique.');return;}setError('');select(x);}}>Lire le point</button></div>
  {tangent&&point&&point.y!==null&&point.slope!==null&&<div className="tangent-formula"><span>Tangente approchée au point lu</span><MathView tex={'y='+mathNumber(point.y)+'+('+mathNumber(point.slope)+')(x-('+mathNumber(point.x)+'))'}/></div>}
  <details className="graph-window"><summary>Régler la fenêtre</summary><div className="fields"><label>x minimum<input aria-label="x minimum du graphique" value={bounds[0]} onChange={e=>setBounds([e.target.value,bounds[1]])} inputMode="decimal"/></label><label>x maximum<input aria-label="x maximum du graphique" value={bounds[1]} onChange={e=>setBounds([bounds[0],e.target.value])} inputMode="decimal"/></label></div><button className="text-button" type="button" disabled={loading} onClick={()=>{if(!bounds.every(v=>v.trim())){setError('Renseigne les deux bornes de la fenêtre.');return;}void windowTo(Number(bounds[0].replace(',','.')),Number(bounds[1].replace(',','.')));}}>Appliquer la fenêtre en x</button><div className="fields"><label>y minimum<input aria-label="y minimum du graphique" placeholder={label(view.lo)} value={ybounds[0]} onChange={e=>setYbounds([e.target.value,ybounds[1]])} inputMode="decimal"/></label><label>y maximum<input aria-label="y maximum du graphique" placeholder={label(view.hi)} value={ybounds[1]} onChange={e=>setYbounds([ybounds[0],e.target.value])} inputMode="decimal"/></label></div><div className="action-row"><button className="text-button" type="button" onClick={()=>{const a=Number(ybounds[0].replace(',','.')),b=Number(ybounds[1].replace(',','.'));if(!ybounds.every(v=>v.trim())||!Number.isFinite(a)||!Number.isFinite(b)||a>=b){setError('Choisis deux ordonnées croissantes.');return;}setError('');setYrange([a,b]);}}>Appliquer la fenêtre en y</button><button type="button" className="text-button muted" onClick={()=>{setYrange(null);setYbounds(['','']);}}>Ordonnées automatiques</button></div></details>
  {error&&<p className="editor-error" role="alert">{error}</p>}
  <p className="graph-caption">x ∈ [{label(data.xmin)} ; {label(data.xmax)}] · Glisse horizontalement pour déplacer la fenêtre. Le zoom recalcule la courbe. Les points restent des valeurs approchées.</p>
 </section>;
}
