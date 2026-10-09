import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {previewInput} from '../client';
import {MathView} from './Math';
import {guideFor,guideModels,guidedRequest} from '../data/guided';
import type {Request,Tool} from '../engine/types';
export function ExpressionPreview({expression,busy=false}:{expression:string;busy?:boolean}){
 const [preview,setPreview]=useState<{latex?:string;hint?:string}>({});
 useEffect(()=>{let active=true;setPreview({});if(busy||!expression.trim())return;
  const timer=setTimeout(()=>{void previewInput(expression).then(value=>{if(active)setPreview(value);}).catch(()=>{});},300);
  return ()=>{active=false;clearTimeout(timer);};
 },[expression,busy]);
 return <div className="input-preview"><span>Lecture de ta saisie</span>{preview.latex?<MathView tex={preview.latex}/>:<p>{preview.hint??'La formule apparaîtra ici pendant la saisie.'}</p>}</div>;
}
const keys:[string,string][]=[['x','x'],['x²','²'],['xⁿ','^(□)'],['a/b','(□)/(□)'],['√','√(□)'],['∛','∛(□)'],['( )','(□)'],['ln','ln(□)'],['eˣ','e^(□)'],['sin','sin(□)'],['cos','cos(□)'],['tan','tan(□)'],['|x|','|□|'],['π','π'],['+','+'],['−','−'],['×','×'],['÷','÷'],['=','='],['≥','≥'],['≤','≤'],['!','!'],['i','i'],[';',';']];
export function ExpressionEditor({draft,tool,busy,onChange,onSubmit}:{draft:Request;tool:Tool;busy:boolean;onChange:(value:string)=>void;onSubmit:()=>void}){
 const textarea=useRef<HTMLTextAreaElement>(null),cursor=useRef<number|null>(null),[keyboard,setKeyboard]=useState(true);
 useLayoutEffect(()=>{const el=textarea.current;if(el&&cursor.current!==null){el.focus();el.setSelectionRange(cursor.current,cursor.current);cursor.current=null;}});
 const insert=(template:string)=>{const el=textarea.current,start=el?.selectionStart??draft.expression.length,end=el?.selectionEnd??start,selected=draft.expression.slice(start,end);let at=template.indexOf('□');
  const text=template.replace('□',selected).replaceAll('□','');if(at<0)at=text.length;else if(selected)at+=selected.length;
  cursor.current=start+at;onChange(draft.expression.slice(0,start)+text+draft.expression.slice(end));
 };
 const move=(direction:number)=>{const el=textarea.current;if(!el)return;const at=Math.max(0,Math.min(el.value.length,(direction<0?el.selectionStart:el.selectionEnd)+direction));el.focus();el.setSelectionRange(at,at);};
 const erase=()=>{const el=textarea.current;if(!el)return;const start=el.selectionStart,end=el.selectionEnd,at=start===end?Math.max(0,start-1):start;cursor.current=at;onChange(draft.expression.slice(0,at)+draft.expression.slice(end));};
 const rows=['system','matrix','statistics','geometry'].includes(tool.id);
 return <><label className="expression-label" htmlFor="expression">{tool.label}</label><textarea id="expression" ref={textarea} value={draft.expression} onChange={e=>onChange(e.target.value)} maxLength={600} spellCheck={false} autoCapitalize="off" autoCorrect="off" rows={rows?4:2} placeholder={tool.expression} onKeyDown={e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();onSubmit();}}}/>
 {!rows&&<><p className="notation-help">Écris comme au cahier : 3x, x², √9, ln x. Mets entre parenthèses les arguments composés, par exemple ln(2x + 1).</p><ExpressionPreview expression={draft.expression} busy={busy}/></>}
 <div className="input-utilities"><button type="button" className="text-button" onClick={()=>setKeyboard(!keyboard)} aria-expanded={keyboard}>Clavier mathématique <span>{keyboard?'−':'+'}</span></button><button type="button" className="text-button muted" onClick={()=>onChange(tool.expression)}>Exemple</button></div>
 {keyboard&&<div className="math-keyboard">{keys.map(([label,value])=><button type="button" key={label} aria-label={'Insérer '+label} onMouseDown={e=>e.preventDefault()} onClick={()=>insert(value)}>{label}</button>)}<button type="button" aria-label="Déplacer le curseur à gauche" onMouseDown={e=>e.preventDefault()} onClick={()=>move(-1)}>←</button><button type="button" aria-label="Déplacer le curseur à droite" onMouseDown={e=>e.preventDefault()} onClick={()=>move(1)}>→</button><button type="button" aria-label="Effacer le caractère précédent" onMouseDown={e=>e.preventDefault()} onClick={erase}>⌫</button></div>}</>;
}
export function DataEntry({draft,busy,onChange}:{draft:Request;busy:boolean;onChange:(request:Request)=>void}){
 const guide=guideFor(draft)!;
 const set=(changes:Record<string,string>)=>onChange(guidedRequest(draft,changes));
 return <section className="guided-entry">
 {guideModels[draft.operation]&&<label>Forme de l’énoncé<select aria-label="Forme de l’énoncé" value={draft.params.data_model??(draft.operation==='sequence'?'affine':'polynomial')} onChange={e=>set({data_model:e.target.value})}>{guideModels[draft.operation]!.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
 {draft.operation==='matrix'&&<label>Taille de la matrice<select aria-label="Taille de la matrice" value={draft.params.data_size??'2'} onChange={e=>set({data_size:e.target.value})}>{[2,3,4].map(n=><option key={n} value={n}>{n} × {n}</option>)}</select></label>}
 {draft.operation==='inequality'&&<label>Sens de l’inégalité<select aria-label="Sens de l’inégalité" value={draft.params.relation??'>='} onChange={e=>set({relation:e.target.value})}><option value=">=">Supérieur ou égal à 0</option><option value="<=">Inférieur ou égal à 0</option><option value=">">Strictement supérieur à 0</option><option value="<">Strictement inférieur à 0</option></select></label>}
 <MathView tex={guide.model}/><p>Remplace les valeurs par celles de ton énoncé. {draft.operation==='arithmetic'?'Saisis deux entiers.':'Nombres, virgules décimales et fractions comme 2/3 sont acceptés.'}{draft.operation==='equation'?' Pour une équation du premier degré, indique a = 0.':''}</p>
 <div className={'fields'+(guide.columns?' data-grid':'')} style={guide.columns?{gridTemplateColumns:'repeat('+guide.columns+',minmax(0,1fr))'}:undefined}>{guide.fields.map(f=><label key={f.key}>{f.label}<input value={draft.params['data_'+f.key]??f.initial} maxLength={45} spellCheck={false} autoCapitalize="off" onChange={e=>set({['data_'+f.key]:e.target.value})}/></label>)}</div>
 {draft.operation==='statistics'&&<div className="table-actions"><button className="text-button" type="button" disabled={Number(draft.params.data_rows??'3')>=30} onClick={()=>set({data_rows:String(Number(draft.params.data_rows??'3')+1)})}>Ajouter une ligne</button><button className="text-button muted" type="button" disabled={Number(draft.params.data_rows??'3')<=2} onClick={()=>set({data_rows:String(Number(draft.params.data_rows??'3')-1)})}>Retirer la dernière ligne</button></div>}
 {!['matrix','statistics','geometry','arithmetic','system'].includes(draft.operation)&&<ExpressionPreview expression={draft.expression} busy={busy}/>}
 </section>;
}
