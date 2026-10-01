import { useEffect, useMemo, useState } from 'react';
import { MathExpression, MathText } from './MathNotation';
import { MiniKeyboard, prettyToMath } from './MiniKeyboard';
import type { StepFeedback } from '../lib/pedagogy';
import { storageGet, storageRemove } from '../lib/safeStorage';
import { analyzeStudentRequest, type SolverIntent, type SolverTopic } from '../lib/solverIntent';
import { speakFrench, stopSpeaking } from '../lib/accessibility';
import { setLastActivity } from '../lib/studentProfile';
import { getTutorExplanation, getTutorPractice, getTutorStepSupport, type TutorExplanationLevel } from '../lib/tutorCoach';
import { solveStatementExactly, type StatementResolution } from '../lib/statementResolutionEngine';

type HelpMode = 'understand' | 'start' | 'plan';
type Workspace = 'statement' | 'function' | 'verify' | 'method';
export type SolverTool = 'algebra' | 'complex' | 'probability' | 'sequence' | 'geometry' | 'arithmetic' | 'finance' | 'calculator';

const METHODS: Record<SolverTopic, { title: string; steps: string[]; reminders: string[]; questions: string[] }> = {
 Analyse: { title: 'Méthode d’étude d’une fonction', steps: ['Déterminer l’ensemble de définition.', 'Calculer les limites utiles.', 'Calculer et simplifier la dérivée.', 'Étudier le signe de la dérivée puis dresser les variations.', 'Chercher les asymptotes et les points remarquables si la question le demande.'], reminders: ['Un dénominateur doit être non nul.', 'Sous une racine carrée : $u≥0$.', 'Dans $ln(u)$ : $u>0$.'], questions: ['Quelle est l’expression exacte de la fonction ?', 'Quel est son domaine ?', 'La question demande-t-elle une limite, une dérivée, un signe ou un tableau ?'] },
 Algèbre: { title: 'Méthode algébrique', steps: ['Identifier ce qu’il faut trouver : racines, factorisation, système…', 'Réduire l’expression et isoler les termes utiles.', 'Choisir la méthode adaptée : factorisation, discriminant, substitution ou élimination.', 'Vérifier chaque solution dans l’énoncé initial.'], reminders: ['Pour $ax^2+bx+c=0$, penser à $Δ=b^2-4ac$.', 'Toujours vérifier les valeurs interdites.'], questions: ['Quelle est l’inconnue ?', 'Peut-on factoriser ?', 'Y a-t-il une valeur interdite ?'] },
 Complexes: { title: 'Méthode avec les nombres complexes', steps: ['Écrire $z$ sous la forme $a+bi$ si possible.', 'Séparer partie réelle et partie imaginaire.', 'Pour une équation du second degré, calculer $Δ$ dans $ℂ$.', 'Pour module/argument, choisir la représentation adaptée puis vérifier.'], reminders: ['$i^2=-1$.', 'Le conjugué de $a+bi$ est $a-bi$.'], questions: ['Cherche-t-on une solution, un module ou un argument ?', 'Peut-on utiliser le conjugué ?', 'Le résultat vérifie-t-il l’équation initiale ?'] },
 Probabilités: { title: 'Méthode en probabilités', steps: ['Définir clairement les événements.', 'Repérer indépendance, conditionnement ou répétition d’épreuves.', 'Écrire la formule avant de remplacer par les nombres.', 'Contrôler que la probabilité obtenue est entre 0 et 1.'], reminders: ['Binomiale : $P(X=k)=C(n,k)p^k(1-p)^(n-k)$.', '$P(A∪B)=P(A)+P(B)-P(A∩B)$.'], questions: ['Combien d’issues y a-t-il ?', 'Les épreuves sont-elles indépendantes ?', 'Est-ce une loi binomiale ou un conditionnement ?'] },
 Suites: { title: 'Méthode pour les suites', steps: ['Identifier si la suite est explicite ou définie par récurrence.', 'Calculer quelques premiers termes si cela aide.', 'Étudier monotonie et bornes si une convergence est demandée.', 'Une limite candidate obtenue par $ℓ=f(ℓ)$ doit ensuite être justifiée.'], reminders: ['Une limite candidate n’est pas une preuve.', 'Suite géométrique : $u_n=u_0q^n$.'], questions: ['La suite est-elle explicite ou récurrente ?', 'Cherche-t-on un terme, une monotonie ou une limite ?', 'Peut-on comparer $u_(n+1)$ et $u_n$ ?'] },
 Géométrie: { title: 'Méthode en géométrie', steps: ['Faire un schéma et relever les données.', 'Choisir un repère ou des vecteurs si cela simplifie.', 'Traduire la propriété demandée en égalité, produit scalaire, déterminant ou distance.', 'Conclure avec une phrase géométrique.'], reminders: ['Orthogonalité : produit scalaire nul.', 'Colinéarité : déterminant nul en dimension 2.'], questions: ['Quelle propriété faut-il montrer ?', 'Un repère simplifierait-il le problème ?', 'Quelles coordonnées sont connues ?'] },
 Arithmétique: { title: 'Méthode en arithmétique', steps: ['Repérer divisibilité, PGCD, congruence ou équation diophantienne.', 'Utiliser l’algorithme d’Euclide si nécessaire.', 'Écrire proprement les congruences.', 'Vérifier la divisibilité ou la solution finale.'], reminders: ['$a≡b [n]$ signifie que $n$ divise $a-b$.', 'Bézout relie le PGCD à une combinaison linéaire.'], questions: ['Quel est le modulo ?', 'Cherche-t-on un PGCD ou une divisibilité ?', 'Peut-on appliquer Euclide ou Bézout ?'] },
 Finance: { title: 'Méthode en mathématiques financières', steps: ['Identifier le capital ou la valeur nominale, le taux, la durée et la date recherchée.', 'Convertir le taux en décimal et mettre la durée dans l’unité correcte.', 'Choisir intérêt simple, escompte, capitalisation, actualisation ou annuités.', 'Calculer sans arrondi intermédiaire puis interpréter le résultat en Ariary et à la bonne date.'], reminders: ['10 % = 0,10 dans les formules.', 'Intérêt simple : I=Cit.', 'Intérêt composé : A=C(1+i)^n.', 'Actualisation : VA=VF/(1+i)^n.'], questions: ['Quel montant est connu ?', 'Le taux est-il annuel, mensuel ou par période ?', 'Cherche-t-on une valeur actuelle, une valeur acquise, un intérêt ou une annuité ?'] },
 Général: { title: 'Méthode générale de résolution', steps: ['Lire exactement ce qui est demandé.', 'Lister les données et l’inconnue.', 'Identifier le chapitre.', 'Écrire le théorème ou la formule avant le calcul.', 'Vérifier puis conclure.'], reminders: ['Au BAC, le raisonnement et la justification comptent autant que le résultat final.'], questions: ['Quelles sont les données ?', 'Quelle est la question exacte ?', 'Quel chapitre du cours ressemble le plus à ce problème ?'] }
};

async function compressPhoto(file:File):Promise<string>{
 if(!file.type.startsWith('image/'))throw new Error('Choisis un fichier image.');
 if(file.size>12*1024*1024)throw new Error('La photo dépasse 12 Mo. Réduis sa taille avant de réessayer.');
 const url=URL.createObjectURL(file);
 try{
  const image=await new Promise<HTMLImageElement>((resolve,reject)=>{const element=new Image();element.onload=()=>resolve(element);element.onerror=()=>reject(new Error('Cette image ne peut pas être lue.'));element.src=url;});
  const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
  const width=Math.max(1,Math.round(image.naturalWidth*scale));
  const height=Math.max(1,Math.round(image.naturalHeight*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const context=canvas.getContext('2d');if(!context)throw new Error('Compression de la photo indisponible.');
  context.fillStyle='#fff';context.fillRect(0,0,width,height);context.drawImage(image,0,0,width,height);
  return canvas.toDataURL('image/jpeg',0.82);
 }finally{URL.revokeObjectURL(url);}
}

const WORKSPACES: Array<{ id: Workspace; symbol: string; title: string; copy: string }> = [
 { id: 'statement', symbol: '?', title: 'Comprendre un énoncé', copy: 'Repérer le chapitre et construire une méthode.' },
 { id: 'function', symbol: 'f', title: 'Étudier une fonction', copy: 'Domaine, limites, dérivées, variations et graphe.' },
 { id: 'verify', symbol: '✓', title: 'Vérifier mes étapes', copy: 'Comparer deux lignes de calcul sans dévoiler la suite.' },
 { id: 'method', symbol: '→', title: 'Choisir une méthode', copy: 'Partir directement du chapitre de l’exercice.' },
];

const TOPIC_TOOL: Partial<Record<SolverTopic, SolverTool>> = {
 Algèbre: 'algebra',
 Complexes: 'complex',
 Probabilités: 'probability',
 Suites: 'sequence',
 Géométrie: 'geometry',
 Arithmétique: 'arithmetic',
 Finance: 'finance',
};

interface Props {
 onAnalyzeFunction?: (expr: string) => void;
 onOpenTool?: (tool: SolverTool) => void;
}

export function BacTutor({ onAnalyzeFunction, onOpenTool }: Props) {
 const [prefill]=useState(()=>({statement:storageGet('mathbac_tutor_prefill')||'',functionExpr:storageGet('mathbac_function_prefill')||''}));
 const [statement, setStatement] = useState(prefill.statement);
 const [workspace, setWorkspace] = useState<Workspace>(prefill.functionExpr?'function':'statement');
 const [topic, setTopic] = useState<SolverTopic>('Général');
 const [intent, setIntent] = useState<SolverIntent | null>(null);
 const [showGuide, setShowGuide] = useState(false);
 const [photo, setPhoto] = useState<string | null>(null);
 const [photoConfirmed, setPhotoConfirmed] = useState(false);
 const [photoError,setPhotoError]=useState('');
 const [photoBusy,setPhotoBusy]=useState(false);
 const [functionExpr, setFunctionExpr] = useState(prefill.functionExpr);
 const [functionInputError, setFunctionInputError] = useState('');
 const [helpMode, setHelpMode] = useState<HelpMode>('understand');
 const [previousStep, setPreviousStep] = useState('');
 const [nextStep, setNextStep] = useState('');
 const [stepFeedback, setStepFeedback] = useState<StepFeedback | null>(null);
 const [verifyBusy,setVerifyBusy]=useState(false);
 const [blockedStep,setBlockedStep]=useState(0);
 const [hintLevel,setHintLevel]=useState(0);
 const [explanationLevel,setExplanationLevel]=useState<TutorExplanationLevel>('simple');
 const [showPractice,setShowPractice]=useState(false);
 const [showPracticeHint,setShowPracticeHint]=useState(false);
 const [showPracticeSolution,setShowPracticeSolution]=useState(false);
 const [statementResolution,setStatementResolution]=useState<StatementResolution|null>(null);
 const [revealedResolutionSteps,setRevealedResolutionSteps]=useState(0);
 const [showResolutionAnswer,setShowResolutionAnswer]=useState(false);
 const guide = useMemo(() => METHODS[topic], [topic]);
 const stepSupport = useMemo(() => getTutorStepSupport(topic,blockedStep), [topic,blockedStep]);
 const stepExplanation = useMemo(() => getTutorExplanation(topic,blockedStep,explanationLevel), [topic,blockedStep,explanationLevel]);
 const practice = useMemo(() => getTutorPractice(topic), [topic]);

 useEffect(()=>{if(prefill.statement)storageRemove('mathbac_tutor_prefill');if(prefill.functionExpr)storageRemove('mathbac_function_prefill');return stopSpeaking;},[prefill.functionExpr,prefill.statement]);

 const analyzeStatement = () => {
  const next = analyzeStudentRequest(statement);
  const exactResolution = solveStatementExactly(statement);
  setIntent(next);
  setStatementResolution(exactResolution);
  setRevealedResolutionSteps(0);
  setShowResolutionAnswer(false);
  setTopic(next.topic);
  setShowGuide(true);
  setHintLevel(0);setBlockedStep(0);setExplanationLevel('simple');
  setShowPractice(false);setShowPracticeHint(false);setShowPracticeSolution(false);
  if (next.functionExpression) setFunctionExpr(next.functionExpression);
  setLastActivity({kind:'solve',label:`Résolution guidée · ${next.topic}`,payload:statement.slice(0,180)});
 };
 const onPhoto = async (file?: File) => {
  if (!file) return;
  setPhotoBusy(true);setPhotoError('');
  try{setPhoto(await compressPhoto(file));setPhotoConfirmed(false);}
  catch(error:unknown){setPhoto(null);setPhotoError(error instanceof Error?error.message:'Impossible de préparer cette photo.');}
  finally{setPhotoBusy(false);}
 };

 const verifyStep = async () => {
  if (!previousStep.trim() || !nextStep.trim()) return;
  setVerifyBusy(true);setStepFeedback(null);
  try{const {verifyTransformation}=await import('../lib/pedagogy');setStepFeedback(verifyTransformation(previousStep,nextStep));}
  catch{setStepFeedback({status:'unreadable',title:'Vérification indisponible',message:'Le moteur n’a pas pu démarrer. Réessaie ou recharge l’application.'});}
  finally{setVerifyBusy(false);}
 };

 const analyzeFunctionValue = (value: string) => {
  const trimmed = value.trim();
  const withoutDefinition = trimmed.replace(/^[fgh]\s*\(\s*x\s*\)\s*=\s*/i, '');
  if (!withoutDefinition) { setFunctionInputError('Saisis l’expression située après f(x) =.'); return; }
  const opens = (withoutDefinition.match(/\(/g) || []).length;
  const closes = (withoutDefinition.match(/\)/g) || []).length;
  if (opens !== closes) { setFunctionInputError('Vérifie les parenthèses : il en manque une ou il y en a une en trop.'); return; }
  setFunctionInputError('');
  setLastActivity({kind:'solve',label:'Étude de fonction',payload:withoutDefinition.slice(0,180)});
  onAnalyzeFunction?.(prettyToMath(withoutDefinition));
 };

 const modeCopy: Record<HelpMode, string> = {
  understand: 'Décompose la consigne et identifie ce que l’on cherche.',
  start: 'Donne seulement le point de départ et les premières questions à se poser.',
  plan: 'Construit un plan complet de résolution à suivre sur le brouillon.'
 };

 const recommendedTool = TOPIC_TOOL[topic];

 return <div className="space-y-4 page-enter">
  <div><p className="eyebrow">V7 · Tuteur BAC</p><h2 className="page-title">Quel exercice te bloque ?</h2><p className="page-copy">Recopie la question. Le tuteur repère le chapitre, explique pourquoi chaque étape est utile et t’aide progressivement sans remplacer ton raisonnement.</p></div>

  <section className="grid grid-cols-2 gap-2.5" aria-label="Choisir un besoin de résolution">
   {WORKSPACES.map(item => <button key={item.id} onClick={()=>setWorkspace(item.id)} aria-pressed={workspace===item.id} className={`solve-goal-card ${workspace===item.id?'active':''}`}><span className="solve-goal-symbol" aria-hidden="true">{item.symbol}</span><span><strong>{item.title}</strong><small>{item.copy}</small></span></button>)}
  </section>

  {workspace === 'statement' && <>
   <section className="surface p-4">
    <div className="segmented grid-cols-3">
     {([['understand','Comprendre'],['start','Démarrer'],['plan','Plan complet']] as Array<[HelpMode,string]>).map(([id,label])=><button key={id} onClick={()=>setHelpMode(id)} className={helpMode===id?'active':''}>{label}</button>)}
    </div><p className="section-copy mt-2">{modeCopy[helpMode]}</p>
   </section>

   <details className="surface p-4">
    <summary className="font-extrabold cursor-pointer">Ajouter une photo du sujet</summary>
    <div className="mt-3"><div className="flex items-center justify-between gap-2"><label className="field-label" htmlFor="tutor-photo">Photo du sujet</label><span className={`chip ${photoConfirmed?'chip-success':'chip-warning'}`}>{photoConfirmed?'Transcription confirmée':'À recopier manuellement'}</span></div>
     <input id="tutor-photo" type="file" accept="image/*" capture="environment" onChange={e => void onPhoto(e.target.files?.[0])} className="mt-2 block w-full text-xs muted" aria-describedby="tutor-photo-help" />
     <p id="tutor-photo-help" className="section-copy mt-1">La photo est préparée localement et n’est pas envoyée. L’application ne prétend pas lire automatiquement les formules.</p>
     {photoBusy&&<p className="notice notice-info mt-2" role="status">Préparation de la photo…</p>}
     {photoError&&<p className="notice notice-danger mt-2" role="alert">{photoError}</p>}
     {photo && <><img src={photo} alt="Sujet photographié" className="mt-3 w-full max-h-64 object-contain rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }} /><div className="notice notice-warning mt-2"><strong>Vérification nécessaire.</strong> Recopie l’énoncé puis compare les nombres, signes, parenthèses et exposants.</div></>}
    </div>
   </details>

   <section className="paper-card p-4">
    <label className="field-label" htmlFor="tutor-statement">Énoncé ou question recopiée</label>
    <textarea id="tutor-statement" maxLength={10000} value={statement} onChange={e => { setStatement(e.target.value); setShowGuide(false); setIntent(null); setStatementResolution(null); setRevealedResolutionSteps(0); setShowResolutionAnswer(false); setPhotoConfirmed(false); }} rows={6} placeholder="Ex. On considère f(x)=x²−4x+3. Étudier ses variations." className="field mt-2 resize-none" />
    {statement.trim()&&<div className="flex justify-end gap-2 mt-2"><button onClick={()=>speakFrench(statement)} className="btn btn-small btn-secondary">🔊 Lire la consigne</button><button onClick={stopSpeaking} className="btn btn-small btn-ghost">Arrêter</button></div>}
    {photo && <label className="annale-check-row mt-2"><input type="checkbox" checked={photoConfirmed} onChange={e=>setPhotoConfirmed(e.target.checked)}/><span>J’ai comparé la transcription à la photo.</span></label>}
    <button onClick={analyzeStatement} disabled={!statement.trim() || Boolean(photo && !photoConfirmed)} className="btn btn-primary w-full mt-3">Comprendre la demande</button>
   </section>
  </>}

  {workspace === 'verify' && <section className="surface p-4"><p className="eyebrow">Contrôle de deux lignes</p><h3 className="section-title mt-2">Le passage est-il correct ?</h3><p className="section-copy mt-1">Recopie une ligne avant et une ligne après. Le moteur de vérification est chargé seulement à ce moment pour garder l’application rapide.</p><div className="mt-3"><MiniKeyboard value={previousStep} onChange={v=>{setPreviousStep(v);setStepFeedback(null)}} label="Avant" placeholder="Ex. 2x+4=10"/><div className="mt-2"><MiniKeyboard value={nextStep} onChange={v=>{setNextStep(v);setStepFeedback(null)}} label="Après" placeholder="Ex. 2x=6"/></div><button onClick={()=>void verifyStep()} disabled={verifyBusy||!previousStep.trim()||!nextStep.trim()} className="btn btn-primary w-full mt-2">{verifyBusy?'Vérification en cours…':'Vérifier mon étape'}</button>{stepFeedback&&<div role="status" className={`notice mt-2 ${stepFeedback.status==='incorrect'?'notice-danger':stepFeedback.status==='verified'?'notice-success':'notice-warning'}`}><p className="font-black">{stepFeedback.title}</p><p className="mt-1">{stepFeedback.message}</p></div>}</div></section>}

  {workspace === 'function' && onAnalyzeFunction && <section className="surface p-4"><p className="eyebrow">Étude complète</p><h3 className="section-title mt-2">Analyser une fonction</h3><p className="section-copy mt-1">Tu peux saisir seulement l’expression ou écrire « f(x) = ». L’analyseur vérifiera le domaine avant les calculs.</p><div className="mt-3"><MiniKeyboard value={functionExpr} onChange={value=>{setFunctionExpr(value);setFunctionInputError('')}} placeholder="Ex. f(x)=(x²+1)÷(x−1)" />{functionExpr.trim()&&<div className="math-preview mt-2"><p className="math-preview-label">Expression comprise par le moteur</p><MathExpression value={prettyToMath(functionExpr.replace(/^[fgh]\s*\(\s*x\s*\)\s*=\s*/i,''))} block className="math-preview-expression"/></div>}{functionInputError&&<div className="notice notice-danger mt-2" role="alert">{functionInputError}</div>}<button onClick={()=>analyzeFunctionValue(functionExpr)} disabled={!functionExpr.trim()} className="btn btn-primary w-full mt-3">Analyser la fonction maintenant</button><p className="section-copy mt-2 text-center">Le résultat s’ouvre immédiatement dans l’espace d’analyse avec un indicateur de calcul.</p></div></section>}

  {workspace === 'method' && <section className="surface p-4"><p className="eyebrow">Accès par chapitre</p><h3 className="section-title mt-2">Quelle partie du programme ?</h3><div className="grid grid-cols-2 gap-2 mt-3">{(Object.keys(METHODS) as SolverTopic[]).filter(item=>item!=='Général').map(item=><button key={item} onClick={()=>{setTopic(item);setShowGuide(true);setIntent(null);setHintLevel(0);setBlockedStep(0);setExplanationLevel('simple');setShowPractice(false);setShowPracticeHint(false);setShowPracticeSolution(false)}} aria-pressed={topic===item} className={`chapter-choice ${topic===item?'active':''}`}>{item}</button>)}</div></section>}

  {intent && workspace === 'statement' && <section className="surface p-4" aria-live="polite"><p className="eyebrow">Énoncé décomposé</p><h3 className="section-title mt-2">{intent.goalLabel}</h3><p className="section-copy mt-2">Chapitre probable : <strong>{intent.topic}</strong>.</p>{intent.keywords.length>0&&<div className="flex flex-wrap gap-1.5 mt-3">{intent.keywords.map(word=><span key={word} className="chip chip-info">{word}</span>)}</div>}<div className="grid gap-2 mt-3"><div className="surface-flat p-3"><p className="font-black text-xs">Données repérées</p>{intent.givens.map(item=><p key={item} className="section-copy mt-1">• <MathText auto>{item}</MathText></p>)}</div><div className="surface-flat p-3"><p className="font-black text-xs">Question</p><p className="section-copy mt-1"><MathText auto>{intent.question}</MathText></p></div><div className="surface-flat p-3"><p className="font-black text-xs">Ce qu’il faut obtenir</p><p className="section-copy mt-1">{intent.unknown}</p></div></div><div className="notice notice-info mt-3"><p className="font-black">Plan proposé</p>{intent.suggestedSteps.map((line,index)=><p key={line} className="mt-1">{index+1}. {line}</p>)}</div>{intent.functionExpression&&onAnalyzeFunction&&<button onClick={()=>analyzeFunctionValue(intent.functionExpression!)} className="btn btn-primary w-full mt-3">Étudier automatiquement {intent.functionExpression}</button>}</section>}

  {workspace==='statement'&&intent&&statementResolution&&<section className="paper-card p-4" aria-live="polite">
   <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Correction construite avec ton énoncé</p><h3 className="section-title mt-2">{statementResolution.title}</h3></div><span className="chip chip-success">Résolution complète · vérifiée</span></div>
   <p className="section-copy mt-2">Cette correction est calculée à partir de ton énoncé pour une famille que le moteur sait résoudre complètement. Lis-la comme une copie BAC : données → méthode → calculs → conclusion.</p>
   <div className="flex flex-wrap gap-1.5 mt-3">{statementResolution.givens.map(item=><span key={item} className="chip chip-info"><MathText auto>{item}</MathText></span>)}</div>
   {statementResolution.scope&&<div className="notice notice-info mt-3"><strong>Portée :</strong> {statementResolution.scope}</div>}
   {revealedResolutionSteps===0&&<div className="notice notice-warning mt-3"><strong>À toi d’essayer :</strong> commence sur ton brouillon. Affiche la première étape seulement si tu bloques.</div>}
   {revealedResolutionSteps>0&&<div className="space-y-2 mt-3">{statementResolution.steps.slice(0,revealedResolutionSteps).map((step,index)=><div key={index} className="surface-flat p-3"><div className="flex gap-3"><span className="action-index">{index+1}</span><div className="min-w-0"><p className="font-black text-xs">{step.title}</p><p className="mt-2 text-sm font-bold"><MathText auto>{step.work}</MathText></p><p className="section-copy mt-2"><strong>Pourquoi :</strong> {step.why}</p>{step.check&&<p className="section-copy mt-1"><strong>Contrôle :</strong> {step.check}</p>}</div></div></div>)}</div>}
   {revealedResolutionSteps<statementResolution.steps.length?<div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>setRevealedResolutionSteps(value=>Math.min(statementResolution.steps.length,value+1))} className="btn btn-primary">{revealedResolutionSteps===0?'Voir la 1re étape':'Étape suivante'}</button><button onClick={()=>setRevealedResolutionSteps(statementResolution.steps.length)} className="btn btn-secondary">Voir toute la méthode</button></div>:<div className="mt-3"><button onClick={()=>setShowResolutionAnswer(value=>!value)} className="btn btn-primary w-full">{showResolutionAnswer?'Masquer la réponse finale':'Voir la réponse finale'}</button>{showResolutionAnswer&&<div className="notice notice-success mt-2"><p className="font-black">Réponse finale à écrire sur la copie</p><p className="mt-1"><MathText auto>{statementResolution.finalAnswer}</MathText></p><p className="mt-2 text-xs"><strong>Vérification :</strong> {statementResolution.verification}</p></div>}</div>}
   <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>setWorkspace('verify')} className="btn btn-small btn-secondary">Vérifier ma propre étape</button><button onClick={()=>{setShowPractice(true);setShowPracticeHint(false);setShowPracticeSolution(false)}} className="btn btn-small btn-secondary">Exercice similaire</button></div>
  </section>}

  {workspace==='statement'&&intent&&!statementResolution&&<div className="notice notice-info"><strong>Méthode guidée seulement :</strong> je reconnais le chapitre et la démarche, mais je ne peux pas encore calculer automatiquement toute cette question avec assez de fiabilité. Utilise l’outil recommandé ou recopie la partie mathématique exacte ; aucune réponse finale n’est inventée.</div>}
  {workspace==='statement'&&<details className="surface p-3"><summary className="font-black text-xs cursor-pointer">Ce que le moteur d’énoncés sait résoudre complètement</summary><p className="section-copy mt-2">Équations réelles du 1er/2e degré, systèmes linéaires 2×2 ou 3×3, dérivées prises en charge par le moteur symbolique, intégrales définies reconnues, certains calculs de suites, loi binomiale, problèmes financiers simples/composés, variations de polynômes, PGCD, congruences et orthogonalité. Si le moteur n’est pas certain, il reste en méthode guidée.</p></details>}

  {showGuide && (workspace === 'statement' || workspace === 'method') && <section className="surface p-4">
   <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">{intent?'Chapitre détecté':'Chapitre choisi'}</p><h3 className="section-title mt-2">{topic}</h3></div><label><span className="sr-only">Chapitre</span><select aria-label="Chapitre" value={topic} onChange={e=>setTopic(e.target.value as SolverTopic)} className="field !w-auto !py-2 !px-3 text-xs">{Object.keys(METHODS).map(t=><option key={t}>{t}</option>)}</select></label></div>
   {(helpMode==='understand'||helpMode==='start') && <div className="notice notice-info mt-3"><p className="font-bold">Questions à te poser</p>{guide.questions.map((q,i)=><p key={i} className="mt-1">• {q}</p>)}</div>}
   <p className="text-[11px] font-extrabold text-brand mt-4">{guide.title}</p>
   <ol className="mt-2 space-y-2">{guide.steps.slice(0, helpMode==='start'?2:guide.steps.length).map((step,i)=><li key={i} className="surface-flat p-3 flex gap-3 text-xs leading-relaxed"><span className="w-6 h-6 shrink-0 rounded-lg grid place-items-center text-[10px] font-black text-brand" style={{background:'var(--brand-soft)'}}>{i+1}</span><span style={{color:'var(--text-soft)'}}><MathText auto>{step}</MathText></span></li>)}</ol>
   <div className="notice notice-warning mt-3"><p className="font-bold">Points de contrôle</p>{guide.reminders.map((r,i)=><p key={i} className="mt-1">• <MathText auto>{r}</MathText></p>)}</div>
   <button onClick={()=>setHintLevel(level=>level?0:1)} className="btn btn-primary w-full mt-3">{hintLevel?'Masquer l’explication':'Je n’ai pas compris cette étape'}</button>
   {hintLevel>0&&<div className="surface-flat p-3 mt-2">
    <label className="field-label" htmlFor="blocked-step">Étape qui te bloque</label>
    <select id="blocked-step" value={blockedStep} onChange={event=>setBlockedStep(Number(event.target.value))} className="field mt-1">{guide.steps.map((step,index)=><option key={step} value={index}>Étape {index+1} · {step}</option>)}</select>
    <p className="field-label mt-3">Niveau d’explication</p>
    <div className="segmented grid-cols-3 mt-1">
     {([['simple','Très simple'],['detail','Détaillée'],['bac','Méthode BAC']] as Array<[TutorExplanationLevel,string]>).map(([level,label])=><button key={level} onClick={()=>setExplanationLevel(level)} className={explanationLevel===level?'active':''}>{label}</button>)}
    </div>
    <div className="notice notice-info mt-2" aria-live="polite"><p className="font-black">{stepSupport.objective}</p>{stepExplanation.slice(1).map((line,index)=><p key={`${explanationLevel}-${index}`} className="mt-1"><MathText auto>{line}</MathText></p>)}</div>
    {explanationLevel!=='simple'&&<div className="notice notice-warning mt-2"><p className="font-black">Petit exemple</p><p className="mt-1"><MathText auto>{stepSupport.microExample}</MathText></p></div>}
    <div className="grid grid-cols-2 gap-2 mt-2"><button onClick={()=>{setHintLevel(0);setShowPractice(true);setShowPracticeHint(false);setShowPracticeSolution(false)}} className="btn btn-small btn-primary">J’ai compris · essayer</button><button onClick={()=>setWorkspace('verify')} className="btn btn-small btn-secondary">Vérifier mon calcul</button></div>
   </div>}
   <button onClick={()=>{setShowPractice(value=>!value);setShowPracticeHint(false);setShowPracticeSolution(false)}} className="btn btn-secondary w-full mt-3">{showPractice?'Masquer l’entraînement':'M’entraîner sur une question similaire'}</button>
   {showPractice&&<div className="surface-flat p-3 mt-2"><p className="eyebrow">{practice.title}</p><p className="section-title mt-2"><MathText auto>{practice.prompt}</MathText></p><p className="section-copy mt-2">Essaie d’abord seul sur ton brouillon. N’ouvre l’indice que si tu bloques.</p><div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>setShowPracticeHint(value=>!value)} className="btn btn-small btn-secondary">{showPracticeHint?'Masquer l’indice':'Voir un indice'}</button><button onClick={()=>setShowPracticeSolution(value=>!value)} className="btn btn-small btn-secondary">{showPracticeSolution?'Masquer la correction':'Voir la correction'}</button></div>{showPracticeHint&&<div className="notice notice-info mt-2"><strong>Indice :</strong> <MathText auto>{practice.hint}</MathText></div>}{showPracticeSolution&&<div className="notice notice-success mt-2"><p className="font-black">Correction expliquée</p><p className="mt-1"><MathText auto>{practice.solution}</MathText></p><p className="mt-2"><strong>À vérifier :</strong> {practice.checkpoint}</p></div>}</div>}
   {recommendedTool&&onOpenTool&&<button onClick={()=>onOpenTool(recommendedTool)} className="btn btn-secondary w-full mt-3">Ouvrir l’outil {topic.toLowerCase()}</button>}
  </section>}
 </div>;
}
