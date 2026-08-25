import { useMemo, useState } from 'react';
import { MathExpression, MathText } from './MathNotation';
import { MiniKeyboard, prettyToMath } from './MiniKeyboard';
import { verifyTransformation } from '../lib/pedagogy';

type TutorTopic = 'Analyse' | 'Algèbre' | 'Complexes' | 'Probabilités' | 'Suites' | 'Géométrie' | 'Arithmétique' | 'Général';
type HelpMode = 'understand' | 'start' | 'verify' | 'plan';

const METHODS: Record<TutorTopic, { title: string; steps: string[]; reminders: string[]; questions: string[] }> = {
 Analyse: { title: 'Méthode d’étude d’une fonction', steps: ['Déterminer l’ensemble de définition.', 'Calculer les limites utiles.', 'Calculer et simplifier la dérivée.', 'Étudier le signe de la dérivée puis dresser les variations.', 'Chercher les asymptotes et les points remarquables si la question le demande.'], reminders: ['Un dénominateur doit être non nul.', 'Sous une racine carrée : $u≥0$.', 'Dans $ln(u)$ : $u>0$.'], questions: ['Quelle est l’expression exacte de la fonction ?', 'Quel est son domaine ?', 'La question demande-t-elle une limite, une dérivée, un signe ou un tableau ?'] },
 Algèbre: { title: 'Méthode algébrique', steps: ['Identifier ce qu’il faut trouver : racines, factorisation, système…', 'Réduire l’expression et isoler les termes utiles.', 'Choisir la méthode adaptée : factorisation, discriminant, substitution ou élimination.', 'Vérifier chaque solution dans l’énoncé initial.'], reminders: ['Pour $ax^2+bx+c=0$, penser à $Δ=b^2-4ac$.', 'Toujours vérifier les valeurs interdites.'], questions: ['Quelle est l’inconnue ?', 'Peut-on factoriser ?', 'Y a-t-il une valeur interdite ?'] },
 Complexes: { title: 'Méthode avec les nombres complexes', steps: ['Écrire $z$ sous la forme $a+bi$ si possible.', 'Séparer partie réelle et partie imaginaire.', 'Pour une équation du second degré, calculer $Δ$ dans $ℂ$.', 'Pour module/argument, choisir la représentation adaptée puis vérifier.'], reminders: ['$i^2=-1$.', 'Le conjugué de $a+bi$ est $a-bi$.'], questions: ['Cherche-t-on une solution, un module ou un argument ?', 'Peut-on utiliser le conjugué ?', 'Le résultat vérifie-t-il l’équation initiale ?'] },
 Probabilités: { title: 'Méthode en probabilités', steps: ['Définir clairement les événements.', 'Repérer indépendance, conditionnement ou répétition d’épreuves.', 'Écrire la formule avant de remplacer par les nombres.', 'Contrôler que la probabilité obtenue est entre 0 et 1.'], reminders: ['Binomiale : $P(X=k)=C(n,k)p^k(1-p)^(n-k)$.', '$P(A∪B)=P(A)+P(B)-P(A∩B)$.'], questions: ['Combien d’issues y a-t-il ?', 'Les épreuves sont-elles indépendantes ?', 'Est-ce une loi binomiale ou un conditionnement ?'] },
 Suites: { title: 'Méthode pour les suites', steps: ['Identifier si la suite est explicite ou définie par récurrence.', 'Calculer quelques premiers termes si cela aide.', 'Étudier monotonie et bornes si une convergence est demandée.', 'Une limite candidate obtenue par $ℓ=f(ℓ)$ doit ensuite être justifiée.'], reminders: ['Une limite candidate n’est pas une preuve.', 'Suite géométrique : $u_n=u_0q^n$.'], questions: ['La suite est-elle explicite ou récurrente ?', 'Cherche-t-on un terme, une monotonie ou une limite ?', 'Peut-on comparer $u_(n+1)$ et $u_n$ ?'] },
 Géométrie: { title: 'Méthode en géométrie', steps: ['Faire un schéma et relever les données.', 'Choisir un repère ou des vecteurs si cela simplifie.', 'Traduire la propriété demandée en égalité, produit scalaire, déterminant ou distance.', 'Conclure avec une phrase géométrique.'], reminders: ['Orthogonalité : produit scalaire nul.', 'Colinéarité : déterminant nul en dimension 2.'], questions: ['Quelle propriété faut-il montrer ?', 'Un repère simplifierait-il le problème ?', 'Quelles coordonnées sont connues ?'] },
 Arithmétique: { title: 'Méthode en arithmétique', steps: ['Repérer divisibilité, PGCD, congruence ou équation diophantienne.', 'Utiliser l’algorithme d’Euclide si nécessaire.', 'Écrire proprement les congruences.', 'Vérifier la divisibilité ou la solution finale.'], reminders: ['$a≡b [n]$ signifie que $n$ divise $a-b$.', 'Bézout relie le PGCD à une combinaison linéaire.'], questions: ['Quel est le modulo ?', 'Cherche-t-on un PGCD ou une divisibilité ?', 'Peut-on appliquer Euclide ou Bézout ?'] },
 Général: { title: 'Méthode générale de résolution', steps: ['Lire exactement ce qui est demandé.', 'Lister les données et l’inconnue.', 'Identifier le chapitre.', 'Écrire le théorème ou la formule avant le calcul.', 'Vérifier puis conclure.'], reminders: ['Au BAC, le raisonnement et la justification comptent autant que le résultat final.'], questions: ['Quelles sont les données ?', 'Quelle est la question exacte ?', 'Quel chapitre du cours ressemble le plus à ce problème ?'] }
};

function detectTopic(text: string): TutorTopic {
 const s = text.toLowerCase();
 if (/dériv|limite|variation|asympt|fonction|tangente|primitive|intégrale/.test(s)) return 'Analyse';
 if (/complex|\bz\b|module|argument|conjugu/.test(s)) return 'Complexes';
 if (/probab|binom|événement|tirage|urne/.test(s)) return 'Probabilités';
 if (/suite|u_n|un\+1|récurrence|géométrique|arithmétique.*suite/.test(s)) return 'Suites';
 if (/vecteur|droite|cercle|plan|distance|triangle|orthogonal|barycentre/.test(s)) return 'Géométrie';
 if (/pgcd|congru|divisib|premier|bézout|euclide/.test(s)) return 'Arithmétique';
 if (/équation|inéquation|factor|développ|polyn|système|matrice/.test(s)) return 'Algèbre';
 return 'Général';
}

interface Props { onAnalyzeFunction?: (expr: string) => void }

export function BacTutor({ onAnalyzeFunction }: Props) {
 const [statement, setStatement] = useState(() => { const prefill = localStorage.getItem('mathbac_tutor_prefill') || ''; if (prefill) localStorage.removeItem('mathbac_tutor_prefill'); return prefill; });
 const [topic, setTopic] = useState<TutorTopic>('Général');
 const [showGuide, setShowGuide] = useState(false);
 const [photo, setPhoto] = useState<string | null>(null);
 const [photoConfirmed, setPhotoConfirmed] = useState(false);
 const [functionExpr, setFunctionExpr] = useState('');
 const [helpMode, setHelpMode] = useState<HelpMode>('understand');
 const [previousStep, setPreviousStep] = useState('');
 const [nextStep, setNextStep] = useState('');
 const [stepFeedback, setStepFeedback] = useState<ReturnType<typeof verifyTransformation> | null>(null);
 const guide = useMemo(() => METHODS[topic], [topic]);

 const analyzeStatement = () => { setTopic(detectTopic(statement)); setShowGuide(true); };
 const onPhoto = (file?: File) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { setPhoto(String(reader.result)); setPhotoConfirmed(false); };
  reader.readAsDataURL(file);
 };

 const verifyStep = () => {
  if (!previousStep.trim() || !nextStep.trim()) return;
  setStepFeedback(verifyTransformation(previousStep, nextStep));
 };

 const modeCopy: Record<HelpMode, string> = {
  understand: 'Décompose la consigne et identifie ce que l’on cherche.',
  start: 'Donne seulement le point de départ et les premières questions à se poser.',
  verify: 'Contrôle deux lignes de calcul sans dévoiler toute la correction.',
  plan: 'Construit un plan complet de résolution à suivre sur le brouillon.'
 };

 return <div className="space-y-4 page-enter">
  <div><p className="eyebrow">V4 · Assistant de résolution</p><h2 className="page-title">Comprendre avant de calculer</h2><p className="page-copy">L’assistant organise ton travail, vérifie des étapes et te guide sans inventer une réponse. Les contrôles restent locaux et les conclusions incertaines sont signalées.</p></div>

  <section className="surface p-4">
   <div className="segmented grid-cols-4">
    {([['understand','Comprendre'],['start','Commencer'],['verify','Vérifier'],['plan','Plan']] as Array<[HelpMode,string]>).map(([id,label])=><button key={id} onClick={()=>setHelpMode(id)} className={helpMode===id?'active':''}>{label}</button>)}
   </div><p className="section-copy mt-2">{modeCopy[helpMode]}</p>
  </section>

  <section className="surface p-4">
   <div className="flex items-center justify-between gap-2"><label className="field-label">Photo du sujet</label><span className={`chip ${photoConfirmed?'chip-success':'chip-warning'}`}>{photoConfirmed?'Transcription confirmée':'Photo non lue automatiquement'}</span></div>
   <input type="file" accept="image/*" capture="environment" onChange={e => onPhoto(e.target.files?.[0])} className="mt-2 block w-full text-[10px] muted" />
   {photo && <><img src={photo} alt="Sujet photographié" className="mt-3 w-full max-h-64 object-contain rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }} /><div className="notice notice-warning mt-2"><strong>Sécurité mathématique.</strong> La V4 ne prétend pas reconnaître automatiquement une formule sur la photo. Recopie-la exactement puis confirme la transcription avant de calculer.</div></>}
  </section>

  <section className="paper-card p-4">
   <label className="field-label">Énoncé ou question recopiée</label>
   <textarea value={statement} onChange={e => { setStatement(e.target.value); setShowGuide(false); setPhotoConfirmed(false); }} rows={6} placeholder="Recopie exactement la question, avec les signes et exposants…" className="field mt-2 resize-none" />
   {photo && <label className="annale-check-row mt-2"><input type="checkbox" checked={photoConfirmed} onChange={e=>setPhotoConfirmed(e.target.checked)}/><span>J’ai comparé la transcription à la photo : nombres, signes, parenthèses et exposants sont corrects.</span></label>}
   <button onClick={analyzeStatement} disabled={!statement.trim() || Boolean(photo && !photoConfirmed)} className="btn btn-primary w-full mt-3">Analyser la méthode</button>
  </section>

  {helpMode === 'verify' && <section className="surface p-4"><p className="eyebrow">Contrôle de deux lignes</p><h3 className="section-title mt-2">Cette transformation est-elle correcte ?</h3><div className="mt-3"><MiniKeyboard value={previousStep} onChange={v=>{setPreviousStep(v);setStepFeedback(null)}} label="Ligne précédente" placeholder="Ex. 2x+4=10"/><div className="mt-2"><MiniKeyboard value={nextStep} onChange={v=>{setNextStep(v);setStepFeedback(null)}} label="Ligne suivante" placeholder="Ex. 2x=6"/></div><button onClick={verifyStep} disabled={!previousStep.trim()||!nextStep.trim()} className="btn btn-primary w-full mt-2">Vérifier la transformation</button>{stepFeedback&&<div className={`notice mt-2 ${stepFeedback.status==='incorrect'?'notice-danger':stepFeedback.status==='verified'?'notice-success':'notice-warning'}`}><p className="font-black">{stepFeedback.title}</p><p className="mt-1">{stepFeedback.message}</p></div>}</div></section>}

  {showGuide && <section className="surface p-4">
   <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">Chapitre détecté</p><h3 className="section-title mt-2">{topic}</h3></div><select value={topic} onChange={e=>setTopic(e.target.value as TutorTopic)} className="field !w-auto !py-2 !px-3 text-[10px]">{Object.keys(METHODS).map(t=><option key={t}>{t}</option>)}</select></div>
   {(helpMode==='understand'||helpMode==='start') && <div className="notice notice-info mt-3"><p className="font-bold">Questions à te poser</p>{guide.questions.map((q,i)=><p key={i} className="mt-1">• {q}</p>)}</div>}
   <p className="text-[11px] font-extrabold text-brand mt-4">{guide.title}</p>
   <ol className="mt-2 space-y-2">{guide.steps.slice(0, helpMode==='start'?2:guide.steps.length).map((step,i)=><li key={i} className="surface-flat p-3 flex gap-3 text-xs leading-relaxed"><span className="w-6 h-6 shrink-0 rounded-lg grid place-items-center text-[10px] font-black text-brand" style={{background:'var(--brand-soft)'}}>{i+1}</span><span style={{color:'var(--text-soft)'}}><MathText auto>{step}</MathText></span></li>)}</ol>
   <div className="notice notice-warning mt-3"><p className="font-bold">Points de contrôle</p>{guide.reminders.map((r,i)=><p key={i} className="mt-1">• <MathText auto>{r}</MathText></p>)}</div>
  </section>}

  {onAnalyzeFunction && <section className="surface p-4"><p className="eyebrow">Étude de fonction</p><p className="section-copy mt-2">Si l’énoncé contient une fonction, saisis uniquement son expression. Vérifie l’aperçu mathématique avant d’ouvrir l’analyseur.</p><div className="mt-3"><MiniKeyboard value={functionExpr} onChange={setFunctionExpr} placeholder="Ex. (x²+1)÷(x−1)" />{functionExpr.trim()&&<div className="math-preview mt-2"><p className="math-preview-label">Expression comprise par le moteur</p><MathExpression value={prettyToMath(functionExpr)} block className="math-preview-expression"/></div>}<button onClick={()=>functionExpr.trim()&&onAnalyzeFunction(prettyToMath(functionExpr.trim()))} className="btn btn-secondary w-full mt-2">Analyser la fonction</button></div></section>}
 </div>;
}
