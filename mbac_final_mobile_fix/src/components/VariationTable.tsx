import React, { useMemo, useState } from 'react';
import type { VariationInfo, DomainInfo } from '../lib/mathEngine';
import { MathExpression } from './MathNotation';

interface VariationTableProps {
 variation: VariationInfo;
 domain: DomainInfo;
 derivativeExpr: string;
}

const formatNum = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '');

export const VariationTable: React.FC<VariationTableProps> = ({ variation, domain, derivativeExpr }) => {
 const [showMethod, setShowMethod] = useState(false);
 const { criticalPoints, intervals } = variation;

 const keyPoints = useMemo(() => {
  if (!intervals.length) return [] as { label: string; value: string; excluded: boolean; critical: boolean }[];
  const left = intervals[0].from;
  const right = intervals[intervals.length - 1].to;
  const leftN = Number(left), rightN = Number(right);
  const inside = (x: number) => (!Number.isFinite(leftN) || x > leftN + 1e-9) && (!Number.isFinite(rightN) || x < rightN - 1e-9);
  const xs = new Set<number>();
  domain.excludedPoints.filter(inside).forEach(x => xs.add(x));
  criticalPoints.filter(p => inside(p.x)).forEach(p => xs.add(p.x));
  const middle = [...xs].sort((a,b) => a-b).map(x => {
   const cp = criticalPoints.find(p => Math.abs(p.x - x) < 1e-8);
   const excluded = domain.excludedPoints.some(p => Math.abs(p - x) < 1e-8);
   return { label: formatNum(x), value: cp ? formatNum(cp.y) : '', excluded, critical: !!cp };
  });
  return [{ label: left, value: '', excluded: false, critical: false }, ...middle, { label: right, value: '', excluded: false, critical: false }];
 }, [criticalPoints, domain.excludedPoints, intervals]);

 if (!intervals.length) return <section className="bac-math-card"><p className="section-title">Tableau de variations</p><div className="notice notice-warning mt-3">Variations non déterminées avec suffisamment de fiabilité.</div></section>;

 return (
  <section className="bac-math-card">
   <div className="bac-math-card-head">
    <div><p className="eyebrow">Lecture BAC</p><h3 className="section-title mt-1">Tableau de variations</h3></div>
    <button onClick={() => setShowMethod(v => !v)} className="btn btn-small btn-secondary">{showMethod ? 'Masquer' : 'Méthode'}</button>
   </div>

   <div className="formula-strip mt-3"><MathExpression value={`f'(x)=${derivativeExpr}`} block /></div>

   <div className="bac-table-scroll mt-3">
    <table className="bac-table variation-table">
     <tbody>
      <tr>
       <th>x</th>
       {keyPoints.map((p, i) => (
        <React.Fragment key={`x-${i}`}>
         <td className={`bac-point ${p.excluded ? 'excluded' : ''}`}>{p.label}</td>
         {i < keyPoints.length - 1 && <td className="bac-interval"></td>}
        </React.Fragment>
       ))}
      </tr>
      <tr>
       <th>f′(x)</th>
       {keyPoints.map((p, i) => (
        <React.Fragment key={`d-${i}`}>
         <td className={`bac-point ${p.excluded ? 'excluded' : ''}`}>{p.excluded ? '∥' : p.critical ? '0' : ''}</td>
         {i < keyPoints.length - 1 && <td className={`bac-sign ${intervals[i]?.direction === 'increasing' ? 'positive' : intervals[i]?.direction === 'decreasing' ? 'negative' : ''}`}>{intervals[i]?.signDerivative || (intervals[i]?.direction === 'increasing' ? '+' : intervals[i]?.direction === 'decreasing' ? '−' : '0')}</td>}
        </React.Fragment>
       ))}
      </tr>
      <tr className="variation-row">
       <th>f(x)</th>
       {keyPoints.map((p, i) => (
        <React.Fragment key={`f-${i}`}>
         <td className={`bac-point ${p.excluded ? 'excluded' : ''}`}>{p.excluded ? '∥' : p.value}</td>
         {i < keyPoints.length - 1 && <td className={`variation-arrow ${intervals[i]?.direction || ''}`}>{intervals[i]?.direction === 'increasing' ? '↗' : intervals[i]?.direction === 'decreasing' ? '↘' : '→'}</td>}
        </React.Fragment>
       ))}
      </tr>
     </tbody>
    </table>
   </div>

   <p className="table-caption mt-2">Le tableau reprend uniquement les points critiques et exclusions détectés dans la fenêtre effectivement étudiée.</p>

   {showMethod && (
    <ol className="method-timeline mt-3">
     <li><span className="method-number">1</span><div>Calculer la dérivée : <MathExpression value={`f'(x)=${derivativeExpr}`} /></div></li>
     <li><span className="method-number">2</span><div>Résoudre <MathExpression value="f'(x)=0" /> et repérer les valeurs interdites.</div></li>
     <li><span className="method-number">3</span><div>Étudier le signe de <MathExpression value="f'(x)" /> sur chaque intervalle.</div></li>
     <li><span className="method-number">4</span><div><MathExpression value="f'(x)>0" /> ⇒ f croît ; <MathExpression value="f'(x)<0" /> ⇒ f décroît.</div></li>
    </ol>
   )}
  </section>
 );
};
