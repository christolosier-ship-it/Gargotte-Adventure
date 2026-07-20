# Architecture d’exécution

## Chemin nominal

1. `apps/game` monte la coque DOM accessible.
2. `packages/renderer` initialise PixiJS dans le panneau de plateau.
3. `packages/save` restaure l’autosauvegarde IndexedDB.
4. `packages/engine` reçoit des événements explicites et produit le nouvel état.
5. L’interface et le rendu observent cet état.
6. Le nouvel état est sauvegardé localement.

## Frontières

- Le moteur n’importe ni DOM, ni PixiJS, ni IndexedDB.
- Le contenu est validé avant le build.
- La sauvegarde porte une version de schéma indépendante du contenu.
- La PWA ne contient aucun secret et n’appelle pas OpenAI directement.
- WebAssembly ne sera ajouté que si un profilage révèle un calcul réellement coûteux.

## Hors ligne

`vite-plugin-pwa` génère le service worker et précharge les ressources de production. IndexedDB conserve la progression. Le premier chargement nécessite une connexion, les suivants peuvent fonctionner hors ligne.
