# Maths BAC Madagascar — V3.2 · Écriture mathématique

Cette version remplace l'affichage de syntaxe informatique par une composition mathématique adaptée aux élèves.

## Exemples

- `3^2` ou `3**2` → exposant 2
- `3/2` → fraction verticale
- `(x^2+1)/(x-1)` → vraie fraction algébrique
- `sqrt(x+1)` → racine carrée couvrant l'expression
- `exp(-x)` ou `e^(-x)` → exponentielle avec exposant
- les équations, dérivées, intégrales et corrections utilisent le même rendu

## Zones corrigées

- sujets BAC et corrections guidées ;
- réponses des élèves avec aperçu mathématique ;
- calculatrice scientifique et historique ;
- analyseur de fonctions ;
- algèbre ;
- intégrales ;
- équations et inéquations principales ;
- probabilités ;
- géométrie ;
- nombres complexes ;
- suites ;
- fiches de révision via les composants de formule ;
- scan/recopie de formule et écriture manuscrite assistée.

## Saisie et calcul

Le moteur garde une syntaxe interne compatible avec MathJS pour effectuer les calculs. L'élève voit en priorité la notation mathématique. Les champs de saisie libre qui doivent rester éditables disposent d'un aperçu typographié.

## Termux

Ne pas installer npm dans `/storage/emulated/0`. Extraire/copier le projet dans le HOME de Termux, par exemple :

```bash
cd ~
mkdir -p maths-bac-madagascar
cd maths-bac-madagascar
unzip ~/storage/downloads/Maths-BAC-Madagascar-V3.2-Math-Display.zip
npm install
npm run dev -- --host 0.0.0.0
```

KaTeX est une nouvelle dépendance de la V3.2 ; `npm install` doit donc être relancé une fois après la mise à jour.
