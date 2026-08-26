import { lazy, Suspense, useMemo, useState } from 'react';
import { BAC_SUBJECTS, type BacSeries, type BacSubject } from '../data/bacSubjects';
import { subjectProgress } from '../lib/bacProgress';
import { OfficialAnnalesBrowser } from './OfficialAnnalesBrowser';
import { AnnaleStudyWorkbench } from './AnnaleStudyWorkbench';
import { OfflineAnnaleManager } from './OfflineAnnaleManager';

const BacGuidedSolver=lazy(()=>import('./BacGuidedSolver').then(module=>({default:module.BacGuidedSolver})));
const BacExamSession=lazy(()=>import('./BacExamSession').then(module=>({default:module.BacExamSession})));
const SessionLoader=()=> <section className="surface p-5 text-center" role="status"><p className="section-title">Préparation de la session…</p><p className="section-copy mt-2">Le moteur de correction est chargé une seule fois.</p></section>;

interface Props { onAnalyzeFunction?: (expr: string) => void; onTutor?: () => void }
type Mode = 'list' | 'guided' | 'exam';
type LibraryTab = 'annales' | 'training' | 'local';

export function BacLibrary({ onAnalyzeFunction, onTutor }: Props) {
 const [series, setSeries] = useState<BacSeries>('D');
 const [selected, setSelected] = useState<BacSubject | null>(null);
 const [mode, setMode] = useState<Mode>('list');
 const [tab,setTab]=useState<LibraryTab>('training');
 const [refresh, setRefresh] = useState(0);
 const subjects = useMemo(() => BAC_SUBJECTS.filter(s => s.series === series), [series]);

 if (selected && mode === 'guided') {
  return <Suspense fallback={<SessionLoader/>}><BacGuidedSolver subject={selected} onBack={() => { setSelected(null); setMode('list'); setRefresh(v => v + 1); }} onAnalyzeFunction={onAnalyzeFunction} onStartExam={() => setMode('exam')} /></Suspense>;
 }
 if (selected && mode === 'exam') {
  return <Suspense fallback={<SessionLoader/>}><BacExamSession subject={selected} onExit={() => { setSelected(null); setMode('list'); setRefresh(v => v + 1); }} /></Suspense>;
 }

 return (
  <div className="space-y-4 page-enter" key={refresh}>
   <div>
    <p className="eyebrow">Mathématiques · Madagascar</p>
    <h2 className="page-title">Sujets et entraînements</h2>
    <p className="page-copy">Choisis ta série puis avance question par question avec une méthode, des indices et une correction claire.</p>
   </div>

   <div className="segmented grid-cols-3">
    {(['A', 'C', 'D'] as BacSeries[]).map(s => (
     <button key={s} onClick={() => setSeries(s)} className={series === s ? 'active' : ''}>Série {s}</button>
    ))}
   </div>

   <div className="segmented grid-cols-3" role="tablist" aria-label="Type de ressources">
    {([['annales','Annales'],['training','Entraînements'],['local','Mes sujets']] as Array<[LibraryTab,string]>).map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} onClick={()=>setTab(id)} className={tab===id?'active':''}>{label}</button>)}
   </div>

   {tab==='annales' && <OfficialAnnalesBrowser series={series} onOpenTutor={onTutor} />}

   {tab==='training' && <AnnaleStudyWorkbench series={series} onOpenTutor={onTutor} />}

   {tab==='local' && <OfflineAnnaleManager series={series} onOpenTutor={onTutor} />}

   {tab==='training' && <section className="space-y-2.5">
    <div className="flex items-center justify-between gap-2">
     <div><p className="eyebrow">Corpus pédagogique</p><h3 className="section-title mt-2">Entraînements guidés vérifiés</h3></div>
     <span className="chip chip-success">Hors ligne</span>
    </div>
    <div className="notice notice-info">Ces exercices sont originaux et encodés dans l’application. Contrairement aux annales externes, ils disposent d’indices, d’étapes et de vérifications automatiques testées par le moteur pédagogique.</div>

    {subjects.map(subject => {
     const p = subjectProgress(subject);
     return (
      <article key={subject.id} className="paper-card p-4">
       <div className="flex justify-between gap-4">
        <div className="min-w-0">
         <span className="chip chip-warning">Type BAC · non officiel</span>
         <h4 className="section-title mt-3">{subject.title}</h4>
         <p className="section-copy mt-1.5">{subject.description}</p>
        </div>
        <div className="shrink-0 text-right">
         <p className="text-xl font-black text-brand">{p.percent}%</p>
         <p className="text-[8px] muted">maîtrisé</p>
        </div>
       </div>
       <div className="progress-track mt-3"><div className="progress-fill" style={{ width: `${p.percent}%` }} /></div>
       <div className="grid grid-cols-2 gap-2 mt-3">
        <button onClick={() => { setSelected(subject); setMode('guided'); }} className="btn btn-primary">Résolution guidée</button>
        <button onClick={() => { setSelected(subject); setMode('exam'); }} className="btn btn-secondary">Simulation chronométrée</button>
       </div>
      </article>
     );
    })}
   </section>}
  </div>
 );
}
