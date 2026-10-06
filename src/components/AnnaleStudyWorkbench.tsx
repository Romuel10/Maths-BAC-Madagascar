import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { BacSeries } from '../data/bacSubjects';
import {
 correctionEvidenceLabel,
 studyPacksForSeries,
 subjectEvidenceLabel,
} from '../data/annaleStudy';
import { storageJsonGet, storageJsonSet, storageSet } from '../lib/safeStorage';

interface Props {
 series: BacSeries;
 onOpenTutor?: () => void;
}

type SavedState = { checked: boolean[]; notes: string; question: string };

function loadState(id: string, count: number): SavedState {
 const parsed=storageJsonGet<Partial<SavedState>>(`maths_bac_annale_work_${id}`,{});
 return {
  checked: Array.from({ length: count }, (_, i) => Boolean(parsed.checked?.[i])),
  notes: typeof parsed.notes === 'string' ? parsed.notes : '',
  question: typeof parsed.question === 'string' ? parsed.question : '',
 };
}

function EvidenceChip({ ok, children }: { ok: boolean; children: ReactNode }) {
 return <span className={`chip ${ok ? 'chip-success' : 'chip-warning'}`}>{children}</span>;
}

export function AnnaleStudyWorkbench({ series, onOpenTutor }: Props) {
 const packs = useMemo(() => studyPacksForSeries(series), [series]);
 const [selectedId, setSelectedId] = useState(packs[0]?.id ?? '');
 const selected = packs.find(pack => pack.id === selectedId) ?? packs[0];
 const [saved, setSaved] = useState<SavedState>(() => selected ? loadState(selected.id, selected.checkpoints.length) : { checked: [], notes: '', question: '' });

 useEffect(() => {
  if (!packs.some(pack => pack.id === selectedId)) setSelectedId(packs[0]?.id ?? '');
 }, [packs, selectedId]);

 useEffect(() => {
  if (!selected) return;
  setSaved(loadState(selected.id, selected.checkpoints.length));
 }, [selected?.id]);

 useEffect(() => {
  if (!selected) return;
  storageJsonSet(`maths_bac_annale_work_${selected.id}`, saved);
 }, [selected?.id, saved]);

 if (!selected) return null;

 const done = saved.checked.filter(Boolean).length;
 const percent = Math.round((done / Math.max(1, selected.checkpoints.length)) * 100);
 const subjectOk = selected.subjectEvidence === 'verified';
 const correctionOk = selected.correctionEvidence !== 'not-confirmed';

 return (
  <section className="annale-workbench">
   <div className="annale-workbench-head">
    <div>
     <p className="eyebrow">V7 · Travail sur annale</p>
     <h3 className="section-title mt-2">Annales 2023 & 2022 · Série {series}</h3>
     <p className="section-copy mt-1.5">Un espace de travail qui sépare clairement le sujet officiel, le corrigé réellement disponible et tes propres vérifications.</p>
    </div>
    <div className="annale-progress-ring"><strong>{percent}%</strong><span>contrôlé</span></div>
   </div>

   <div className="segmented grid-cols-2 mt-3">
    {packs.map(pack => (
     <button key={pack.id} onClick={() => setSelectedId(pack.id)} className={selected.id === pack.id ? 'active' : ''}>{pack.year}</button>
    ))}
   </div>

   <article className="annale-evidence-card mt-3">
    <div className="flex flex-wrap gap-1.5">
     <EvidenceChip ok={subjectOk}>{subjectEvidenceLabel(selected.subjectEvidence)}</EvidenceChip>
     <EvidenceChip ok={correctionOk}>{correctionEvidenceLabel(selected.correctionEvidence)}</EvidenceChip>
    </div>
    <h4 className="section-title mt-2.5">{selected.title}</h4>
    <p className="section-copy mt-1.5">{selected.evidenceNote}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
     <a href={selected.subjectUrl} target="_blank" rel="noreferrer" className="btn btn-primary">Consulter l’archive ↗</a>
     {selected.correctionUrl ? <a href={selected.correctionUrl} target="_blank" rel="noreferrer" className="btn btn-secondary">Voir les corrigés disponibles ↗</a> : <button className="btn btn-secondary" disabled>Aucun corrigé confirmé</button>}
    </div>
   </article>

   <div className="annale-workflow mt-3">
    {selected.workflow.map((step, index) => (
     <div key={step.title} className="annale-workflow-step">
      <div className="annale-workflow-index">{index + 1}</div>
      <div><p className="font-extrabold text-[0.625rem] text-main">{step.title}</p><p className="section-copy mt-1">{step.detail}</p></div>
     </div>
    ))}
   </div>

   <div className="paper-card p-4 mt-3">
    <div className="flex items-center justify-between gap-3">
     <div><p className="eyebrow">Contrôle de copie</p><h4 className="section-title mt-2">Avant de valider une réponse</h4></div>
     <span className="chip chip-info">{done}/{selected.checkpoints.length}</span>
    </div>
    <div className="annale-checklist mt-3">
     {selected.checkpoints.map((label, index) => (
      <label key={label} className="annale-check-row">
       <input type="checkbox" checked={saved.checked[index] ?? false} onChange={event => setSaved(prev => ({ ...prev, checked: prev.checked.map((v, i) => i === index ? event.target.checked : v) }))} />
       <span>{label}</span>
      </label>
     ))}
    </div>
   </div>

   <div className="paper-card p-4 mt-3">
    <p className="eyebrow">Question en cours</p>
    <h4 className="section-title mt-2">Recopie seulement la question que tu travailles</h4>
    <p className="section-copy mt-1.5">Le texte reste sur ton appareil. Cela évite de mélanger plusieurs questions et facilite la vérification dans l’atelier.</p>
    <label className="field-label mt-3 block" htmlFor="annale-current-question">Question recopiée</label>
    <textarea id="annale-current-question" className="field min-h-[86px] mt-2" value={saved.question} onChange={e => setSaved(prev => ({ ...prev, question: e.target.value.slice(0,5000) }))} placeholder="Ex. : Étudier le signe de f′(x) puis dresser le tableau de variations…" />
    {onOpenTutor && <button disabled={!saved.question.trim()} onClick={()=>{storageSet('mathbac_tutor_prefill',saved.question.trim());onOpenTutor();}} className="btn btn-primary w-full mt-2">Ouvrir l’atelier avec cette question</button>}
   </div>

   <div className="paper-card p-4 mt-3">
    <p className="eyebrow">Journal d’erreurs</p>
    <h4 className="section-title mt-2">Ce que je dois refaire</h4>
    <label className="field-label mt-3 block" htmlFor="annale-error-notes">Mes notes</label>
    <textarea id="annale-error-notes" className="field min-h-[100px] mt-2" value={saved.notes} onChange={e => setSaved(prev => ({ ...prev, notes: e.target.value.slice(0,10000) }))} placeholder="Ex. : j’ai oublié le domaine ; erreur de signe dans la dérivée ; résultat arrondi trop tôt…" />
    <p className="text-[0.5rem] muted mt-2">Sauvegardé automatiquement hors ligne sur cet appareil.</p>
   </div>
  </section>
 );
}
