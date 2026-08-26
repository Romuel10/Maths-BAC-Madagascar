import { useState } from 'react';
import { APP_VERSION, COPYRIGHT, CREATOR } from '../lib/protection';
import { storageJsonGet, storageJsonSet } from '../lib/safeStorage';

const ACTIVATION_KEY = 'mathsolver_activated';

export function isActivated(): boolean {
 return storageJsonGet<{activated?:boolean}>(ACTIVATION_KEY,{}).activated===true;
}

function activate(code: string): boolean {
 // Cette porte locale est uniquement un verrou d'interface, pas une sécurité serveur.
 // Pour une vraie distribution commerciale, valider le code via Firebase/Supabase/API.
 const configuredCode = String(import.meta.env.VITE_DEMO_ACTIVATION_CODE || '').trim().toUpperCase();
 if (!configuredCode) return false;
 if (code.trim().toUpperCase() !== configuredCode) return false;
 return storageJsonSet(ACTIVATION_KEY,{ activated: true, date: new Date().toISOString() });
}

interface Props { onActivated: () => void }

export function ActivationGate({ onActivated }: Props) {
 const [code, setCode] = useState('');
 const [error, setError] = useState('');

 const submit = () => {
  if (activate(code)) {
   onActivated();
   return;
  }
  setError('Code invalide ou activation serveur non configurée.');
 };

 return (
  <div className="fixed inset-0 z-[250] bg-slate-950 flex items-center justify-center px-6 text-white">
   <div className="max-w-sm w-full text-center space-y-5">
    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 via-indigo-500 to-rose-500 flex items-center justify-center mx-auto text-3xl shadow-2xl">🇲🇬</div>
    <div><h1 className="text-2xl font-extrabold">Maths BAC Madagascar</h1><p className="text-xs text-slate-500 mt-1">v{APP_VERSION}</p></div>
    <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30"><p className="font-bold text-amber-300"> Activation locale</p><p className="text-xs text-slate-400 mt-1">Ce mode est optionnel et doit être activé dans la configuration du projet.</p></div>
    <label htmlFor="activation-code" className="sr-only">Code d’activation</label><input id="activation-code" value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} placeholder="Code d’activation" className="w-full rounded-2xl bg-slate-900 border border-slate-700 px-4 py-4 text-center font-mono uppercase outline-none focus:border-indigo-500" />
    {error && <p className="text-xs text-rose-400" role="alert">{error}</p>}
    <button onClick={submit} className="w-full rounded-2xl py-4 bg-indigo-600 font-bold">Activer</button>
    <div className="text-[9px] text-slate-600"><p>{CREATOR}</p><p>{COPYRIGHT}</p></div>
   </div>
  </div>
 );
}
