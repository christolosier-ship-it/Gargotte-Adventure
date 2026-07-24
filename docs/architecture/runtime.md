# Architecture d'exécution

## Chemin nominal actuel

1. `apps/game` monte la coque DOM accessible.
2. `packages/renderer` initialise PixiJS dans le panneau de plateau.
3. `packages/save` restaure l'autosauvegarde IndexedDB versionnée.
4. `packages/engine` reçoit des intentions explicites et produit le nouvel état.
5. Les réactions en chaîne et demandes de Brouhaha sont résolues dans leur ordre causal.
6. L'interface et le rendu observent l'état final.
7. Le nouvel état est sauvegardé localement.

L'application ne réimplémente aucune règle métier. Elle assemble les catalogues, transmet les intentions et traduit les événements pour le journal.

## Chemin actuel d'une interaction et de ses réactions

```text
Interaction héros
      │
      ▼
validation objet et mouvement éventuel
      │
      ▼
transition de l'objet
      │
      ▼
demande de Brouhaha directe éventuelle
      │
      ▼
file FIFO de réactions en chaîne
      │
      ├─ transitions secondaires
      ├─ déplacements
      ├─ dégâts
      └─ demandes de Brouhaha ordonnées
      │
      ▼
état final + événements + historique
```

Une réaction excessive ou cyclique s'arrête explicitement. Le renderer ne connaît ni le graphe ni les règles de propagation.

## Chemin actuel d'un spawn

1. Une règle de scénario produit une `SpawnRequest`.
2. Le moteur valide la phase, les points candidats, les limites et l'occupation.
3. Il crée des `CreatureInstance` avec des identifiants reproductibles.
4. Il retourne un `SpawnResult` comprenant nouvel état, instances et événements explicatifs.
5. Le renderer affiche l'état sans connaître la logique d'apparition.
6. Le journal explique le succès ou le refus.
7. La sauvegarde persiste les instances et la séquence d'identifiants.

Une apparition n'est jamais créée directement depuis l'UI ou PixiJS.

## Chemin cible des renforts au Sprint 3.5

```text
BrouhahaRequest acceptée
        │
        ▼
previousLevel → level
        │
        ▼
règles dont le seuil est franchi vers le haut
        │
        ▼
ordre par seuil puis identifiant
        │
        ▼
SpawnRequest avec source brouhaha
        │
        ▼
moteur de spawn existant
        │
        ▼
succès, apparition partielle ou refus historisé
        │
        ▼
calcul de victoire ou défaite
```

La politique de seuil décide pourquoi une demande est créée. Le moteur de spawn décide si elle est réalisable.

Une baisse de niveau ne déclenche rien. Une reprise ou migration ne rejoue aucun seuil ancien. La victoire est calculée après tous les renforts de la résolution courante.

## Chemin cible d'une expédition générée au Sprint 5

1. Une requête de génération fournit donjon, seed et contraintes.
2. Le générateur produit la topologie des cinq étages.
3. Chaque étage reçoit un graphe de salles connectées.
4. Chaque salle reçoit une géométrie complète : forme, grille, murs, portes, zones, obstacles structurels et points de spawn.
5. Chaque salle reçoit son propre budget de menace.
6. Le générateur de rencontre compose la population initiale de cette salle.
7. Le moteur de spawn transforme le plan de rencontre en instances runtime.
8. Le moteur tactique reçoit un `RoomState` valide.
9. Le renderer projette uniquement cet état validé.

Le budget de menace n'est pas partagé comme un portefeuille global d'étage. Les renforts de Brouhaha constituent une augmentation runtime distincte de la rencontre initiale.

## Persistance actuelle et cible

La salle tactique actuelle utilise la sauvegarde version 5. Elle conserve notamment :

- Brouhaha, historique et séquence ;
- objets, interactions traitées et séquence ;
- réactions en chaîne, historique et séquence ;
- points de spawn, demandes traitées et séquence d'instances ;
- combattants, phase, tour et actions.

Le Sprint 3.5 prévoit une version 6 ajoutant l'historique et la séquence des renforts. Une migration crée des structures vides sans déclencher de règle runtime.

## Frontières

- Le moteur n'importe ni DOM, ni PixiJS, ni IndexedDB.
- Le contenu est validé avant le build et au chargement applicatif.
- La sauvegarde porte une version de schéma indépendante du contenu.
- Spawn, Brouhaha, objets et réactions sont déterministes et ne dépendent pas de l'heure.
- Le générateur produit des plans, pas des objets PixiJS.
- Le renderer n'instancie aucune créature métier.
- La PWA ne contient aucun secret et n'appelle pas OpenAI directement.
- WebAssembly ne sera ajouté que si un profilage révèle un calcul réellement coûteux.
- Gargottex reste une source éditoriale consultée en lecture seule.

## Hors ligne

`vite-plugin-pwa` génère le service worker et précharge les ressources de production. IndexedDB conserve la progression. Le premier chargement nécessite une connexion, les suivants peuvent fonctionner hors ligne.

Les futures règles de renfort, seeds, plans générés, instances et historiques devront être entièrement restaurables sans accès réseau.
