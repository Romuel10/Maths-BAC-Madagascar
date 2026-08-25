# Maths BAC Madagascar — V4.5

Cette version transforme l'ancien MathSolver Pro en application centrée sur les mathématiques du Baccalauréat à Madagascar. La V3.1 ajoute une refonte complète de l’interface et des thèmes clair/sombre.

## Fonctionnalités principales

- Accueil BAC Madagascar.
- Séries A, C et D.
- Corpus original d'entraînement type BAC intégré hors ligne.
- Résolution guidée : réponse de l'élève, vérification, indices progressifs, méthode, correction finale.
- Mode examen chronométré sans aide, avec note estimative /20.
- Progression locale par chapitre et historique des examens blancs.
- Assistant méthodologique pour un énoncé recopié.
- Photo d'un sujet avec transcription manuelle clairement indiquée (pas de faux OCR).
- Anciens outils conservés : fonctions, complexes, matrices, probabilités, suites, géométrie, arithmétique, etc.
- PWA avec chemins relatifs compatibles avec un sous-dossier GitHub Pages.

## Design V3.1

- Design original intégré directement en CSS et React : aucune image générée n’est nécessaire.
- Mode clair inspiré d’une copie/cahier de révision : papier ivoire, encre sombre, contraste élevé.
- Mode sombre dédié : fond encre/ardoise, textes crème et secondaires suffisamment contrastés.
- Rouge discret comme couleur principale, vert pour les réussites et états validés.
- Navigation et icônes principales en SVG intégrés au code, sans bibliothèque d’icônes supplémentaire.
- Les anciens outils mathématiques sont regroupés dans un « laboratoire » sombre volontaire afin que leurs composants historiques restent lisibles dans les deux thèmes.
- Les nouvelles pages BAC utilisent des variables sémantiques de thème afin d’éviter les textes blancs sur fond clair ou sombres sur fond sombre.

## Important sur les sujets

Les sujets guidés inclus dans `src/data/bacSubjects.ts` sont des sujets originaux d'entraînement de type BAC. Ils ne sont pas présentés comme des sujets officiels.

L'application contient aussi un index d'annales réelles avec des liens vers des ressources éducatives en ligne. Pour intégrer mot pour mot des sujets officiels dans le corpus guidé, ajoutez uniquement des documents que vous êtes autorisé à redistribuer ou fournissez vos propres PDF.

## Test sous Termux

Dans Termux, le projet doit être placé dans le répertoire interne de Termux (par exemple `~/maths-bac-mg`) et non directement dans `/storage/emulated/0`, afin d'éviter les problèmes de `npm` et de liens symboliques.

```bash
pkg update
pkg install nodejs-lts
cd ~/maths-bac-mg
npm install
npm run dev -- --host 0.0.0.0
```

Pour produire la version finale :

```bash
npm run build
```

Le résultat se trouve dans `dist/`.

## Activation

La porte d'activation locale est désactivée par défaut. Voir `.env.example`.
Pour une vraie gestion de licences/utilisateurs, utiliser Firebase, Supabase ou une API serveur : un code secret stocké dans React peut toujours être extrait.

## Affichage mathématique V3.2

La V3.2 affiche les expressions comme sur une copie de mathématiques : fractions verticales, exposants, racines, fonctions usuelles et symboles mathématiques. La syntaxe de calcul (`^`, `/`, `sqrt(...)`, `**`) reste uniquement utilisée en interne quand le moteur en a besoin.

Le rendu utilise **KaTeX**, installé automatiquement avec `npm install`. Dans Termux, gardez le projet dans le dossier HOME (`~/maths-bac-madagascar`) avant de lancer npm.


## Fiabilité des calculs — V3.4

La V3.4 distingue explicitement trois niveaux dans les outils :

- **Vérifié** : résultat exact ou contrôlé par une seconde méthode (substitution, identité, recalcul, produit de contrôle, etc.).
- **Approché mais contrôlé** : calcul numérique avec intervalle/marge clairement affichés.
- **À contrôler** : les données sont insuffisantes, hors domaine, instables ou la méthode automatique ne permet pas une conclusion sûre. L’application préfère alors ne pas inventer de résultat.

Améliorations principales : résolution exacte des équations du premier/deuxième degré avec discriminant et substitution ; intégration numérique avec contrôle de domaine et estimation d’erreur ; dérivées contrôlées numériquement ; limites numériques volontairement conservatrices ; matrices sans arrondi intermédiaire et inverse vérifiée par `A × A⁻¹ ≈ I` ; complexes avec contrôles par substitution ; combinatoire entière exacte ; statistiques avec validation stricte des données ; inéquations et analyses numériques affichant toujours leur vraie fenêtre d’étude.

Les corrections guidées BAC affichent désormais les **étapes de référence une par une**, puis la réponse finale. Les valeurs approchées restent présentées comme telles : une observation numérique sur un intervalle n’est jamais annoncée comme une preuve globale.

## V3.4 — Moteur pédagogique

La résolution guidée inclut maintenant un atelier ligne par ligne avec trois niveaux d'aide, un clavier mathématique visuel, des diagnostics d'erreurs fréquentes et des tableaux de signes/variations plus proches d'une correction BAC. Voir `PEDAGOGY_V3_4.md`.

## V3.5 — Annales BAC Madagascar

La page `Sujets` contient maintenant une bibliothèque d'annales réelles référencées pour les séries A, C et D, avec année, provenance, présence éventuelle d'un corrigé et niveau de confiance. Les annales externes restent liées à leur source ; seules les corrections encodées et testées dans l'application sont présentées comme corrections guidées fiables. Voir `ANNALES_V3_5.md`.


## V3.6 — Parcours annales 2022–2023

La page `Sujets` contient désormais un espace de travail dédié aux annales 2022 et 2023. Il indique précisément le niveau de preuve disponible pour l’énoncé et le corrigé, propose une checklist de copie, mémorise la question en cours et conserve un journal d’erreurs hors ligne. Voir `PARCOURS_ANNALES_V3_6.md`.

## V3.7 — Annales hors ligne structurées

- Ajout manuel d’un sujet ou d’une question depuis un PDF/scan contrôlé par l’utilisateur.
- Stockage uniquement dans `localStorage` : aucun serveur requis.
- Import/export JSON pour transférer les annales entre appareils.
- Lien direct d’une question locale vers l’assistant V4.
- Les contenus ajoutés localement restent marqués « à vérifier avec la source ».

## V3.8 — Progression intelligente

- File automatique « À refaire » après une réponse fausse.
- Favoris par question.
- Journal des erreurs détectées dans l’atelier pédagogique.
- Recommandations basées d’abord sur les erreurs, puis sur les chapitres les moins maîtrisés.
- Compteur de jours d’étude consécutifs.

## V3.9 — Mode examen complet

- Sauvegarde automatique d’une épreuve en cours.
- Reprise d’un examen interrompu.
- Palette de navigation entre les questions.
- Questions marquées « à revoir ».
- Chronomètre visible et remise automatique à 0 seconde.
- Note /20, détail par chapitre et correction après remise.

## V4.0 — Assistant de résolution unifié

L’assistant propose quatre usages : **Comprendre**, **Commencer**, **Vérifier** et **Plan**.

- Détection locale du chapitre à partir de l’énoncé recopié.
- Questions à se poser avant de calculer.
- Plan de résolution adapté au chapitre.
- Vérification de deux lignes de calcul par le moteur pédagogique V3.4.
- Photo du sujet conservée localement, sans faux OCR : l’élève doit confirmer la transcription avant analyse.
- Aperçu mathématique avant l’envoi d’une expression vers l’analyseur.

### Principe de fiabilité V4

L’application ne transforme jamais silencieusement une photo en formule. Une expression transcrite depuis une photo doit être confirmée par l’élève. Une transformation non prouvée par le moteur reste « à contrôler » et n’est jamais marquée correcte par défaut.


## V4.1 — Refonte visuelle complète

- Design académique unifié sur tous les écrans.
- Suppression des emojis de l’interface.
- Modes clair et sombre basés sur les mêmes variables sémantiques.
- Calculatrice scientifique et analyse de fonction entièrement réorganisées.
- Anciens calculateurs harmonisés par le système de thème global.
- Outils regroupés par familles : calcul/algèbre, analyse, géométrie/données, révision/utilitaires.
- Claviers mathématiques simplifiés : nombres, fonctions, opérateurs, actions et validation.
- Formules mises en avant sur des zones de lecture dédiées, avec KaTeX.
- Aucun visuel externe ou image générée n’est utilisé pour cette refonte.


## V4.4 — Moteur de dérivation réécrit et audité

Le système de dérivation historique a été retiré du chemin principal. La V4.4 utilise désormais un moteur symbolique déterministe unique (`src/lib/derivativeEngine.ts`) pour calculer la dérivée première, la dérivée seconde et les étapes pédagogiques. La même expression est donc utilisée pour la réponse et pour la méthode montrée à l’élève.

Familles prises en charge : polynômes, sommes/différences, produits, quotients, puissances entières/négatives/fractionnaires, racines, exponentielles, logarithmes, sinus, cosinus, tangente et compositions. Les conditions de validité importantes sont affichées pour `log`, `sqrt`, `tan`, les puissances générales et la valeur absolue.

Audit livré avec la version : 46 cas de référence + 120 cas aléatoires, soit **980 contrôles numériques de f' et 980 de f'' (1 960 au total), 0 échec**. Les 46 cas de référence ont en plus été comparés symboliquement à SymPy pour f' et f'', soit **92 comparaisons symboliques, 0 divergence**.

Après `npm install`, le test permanent peut être relancé avec :

```bash
npm run test:derivatives
```

Voir `DERIVATIVE_AUDIT_V4_4.md` et `VALIDATION_V4_4.md`.


## V4.5 — Audit mathématique complet

La V4.5 applique aux autres outils la même méthode que la réécriture du moteur de dérivation V4.4 : un moteur testable par domaine, une distinction stricte entre calcul exact et approximation, puis un contrôle indépendant lorsque c’est possible.

Moteurs audités ou réécrits : équations, inéquations, polynômes et fractions rationnelles, primitives/intégrales, limites, suites, matrices, nombres complexes, probabilités/statistiques, géométrie, arithmétique, conversions d’unités, calculatrice scientifique et chemins de calcul utilisés par le graphique.

Principes de sécurité :

- une conclusion exacte n’est affichée que si elle peut être démontrée par le moteur concerné ;
- une recherche numérique est toujours présentée comme locale/approchée ;
- si le domaine d’une intégrale numérique ne peut pas être certifié sur tout l’intervalle, le calcul est refusé plutôt que de traverser silencieusement une singularité ;
- les simplifications rationnelles conservent les valeurs interdites ;
- les suites ne transforment plus l’observation de quelques termes en preuve globale ;
- les graphiques servent à visualiser, jamais à prouver un résultat.

Tests permanents disponibles après extraction :

```bash
npm run test:all-math
```

Cette batterie pure (sans dépendre de MathJS à l’exécution) effectue **5 414 contrôles automatiques** sur les moteurs audités et doit finir avec **0 échec**.

Après `npm install`, le test d’intégration peut aussi être lancé :

```bash
npm run test:integration
```

Il vérifie les chemins complets utilisant MathJS, notamment calculatrice, analyse de fonction, équations, intégrales, limites et suites. Pour tout lancer :

```bash
npm run test:full
```

Voir `MATH_AUDIT_V4_5.md` et `VALIDATION_V4_5.md`.
