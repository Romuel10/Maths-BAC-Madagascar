import type { BacSeries } from './bacSubjects.js';

export type BacToolId =
 | 'calculator' | 'algebra' | 'complex' | 'arithmetic' | 'sequence'
 | 'compare' | 'parametric' | 'geometry' | 'probability' | 'matrix'
 | 'ineqxy' | 'ode' | 'conics' | 'finance' | 'revision' | 'lessons' | 'units';

export type ProgramRelevance = 'core' | 'useful' | 'extra';

export interface ProgramChapter {
 id: string;
 title: string;
 series: BacSeries[];
 evidence: string;
}

export const BAC_PROGRAM_REFERENCE = {
 country: 'Madagascar',
 authority: 'Ministère de l’Éducation Nationale',
 schoolYear: '2024-2025',
 edition: 2024,
 series: ['A','C','D','L','OSE','S'] as const,
 note: 'Périmètre fondé sur les répartitions annuelles officielles MEN 2024-2025. Les outils complémentaires restent accessibles mais ne sont pas étiquetés comme programme.',
} as const;

export const PROGRAM_CHAPTERS: ProgramChapter[] = [
 {id:'analysis',title:'Analyse : fonctions, limites, continuité, dérivation, variations et représentation graphique',series:['A','C','D','L','OSE','S'],evidence:'Présent dans les répartitions annuelles officielles 2024-2025 des six séries.'},
 {id:'integral',title:'Primitives, intégrales et calculs d’aires',series:['A','C','D','OSE','S'],evidence:'Présent avec profondeur variable selon la série ; OSE inclut notamment intégration par parties, changement de variable affine, aire, valeur moyenne et volume de révolution.'},
 {id:'sequences',title:'Suites numériques : formes explicite/récurrente, variation, sommes et convergence',series:['A','C','D','L','OSE','S'],evidence:'Les suites figurent dans les programmes et/ou sujets de référence de ces séries ; L et OSE les détaillent explicitement dans la répartition 2024-2025.'},
 {id:'complex',title:'Nombres complexes : formes, module, argument, Moivre, Euler, racines et équations',series:['C','D','S'],evidence:'Présent dans les répartitions scientifiques 2024-2025.'},
 {id:'probability',title:'Probabilités, dénombrement, conditionnement, variables aléatoires et loi binomiale',series:['A','C','D','L','OSE','S'],evidence:'Présent selon un niveau différent dans les six séries ; L inclut dénombrement/probabilités, OSE et S vont jusqu’aux variables aléatoires et lois.'},
 {id:'statistics',title:'Statistiques à deux variables et ajustement affine',series:['A','D','L','OSE'],evidence:'A et L utilisent notamment la méthode de Mayer ; D et OSE utilisent les moindres carrés et le coefficient de corrélation.'},
 {id:'finance-ose',title:'Mathématiques financières : intérêts, escompte, actualisation, capitalisation et annuités',series:['OSE'],evidence:'Explicitement prévu en Terminale OSE 2024-2025.'},
 {id:'systems-l-ose',title:'Systèmes linéaires à trois inconnues',series:['D','L','OSE'],evidence:'L précise la méthode de Cramer ; D prévoit notamment Gauss ; OSE demande la résolution de systèmes à trois inconnues.'},
 {id:'matrix-s',title:'Calcul matriciel : somme, produit, déterminant, transposée, inverse, trace et puissances',series:['S'],evidence:'Explicitement prévu en Terminale S 2024-2025.'},
 {id:'arithmetic-cs',title:'Arithmétique : divisibilité, congruences, PGCD/PPCM, Bézout, Gauss et équations diophantiennes',series:['C','S'],evidence:'Présent dans les répartitions C/S 2024-2025 ; S inclut aussi ℤ/nℤ et bases de numération.'},
 {id:'ode-cs',title:'Équations différentielles du premier et du second ordre',series:['C','S'],evidence:'Explicitement prévues en Terminale C et S 2024-2025.'},
 {id:'conics-c',title:'Coniques : parabole, ellipse, hyperbole, équations réduites et tangentes',series:['C'],evidence:'Explicitement prévu en Terminale C 2024-2025.'},
 {id:'space',title:'Géométrie plane et dans l’espace',series:['C','D','S'],evidence:'Présente dans les séries scientifiques avec profondeur variable.'},
 {id:'continuous-laws-s',title:'Lois continues : densité, uniforme, exponentielle, centrée réduite et normale',series:['S'],evidence:'Explicitement prévues en Terminale S 2024-2025.'},
];

const TOOL_RELEVANCE: Record<BacToolId, Partial<Record<BacSeries, ProgramRelevance>>> = {
 calculator:{A:'core',C:'core',D:'core',L:'core',OSE:'core',S:'core'},
 algebra:{A:'core',C:'core',D:'core',L:'core',OSE:'core',S:'core'},
 complex:{A:'extra',C:'core',D:'core',L:'extra',OSE:'extra',S:'core'},
 arithmetic:{A:'extra',C:'core',D:'extra',L:'extra',OSE:'extra',S:'core'},
 sequence:{A:'core',C:'core',D:'core',L:'core',OSE:'core',S:'core'},
 compare:{A:'core',C:'core',D:'core',L:'core',OSE:'core',S:'core'},
 parametric:{A:'extra',C:'useful',D:'useful',L:'extra',OSE:'useful',S:'useful'},
 geometry:{A:'extra',C:'core',D:'core',L:'extra',OSE:'extra',S:'core'},
 probability:{A:'core',C:'core',D:'core',L:'core',OSE:'core',S:'core'},
 matrix:{A:'extra',C:'extra',D:'useful',L:'useful',OSE:'useful',S:'core'},
 ineqxy:{A:'core',C:'useful',D:'useful',L:'extra',OSE:'extra',S:'useful'},
 ode:{A:'extra',C:'core',D:'extra',L:'extra',OSE:'extra',S:'core'},
 conics:{A:'extra',C:'core',D:'extra',L:'extra',OSE:'extra',S:'extra'},
 finance:{A:'extra',C:'extra',D:'extra',L:'extra',OSE:'core',S:'extra'},
 revision:{A:'core',C:'core',D:'core',L:'core',OSE:'core',S:'core'},
 lessons:{A:'core',C:'core',D:'core',L:'core',OSE:'core',S:'core'},
 units:{A:'useful',C:'useful',D:'useful',L:'useful',OSE:'useful',S:'useful'},
};

export function toolRelevance(tool: BacToolId, series: BacSeries | null): ProgramRelevance | null {
 if(!series) return null;
 return TOOL_RELEVANCE[tool][series] ?? 'extra';
}

export function toolProgramBadge(tool: BacToolId, series: BacSeries | null): {label:string; tone:'success'|'info'|'muted'} | null {
 const relevance=toolRelevance(tool,series);
 if(relevance===null)return null;
 if(relevance==='core')return{label:`Programme série ${series}`,tone:'success'};
 if(relevance==='useful')return{label:`Utile série ${series}`,tone:'info'};
 return{label:'Complément',tone:'muted'};
}

export function chaptersForSeries(series: BacSeries): ProgramChapter[] {
 return PROGRAM_CHAPTERS.filter(chapter=>chapter.series.includes(series));
}
