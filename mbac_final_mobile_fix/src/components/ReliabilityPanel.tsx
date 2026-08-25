import React from 'react';

export type ReliabilityLevel = 'verified' | 'approximate' | 'warning';

interface Props {
 level: ReliabilityLevel;
 title: string;
 detail: string;
 checks?: Array<{ label: string; ok: boolean; detail?: string }>;
}

export function ReliabilityPanel({ level, title, detail, checks = [] }: Props) {
 const marker = level === 'verified' ? '' : level === 'approximate' ? '≈' : '!';
 return (
  <div className={`quality-panel quality-${level}`}>
   <div className="quality-head">
    <span className="quality-mark" aria-hidden="true">{marker}</span>
    <div>
     <p className="quality-title">{title}</p>
     <p className="quality-copy">{detail}</p>
    </div>
   </div>
   {checks.length > 0 && (
    <div className="quality-checks">
     {checks.map((check, index) => (
      <div className="quality-check" key={`${check.label}-${index}`}>
       <span className={check.ok ? 'quality-dot ok' : 'quality-dot warn'}>{check.ok ? '' : '!'}</span>
       <div>
        <p className="quality-check-label">{check.label}</p>
        {check.detail && <p className="quality-check-detail">{check.detail}</p>}
       </div>
      </div>
     ))}
    </div>
   )}
  </div>
 );
}
