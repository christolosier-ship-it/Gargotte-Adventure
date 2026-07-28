# Architecture du moteur de spawn

## Statut

- Cible initiale : Sprint 3.1
- État : livré dans `main`, utilisé par les renforts
- Issue initiale : #33, clôturée
- Pull Request initiale : #35, fusionnée
- Commit initial : `dd8c749f3afb73104270d87c9e920aab4e926bf3`
- Extension de renforts : issue #48, PR #49

## Objectif

Le moteur de spawn ajoute des créatures à une salle déjà créée, pendant son initialisation ou en cours de partie, sans confondre la définition éditoriale d'une créature avec son état runtime.

Il reste la frontière unique d'instanciation des créatures au Sprint 4 et au Sprint 5.

## Séparation des responsabilités

```text
CreatureDefinition
      │
placement initial ou SpawnRequest
      │
      ▼
moteur de spawn
      ├─ valide la phase et la requête
      ├─ filtre les points candidats
      ├─ contrôle l'occupation
      ├─ crée des identifiants stables
      └─ produit des événements explicatifs
      │
      ▼
CreatureInstance dans RoomState
```

Le système appelant décide pourquoi une apparition est demandée. Le moteur ne choisit pas la composition tactique d'une salle et ne dépense aucun budget de menace.

## Contrats

### `CreatureDefinition`

Archétype stable : identité, statistiques, catégorie, menace, tags, capacités, profils et références de présentation.

Le spawn utilise uniquement les informations nécessaires à l'instanciation. Il n'interprète pas les profils d'IA ou l'équilibrage.

### `CreatureInstance`

État runtime : identifiant unique, `creatureId`, position, PV, statistiques courantes, état vivant, ressources et blocage.

Deux instances peuvent partager le même `creatureId` sans partager leur identifiant ou leur état.

### `SpawnPoint`

Point logique stable de la salle : identifiant, position, tags et état activé.

### `SpawnRequest`

Demande sérialisable contenant :

- identifiant idempotent ;
- source typée ;
- `creatureId` ;
- quantité ;
- points candidats ordonnés ;
- mode `all-or-nothing` ou `partial`.

### `SpawnResult`

Résultat pur comprenant nouvel état, instances créées, refus structurés et événements tactiques.

## Algorithme

Pour une demande valide, le moteur :

1. refuse une requête déjà traitée ;
2. vérifie la quantité et la phase ;
3. résout la définition de créature ;
4. parcourt les points dans l'ordre fourni ;
5. explique absences, doublons, désactivations, sorties ou occupations ;
6. applique le mode d'échec ;
7. crée les instances avec la séquence persistée ;
8. marque la demande selon le contrat livré ;
9. retourne état, instances, refus et événements.

`all-or-nothing` refuse sans mutation si les positions sont insuffisantes. `partial` crée les instances possibles et explique le reliquat.

Obstacles, héros, ennemis et objets bloquants participent à l'occupation.

## Utilisation par les renforts

La politique de Brouhaha détecte les seuils, construit une `SpawnRequest`, transmet les points candidats et historise le résultat. Elle ne choisit aucune case et ne crée aucune instance.

Un refus total peut consommer l'activation de renfort sans modifier les champs de spawn.

## Utilisation par le Sprint 4

### Placements initiaux

Les trois salles sont écrites à la main. Leurs populations initiales sont explicitement déclarées et validées.

L'implémentation peut représenter ces placements par un état initial validé ou par des demandes initiales, mais toute création runtime supplémentaire doit passer par le moteur de spawn. Le choix exact sera fixé au Sprint 4.2 avec la stratégie de contenu et de migration.

### Renforts

Les salles 2 et 3 démontrent les renforts complets. La salle 2 doit aussi couvrir un succès partiel et un refus expliqué.

Les règles restent locales à la salle et ne dépensent pas son budget de menace.

### Seize créatures

Les seize `CreatureDefinition` de Bastognac doivent être instanciables sans branchement particulier dans le moteur de spawn.

Ajouter une créature ne doit pas nécessiter de modifier l'algorithme de spawn.

### Profils d'IA

Les profils et capacités n'affectent pas l'instanciation. Ils sont résolus après création à partir de `creatureId` et de la définition correspondante.

### Transitions entre salles

Une transition d'expédition ne déplace pas directement une instance ennemie d'une salle vers une autre. Chaque `RoomState` conserve sa propre population.

Les héros sont transférés par le contrat d'expédition, pas par le moteur de spawn des créatures.

## Invariants

1. À état, catalogue et requête identiques, le résultat est identique.
2. Aucun temps système, UUID ou hasard implicite ne crée les identifiants.
3. Les identifiants proviennent d'une séquence persistée.
4. Une instance vivante n'apparaît pas sur une case invalide.
5. Un refus total ne modifie pas la salle.
6. Chaque succès ou refus est expliqué.
7. Les coordonnées restent logiques et indépendantes de la caméra.
8. Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB.
9. Le renderer ne décide jamais de l'apparition.
10. Aucun acteur ou profil d'IA ne construit directement une `CreatureInstance`.

## Événements

- `spawn-requested` ;
- `creature-instantiated` ;
- `spawn-succeeded` ;
- `spawn-rejected`.

La politique de renfort encadre ces événements avec `reinforcement-triggered` et `reinforcement-resolved`.

## Budget de menace

Le budget de menace appartient à chaque salle. Le moteur de spawn ne le lit ni ne le dépense.

Au Sprint 4, les compositions sont écrites à la main. Au Sprint 5, le générateur de rencontre utilisera le budget propre à la salle pour produire un plan ou des demandes initiales.

## Sauvegarde et tests

La sauvegarde version 6 conserve les champs actuels de spawn et l'historique séparé des renforts.

Le Sprint 4 ajoutera des tests pour :

- toutes les catégories du bestiaire ;
- placements et renforts des trois salles ;
- succès total, partiel et refus ;
- reprise dans chaque salle ;
- absence d'instanciation directe par une capacité ou un profil ;
- séparation des populations entre salles.

## Hors périmètre du Sprint 4

- génération de topologie ou géométrie ;
- composition automatique des rencontres ;
- calcul ou dépense du budget de menace ;
- vagues adaptatives générées ;
- boss final ;
- loot et progression.

Gargottex reste strictement en lecture seule.
