# Architecture d'exécution

## Chemin nominal actuel

1. `apps/game` monte la coque DOM accessible.
2. `packages/renderer` initialise PixiJS dans le panneau de plateau.
3. `packages/save` restaure l'autosauvegarde IndexedDB versionnée.
4. `packages/engine` reçoit des intentions explicites et produit le nouvel état.
5. Les réactions, demandes de Brouhaha et renforts sont résolus dans leur ordre causal.
6. La phase terminale est calculée après la résolution complète.
7. L'interface et le rendu observent l'état final.
8. Le nouvel état est sauvegardé localement.

L'application ne réimplémente aucune règle métier. Elle assemble catalogues et règles, transmet les intentions et traduit les événements.

## Chemin d'une interaction complète

```text
Interaction héros
      │
      ▼
validation objet et mouvement
      │
      ▼
transition directe et Brouhaha éventuel
      │
      ▼
file FIFO de réactions
      ├─ transitions secondaires
      ├─ déplacements
      ├─ dégâts
      └─ Brouhaha ordonné
      │
      ▼
règles de seuil franchies
      │
      ▼
SpawnRequest déterministes
      │
      ▼
moteur de spawn
      │
      ▼
phase terminale
      │
      ▼
état final + événements + historiques
```

Une réaction excessive ou cyclique s'arrête explicitement. Le renderer ne connaît ni le graphe, ni les seuils, ni les règles d'apparition.

## Chemin d'un spawn

1. Un scénario, une règle de renfort ou un futur générateur produit une `SpawnRequest`.
2. Le moteur valide phase, définition, points, limites et occupation.
3. Il crée des `CreatureInstance` avec des identifiants reproductibles.
4. Il retourne état, instances et événements explicatifs.
5. Le renderer affiche l'état sans connaître la logique d'apparition.
6. Le journal explique succès ou refus.
7. La sauvegarde persiste instances, demandes et séquence.

Une apparition n'est jamais créée directement depuis l'UI ou PixiJS.

## Chemin des renforts de Brouhaha

```text
BrouhahaRequest acceptée
        │
        ▼
previousLevel → level
        │
        ▼
règles franchies vers le haut
        │
        ▼
ordre par seuil puis identifiant
        │
        ▼
activation déterministe
        │
        ▼
SpawnRequest source brouhaha
        │
        ▼
moteur de spawn existant
        │
        ├─ succès total
        ├─ succès partiel
        └─ refus
        │
        ▼
historique de renfort
```

La politique de seuil décide pourquoi une demande est créée. Le moteur de spawn décide si elle est réalisable.

Une baisse ne déclenche rien. Une reprise ou migration ne rejoue aucun seuil ancien. Une activation refusée est tout de même consommée et historisée.

## Tour ennemi

Le roster est capturé au début de `enemy-turn`. `runEnemyTurn` exécute uniquement ces identifiants.

Un ennemi créé après l'ouverture de ce roster ne joue pas pendant la phase en cours. Il sera inclus au prochain tour ennemi.

## Chemin cible d'une expédition générée au Sprint 5

1. Une requête fournit donjon, seed et contraintes.
2. Le générateur produit la topologie des cinq étages.
3. Chaque salle reçoit une géométrie complète et ses points de spawn.
4. Chaque salle reçoit son propre budget de menace.
5. Le générateur de rencontre compose sa population initiale.
6. Le moteur de spawn transforme le plan en instances runtime.
7. Le moteur tactique reçoit un `RoomState` valide.
8. Le renderer projette uniquement cet état.

Le budget de menace n'est pas un portefeuille global d'étage. Les renforts sont une augmentation runtime distincte de la rencontre initiale.

## Persistance actuelle

La sauvegarde tactique version 6 conserve notamment :

- Brouhaha, historique et séquence ;
- objets, interactions et réactions ;
- points, demandes et séquence de spawn ;
- historique, résultats et séquence des renforts ;
- combattants, phase, tour et actions.

Les versions 1 à 5 migrent vers la version 6 avec un historique de renfort vide. La migration n'appelle aucune règle runtime.

## Frontières

- Le moteur n'importe ni DOM, ni PixiJS, ni IndexedDB.
- Le contenu est validé avant le build et au chargement.
- La sauvegarde porte une version indépendante du contenu.
- Spawn, Brouhaha, objets, réactions et renforts sont déterministes.
- Le générateur produit des plans, pas des objets PixiJS.
- Le renderer n'instancie aucune créature métier.
- La PWA ne contient aucun secret et n'appelle pas OpenAI directement.
- Gargottex reste une source éditoriale consultée en lecture seule.

## Hors ligne

`vite-plugin-pwa` génère le service worker et précharge les ressources de production. IndexedDB conserve la progression. Après un premier chargement connecté, les sessions peuvent fonctionner hors ligne.
