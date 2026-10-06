/**
 * Géométrie analytique avec résultats visuels et étapes détaillées
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useEffect, useState } from 'react';
import { ResultBox, Step, Section, StepsList, PropBadge } from './ResultCard';
import { ReliabilityPanel } from './ReliabilityPanel';
import { distance2D, midpoint2D, lineThrough, circleFromCenterPoint } from '../lib/geometryEngine';

interface Props { onClose: () => void }

type Mode = 'distance' | 'midpoint' | 'line' | 'circle';

function fmt(n: number): string { const r = Math.round(n * 10000) / 10000; return Number.isInteger(r) ? String(r) : r.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''); }

const InputField = ({ label, value, onChange, color = 'indigo' }: { label: string; value: string; onChange: (v: string) => void; color?: string }) => (
  <div><label className={`block text-[0.625rem] text-${color}-400 font-bold mb-1`}>{label}</label>
   <input aria-label={label} type="number" value={value} onChange={e => onChange(e.target.value)}
    className={`w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-mono text-sm focus:border-${color}-500 focus:outline-none`} /></div>
 );

export const GeometryCalc: React.FC<Props> = ({ onClose }) => {
 const [mode, setMode] = useState<Mode>('distance');
 const [x1, setX1] = useState('0'); const [y1, setY1] = useState('0');
 const [x2, setX2] = useState('3'); const [y2, setY2] = useState('4');
 const [res, setRes] = useState<React.ReactNode | null>(null);
 useEffect(()=>{setRes(null);},[mode,x1,y1,x2,y2]);

 const modes: { id: Mode; icon: string; label: string }[] = [
  { id: 'distance', icon: 'd', label: 'Distance' },
  { id: 'midpoint', icon: '⊙', label: 'Milieu' },
  { id: 'line', icon: '╱', label: 'Droite' },
  { id: 'circle', icon: '◯', label: 'Cercle' },
 ];

 const handleCalc = () => {
  const a = { x: parseFloat(x1), y: parseFloat(y1) };
  const b = { x: parseFloat(x2), y: parseFloat(y2) };
  if ([a.x, a.y, b.x, b.y].some(isNaN)) return;

  switch (mode) {
   case 'distance': {
    const calc = distance2D(a, b);
    const { dx, dy, squared: d2, value: d } = calc;
    setRes(
     <div className="space-y-3 animate-scale-in">
      <ReliabilityPanel level={calc.checks.every(c => c.ok) ? "verified" : "warning"} title="Distance vérifiée" detail="La distance est calculée par hypoténuse numérique stable puis recontrôlée par d² = Δx² + Δy²." checks={calc.checks} />
      <ResultBox label="Distance AB" value={fmt(d)} color="indigo" />
      <StepsList>
       <Step n={1} title="Points donnés" content={`A(${a.x} ; ${a.y}) et B(${b.x} ; ${b.y})`} color="indigo" />
       <Step n={2} title="Formule" content="d(A,B) = √((x₂−x₁)² + (y₂−y₁)²)" color="blue" />
       <Step n={3} title="Différences" content={`x₂−x₁ = ${b.x}−${a.x} = ${fmt(dx)}  |  y₂−y₁ = ${b.y}−${a.y} = ${fmt(dy)}`} color="purple" />
       <Step n={4} title="Carrés" content={`(${fmt(dx)})² = ${fmt(dx * dx)}  |  (${fmt(dy)})² = ${fmt(dy * dy)}`} color="purple" />
       <Step n={5} title="Somme" content={`${fmt(dx * dx)} + ${fmt(dy * dy)} = ${fmt(d2)}`} color="amber" />
       <Step n="" title="Résultat" content={`d = √${fmt(d2)} = ${fmt(d)}`} color="emerald" />
      </StepsList>
      <Section icon="" title="Interprétation" color="blue">
       <p className="text-xs text-slate-300">La distance entre A et B est de <span className="text-white font-bold">{fmt(d)}</span> unités.</p>
       {d === Math.round(d) && <p className="text-xs text-emerald-400 mt-1"> La distance est un entier !</p>}
      </Section>
     </div>
    );
    break;
   }
   case 'midpoint': {
    const calc = midpoint2D(a, b);
    const mx = calc.point.x, my = calc.point.y;
    setRes(
     <div className="space-y-3 animate-scale-in">
      <ReliabilityPanel level={calc.checks.every(c => c.ok) ? "verified" : "warning"} title="Milieu vérifié" detail="Les coordonnées sont calculées par moyenne puis AM et MB sont recomparées." checks={calc.checks} />
      <ResultBox label="Milieu M" value={`(${fmt(mx)} ; ${fmt(my)})`} color="purple" />
      <StepsList>
       <Step n={1} title="Points donnés" content={`A(${a.x} ; ${a.y}) et B(${b.x} ; ${b.y})`} color="indigo" />
       <Step n={2} title="Formule" content="M = ((x₁+x₂)/2 ; (y₁+y₂)/2)" color="blue" />
       <Step n={3} title="Abscisse" content={`xₘ = (${a.x}+${b.x})/2 = ${fmt(a.x + b.x)}/2 = ${fmt(mx)}`} color="purple" />
       <Step n={4} title="Ordonnée" content={`yₘ = (${a.y}+${b.y})/2 = ${fmt(a.y + b.y)}/2 = ${fmt(my)}`} color="purple" />
       <Step n="" title="Résultat" content={`M(${fmt(mx)} ; ${fmt(my)})`} color="emerald" />
      </StepsList>
      <Section icon="" title="Vérification" color="blue">
       <p className="text-xs text-slate-300">Le milieu est equidistant de A et B : AM = MB</p>
      </Section>
     </div>
    );
    break;
   }
   case 'line': {
    const line = lineThrough(a, b);
    if (line.kind === 'undefined') {
     setRes(<ReliabilityPanel level="warning" title="Droite non déterminée" detail="A et B sont confondus : deux points distincts sont nécessaires pour déterminer une droite unique." checks={line.checks} />);
    } else if (line.kind === 'vertical') {
     setRes(
      <div className="space-y-3 animate-scale-in">
       <ReliabilityPanel level={line.checks.every(c => c.ok) ? "verified" : "warning"} title="Cas vertical vérifié" detail="x₁ = x₂ : la pente n’est pas définie, donc l’équation correcte est x = x₁." checks={line.checks} />
       <ResultBox label="Équation de la droite" value={`x = ${a.x}`} color="cyan" />
       <Section icon="" title="Droite verticale" color="amber">
        <p className="text-xs text-slate-300">Les deux points ont la même abscisse, la droite est verticale.</p>
       </Section>
      </div>
     );
    } else {
     const m = line.slope;
     const p = line.intercept;
     const sign = p >= 0 ? '+' : '−';
     const eq = `y = ${fmt(m)}x ${sign} ${fmt(Math.abs(p))}`;
     const dx = b.x - a.x, dy = b.y - a.y;
     setRes(
      <div className="space-y-3 animate-scale-in">
       <ReliabilityPanel level={line.checks.every(c => c.ok) ? "verified" : "warning"} title="Droite vérifiée" detail="La pente et l’ordonnée à l’origine sont recalculées, puis A et B sont substitués dans l’équation obtenue." checks={line.checks} />
       <ResultBox label="Équation de (AB)" value={eq} color="cyan" />
       <StepsList>
        <Step n={1} title="Points donnés" content={`A(${a.x} ; ${a.y}) et B(${b.x} ; ${b.y})`} color="indigo" />
        <Step n={2} title="Formule de la pente" content="m = (y₂ − y₁) / (x₂ − x₁)" color="blue" />
        <Step n={3} title="Calcul de la pente" content={`m = (${b.y} − ${a.y}) / (${b.x} − ${a.x}) = ${fmt(dy)} / ${fmt(dx)} = ${fmt(m)}`} color="purple" />
        <Step n={4} title="Ordonnée à l'origine" content={`p = y₁ − m×x₁ = ${a.y} − ${fmt(m)}×${a.x} = ${fmt(p)}`} color="purple" />
        <Step n="" title="Équation" content={eq} color="emerald" />
       </StepsList>
       <div className="grid grid-cols-2 gap-2">
        <PropBadge label="Pente m" value={fmt(m)} color="cyan" />
        <PropBadge label="Ordonnée p" value={fmt(p)} color="indigo" />
        <PropBadge label="Vecteur AB⃗" value={`(${fmt(dx)} ; ${fmt(dy)})`} color="purple" />
        <PropBadge label="Vecteur normal n⃗" value={`(${fmt(-dy)} ; ${fmt(dx)})`} color="rose" />
       </div>
       <Section icon="" title="Interprétation" color="blue">
        <p className="text-xs text-slate-300">
         {m > 0 ? 'La droite est croissante (pente positive).' : m < 0 ? 'La droite est décroissante (pente négative).' : 'La droite est horizontale.'}
         {Math.abs(m) === 1 && ' La droite fait un angle de 45° avec l\'axe des x.'}
        </p>
       </Section>
      </div>
     );
    }
    break;
   }
   case 'circle': {
    const calc = circleFromCenterPoint(a, b);
    const r = calc.radius;
    const sx = a.x >= 0 ? `−${fmt(a.x)}` : `+${fmt(Math.abs(a.x))}`;
    const sy = a.y >= 0 ? `−${fmt(a.y)}` : `+${fmt(Math.abs(a.y))}`;
    const eq = `(x${sx})² + (y${sy})² = ${fmt(calc.radiusSquared)}`;
    setRes(
     <div className="space-y-3 animate-scale-in">
      <ReliabilityPanel level={calc.checks.every(c => c.ok) ? "verified" : "warning"} title="Cercle vérifié" detail="Le rayon est calculé par CP puis P est substitué dans l’équation du cercle." checks={calc.checks} />
      <ResultBox label="Équation du cercle" value={eq} color="rose" />
      <StepsList>
       <Step n={1} title="Centre et point" content={`C(${a.x} ; ${a.y}), P(${b.x} ; ${b.y})`} color="indigo" />
       <Step n={2} title="Rayon" content={`r = CP = √((${b.x}−${a.x})² + (${b.y}−${a.y})²) = ${fmt(r)}`} color="purple" />
       <Step n={3} title="Formule" content="(x−a)² + (y−b)² = r²" color="blue" />
       <Step n="" title="Équation" content={eq} color="emerald" />
      </StepsList>
      <div className="grid grid-cols-2 gap-2">
       <PropBadge label="Rayon r" value={fmt(r)} color="rose" />
       <PropBadge label="r²" value={fmt(calc.radiusSquared)} color="purple" />
       <PropBadge label="Périmètre 2πr" value={fmt(calc.circumference)} color="cyan" />
       <PropBadge label="Aire πr²" value={fmt(calc.area)} color="emerald" />
      </div>
     </div>
    );
    break;
   }
  }
 };



 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> Géométrie analytique</h2>
     <button onClick={onClose} aria-label="Fermer l’outil" className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    <div className="flex gap-1 mb-4 bg-slate-800/50 p-1 rounded-xl">
     {modes.map(m => (
      <button key={m.id} onClick={() => { setMode(m.id); setRes(null); }}
       className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === m.id ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
       {m.icon} {m.label}
      </button>
     ))}
    </div>

    <div className="grid grid-cols-2 gap-3 mb-4">
     <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/20">
      <p className="text-xs text-indigo-400 font-bold mb-2">{mode === 'circle' ? 'Centre C' : 'Point A'}</p>
      <div className="flex gap-2">
       <InputField label="x₁" value={x1} onChange={setX1} />
       <InputField label="y₁" value={y1} onChange={setY1} />
      </div>
     </div>
     <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/20">
      <p className="text-xs text-purple-400 font-bold mb-2">{mode === 'circle' ? 'Point P' : 'Point B'}</p>
      <div className="flex gap-2">
       <InputField label="x₂" value={x2} onChange={setX2} color="purple" />
       <InputField label="y₂" value={y2} onChange={setY2} color="purple" />
      </div>
     </div>
    </div>

    <button onClick={handleCalc} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl active:scale-[0.98] mb-4">Calculer</button>

    {res}
   </div>
  </div>
 );
};
