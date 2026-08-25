/** Récompenses de progression — présentation sobre V4.1 */
import React from 'react';
import { getStats } from '../lib/stats';

interface Badge {
 id: string;
 code: string;
 title: string;
 desc: string;
 condition: (s: ReturnType<typeof getStats>) => boolean;
}

const BADGES: Badge[] = [
 { id: 'first', code: '01', title: 'Premier pas', desc: '1er exercice terminé', condition: s => s.totalExercises >= 1 },
 { id: 'five', code: '05', title: 'Régularité', desc: '5 exercices terminés', condition: s => s.totalExercises >= 5 },
 { id: 'ten', code: '10', title: 'Cap des dix', desc: '10 exercices terminés', condition: s => s.totalExercises >= 10 },
 { id: 'twenty', code: '20', title: 'Persévérant', desc: '20 exercices terminés', condition: s => s.totalExercises >= 20 },
 { id: 'fifty', code: '50', title: 'Confirmé', desc: '50 exercices terminés', condition: s => s.totalExercises >= 50 },
 { id: 'hundred', code: '100', title: 'Maîtrise', desc: '100 exercices terminés', condition: s => s.totalExercises >= 100 },
 { id: 'streak3', code: 'S3', title: 'Série 3', desc: '3 réponses correctes de suite', condition: s => s.bestStreak >= 3 },
 { id: 'streak5', code: 'S5', title: 'Série 5', desc: '5 réponses correctes de suite', condition: s => s.bestStreak >= 5 },
 { id: 'streak10', code: 'S10', title: 'Série 10', desc: '10 réponses correctes de suite', condition: s => s.bestStreak >= 10 },
 { id: 'perfect50', code: '50%', title: 'Précision', desc: 'Réussite supérieure à 50 %', condition: s => s.totalExercises >= 5 && s.totalCorrect / s.totalExercises > 0.5 },
 { id: 'perfect80', code: '80%', title: 'Excellent', desc: 'Réussite supérieure à 80 %', condition: s => s.totalExercises >= 10 && s.totalCorrect / s.totalExercises > 0.8 },
 { id: 'perfect100', code: '100%', title: 'Sans faute', desc: '100 % de réussite', condition: s => s.totalExercises >= 5 && s.totalCorrect === s.totalExercises },
];

export const BadgesPanel: React.FC = () => {
 const stats = getStats();
 const earned = BADGES.filter(b => b.condition(stats));
 const locked = BADGES.filter(b => !b.condition(stats));
 const progress = Math.round((earned.length / BADGES.length) * 100);

 return (
  <section className="surface p-4 space-y-4">
   <div className="flex items-start justify-between gap-3">
    <div><p className="eyebrow">Progression</p><h3 className="section-title mt-2">Paliers atteints</h3></div>
    <span className="chip chip-success">{earned.length}/{BADGES.length}</span>
   </div>
   <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

   {earned.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{earned.map(b => (
    <div key={b.id} className="surface-flat p-3">
     <div className="flex items-center gap-2"><span className="chip chip-success">{b.code}</span><p className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>{b.title}</p></div>
     <p className="section-copy mt-2">{b.desc}</p>
    </div>
   ))}</div>}

   {locked.length > 0 && <details>
    <summary className="text-[10px] font-bold cursor-pointer" style={{ color: 'var(--muted)' }}>Paliers à atteindre ({locked.length})</summary>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">{locked.map(b => (
     <div key={b.id} className="surface-flat p-3 opacity-60">
      <div className="flex items-center gap-2"><span className="chip">{b.code}</span><p className="text-[10px] font-bold">{b.title}</p></div>
      <p className="section-copy mt-2">{b.desc}</p>
     </div>
    ))}</div>
   </details>}
  </section>
 );
};

export const BadgeCounter: React.FC = () => {
 const stats = getStats();
 const earned = BADGES.filter(b => b.condition(stats)).length;
 if (earned === 0) return null;
 return <span className="chip chip-success">Paliers · {earned}</span>;
};
