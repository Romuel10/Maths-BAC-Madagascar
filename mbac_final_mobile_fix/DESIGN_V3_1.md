# Refonte visuelle V3.1

Cette refonte ne dépend d'aucune image générée ni d'aucune ressource graphique externe.

## Direction visuelle

L'interface reprend les codes d'un cahier de révision et d'une copie d'examen : surfaces sobres, marges nettes, typographie dense mais lisible, rouge comme repère principal et vert pour les validations.

## Thèmes

Les couleurs principales sont centralisées dans `src/index.css` avec des variables CSS (`--surface`, `--text`, `--muted`, `--brand`, etc.). Le mode clair et le mode sombre définissent chacun leurs propres valeurs. Les pages BAC ne choisissent donc plus manuellement `text-white` ou `text-slate-900` pour chaque texte.

Les anciens calculateurs, qui contiennent encore beaucoup de couleurs Tailwind historiques, sont volontairement affichés dans le composant visuel `math-lab` à fond sombre. Cela empêche les anciens textes blancs de devenir invisibles en mode clair tout en évitant de réécrire le moteur fonctionnel.

## Fichiers principaux modifiés

- `src/index.css`
- `src/lib/theme.ts`
- `src/App.tsx`
- `src/components/BacHome.tsx`
- `src/components/BacLibrary.tsx`
- `src/components/BacGuidedSolver.tsx`
- `src/components/BacExamSession.tsx`
- `src/components/BacTutor.tsx`
- `src/components/BacProgressDashboard.tsx`
