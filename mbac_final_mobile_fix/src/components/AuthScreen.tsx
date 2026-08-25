/**
 * Écran de connexion — Lycée Madagascar
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useState } from 'react';
import { type Role, type ClassLevel, type UserProfile, setUser, generateId, ROLE_LABELS, CLASS_LABELS } from '../lib/auth';
import { useLang } from '../lib/i18n';

interface Props { onLogin: (user: UserProfile) => void }

export const AuthScreen: React.FC<Props> = ({ onLogin }) => {
 const { lang } = useLang();
 const [step, setStep] = useState<'role' | 'info'>('role');
 const [name, setName] = useState('');
 const [role, setRole] = useState<Role>('student');
 const [classLevel, setClassLevel] = useState<ClassLevel>('seconde');
 const [pin, setPin] = useState('');
 const [adminCode, setAdminCode] = useState('');
 const [error, setError] = useState('');

 const ADMIN_SECRET = '2025MS';
 const L = (fr: string, en: string, mg: string) => lang === 'en' ? en : lang === 'mg' ? mg : fr;

 const handleSubmit = () => {
  setError('');
  if (!name.trim() || name.trim().length < 2) { setError(L('Entrez votre nom complet', 'Enter your full name', 'Ampidiro ny anaranao feno')); return; }
  if (role === 'admin' && adminCode !== ADMIN_SECRET) { setError(L('Code admin invalide', 'Invalid admin code', 'Code admin tsy mety')); return; }
  if (role === 'teacher' && pin.length < 4) { setError(L('PIN : 4 chiffres minimum', 'PIN: 4 digits minimum', 'PIN: 4 tarehimarika fara fahakeliny')); return; }

  const user: UserProfile = {
   id: generateId(), name: name.trim(), role,
   classLevel: role === 'student' ? classLevel : undefined,
   pin: role === 'teacher' ? pin : undefined,
   createdAt: new Date().toISOString(),
  };
  setUser(user); onLogin(user);
 };

 return (
  <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center px-5 overflow-y-auto">
   <div className="max-w-sm w-full py-8 space-y-5">
    {/* Logo */}
    <div className="text-center">
     <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto font-bold text-lg text-white shadow-xl mb-3">f(x)</div>
     <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">Maths BAC Madagascar</h1>
     <p className="text-xs text-slate-500 mt-1">{L('Lycée — Madagascar', 'High School — Madagascar', 'Lisea — Madagasikara')}</p>
    </div>

    {/* Step 1: Role */}
    {step === 'role' && (
     <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-slate-400 text-center">{L('Qui êtes-vous ?', 'Who are you?', 'Iza ianao?')}</p>
      <div className="space-y-2">
       {(['student', 'teacher', 'admin'] as Role[]).map(r => {
        const info = ROLE_LABELS[r];
        return (
         <button key={r} onClick={() => { setRole(r); setStep('info'); }}
          className="w-full bg-slate-800/40 border border-slate-700/20 rounded-2xl p-4 text-left transition-all active:scale-[0.98] hover:border-indigo-500/30 flex items-center gap-4">
          <span className="text-3xl">{info.icon}</span>
          <div>
           <p className="text-sm font-bold text-white">{info[lang as 'fr' | 'en' | 'mg'] || info.fr}</p>
           <p className="text-[10px] text-slate-500">
            {r === 'student' && L('Seconde, Première ou Terminale', 'Grade 10, 11 or 12', '2nde, 1ère na Tle')}
            {r === 'teacher' && L('Professeur de mathématiques', 'Mathematics teacher', 'Mpampianatra matematika')}
            {r === 'admin' && L('Administrateur du système', 'System administrator', 'Mpitantana ny rafitra')}
           </p>
          </div>
          <span className="text-slate-600 ml-auto">→</span>
         </button>
        );
       })}
      </div>
     </div>
    )}

    {/* Step 2: Info */}
    {step === 'info' && (
     <div className="space-y-4 animate-fade-in">
      <button onClick={() => setStep('role')} className="text-sm text-slate-500 flex items-center gap-1">← {L('Retour', 'Back', 'Miverina')}</button>

      {/* Role badge */}
      <div className={`rounded-xl p-3 border flex items-center gap-3 bg-${ROLE_LABELS[role].color}-500/10 border-${ROLE_LABELS[role].color}-500/20`}>
       <span className="text-2xl">{ROLE_LABELS[role].icon}</span>
       <p className={`text-sm font-bold text-${ROLE_LABELS[role].color}-300`}>{ROLE_LABELS[role][lang as 'fr' | 'en' | 'mg'] || ROLE_LABELS[role].fr}</p>
      </div>

      {/* Name */}
      <div>
       <label className="block text-xs text-indigo-400 font-bold mb-1">{L('Nom complet', 'Full name', 'Anarana feno')}</label>
       <input value={name} onChange={e => setName(e.target.value)} placeholder="RATOVOSON Navelanizara"
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 focus:outline-none" />
      </div>

      {/* Class level — students only */}
      {role === 'student' && (
       <div>
        <label className="block text-xs text-emerald-400 font-bold mb-2">{L('Classe', 'Grade', 'Kilasy')}</label>
        <div className="grid grid-cols-3 gap-2">
         {(['seconde', 'premiere', 'terminale'] as ClassLevel[]).map(cl => (
          <button key={cl} onClick={() => setClassLevel(cl)}
           className={`py-3 rounded-xl text-center transition-all active:scale-95 border ${classLevel === cl ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg' : 'bg-slate-800/50 text-slate-400 border-slate-700/30'}`}>
           <span className="text-lg font-bold block">{CLASS_LABELS[cl].short}</span>
           <span className="text-[9px] block mt-0.5">{CLASS_LABELS[cl][lang as 'fr' | 'en' | 'mg'] || CLASS_LABELS[cl].fr}</span>
          </button>
         ))}
        </div>
       </div>
      )}

      {/* Teacher PIN */}
      {role === 'teacher' && (
       <div>
        <label className="block text-xs text-indigo-400 font-bold mb-1"> {L('Code PIN pour verrouiller les examens', 'PIN to lock exams', 'Code PIN hidiana fanadinana')}</label>
        <input type="password" value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="1234" maxLength={6} inputMode="numeric"
         className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono text-center text-xl tracking-[0.5em] focus:border-indigo-500 focus:outline-none" />
       </div>
      )}

      {/* Admin code */}
      {role === 'admin' && (
       <div>
        <label className="block text-xs text-amber-400 font-bold mb-1"> {L('Code secret administrateur', 'Admin secret code', 'Code miafina mpitantana')}</label>
        <input type="password" value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="••••••"
         className="w-full bg-slate-900 border border-amber-700/50 rounded-xl px-4 py-3 text-white font-mono text-center focus:border-amber-500 focus:outline-none" />
       </div>
      )}

      {error && <p className="text-red-400 text-xs text-center bg-red-500/10 border border-red-500/30 rounded-xl p-2">{error}</p>}

      <button onClick={handleSubmit}
       className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-2xl active:scale-[0.98] shadow-lg">
       {L('Commencer', 'Start', 'Hanomboka')} →
      </button>
     </div>
    )}
   </div>
  </div>
 );
};
