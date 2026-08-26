# Version 7.0.0 — contenus enrichis et publication Android

## Chargement et analyse de fonction

- Écrans Accueil, Apprendre, Résoudre et Progression disponibles sans téléchargement différé au premier clic.
- MathJS retiré du rendu courant des formules et chargé uniquement pour les moteurs qui en ont besoin.
- Solveur et simulation guidée chargés séparément du catalogue de cours.
- Message de chargement progressif, reprise manuelle et interruption lisible après 20 secondes pour une analyse muette.
- Service Worker désactivé dans le runtime Capacitor afin d’éviter qu’une ancienne interface soit conservée après mise à jour.
- Préchargement PWA recentré sur l’application, les sessions essentielles, le Worker et les polices WOFF2, sans télécharger d’avance tous les outils ni trois formats de chaque police.

## Programme de révision 2026

- 8 chapitres, 32 sections de leçon, 51 formules expliquées et 16 exemples corrigés.
- 56 QCM corrigés, avec au moins 7 questions pour chacun des huit thèmes.
- 6 entraînements originaux de type BAC : deux sujets par série A, C et D, soit 36 questions guidées.
- Leçons, exemples, pièges fréquents et exercices réunis dans une interface cohérente et recherchable.

## Capacitor et première publication

- Capacitor Android 8.5.0, identifiant `mg.mathsbac.madagascar`, API minimale 24 et cible 36.
- Projet Gradle natif, icône adaptative, écran de démarrage et blocage du trafic HTTP en clair.
- Module Capacitor App pour le comportement natif du bouton Retour Android.
- Construction AAB refusée si les variables de signature sont absentes.
- Workflow GitHub Actions, guide Termux/Google Play et politique de confidentialité fournis.

# Version 6.2.0 — apprentissage adaptatif

## Parcours et personnalisation

- Choix de la série A, C ou D et diagnostic local par chapitre.
- Révisions rapides adaptées aux fragilités, parcours guidés et mini-évaluations.
- Carnet d’erreurs unifié et formulaire expliqué avec exemples.
- Recherche globale hors connexion dans les chapitres, formules et exercices.

## Résolution, examens et accessibilité

- Décomposition d’un énoncé en données, question, inconnue et plan de résolution.
- Indices progressifs « Je suis bloqué ici », lecture vocale et reprise d’une fonction depuis l’historique.
- Temps passé par question dans les simulations et mémorisation automatique des erreurs.
- Taille du texte, contraste renforcé et réduction des animations.

# Version 6.1.0 — Résoudre plus intelligent

## Assistant de résolution

- Organisation du menu selon le besoin réel de l’élève : comprendre, étudier une fonction, vérifier une étape ou choisir un chapitre.
- Détection locale du chapitre, de l’objectif de la consigne, des mots-clés et de l’expression `f(x)` recopiée.
- Recommandation de la méthode et accès direct à l’outil correspondant au chapitre.
- Présentation progressive : la photo, la saisie, les conseils et les méthodes ne surchargent plus le même écran.

## Correctif de l’analyse de fonction

- Ouverture immédiate de l’espace d’analyse au clic, avec état de chargement visible.
- Les erreurs sont désormais affichées sur l’écran réellement ouvert par l’élève.
- Repli automatique sur le calcul principal lorsque le Web Worker est refusé, interrompu ou muet sur certains navigateurs Android.
- Contrôle des expressions vides, de la notation `f(x)=…` et des parenthèses avant le lancement.

# Version 6.0.0 — stabilisation complète

## Fiabilité et sécurité

- Suppression des anciens écrans inutilisés, du secret administrateur historique et du code anti-inspection.
- Ajout d’un accès résilient au stockage local et d’une limite/validation stricte des imports JSON.
- Ajout d’une frontière d’erreur React.
- Correction du domaine de `tan(x)`, des puissances fractionnaires comme `x^0.5` et de la certification d’intégration associée.
- Renforcement de la reconnaissance des réponses textuelles : limites de mots et crédit partiel explicite.

## Expérience mobile

- Navigation français/malagasy cohérente : Accueil/Fandraisana, Apprendre/Hianatra, Résoudre/Hamaha, Outils/Fitaovana, Progression/Fandrosoana.
- Historique par URL et prise en charge du bouton Retour pour les pages et les outils.
- Modales accessibles : rôle de dialogue, fermeture par Échap, piège de focus et restitution du focus.
- Suppression du blocage du zoom, zones tactiles agrandies et prise en charge de la réduction des animations.
- Onglets Annales, Entraînements et Mes sujets pour raccourcir la bibliothèque.

## Performance et PWA

- Pages secondaires et outils chargés à la demande.
- Analyse complète de fonction déplacée dans un Web Worker.
- Séparation des paquets React, KaTeX et MathJS lors du build.
- Icônes converties en vrais PNG 192 × 192 et 512 × 512.
- Cache PWA 6.0.0, préchargement des assets du manifeste Vite et notification d’une mise à jour en attente.

## Simulation et contenus

- Chronomètre basé sur une date de fin réelle, y compris après mise en arrière-plan.
- Sauvegarde périodique plutôt que chaque seconde et confirmation avant remise manuelle.
- Présentation explicite comme simulation d’entraînement, et non comme épreuve officielle complète.
- Préremplissage effectif du tuteur depuis l’atelier d’annales, les recommandations, les favoris et la file À refaire.
