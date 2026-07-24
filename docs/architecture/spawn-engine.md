# Architecture du moteur de spawn

## Statut

- Cible initiale : Sprint 3.1
- État : livré dans `main`, utilisé par le Sprint 3.5
- Issue initiale : #33, clôturée
- Pull Request initiale : #35, fusionnée
- Commit initial : `dd8c749f3afb73104270d87c9e920aab4e926bf3`
- Extension de renforts : issue #48, PR #49

## Objectif

Le moteur de spawn ajoute des créatures à une salle déjà créée, pendant son initialisation ou en cours de partie, sans confondre la définition éditoriale d'une créature avec son état runtime.

Il constitue la fondation commune aux spawns de scénario, renforts de Brouhaha, boss et futures populations initiales générées.

## Étude de Gargottex en lecture seule

Le générateur du dépôt `christolosier-ship-it/Gargotte-V5` a été consulté sans aucune écriture. Il inspire la séparation entre sélection éditoriale et résultat, mais n'est ni copié ni importé : il compose une rencontre et utilise encore du hasard, tandis que ce moteur exécute seulement une demande déterministe.

## Séparation des responsabilités

```text
CreatureDefinition
    │
    ▼
SpawnRequest explicite
    │
    ▼
moteur de spawn
    ├─ valide la phase et la requête
    ├─ filtre les points candidats dans leur ordre
    ├─ contrôle l'occupation
    ├─ crée des identifiants stables
    └─ produit des événements explicatifs
    │
    ▼
CreatureInstance dans RoomState
```

Le système appelant décide pourquoi une apparition est demandée. Le moteur de spawn ne choisit pas la composition tactique d'une salle et ne dépense aucun budget de menace.

## Contrats

### `CreatureDefinition`

Archétype stable : identifiant, nom, PV maximum, attaque, défense, portée et blocage. Le contenu ajoute catégorie, menace et tags, que le spawn n'interprète pas.

### `CreatureInstance`

État runtime : identifiant unique, `creatureId`, position, PV, statistiques courantes, état vivant et blocage.

Deux instances peuvent partager le même `creatureId` sans partager leur identifiant ni leur état.

### `SpawnPoint`

Point logique stable de la salle : identifiant, position, tags et état activé. Il n'est pas consommé automatiquement.

### `SpawnRequest`

Demande sérialisable contenant :

- identifiant idempotent ;
- source typée ;
- `creatureId` ;
- quantité ;
- liste ordonnée de points candidats ;
- mode `all-or-nothing` ou `partial`.

Le type de source `brouhaha` est utilisé par la politique de renfort du Sprint 3.5.

### `SpawnResult`

Résultat pur comprenant nouvel état, instances créées, refus structurés et événements tactiques.

## État de salle

Les champs de spawn introduits en version 2 restent présents dans `RoomState` version 6 :

- `spawnPoints` ;
- `processedSpawnRequestIds` ;
- `nextEnemyInstanceSequence` ;
- ennemis portant un `creatureId`.

`processedSpawnRequestIds` protège contre la répétition d'une demande. `nextEnemyInstanceSequence` produit des identifiants tels que `gobelin-bricoleur-spawn-1` et saute tout identifiant déjà occupé.

## Algorithme

Pour une demande valide, le moteur :

1. refuse une requête déjà traitée ;
2. vérifie la quantité ;
3. refuse une salle terminale ;
4. résout la définition de créature ;
5. parcourt les points dans l'ordre fourni ;
6. ignore et explique doublons, absences, désactivations, sorties de plateau ou occupations ;
7. applique le mode d'échec ;
8. crée les instances avec la séquence persistée ;
9. marque la demande comme traitée lorsqu'une apparition est appliquée ;
10. retourne état, instances, refus et événements.

`all-or-nothing` refuse sans mutation si les points valides sont insuffisants. `partial` crée les instances possibles et explique le reliquat.

Les obstacles, héros, ennemis et objets bloquants participent à l'occupation. Une grille ouverte ou un tonneau brisé peut libérer un point.

## Utilisation par les renforts de Brouhaha

La politique `resolveBrouhahaReinforcements` :

- détecte les franchissements de seuil ;
- construit une `SpawnRequest` avec source `{ type: "brouhaha", id: rule.id }` ;
- transmet les points candidats dans l'ordre éditorial ;
- laisse le moteur décider du succès total, partiel ou du refus ;
- conserve le résultat dans son propre historique.

Un refus total ne modifie pas les champs du spawn, mais l'activation de la règle est tout de même historisée par la politique de renfort.

## Invariants

1. À état, catalogue et requête identiques, le résultat est identique.
2. Aucun `Date.now()`, UUID ou hasard implicite ne crée les identifiants.
3. Aucun `Math.random()` n'est utilisé.
4. Les identifiants proviennent d'une séquence monotone persistée.
5. Une instance vivante ne peut apparaître hors limites ou sur une case bloquée.
6. Un refus total ne modifie pas la salle.
7. Chaque succès ou refus est expliqué.
8. Les coordonnées restent logiques et indépendantes de la caméra.
9. Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB.
10. Le renderer résout l'asset par `creatureId` sans décider de l'apparition.

## Événements

- `spawn-requested` ;
- `creature-instantiated` ;
- `spawn-succeeded` ;
- `spawn-rejected`.

La politique de renfort encadre ces événements avec `reinforcement-triggered` et `reinforcement-resolved`.

## Budget de menace

Le budget de menace appartient à chaque salle et servira au générateur de rencontre du Sprint 5. Le moteur de spawn ne le lit ni ne le dépense.

Les renforts de Brouhaha sont une augmentation runtime explicitement autorisée par les règles de la salle.

## Contenu pilote Bastognac

Le paquet contient :

- Gobelin Bricoleur et Gobelin Lance-Tout ;
- une salle tactique de schéma version 5 ;
- deux ennemis initiaux ;
- deux points de spawn à l'est ;
- un spawn scripté de contrôle ;
- deux règles de renfort automatiques réutilisant ces points.

Le tonneau démontre un renfort total. La chaîne table → pilier → grille démontre un renfort total suivi d'un renfort partiel.

## Sauvegarde et tests

La sauvegarde version 6 conserve les champs de spawn et l'historique séparé des renforts. Les migrations versions 1 à 5 préservent le spawn sans déclencher rétroactivement de règle.

Les tests couvrent les modes total et partiel, l'ordre des points, l'occupation, les requêtes dupliquées, les salles terminales, les compteurs, la restauration, les renforts de seuil et les parcours Playwright desktop/mobile.

## Préparation du Sprint 5

Le Sprint 5 produira des plans de salles avec géométrie, connexions et points de spawn. Le générateur de rencontre utilisera le budget propre à chaque salle pour produire des demandes initiales. Le moteur de spawn restera l'exécutant générique de ces demandes.
