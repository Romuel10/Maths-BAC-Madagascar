/**
 * Composants réutilisables pour afficher les résultats des outils.
 * Toutes les expressions mathématiques passent par KaTeX afin de conserver
 * une écriture proche des sujets du BAC (fractions, puissances, racines...).
 */
import React from 'react';
import { MathExpression, MathText } from './MathNotation';
import { MathSolutionWork } from './MathSolutionWork';

const mathNode = (value: React.ReactNode, className = '') => {
 if (typeof value === 'string' || typeof value === 'number') {
  return <MathText auto className={className}>{String(value)}</MathText>;
 }
 return <span className={className}>{value}</span>;
};

export const ResultBox = ({ label, value, color = 'indigo' }: { label: string; value: string; color?: string }) => (
 <div className={`bg-gradient-to-r from-${color}-600/15 to-${color}-800/15 rounded-xl p-4 border border-${color}-500/25 text-center animate-scale-in`}>
  <p className={`text-[10px] text-${color}-400 mb-1 font-bold uppercase tracking-wider`}>{label}</p>
  <div className="text-xl font-extrabold text-white break-words math-answer">
   <MathSolutionWork value={value} compact answer/>
  </div>
 </div>
);

export const Step = ({ n, title, content, color = 'slate' }: { n: number | string; title: string; content: string; color?: string }) => (
 <div className="flex items-start gap-2.5">
  <span className={`w-6 h-6 rounded-full bg-${color}-600/50 text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold`}>{n}</span>
  <div className="flex-1 min-w-0">
   <p className="text-xs font-bold text-slate-300">{title}</p>
   <div className="mt-1 break-words leading-relaxed">
    <MathSolutionWork value={content} compact/>
   </div>
  </div>
 </div>
);

export const Formula = ({ children, color = 'indigo' }: { children: React.ReactNode; color?: string }) => (
 <div className={`bg-${color}-500/10 rounded-lg px-3 py-2 border border-${color}-500/20 text-center overflow-x-auto`}>
  <div className="text-sm text-white font-bold math-answer">
   {typeof children === 'string' || typeof children === 'number'
    ? <MathExpression value={String(children)} />
    : mathNode(children)}
  </div>
 </div>
);

export const PropBadge = ({ label, value, color = 'slate' }: { label: string; value: string; color?: string }) => (
 <div className={`bg-${color}-500/10 border border-${color}-500/25 rounded-lg p-2.5`}>
  <p className={`text-[10px] text-${color}-400 font-bold`}>{label}</p>
  <div className="text-sm text-white font-bold mt-1"><MathText auto>{value}</MathText></div>
 </div>
);

export const Section = ({ icon, title, children, color = 'slate' }: { icon: string; title: string; children: React.ReactNode; color?: string }) => (
 <div className={`bg-${color}-500/5 rounded-xl p-4 border border-${color}-500/15`}>
  <p className={`text-xs font-bold text-${color}-300 mb-3 flex items-center gap-1.5`}>{icon} {title}</p>
  {children}
 </div>
);

export const StepsList = ({ children }: { children: React.ReactNode }) => (
 <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20 space-y-3">{children}</div>
);

export const MatrixDisplay = ({ matrix, label }: { matrix: number[][]; label?: string }) => (
 <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/20">
  {label && <p className="text-[10px] text-slate-400 font-bold mb-2">{label}</p>}
  <div className="flex items-center justify-center gap-1">
   <span className="text-slate-500 text-2xl font-thin">(</span>
   <table className="border-collapse">
    <tbody>
     {matrix.map((row, i) => (
      <tr key={i}>
       {row.map((v, j) => (
        <td key={j} className="px-2.5 py-1 text-center text-sm text-white">
         {Number.isInteger(v) ? v : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}
        </td>
       ))}
      </tr>
     ))}
    </tbody>
   </table>
   <span className="text-slate-500 text-2xl font-thin">)</span>
  </div>
 </div>
);
