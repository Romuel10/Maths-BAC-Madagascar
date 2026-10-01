import type { BacSeries } from './bacSubjects.js';

export type BacToolId =
 | 'calculator' | 'algebra' | 'complex' | 'arithmetic' | 'sequence'
 | 'compare' | 'parametric' | 'geometry' | 'probability' | 'matrix'
 | 'ineqxy' | 'ode' | 'conics' | 'revision' | 'lessons' | 'units';

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
 note: 'Périmètre de travail fondé sur les répartitions annuelles officielles 2024-2025, complété par la structure observée dans des sujets de BAC malgaches récents.',
} as const;

export const PROGRAM_CHAPTERS: ProgramChapter[] = [
 {id:'analysis',title:'Analyse : limites, continuité, dérivation, variations, asymptotes, primitives et intégrales',series:['C','D','S'],evidence:'Présent dans les répartitions annuelles 2024-2025 des séries C, D et S.'},
 {id:'sequences',title:'Suites numériques : récurrence, monotonie, bornes et convergence',series:['C','D','S'],evidence:'Présent dans les répartitions annuelles 2024-2025 des séries C, D et S.'},
 {id:'complex',title:'Nombres complexes : formes, module, argument, Moivre, Euler, racines et équations',series:['C','D','S'],evidence:'Présent dans les répartitions annuelles 2024-2025 des séries C, D et S.'},
 {id:'probability',title:'Probabilités, dénombrement, variables aléatoires et lois',series:['C','D','S'],evidence:'Présent dans les répartitions annuelles 2024-2025 ; les contenus diffèrent selon la série.'},
 {id:'statistics-d',title:'Statistique à deux variables, ajustement affine et corrélation',series:['D'],evidence:'Explicitement prévu en Terminale D 2024-2025.'},
 {id:'matrix-s',title:'Matrices : opérations, déterminant, transposée, inverse, trace et puissances',series:['S'],evidence:'Explicitement prévu en Terminale S 2024-2025, matrices carrées jusqu’à l’ordre 4.'},
 {id:'arithmetic-cs',title:'Arithmétique : Euclide, Bézout, Gauss, congruences et équations diophantiennes',series:['C','S'],evidence:'Arithmétique explicitement prévue en Terminale C et S ; les équations diophantiennes figurent en S.'},
 {id:'ode-cs',title:'Équations différentielles linéaires à coefficients constants',series:['C','S'],evidence:'Équations du premier et du second ordre explicitement prévues en Terminale C et S 2024-2025.'},
 {id:'conics-c',title:'Coniques : parabole, ellipse, hyperbole, équations réduites et tangentes',series:['C'],evidence:'Explicitement prévu en Terminale C 2024-2025.'},
 {id:'space',title:'Géométrie dans l’espace',series:['C','D','S'],evidence:'Présente dans le programme scientifique, avec profondeur variable selon la série.'},
 {id:'continuous-laws-s',title:'Lois continues : uniforme, exponentielle et normale',series:['S'],evidence:'Explicitement prévues en Terminale S 2024-2025.'},
];

const TOOL_RELEVANCE: Record<BacToolId, Partial<Record<BacSeries, ProgramRelevance>>> = {
 calculator:{A:'core',C:'core',D:'core',S:'core'},
 algebra:{A:'core',C:'core',D:'core',S:'core'},
 complex:{C:'core',D:'core',S:'core',A:'extra'},
 arithmetic:{C:'core',S:'core',D:'useful',A:'extra'},
 sequence:{C:'core',D:'core',S:'core',A:'useful'},
 compare:{A:'useful',C:'core',D:'core',S:'core'},
 parametric:{C:'useful',D:'useful',S:'useful',A:'extra'},
 geometry:{A:'useful',C:'core',D:'core',S:'core'},
 probability:{A:'core',C:'core',D:'core',S:'core'},
 matrix:{S:'core',D:'useful',C:'extra',A:'extra'},
 ineqxy:{A:'extra',C:'useful',D:'useful',S:'useful'},
 ode:{C:'core',S:'core',D:'extra',A:'extra'},
 conics:{C:'core',S:'extra',D:'extra',A:'extra'},
 revision:{A:'core',C:'core',D:'core',S:'core'},
 lessons:{A:'core',C:'core',D:'core',S:'core'},
 units:{A:'useful',C:'useful',D:'useful',S:'useful'},
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
