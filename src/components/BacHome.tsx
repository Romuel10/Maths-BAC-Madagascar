import { getBacProgress } from '../lib/bacProgress';
import { getStudentProfile, weakTopics } from '../lib/studentProfile';

interface Props {
 onSubjects: () => void;
 onTutor: () => void;
 onTools: () => void;
 onProgress: () => void;
}

export function BacHome({ onSubjects, onTutor, onTools, onProgress }: Props) {
 const store = getBacProgress();
 const mastered = Object.values(store.questions).filter(q => q.correct).length;
 const profile=getStudentProfile();
 const priority=weakTopics(profile)[0];

 return (
  <div className="space-y-5 page-enter">
   <section className="surface p-5">
    <p className="eyebrow">Tableau de bord</p>
    <h1 className="section-title mt-2">Maths BAC Madagascar</h1>
    <p className="section-copy mt-2">
     Révise le programme, entraîne-toi sur les annales et fais-toi guider pas à pas quand un exercice te bloque.
    </p>
    <div className="flex flex-wrap gap-2 mt-3"><span className="chip chip-brand">{profile.series?`Série ${profile.series}`:'Profil à configurer'}</span>{priority&&<span className="chip chip-warning">Priorité : {priority}</span>}</div>
    {profile.lastActivity&&<button onClick={profile.lastActivity.kind==='solve'?onTutor:onProgress} className="btn btn-secondary w-full mt-3">Continuer · {profile.lastActivity.label}</button>}
   </section>

   <section className="surface p-5">
    <p className="eyebrow">Progression</p>
    <div className="flex items-end justify-between mt-2">
     <span className="text-3xl font-bold">{mastered}</span>
     <span className="subtle">exercices maîtrisés</span>
    </div>
   </section>

   <section className="grid gap-3">
    <button className="surface p-4 text-left" onClick={onSubjects}>
     <h2 className="section-title">Apprendre</h2>
     <p className="section-copy">Cours et notions du programme BAC.</p>
    </button>
    <button className="surface p-4 text-left" onClick={onTutor}>
     <h2 className="section-title">Un exercice me bloque</h2>
     <p className="section-copy">Comprendre la consigne, recevoir une explication adaptée et s’entraîner sur un exemple similaire.</p>
    </button>
    <button className="surface p-4 text-left" onClick={onTools}>
     <h2 className="section-title">Outils mathématiques</h2>
     <p className="section-copy">Calculer, vérifier et explorer une fonction sans remplacer la méthode du cours.</p>
    </button>
    <button className="surface p-4 text-left" onClick={onProgress}>
     <h2 className="section-title">Mon coach</h2>
     <p className="section-copy">Diagnostic, révision rapide, carnet d’erreurs et progression.</p>
    </button>
   </section>
  </div>
 );
}
