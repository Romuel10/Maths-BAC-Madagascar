import { EXTRA_BAC_SUBJECTS } from './extraBacSubjects.js';

export type BacSeries = 'A' | 'C' | 'D' | 'L' | 'OSE' | 'S';
export type BacTopic =
 | 'Analyse'
 | 'Algèbre'
 | 'Complexes'
 | 'Probabilités'
 | 'Suites'
 | 'Géométrie'
 | 'Arithmétique'
 | 'Statistiques'
 | 'Finance';

export type AnswerCheck =
 | { kind: 'number'; expected: number; tolerance?: number }
 | { kind: 'expression'; expected: string; variable?: string }
 | { kind: 'text'; allOf?: string[]; anyOf?: string[] }
 | { kind: 'choice'; expected: string };

export interface BacQuestion {
 id: string;
 number: string;
 topic: BacTopic;
 prompt: string;
 points: number;
 hints: string[];
 method: string[];
 check: AnswerCheck;
 finalAnswer: string;
 toolExpression?: string;
}

export interface BacExercise {
 id: string;
 title: string;
 introduction?: string;
 questions: BacQuestion[];
}

export interface BacSubject {
 id: string;
 series: BacSeries;
 year: number;
 title: string;
 durationMinutes: number;
 coefficient?: number;
 official: boolean;
 sourceLabel: string;
 description: string;
 exercises: BacExercise[];
}

// Corpus original d'entraînement. Il imite la structure et les thèmes d'un BAC
// malgache sans reproduire mot pour mot un sujet officiel publié ailleurs.
const CORE_BAC_SUBJECTS: BacSubject[] = [
 {
  id: 'type-d-2026-01',
  series: 'D',
  year: 2026,
  title: 'Entraînement BAC — Série D · Sujet 1',
  durationMinutes: 90,
  coefficient: 4,
  official: false,
  sourceLabel: 'Sujet original d’entraînement intégré à l’application',
  description: 'Analyse, suites et probabilités avec résolution progressive.',
  exercises: [
   {
    id: 'd-analyse',
    title: 'Exercice 1 — Analyse',
    introduction: 'On considère la fonction $f$ définie sur $ℝ$ par $f(x)=x*e^(-x)$.',
    questions: [
     {
      id: 'd-an-1', number: '1.a', topic: 'Analyse', points: 1.5,
      prompt: "Calculer $f'(x)$.",
      hints: [
       "Il s’agit d’un produit $u(x)\\cdot v(x)$. Utilise $(uv)'=u'v+uv'$.",
       "La dérivée de $e^(-x)$ est $-e^(-x)$."
      ],
      method: [
       "Poser $u(x)=x$ et $v(x)=e^(-x)$.",
       "Calculer $u'(x)=1$ et $v'(x)=-e^(-x)$.",
       "Appliquer la formule du produit puis factoriser $e^(-x)$."
      ],
      check: { kind: 'expression', expected: 'exp(-x)*(1-x)' },
      finalAnswer: "$f'(x)=e^(-x)(1-x)$.",
      toolExpression: 'x*exp(-x)'
     },
     {
      id: 'd-an-2', number: '1.b', topic: 'Analyse', points: 1.5,
      prompt: 'Déterminer le sens de variation de f sur ℝ.',
      hints: [
       '$e^(-x)$ est strictement positif pour tout réel $x$.',
       "Le signe de $f'(x)$ est donc celui de $1-x$."
      ],
      method: [
       "Étudier le signe de $1-x$.",
       "$f'(x)>0$ pour $x<1$ et $f'(x)<0$ pour $x>1$.",
       'En déduire les intervalles de croissance et de décroissance.'
      ],
      check: { kind: 'text', allOf: ['croissante', '1', 'décroissante'] },
      finalAnswer: '$f$ est croissante sur $]-∞,1]$ puis décroissante sur $[1,+∞[$.',
      toolExpression: 'x*exp(-x)'
     },
     {
      id: 'd-an-3', number: '1.c', topic: 'Analyse', points: 1,
      prompt: 'Donner la valeur maximale de f.',
      hints: ['Le maximum est atteint au point où le sens de variation change.', 'Calcule $f(1)$.'],
      method: ['Utiliser la question précédente.', 'Calculer $f(1)=e^(-1)$.'],
      check: { kind: 'expression', expected: '1/e' },
      finalAnswer: 'Le maximum vaut $1/e$ et il est atteint pour $x=1$.',
      toolExpression: 'x*exp(-x)'
     }
    ]
   },
   {
    id: 'd-suite',
    title: 'Exercice 2 — Suite numérique',
    introduction: 'On définit $u_0=2$ et $u_(n+1)=0.5u_n+3$.',
    questions: [
     {
      id: 'd-su-1', number: '2.a', topic: 'Suites', points: 1,
      prompt: 'Calculer $u_1$ puis $u_2$.',
      hints: ['Remplace $n$ par $0$ dans la relation de récurrence.', 'Puis utilise la valeur de $u_1$ pour calculer $u_2$.'],
      method: ['$u_1=0.5*2+3$.', '$u_2=0.5*u_1+3$.'],
      check: { kind: 'text', allOf: ['4', '5'] },
      finalAnswer: '$u_1=4$ et $u_2=5$.'
     },
     {
      id: 'd-su-2', number: '2.b', topic: 'Suites', points: 1.5,
      prompt: 'Si la suite converge vers une limite $ℓ$, déterminer $ℓ$.',
      hints: ['À la limite, $u_n$ et $u_(n+1)$ ont la même limite $ℓ$.', 'Résous $ℓ=0.5ℓ+3$.'],
      method: ['Écrire $ℓ=0.5ℓ+3$.', 'Regrouper les termes en $ℓ$.', '$0.5ℓ=3$.'],
      check: { kind: 'number', expected: 6 },
      finalAnswer: '$ℓ=6$.'
     }
    ]
   },
   {
    id: 'd-proba',
    title: 'Exercice 3 — Probabilités',
    introduction: 'Une épreuve indépendante est réussie avec la probabilité $p=0.3$. On la répète $4$ fois.',
    questions: [
     {
      id: 'd-pr-1', number: '3.a', topic: 'Probabilités', points: 1.5,
      prompt: 'Calculer la probabilité d’obtenir exactement deux réussites.',
      hints: ['On utilise une loi binomiale de paramètres $n=4$ et $p=0.3$.', '$P(X=2)=C(4,2)*0.3^2*0.7^2$.'],
      method: ['Calculer $C(4,2)=6$.', 'Calculer $6*0.3^2*0.7^2$.'],
      check: { kind: 'number', expected: 0.2646, tolerance: 0.0002 },
      finalAnswer: '$P(X=2)=0.2646$.'
     }
    ]
   }
  ]
 },
 {
  id: 'type-c-2026-01',
  series: 'C',
  year: 2026,
  title: 'Entraînement BAC — Série C · Sujet 1',
  durationMinutes: 100,
  coefficient: 5,
  official: false,
  sourceLabel: 'Sujet original d’entraînement intégré à l’application',
  description: 'Complexes, étude rationnelle et arithmétique.',
  exercises: [
   {
    id: 'c-complexes',
    title: 'Exercice 1 — Nombres complexes',
    introduction: 'Dans $ℂ$, on considère l’équation $z^2-2z+5=0$.',
    questions: [
     {
      id: 'c-co-1', number: '1.a', topic: 'Complexes', points: 2,
      prompt: 'Résoudre l’équation dans $ℂ$.',
      hints: ['Calcule le discriminant $Δ$.', '$Δ=(-2)^2-4*1*5=-16$.', 'Utilise $sqrt(-16)=4i$.'],
      method: ['Calculer $Δ=-16$.', 'Appliquer $z=(2±4i)/2$.'],
      check: { kind: 'text', allOf: ['1+2i', '1-2i'] },
      finalAnswer: 'Les solutions sont $z_1=1+2i$ et $z_2=1-2i$.'
     },
     {
      id: 'c-co-2', number: '1.b', topic: 'Complexes', points: 1,
      prompt: 'Calculer le module de $z_1=1+2i$.',
      hints: ['Pour $z=a+bi$, $|z|=sqrt(a^2+b^2)$.'],
      method: ['Identifier $a=1$ et $b=2$.', 'Calculer $sqrt(1^2+2^2)$.'],
      check: { kind: 'expression', expected: 'sqrt(5)' },
      finalAnswer: '$|z_1|=sqrt(5)$.'
     }
    ]
   },
   {
    id: 'c-analyse',
    title: 'Exercice 2 — Fonction rationnelle',
    introduction: 'On considère $f(x)=(x^2+1)/(x-1)$.',
    questions: [
     {
      id: 'c-an-1', number: '2.a', topic: 'Analyse', points: 1,
      prompt: 'Déterminer l’ensemble de définition de f.',
      hints: ['Le dénominateur ne doit jamais être nul.', 'Résous $x-1=0$.'],
      method: ['Imposer $x-1≠0$.', 'Donc $x≠1$.'],
      check: { kind: 'text', anyOf: ['x≠1', 'x!=1', 'r\\{1}', 'r-{1}', 'ℝ\\{1}'] },
      finalAnswer: '$Df=\\mathbb{R}\\setminus\\{1\\}$.',
      toolExpression: '(x^2+1)/(x-1)'
     },
     {
      id: 'c-an-2', number: '2.b', topic: 'Analyse', points: 2,
      prompt: "Calculer $f'(x)$.",
      hints: ["Utilise la formule du quotient $(u/v)'=(u'v-uv')/v^2$.", 'Développe puis réduis le numérateur.'],
      method: ["$u=x^2+1$, $u'=2x$ ; $v=x-1$, $v'=1$.", "$f'=[2x(x-1)-(x^2+1)]/(x-1)^2$.", 'Réduire le numérateur.'],
      check: { kind: 'expression', expected: '(x^2-2*x-1)/(x-1)^2' },
      finalAnswer: "$f'(x)=(x^2-2x-1)/(x-1)^2$.",
      toolExpression: '(x^2+1)/(x-1)'
     },
     {
      id: 'c-an-3', number: '2.c', topic: 'Analyse', points: 1.5,
      prompt: 'Déterminer une asymptote oblique à la courbe de f.',
      hints: ['Effectue la division de $x^2+1$ par $x-1$.', 'On obtient $f(x)=x+1+2/(x-1)$.'],
      method: ['Écrire $f(x)=x+1+2/(x-1)$.', 'Quand $x→±∞$, $2/(x-1)→0$.'],
      check: { kind: 'text', allOf: ['y', 'x+1'] },
      finalAnswer: "L’asymptote oblique est $y=x+1$.",
      toolExpression: '(x^2+1)/(x-1)'
     }
    ]
   },
   {
    id: 'c-arith',
    title: 'Exercice 3 — Arithmétique',
    questions: [
     {
      id: 'c-ar-1', number: '3.a', topic: 'Arithmétique', points: 1,
      prompt: 'Calculer $PGCD(252,198)$.',
      hints: ["Applique l’algorithme d’Euclide.", '$252=198+54$, puis $198=3*54+36$.'],
      method: ['$252=1*198+54$.', '$198=3*54+36$.', '$54=1*36+18$.', '$36=2*18$.'],
      check: { kind: 'number', expected: 18 },
      finalAnswer: '$PGCD(252,198)=18$.'
     }
    ]
   }
  ]
 },
 {
  id: 'type-a-2026-01',
  series: 'A',
  year: 2026,
  title: 'Entraînement BAC — Série A · Sujet 1',
  durationMinutes: 75,
  coefficient: 2,
  official: false,
  sourceLabel: 'Sujet original d’entraînement intégré à l’application',
  description: 'Fonctions, statistiques et probabilités fondamentales.',
  exercises: [
   {
    id: 'a-fonction',
    title: 'Exercice 1 — Fonction du second degré',
    introduction: 'On considère $f(x)=x^2-4x+3$.',
    questions: [
     {
      id: 'a-fo-1', number: '1.a', topic: 'Algèbre', points: 1.5,
      prompt: 'Résoudre $f(x)=0$.',
      hints: ['Cherche deux nombres dont le produit vaut 3 et la somme 4.', 'Factorise $x^2-4x+3$.'],
      method: ['$f(x)=(x-1)(x-3)$.', 'Un produit est nul si l’un des facteurs est nul.'],
      check: { kind: 'text', allOf: ['1', '3'] },
      finalAnswer: 'Les solutions sont $x=1$ et $x=3$.',
      toolExpression: 'x^2-4*x+3'
     },
     {
      id: 'a-fo-2', number: '1.b', topic: 'Analyse', points: 1,
      prompt: 'Calculer $f(2)$.',
      hints: ['Remplace $x$ par $2$ dans l’expression.'],
      method: ['$f(2)=2^2-4*2+3$.', 'Calculer $4-8+3$.'],
      check: { kind: 'number', expected: -1 },
      finalAnswer: '$f(2)=-1$.',
      toolExpression: 'x^2-4*x+3'
     }
    ]
   },
   {
    id: 'a-stats',
    title: 'Exercice 2 — Statistiques',
    introduction: 'Les notes de cinq élèves sont : 8 ; 10 ; 12 ; 14 ; 16.',
    questions: [
     {
      id: 'a-st-1', number: '2.a', topic: 'Statistiques', points: 1,
      prompt: 'Calculer la moyenne de cette série.',
      hints: ['Additionne les cinq notes puis divise par 5.'],
      method: ['$8+10+12+14+16=60$.', 'Moyenne $=60/5$.'],
      check: { kind: 'number', expected: 12 },
      finalAnswer: 'La moyenne est 12.'
     },
     {
      id: 'a-st-2', number: '2.b', topic: 'Statistiques', points: 1,
      prompt: 'Donner la médiane.',
      hints: ['Les valeurs sont déjà rangées.', 'Avec cinq valeurs, la médiane est la troisième.'],
      method: ['Repérer la valeur centrale.'],
      check: { kind: 'number', expected: 12 },
      finalAnswer: 'La médiane est 12.'
     }
    ]
   },
   {
    id: 'a-proba',
    title: 'Exercice 3 — Probabilité',
    introduction: 'Un sac contient 3 boules rouges et 2 boules bleues. On tire une boule au hasard.',
    questions: [
     {
      id: 'a-pr-1', number: '3.a', topic: 'Probabilités', points: 1,
      prompt: 'Calculer la probabilité de tirer une boule rouge.',
      hints: ['Il y a 5 boules en tout, dont 3 rouges.'],
     method: ['$P(rouge)=\\frac{\\text{nombre de cas favorables}}{\\text{nombre de cas possibles}}$.'],
     check: { kind: 'expression', expected: '3/5' },
     finalAnswer: '$P(rouge)=3/5=0.6$.'
     },
     {
      id: 'a-pr-2', number: '3.b', topic: 'Probabilités', points: 1,
      prompt: 'Calculer la probabilité de tirer une boule bleue.',
      hints: ['Utilise le nombre de boules bleues sur le nombre total.', 'Tu peux aussi utiliser l’événement contraire de « tirer rouge ».'],
      method: ['$P(bleue)=2/5$.', 'Contrôle : $P(rouge)+P(bleue)=3/5+2/5=1$.'],
      check: { kind: 'expression', expected: '2/5' },
      finalAnswer: '$P(bleue)=2/5=0.4$.'
     }
    ]
   }
  ]
 }
];

export const BAC_SUBJECTS: BacSubject[] = [
 ...CORE_BAC_SUBJECTS,
 ...EXTRA_BAC_SUBJECTS,
];


export function flattenQuestions(subject: BacSubject): BacQuestion[] {
 return subject.exercises.flatMap(ex => ex.questions);
}

export function subjectMaxPoints(subject: BacSubject): number {
 return flattenQuestions(subject).reduce((sum, q) => sum + q.points, 0);
}

export function isBacSeries(value:unknown):value is BacSeries { return value==='A'||value==='C'||value==='D'||value==='L'||value==='OSE'||value==='S'; }
