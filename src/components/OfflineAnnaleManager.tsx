import { useEffect, useMemo, useState } from 'react';
import type { BacSeries } from '../data/bacSubjects';
import { addLocalAnnale, exportLocalAnnales, getLocalAnnales, importLocalAnnales, removeLocalAnnale } from '../lib/localAnnales';
import { storageSet } from '../lib/safeStorage';

interface Props { series: BacSeries; onOpenTutor?: () => void }

export function OfflineAnnaleManager({ series, onOpenTutor }: Props) {
 const [version, setVersion] = useState(0);
 const [open, setOpen] = useState(false);
 const [title, setTitle] = useState('');
 const [year, setYear] = useState(new Date().getFullYear());
 const [prompt, setPrompt] = useState('');
 const [expected, setExpected] = useState('');
 const [steps, setSteps] = useState('');
 const [json, setJson] = useState('');
 const [message, setMessage] = useState('');
 const items = useMemo(() => getLocalAnnales().filter(a => a.series === series), [series, version]);

 useEffect(() => {
  const refresh = () => setVersion(v => v + 1);
  window.addEventListener('mathbac-local-annales', refresh);
  return () => window.removeEventListener('mathbac-local-annales', refresh);
 }, []);

 const add = () => {
  if (!title.trim() || !prompt.trim()) { setMessage('Ajoute au moins un titre et une question.'); return; }
  try{
   addLocalAnnale({
    title: title.trim(), series, year, sourceNote: 'Contenu ajouté localement — à vérifier avec le sujet source.',
    questions: [{ id: `q-${Date.now()}`, number: '1', prompt: prompt.trim(), expected: expected.trim() || undefined, correctionSteps: steps.split('\n').map(s => s.trim()).filter(Boolean) }]
   });
   setTitle(''); setPrompt(''); setExpected(''); setSteps(''); setMessage('Annale ajoutée hors ligne.'); setVersion(v => v + 1);
  }catch(error:unknown){setMessage(error instanceof Error?error.message:'Impossible d’enregistrer cette annale.');}
 };

 const doImport = () => {
  const result = importLocalAnnales(json);
  setMessage(result.error || `${result.imported} annale(s) importée(s).`);
  if (!result.error) { setJson(''); setVersion(v => v + 1); }
 };

 const copyExport = async () => {
  const txt = exportLocalAnnales();
  try { await navigator.clipboard.writeText(txt); setMessage('Export JSON copié.'); }
  catch { setJson(txt); setOpen(true); setMessage('Copie le JSON affiché ci-dessous.'); }
 };

 return (
  <section className="surface p-4">
   <div className="flex items-start justify-between gap-3">
    <div><p className="eyebrow">V7 · Hors ligne</p><h3 className="section-title mt-2">Mes annales locales · Série {series}</h3><p className="section-copy mt-1.5">Ajoute toi-même un énoncé contrôlé depuis ton PDF ou ton scan. L’application ne modifie pas le texte et le conserve uniquement sur l’appareil.</p></div>
    <span className="chip chip-success">{items.length} locale{items.length > 1 ? 's' : ''}</span>
   </div>

   {items.length > 0 && <div className="space-y-2 mt-3">{items.map(a => <article key={a.id} className="surface-flat p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-extrabold text-[0.6875rem] text-main">{a.title}</p><p className="section-copy mt-1">{a.year} · {a.questions.length} question{a.questions.length > 1 ? 's' : ''}</p><p className="text-[0.5rem] muted mt-1">{a.sourceNote}</p></div><button onClick={() => { if (window.confirm('Supprimer cette annale locale ?')) removeLocalAnnale(a.id); }} className="btn btn-small btn-ghost text-danger">Supprimer</button></div><details className="mt-2"><summary className="text-[0.5625rem] font-bold text-brand cursor-pointer">Voir le contenu</summary><div className="mt-2 space-y-2">{a.questions.map(q => <div key={q.id} className="notice notice-info"><p className="font-bold">Question {q.number}</p><p className="mt-1">{q.prompt}</p>{q.correctionSteps.length > 0 && <ol className="mt-2 list-decimal pl-4">{q.correctionSteps.map((s,i)=><li key={i}>{s}</li>)}</ol>}{onOpenTutor && <button onClick={() => { storageSet('mathbac_tutor_prefill', q.prompt); onOpenTutor(); }} className="btn btn-small btn-secondary mt-2">Travailler dans l’assistant</button>}</div>)}</div></details></article>)}</div>}

   <button onClick={() => setOpen(v => !v)} className="btn btn-secondary w-full mt-3">{open ? 'Fermer l’éditeur local' : 'Ajouter / importer une annale'}</button>
   {open && <div className="mt-3 space-y-3">
    <div className="paper-card p-3"><p className="field-label">Ajouter une question contrôlée</p><label className="field-label mt-2 block" htmlFor="local-title">Titre</label><input id="local-title" className="field mt-1" maxLength={200} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titre du sujet / année"/><div className="grid grid-cols-2 gap-2 mt-2"><label><span className="field-label">Série</span><select aria-label="Série" className="field mt-1" value={series} disabled><option>{series}</option></select></label><label><span className="field-label">Année</span><input aria-label="Année" className="field mt-1" type="number" min={1900} max={2100} value={year} onChange={e=>setYear(Number(e.target.value))}/></label></div><label className="field-label mt-2 block" htmlFor="local-prompt">Question</label><textarea id="local-prompt" maxLength={10000} className="field min-h-[90px] mt-1" value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Recopie exactement la question…"/><label className="field-label mt-2 block" htmlFor="local-expected">Réponse finale facultative</label><input id="local-expected" maxLength={5000} className="field mt-1" value={expected} onChange={e=>setExpected(e.target.value)} placeholder="Réponse finale"/><label className="field-label mt-2 block" htmlFor="local-steps">Correction</label><textarea id="local-steps" maxLength={20000} className="field min-h-[90px] mt-1" value={steps} onChange={e=>setSteps(e.target.value)} placeholder={'Une étape par ligne\nÉtape 1\nÉtape 2'}/><button onClick={add} className="btn btn-primary w-full mt-2">Enregistrer hors ligne</button></div>
    <div className="paper-card p-3"><label className="field-label" htmlFor="local-json">Import / export JSON</label><p className="section-copy mt-1">Utile pour préparer les annales sur un autre appareil puis les transférer sans serveur. Taille maximale : 1 Mo.</p><textarea id="local-json" className="field min-h-[110px] mt-2 font-mono text-[0.5625rem]" value={json} onChange={e=>setJson(e.target.value.slice(0,1000000))} placeholder="Colle ici un export Maths BAC Madagascar…"/><div className="grid grid-cols-2 gap-2 mt-2"><button onClick={doImport} disabled={!json.trim()} className="btn btn-primary">Importer</button><button onClick={copyExport} className="btn btn-secondary">Exporter</button></div></div>
   </div>}
   {message && <div className="notice notice-info mt-3" role="status">{message}</div>}
  </section>
 );
}
