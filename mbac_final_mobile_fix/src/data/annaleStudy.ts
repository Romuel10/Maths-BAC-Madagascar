import type { BacSeries } from './bacSubjects';

export type SubjectEvidence = 'verified' | 'catalogued' | 'not-confirmed';
export type CorrectionEvidence = 'full' | 'partial' | 'problem' | 'catalogued' | 'not-confirmed';

export interface AnnaleStudyPack {
 id: string;
 series: BacSeries;
 year: 2022 | 2023;
 title: string;
 subjectEvidence: SubjectEvidence;
 correctionEvidence: CorrectionEvidence;
 subjectUrl: string;
 correctionUrl?: string;
 sourceLabel: string;
 evidenceNote: string;
 workflow: Array<{ title: string; detail: string }>;
 checkpoints: string[];
}

const SOURCES: Record<BacSeries, string> = {
 A: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=817',
 C: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=129',
 D: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=816',
};

const CORRECTIONS: Record<BacSeries, string> = {
 A: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=817&section=2',
 C: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=129&section=2',
 D: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=816&section=2',
};

const commonWorkflow = [
 { title: 'Lire sans calculer', detail: 'Repère les données, les verbes de consigne et les résultats à démontrer avant de commencer.' },
 { title: 'Résoudre sur brouillon', detail: 'Travaille d’abord sans correction. Écris chaque transformation sur une ligne séparée.' },
 { title: 'Vérifier les calculs', detail: 'Utilise les outils de l’application pour contrôler une dérivée, une équation, une probabilité ou un calcul numérique.' },
 { title: 'Comparer avec la source', detail: 'Consulte uniquement le corrigé réellement disponible pour cette annale. Ne considère pas une correction partielle comme une correction complète.' },
 { title: 'Refaire les erreurs', detail: 'Note les erreurs de méthode et recommence la question sans regarder la correction.' },
];

const commonCheckpoints = [
 'J’ai écrit les hypothèses et le domaine avant les calculs.',
 'J’ai gardé les valeurs exactes avant d’arrondir.',
 'J’ai vérifié les solutions dans l’équation de départ.',
 'J’ai justifié les signes, variations ou probabilités annoncés.',
 'J’ai distingué une preuve exacte d’une approximation numérique.',
];

export const ANNALE_STUDY_PACKS: AnnaleStudyPack[] = [
 {
  id: 'study-a-2023', series: 'A', year: 2023,
  title: 'Parcours annale 2023 · Série A',
  subjectEvidence: 'not-confirmed', correctionEvidence: 'partial',
  subjectUrl: SOURCES.A, correctionUrl: CORRECTIONS.A,
  sourceLabel: 'EDUCMAD / ACCESMAD',
  evidenceNote: 'Des corrigés d’exercices et de problème 2023 sont catalogués, mais l’énoncé A 2023 n’apparaît pas dans la section d’énoncés consultée. Le parcours évite donc de présenter un texte non confirmé comme sujet officiel.',
  workflow: commonWorkflow, checkpoints: commonCheckpoints,
 },
 {
  id: 'study-c-2023', series: 'C', year: 2023,
  title: 'Parcours annale 2023 · Série C',
  subjectEvidence: 'verified', correctionEvidence: 'not-confirmed',
  subjectUrl: SOURCES.C,
  sourceLabel: 'EDUCMAD / ACCESMAD',
  evidenceNote: 'L’énoncé Mathématiques série C 2023 est référencé dans l’archive EDUCMAD. Aucun corrigé 2023 n’a été confirmé dans la section de correction consultée ; l’application ne fabrique donc pas de correction officielle.',
  workflow: commonWorkflow, checkpoints: commonCheckpoints,
 },
 {
  id: 'study-d-2023', series: 'D', year: 2023,
  title: 'Parcours annale 2023 · Série D',
  subjectEvidence: 'verified', correctionEvidence: 'problem',
  subjectUrl: SOURCES.D, correctionUrl: CORRECTIONS.D,
  sourceLabel: 'EDUCMAD / ACCESMAD',
  evidenceNote: 'L’énoncé D 2023 est référencé et EDUCMAD catalogue un corrigé du problème 2023. Cela ne signifie pas que tous les exercices disposent d’un corrigé officiel complet.',
  workflow: commonWorkflow, checkpoints: commonCheckpoints,
 },
 {
  id: 'study-a-2022', series: 'A', year: 2022,
  title: 'Parcours annale 2022 · Série A',
  subjectEvidence: 'verified', correctionEvidence: 'partial',
  subjectUrl: SOURCES.A, correctionUrl: CORRECTIONS.A,
  sourceLabel: 'EDUCMAD / ACCESMAD',
  evidenceNote: 'L’énoncé A 2022 est référencé. La section correction catalogue notamment un problème et un exercice 2 pour 2022 : la couverture est donc partielle.',
  workflow: commonWorkflow, checkpoints: commonCheckpoints,
 },
 {
  id: 'study-c-2022', series: 'C', year: 2022,
  title: 'Parcours annale 2022 · Série C',
  subjectEvidence: 'verified', correctionEvidence: 'not-confirmed',
  subjectUrl: SOURCES.C,
  sourceLabel: 'EDUCMAD / ACCESMAD',
  evidenceNote: 'L’énoncé Mathématiques série C 2022 est référencé dans EDUCMAD. Aucun corrigé 2022 n’a été confirmé dans la section de correction consultée.',
  workflow: commonWorkflow, checkpoints: commonCheckpoints,
 },
 {
  id: 'study-d-2022', series: 'D', year: 2022,
  title: 'Parcours annale 2022 · Série D',
  subjectEvidence: 'verified', correctionEvidence: 'problem',
  subjectUrl: SOURCES.D, correctionUrl: CORRECTIONS.D,
  sourceLabel: 'EDUCMAD / ACCESMAD',
  evidenceNote: 'L’énoncé D 2022 est référencé et EDUCMAD catalogue un corrigé du problème 2022. Les autres parties ne sont pas présentées comme corrigées si elles ne sont pas confirmées.',
  workflow: commonWorkflow, checkpoints: commonCheckpoints,
 },
];

export function studyPacksForSeries(series: BacSeries): AnnaleStudyPack[] {
 return ANNALE_STUDY_PACKS.filter(pack => pack.series === series).sort((a, b) => b.year - a.year);
}

export function subjectEvidenceLabel(value: SubjectEvidence): string {
 if (value === 'verified') return 'Énoncé référencé';
 if (value === 'catalogued') return 'Énoncé catalogué';
 return 'Énoncé non confirmé';
}

export function correctionEvidenceLabel(value: CorrectionEvidence): string {
 if (value === 'full') return 'Corrigé complet';
 if (value === 'problem') return 'Corrigé du problème';
 if (value === 'partial') return 'Corrigé partiel';
 if (value === 'catalogued') return 'Corrigé catalogué';
 return 'Corrigé non confirmé';
}
