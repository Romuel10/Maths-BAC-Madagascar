## V4.5.1 — Correctif tests d'intégration

- Corrige l'attente erronée du test `1/(x-2)=0` : l'absence de solution est bien une conclusion exacte et vérifiée.
- Corrige une faute de variable dans le test de `sin(x)>0` (`iq.quality` au lieu de `iqGen.quality`).
- Ajoute `scope` et `proof` aux résultats d'inéquations pour distinguer explicitement une preuve sur ℝ d'une étude numérique limitée à une fenêtre.
- L'interface des inéquations numériques n'affiche plus un ensemble solution comme s'il était global.
- Ajoute ces deux cas au socle permanent `test:math-tools`.
- Batterie sans dépendances externes : 5 416 contrôles, 0 échec.

## V4.0.0 — Assistant unifié et parcours complet

- Assistant de résolution en quatre modes : Comprendre, Commencer, Vérifier, Plan.
- Photo locale + confirmation obligatoire de la transcription avant analyse.
- Vérification directe de deux lignes de calcul.
- V3.9 : examen avec autosauvegarde, reprise, palette, drapeaux et bilan par chapitre.
- V3.8 : favoris, file à refaire, journal d’erreurs, recommandations et série d’étude.
- V3.7 : annales locales importables/exportables en JSON et utilisables hors ligne.
- Correction d’un ancien problème de typage dans le registre d’annales et d’une fiche de révision.

## V3.6.0 — Parcours annales 2022–2023

- Ajout d’un espace de travail pour les annales 2022 et 2023 des séries A, C et D.
- Distinction explicite entre énoncé référencé, corrigé partiel, corrigé du problème et corrigé non confirmé.
- Correction des statuts 2022/2023 dans la bibliothèque d’annales.
- Checklist de fiabilité avant validation d’une réponse.
- Champ « question en cours » et journal d’erreurs sauvegardés hors ligne.
- Workflow de résolution en cinq étapes relié à l’atelier pédagogique V3.4.
- Cache PWA incrémenté vers `v3.6-annales-study`.

## V3.5.0 — Annales BAC Madagascar

- Ajout d'un registre d'annales réelles pour les séries A, C et D.
- Classement par année, provenance et niveau de confiance.
- Indication distincte des corrigés repérés.
- Recoupement des années récentes avec EDUCMAD/ACCESMAD et un catalogue d'annales.
- Ajout des références 2025 A/C/D en tant que sources secondaires clairement signalées.
- Nouveau navigateur d'annales avec filtres « Toutes / Avec corrigé / Recoupées ».
- Liens séparés « Ouvrir le sujet » et « Vérifier l'archive ».
- Accès direct à l'atelier pédagogique depuis une annale.
- L'accueil affiche désormais le nombre d'annales de confiance référencées.
- Les PDF/OCR externes ne sont pas transformés automatiquement en corrections afin de préserver la fiabilité mathématique.
- Cache PWA incrémenté vers `v3.5-annales`.

# Changements — V3 Maths BAC Madagascar

## Recentrage pédagogique
- Navigation principale dédiée au BAC malgache : Accueil, Sujets, Résoudre, Outils, Progrès.
- Séries A, C et D.
- Sujets originaux d'entraînement de type BAC disponibles hors ligne.
- Index d'annales externes distinct des entraînements originaux.

## Résolution et examen
- Résolution guidée avec vérification de réponse, indices progressifs, méthode et correction.
- Vérification numérique, textuelle et d'expressions mathématiquement équivalentes.
- Mode examen chronométré sans aide pendant l'épreuve, avec estimation sur 20.
- Tableau de progression par thème, série et historique d'examens.

## Fiabilité
- Correction du test de parité lorsque le domaine n'est pas symétrique.
- Un point où f' s'annule sans changement de signe n'est plus automatiquement appelé point d'inflexion.
- Détection du domaine renforcée pour divisions, racines carrées et logarithmes.
- Les anciennes fonctions de photo/écriture ne sont plus présentées comme une reconnaissance automatique si aucun OCR n'est actif.

## Sécurité et PWA
- Suppression des codes d'activation statiques intégrés au frontend.
- Activation locale optionnelle via variable d'environnement, désactivée par défaut.
- Chemins PWA rendus relatifs pour faciliter GitHub Pages en sous-dossier.
- Service worker et manifeste renommés pour Maths BAC Madagascar.

## Validation effectuée
- Contrôle de syntaxe/transpilation des fichiers TypeScript/TSX.
- Contrôle de cohérence TypeScript avec stubs locaux lorsque les dépendances npm ne pouvaient pas être téléchargées dans l'environnement de génération.
- Un build Vite réel reste à exécuter après `npm install` sur la machine de test.

## 3.1.0 — Refonte visuelle et thèmes
- Nouveau design original inspiré d'une copie d'examen/cahier de révision, sans image générée.
- Palette sémantique unique pour les modes clair et sombre afin d'éviter les textes invisibles.
- Mode clair ivoire/papier, mode sombre encre/ardoise, accent rouge Madagascar et vert réussite.
- Nouvel en-tête, nouvelle navigation inférieure avec icônes SVG intégrées au code.
- Refonte de l'accueil, des sujets, du solveur guidé, du mode examen, de l'assistant et de la progression.
- Les anciens calculateurs sont regroupés dans un « laboratoire mathématique » volontairement sombre pour garantir la lisibilité de leurs composants historiques dans les deux thèmes.
- Champs, boutons, messages d'état, cartes, segments et barres de progression harmonisés.


## 3.3.0 — Fiabilité, vérifications et solutions détaillées
- Nouveau panneau de confiance commun : Vérifié / Approché mais contrôlé / À contrôler.
- Calculatrice scientifique : normalisation de saisie, trace des opérations, contrôle secondaire en haute précision et refus des résultats non réels/non finis présentés comme valides.
- Dérivées : étapes symboliques plus détaillées et vérification par différences finies sur plusieurs points.
- Équations : résolution algébrique exacte des degrés 1 et 2, discriminant détaillé, substitution des racines ; recherches numériques clairement limitées à l’intervalle choisi.
- Intégrales : contrôle du domaine, refus des singularités détectées, Simpson sur deux maillages et estimation d’erreur.
- Limites : suppression des conclusions numériques fragiles ; réponse indéterminée si la convergence/divergence n’est pas suffisamment nette.
- Inéquations, tableaux de signe/variation et comparaison : suppression des faux ±∞ lorsque seule une fenêtre numérique est explorée.
- Suites : les tendances sur un nombre fini de termes sont présentées comme observations, jamais comme preuve de convergence.
- Matrices : suppression des arrondis internes et vérification de l’inverse par A × A⁻¹ ≈ I.
- Complexes : division par zéro bloquée, argument de 0 traité correctement, racines quadratiques vérifiées par substitution.
- Arithmétique/combinatoire : calculs entiers exacts avec contrôles de recomposition et validation stricte des entrées.
- Statistiques/probabilités : données invalides refusées explicitement, quartiles corrigés, domaines de paramètres vérifiés.
- Géométrie : cas des droites verticales traité sans division par zéro ; pente nulle décrite comme point stationnaire et non comme extremum certain.
- Résolution guidée BAC : correction complète réorganisée en étapes de référence puis réponse finale.

## V3.4.0 — Moteur pédagogique
- Atelier de résolution ligne par ligne.
- Modes Guidé / Normal / Autonome.
- Contrôle des transformations algébriques et équations lorsque vérifiables.
- Diagnostic de plusieurs erreurs classiques d'élèves.
- Clavier mathématique visuel enrichi de modèles scolaires.
- Tableaux de signes et variations redessinés façon BAC.
- Méthode révélée progressivement et réponse finale vérifiée séparément.

## V4.1 — Refonte design complète

- Nouveau design académique uniforme sur toute l’application.
- Suppression des emojis décoratifs dans l’interface.
- Harmonisation forcée des anciens composants Tailwind avec le thème global clair/sombre.
- Refonte complète de la calculatrice scientifique.
- Refonte complète du clavier d’analyse de fonction.
- Formules présentées dans des panneaux dédiés et plus lisibles.
- Outils regroupés par familles fonctionnelles.
- Récompenses remplacées par des paliers sobres numérotés.
- Claviers réduits à une palette sémantique : fonction, opérateur, action, validation.
- Suppression des anciens dégradés multicolores dans les écrans hérités.
- Aucune image générée ou asset décoratif externe ajouté.


## V4.2 — Calculs lisibles et fiables
- Dérivées rationnelles simplifiées en une fraction claire.
- Résultat final de dérivée mis en évidence.
- Correction du rendu f^H/u^H/v^H en f'/u'/v'.
- Intégrales exactes pour les formes usuelles avant repli Simpson.
- Graphiques plus robustes autour des asymptotes et discontinuités.


## V4.4.0 — Réécriture complète du moteur de dérivation

- Suppression du chemin de dérivation historique qui mélangeait plusieurs moteurs et simplificateurs.
- Nouveau moteur déterministe unique dans `src/lib/derivativeEngine.ts`.
- Une seule source de vérité pour f', f'' et les étapes affichées.
- Prise en charge testée : polynômes, produits, quotients, puissances, racines, exponentielles, logarithmes, trigonométrie et compositions.
- Formes rationnelles réduites et résultats scolaires privilégiés.
- Conditions de domaine/validité ajoutées lorsque la règle n’est pas valable partout.
- Vérification indépendante de f' et f'' dans `mathEngine.ts`.
- MathJS n’est plus la source de la réponse ; il ne sert qu’au contrôle secondaire.
- Ajout de `npm run test:derivatives`.
- Régression : 46 cas de référence + 120 cas aléatoires, 1 960 contrôles numériques, 0 échec.
- Audit symbolique SymPy : 92 comparaisons (f' et f''), 0 divergence.


## V4.5.0 — Audit mathématique complet

- Application de la méthode d’audit V4.4 aux autres outils mathématiques.
- Nouveaux moteurs dédiés/testables pour arithmétique et conversions d’unités.
- Équations et inéquations : chemins exacts pour les polynômes/fractions rationnelles pris en charge, vérification des solutions, avertissement explicite pour les recherches numériques limitées.
- Correction de l’intersection de deux droites/inéquations 2D et vérification par substitution dans les deux équations.
- Fractions rationnelles : conservation des valeurs interdites pendant simplification et comparaison d’expressions.
- Intégrales : primitives reconnues puis redérivées pour contrôle ; Simpson uniquement comme approximation et refus si la continuité sur tout l’intervalle ne peut pas être certifiée.
- Limites : règles exactes pour les formes rationnelles/élémentaires prises en charge et refus de deviner les cas oscillants ou non certifiés.
- Suites : correction des bornes et divergences polynomiales, gestion du rang initial et séparation preuve/observation.
- Matrices : pivotage, inverse contrôlée par produit résiduel et absence d’arrondis intermédiaires.
- Complexes : division par zéro bloquée et racines vérifiées par substitution.
- Probabilités/statistiques : combinatoire entière exacte, validations de domaine et conventions explicites.
- Géométrie : moteurs dédiés et contrôles de cohérence.
- Calculatrice : troisième contrôle indépendant quand la syntaxe est supportée et correction des trigonométries imbriquées en degrés.
- Graphique : correction des chemins qui utilisaient encore un évaluateur non défini ; courbes f, f′ et f″ passent par l’évaluateur contrôlé.
- Ajout de `npm run test:all-math`, `npm run test:integration` et `npm run test:full`.
- Batterie pure : **5 414 contrôles automatiques, 0 échec**.
- Audit indépendant SymPy : **1 080 comparaisons, 0 divergence** sur équations quadratiques, matrices et racines complexes.
