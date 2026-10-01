import type { BacSeries } from './bacSubjects';

export type ArchiveTrust = 'verified-archive' | 'catalogued' | 'secondary';
export type CorrectionScope = 'full' | 'partial' | 'problem' | 'catalogued' | 'none';

export interface OfficialAnnaleRecord {
 id: string;
 series: BacSeries;
 year: number;
 title: string;
 subjectUrl: string;
 archiveUrl?: string;
 sourceName: string;
 correctionAvailable: boolean;
 correctionScope?: CorrectionScope;
 trust: ArchiveTrust;
 note: string;
}

const LECHAYA = 'https://www.lechaya.com/madagascar/bac/math';
const EDUCMAD: Partial<Record<BacSeries, string>> = {
 A: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=817',
 C: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=129',
 D: 'https://mediatheque.accesmad.org/educmad/course/view.php?id=816',
};

const lechayaSlug = (series: BacSeries, year: number) =>
 `https://www.lechaya.com/madagascar/subjects/madagascar-bac-${series.toLowerCase()}-math-${year}`;

const lechayaRows: Array<[BacSeries, number, boolean]> = [
 ['A', 2023, true], ['C', 2023, true], ['D', 2023, true],
 ['A', 2022, true], ['C', 2022, true], ['D', 2022, true],
 ['A', 2021, false], ['C', 2021, false], ['D', 2021, false],
 ['A', 2020, true], ['C', 2020, true], ['D', 2020, false],
 ['A', 2019, false], ['C', 2019, false], ['D', 2019, false],
 ['C', 2018, true], ['D', 2018, true],
 ['A', 2017, false], ['C', 2017, true], ['D', 2017, true],
 ['A', 2016, true], ['C', 2016, true], ['D', 2016, true],
 ['A', 2015, true], ['C', 2015, true], ['D', 2015, true],
 ['A', 2014, true], ['D', 2014, true],
];

const archiveAnnales: OfficialAnnaleRecord[] = lechayaRows.map(([series, year, catalogueCorrection]) => {
  const recent = year >= 2022;
  let correctionAvailable = catalogueCorrection;
  let correctionScope: CorrectionScope = catalogueCorrection ? 'catalogued' : 'none';
  let trust: ArchiveTrust = recent ? 'verified-archive' : 'catalogued';
  let note = recent
   ? 'Annale repérée dans les archives éducatives Madagascar et recoupée dans un catalogue d’annales.'
   : 'Annale cataloguée ; la source EDUCMAD permet de retrouver l’énoncé par série et année.';

  // V3.6 : préciser ce qui est réellement confirmé dans EDUCMAD pour 2022/2023.
  if (series === 'D' && (year === 2022 || year === 2023)) {
   correctionAvailable = true;
   correctionScope = 'problem';
   note = `Énoncé D ${year} référencé dans EDUCMAD ; un corrigé du problème est également catalogué. La correction complète de tous les exercices n’est pas présumée.`;
  }
  if (series === 'C' && (year === 2022 || year === 2023)) {
   correctionAvailable = false;
   correctionScope = 'none';
   note = `Énoncé C ${year} référencé dans EDUCMAD. Aucun corrigé ${year} n’a été confirmé dans la section de correction consultée.`;
  }
  if (series === 'A' && year === 2022) {
   correctionAvailable = true;
   correctionScope = 'partial';
   note = 'Énoncé A 2022 référencé dans EDUCMAD ; des corrigés partiels 2022 sont catalogués.';
  }
  if (series === 'A' && year === 2023) {
   correctionAvailable = true;
   correctionScope = 'partial';
   trust = 'catalogued';
   note = 'Des corrigés A 2023 sont catalogués dans EDUCMAD, mais l’énoncé A 2023 n’apparaît pas dans la section d’énoncés consultée. Référence à vérifier avant usage comme sujet officiel.';
  }

  return {
   id: `mg-${series.toLowerCase()}-${year}`,
   series,
   year,
   title: `BAC Madagascar ${year} — Série ${series} — Mathématiques`,
   subjectUrl: lechayaSlug(series, year),
   archiveUrl: EDUCMAD[series],
   sourceName: 'LeChaya + archive EDUCMAD',
   correctionAvailable,
   correctionScope,
   trust,
   note,
  };
 });

const secondaryAnnales: OfficialAnnaleRecord[] = [
 {
  id: 'mg-l-2025-secondary', series: 'L', year: 2025,
  title: 'BAC Madagascar 2025 — Série L — Mathématiques',
  subjectUrl: 'https://fr.scribd.com/document/898640111/MATHEMATIQUES-TL-2025-Madagascar',
  sourceName: 'Copie communautaire 2025', correctionAvailable: false, trust: 'secondary',
  note: 'Sujet Série L 2025 repéré sur une source secondaire. Il sert à recouper les thèmes, mais n’est pas présenté comme archive officielle vérifiée.'
 },

 {
  id: 'mg-a-2025-secondary', series: 'A', year: 2025,
  title: 'BAC Madagascar 2025 — Série A — Mathématiques',
  subjectUrl: 'https://fr.scribd.com/document/898636635/Mathematiques-TA-2025-Madagascar',
  sourceName: 'Copie communautaire 2025', correctionAvailable: false, trust: 'secondary',
  note: 'Sujet récent repéré sur une source secondaire. À utiliser comme référence de consultation, pas comme base de correction automatique sans contrôle humain.'
 },
 {
  id: 'mg-c-2025-secondary', series: 'C', year: 2025,
  title: 'BAC Madagascar 2025 — Série C — Mathématiques',
  subjectUrl: 'https://www.scribd.com/document/898647514/Mathematiques-Tc-2025-Madagascar',
  sourceName: 'Copie communautaire 2025', correctionAvailable: false, trust: 'secondary',
  note: 'Sujet récent repéré sur une source secondaire. À utiliser comme référence de consultation, pas comme base de correction automatique sans contrôle humain.'
 },
 {
  id: 'mg-d-2025-secondary', series: 'D', year: 2025,
  title: 'BAC Madagascar 2025 — Série D — Mathématiques',
  subjectUrl: 'https://fr.scribd.com/document/898638410/Mathematiques-Td-2025-Madagascar',
  sourceName: 'Copie communautaire 2025', correctionAvailable: false, trust: 'secondary',
  note: 'Sujet récent repéré sur une source secondaire. À utiliser comme référence de consultation, pas comme base de correction automatique sans contrôle humain.'
 },
];

export const OFFICIAL_ANNALES: OfficialAnnaleRecord[] = [...archiveAnnales, ...secondaryAnnales]
 .sort((a, b) => b.year - a.year || a.series.localeCompare(b.series));

export const OFFICIAL_ARCHIVE_SOURCES = {
 educmadA: EDUCMAD.A,
 educmadC: EDUCMAD.C,
 educmadD: EDUCMAD.D,
 terminaleLProgramme: 'https://www.education.gov.mg/wp-content/uploads/2024/09/RAPE-T12-L_2024_2025.pdf',
 terminaleOSEProgramme: 'https://www.education.gov.mg/wp-content/uploads/2024/09/RAPE-T12-OSE_2024_2025.pdf',
 terminaleSProgramme: 'https://www.education.gov.mg/wp-content/uploads/2024/09/RAPE-T12-S_2024_2025.pdf',
 lechaya: LECHAYA,
 ministryProgramme: 'https://www.education.gov.mg/systeme-educatif/lycee/',
};

export function annalesForSeries(series: BacSeries): OfficialAnnaleRecord[] {
 return OFFICIAL_ANNALES.filter(item => item.series === series);
}

export function trustLabel(trust: ArchiveTrust): string {
 if (trust === 'verified-archive') return 'Archive recoupée';
 if (trust === 'catalogued') return 'Annale cataloguée';
 return 'Source secondaire';
}
