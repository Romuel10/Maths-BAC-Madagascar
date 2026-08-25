/**
 * Mini-leçons interactives — cours de 2 min avec vérification
 * © 2025 RATOVOSON Navelanizara Romuel
 */
import React, { useState } from 'react';

interface Props { onClose: () => void }

type LessonId = 'deriv' | 'limits' | 'domain' | 'variation' | 'trinome' | 'complex' | 'integral' | 'sequences';

interface Slide {
 title: string;
 content: React.ReactNode;
 quiz?: { question: string; options: string[]; correct: number; explanation: string };
}

const B = ({ children, color = 'indigo' }: { children: React.ReactNode; color?: string }) => (
 <div className={`bg-${color}-500/10 rounded-xl p-4 border border-${color}-500/20 my-3`}>{children}</div>
);
const F = ({ children }: { children: React.ReactNode }) => (
 <p className="font-mono text-base text-white text-center bg-slate-800/50 rounded-lg py-3 px-4 my-2">{children}</p>
);
const T = ({ children }: { children: React.ReactNode }) => (
 <p className="text-sm text-slate-300 leading-relaxed my-2">{children}</p>
);

function buildLesson(id: LessonId): { title: string; icon: string; slides: Slide[] } {
 switch (id) {
  case 'deriv': return {
   title: 'La dérivée', icon: "f′",
   slides: [
    { title: 'Qu\'est-ce qu\'une dérivée ?', content: <>
     <T>La dérivée mesure la <strong className="text-white">vitesse de variation</strong> d'une fonction en un point.</T>
     <T>Si f'(x) {'>'} 0 → la fonction <span className="text-emerald-400">monte</span></T>
     <T>Si f'(x) {'<'} 0 → la fonction <span className="text-red-400">descend</span></T>
     <T>Si f'(x) = 0 → la fonction a un <span className="text-amber-400">point critique</span> (max ou min possible)</T>
     <B>
      <p className="text-xs text-blue-300 font-bold mb-1"> Analogie</p>
      <p className="text-xs text-slate-300">La dérivée c'est comme le compteur de vitesse d'une voiture : elle dit à quelle vitesse la courbe monte ou descend à chaque instant.</p>
     </B>
    </> },
    { title: 'Formules de base', content: <>
     <T>Les dérivées les plus courantes :</T>
     <F>(xⁿ)' = n × xⁿ⁻¹</F>
     <F>(sin x)' = cos x</F>
     <F>(cos x)' = −sin x</F>
     <F>(eˣ)' = eˣ</F>
     <F>(ln x)' = 1/x</F>
     <B color="emerald">
      <p className="text-xs text-emerald-300 font-bold mb-1"> Astuce</p>
      <p className="text-xs text-slate-300">L'exponentielle est la seule fonction égale à sa propre dérivée !</p>
     </B>
    </>,
    quiz: { question: 'Quelle est la dérivée de x³ ?', options: ['x²', '3x²', '3x³', '3x'], correct: 1, explanation: '(xⁿ)\' = n × xⁿ⁻¹, donc (x³)\' = 3 × x² = 3x²' }
    },
    { title: 'Règles de dérivation', content: <>
     <F>(u + v)' = u' + v'</F>
     <T>On dérive <strong className="text-white">terme par terme</strong>.</T>
     <F>(u × v)' = u'v + uv'</F>
     <T>Produit : « dérivée du premier × le second + le premier × dérivée du second »</T>
     <F>(u/v)' = (u'v − uv') / v²</F>
     <T>Quotient : « la dérivée du haut × le bas − le haut × la dérivée du bas, le tout sur le bas au carré »</T>
    </>,
    quiz: { question: 'Quelle règle pour dériver f(x) = x² × sin(x) ?', options: ['Somme', 'Produit', 'Quotient', 'Composée'], correct: 1, explanation: 'C\'est un produit de deux fonctions u=x² et v=sin(x), on utilise (uv)\' = u\'v + uv\'' }
    },
   ]
  };

  case 'limits': return {
   title: 'Les limites', icon: 'lim',
   slides: [
    { title: 'C\'est quoi une limite ?', content: <>
     <T>La limite décrit le <strong className="text-white">comportement</strong> d'une fonction quand x s'approche d'une valeur (ou de l'infini).</T>
     <B>
      <p className="text-xs text-blue-300 font-bold mb-1"> Image</p>
      <p className="text-xs text-slate-300">Imaginez que vous marchez sur une route : la limite vous dit vers où vous vous dirigez, même si vous n'y arrivez jamais.</p>
     </B>
     <T>Notation : <span className="font-mono text-white">lim (x→a) f(x) = L</span></T>
     <T>Signifie : quand x se rapproche de a, f(x) se rapproche de L.</T>
    </> },
    { title: 'Limites à l\'infini', content: <>
     <T>Quand x devient très grand :</T>
     <F>lim (x→+∞) xⁿ = +∞ (si n {'>'} 0)</F>
     <F>lim (x→+∞) 1/x = 0</F>
     <F>lim (x→+∞) eˣ = +∞</F>
     <F>lim (x→−∞) eˣ = 0</F>
     <B color="amber">
      <p className="text-xs text-amber-300 font-bold mb-1"> Croissances comparées</p>
      <p className="text-xs text-slate-300">ln(x) {'<<'} xᵅ {'<<'} eˣ quand x → +∞</p>
      <p className="text-xs text-slate-400 mt-1">L'exponentielle "gagne" toujours contre tout polynôme !</p>
     </B>
    </>,
    quiz: { question: 'Que vaut lim (x→+∞) 1/x ?', options: ['+∞', '1', '0', '−∞'], correct: 2, explanation: 'Quand x devient très grand, 1/x devient très petit et tend vers 0.' }
    },
   ]
  };

  case 'domain': return {
   title: 'Ensemble de définition', icon: 'Df',
   slides: [
    { title: 'C\'est quoi le domaine ?', content: <>
     <T>L'ensemble de définition <span className="font-mono text-indigo-300">Df</span> = toutes les valeurs de x pour lesquelles f(x) existe.</T>
     <T>3 interdictions à vérifier :</T>
     <B color="red">
      <p className="text-xs text-red-300 font-bold"> Division par zéro</p>
      <p className="text-xs text-slate-300 mt-1">Si f contient a/b → il faut b ≠ 0</p>
     </B>
     <B color="red">
      <p className="text-xs text-red-300 font-bold"> Racine d'un négatif</p>
      <p className="text-xs text-slate-300 mt-1">Si f contient √(expr) → il faut expr ≥ 0</p>
     </B>
     <B color="red">
      <p className="text-xs text-red-300 font-bold"> Log d'un négatif ou zéro</p>
      <p className="text-xs text-slate-300 mt-1">Si f contient ln(expr) → il faut expr {'>'} 0</p>
     </B>
    </>,
    quiz: { question: 'Quel est le domaine de f(x) = 1/x ?', options: ['ℝ', 'ℝ \\ {0}', ']0 ; +∞[', '[-1 ; 1]'], correct: 1, explanation: 'On interdit x = 0 car on ne peut pas diviser par zéro. Df = ℝ \\ {0}' }
    },
   ]
  };

  case 'variation': return {
   title: 'Tableau de variation', icon: '↗',
   slides: [
    { title: 'Méthode en 4 étapes', content: <>
     <B color="indigo"><p className="text-xs text-indigo-300 font-bold">Étape 1</p><p className="text-xs text-slate-300">Calculer f'(x)</p></B>
     <B color="purple"><p className="text-xs text-purple-300 font-bold">Étape 2</p><p className="text-xs text-slate-300">Résoudre f'(x) = 0 → points critiques</p></B>
     <B color="amber"><p className="text-xs text-amber-300 font-bold">Étape 3</p><p className="text-xs text-slate-300">Étudier le signe de f'(x) sur chaque intervalle</p></B>
     <B color="emerald"><p className="text-xs text-emerald-300 font-bold">Étape 4</p><p className="text-xs text-slate-300">f' {'>'} 0 → ↗ croissante | f' {'<'} 0 → ↘ décroissante</p></B>
    </>,
    quiz: { question: 'Si f\'(x) > 0 sur ]a,b[, que fait f ?', options: ['Elle est décroissante', 'Elle est croissante', 'Elle est constante', 'On ne sait pas'], correct: 1, explanation: 'Quand la dérivée est positive, la fonction est croissante (elle monte).' }
    },
   ]
  };

  case 'trinome': return {
   title: 'Trinôme du 2nd degré', icon: 'x²',
   slides: [
    { title: 'ax² + bx + c = 0', content: <>
     <T>Pour résoudre un trinôme, on calcule le <strong className="text-white">discriminant</strong> :</T>
     <F>Δ = b² − 4ac</F>
     <B color="emerald"><p className="text-xs text-emerald-300 font-bold">Δ {'>'} 0 → 2 solutions</p><p className="font-mono text-xs text-white mt-1">x = (−b ± √Δ) / (2a)</p></B>
     <B color="amber"><p className="text-xs text-amber-300 font-bold">Δ = 0 → 1 solution double</p><p className="font-mono text-xs text-white mt-1">x₀ = −b / (2a)</p></B>
     <B color="red"><p className="text-xs text-red-300 font-bold">Δ {'<'} 0 → pas de solution réelle</p></B>
    </>,
    quiz: { question: 'Si Δ = 0, combien de solutions ?', options: ['0', '1 (double)', '2', 'Infini'], correct: 1, explanation: 'Quand Δ = 0, le trinôme a une racine double x₀ = −b/(2a)' }
    },
   ]
  };

  case 'complex': return {
   title: 'Nombres complexes', icon: 'ℂ',
   slides: [
    { title: 'z = a + bi', content: <>
     <T>Un nombre complexe a deux parties :</T>
     <B color="indigo"><p className="text-xs text-indigo-300 font-bold">Partie réelle : a</p></B>
     <B color="purple"><p className="text-xs text-purple-300 font-bold">Partie imaginaire : b</p></B>
     <F>i² = −1</F>
     <T>Le module |z| = √(a² + b²) mesure la <strong className="text-white">distance à l'origine</strong>.</T>
     <T>L'argument arg(z) mesure l'<strong className="text-white">angle</strong> avec l'axe réel.</T>
    </>,
    quiz: { question: 'Que vaut i² ?', options: ['1', '-1', 'i', '-i'], correct: 1, explanation: 'Par définition, i est le nombre tel que i² = −1' }
    },
   ]
  };

  case 'integral': return {
   title: 'L\'intégrale', icon: '∫',
   slides: [
    { title: 'Aire sous la courbe', content: <>
     <T>L'intégrale ∫ₐᵇ f(x) dx représente l'<strong className="text-white">aire algébrique</strong> entre la courbe et l'axe x.</T>
     <B color="emerald"><p className="text-xs text-emerald-300 font-bold">Aire positive</p><p className="text-xs text-slate-300">Quand f(x) {'>'} 0 → aire comptée positivement</p></B>
     <B color="red"><p className="text-xs text-red-300 font-bold">Aire négative</p><p className="text-xs text-slate-300">Quand f(x) {'<'} 0 → aire comptée négativement</p></B>
     <T>La primitive F est une fonction dont la dérivée redonne f : <span className="font-mono text-white">F' = f</span></T>
     <F>∫ₐᵇ f(x) dx = F(b) − F(a)</F>
    </>,
    quiz: { question: 'Quelle est la primitive de 2x ?', options: ['x', 'x²', '2', 'x² + C'], correct: 3, explanation: 'La primitive de 2x est x² + C car (x² + C)\' = 2x' }
    },
   ]
  };

  case 'sequences': return {
   title: 'Les suites', icon: 'uₙ',
   slides: [
    { title: 'Suites arithmétiques et géométriques', content: <>
     <B color="indigo">
      <p className="text-xs text-indigo-300 font-bold mb-2">Suite arithmétique : uₙ₊₁ = uₙ + r</p>
      <p className="font-mono text-xs text-white">uₙ = u₀ + n × r</p>
      <p className="font-mono text-xs text-white mt-1">Sₙ = (n+1)(u₀ + uₙ) / 2</p>
     </B>
     <B color="purple">
      <p className="text-xs text-purple-300 font-bold mb-2">Suite géométrique : uₙ₊₁ = q × uₙ</p>
      <p className="font-mono text-xs text-white">uₙ = u₀ × qⁿ</p>
      <p className="font-mono text-xs text-white mt-1">Sₙ = u₀ × (1 − qⁿ⁺¹) / (1 − q)</p>
      <p className="font-mono text-xs text-emerald-300 mt-1">Si |q| {'<'} 1 : S∞ = u₀ / (1 − q)</p>
     </B>
    </>,
    quiz: { question: 'uₙ = 3 × 2ⁿ est une suite...', options: ['Arithmétique r=2', 'Géométrique q=2', 'Ni l\'un ni l\'autre', 'Constante'], correct: 1, explanation: 'uₙ = u₀ × qⁿ avec u₀=3 et q=2, c\'est géométrique de raison 2' }
    },
   ]
  };

  default: return { title: '', icon: '', slides: [] };
 }
}

export const MiniLesson: React.FC<Props> = ({ onClose }) => {
 const [lessonId, setLessonId] = useState<LessonId | null>(null);
 const [slideIdx, setSlideIdx] = useState(0);
 const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
 const [quizChecked, setQuizChecked] = useState(false);

 const lessons: { id: LessonId; icon: string; title: string; time: string }[] = [
  { id: 'deriv', icon: "f′", title: 'La dérivée', time: '3 min' },
  { id: 'limits', icon: 'lim', title: 'Les limites', time: '2 min' },
  { id: 'domain', icon: 'Df', title: 'Ensemble de définition', time: '2 min' },
  { id: 'variation', icon: '↗', title: 'Tableau de variation', time: '2 min' },
  { id: 'trinome', icon: 'x²', title: 'Trinôme 2nd degré', time: '2 min' },
  { id: 'complex', icon: 'ℂ', title: 'Nombres complexes', time: '2 min' },
  { id: 'integral', icon: '∫', title: 'L\'intégrale', time: '2 min' },
  { id: 'sequences', icon: 'uₙ', title: 'Les suites', time: '2 min' },
 ];

 const lesson = lessonId ? buildLesson(lessonId) : null;
 const slide = lesson ? lesson.slides[slideIdx] : null;
 const total = lesson ? lesson.slides.length : 0;

 const nextSlide = () => {
  setQuizAnswer(null); setQuizChecked(false);
  if (slideIdx < total - 1) setSlideIdx(slideIdx + 1);
  else { setLessonId(null); setSlideIdx(0); }
 };

 const prevSlide = () => {
  setQuizAnswer(null); setQuizChecked(false);
  if (slideIdx > 0) setSlideIdx(slideIdx - 1);
 };

 return (
  <div className="fixed inset-0 bg-slate-950/98 z-50 overflow-y-auto">
   <div className="tool-page-container px-4 py-6 min-h-screen">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-extrabold text-white"> {lessonId ? lesson?.title : 'Mini-leçons'}</h2>
     <button onClick={lessonId ? () => { setLessonId(null); setSlideIdx(0); } : onClose}
      className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
      {lessonId ? '←' : ''}
     </button>
    </div>

    {/* Lesson list */}
    {!lessonId && (
     <div className="space-y-2">
      <p className="text-sm text-slate-400 mb-3">Choisissez un concept à réviser en 2 minutes :</p>
      {lessons.map(l => (
       <button key={l.id} onClick={() => { setLessonId(l.id); setSlideIdx(0); setQuizAnswer(null); setQuizChecked(false); }}
        className="w-full bg-slate-800/40 border border-slate-700/20 rounded-2xl p-4 text-left transition-all active:scale-[0.98] hover:border-indigo-500/30 flex items-center gap-3">
        <span className="text-3xl">{l.icon}</span>
        <div className="flex-1">
         <p className="text-sm font-bold text-white">{l.title}</p>
         <p className="text-[10px] text-slate-400">{l.time}</p>
        </div>
        <span className="text-slate-600">→</span>
       </button>
      ))}
     </div>
    )}

    {/* Active lesson */}
    {lessonId && slide && (
     <div className="space-y-4 page-enter">
      {/* Progress */}
      <div className="flex items-center gap-2">
       <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${((slideIdx + 1) / total) * 100}%` }} />
       </div>
       <span className="text-xs text-slate-500">{slideIdx + 1}/{total}</span>
      </div>

      {/* Slide title */}
      <h3 className="text-lg font-extrabold text-white">{slide.title}</h3>

      {/* Content */}
      <div className="animate-fade-in">{slide.content}</div>

      {/* Quiz */}
      {slide.quiz && (
       <div className="bg-slate-800/40 rounded-2xl p-4 border border-indigo-500/20 space-y-3">
        <p className="text-xs font-bold text-indigo-400"> Vérifie ta compréhension</p>
        <p className="text-sm text-white font-semibold">{slide.quiz.question}</p>
        <div className="space-y-1.5">
         {slide.quiz.options.map((opt, i) => {
          let cls = 'bg-slate-800/50 border-slate-600/50 text-slate-300';
          if (quizChecked) {
           if (i === slide.quiz!.correct) cls = 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200';
           else if (i === quizAnswer) cls = 'bg-red-600/30 border-red-500/50 text-red-200';
          } else if (i === quizAnswer) cls = 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200 ring-2 ring-indigo-500/30';
          return (
           <button key={i} onClick={() => !quizChecked && setQuizAnswer(i)}
            className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-all ${cls}`}>
            <span className="inline-flex items-center gap-2 font-mono">
             <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-bold shrink-0">{String.fromCharCode(65 + i)}</span>
             {opt}
            </span>
           </button>
          );
         })}
        </div>
        {!quizChecked && quizAnswer !== null && (
         <button onClick={() => setQuizChecked(true)} className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl text-sm active:scale-[0.98]">Vérifier</button>
        )}
        {quizChecked && (
         <div className={`rounded-xl p-3 ${quizAnswer === slide.quiz.correct ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}>
          <p className={`text-xs font-bold ${quizAnswer === slide.quiz.correct ? 'text-emerald-300' : 'text-amber-300'}`}>
           {quizAnswer === slide.quiz.correct ? ' Correct !' : ' Pas tout à fait'}
          </p>
          <p className="text-xs text-slate-300 mt-1">{slide.quiz.explanation}</p>
         </div>
        )}
       </div>
      )}

      {/* Navigation */}
      <div className="flex gap-2">
       <button onClick={prevSlide} disabled={slideIdx === 0}
        className="flex-1 py-3 bg-slate-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold rounded-xl text-sm">← Précédent</button>
       <button onClick={nextSlide}
        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl text-sm">
        {slideIdx < total - 1 ? 'Suivant →' : ' Terminer'}
       </button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
};
