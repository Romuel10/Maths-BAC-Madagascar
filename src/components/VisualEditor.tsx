import {useLayoutEffect,useRef,useState} from 'react';
import {flushSync} from 'react-dom';
import {MathfieldElement} from 'mathlive';
import 'mathlive/fonts.css';
import {editorExpression,editorLatex} from '../math-notation';
import {MathView} from './Math';

MathfieldElement.fontsDirectory=null;
MathfieldElement.soundsDirectory=null;
MathfieldElement.keypressSound=null;
MathfieldElement.computeEngine=null;

const essential:[string,string,string][]=[
 ['Fraction','\\frac{a}{b}','\\frac{#0}{#?}'],
 ['Carré','x^2','#@^{2}'],['Puissance','x^n','#@^{#?}'],
 ['Racine carrée','\\sqrt{x}','\\sqrt{#0}'],
 ['Logarithme népérien','\\ln(x)','\\ln\\left(#0\\right)'],
 ['Exponentielle','e^x','e^{#0}']
];
const functions:[string,string,string][]=[
 ['Sinus','\\sin(x)','\\sin\\left(#0\\right)'],['Cosinus','\\cos(x)','\\cos\\left(#0\\right)'],
 ['Tangente','\\tan(x)','\\tan\\left(#0\\right)'],['Valeur absolue','|x|','\\left|#0\\right|'],
 ['Racine cubique','\\sqrt[3]{x}','\\sqrt[3]{#0}'],['Logarithme décimal','\\log_{10}(x)','\\log_{10}\\left(#0\\right)']
];
const symbols:[string,string,string][]=[
 ['Inférieur ou égal','\\le','\\le'],['Supérieur ou égal','\\ge','\\ge'],['Inférieur','<','<'],['Supérieur','>','>'],
 ['Rang n','n','n'],['Terme u','u','u'],['Variable y','y','y'],['Nombre imaginaire','i','i'],
 ['Factorielle','n!','#@!'],['Constante e','e','e'],['Pi','\\pi','\\pi'],['Séparateur',';',';']
];
export function VisualEditor({expression,latex,label,onChange,onSubmit}:{expression:string;latex?:string;label:string;onChange:(expression:string,latex?:string)=>void;onSubmit:()=>void}){
 const host=useRef<HTMLDivElement>(null),field=useRef<MathfieldElement|null>(null),last=useRef(expression),lastLatex=useRef('');
 const callbacks=useRef({onChange,onSubmit});callbacks.current={onChange,onSubmit};
 const sync=useRef<(()=>void)|null>(null);
 const [tab,setTab]=useState<'essential'|'functions'|'symbols'>('essential'),[hint,setHint]=useState('');
 useLayoutEffect(()=>{
  const mf=new MathfieldElement();field.current=mf;
  mf.id='math-expression';mf.setAttribute('aria-label',label);mf.setAttribute('aria-describedby','visual-editor-help');
  mf.mathVirtualKeyboardPolicy='manual';mf.smartFence=true;mf.popoverPolicy='off';
  mf.placeholder='\\text{Écris ta formule ici}';mf.setValue(latex??editorLatex(expression),{silenceNotifications:true});
  const mount=()=>{mf.menuItems=[];mf.inlineShortcuts={...mf.inlineShortcuts,ln:'\\ln',exp:'\\exp'};};
  mf.addEventListener('mount',mount);lastLatex.current=mf.value;
  const input=()=>{
   const value=editorExpression(mf.getValue('latex-unstyled'));
   if(value.length>600||mf.value.length>6000){setHint('Traite une question à la fois : cette formule est trop longue.');mf.setValue(lastLatex.current,{silenceNotifications:true});return;}
   if(mf.value===lastLatex.current)return;
   setHint('');last.current=value;lastLatex.current=mf.value;callbacks.current.onChange(value,mf.value);
  };
  sync.current=input;
  const submit=()=>flushSync(input),leave=()=>input();
  const key=(e:KeyboardEvent)=>{if(e.key==='Enter'){e.preventDefault();const form=mf.closest('form');if(form)form.requestSubmit();else{submit();callbacks.current.onSubmit();}}};
  mf.addEventListener('input',input);mf.addEventListener('keydown',key);host.current!.append(mf);
  const form=mf.closest('form');form?.addEventListener('submit',submit,{capture:true});window.addEventListener('beforeunload',leave);
  return()=>{form?.removeEventListener('submit',submit,{capture:true});window.removeEventListener('beforeunload',leave);mf.removeEventListener('mount',mount);mf.removeEventListener('input',input);mf.removeEventListener('keydown',key);mf.remove();field.current=null;sync.current=null;};
 },[]);
 useLayoutEffect(()=>{if(expression!==last.current&&field.current){field.current.setValue(latex??editorLatex(expression),{silenceNotifications:true});last.current=expression;lastLatex.current=field.current.value;setHint('');}},[expression,latex]);
 useLayoutEffect(()=>{field.current?.setAttribute('aria-label',label);},[label]);
 const insert=(value:string)=>{field.current?.focus();field.current?.insert(value,{selectionMode:'placeholder',focus:true});sync.current?.();};
 const command=(value:'moveToPreviousChar'|'moveToNextChar'|'moveUp'|'moveDown'|'deleteBackward'|'undo'|'redo'|'moveToNextPlaceholder')=>{field.current?.focus();field.current?.executeCommand(value);sync.current?.();};
 return <section className="visual-editor">
  <div className="formula-bar"><span>ÉCRITURE MATHÉMATIQUE</span><button type="button" className="text-button" onClick={()=>{field.current?.setValue('',{silenceNotifications:true});last.current='';lastLatex.current='';setHint('');onChange('','');field.current?.focus();}}>Tout effacer</button></div>
  <div ref={host} className="math-field-host"/>
  <p id="visual-editor-help" className="visual-help">Touche une fraction ou un exposant pour le remplir. Les flèches ↑ et ↓ passent d’un étage à l’autre.</p>
  {hint&&<p className="editor-error" role="status">{hint}</p>}
  <div className="keypad-tabs" role="group" aria-label="Touches mathématiques"><button type="button" aria-pressed={tab==='essential'} onClick={()=>setTab('essential')}>Essentiel</button><button type="button" aria-pressed={tab==='functions'} onClick={()=>setTab('functions')}>Fonctions</button><button type="button" aria-pressed={tab==='symbols'} onClick={()=>setTab('symbols')}>Symboles</button></div>
  <div className="formula-keys">{(tab==='essential'?essential:tab==='functions'?functions:symbols).map(([name,tex,value])=><button type="button" key={name} aria-label={'Insérer '+name.toLowerCase()} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(value)}><MathView tex={tex} block={false}/><span>{name}</span></button>)}</div>
  <div className="number-keypad">{['7','8','9','x','+','4','5','6','(', '−','1','2','3',')','×','0',',','=','π','÷'].map(value=><button type="button" key={value} className={/[+−×÷=]/.test(value)?'operator-key':''} aria-label={'Insérer '+value} onPointerDown={e=>e.preventDefault()} onClick={()=>insert(value==='×'?'\\cdot':value==='÷'?'\\frac{#0}{#?}':value==='π'?'\\pi':value==='−'?'-':value===','?'.':value)}>{value}</button>)}</div>
  <div className="cursor-keys">{[['Annuler la dernière saisie','↶','undo'],['Déplacer le curseur à gauche','←','moveToPreviousChar'],['Monter dans la formule','↑','moveUp'],['Descendre dans la formule','↓','moveDown'],['Déplacer le curseur à droite','→','moveToNextChar'],['Effacer le caractère précédent','⌫','deleteBackward']].map(([name,symbol,value])=><button key={name} type="button" aria-label={name} onPointerDown={e=>e.preventDefault()} onClick={()=>command(value as Parameters<typeof command>[0])}>{symbol}</button>)}</div>
 </section>;
}
