import React from 'react';
import { getStats, resetStats } from '../lib/stats';
import { useLang, t } from '../lib/i18n';

interface StatsPanelProps { onClose: () => void }

const TOPIC_NAMES: Record<string, string> = {
 domain: ' Domaine', derivative: ' Dérivée', zeros: ' Zéros',
 parity: ' Parité', variation: ' Variations',
 exam_domain: ' Exam - Domaine', exam_derivative: ' Exam - Dérivée',
 exam_zeros: ' Exam - Zéros', exam_parity: ' Exam - Parité',
 exam_variation: ' Exam - Variations',
};

export const StatsPanel: React.FC<StatsPanelProps> = ({ onClose }) => {
 const { lang } = useLang();
 const stats = getStats();
 const rate = stats.totalExercises > 0 ? Math.round(stats.totalCorrect / stats.totalExercises * 100) : 0;

 const handleReset = () => {
  if (confirm('Effacer toutes les statistiques ?')) {
   resetStats();
   onClose();
  }
 };

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="max-w-lg mx-auto px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-6">
     <h2 className="text-xl font-bold text-white"> {t('progress', lang)}</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    {/* Main stats */}
    <div className="grid grid-cols-2 gap-3 mb-6">
     <div className="bg-gradient-to-br from-indigo-900/40 to-indigo-950/60 rounded-xl p-4 border border-indigo-500/20 text-center">
      <p className="text-3xl font-bold text-indigo-400">{stats.totalExercises}</p>
      <p className="text-xs text-slate-400 mt-1">{t('totalExercises', lang)}</p>
     </div>
     <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-950/60 rounded-xl p-4 border border-emerald-500/20 text-center">
      <p className="text-3xl font-bold text-emerald-400">{rate}%</p>
      <p className="text-xs text-slate-400 mt-1">{t('correctRate', lang)}</p>
     </div>
     <div className="bg-gradient-to-br from-amber-900/40 to-amber-950/60 rounded-xl p-4 border border-amber-500/20 text-center">
      <p className="text-3xl font-bold text-amber-400"> {stats.currentStreak}</p>
      <p className="text-xs text-slate-400 mt-1">{t('streak', lang)}</p>
     </div>
     <div className="bg-gradient-to-br from-purple-900/40 to-purple-950/60 rounded-xl p-4 border border-purple-500/20 text-center">
      <p className="text-3xl font-bold text-purple-400"> {stats.bestStreak}</p>
      <p className="text-xs text-slate-400 mt-1">{t('bestStreak', lang)}</p>
     </div>
    </div>

    {/* Progress bar */}
    <div className="mb-6">
     <div className="flex justify-between text-xs text-slate-400 mb-1">
      <span>{stats.totalCorrect} correctes</span>
      <span>{stats.totalExercises - stats.totalCorrect} incorrectes</span>
     </div>
     <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden flex">
      <div className="h-full bg-emerald-500" style={{ width: `${rate}%` }}></div>
      <div className="h-full bg-red-500" style={{ width: `${100 - rate}%` }}></div>
     </div>
    </div>

    {/* By topic */}
    {Object.keys(stats.byTopic).length > 0 && (
     <div className="mb-6">
      <h3 className="text-sm font-bold text-slate-300 mb-3"> Par thème</h3>
      <div className="space-y-2">
       {Object.entries(stats.byTopic).map(([topic, data]) => {
        const topicRate = data.done > 0 ? Math.round(data.correct / data.done * 100) : 0;
        return (
         <div key={topic} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
          <div className="flex items-center justify-between mb-1">
           <span className="text-sm text-slate-300">{TOPIC_NAMES[topic] || topic}</span>
           <span className="text-sm font-mono text-white">{data.correct}/{data.done}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
           <div className={`h-full ${topicRate >= 70 ? 'bg-emerald-500' : topicRate >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${topicRate}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-1 text-right">{topicRate}%</p>
         </div>
        );
       })}
      </div>
     </div>
    )}

    {/* Reset */}
    <button onClick={handleReset} className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm">
      Réinitialiser les statistiques
    </button>
   </div>
  </div>
 );
};
