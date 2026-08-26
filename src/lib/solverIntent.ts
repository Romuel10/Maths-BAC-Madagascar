export type SolverTopic = 'Analyse' | 'Algèbre' | 'Complexes' | 'Probabilités' | 'Suites' | 'Géométrie' | 'Arithmétique' | 'Général';
export type SolverGoal = 'understand' | 'calculate' | 'solve' | 'study' | 'prove' | 'represent';

export interface SolverIntent {
 topic: SolverTopic;
 goal: SolverGoal;
 goalLabel: string;
 summary: string;
 keywords: string[];
 functionExpression: string | null;
 advice: string[];
 givens: string[];
 question: string;
 unknown: string;
 suggestedSteps: string[];
}

const GOAL_LABELS: Record<SolverGoal, string> = {
 understand: 'Comprendre et organiser la question',
 calculate: 'Effectuer un calcul puis le vérifier',
 solve: 'Résoudre et contrôler les solutions',
 study: 'Construire une étude complète',
 prove: 'Démontrer avec une justification',
 represent: 'Construire ou interpréter une représentation',
};

function normalized(text: string): string {
 return text
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[’']/g, "'")
  .replace(/\s+/g, ' ')
  .trim();
}

export function detectSolverTopic(text: string): SolverTopic {
 const s = normalized(text);
 if (/deriv|limite|variation|asympt|fonction|tangente|primitive|integrale|ensemble de definition/.test(s)) return 'Analyse';
 if (/complex|\bz\b|module|argument|conjugu|partie reelle|partie imaginaire/.test(s)) return 'Complexes';
 if (/probab|binom|evenement|tirage|urne|esperance|ecart.type/.test(s)) return 'Probabilités';
 if (/suite|u_n|u\(n\)|u\s*[_]?\s*n\s*\+\s*1|recurrence|geometrique|arithmetique.*suite/.test(s)) return 'Suites';
 if (/vecteur|droite|cercle|plan|distance|triangle|orthogonal|barycentre|colineaire/.test(s)) return 'Géométrie';
 if (/pgcd|congru|divisib|nombre premier|bezout|euclide/.test(s)) return 'Arithmétique';
 if (/equation|inequation|factor|developp|polyn|systeme|matrice|trinome/.test(s)) return 'Algèbre';
 return 'Général';
}

function detectGoal(text: string): SolverGoal {
 const s = normalized(text);
 if (/demontr|montrer que|prouver|justifier|etablir que/.test(s)) return 'prove';
 if (/resou|solution|racine|equation|inequation|systeme/.test(s)) return 'solve';
 if (/etud|variation|derive|limite|asymptote|domaine|ensemble de definition|convexit/.test(s)) return 'study';
 if (/tracer|represent|construire|courbe|graphique|tableau/.test(s)) return 'represent';
 if (/calcul|determiner|trouver|evaluer|donner la valeur/.test(s)) return 'calculate';
 return 'understand';
}

function extractFunctionExpression(text: string): string | null {
 const plain = text.replace(/\$/g, '').replace(/\\left|\\right/g, '').replace(/\r/g, '');
 const match = plain.match(/(?:^|[\s,;:])(?:f|g|h)\s*\(\s*x\s*\)\s*=\s*([^\n;]+)/i);
 if (!match) return null;
 let candidate = match[1]
  .replace(/\.\s+(?=[A-ZÀ-Ý]).*$/u, '')
  .replace(/\s+(?:sur|pour tout|où|avec)\s+(?:l['’]?intervalle|r\b|ℝ|x\b).*$/i, '')
  .replace(/\s+et\s+(?:etud|calcul|determin|montr|resou|trac).*$/i, '')
  .trim();
 candidate = candidate.replace(/[.,!?]+$/, '').trim();
 if (!candidate || candidate.length > 180 || !/x/i.test(candidate)) return null;
 return candidate;
}

function detectedKeywords(text: string): string[] {
 const s = normalized(text);
 const candidates: Array<[RegExp, string]> = [
  [/ensemble de definition|domaine/, 'domaine'],
  [/limite/, 'limites'],
  [/deriv/, 'dérivée'],
  [/variation/, 'variations'],
  [/asymptote/, 'asymptote'],
  [/factor/, 'factorisation'],
  [/equation|resou/, 'équation'],
  [/inequation/, 'inéquation'],
  [/probab|evenement|binom/, 'probabilités'],
  [/suite|recurrence/, 'suite'],
  [/demontr|montrer|prouver|justifier/, 'justification'],
  [/tracer|courbe|graphique/, 'représentation'],
 ];
 return candidates.filter(([pattern]) => pattern.test(s)).map(([, label]) => label).slice(0, 5);
}

function buildAdvice(topic: SolverTopic, goal: SolverGoal): string[] {
 const first: Record<SolverTopic, string> = {
  Analyse: 'Commence par l’ensemble de définition avant toute dérivée ou limite.',
  Algèbre: 'Place tout du même côté et vérifie les valeurs interdites.',
  Complexes: 'Repère la forme demandée : algébrique, module, argument ou équation.',
  Probabilités: 'Définis les événements et écris la formule avant les nombres.',
  Suites: 'Identifie si la suite est explicite ou définie par récurrence.',
  Géométrie: 'Fais un schéma, relève les données puis choisis la propriété utile.',
  Arithmétique: 'Repère divisibilité, PGCD ou congruence avant de calculer.',
  Général: 'Sépare les données, la question et la propriété du cours à utiliser.',
 };
 const final = goal === 'prove'
  ? 'Chaque affirmation doit être reliée à une propriété ou à un calcul vérifiable.'
  : goal === 'solve'
   ? 'Remplace les solutions trouvées dans l’expression initiale pour les contrôler.'
   : 'Termine par une phrase qui répond exactement à la question.';
 return [first[topic], final];
}

function extractStructure(text:string,functionExpression:string|null,goal:SolverGoal):Pick<SolverIntent,'givens'|'question'|'unknown'|'suggestedSteps'>{
 const clean=text.replace(/\s+/g,' ').trim();
 const values=[...clean.matchAll(/-?\d+(?:[,.]\d+)?(?:\s*%|\s*(?:cm|m|km|kg|h|min))?/gi)].map(match=>match[0].trim());
 const givens=[...(functionExpression?[`Fonction : f(x) = ${functionExpression}`]:[]),...new Set(values).values()].slice(0,6);
 const clauses=clean.split(/(?<=[.?!;])\s+/).filter(Boolean);
 const question=clauses.find(clause=>/(calcul|determin|trouv|resou|etud|montr|prouv|justifi|trac|represent|dedui)/i.test(normalized(clause)))||clauses.at(-1)||'Préciser exactement la question à traiter.';
 const unknownByGoal:Record<SolverGoal,string>={
  understand:'La consigne exacte et la propriété utile',calculate:'La valeur demandée',solve:'La ou les solutions admissibles',study:'Les propriétés demandées de l’objet étudié',prove:'L’affirmation à justifier',represent:'La représentation demandée et ses éléments remarquables'
 };
 const suggestedSteps=[
  `Reformuler : ${question.replace(/[.?!]+$/,'')}.`,
  functionExpression?'Commencer par vérifier le domaine de la fonction.':'Écrire les données utiles avec leurs unités ou conditions.',
  goal==='prove'?'Nommer la propriété qui justifie chaque passage.':goal==='solve'?'Effectuer le calcul puis contrôler chaque solution.':'Appliquer la formule ou la méthode du chapitre.',
  'Rédiger une phrase finale qui répond à la consigne.'
 ];
 return{givens:givens.length?givens:['Aucune donnée numérique ou fonction explicite repérée.'],question,unknown:unknownByGoal[goal],suggestedSteps};
}

export function analyzeStudentRequest(text: string): SolverIntent {
 const topic = detectSolverTopic(text);
 const goal = detectGoal(text);
 const functionExpression = extractFunctionExpression(text);
 const keywords = detectedKeywords(text);
 const structure=extractStructure(text,functionExpression,goal);
 const detail = keywords.length ? `Points repérés : ${keywords.join(', ')}.` : 'Aucun mot-clé suffisamment précis n’a été repéré.';
 return {
  topic,
  goal,
  goalLabel: GOAL_LABELS[goal],
  summary: `${GOAL_LABELS[goal]} · chapitre probable : ${topic}. ${detail}`,
  keywords,
  functionExpression,
  advice: buildAdvice(topic, goal),
  ...structure,
 };
}
