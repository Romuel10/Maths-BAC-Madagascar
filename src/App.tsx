/** Maths BAC Madagascar · application de révision et résolution BAC. */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { BacHome } from './components/BacHome';
import { BacLibrary } from './components/BacLibrary';
import { BacProgressDashboard } from './components/BacProgressDashboard';
import { GlobalSearch } from './components/GlobalSearch';
import { FunctionInput } from './components/FunctionInput';
import { History } from './components/History';
import { ActivationGate, isActivated } from './components/ActivationGate';
import { analyzeFunctionAsync } from './lib/analysisClient';
import { formatPretty } from './lib/prettyMath';
import { isLang, LangContext, type Lang, t } from './lib/i18n';
import { ThemeContext, applyTheme, type Theme } from './lib/theme';
import { APP_VERSION, COPYRIGHT, CREATOR } from './lib/protection';
import { storageGet, storageJsonGet, storageJsonSet, storageRemove, storageSet } from './lib/safeStorage';
import type { AnalysisResult } from './lib/mathEngine';
import { getStudentProfile, saveAccessibility, type AccessibilityPreferences } from './lib/studentProfile';
import { applyAccessibility } from './lib/accessibility';
import { toolProgramBadge, toolRelevance, type BacToolId } from './data/bacMadagascarScope';

type Page = 'home' | 'subjects' | 'solve' | 'tools' | 'profile';
type Sub = 'steps' | 'graph' | 'props' | 'calc';
type ModalId = 'search' | 'compare' | 'sequence' | 'parametric' | 'complex' | 'matrix' | 'geometry' | 'probability' | 'arithmetic' | 'algebra' | 'calculator' | 'ineqxy' | 'ode' | 'conics' | 'finance';
type IconName = 'home' | 'book' | 'solve' | 'tools' | 'progress' | 'bac' | 'moon' | 'sun' | 'calc' | 'search' | 'install';

const REQUIRE_ACTIVATION = import.meta.env.VITE_REQUIRE_ACTIVATION === 'true';
const PAGES:Page[]=['home','subjects','solve','tools','profile'];
const MODALS:ModalId[]=['search','compare','sequence','parametric','complex','matrix','geometry','probability','arithmetic','algebra','calculator','ineqxy','ode','conics','finance'];

const BacTutor=lazy(()=>import('./components/BacTutor').then(module=>({default:module.BacTutor})));
const LearningCoach=lazy(()=>import('./components/LearningCoach').then(module=>({default:module.LearningCoach})));
const FunctionCompare=lazy(()=>import('./components/FunctionCompare').then(module=>({default:module.FunctionCompare})));
const SequenceAnalyzer=lazy(()=>import('./components/SequenceAnalyzer').then(module=>({default:module.SequenceAnalyzer})));
const ParametricExplorer=lazy(()=>import('./components/ParametricExplorer').then(module=>({default:module.ParametricExplorer})));
const ComplexCalculator=lazy(()=>import('./components/ComplexCalculator').then(module=>({default:module.ComplexCalculator})));
const MatrixCalculator=lazy(()=>import('./components/MatrixCalculator').then(module=>({default:module.MatrixCalculator})));
const GeometryCalc=lazy(()=>import('./components/GeometryCalc').then(module=>({default:module.GeometryCalc})));
const ProbabilityCalc=lazy(()=>import('./components/ProbabilityCalc').then(module=>({default:module.ProbabilityCalc})));
const ArithmeticCalc=lazy(()=>import('./components/ArithmeticCalc').then(module=>({default:module.ArithmeticCalc})));
const AlgebraTools=lazy(()=>import('./components/AlgebraTools').then(module=>({default:module.AlgebraTools})));
const Calculator=lazy(()=>import('./components/Calculator').then(module=>({default:module.Calculator})));
const InequalityXY=lazy(()=>import('./components/InequalityXY').then(module=>({default:module.InequalityXY})));
const DifferentialEquationCalculator=lazy(()=>import('./components/DifferentialEquationCalculator').then(module=>({default:module.DifferentialEquationCalculator})));
const ConicCalculator=lazy(()=>import('./components/ConicCalculator').then(module=>({default:module.ConicCalculator})));
const FinancialMathCalculator=lazy(()=>import('./components/FinancialMathCalculator').then(module=>({default:module.FinancialMathCalculator})));
const InteractiveGraph=lazy(()=>import('./components/InteractiveGraph').then(module=>({default:module.InteractiveGraph})));
const TangentCalculator=lazy(()=>import('./components/TangentCalculator').then(module=>({default:module.TangentCalculator})));
const EquationSolver=lazy(()=>import('./components/EquationSolver').then(module=>({default:module.EquationSolver})));
const IntegralCalculator=lazy(()=>import('./components/IntegralCalculator').then(module=>({default:module.IntegralCalculator})));
const DomainCard=lazy(()=>import('./components/DomainCard').then(module=>({default:module.DomainCard})));
const LimitsCard=lazy(()=>import('./components/LimitsCard').then(module=>({default:module.LimitsCard})));
const VariationTable=lazy(()=>import('./components/VariationTable').then(module=>({default:module.VariationTable})));
const GraphExplanation=lazy(()=>import('./components/GraphExplanation').then(module=>({default:module.GraphExplanation})));
const StepByStep=lazy(()=>import('./components/StepByStep').then(module=>({default:module.StepByStep})));
const SignTableCard=lazy(()=>import('./components/SignTableCard').then(module=>({default:module.SignTableCard})));
const ConvexityCard=lazy(()=>import('./components/ConvexityCard').then(module=>({default:module.ConvexityCard})));
const ValueTable=lazy(()=>import('./components/ValueTable').then(module=>({default:module.ValueTable})));
const InequalitySolver=lazy(()=>import('./components/InequalitySolver').then(module=>({default:module.InequalitySolver})));
const ParityCard=lazy(()=>import('./components/AdvancedFeatures').then(module=>({default:module.ParityCard})));
const PeriodicityCard=lazy(()=>import('./components/AdvancedFeatures').then(module=>({default:module.PeriodicityCard})));
const PrimitiveCard=lazy(()=>import('./components/AdvancedFeatures').then(module=>({default:module.PrimitiveCard})));
const AsymptotesCard=lazy(()=>import('./components/AdvancedFeatures').then(module=>({default:module.AsymptotesCard})));
const CompleteSummary=lazy(()=>import('./components/AdvancedFeatures').then(module=>({default:module.CompleteSummary})));

function readRoute():{page:Page;modal:ModalId|null}{
 const [pagePart,modalPart]=window.location.hash.replace(/^#/,'').split('/');
 const page=PAGES.includes(pagePart as Page)?pagePart as Page:'home';
 const modal=MODALS.includes(modalPart as ModalId)?modalPart as ModalId:null;
 return{page,modal};
}

function LoadingPanel(){
 const [slow,setSlow]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>setSlow(true),8000);return()=>window.clearTimeout(timer);},[]);
 return <div className="surface p-5 text-center" role="status"><span className="loading-spinner" aria-hidden="true"/><p className="section-title mt-3">{slow?'Le chargement prend trop de temps':'Chargement rapide…'}</p><p className="section-copy mt-2">{slow?'Le module n’a pas répondu sur cet appareil. Tes données sont conservées.':'Préparation du module sur ton téléphone.'}</p>{slow&&<button className="btn btn-primary mt-3" onClick={()=>window.location.reload()}>Réessayer</button>}</div>;
}

interface BeforeInstallPromptEvent extends Event {
 prompt: () => Promise<void>;
 userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function Icon({ name }: { name: IconName }) {
 const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
 if (name === 'home') return <svg {...common}><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/></svg>;
 if (name === 'book') return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5z"/></svg>;
 if (name === 'solve') return <svg {...common}><path d="M4 5h16"/><path d="M7 10h10"/><path d="M9 15h6"/><path d="m8 20 2-2 2 2 4-4"/></svg>;
 if (name === 'tools') return <svg {...common}><path d="M14.5 6.5a4 4 0 0 0-5 5L4 17l3 3 5.5-5.5a4 4 0 0 0 5-5l-2.5 2.5-3-3z"/></svg>;
 if (name === 'progress') return <svg {...common}><path d="M5 19V9"/><path d="M12 19V5"/><path d="M19 19v-7"/><path d="M3 19h18"/></svg>;
 if (name === 'bac') return <svg {...common}><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/><path d="m15.5 16 1.5 1.5 3-3"/></svg>;
 if (name === 'moon') return <svg {...common}><path d="M20 15.5A8 8 0 1 1 8.5 4 6.5 6.5 0 0 0 20 15.5Z"/></svg>;
 if (name === 'sun') return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/></svg>;
 if (name === 'calc') return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/></svg>;
 if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>;
 return <svg {...common}><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M5 18v2h14v-2"/></svg>;
}

function App() {
 const initialRoute=useMemo(readRoute,[]);
 const [activated, setActivated] = useState(() => !REQUIRE_ACTIVATION || isActivated());
 const [page, setPage] = useState<Page>(initialRoute.page);
 const [sub, setSub] = useState<Sub>('steps');
 const [modal, setModal] = useState<ModalId | null>(initialRoute.modal);
 const [result, setResult] = useState<AnalysisResult | null>(null);
 const [analysisRange, setAnalysisRange] = useState({ xMin: -10, xMax: 10 });
 const [error, setError] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [history, setHistory] = useState<string[]>(() => storageJsonGet('mathsolver_history', []));
 const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
 const [showInstall, setShowInstall] = useState(false);
 const [updateReady,setUpdateReady]=useState(false);
 const [registration,setRegistration]=useState<ServiceWorkerRegistration|null>(null);
 const [storageWarning,setStorageWarning]=useState(false);
 const [lang, setLang] = useState<Lang>(() => { const saved=storageGet('mathsolver_lang');return isLang(saved)?saved:'fr'; });
 const [theme, setTheme] = useState<Theme>(() => storageGet('mathsolver_theme') === 'light' ? 'light' : 'dark');
 const [accessibility,setAccessibility]=useState<AccessibilityPreferences>(()=>getStudentProfile().accessibility);
 const [studentSeries,setStudentSeriesState]=useState(()=>getStudentProfile().series);
 const modalRef=useRef<HTMLDivElement|null>(null);
 const lastFocusRef=useRef<HTMLElement|null>(null);

 const langCtx = useMemo(() => ({
  lang,
  setLang: (next: Lang) => { setLang(next); storageSet('mathsolver_lang', next); }
 }), [lang]);

 const themeCtx = useMemo(() => ({
  theme,
  toggle: () => {
   const next: Theme = theme === 'dark' ? 'light' : 'dark';
   setTheme(next);
   storageSet('mathsolver_theme', next);
   applyTheme(next);
  }
 }), [theme]);

 const dark = theme === 'dark';

 const navigate=useCallback((next:Page)=>{
  window.history.pushState({mathbacPage:next},'',`#${next}`);
  setPage(next);setModal(null);window.scrollTo({top:0,behavior:'smooth'});
 },[]);

 const openModal=useCallback((id:ModalId)=>{
  window.history.pushState({mathbacPage:page,mathbacModal:id},'',`#${page}/${id}`);
  setModal(id);window.scrollTo({top:0,behavior:'smooth'});
 },[page]);

 const closeModal=useCallback(()=>{
  if(window.history.state?.mathbacModal)window.history.back();
  else{window.history.replaceState({mathbacPage:page},'',`#${page}`);setModal(null);}
 },[page]);

 useEffect(() => { applyTheme(theme); }, [theme]);
 useEffect(()=>{applyAccessibility(accessibility);},[accessibility]);
 useEffect(()=>{const sync=()=>setStudentSeriesState(getStudentProfile().series);window.addEventListener('mathbac-student-profile',sync);return()=>window.removeEventListener('mathbac-student-profile',sync);},[]);
 useEffect(()=>{
  const sync=()=>{const route=readRoute();setPage(route.page);setModal(route.modal);};
  window.addEventListener('popstate',sync);window.addEventListener('hashchange',sync);
  if(!window.location.hash)window.history.replaceState({mathbacPage:'home'},'','#home');
  return()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync);};
 },[]);
 useEffect(()=>{
  const warn=()=>setStorageWarning(true);
  window.addEventListener('mathbac-storage-error',warn);
  return()=>window.removeEventListener('mathbac-storage-error',warn);
 },[]);
 useEffect(()=>{
  if(!modal)return;
  lastFocusRef.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const dialog=modalRef.current;
  const selector='button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  const frame=window.requestAnimationFrame(()=>{(dialog?.querySelector<HTMLElement>(selector)||dialog)?.focus();});
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){event.preventDefault();closeModal();return;}
   if(event.key!=='Tab'||!dialog)return;
   const items=[...dialog.querySelectorAll<HTMLElement>(selector)].filter(item=>item.offsetParent!==null);
   if(!items.length){event.preventDefault();dialog.focus();return;}
   const first=items[0],last=items[items.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  };
  document.addEventListener('keydown',onKey);
  return()=>{window.cancelAnimationFrame(frame);document.removeEventListener('keydown',onKey);lastFocusRef.current?.focus();};
 },[modal,closeModal]);
 useEffect(() => {
  // Capacitor embarque déjà tous les fichiers dans l'APK/AAB. Un Service Worker
  // y serait inutile et peut conserver une ancienne interface après une mise à jour.
  if (Capacitor.isNativePlatform()) return;
  const onInstall = (event: Event) => {
   const installEvent = event as BeforeInstallPromptEvent;
   installEvent.preventDefault();
   setInstallPrompt(installEvent);
   setShowInstall(true);
  };
  window.addEventListener('beforeinstallprompt', onInstall);
  if ('serviceWorker' in navigator) {
   const isLocalDev = Boolean(import.meta.env?.DEV) || ['localhost', '127.0.0.1'].includes(window.location.hostname);
   if (isLocalDev) {
    // Important sous Termux/Vite : un ancien service worker cache-first peut servir
    // une ancienne version de l'application même après remplacement des sources.
    // En développement on désactive donc complètement la PWA et on nettoie ses caches.
    navigator.serviceWorker.getRegistrations().then(regs => Promise.all(regs.map(r => r.unregister()))).catch(() => undefined);
    if ('caches' in window) {
     caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('maths-bac-madagascar-')).map(k => caches.delete(k)))).catch(() => undefined);
    }
   } else {
    const swUrl = new URL('sw.js', document.baseURI).toString();
    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' }).then(reg=>{
     setRegistration(reg);
     const inspect=(worker:ServiceWorker|null)=>{
      if(!worker)return;
      worker.addEventListener('statechange',()=>{
       if(worker.state==='installed'&&navigator.serviceWorker.controller)setUpdateReady(true);
      });
     };
     inspect(reg.installing);
     reg.addEventListener('updatefound',()=>inspect(reg.installing));
     if(reg.waiting&&navigator.serviceWorker.controller)setUpdateReady(true);
    }).catch(() => undefined);
   }
  }
  let reloading=false;
  const onControllerChange=()=>{if(!reloading){reloading=true;window.location.reload();}};
  navigator.serviceWorker?.addEventListener('controllerchange',onControllerChange);
  return () => {window.removeEventListener('beforeinstallprompt', onInstall);navigator.serviceWorker?.removeEventListener('controllerchange',onControllerChange);};
 }, []);

 const handleInstall = async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  if (choice.outcome === 'accepted') setShowInstall(false);
 };

 const applyUpdate=()=>{
  if(registration?.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
  else window.location.reload();
 };

 const handleAnalyze = useCallback(async (expr: string, xMin = -10, xMax = 10) => {
  setIsLoading(true);
  setError(null);
  setResult(null);
  try {
    const next = await analyzeFunctionAsync(expr, xMin, xMax);
    setResult(next);
    setAnalysisRange({ xMin, xMax });
    setSub('steps');
    setHistory(previous => {
     const updated = [expr, ...previous.filter(item => item !== expr)].slice(0, 12);
     storageJsonSet('mathsolver_history', updated);
     return updated;
    });
  } catch (e: unknown) {
    setError(e instanceof Error ? e.message : 'Erreur pendant l’analyse');
  } finally {
    setIsLoading(false);
  }
 }, []);

 const handleExternal = useCallback((expr: string) => {
  setModal(null);
  navigate('tools');
  void handleAnalyze(expr, -10, 10);
 }, [handleAnalyze,navigate]);

 const clearHistory = useCallback(() => {
  setHistory([]);
  storageRemove('mathsolver_history');
 }, []);

 const updateAccessibility=(patch:Partial<AccessibilityPreferences>)=>{
  setAccessibility(previous=>{const next={...previous,...patch};saveAccessibility(next);return next;});
 };

 const modals: Record<ModalId, ReactNode> = {
  search: <GlobalSearch onClose={closeModal} onOpenTopic={topic=>{storageSet('mathbac_learning_open',topic);navigate('profile');}} onOpenQuestion={prompt=>{storageSet('mathbac_tutor_prefill',prompt);navigate('solve');}} onAnalyzeFunction={handleExternal}/>,
  compare: <FunctionCompare onClose={closeModal} />,
  sequence: <SequenceAnalyzer onClose={closeModal} />,
  parametric: <ParametricExplorer onClose={closeModal} />,
  complex: <ComplexCalculator onClose={closeModal} />,
  matrix: <MatrixCalculator onClose={closeModal} series={studentSeries} />,
  geometry: <GeometryCalc onClose={closeModal} />,
  probability: <ProbabilityCalc onClose={closeModal} series={studentSeries} />,
  arithmetic: <ArithmeticCalc onClose={closeModal} />,
  algebra: <AlgebraTools onClose={closeModal} />,
  calculator: <Calculator onClose={closeModal} />,
  ineqxy: <InequalityXY onClose={closeModal} />,
  ode: <DifferentialEquationCalculator onClose={closeModal} />,
  conics: <ConicCalculator onClose={closeModal} />,
  finance: <FinancialMathCalculator onClose={closeModal} />,
 };

 if (!activated) return <ActivationGate onActivated={() => setActivated(true)} />;

 const ToolCard = ({ symbol, title, desc, onClick, tool }: { symbol: string; title: string; desc: string; onClick: () => void; tool?: BacToolId }) => {
  if(tool&&studentSeries&&toolRelevance(tool,studentSeries)==='extra')return null;
  const badge=tool?toolProgramBadge(tool,studentSeries):null;
  return <button onClick={onClick} className="tool-card active:scale-[0.98] transition-transform">
   <span className="tool-symbol">{symbol}</span>
   <p className="tool-title">{title}</p>
   <p className="tool-copy">{desc}</p>
   {badge&&<span className={`chip mt-2 ${badge.tone==='success'?'chip-success':badge.tone==='info'?'chip-info':''}`}>{badge.label}</span>}
  </button>;
 };

 const ToolGroup = ({ title, copy, children }: { title: string; copy: string; children: ReactNode }) => (
  <section>
   <div className="mb-2.5"><h3 className="section-title">{title}</h3><p className="section-copy mt-1">{copy}</p></div>
   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">{children}</div>
  </section>
 );

 const nav: Array<[Page, IconName, string]> = [
  ['home', 'home', t('navHome', lang)],
  ['profile', 'book', t('navReview', lang)],
  ['solve', 'solve', t('navSolve', lang)],
  ['subjects', 'bac', t('navBac', lang)],
  ['tools', 'tools', t('navTools', lang)],
 ];

 return (
  <LangContext.Provider value={langCtx}>
   <ThemeContext.Provider value={themeCtx}>
    <div className="app-shell">
     <header className={`app-header ${modal ? "hidden" : ""}`}>
      <div className="app-container flex items-center justify-between gap-2">
       <button onClick={() => navigate('home')} className="brand-button">
        <div className="brand-mark" aria-hidden="true">M</div>
        <div className="min-w-0">
         <h1 className="brand-title truncate">Maths BAC Madagascar</h1>
         <p className="brand-subtitle truncate">Espace de préparation BAC · v{APP_VERSION}</p>
        </div>
       </button>
       <div className="header-actions">
        <button onClick={() => openModal('search')} className="icon-button" aria-label="Rechercher dans l’application"><Icon name="search" /></button>
        <button onClick={() => openModal('calculator')} className="icon-button" aria-label="Calculatrice"><Icon name="calc" /></button>
        <button onClick={themeCtx.toggle} className="icon-button" aria-label={dark ? 'Passer au mode clair' : 'Passer au mode sombre'}><Icon name={dark ? 'sun' : 'moon'} /></button>
        {showInstall && <button onClick={handleInstall} className="icon-button text-brand" aria-label="Installer l’application"><Icon name="install" /></button>}
       </div>
      </div>
     </header>

     <main className="app-container relative z-[1] px-4 py-5 pb-32">
      <div className="sr-only" aria-live="polite" aria-atomic="true">{isLoading?'Analyse en cours.':error?'Analyse terminée avec une erreur.':result?'Analyse terminée.':''}</div>
      {storageWarning && <div className="notice notice-warning mb-3" role="status"><strong>Stockage local indisponible.</strong> La session continue, mais certaines données ne pourront pas être conservées sur cet appareil. <button className="underline" onClick={()=>setStorageWarning(false)}>Masquer</button></div>}
      {updateReady && <div className="notice notice-info mb-3" role="status"><strong>Une mise à jour est prête.</strong> <button className="btn btn-small btn-primary ml-2" onClick={applyUpdate}>Actualiser</button></div>}
      {!modal && page === 'home' && <BacHome onBac={() => navigate('subjects')} onTutor={() => navigate('solve')} onTools={() => navigate('tools')} onReview={() => navigate('profile')} />}
      {!modal && page === 'subjects' && <Suspense fallback={<LoadingPanel/>}><BacLibrary onAnalyzeFunction={handleExternal} onTutor={() => navigate('solve')} /></Suspense>}
      {!modal && page === 'solve' && <Suspense fallback={<LoadingPanel/>}><BacTutor onAnalyzeFunction={handleExternal} onOpenTool={tool=>openModal(tool)} /></Suspense>}

      {modal && (
       <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Outil mathématique" tabIndex={-1} className="modal-host page-enter">
        <Suspense fallback={<LoadingPanel/>}>{modals[modal]}</Suspense>
       </div>
      )}

      {!modal && page === 'tools' && <Suspense fallback={<LoadingPanel/>}>
       <div className="space-y-4 page-enter">
        <div>
         <p className="eyebrow">Outils</p>
         <h2 className="page-title">Outils mathématiques</h2>
         <p className="page-copy">Des calculateurs pour contrôler un raisonnement, explorer une fonction ou vérifier un résultat pendant les révisions.</p>
        </div>

        <div className="math-lab">
         <div className="math-lab-head">
          <div>
           <p className="math-lab-title">Analyse complète de fonction</p>
           <p className="math-lab-copy">Dérivées simplifiées, graphe pédagogique, intégrales exactes et étude complète.</p>
          </div>
          {result && <button onClick={() => { setResult(null); setError(null); }} className="btn btn-small btn-secondary">Nouvelle analyse</button>}
         </div>
         {isLoading && <div className="notice notice-info mb-3" role="status"><strong>Analyse en cours…</strong> Le domaine, les dérivées, les limites et le graphe sont en préparation.</div>}
         <FunctionInput onAnalyze={handleAnalyze} isLoading={isLoading} />
         <History items={history} onSelect={expr => handleAnalyze(expr)} onEdit={expr=>{storageSet('mathbac_function_prefill',formatPretty(expr));navigate('solve');}} onClear={clearHistory} />

         {error && <div className="notice mt-3" style={{ borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)', color: 'var(--danger)' }}><strong>Analyse impossible :</strong> {error}</div>}

         {result && <Suspense fallback={<LoadingPanel/>}>
          <div className="space-y-3 mt-3">
           <div className="formula-strip text-center">
            <p className="eyebrow">Fonction analysée</p>
            <p className="text-[21px] font-serif font-extrabold mt-2" style={{ color: 'var(--text)' }}>f(x) = {formatPretty(result.expression)}</p>
            <p className="text-[11px] font-serif muted mt-2">f'(x) = {formatPretty(result.derivativeExpr)}</p>
           </div>

           <div className="segmented grid-cols-4">
            {([
             ['steps', '01', 'Étapes'],
             ['graph', '02', 'Graphe'],
             ['props', '03', 'Propriétés'],
             ['calc', '04', 'Calculs'],
            ] as Array<[Sub, string, string]>).map(([id, num, label]) => (
             <button key={id} onClick={() => setSub(id)} className={sub === id ? 'active' : ''}>
              <span className="text-[8px] block opacity-70">{num}</span><span className="text-[9px] font-bold">{label}</span>
             </button>
            ))}
           </div>

           {sub === 'steps' && <StepByStep result={result} />}
           {sub === 'graph' && <>
            <InteractiveGraph data={result.plotData} xMin={analysisRange.xMin} xMax={analysisRange.xMax} criticalPoints={result.variation.criticalPoints} zeros={result.zeros} inflectionPoints={result.convexity.inflectionPoints} asymptotes={result.asymptotes} expression={result.expression} derivativeExpr={result.derivativeExpr} secondDerivativeExpr={result.secondDerivativeExpr} />
            <GraphExplanation result={result} />
            <SignTableCard signTable={result.signTable} zeros={result.zeros} expression={result.expression} />
            <VariationTable variation={result.variation} domain={result.domain} derivativeExpr={formatPretty(result.derivativeExpr)} />
           </>}
           {sub === 'props' && <>
            <CompleteSummary result={result} />
            <ParityCard parity={result.parity} />
            <PeriodicityCard periodicity={result.periodicity} />
            <ConvexityCard convexity={result.convexity} secondDerivativeExpr={result.secondDerivativeExpr} expression={result.expression} />
            <PrimitiveCard primitiveExpr={result.primitiveExpr} expression={result.expression} />
            <AsymptotesCard asymptotes={result.asymptotes} />
            <DomainCard domain={result.domain} expression={result.expression} />
            <LimitsCard limits={result.limits} expression={result.expression} />
           </>}
           {sub === 'calc' && <>
            <ValueTable expression={result.expression} derivativeExpr={result.derivativeExpr} secondDerivativeExpr={result.secondDerivativeExpr} />
            <InequalitySolver expression={result.expression} />
            <IntegralCalculator expression={result.expression} plotData={result.plotData} />
            <TangentCalculator expression={result.expression} derivativeExpr={result.derivativeExpr} />
            <EquationSolver expression={result.expression} />
           </>}
          </div>
         </Suspense>}
        </div>
        {!result && (
         <div className="space-y-5">
          <div className="notice notice-info"><strong>{studentSeries?`Outils du programme · série ${studentSeries}`:'Choisis ta série dans Réviser'}</strong> · Les outils hors programme sont masqués dès que ta série est configurée.</div>
          <ToolGroup title="Outils de ma série" copy="Les calculateurs les plus utiles pour vérifier et comprendre tes exercices.">
           <ToolCard tool="algebra" symbol="x²" title="Algèbre" desc="Équations, inéquations, factorisation" onClick={() => openModal('algebra')} />
           <ToolCard tool="sequence" symbol="uₙ" title="Suites" desc="Termes, récurrence et convergence" onClick={() => openModal('sequence')} />
           <ToolCard tool="probability" symbol="P" title="Probabilités & stats" desc="Lois, dénombrement et statistiques" onClick={() => openModal('probability')} />
           <ToolCard tool="geometry" symbol="∠" title="Géométrie" desc="Vecteurs, espace et configurations" onClick={() => openModal('geometry')} />
           <ToolCard tool="complex" symbol="ℂ" title="Complexes" desc="Formes, modules, arguments et équations" onClick={() => openModal('complex')} />
           <ToolCard tool="arithmetic" symbol="≡" title="Arithmétique" desc="Euclide, Bézout et congruences" onClick={() => openModal('arithmetic')} />
           <ToolCard tool="matrix" symbol="[A]" title="Matrices" desc="Systèmes, Cramer, RREF et puissances" onClick={() => openModal('matrix')} />
           <ToolCard tool="finance" symbol="%" title="Finance" desc="Intérêts, actualisation et annuités" onClick={() => openModal('finance')} />
           <ToolCard tool="ode" symbol="y′" title="Équations différentielles" desc="1er/2e ordre et conditions initiales" onClick={() => openModal('ode')} />
           <ToolCard tool="conics" symbol="◯" title="Coniques" desc="Parabole, ellipse et hyperbole" onClick={() => openModal('conics')} />
           <ToolCard tool="ineqxy" symbol="≤" title="Inéquations XY" desc="Demi-plans et contraintes" onClick={() => openModal('ineqxy')} />
          </ToolGroup>
          <details className="surface p-4">
           <summary className="font-black cursor-pointer">Outils complémentaires</summary>
           <p className="section-copy mt-2">À ouvrir seulement si l’exercice le demande.</p>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
            <ToolCard tool="compare" symbol="f≈g" title="Comparer deux fonctions" desc="Comparer f et g sur un intervalle" onClick={() => openModal('compare')} />
            <ToolCard tool="parametric" symbol="fₐ" title="Fonction à paramètre" desc="Explorer une famille f(x,a)" onClick={() => openModal('parametric')} />
           </div>
          </details>
         </div>
        )}
       </div>
      </Suspense>}

      {!modal && page === 'profile' && (
       <div className="space-y-4">
        <div><p className="eyebrow">Réviser</p><h2 className="page-title">Cours, coach et progression</h2><p className="page-copy">Commence par le cours, puis entraîne-toi sur tes points faibles et suis tes progrès.</p></div>
        <Suspense fallback={<LoadingPanel/>}><LearningCoach onOpenTool={tool=>openModal(tool)} onOpenQuestion={prompt=>{storageSet('mathbac_tutor_prefill',prompt);navigate('solve');}} /></Suspense>
        <Suspense fallback={<LoadingPanel/>}><BacProgressDashboard onOpenQuestion={(prompt:string)=>{storageSet('mathbac_tutor_prefill',prompt);navigate('solve');}} /></Suspense>
        <section className="surface p-4">
         <p className="eyebrow">Préférences</p>
         <h3 className="section-title mt-2">Réglages de l’application</h3>
         <div className="grid grid-cols-2 gap-2.5 mt-3">
          <button onClick={themeCtx.toggle} className="btn btn-secondary">{dark ? <><Icon name="sun" /> Mode clair</> : <><Icon name="moon" /> Mode sombre</>}</button>
          <button onClick={() => langCtx.setLang(lang === 'fr' ? 'mg' : 'fr')} className="btn btn-secondary">{lang === 'fr' ? 'MG · Navigation' : 'FR · Navigation'}</button>
         </div>
         <p className="section-copy mt-2">Le réglage FR/MG adapte la navigation générale. Les contenus mathématiques restent en français pour conserver la terminologie scolaire du BAC.</p>
         <div className="surface-flat p-3 mt-3 space-y-3">
          <label className="field-label" htmlFor="text-scale">Taille du texte</label>
          <select id="text-scale" value={accessibility.textScale} onChange={event=>updateAccessibility({textScale:event.target.value as AccessibilityPreferences['textScale']})} className="field"><option value="normal">Normale</option><option value="large">Grande</option><option value="xlarge">Très grande</option></select>
          <label className="annale-check-row"><input type="checkbox" checked={accessibility.highContrast} onChange={event=>updateAccessibility({highContrast:event.target.checked})}/><span>Contraste renforcé</span></label>
          <label className="annale-check-row"><input type="checkbox" checked={accessibility.reduceMotion} onChange={event=>updateAccessibility({reduceMotion:event.target.checked})}/><span>Réduire les animations</span></label>
         </div>
         {showInstall && <button onClick={handleInstall} className="btn btn-primary w-full mt-3"><Icon name="install" /> Installer l’application</button>}
        </section>
        <section className="surface p-4 text-center">
         <div className="brand-mark mx-auto">M</div>
         <p className="section-title mt-3">Maths BAC Madagascar</p>
         <p className="section-copy mt-1">v{APP_VERSION} · Plateforme de préparation BAC</p>
         <p className="text-[10px] font-bold text-brand mt-2">{CREATOR}</p>
         <p className="text-[8px] subtle mt-1">{COPYRIGHT}</p>
        </section>
       </div>
      )}
     </main>

     {!modal && <nav className="bottom-nav" aria-label="Navigation principale">
      <div className="app-container bottom-nav-inner">
       {!modal && nav.map(([id, icon, label]) => (
        <button key={id} onClick={() => navigate(id)} className={`nav-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined}>
         <Icon name={icon} />
         <span lang={lang === 'mg' ? 'mg' : 'fr'}>{label}</span>
        </button>
       ))}
      </div>
     </nav>}
    </div>
   </ThemeContext.Provider>
  </LangContext.Provider>
 );
}

export default App;
