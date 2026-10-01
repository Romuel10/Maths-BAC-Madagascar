import { useMemo, useState } from 'react';
import type { BacSeries } from '../data/bacSubjects';
import { annalesForSeries, OFFICIAL_ARCHIVE_SOURCES, trustLabel, type ArchiveTrust, type CorrectionScope } from '../data/officialAnnales';

interface Props {
 series: BacSeries;
 onOpenTutor?: () => void;
}

type Filter = 'all' | 'corrected' | 'trusted';

function TrustChip({ trust }: { trust: ArchiveTrust }) {
 const cls = trust === 'verified-archive' ? 'chip-success' : trust === 'catalogued' ? 'chip-info' : 'chip-warning';
 return <span className={`chip ${cls}`}>{trustLabel(trust)}</span>;
}

function CorrectionChip({ scope, available }: { scope?: CorrectionScope; available: boolean }) {
 if (!available || scope === 'none') return <span className="chip">Sujet</span>;
 if (scope === 'problem') return <span className="chip chip-info">Corrigé du problème</span>;
 if (scope === 'partial') return <span className="chip chip-warning">Corrigé partiel</span>;
 if (scope === 'full') return <span className="chip chip-success">Corrigé complet</span>;
 return <span className="chip chip-success">Corrigé repéré</span>;
}

export function OfficialAnnalesBrowser({ series, onOpenTutor }: Props) {
 const [filter, setFilter] = useState<Filter>('all');
 const [expanded, setExpanded] = useState<string | null>(null);
 const rows = useMemo(() => {
  const base = annalesForSeries(series);
  if (filter === 'corrected') return base.filter(x => x.correctionAvailable);
  if (filter === 'trusted') return base.filter(x => x.trust !== 'secondary');
  return base;
 }, [series, filter]);

 const trustedCount = rows.filter(x => x.trust !== 'secondary').length;
 const correctedCount = rows.filter(x => x.correctionAvailable).length;

 return (
  <section className="archive-panel">
   <div className="archive-head">
    <div>
     <p className="eyebrow">Annales réelles</p>
     <h3 className="section-title mt-2">BAC Madagascar · Série {series}</h3>
     <p className="section-copy mt-1.5">Les années ci-dessous ont été repérées dans des archives d’annales. L’application sépare volontairement les sources recoupées des copies communautaires récentes.</p>
    </div>
    <div className="archive-score" aria-label={`${trustedCount} annales de confiance`}>
     <strong>{trustedCount}</strong>
     <span>références</span>
    </div>
   </div>

   <div className="archive-rule mt-3">
    <span className="archive-rule-dot" />
    <p><strong>Fiabilité d’abord :</strong> aucun énoncé OCR incertain n’est transformé automatiquement en correction guidée. Une correction intégrée doit d’abord être encodée et vérifiée ligne par ligne.</p>
   </div>
   <div className="notice notice-info mt-3"><strong>Connexion requise :</strong> les fiches, la progression et les entraînements intégrés fonctionnent hors ligne, mais l’ouverture d’une archive externe nécessite Internet.</div>

   <div className="segmented grid-cols-3 mt-3">
    <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>Toutes</button>
    <button onClick={() => setFilter('corrected')} className={filter === 'corrected' ? 'active' : ''}>Avec corrigé</button>
    <button onClick={() => setFilter('trusted')} className={filter === 'trusted' ? 'active' : ''}>Recoupées</button>
   </div>

   <div className="archive-stats mt-3">
    <div><strong>{rows.length}</strong><span>annales affichées</span></div>
    <div><strong>{correctedCount}</strong><span>corrigés repérés</span></div>
    <div><strong>{series}</strong><span>série sélectionnée</span></div>
   </div>

   <div className="space-y-2.5 mt-3">
    {rows.length===0&&<div className="notice notice-warning" role="status">Aucune référence ne correspond à ce filtre pour la série {series}. Essaie « Toutes ».</div>}
    {rows.map(item => {
     const isOpen = expanded === item.id;
     return (
      <article key={item.id} className="archive-card">
       <button className="archive-card-main" onClick={() => setExpanded(isOpen ? null : item.id)} aria-expanded={isOpen}>
        <div className="archive-year">{item.year}</div>
        <div className="min-w-0 flex-1 text-left">
         <div className="flex flex-wrap gap-1.5">
          <TrustChip trust={item.trust} />
          <CorrectionChip scope={item.correctionScope} available={item.correctionAvailable} />
         </div>
         <h4 className="archive-title mt-2">Mathématiques · Série {series}</h4>
         <p className="archive-source mt-1">{item.sourceName}</p>
        </div>
        <span className="archive-chevron">{isOpen ? '−' : '+'}</span>
       </button>

       {isOpen && (
        <div className="archive-details">
         <p>{item.note}</p>
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
          <a className="btn btn-primary" href={item.subjectUrl} target="_blank" rel="noreferrer">Ouvrir le sujet ↗</a>
          {item.archiveUrl && <a className="btn btn-secondary" href={item.archiveUrl} target="_blank" rel="noreferrer">Vérifier l’archive ↗</a>}
         </div>
         {onOpenTutor && (
          <button onClick={onOpenTutor} className="btn btn-ghost w-full mt-2">Ouvrir l’atelier pour travailler une question</button>
         )}
        </div>
       )}
      </article>
     );
    })}
   </div>

   <div className="archive-sources mt-3">
    <p className="font-bold">Sources de référence intégrées</p>
    <div className="flex flex-wrap gap-2 mt-2">
     {series==='S'?<a href={OFFICIAL_ARCHIVE_SOURCES.terminaleSProgramme} target="_blank" rel="noreferrer">Programme MEN · Série S ↗</a>:<a href={series === 'A' ? OFFICIAL_ARCHIVE_SOURCES.educmadA : series === 'C' ? OFFICIAL_ARCHIVE_SOURCES.educmadC : OFFICIAL_ARCHIVE_SOURCES.educmadD} target="_blank" rel="noreferrer">EDUCMAD · Série {series} ↗</a>}
     <a href={OFFICIAL_ARCHIVE_SOURCES.lechaya} target="_blank" rel="noreferrer">Catalogue LeChaya ↗</a>
     <a href={OFFICIAL_ARCHIVE_SOURCES.ministryProgramme} target="_blank" rel="noreferrer">Programme lycée MEN ↗</a>
    </div>
   </div>
  </section>
 );
}
