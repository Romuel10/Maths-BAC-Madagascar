# V4.2.1 — Correctif cache Termux / Chrome

Le problème « rien ne change après remplacement du projet » venait du service worker PWA cache-first enregistré sur `localhost:5173`.

## Correction
- aucun service worker n'est enregistré en mode Vite/localhost ;
- les anciens caches `maths-bac-madagascar-*` sont supprimés en développement ;
- en production, le service worker utilise le réseau en priorité pour HTML/JS/CSS ;
- la version `4.2.1` est visible dans l'en-tête et dans les résultats dérivée/intégrale.

## Premier lancement conseillé
Si Chrome a déjà un ancien service worker sur le port 5173, démarrer une fois cette version sur un nouveau port :

```bash
npm run dev -- --host 0.0.0.0 --port 5174
```

Ouvrir `http://127.0.0.1:5174`. Le bandeau doit afficher `v4.2.1`.

Pour réutiliser le port 5173, supprimer ensuite les données du site `localhost:5173` dans Chrome, ou continuer simplement à utiliser 5174 pendant le développement.
