import { analyzeStudentRequest } from '../src/lib/solverIntent.js';
import { getTutorExplanation, getTutorPractice, getTutorStepSupport, type TutorExplanationLevel } from '../src/lib/tutorCoach.js';

const samples = [
 ['Étudier les variations de f(x)=x^2-4x+3', 'Analyse'],
 ['Résoudre x^2-5x+6=0', 'Algèbre'],
 ['Calculer le module du nombre complexe z=2+i', 'Complexes'],
 ['Calculer une probabilité avec une loi binomiale', 'Probabilités'],
 ['Étudier la suite u_n définie par récurrence', 'Suites'],
 ['Montrer que deux vecteurs sont orthogonaux', 'Géométrie'],
 ['Calculer le PGCD avec Euclide', 'Arithmétique'],
 ['Calculer la valeur acquise avec un intérêt composé', 'Finance']
] as const;

for (const [statement, expectedTopic] of samples) {
 const detected = analyzeStudentRequest(statement);
 if (detected.topic !== expectedTopic) throw new Error(`Sujet mal détecté : ${statement} -> ${detected.topic}`);
 const support = getTutorStepSupport(detected.topic, 0);
 if (!support.objective || !support.action || !support.selfCheck) throw new Error(`Aide incomplète pour ${detected.topic}`);
 const practice = getTutorPractice(detected.topic);
 if (!practice.prompt || !practice.hint || !practice.solution || !practice.checkpoint) throw new Error(`Entraînement incomplet pour ${detected.topic}`);
 for (const level of ['simple', 'detail', 'bac'] as TutorExplanationLevel[]) {
  const explanation = getTutorExplanation(detected.topic, 999, level);
  if (explanation.length < 2 || explanation.some(line => !line.trim())) throw new Error(`Explication invalide pour ${detected.topic}/${level}`);
 }
}

const clamped = getTutorStepSupport('Algèbre', -12);
if (!clamped.objective) throw new Error('Le bornage des étapes du tuteur ne fonctionne pas.');

console.log('Tutor regression: détection, aides progressives et mini-entraînements validés.');
