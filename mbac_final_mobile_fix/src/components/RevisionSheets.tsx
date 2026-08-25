import React, { useState } from 'react';
import { MathExpression, MathText } from './MathNotation';

type Sheet = 'deriv' | 'limits' | 'integ' | 'trigo' | 'algebra' | 'complex' | 'sequences' | 'proba';

const S = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
 <div className={`bg-gradient-to-br from-${color}-900/30 to-${color}-950/50 rounded-xl p-4 border border-${color}-500/20 mb-3`}>
  <h3 className={`font-bold text-${color}-300 mb-3 text-sm`}>{title}</h3>{children}
 </div>
);

const Row = ({ l, r, c = 'indigo' }: { l: string; r: string; c?: string }) => (
 <div className="bg-slate-800/50 rounded-lg p-2 flex justify-between items-center gap-3 text-xs">
  <span className="text-slate-300"><MathText auto>{l}</MathText></span>
  <span className={`text-${c}-300 font-bold text-right`}><MathText auto>{r}</MathText></span>
 </div>
);

const Formula = ({ children }: { children: string }) => (
 <div className="bg-slate-800/50 rounded-lg p-2 text-center"><span className="text-white text-xs"><MathText auto>{children}</MathText></span></div>
);

export const RevisionSheets: React.FC<{ onClose: () => void }> = ({ onClose }) => {
 const [sheet, setSheet] = useState<Sheet>('deriv');

 const tabs: { id: Sheet; icon: string; label: string }[] = [
  { id: 'deriv', icon: "f′", label: 'Dérivées' },
  { id: 'limits', icon: 'lim', label: 'Limites' },
  { id: 'integ', icon: '∫', label: 'Intégrales' },
  { id: 'trigo', icon: 'sin', label: 'Trigo' },
  { id: 'algebra', icon: 'x²', label: 'Algèbre' },
  { id: 'complex', icon: 'ℂ', label: 'Complexes' },
  { id: 'sequences', icon: 'uₙ', label: 'Suites' },
  { id: 'proba', icon: 'P', label: 'Probas' },
 ];

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> Fiches de révision</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    {/* Tabs — scrollable */}
    <div className="flex gap-1 mb-4 overflow-x-auto scrollbar-hide pb-1">
     {tabs.map(tb => (
      <button key={tb.id} onClick={() => setSheet(tb.id)}
       className={`shrink-0 py-1.5 px-3 rounded-full text-[11px] font-bold transition-all ${sheet === tb.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/60 text-slate-400 border border-slate-700/30'}`}>
       {tb.icon} {tb.label}
      </button>
     ))}
    </div>

    <div className="space-y-0">
     {/* ── DÉRIVÉES ── */}
     {sheet === 'deriv' && <>
      <S title=" Dérivées usuelles" color="indigo">
       <div className="grid grid-cols-2 gap-1.5">
        {[['k','0'],['x','1'],['xⁿ','n·xⁿ⁻¹'],['1/x','−1/x²'],['√x','1/(2√x)'],['eˣ','eˣ'],['ln x','1/x'],['sin x','cos x'],['cos x','−sin x'],['tan x','1+tan²x'],['aˣ','aˣ·ln a'],['arctan x','1/(1+x²)']].map(([f,d],i) => <Row key={i} l={f} r={d} />)}
       </div>
      </S>
      <S title=" Opérations" color="purple">
       <div className="space-y-1.5">
        {[['Somme','(u+v)\'=u\'+v\''],['Produit','(uv)\'=u\'v+uv\''],['Quotient','(u/v)\'=(u\'v−uv\')/v²'],['Composée','[f(g)]\'=g\'·f\'(g)'],['Inverse','(1/u)\'=−u\'/u²'],['Puissance','(uⁿ)\'=n·u\'·uⁿ⁻¹']].map(([r,f],i) => (
         <div key={i} className="bg-slate-800/50 rounded-lg p-2"><span className="text-purple-300 text-xs font-bold">{r} : </span><span className="text-white font-mono text-xs">{f}</span></div>
        ))}
       </div>
      </S>
      <S title=" Dérivées composées" color="emerald">
       <div className="grid grid-cols-2 gap-1.5">
        {[['eᵘ','u\'·eᵘ'],['ln u','u\'/u'],['sin u','u\'·cos u'],['cos u','−u\'·sin u'],['√u','u\'/(2√u)'],['uⁿ','n·u\'·uⁿ⁻¹']].map(([f,d],i) => <Row key={i} l={`(${f})'`} r={d} c="emerald" />)}
       </div>
      </S>
     </>}

     {/* ── LIMITES ── */}
     {sheet === 'limits' && <>
      <S title=" Limites usuelles" color="cyan">
       <div className="space-y-1.5">
        {[['lim xⁿ (x→+∞)','+∞ si n>0'],['lim 1/x (x→+∞)','0'],['lim 1/x (x→0⁺)','+∞'],['lim eˣ (x→+∞)','+∞'],['lim eˣ (x→−∞)','0'],['lim ln x (x→+∞)','+∞'],['lim ln x (x→0⁺)','−∞'],['lim sin x/x (x→0)','1'],['lim (eˣ−1)/x (x→0)','1'],['lim (1+1/n)ⁿ (n→∞)','e'],['lim xⁿ/eˣ (x→+∞)','0'],['lim ln x/x (x→+∞)','0']].map(([l,r],i) => <Row key={i} l={l} r={r} c="cyan" />)}
       </div>
      </S>
      <S title=" Formes indéterminées" color="amber">
       <div className="flex flex-wrap gap-1.5 mb-2">
        {['0/0','∞/∞','0×∞','∞−∞','1^∞','0⁰','∞⁰'].map((f,i) => <span key={i} className="bg-amber-500/20 text-amber-200 px-2.5 py-1 rounded-lg font-mono text-xs">{f}</span>)}
       </div>
       <p className="text-[10px] text-slate-400">Méthodes : factorisation, conjugué, L'Hôpital, DL</p>
      </S>
      <S title=" Croissances comparées" color="emerald">
       <Formula>{'ln(x) << xᵅ << eˣ (α > 0, x→+∞)'}</Formula>
       <div className="mt-2"><Formula>{'n! << nⁿ et ln(n) << n (n→+∞)'}</Formula></div>
      </S>
      <S title=" Règle de L'Hôpital" color="purple">
       <p className="text-xs text-slate-300">Si lim f/g donne 0/0 ou ∞/∞ :</p>
       <Formula>lim f(x)/g(x) = lim f'(x)/g'(x)</Formula>
      </S>
     </>}

     {/* ── INTÉGRALES ── */}
     {sheet === 'integ' && <>
      <S title="∫ Primitives usuelles" color="rose">
       <div className="grid grid-cols-2 gap-1.5">
        {[['k','kx'],['xⁿ (n≠−1)','xⁿ⁺¹/(n+1)'],['1/x','ln|x|'],['eˣ','eˣ'],['cos x','sin x'],['sin x','−cos x'],['1/cos²x','tan x'],['1/√x','2√x'],['1/(1+x²)','arctan x'],['eᵃˣ','eᵃˣ/a']].map(([f,F],i) => <Row key={i} l={`∫${f}`} r={`${F}+C`} c="rose" />)}
       </div>
      </S>
      <S title=" Techniques d'intégration" color="violet">
       <div className="space-y-1.5 text-xs text-slate-300">
        <Formula>∫u'v = uv − ∫uv' (par parties)</Formula>
        <Formula>∫f(g(x))·g'(x)dx = F(g(x))+C</Formula>
        <p className="text-slate-400 mt-2">• Linéarité : ∫(αf+βg) = α∫f + β∫g</p>
        <p className="text-slate-400">• Chasles : ∫ₐᵇ = ∫ₐᶜ + ∫ᶜᵇ</p>
       </div>
      </S>
      <S title=" Aire et intégrale" color="emerald">
       <p className="text-xs text-slate-300">Aire entre courbe et axe Ox sur [a,b] :</p>
       <Formula>A = ∫ₐᵇ |f(x)| dx</Formula>
       <p className="text-xs text-slate-400 mt-1">Aire entre deux courbes :</p>
       <Formula>A = ∫ₐᵇ |f(x)−g(x)| dx</Formula>
      </S>
     </>}

     {/* ── TRIGO ── */}
     {sheet === 'trigo' && <>
      <S title=" Relations fondamentales" color="teal">
       <div className="space-y-1.5">
        {['cos²x + sin²x = 1','1 + tan²x = 1/cos²x','sin(−x) = −sin x','cos(−x) = cos x','tan(−x) = −tan x'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Formules d'addition" color="sky">
       <div className="space-y-1.5">
        {['cos(a±b) = cos a·cos b ∓ sin a·sin b','sin(a±b) = sin a·cos b ± cos a·sin b','tan(a+b) = (tan a+tan b)/(1−tan a·tan b)'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Formules de duplication" color="indigo">
       <div className="space-y-1.5">
        {['cos 2x = cos²x − sin²x = 2cos²x − 1','sin 2x = 2 sin x·cos x','cos²x = (1+cos 2x)/2','sin²x = (1−cos 2x)/2'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Valeurs remarquables" color="amber">
       <div className="overflow-x-auto"><table className="text-xs border-collapse w-full">
        <thead><tr className="bg-slate-700/30">
         <th className="border border-slate-600/50 px-2 py-1 text-amber-300">θ</th>
         {['0','π/6','π/4','π/3','π/2'].map((v,i) => <th key={i} className="border border-slate-600/50 px-2 py-1 text-slate-300">{v}</th>)}
        </tr></thead>
        <tbody>
         <tr><td className="border border-slate-600/50 px-2 py-1 text-teal-300 font-bold">sin</td>{['0','1/2','√2/2','√3/2','1'].map((v,i) => <td key={i} className="border border-slate-600/50 px-2 py-1 text-white text-center font-mono">{v}</td>)}</tr>
         <tr><td className="border border-slate-600/50 px-2 py-1 text-teal-300 font-bold">cos</td>{['1','√3/2','√2/2','1/2','0'].map((v,i) => <td key={i} className="border border-slate-600/50 px-2 py-1 text-white text-center font-mono">{v}</td>)}</tr>
         <tr><td className="border border-slate-600/50 px-2 py-1 text-teal-300 font-bold">tan</td>{['0','√3/3','1','√3','∞'].map((v,i) => <td key={i} className="border border-slate-600/50 px-2 py-1 text-white text-center font-mono">{v}</td>)}</tr>
        </tbody>
       </table></div>
      </S>
     </>}

     {/* ── ALGÈBRE ── */}
     {sheet === 'algebra' && <>
      <S title=" Identités remarquables" color="violet">
       <div className="space-y-1.5">
        {['(a+b)² = a²+2ab+b²','(a−b)² = a²−2ab+b²','a²−b² = (a+b)(a−b)','(a+b)³ = a³+3a²b+3ab²+b³','a³−b³ = (a−b)(a²+ab+b²)','a³+b³ = (a+b)(a²−ab+b²)'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Polynôme du 2nd degré ax²+bx+c" color="indigo">
       <div className="space-y-1.5 text-xs">
        <Formula>Δ = b² − 4ac</Formula>
        <div className="bg-slate-800/50 rounded-lg p-2 text-slate-300 space-y-1">
         <p>• Δ {'>'} 0 : deux racines x₁,₂ = (−b±√Δ)/(2a)</p>
         <p>• Δ = 0 : racine double x₀ = −b/(2a)</p>
         <p>• Δ {'<'} 0 : pas de racine réelle</p>
        </div>
        <Formula>Sommet S(−b/(2a) ; −Δ/(4a))</Formula>
       </div>
      </S>
      <S title=" Puissances et logarithmes" color="emerald">
       <div className="space-y-1.5">
        {['aⁿ·aᵐ = aⁿ⁺ᵐ','aⁿ/aᵐ = aⁿ⁻ᵐ','(aⁿ)ᵐ = aⁿᵐ','ln(ab) = ln a + ln b','ln(a/b) = ln a − ln b','ln(aⁿ) = n·ln a','eˡⁿˣ = x  ln(eˣ) = x'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
     </>}

     {/* ── COMPLEXES ── */}
     {sheet === 'complex' && <>
      <S title="ℂ Nombres complexes" color="sky">
       <div className="space-y-1.5">
        {['z = a + bi  (a = Re, b = Im)','i² = −1','|z| = √(a²+b²)','arg(z) = atan2(b,a)','z̄ = a − bi','z·z̄ = |z|²','|z₁z₂| = |z₁|·|z₂|','arg(z₁z₂) = arg(z₁)+arg(z₂)'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Formes" color="purple">
       <div className="space-y-1.5 text-xs text-slate-300">
        <p><span className="text-purple-300 font-bold">Algébrique :</span> z = a + bi</p>
        <p><span className="text-purple-300 font-bold">Trigonométrique :</span> z = r(cos θ + i sin θ)</p>
        <p className="flex flex-wrap items-center gap-1"><span className="text-purple-300 font-bold">Exponentielle :</span> <MathExpression value="z = r*exp(i*theta)" /></p>
        <Formula>e^(iθ) = cos θ + i sin θ (Euler)</Formula>
       </div>
      </S>
     </>}

     {/* ── SUITES ── */}
     {sheet === 'sequences' && <>
      <S title=" Suites arithmétiques" color="violet">
       <div className="space-y-1.5">
        {['uₙ = u₀ + n·r','uₙ₊₁ = uₙ + r','Sₙ = (n+1)(u₀+uₙ)/2','Sₙ = (n+1)u₀ + n(n+1)r/2'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Suites géométriques" color="indigo">
       <div className="space-y-1.5">
        {['uₙ = u₀ × qⁿ','uₙ₊₁ = q × uₙ','Sₙ = u₀(1−qⁿ⁺¹)/(1−q) (q≠1)','|q|<1 → S∞ = u₀/(1−q)'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Convergence" color="emerald">
       <div className="space-y-1.5 text-xs text-slate-300">
        <p>• Croissante + majorée → converge</p>
        <p>• Décroissante + minorée → converge</p>
        <p>• |q| {'<'} 1 → géométrique converge vers 0</p>
        <p>• Adjacentes → convergent vers même limite</p>
       </div>
      </S>
     </>}

     {/* ── PROBAS ── */}
     {sheet === 'proba' && <>
      <S title=" Dénombrement" color="fuchsia">
       <div className="space-y-1.5">
        {['n! = 1×2×3×...×n','C(n,k) = n!/(k!(n−k)!)','A(n,k) = n!/(n−k)!','C(n,k) = C(n,n−k)','C(n,0) = C(n,n) = 1'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Loi binomiale X~B(n,p)" color="cyan">
       <div className="space-y-1.5">
        {['P(X=k) = C(n,k)·pᵏ·qⁿ⁻ᵏ (q=1−p)','E(X) = n·p','V(X) = n·p·q','σ(X) = √(n·p·q)'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
      <S title=" Loi normale X~N(μ,σ²)" color="emerald">
       <div className="space-y-1.5 text-xs text-slate-300">
        <Formula>Z = (X−μ)/σ → Z~N(0,1)</Formula>
        <p>• P(μ−σ ≤ X ≤ μ+σ) ≈ 68%</p>
        <p>• P(μ−2σ ≤ X ≤ μ+2σ) ≈ 95%</p>
        <p>• P(μ−3σ ≤ X ≤ μ+3σ) ≈ 99.7%</p>
       </div>
      </S>
      <S title=" Statistiques" color="amber">
       <div className="space-y-1.5">
        {['x̄ = Σxᵢ/n','σ² = Σ(xᵢ−x̄)²/n','σ = √σ²','Médiane : valeur centrale','Q₁, Q₃ : quartiles','IQR = Q₃ − Q₁'].map((f,i) => <Formula key={i}>{f}</Formula>)}
       </div>
      </S>
     </>}
    </div>
   </div>
  </div>
 );
};
