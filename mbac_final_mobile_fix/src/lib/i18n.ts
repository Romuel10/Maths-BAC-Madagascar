import { createContext, useContext } from 'react';

export type Lang = 'fr' | 'en' | 'mg';

const T = {
 // ── App ──
 appName:    { fr: 'Maths BAC Madagascar',     en: 'Maths BAC Madagascar',      mg: 'Maths BAC Madagascar' },
 appSub:     { fr: 'Préparation au BAC malgache',  en: 'Madagascar BAC preparation',   mg: 'Fiomanana BAC eto Madagasikara' },
 install:    { fr: 'Installer',           en: 'Install',             mg: 'Hapetraka' },
 // ── Bottom Nav ──
 navHome:    { fr: 'Accueil',            en: 'Home',              mg: 'Fandraisana' },
 navLearn:    { fr: 'Apprendre',           en: 'Learn',              mg: 'Hianatra' },
 navTools:    { fr: 'Outils',            en: 'Tools',              mg: 'Fitaovana' },
 navProfile:   { fr: 'Profil',            en: 'Profile',             mg: 'Mombamomba' },
 // ── Tabs ──
 steps:     { fr: 'Étapes',            en: 'Steps',              mg: 'Dingana' },
 graph:     { fr: 'Graphique',           en: 'Graph',              mg: 'Kisary' },
 advanced:    { fr: 'Avancé',            en: 'Advanced',            mg: 'Avo lenta' },
 tools:     { fr: 'Outils',            en: 'Tools',              mg: 'Fitaovana' },
 // ── Quick actions ──
 sheets:     { fr: 'Fiches',            en: 'Sheets',             mg: 'Taratasy' },
 exercises:   { fr: 'Exercices',           en: 'Exercises',            mg: 'Fanazaran-tena' },
 quiz:      { fr: 'Quiz',             en: 'Quiz',              mg: 'Quiz' },
 exam:      { fr: 'Examen',            en: 'Exam',              mg: 'Fanadinana' },
 compare:    { fr: 'Comparer',           en: 'Compare',             mg: 'Hampitahao' },
 export:     { fr: 'Exporter',           en: 'Export',              mg: 'Avoaka' },
 stats:     { fr: 'Statistiques',         en: 'Statistics',            mg: 'Statistika' },
 sequences:   { fr: 'Suites',            en: 'Sequences',            mg: 'Filaharana' },
 parameter:   { fr: 'Paramètre',          en: 'Parameter',            mg: 'Paramètre' },
 handwrite:   { fr: 'Écrire',            en: 'Write',              mg: 'Soraty' },
 scan:      { fr: 'Scanner',            en: 'Scan',               mg: 'Scan' },
 // ── Empty state ──
 emptyTitle:   { fr: 'Étudiez vos fonctions',    en: 'Study your functions',       mg: 'Diniho ny asa-tananao' },
 emptyDesc:   { fr: 'Entrez une fonction pour une analyse complète avec explications pas à pas.', en: 'Enter a function for a complete analysis with step-by-step explanations.', mg: 'Ampidiro ny asa iray mba hahazoana famakafakana feno miaraka amin\'ny fanazavana dingana tsirairay.' },
 studyOf:    { fr: 'Étude de',           en: 'Study of',             mg: 'Fandinihana ny' },
 // ── Domain ──
 domain:     { fr: 'Ensemble de définition',    en: 'Domain of definition',       mg: 'Faritra famaritana' },
 domainDesc:   { fr: 'Où la fonction existe ?',    en: 'Where does the function exist?',  mg: 'Aiza no misy ilay asa?' },
 domainResult:  { fr: 'Résultat',           en: 'Result',              mg: 'Valiny' },
 noDomainRestriction: { fr: 'Aucune restriction — définie sur ℝ', en: 'No restriction — defined on ℝ', mg: 'Tsy misy fepetra — voafaritra amin\'ny ℝ' },
 excludedValues: { fr: 'Valeurs exclues',       en: 'Excluded values',         mg: 'Soatoavina voaaro' },
 intervals:   { fr: 'Intervalles',         en: 'Intervals',            mg: 'Elanelana' },
 // ── Derivative ──
 derivative:   { fr: 'Calcul de la dérivée',     en: 'Derivative calculation',      mg: 'Kajy ny dérivée' },
 derivDesc:   { fr: 'Pour étudier les variations',  en: 'To study variations',       mg: 'Mba hianatra ny fiovaovana' },
 derivRules:   { fr: 'Règles utilisées',       en: 'Rules used',            mg: 'Fitsipika nampiasaina' },
 derivResult:  { fr: 'Réponse finale de la dérivée', en: 'Final derivative', mg: 'Valiny farany amin’ny dérivée' },
 secondDeriv:  { fr: 'Dérivée seconde simplifiée', en: 'Simplified second derivative', mg: 'Dérivée faharoa voatsotra' },
 // ── Critical ──
 critical:    { fr: 'Points critiques',       en: 'Critical points',         mg: 'Teboka manan-danja' },
 critDesc:    { fr: 'Trouver les extremums',     en: 'Find extrema',           mg: 'Hitady ny tena be/kely' },
 noCritical:   { fr: 'Aucun point critique trouvé', en: 'No critical points found',     mg: 'Tsy misy teboka manan-danja hita' },
 maximum:    { fr: 'Maximum local',        en: 'Local maximum',          mg: 'Fara-tampony eo an-toerana' },
 minimum:    { fr: 'Minimum local',        en: 'Local minimum',          mg: 'Fara-ambany eo an-toerana' },
 // ── Sign & Variation ──
 signVar:    { fr: 'Signe et variations',     en: 'Sign and variations',       mg: 'Marika sy fiovaovana' },
 signDesc:    { fr: 'Tableau de variation',     en: 'Variation table',         mg: 'Tabilaon\'ny fiovaovana' },
 increasing:   { fr: 'Croissante',          en: 'Increasing',            mg: 'Mitombo' },
 decreasing:   { fr: 'Décroissante',         en: 'Decreasing',            mg: 'Mihena' },
 signOfF:    { fr: 'Signe de f(x)',        en: 'Sign of f(x)',           mg: 'Marika f(x)' },
 zerosOfF:    { fr: 'Zéros de f(x)',        en: 'Zeros of f(x)',          mg: 'Aotra f(x)' },
 // ── Limits ──
 limits:     { fr: 'Calcul des limites',      en: 'Limit calculations',        mg: 'Kajy ny fetra' },
 limitDesc:   { fr: 'Comportement aux bornes',    en: 'Behavior at boundaries',      mg: 'Fitondran-tena amin\'ny sisin-tany' },
 asymptotes:   { fr: 'Asymptotes',          en: 'Asymptotes',            mg: 'Asymptota' },
 verticalAsym:  { fr: 'Asymptote verticale',     en: 'Vertical asymptote',        mg: 'Asymptota mitsangana' },
 horizontalAsym: { fr: 'Asymptote horizontale',    en: 'Horizontal asymptote',       mg: 'Asymptota mandry' },
 obliqueAsym:  { fr: 'Asymptote oblique',      en: 'Oblique asymptote',         mg: 'Asymptota miangatra' },
 // ── Parity ──
 parity:     { fr: 'Parité',            en: 'Parity',              mg: 'Ankasa/tsy ankasa' },
 even:      { fr: 'Fonction paire',        en: 'Even function',           mg: 'Asa ankasa' },
 odd:      { fr: 'Fonction impaire',       en: 'Odd function',           mg: 'Asa tsy ankasa' },
 neither:    { fr: 'Ni paire ni impaire',     en: 'Neither even nor odd',       mg: 'Tsy ankasa, tsy tsy ankasa' },
 // ── Convexity ──
 convexity:   { fr: 'Convexité',          en: 'Convexity',             mg: 'Convexité' },
 convex:     { fr: 'Convexe',           en: 'Convex',              mg: 'Convexe' },
 concave:    { fr: 'Concave',           en: 'Concave',              mg: 'Concave' },
 inflectionPt:  { fr: 'Point d\'inflexion',      en: 'Inflection point',         mg: 'Teboka fiovaovan-javatra' },
 // ── Periodicity ──
 periodicity:  { fr: 'Périodicité',         en: 'Periodicity',            mg: 'Fiverenana' },
 periodic:    { fr: 'Périodique',          en: 'Periodic',             mg: 'Miverina' },
 notPeriodic:  { fr: 'Non périodique',        en: 'Not periodic',           mg: 'Tsy miverina' },
 // ── Primitive ──
 primitive:   { fr: 'Primitive',          en: 'Antiderivative',          mg: 'Primitive' },
 // ── Tangent ──
 tangentLine:  { fr: 'Tangente en un point',     en: 'Tangent line at a point',      mg: 'Tsipika mpikasika amin\'ny teboka' },
 tangentEq:   { fr: 'Équation de la tangente',   en: 'Tangent line equation',       mg: 'Equation ny tsipika mpikasika' },
 slope:     { fr: 'Pente',            en: 'Slope',               mg: 'Fiakarana' },
 calculate:   { fr: 'Calculer',           en: 'Calculate',             mg: 'Kajy' },
 // ── Equation solver ──
 solveEq:    { fr: 'Résoudre f(x) = k',      en: 'Solve f(x) = k',          mg: 'Vahao f(x) = k' },
 solve:     { fr: 'Résoudre',           en: 'Solve',               mg: 'Vahao' },
 solutions:   { fr: 'Solutions',          en: 'Solutions',             mg: 'Vahaolana' },
 noSolution:   { fr: 'Aucune solution',       en: 'No solution',            mg: 'Tsy misy vahaolana' },
 // ── Exercises ──
 chooseFunc:   { fr: 'Choisissez une fonction',   en: 'Choose a function',         mg: 'Misafidiana asa iray' },
 yourAnswer:   { fr: 'Votre réponse',        en: 'Your answer',            mg: 'Ny valitenao' },
 correct:    { fr: 'Correct !',          en: 'Correct!',             mg: 'Marina !' },
 incorrect:   { fr: 'Incorrect',          en: 'Incorrect',             mg: 'Diso' },
 verify:     { fr: 'Vérifier',           en: 'Check',               mg: 'Hamarino' },
 next:      { fr: 'Suivant',           en: 'Next',               mg: 'Manaraka' },
 finish:     { fr: 'Terminer',           en: 'Finish',              mg: 'Vita' },
 score:     { fr: 'Score',            en: 'Score',               mg: 'Isa' },
 back:      { fr: 'Retour',            en: 'Back',               mg: 'Miverina' },
 restart:    { fr: 'Recommencer',         en: 'Restart',              mg: 'Averina' },
 timeLeft:    { fr: 'Temps restant',        en: 'Time left',             mg: 'Fotoana sisa' },
 examOver:    { fr: 'Examen terminé !',       en: 'Exam over!',            mg: 'Vita ny fanadinana !' },
 startExam:   { fr: 'Commencer l\'examen',     en: 'Start the exam',          mg: 'Hanomboka ny fanadinana' },
 examRules:   { fr: 'Règles',            en: 'Rules',               mg: 'Fitsipika' },
 previous:    { fr: 'Précédent',          en: 'Previous',             mg: 'Teo aloha' },
 question:    { fr: 'Question',           en: 'Question',             mg: 'Fanontaniana' },
 correction:   { fr: 'Correction',          en: 'Correction',            mg: 'Fanitsiana' },
 perfect:    { fr: 'Parfait ! ',        en: 'Perfect! ',           mg: 'Tonga lafatra ! ' },
 goodJob:    { fr: 'Bien joué !',         en: 'Good job!',             mg: 'Tsara be !' },
 keepPracticing: { fr: 'Continuez à pratiquer !',   en: 'Keep practicing!',         mg: 'Manohy miofana !' },
 // ── History ──
 history:    { fr: 'Historique',          en: 'History',              mg: 'Tantara' },
 clear:     { fr: 'Effacer',           en: 'Clear',               mg: 'Fafao' },
 // ── Export ──
 exportTitle:  { fr: 'Exporter l\'analyse',      en: 'Export analysis',          mg: 'Avoaka ny famakafakana' },
 copied:     { fr: 'Copié !',           en: 'Copied!',              mg: 'Nadika !' },
 copyText:    { fr: 'Copier le texte',       en: 'Copy text',             mg: 'Adikao ny lahatsoratra' },
 share:     { fr: 'Partager',           en: 'Share',               mg: 'Zarao' },
 // ── Misc ──
 courseReminder: { fr: 'Rappel de cours',       en: 'Course reminder',          mg: 'Fampahatsiahivana lesona' },
 method:     { fr: 'Méthode',           en: 'Method',              mg: 'Fomba' },
 conclusion:   { fr: 'Conclusion',          en: 'Conclusion',            mg: 'Fehin-kevitra' },
 analyze:    { fr: 'Analyser',           en: 'Analyze',              mg: 'Diniho' },
 analyzing:   { fr: 'Calcul…',           en: 'Computing…',            mg: 'Kajy…' },
 error:     { fr: 'Erreur',            en: 'Error',               mg: 'Hadisoana' },
 useKeyboard:  { fr: 'Utilisez le clavier',    en: 'Use the keyboard',        mg: 'Ampiasao ny keyboard' },
 examples:    { fr: 'Exemples',           en: 'Examples',             mg: 'Ohatra' },
 interval:    { fr: 'Intervalle',          en: 'Interval',             mg: 'Elanelana' },
 remarkPts:   { fr: 'Points remarquables',     en: 'Notable points',          mg: 'Teboka miavaka' },
 funcAnalyzed:  { fr: 'Fonction analysée',      en: 'Function analyzed',         mg: 'Asa voamakafaka' },
 completeSummary: { fr: 'Résumé complet',       en: 'Complete summary',         mg: 'Famintinana feno' },
 howToTrace:   { fr: 'Comment tracer la courbe ?',  en: 'How to plot the curve?',      mg: 'Ahoana ny fisaritana ny courbe?' },
 // ── Stats ──
 totalExercises: { fr: 'Exercices faits',       en: 'Exercises done',          mg: 'Fanazaran-tena vita' },
 correctRate:  { fr: 'Taux de réussite',       en: 'Success rate',           mg: 'Tahan\'ny fahombiazana' },
 streak:     { fr: 'Série en cours',        en: 'Current streak',          mg: 'Andiam-pahombiazana' },
 bestStreak:   { fr: 'Meilleure série',       en: 'Best streak',            mg: 'Andiana tsara indrindra' },
 progress:    { fr: 'Progression',         en: 'Progress',             mg: 'Fandrosoana' },
 byTopic:    { fr: 'Par thème',          en: 'By topic',             mg: 'Isaky ny lohahevitra' },
 resetStats:   { fr: 'Réinitialiser',        en: 'Reset',               mg: 'Averina' },
 // ── Sequences ──
 seqTitle:    { fr: 'Suites numériques',      en: 'Numerical sequences',        mg: 'Filaharana isa' },
 recursive:   { fr: 'Récurrente',          en: 'Recursive',             mg: 'Miverina' },
 explicit:    { fr: 'Explicite',          en: 'Explicit',             mg: 'Mazava' },
 nbTerms:    { fr: 'Nb termes',          en: 'Nb terms',             mg: 'Isa terms' },
 analyzeSeq:   { fr: 'Analyser la suite',      en: 'Analyze sequence',         mg: 'Diniho ny filaharana' },
 monotonic:   { fr: 'Monotonie',          en: 'Monotonicity',           mg: 'Monotonie' },
 convergence:  { fr: 'Convergence',         en: 'Convergence',            mg: 'Convergence' },
 arithmetic:   { fr: 'Arithmétique',         en: 'Arithmetic',            mg: 'Arithmétique' },
 geometric:   { fr: 'Géométrique',         en: 'Geometric',             mg: 'Géométrique' },
 firstTerms:   { fr: 'Premiers termes',       en: 'First terms',            mg: 'Voalohany terms' },
 // ── Parametric ──
 paramTitle:   { fr: 'Fonctions avec paramètre',   en: 'Functions with parameter',     mg: 'Asa misy paramètre' },
 animate:    { fr: 'Animer',            en: 'Animate',              mg: 'Hetsika' },
 stop:      { fr: 'Stop',             en: 'Stop',               mg: 'Ajanony' },
 // ── Handwriting ──
 hwTitle:    { fr: 'Écriture manuscrite',      en: 'Handwriting input',         mg: 'Soratana amin\'ny tanana' },
 drawHere:    { fr: 'Dessinez ici',         en: 'Draw here',             mg: 'Soraty eto' },
 hwHelp:     { fr: 'Dessinez puis touchez le symbole', en: 'Draw then tap the symbol',   mg: 'Soraty dia tsindrio ny marika' },
 // ── Scan ──
 scanTitle:   { fr: 'Scan de formule',        en: 'Formula scan',           mg: 'Scan formula' },
 typeFormula:   { fr: 'Recopier la formule',      en: 'Type the formula',         mg: 'Adikao ny formula' },
 quickTemplate: { fr: 'Modèle rapide',         en: 'Quick template',          mg: 'Modely haingana' },
 takePhoto:   { fr: 'Prendre une photo',       en: 'Take a photo',           mg: 'Maka sary' },
 convert:    { fr: 'Convertir',           en: 'Convert',              mg: 'Ovay' },
 preview:    { fr: 'Aperçu',             en: 'Preview',              mg: 'Topi-maso' },
 analyzeThis:  { fr: 'Analyser cette fonction',    en: 'Analyze this function',       mg: 'Diniho ity asa ity' },
 fillParams:   { fr: 'Remplissez les paramètres',   en: 'Fill the parameters',        mg: 'Fenoy ny paramètre' },
 // ── Compare ──
 compareTitle:  { fr: 'Comparer deux fonctions',    en: 'Compare two functions',       mg: 'Hampitahao asa roa' },
 intersections: { fr: 'Points d\'intersection',     en: 'Intersection points',        mg: 'Teboka fifampikasohana' },
 relPosition:  { fr: 'Position relative',       en: 'Relative position',         mg: 'Toerana mifandray' },
 compareFuncs:  { fr: 'Comparer les fonctions',     en: 'Compare functions',         mg: 'Hampitahao ny asa' },
 // ── Revision ──
 revTitle:    { fr: 'Fiches de révision',       en: 'Revision sheets',          mg: 'Taratasy famerenana' },
 derivatives:  { fr: 'Dérivées',            en: 'Derivatives',            mg: 'Dérivée' },
 usualLimits:  { fr: 'Limites',            en: 'Limits',               mg: 'Fetra' },
 primitives:   { fr: 'Primitives',           en: 'Antiderivatives',          mg: 'Primitive' },
 identities:   { fr: 'Identités',           en: 'Identities',             mg: 'Mombamomba' },
} as const;

type TKey = keyof typeof T;

export function t(key: TKey, lang: Lang): string {
 return T[key]?.[lang] || T[key]?.['fr'] || String(key);
}

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: 'fr', setLang: () => {} });

export function useLang() {
 return useContext(LangContext);
}
