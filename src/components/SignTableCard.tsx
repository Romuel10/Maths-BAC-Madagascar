import React, { useState } from 'react';
import type { SignInterval, ZeroInfo } from '../lib/mathEngine';
import { MathExpression } from './MathNotation';

interface SignTableCardProps {
 signTable: SignInterval[];
 zeros: ZeroInfo[];
 expression: string;
}

const fmt = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(3).replace(/\.?0+$/, '');

export const SignTableCard: React.FC<SignTableCardProps> = ({ signTable, zeros, expression }) => {
 const [showMethod, setShowMethod] = useState(false);
 if (!signTable.length) return null;

 const points = [signTable[0].from, ...signTable.map(i => i.to)];

 return (
  <section className="bac-math-card">
   <div className="bac-math-card-head">
    <div>
     <p className="eyebrow">Lecture BAC</p>
     <h3 className="section-title mt-1">Tableau de signes</h3>
    </div>
    <button onClick={() => setShowMethod(v => !v)} className="btn btn-small btn-secondary">{showMethod ? 'Masquer' : 'Méthode'}</button>
   </div>

   <div className="formula-strip mt-3"><MathExpression value={`f(x)=${expression}`} block /></div>

   {zeros.length > 0 && (
    <div className="flex flex-wrap items-center gap-2 mt-3">
     <span className="text-[9px] muted font-bold">Zéros :</span>
     {zeros.map((z, i) => <span key={i} className="chip chip-success"><MathExpression value={`x=${fmt(z.x)}`} /></span>)}
    </div>
   )}

   <div className="bac-table-scroll mt-3">
    <table className="bac-table sign-table">
     <tbody>
      <tr>
       <th>x</th>
       {signTable.map((interval, i) => (
        <React.Fragment key={`x-${i}`}>
         <td className="bac-point">{i === 0 ? interval.from : ''}</td>
         <td className="bac-interval"></td>
        </React.Fragment>
       ))}
       <td className="bac-point">{points[points.length - 1]}</td>
      </tr>
      <tr>
       <th>f(x)</th>
       {signTable.map((interval, i) => {
        const startZero = zeros.some(z => Math.abs(Number(interval.from) - z.x) < 1e-8);
        return (
         <React.Fragment key={`s-${i}`}>
          <td className="bac-point">{startZero ? '0' : ''}</td>
          <td className={`bac-sign ${interval.sign === '+' ? 'positive' : interval.sign === '-' ? 'negative' : ''}`}>{interval.sign}</td>
         </React.Fragment>
        );
       })}
       <td className="bac-point">{zeros.some(z => Math.abs(Number(points[points.length - 1]) - z.x) < 1e-8) ? '0' : ''}</td>
      </tr>
     </tbody>
    </table>
   </div>

   <p className="table-caption mt-2">Les bornes affichées sont celles réellement étudiées par le moteur. Elles ne sont pas remplacées artificiellement par ±∞.</p>

   {showMethod && (
    <ol className="method-timeline mt-3">
     <li><span className="method-number">1</span><div>Résoudre <MathExpression value="f(x)=0" /> pour placer les zéros.</div></li>
     <li><span className="method-number">2</span><div>Découper l’axe réel avec ces valeurs.</div></li>
     <li><span className="method-number">3</span><div>Déterminer le signe de <MathExpression value="f(x)" /> dans chaque intervalle.</div></li>
     <li><span className="method-number">4</span><div>Reporter <strong>+</strong>, <strong>−</strong> et <strong>0</strong> dans le tableau.</div></li>
    </ol>
   )}
  </section>
 );
};
