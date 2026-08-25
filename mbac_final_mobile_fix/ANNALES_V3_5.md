# V3.5 — Annales BAC Madagascar

## Objectif

La V3.5 ajoute une bibliothèque d'annales réellement référencées pour les mathématiques du baccalauréat à Madagascar, séries A, C et D.

## Principe de fiabilité

L'application ne recopie pas automatiquement le texte d'un PDF trouvé sur Internet et ne génère pas de correction à partir d'un OCR non contrôlé. Une erreur de lecture sur un exposant, un signe, une fraction ou un indice peut fausser tout le raisonnement.

Les annales sont donc classées en trois niveaux :

- **Archive recoupée** : année retrouvée dans une archive éducative et/ou recoupée avec un second catalogue.
- **Annale cataloguée** : année et série clairement identifiées dans un catalogue d'annales, avec lien vers la source.
- **Source secondaire** : copie récente retrouvée sur une plateforme communautaire ; elle est visible mais ne sert pas de base à une correction automatique.

## Sources intégrées

- **EDUCMAD / ACCESMAD** : pages de cours consacrées aux sujets de mathématiques du baccalauréat à Madagascar pour les séries A, C et D.
- **LeChaya** : catalogue d'annales Madagascar indiquant l'année, la série et la disponibilité d'un corrigé.
- **Ministère de l'Éducation Nationale** : page lycée utilisée comme référence sur les séries et programmes.
- Les copies 2025 A/C/D trouvées sur une source communautaire sont affichées séparément avec un avertissement.

## Expérience élève

Dans `Sujets` :

1. choisir la série A, C ou D ;
2. consulter les annales réelles par année ;
3. filtrer les annales ayant un corrigé repéré ;
4. voir le niveau de confiance de la source ;
5. ouvrir le sujet externe ou vérifier l'archive ;
6. ouvrir l'atelier pédagogique pour travailler une question ;
7. utiliser les entraînements guidés hors ligne pour les corrections détaillées et vérifiées.

## Pourquoi les PDF ne sont pas embarqués

- éviter de distribuer des copies dont la provenance ou les droits ne sont pas clairs ;
- éviter les erreurs d'OCR transformées en fausses corrections ;
- conserver un lien de traçabilité vers la source ;
- permettre une future ingestion manuelle, question par question, avec validation mathématique avant publication.

## Prochaine étape logique

Encoder progressivement les annales les plus utiles (par exemple 2023 puis 2022) **question par question**, avec double vérification de l'énoncé, correction détaillée, barème et tests automatiques avant de les déclarer disponibles hors ligne.
