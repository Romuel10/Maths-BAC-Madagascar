/**
 * Mode Classe / Examen — Verrouillage de l'app
 * Empêche l'utilisation pendant les examens.
 * Le professeur active le verrouillage avec un code PIN.
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useState, useEffect, useCallback } from 'react';

interface Props {
 onClose: () => void;
}

const LOCK_KEY = 'mathsolver_exam_lock';

interface LockState {
 active: boolean;
 until: number; // timestamp
 pin: string;
 teacherName: string;
}

function getLock(): LockState | null {
 try {
  const raw = localStorage.getItem(LOCK_KEY);
  if (!raw) return null;
  const state = JSON.parse(raw) as LockState;
  if (state.active && state.until > Date.now()) return state;
  // Expired
  localStorage.removeItem(LOCK_KEY);
  return null;
 } catch { return null; }
}

function setLock(state: LockState) {
 localStorage.setItem(LOCK_KEY, JSON.stringify(state));
}

function clearLock() {
 localStorage.removeItem(LOCK_KEY);
}

// ── Lock Screen — shown when app is locked ──
export const LockScreen: React.FC = () => {
 const [lock, setLockState] = useState<LockState | null>(getLock());
 const [pin, setPin] = useState('');
 const [error, setError] = useState('');
 const [remaining, setRemaining] = useState('');

 useEffect(() => {
  const id = setInterval(() => {
   const current = getLock();
   if (!current) { setLockState(null); window.location.reload(); return; }
   setLockState(current);
   const left = current.until - Date.now();
   if (left <= 0) { clearLock(); window.location.reload(); return; }
   const h = Math.floor(left / 3600000);
   const m = Math.floor((left % 3600000) / 60000);
   const s = Math.floor((left % 60000) / 1000);
   setRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
  }, 1000);
  return () => clearInterval(id);
 }, []);

 const handleUnlock = () => {
  setError('');
  if (!lock) return;
  if (pin === lock.pin) {
   clearLock();
   window.location.reload();
  } else {
   setError('Code PIN incorrect');
   setPin('');
  }
 };

 if (!lock) return null;

 return (
  <div className="fixed inset-0 z-[300] bg-slate-950 flex flex-col items-center justify-center px-6 select-none" style={{ touchAction: 'none' }}>
   {/* Block back button */}
   <div className="absolute inset-0" onContextMenu={e => e.preventDefault()} />
   
   <div className="text-center max-w-sm space-y-6">
    {/* Lock icon */}
    <div className="w-24 h-24 mx-auto rounded-3xl bg-red-600/20 border-2 border-red-500/30 flex items-center justify-center">
     <span className="text-5xl"></span>
    </div>

    <div>
     <h1 className="text-2xl font-extrabold text-white">Mode Examen Activé</h1>
     <p className="text-sm text-slate-400 mt-2">L'application est verrouillée pendant l'examen.</p>
    </div>

    {/* Timer */}
    <div className="bg-red-600/10 border border-red-500/30 rounded-2xl p-4">
     <p className="text-xs text-red-400 font-bold">Temps restant</p>
     <p className="text-3xl font-mono font-extrabold text-white mt-1">{remaining}</p>
    </div>

    {/* Teacher info */}
    {lock.teacherName && (
     <p className="text-sm text-slate-500">Verrouillé par : <span className="text-slate-300 font-bold">{lock.teacherName}</span></p>
    )}

    {/* Unlock with PIN */}
    <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/20">
     <p className="text-xs text-slate-400 mb-2"> Déverrouiller (professeur uniquement)</p>
     <div className="flex gap-2">
      <input
       type="password"
       value={pin}
       onChange={e => setPin(e.target.value)}
       placeholder="Code PIN"
       maxLength={6}
       className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-center text-lg tracking-widest focus:border-red-500 focus:outline-none"
       inputMode="numeric"
      />
      <button onClick={handleUnlock} className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl active:scale-95"></button>
     </div>
     {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>

    <p className="text-[10px] text-slate-700">L'app se déverrouillera automatiquement à la fin du temps imparti.</p>
   </div>
  </div>
 );
};

// ── Setup Panel — for teachers to activate lock ──
export const ClassroomLock: React.FC<Props> = ({ onClose }) => {
 const [duration, setDuration] = useState(60); // minutes
 const [pin, setPin] = useState('');
 const [teacherName, setTeacherName] = useState('');
 const [step, setStep] = useState<'setup' | 'confirm' | 'active'>('setup');
 const [currentLock, setCurrentLock] = useState<LockState | null>(getLock());

 const activate = useCallback(() => {
  if (pin.length < 4) return;
  const lock: LockState = {
   active: true,
   until: Date.now() + duration * 60 * 1000,
   pin,
   teacherName,
  };
  setLock(lock);
  setCurrentLock(lock);
  setStep('active');
 }, [pin, duration, teacherName]);

 const deactivate = useCallback(() => {
  clearLock();
  setCurrentLock(null);
  setStep('setup');
 }, []);

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="tool-page-container px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> Mode Classe</h2>
     <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">×</button>
    </div>

    {/* Already active */}
    {currentLock && step !== 'active' && (
     <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4">
      <p className="text-red-300 font-bold text-sm"> Un verrouillage est déjà actif</p>
      <p className="text-xs text-slate-400 mt-1">Fin prévue : {new Date(currentLock.until).toLocaleTimeString()}</p>
      <button onClick={deactivate} className="mt-2 px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-sm active:scale-95">Désactiver</button>
     </div>
    )}

    {/* Setup */}
    {step === 'setup' && !currentLock && (
     <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
       <p className="text-sm font-bold text-blue-300 mb-2"> Pour les professeurs</p>
       <p className="text-xs text-slate-300 leading-relaxed">
        Activez le mode classe pour empêcher les étudiants d'utiliser l'application pendant un examen. 
        Choisissez un code PIN que vous seul connaissez pour pouvoir déverrouiller.
       </p>
      </div>

      <div>
       <label className="block text-xs text-indigo-400 font-bold mb-1">Nom du professeur (optionnel)</label>
       <input value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="M. Dupont"
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 focus:outline-none" />
      </div>

      <div>
       <label className="block text-xs text-indigo-400 font-bold mb-1">Durée du verrouillage</label>
       <div className="grid grid-cols-4 gap-2">
        {[30, 60, 90, 120].map(d => (
         <button key={d} onClick={() => setDuration(d)}
          className={`py-2.5 rounded-xl text-center text-sm font-bold border transition-all active:scale-95 ${duration === d ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800/50 text-slate-400 border-slate-700/30'}`}>
          {d < 60 ? `${d} min` : `${d / 60}h${d % 60 ? d % 60 : ''}`}
         </button>
        ))}
       </div>
       <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value) || 60)} min={5} max={300}
        className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-mono text-center focus:border-indigo-500 focus:outline-none" />
       <p className="text-[10px] text-slate-500 mt-1 text-center">En minutes (5 à 300)</p>
      </div>

      <div>
       <label className="block text-xs text-red-400 font-bold mb-1"> Code PIN de déverrouillage (4-6 chiffres)</label>
       <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="1234" maxLength={6} inputMode="numeric"
        className="w-full bg-slate-900 border border-red-700/50 rounded-xl px-4 py-3 text-white font-mono text-center text-2xl tracking-[0.5em] focus:border-red-500 focus:outline-none" />
       <p className="text-[10px] text-red-400 mt-1 text-center"> Mémorisez ce code ! Il est nécessaire pour déverrouiller.</p>
      </div>

      <button onClick={() => pin.length >= 4 ? setStep('confirm') : null} disabled={pin.length < 4}
       className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold rounded-xl active:scale-[0.98] shadow-lg">
        Préparer le verrouillage
      </button>
     </div>
    )}

    {/* Confirm */}
    {step === 'confirm' && (
     <div className="space-y-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
       <span className="text-4xl"></span>
       <h3 className="text-lg font-extrabold text-white mt-2">Confirmer le verrouillage ?</h3>
       <p className="text-sm text-slate-300 mt-2">L'application sera <strong className="text-red-400">complètement inaccessible</strong> pendant :</p>
       <p className="text-3xl font-extrabold text-amber-400 mt-2">{duration} minutes</p>
       {teacherName && <p className="text-xs text-slate-500 mt-2">Par : {teacherName}</p>}
       <p className="text-xs text-red-400 mt-3">Seul le code PIN pourra déverrouiller avant la fin.</p>
      </div>

      <div className="flex gap-2">
       <button onClick={() => setStep('setup')} className="flex-1 py-3 bg-slate-700 text-white font-bold rounded-xl active:scale-95">Annuler</button>
       <button onClick={activate} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl active:scale-95 shadow-lg"> Verrouiller maintenant</button>
      </div>
     </div>
    )}

    {/* Active confirmation */}
    {step === 'active' && (
     <div className="space-y-4 text-center py-8">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
       <span className="text-4xl"></span>
      </div>
      <h3 className="text-xl font-extrabold text-white">Verrouillage activé !</h3>
      <p className="text-sm text-slate-400">L'application est maintenant verrouillée pour {duration} minutes.</p>
      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/20">
       <p className="text-xs text-slate-400">Fin prévue :</p>
       <p className="text-lg font-mono text-white font-bold">{new Date(Date.now() + duration * 60000).toLocaleTimeString()}</p>
      </div>
      <p className="text-xs text-amber-400">Fermez l'application. Elle sera verrouillée au prochain lancement.</p>
      <button onClick={onClose} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl active:scale-[0.98]">Fermer</button>
     </div>
    )}
   </div>
  </div>
 );
};

// ── Hook to check lock status ──
export function useExamLock(): boolean {
 const lock = getLock();
 return lock !== null && lock.active && lock.until > Date.now();
}
