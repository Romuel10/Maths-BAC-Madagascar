import { useMemo, useState } from 'react';
import { BAC_SUBJECTS, type BacSeries, type BacSubject } from '../data/bacSubjects';
import { subjectProgress } from '../lib/bacProgress';
import { BacGuidedSolver } from './BacGuidedSolver';
import { BacExamSession } from './BacExamSession';
import { OfficialAnnalesBrowser } from './OfficialAnnalesBrowser';
import { AnnaleStudyWorkbench } from './AnnaleStudyWorkbench';
import { OfflineAnnaleManager } from './OfflineAnnaleManager';

interface Props { onAnalyzeFunction?: (expr: string) => void; onTutor?: () => void }
type Mode = 'list' | 'guided' | 'exam';

export function BacLibrary({ onAnalyzeFunction, onTutor }: Props) {
 const [series, setSeries] = useState<BacSeries>('D');
 const [selected, setSelected] = useState<BacSubject | null>(null);
 const [mode, setMode] = useState<Mode>('list');
 const [refresh, setRefresh] = useState(0);
 const subjects = useMemo(() => BAC_SUBJECTS.filter(s => s.series === series), [series]);

 if (selected && mode === 'guided') {
  return <BacGuidedSolver subject={selected} onBack={() => { setSelected(null); setMode('list'); setRefresh(v => v + 1); }} onAnalyzeFunction={onAnalyzeFunction} onStartExam={() => setMode('exam')} />;
 }
 if (selected && mode === 'exam') {
  return <BacExamSession subject={selected} onExit={() => { setSelected(null); setMode('list'); setRefresh(v => v + 1); }} />;
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

   <OfficialAnnalesBrowser series={series} onOpenTutor={onTutor} />

   <AnnaleStudyWorkbench series={series} onOpenTutor={onTutor} />

   <OfflineAnnaleManager series={series} onOpenTutor={onTutor} />

   <section className="space-y-2.5">
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
        <button onClick={() => { setSelected(subject); setMode('exam'); }} className="btn btn-secondary">Mode examen</button>
       </div>
      </article>
     );
    })}
   </section>
  </div>
 );
}
