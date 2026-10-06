# Corrections de l’audit — v1.0.2

Cette version corrige les 20 anomalies de l’audit du 6 octobre 2026.

| Référence | Comportement corrigé |
| --- | --- |
| B01 | Les solutions isolées des inéquations sont comparées aux bornes numériques. |
| B02 | Le correcteur respecte la portée de l’exposant dans `e^x+1`. |
| B03 | Les coefficients non nuls sont conservés, même à l’échelle `10^-15`. |
| B04 | Les calculs de grands entiers utilisent une représentation exacte. |
| B05 | Les expressions sans domaine réel sont refusées ; `log10`, `asin`, `acos` et `atan` sont analysées avec leurs restrictions. |
| B06 | Les puissances rationnelles d’indice impair acceptent les bases négatives, pour le graphe, la parité et les variations. |
| B07 | Le signe d’une petite dérivée non nulle détermine correctement la variation. |
| B08 | Les points où la formule de dérivée est indéfinie découpent les variations de `abs(x)` et des racines. |
| B09 | Une petite valeur ne suffit plus à annoncer un zéro ; les identités trigonométriques donnent les racines et leur multiplicité. |
| B10 | Le parseur conserve la notation scientifique, notamment `1e-9*x`. |
| B11 | La vérification des équations compare leurs ensembles de solutions lorsque ceux-ci sont déterminés exactement. |
| B12 | Les champs de six calculateurs gardent leur identité et le focus pendant la frappe. |
| B13 | Modifier un paramètre efface le résultat calculé avec les anciennes données. |
| B14 | Les annales locales acceptent et conservent les six séries A/C/D/L/OSE/S. |
| B15 | Le tuteur retrouve l’énoncé complet, le mode, la méthode et les étapes déjà dévoilées. |
| B16 | Les libellés de résultats ont un fond et une couleur distincts en thème clair et sombre. |
| B17 | Les titres, boutons et libellés utilisent des unités relatives pour suivre le réglage de taille du texte. |
| B18 | Le cache hors connexion n’est installé que si tous les modules sont disponibles. Une installation interrompue se signale et peut être relancée. |
| B19 | La simulation sauvegarde son brouillon immédiatement avant fermeture, changement de page ou passage en arrière-plan. |
| B20 | L’affichage respecte les limites des exposants et les parenthèses des racines imbriquées. |

KaTeX est mis à jour vers 0.19.0. Le chemin TypeScript utilise une cible relative sans `baseUrl`, compatible avec les nouveaux compilateurs. La version Android est 1.0.2, code 702.

## Validation reproductible

- `npm ci`
- `npm audit --audit-level=low`
- `npm run test:full` : compilation TypeScript, suites existantes, nouveaux scénarios de l’audit et construction web.
- `npm run test:ui` : parcours réels dans Chromium, thèmes, saisie, sauvegarde et interruption du téléchargement hors connexion.
- Workflow GitHub `Validation et Android` : tests JVM, APK debug, compilation des tests instrumentés et AAB non signé.

Les tests instrumentés sont compilés par la CI ; leur exécution sur un appareil Android reste distincte. Le bundle signé nécessite les secrets de signature existants.
