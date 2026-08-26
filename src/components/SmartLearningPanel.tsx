import { useEffect, useMemo, useState } from 'react';
import { getLearningStore, recommendedQuestions, resolveQuestionRef, studyStreak } from '../lib/learningStore';

interface Props { onOpenQuestion?:(prompt:string)=>void }

export function SmartLearningPanel({onOpenQuestion}:Props) {
 const [version, setVersion] = useState(0);
 const store = useMemo(() => getLearningStore(), [version]);
 const recs = useMemo(() => recommendedQuestions(4), [version]);
 const retryRefs = store.retry.map(resolveQuestionRef).filter(Boolean).slice(0, 5) as NonNullable<ReturnType<typeof resolveQuestionRef>>[];
 const favoriteRefs = store.favorites.map(resolveQuestionRef).filter(Boolean).slice(0, 5) as NonNullable<ReturnType<typeof resolveQuestionRef>>[];
 const streak = studyStreak(store.studyDays);

 useEffect(() => {
  const refresh = () => setVersion(v => v + 1);
  window.addEventListener('mathbac-learning', refresh);
  window.addEventListener('mathbac-progress', refresh);
  return () => { window.removeEventListener('mathbac-learning', refresh); window.removeEventListener('mathbac-progress', refresh); };
 }, []);

 return <>
  <section className="surface p-4">
   <div className="flex items-start justify-between gap-3"><div><p className="eyebrow">V7 · Révision intelligente</p><h3 className="section-title mt-2">Ce que je te conseille maintenant</h3><p className="section-copy mt-1">Priorité aux questions ratées puis aux chapitres les moins maîtrisés.</p></div><div className="text-center"><p className="text-2xl font-black text-brand">{streak}</p><p className="text-[8px] muted">jour{streak>1?'s':''} de suite</p></div></div>
   <div className="space-y-2 mt-3">{recs.map((r,i)=><button type="button" onClick={()=>onOpenQuestion?.(r.question.prompt)} key={r.key} className="surface-flat p-3 flex gap-3 w-full text-left"><span className="w-7 h-7 rounded-lg grid place-items-center font-black text-brand" style={{background:'var(--brand-soft)'}}>{i+1}</span><span className="min-w-0"><span className="text-[10px] font-extrabold text-main block">{r.question.topic} · {r.question.number}</span><span className="section-copy mt-1 line-clamp-2 block">{r.question.prompt.replace(/\$/g,'')}</span><span className="text-[8px] muted mt-1 block">Série {r.subject.series} · {r.subject.title} · ouvrir dans le tuteur</span></span></button>)}</div>
  </section>

  {(retryRefs.length > 0 || favoriteRefs.length > 0) && <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
   <div className="surface p-4"><p className="eyebrow">À refaire</p><h3 className="section-title mt-2">File de révision</h3>{retryRefs.length===0?<p className="section-copy mt-2">Aucune question marquée à refaire.</p>:<div className="space-y-2 mt-3">{retryRefs.map(r=><button type="button" onClick={()=>onOpenQuestion?.(r.question.prompt)} key={r.key} className="text-[9px] surface-flat p-2 w-full text-left"><strong>{r.question.topic}</strong> · {r.question.number}<span className="muted mt-1 line-clamp-1 block">{r.question.prompt.replace(/\$/g,'')}</span></button>)}</div>}</div>
   <div className="surface p-4"><p className="eyebrow">Favoris</p><h3 className="section-title mt-2">À conserver</h3>{favoriteRefs.length===0?<p className="section-copy mt-2">Ajoute une étoile sur une question utile.</p>:<div className="space-y-2 mt-3">{favoriteRefs.map(r=><button type="button" onClick={()=>onOpenQuestion?.(r.question.prompt)} key={r.key} className="text-[9px] surface-flat p-2 w-full text-left"><strong>{r.question.topic}</strong> · {r.question.number}<span className="muted mt-1 line-clamp-1 block">{r.question.prompt.replace(/\$/g,'')}</span></button>)}</div>}</div>
  </section>}

  {store.mistakes.length > 0 && <section className="surface p-4"><p className="eyebrow">Erreurs fréquentes</p><h3 className="section-title mt-2">Mon journal d’erreurs</h3><div className="space-y-2 mt-3">{store.mistakes.slice(0,5).map(m=><div key={m.id} className="notice notice-warning"><p className="font-black">{m.title}</p><p className="mt-1">{m.message}</p><p className="text-[8px] muted mt-1">{m.topic || 'Mathématiques'} · {new Date(m.createdAt).toLocaleDateString('fr-FR')}</p></div>)}</div></section>}
 </>;
}
