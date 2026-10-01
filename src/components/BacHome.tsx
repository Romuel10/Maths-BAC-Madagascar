import { getBacProgress } from '../lib/bacProgress';
import { getStudentProfile, weakTopics } from '../lib/studentProfile';

interface Props {
 onBac: () => void;
 onTutor: () => void;
 onTools: () => void;
 onReview: () => void;
}

const ACTIONS = [
 { id:'review', symbol:'01', title:'Réviser mes cours', copy:'Leçons détaillées, exemples corrigés, diagnostic et points faibles.' },
 { id:'solve', symbol:'02', title:'Résoudre un exercice', copy:'Recopie une question et avance étape par étape avec le tuteur.' },
 { id:'bac', symbol:'03', title:'M’entraîner au BAC', copy:'Annales, sujets d’entraînement et simulations par série.' },
 { id:'tools', symbol:'04', title:'Calculatrices', copy:'Vérifier un calcul ou explorer une fonction avec les outils spécialisés.' },
] as const;

export function BacHome({ onBac, onTutor, onTools, onReview }: Props) {
 const store = getBacProgress();
 const mastered = Object.values(store.questions).filter(q => q.correct).length;
 const profile=getStudentProfile();
 const priority=weakTopics(profile)[0];

 const open=(id:typeof ACTIONS[number]['id'])=>{
  if(id==='review')onReview();
  else if(id==='solve')onTutor();
  else if(id==='bac')onBac();
  else onTools();
 };

 return (
  <div className="space-y-5 page-enter">
   <section className="home-hero">
    <div>
     <p className="eyebrow">Préparation BAC Madagascar</p>
     <h1 className="home-hero-title">Que veux-tu faire maintenant ?</h1>
     <p className="home-hero-copy">Choisis une action. L’application te montre seulement ce qui est utile pour avancer.</p>
    </div>
    <div className="flex flex-wrap gap-2 mt-4">
     <span className="chip chip-brand">{profile.series?'Série '+profile.series:'Choisir ma série'}</span>
     {priority&&<span className="chip chip-warning">À renforcer : {priority}</span>}
    </div>
    {profile.lastActivity&&<button onClick={profile.lastActivity.kind==='solve'?onTutor:onReview} className="btn btn-secondary w-full mt-4">Continuer · {profile.lastActivity.label}</button>}
   </section>

   <section className="home-action-grid" aria-label="Actions principales">
    {ACTIONS.map(action=>(
     <button key={action.id} className="home-action-card" onClick={()=>open(action.id)}>
      <span className="home-action-number">{action.symbol}</span>
      <span className="home-action-body">
       <strong>{action.title}</strong>
       <small>{action.copy}</small>
      </span>
      <span className="home-action-arrow" aria-hidden="true">›</span>
     </button>
    ))}
   </section>

   <section className="surface p-4">
    <div className="flex items-center justify-between gap-3">
     <div><p className="eyebrow">Progression</p><p className="section-title mt-2">Exercices maîtrisés</p></div>
     <span className="home-mastered">{mastered}</span>
    </div>
    <button onClick={onReview} className="btn btn-ghost w-full mt-3">Voir mon suivi et mes révisions</button>
   </section>
  </div>
 );
}
