# Architecture d’exécution

## Chemin nominal actuel

1. `apps/game` monte la coque DOM accessible.
2. `packages/renderer` initialise PixiJS dans le panneau de plateau.
3. `packages/save` restaure l’autosauvegarde IndexedDB.
4. `packages/engine` reçoit des événements explicites et produit le nouvel état.
5. L’interface et le rendu observent cet état.
6. Le nouvel état est sauvegardé localement.

## Chemin cible d’un spawn au Sprint 3

1. Une règle de scénario, un seuil de Brouhaha, un objet ou un boss produit une `SpawnRequest`.
2. Le moteur valide les points candidats, les limites et l’occupation.
3. Le moteur crée des `CreatureInstance` avec des identifiants reproductibles.
4. Le moteur retourne un `SpawnResult` comprenant nouvel état, instances et événements explicatifs.
5. Le renderer affiche l’état sans connaître la logique d’apparition.
6. Le journal explique le succès ou le refus.
7. La sauvegarde persiste les instances et la séquence d’identifiants.

Une apparition n’est jamais créée directement depuis l’UI ou PixiJS.

## Chemin cible d’une expédition générée au Sprint 5

1. Une requête de génération fournit donjon, seed et contraintes.
2. Le générateur produit la topologie des cinq étages.
3. Chaque étage reçoit un graphe de salles connectées.
4. Chaque salle reçoit une géométrie complète : forme, grille, murs, portes, zones, obstacles structurels et points de spawn.
5. Chaque salle reçoit son propre budget de menace.
6. Le générateur de rencontre compose la population initiale de cette salle.
7. Le moteur de spawn transforme le plan de rencontre en instances runtime.
8. Le moteur tactique reçoit un `RoomState` valide.
9. Le renderer projette uniquement cet état validé.

Le budget de menace n’est pas partagé comme un portefeuille global d’étage.

## Frontières

- Le moteur n’importe ni DOM, ni PixiJS, ni IndexedDB.
- Le contenu est validé avant le build et au chargement applicatif.
- La sauvegarde porte une version de schéma indépendante du contenu.
- Le spawn est déterministe et ne dépend pas de l’heure.
- Le générateur produit des plans, pas des objets PixiJS.
- Le renderer n’instancie aucune créature métier.
- La PWA ne contient aucun secret et n’appelle pas OpenAI directement.
- WebAssembly ne sera ajouté que si un profilage révèle un calcul réellement coûteux.

## Hors ligne

`vite-plugin-pwa` génère le service worker et précharge les ressources de production. IndexedDB conserve la progression. Le premier chargement nécessite une connexion, les suivants peuvent fonctionner hors ligne.

Les futures seeds, plans générés, instances et états de Brouhaha devront être entièrement restaurables sans accès réseau.
