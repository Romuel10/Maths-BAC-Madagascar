import { getBacProgress } from '../lib/bacProgress';

interface Props {
 onSubjects: () => void;
 onTutor: () => void;
 onTools: () => void;
 onProgress: () => void;
}

export function BacHome({ onSubjects, onTutor, onTools, onProgress }: Props) {
 const store = getBacProgress();
 const mastered = Object.values(store.questions).filter(q => q.correct).length;

 return (
  <div className="space-y-5 page-enter">
   <section className="surface p-5">
    <p className="eyebrow">Tableau de bord</p>
    <h1 className="section-title mt-2">Maths BAC Madagascar</h1>
    <p className="section-copy mt-2">
     Préparez votre examen avec des cours, exercices, annales et outils de résolution.
    </p>
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
     <h2 className="section-title">Exercices</h2>
     <p className="section-copy">S'entraîner avec des exercices progressifs.</p>
    </button>
    <button className="surface p-4 text-left" onClick={onTools}>
     <h2 className="section-title">Résolution mathématique</h2>
     <p className="section-copy">Résoudre des problèmes avec des étapes détaillées.</p>
    </button>
    <button className="surface p-4 text-left" onClick={onProgress}>
     <h2 className="section-title">Suivi</h2>
     <p className="section-copy">Consulter votre progression.</p>
    </button>
   </section>
  </div>
 );
}
