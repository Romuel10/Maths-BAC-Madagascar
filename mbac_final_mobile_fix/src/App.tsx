/**
 * Maths BAC Madagascar — évolution de MathSolver Pro
 * © RATOVOSON Navelanizara Romuel
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { FunctionInput } from './components/FunctionInput';
import { DomainCard } from './components/DomainCard';
import { LimitsCard } from './components/LimitsCard';
import { VariationTable } from './components/VariationTable';
import { InteractiveGraph } from './components/InteractiveGraph';
import { GraphExplanation } from './components/GraphExplanation';
import { StepByStep } from './components/StepByStep';
import { SignTableCard } from './components/SignTableCard';
import { ConvexityCard } from './components/ConvexityCard';
import { TangentCalculator } from './components/TangentCalculator';
import { EquationSolver } from './components/EquationSolver';
import { IntegralCalculator } from './components/IntegralCalculator';
import { History } from './components/History';
import { FunctionCompare } from './components/FunctionCompare';
import { RevisionSheets } from './components/RevisionSheets';
import { SequenceAnalyzer } from './components/SequenceAnalyzer';
import { ParametricExplorer } from './components/ParametricExplorer';
import { ComplexCalculator } from './components/ComplexCalculator';
import { MatrixCalculator } from './components/MatrixCalculator';
import { ParityCard, PeriodicityCard, PrimitiveCard, AsymptotesCard, CompleteSummary } from './components/AdvancedFeatures';
import { ValueTable } from './components/ValueTable';
import { InequalitySolver } from './components/InequalitySolver';
import { GeometryCalc } from './components/GeometryCalc';
import { ProbabilityCalc } from './components/ProbabilityCalc';
import { ArithmeticCalc } from './components/ArithmeticCalc';
import { AlgebraTools } from './components/AlgebraTools';
import { Calculator } from './components/Calculator';
import { UnitConverter } from './components/UnitConverter';
import { MiniLesson } from './components/MiniLesson';
import { InequalityXY } from './components/InequalityXY';
import { BacHome } from './components/BacHome';
import { BacLibrary } from './components/BacLibrary';
import { BacTutor } from './components/BacTutor';
import { BacProgressDashboard } from './components/BacProgressDashboard';
import { ActivationGate, isActivated } from './components/ActivationGate';
import { analyzeFunction } from './lib/mathEngine';
import { formatPretty } from './lib/prettyMath';
import { LangContext, type Lang } from './lib/i18n';
import { ThemeContext, applyTheme, type Theme } from './lib/theme';
import { APP_VERSION, COPYRIGHT, CREATOR } from './lib/protection';
import type { AnalysisResult } from './lib/mathEngine';

type Page = 'home' | 'subjects' | 'solve' | 'tools' | 'profile';
type Sub = 'steps' | 'graph' | 'props' | 'calc';
type IconName = 'home' | 'book' | 'solve' | 'tools' | 'progress' | 'moon' | 'sun' | 'calc' | 'install';

const REQUIRE_ACTIVATION = import.meta.env.VITE_REQUIRE_ACTIVATION === 'true';

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
 if (name === 'moon') return <svg {...common}><path d="M20 15.5A8 8 0 1 1 8.5 4 6.5 6.5 0 0 0 20 15.5Z"/></svg>;
 if (name === 'sun') return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.41M17.66 6.34l1.41-1.41"/></svg>;
 if (name === 'calc') return <svg {...common}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2"/></svg>;
 return <svg {...common}><path d="M12 3v12"/><path d="m8 11 4 4 4-4"/><path d="M5 18v2h14v-2"/></svg>;
}

function App() {
 const [activated, setActivated] = useState(() => !REQUIRE_ACTIVATION || isActivated());
 const [page, setPage] = useState<Page>('home');
 const [sub, setSub] = useState<Sub>('steps');
 const [modal, setModal] = useState<string | null>(null);
 const [result, setResult] = useState<AnalysisResult | null>(null);
 const [error, setError] = useState<string | null>(null);
 const [isLoading, setIsLoading] = useState(false);
 const [history, setHistory] = useState<string[]>(() => {
  try { return JSON.parse(localStorage.getItem('mathsolver_history') || '[]'); } catch { return []; }
 });
 const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
 const [showInstall, setShowInstall] = useState(false);
 const [lang, setLang] = useState<Lang>(() => (localStorage.getItem('mathsolver_lang') as Lang) || 'fr');
 const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('mathsolver_theme') as Theme) || 'dark');

 const langCtx = useMemo(() => ({
  lang,
  setLang: (next: Lang) => { setLang(next); localStorage.setItem('mathsolver_lang', next); }
 }), [lang]);

 const themeCtx = useMemo(() => ({
  theme,
  toggle: () => {
   const next: Theme = theme === 'dark' ? 'light' : 'dark';
   setTheme(next);
   localStorage.setItem('mathsolver_theme', next);
   applyTheme(next);
  }
 }), [theme]);

 const dark = theme === 'dark';

 useEffect(() => { applyTheme(theme); }, [theme]);
 useEffect(() => {
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
    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' }).catch(() => undefined);
   }
  }
  return () => window.removeEventListener('beforeinstallprompt', onInstall);
 }, []);

 const handleInstall = async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  if (choice.outcome === 'accepted') setShowInstall(false);
 };

 const handleAnalyze = useCallback((expr: string, xMin = -10, xMax = 10) => {
  setIsLoading(true);
  setError(null);
  setResult(null);
  window.setTimeout(() => {
   try {
    const next = analyzeFunction(expr, xMin, xMax);
    setResult(next);
    setSub('steps');
    setPage('tools');
    setHistory(previous => {
     const updated = [expr, ...previous.filter(item => item !== expr)].slice(0, 12);
     localStorage.setItem('mathsolver_history', JSON.stringify(updated));
     return updated;
    });
   } catch (e: unknown) {
    setError(e instanceof Error ? e.message : 'Erreur pendant l’analyse');
   } finally {
    setIsLoading(false);
   }
  }, 30);
 }, []);

 const handleExternal = useCallback((expr: string) => {
  setModal(null);
  handleAnalyze(expr, -10, 10);
 }, [handleAnalyze]);

 const clearHistory = useCallback(() => {
  setHistory([]);
  localStorage.removeItem('mathsolver_history');
 }, []);

 const modals: Record<string, ReactNode> = {
  compare: <FunctionCompare onClose={() => setModal(null)} />,
  revision: <RevisionSheets onClose={() => setModal(null)} />,
  sequence: <SequenceAnalyzer onClose={() => setModal(null)} />,
  parametric: <ParametricExplorer onClose={() => setModal(null)} />,
  complex: <ComplexCalculator onClose={() => setModal(null)} />,
  matrix: <MatrixCalculator onClose={() => setModal(null)} />,
  geometry: <GeometryCalc onClose={() => setModal(null)} />,
  probability: <ProbabilityCalc onClose={() => setModal(null)} />,
  arithmetic: <ArithmeticCalc onClose={() => setModal(null)} />,
  algebra: <AlgebraTools onClose={() => setModal(null)} />,
  units: <UnitConverter onClose={() => setModal(null)} />,
  calculator: <Calculator onClose={() => setModal(null)} />,
  lessons: <MiniLesson onClose={() => setModal(null)} />,
  ineqxy: <InequalityXY onClose={() => setModal(null)} />,
 };

 if (!activated) return <ActivationGate onActivated={() => setActivated(true)} />;

 const ToolCard = ({ symbol, title, desc, onClick }: { symbol: string; title: string; desc: string; onClick: () => void }) => (
  <button onClick={onClick} className="tool-card active:scale-[0.98] transition-transform">
   <span className="tool-symbol">{symbol}</span>
   <p className="tool-title">{title}</p>
   <p className="tool-copy">{desc}</p>
  </button>
 );

 const ToolGroup = ({ title, copy, children }: { title: string; copy: string; children: ReactNode }) => (
  <section>
   <div className="mb-2.5"><h3 className="section-title">{title}</h3><p className="section-copy mt-1">{copy}</p></div>
   <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">{children}</div>
  </section>
 );

 const nav: Array<[Page, IconName, string]> = [
  ['home', 'home', 'Accueil'],
  ['subjects', 'book', 'Apprendre'],
  ['solve', 'solve', 'Résoudre'],
  ['tools', 'tools', 'Outils'],
  ['profile', 'progress', 'Profil'],
 ];

 return (
  <LangContext.Provider value={langCtx}>
   <ThemeContext.Provider value={themeCtx}>
    <div className="app-shell">
     <header className={`app-header ${modal ? "hidden" : ""}`}>
      <div className="app-container flex items-center justify-between gap-2">
       <button onClick={() => setPage('home')} className="brand-button">
        <div className="brand-mark" aria-hidden="true">M</div>
        <div className="min-w-0">
         <h1 className="brand-title truncate">Maths BAC Madagascar</h1>
         <p className="brand-subtitle truncate">Espace de préparation BAC · v{APP_VERSION}</p>
        </div>
       </button>
       <div className="header-actions">
        <button onClick={() => setModal('calculator')} className="icon-button" aria-label="Calculatrice"><Icon name="calc" /></button>
        <button onClick={themeCtx.toggle} className="icon-button" aria-label={dark ? 'Passer au mode clair' : 'Passer au mode sombre'}><Icon name={dark ? 'sun' : 'moon'} /></button>
        {showInstall && <button onClick={handleInstall} className="icon-button text-brand" aria-label="Installer l’application"><Icon name="install" /></button>}
       </div>
      </div>
     </header>

     <main className="app-container relative z-[1] px-4 py-5 pb-32">
      {page === 'home' && <BacHome onSubjects={() => setPage('subjects')} onTutor={() => setPage('solve')} onTools={() => setPage('tools')} onProgress={() => setPage('profile')} />}
      {page === 'subjects' && <BacLibrary onAnalyzeFunction={handleExternal} onTutor={() => setPage('solve')} />}
      {page === 'solve' && <BacTutor onAnalyzeFunction={handleExternal} />}

      {modal && (
       <div className="tool-page page-enter mt-5 pb-24">
        <div className="tool-page-header">
          <h2 className="page-title">Outil</h2>
          <button
            className="tool-close-button"
            onClick={() => setModal(null)}
            aria-label="Fermer l'outil"
          >
            ×
          </button>
        </div>
        {modals[modal]}
       </div>
      )}

      {!modal && page === 'tools' && (
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
         <FunctionInput onAnalyze={handleAnalyze} isLoading={isLoading} />
         <History items={history} onSelect={expr => handleAnalyze(expr)} onClear={clearHistory} />

         {error && <div className="notice mt-3" style={{ borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)', color: 'var(--danger)' }}><strong>Analyse impossible :</strong> {error}</div>}

         {result && (
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
            <InteractiveGraph data={result.plotData} xMin={-10} xMax={10} criticalPoints={result.variation.criticalPoints} zeros={result.zeros} inflectionPoints={result.convexity.inflectionPoints} asymptotes={result.asymptotes} expression={result.expression} derivativeExpr={result.derivativeExpr} secondDerivativeExpr={result.secondDerivativeExpr} />
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
         )}
        </div>
        {!result && (
         <div className="space-y-5">
          <ToolGroup title="Calcul et algèbre" copy="Résoudre, transformer et contrôler les calculs symboliques.">
           <ToolCard symbol="x²" title="Algèbre" desc="Développer, réduire, factoriser" onClick={() => setModal('algebra')} />
           <ToolCard symbol="ℂ" title="Complexes" desc="Formes, module, argument, équations" onClick={() => setModal('complex')} />
           <ToolCard symbol="≡" title="Arithmétique" desc="PGCD, divisibilité et congruences" onClick={() => setModal('arithmetic')} />
          </ToolGroup>
          <ToolGroup title="Analyse" copy="Étudier les fonctions, suites et relations entre expressions.">
           <ToolCard symbol="uₙ" title="Suites" desc="Termes, monotonie et convergence" onClick={() => setModal('sequence')} />
           <ToolCard symbol="f≈g" title="Comparer" desc="Comparer deux fonctions sur un intervalle" onClick={() => setModal('compare')} />
           <ToolCard symbol="fₐ" title="Paramètres" desc="Explorer une famille f(x,a)" onClick={() => setModal('parametric')} />
          </ToolGroup>
          <ToolGroup title="Géométrie et données" copy="Outils de calcul pour les chapitres appliqués du BAC.">
           <ToolCard symbol="∠" title="Géométrie" desc="Vecteurs, distances et configurations" onClick={() => setModal('geometry')} />
           <ToolCard symbol="P" title="Probabilités" desc="Lois, combinatoire et statistiques" onClick={() => setModal('probability')} />
           <ToolCard symbol="[A]" title="Matrices" desc="Déterminant, inverse et systèmes" onClick={() => setModal('matrix')} />
           <ToolCard symbol="≤" title="Inéquations XY" desc="Demi-plans et contraintes" onClick={() => setModal('ineqxy')} />
          </ToolGroup>
          <ToolGroup title="Révision et utilitaires" copy="Rappels rapides et outils complémentaires.">
           <ToolCard symbol="Σ" title="Fiches" desc="Formules et méthodes essentielles" onClick={() => setModal('revision')} />
           <ToolCard symbol="01" title="Mini-leçons" desc="Réviser une notion étape par étape" onClick={() => setModal('lessons')} />
           <ToolCard symbol="↔" title="Unités" desc="Conversions rapides" onClick={() => setModal('units')} />
          </ToolGroup>
         </div>
        )}
       </div>
      )}

      {page === 'profile' && (
       <div className="space-y-4">
        <BacProgressDashboard />
        <section className="surface p-4">
         <p className="eyebrow">Préférences</p>
         <h3 className="section-title mt-2">Réglages de l’application</h3>
         <div className="grid grid-cols-2 gap-2.5 mt-3">
          <button onClick={themeCtx.toggle} className="btn btn-secondary">{dark ? <><Icon name="sun" /> Mode clair</> : <><Icon name="moon" /> Mode sombre</>}</button>
          <button onClick={() => langCtx.setLang(lang === 'fr' ? 'mg' : 'fr')} className="btn btn-secondary">{lang === 'fr' ? 'MG · Malagasy' : 'FR · Français'}</button>
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
        <button key={id} onClick={() => setPage(id)} className={`nav-item ${page === id ? 'active' : ''}`} aria-current={page === id ? 'page' : undefined}>
         <Icon name={icon} />
         <span>{label}</span>
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
