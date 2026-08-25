import React, { useState } from 'react';
import { useLang } from '../lib/i18n';

interface Props { onComplete: () => void }

const SLIDES = [
 {
  icon: '01',
  titleFr: 'Bienvenue sur Maths BAC Madagascar',
  titleEn: 'Welcome to Maths BAC Madagascar',
  titleMg: 'Tongasoa amin\'ny Maths BAC Madagascar',
  descFr: 'L\'outil n°1 pour étudier vos fonctions mathématiques. Domaine, limites, dérivées, variations, courbe — tout est expliqué étape par étape.',
  descEn: 'The #1 tool to study mathematical functions. Domain, limits, derivatives, variations, graph — everything explained step by step.',
  descMg: 'Ny fitaovana laharana 1 hianatra ny asa matematika. Faritra, fetra, dérivée, fiovaovana, kisary — voazava dingana tsirairay.',
  color: 'from-indigo-600/30 to-purple-600/30',
  border: 'border-indigo-500/30',
 },
 {
  icon: '02',
  titleFr: 'Clavier mathématique simple',
  titleEn: 'Simple math keyboard',
  titleMg: 'Keyboard matematika tsotra',
  descFr: 'Pas besoin de connaître une écriture de calculatrice. Utilisez le clavier visuel avec √, x², sin, cos, π et bien plus : les formules sont affichées comme sur une copie de maths.',
  descEn: 'No calculator-style syntax to learn. Use the visual keyboard with √, x², sin, cos, π and more: formulas are displayed like normal school mathematics.',
  descMg: 'Tsy mila mianatra soratra manokana amin’ny calculatrice. Ampiasao ny clavier misy √, x², sin, cos, π; aseho toy ny matematika an-tsekoly ny formule.',
  color: 'from-emerald-600/30 to-teal-600/30',
  border: 'border-emerald-500/30',
 },
 {
  icon: '03',
  titleFr: 'Apprenez en pratiquant',
  titleEn: 'Learn by practicing',
  titleMg: 'Mianara amin\'ny fanazarana',
  descFr: 'Exercices QCM, mode examen chronométré, fiches de révision et suivi de progression. Tout pour réussir vos examens de maths !',
  descEn: 'MCQ exercises, timed exam mode, revision sheets and progress tracking. Everything to ace your math exams!',
  descMg: 'Fanazaran-tena QCM, fanadinana misy chronomètre, taratasy famerenana ary fanaraha-maso ny fandrosoana. Izay rehetra ilaina hahomby amin\'ny fanadinana matematika!',
  color: 'from-amber-600/30 to-orange-600/30',
  border: 'border-amber-500/30',
 },
];

export const Onboarding: React.FC<Props> = ({ onComplete }) => {
 const { lang } = useLang();
 const [step, setStep] = useState(0);

 const slide = SLIDES[step];
 const title = lang === 'en' ? slide.titleEn : lang === 'mg' ? slide.titleMg : slide.titleFr;
 const desc = lang === 'en' ? slide.descEn : lang === 'mg' ? slide.descMg : slide.descFr;

 const handleNext = () => {
  if (step < SLIDES.length - 1) setStep(step + 1);
  else { localStorage.setItem('mathsolver_onboarded', '1'); onComplete(); }
 };

 const handleSkip = () => {
  localStorage.setItem('mathsolver_onboarded', '1');
  onComplete();
 };

 return (
  <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center px-6">
   {/* Skip */}
   <button onClick={handleSkip} className="absolute top-12 right-6 text-slate-500 text-sm font-semibold hover:text-white transition-colors">
    {lang === 'en' ? 'Skip' : lang === 'mg' ? 'Dingao' : 'Passer'} →
   </button>

   {/* Content */}
   <div className="flex-1 flex flex-col items-center justify-center max-w-sm" key={step}>
    {/* Icon */}
    <div className={`w-28 h-28 rounded-[2rem] bg-gradient-to-br ${slide.color} border ${slide.border} flex items-center justify-center text-6xl mb-8 animate-scale-in shadow-2xl`}>
     {slide.icon}
    </div>

    {/* Title */}
    <h1 className="text-2xl font-extrabold text-white text-center mb-4 animate-slide-up">
     {title}
    </h1>

    {/* Description */}
    <p className="text-slate-400 text-center text-sm leading-relaxed animate-slide-up" style={{ animationDelay: '100ms' }}>
     {desc}
    </p>
   </div>

   {/* Bottom */}
   <div className="w-full max-w-sm pb-12 space-y-4">
    {/* Dots */}
    <div className="flex justify-center gap-2">
     {SLIDES.map((_, i) => (
      <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
       i === step ? 'w-8 bg-indigo-500' : 'w-1.5 bg-slate-700'
      }`} />
     ))}
    </div>

    {/* Button */}
    <button onClick={handleNext}
     className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all">
     {step < SLIDES.length - 1
      ? (lang === 'en' ? 'Next' : lang === 'mg' ? 'Manaraka' : 'Suivant')
      : (lang === 'en' ? 'Get Started ' : lang === 'mg' ? 'Hanomboka ' : 'Commencer ')
     }
    </button>
   </div>
  </div>
 );
};
