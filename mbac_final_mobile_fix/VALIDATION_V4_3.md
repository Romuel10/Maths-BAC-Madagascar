# Validation V4.3

- Le chemin réellement utilisé par l'écran Outils > Analyse a été vérifié : `App.tsx` -> `StepByStep.tsx`, `InteractiveGraph.tsx`, `IntegralCalculator.tsx`.
- Le bug de `ParenthesisNode` du normaliseur rationnel a été corrigé dans `mathEngine.ts`.
- Un moteur exact de dérivation rationnelle a été ajouté avant le fallback symbolique général.
- Référence indépendante SymPy utilisée pour le cas de régression :
  - `(x^2-1)/(x-2)` -> dérivée `(x^2-4x+1)/(x-2)^2`
  - dérivée seconde `6/(x-2)^3`
  - `∫_0^2 x^2 dx = 8/3`
- Les fichiers TypeScript/TSX sont transpilés syntaxiquement avec le compilateur TypeScript disponible dans l'environnement.
- Le projet ne contient ni `node_modules` ni `dist`.
