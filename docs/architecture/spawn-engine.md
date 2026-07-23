# Architecture du moteur de spawn

- Statut : implémentation en cours
- Étape : Sprint 3.1
- Issue : #33
- Pull Request : #34

## Objectif

Le moteur de spawn ajoute des créatures à une salle déjà créée, pendant son initialisation ou en cours de partie, sans confondre la définition éditoriale d’une créature avec son état runtime.

Il constitue la première fondation du Sprint 3, car les seuils de Brouhaha devront ensuite pouvoir déclencher des renforts déterministes, explicables et sauvegardables.

## Étude de Gargottex en lecture seule

Le générateur du dépôt `christolosier-ship-it/Gargotte-V5` a été consulté sans aucune écriture.

Il fournit plusieurs idées utiles :

- filtrage des créatures par donjon et catégorie ;
- réutilisation possible du même archétype plusieurs fois ;
- recherche récursive mémoïsée d’une combinaison consommant exactement un budget ;
- résultat de rencontre séparé de l’affichage détaillé.

Il ne constitue cependant pas le moteur de spawn de Gargotte Adventure :

- il mélange les candidats avec `Math.random()` ;
- il s’appuie encore sur des budgets historiques par étage ;
- il retourne des définitions sélectionnées, pas des instances runtime persistées ;
- il compose une rencontre, tandis que le spawn doit seulement exécuter une demande.

Aucun code de Gargottex n’est copié ni modifié. Le Sprint 3.1 réutilise seulement la bonne séparation conceptuelle entre catalogue, composition et exécution.

## Séparation des responsabilités

```text
CreatureDefinition
    │
    │ décrit un archétype stable
    ▼
SpawnRequest
    │
    │ demande une ou plusieurs apparitions
    ▼
Moteur de spawn
    │
    ├─ valide la requête et la phase
    ├─ filtre les points candidats dans leur ordre déclaré
    ├─ crée des identifiants d'instance stables
    ├─ met à jour RoomState
    └─ produit des événements explicatifs
    ▼
CreatureInstance dans RoomState
```

Le moteur de spawn ne choisit pas seul la composition tactique d’une salle. Il exécute une demande produite par un scénario, le Brouhaha, un objet, un boss ou, plus tard, le générateur de rencontre du Sprint 5.

## Contrats implémentés

### `CreatureDefinition`

Définition stable issue du contenu éditorial :

- `id` d’archétype, par exemple `gobelin-bricoleur` ;
- nom ;
- points de vie maximum ;
- attaque, défense et portée ;
- blocage du déplacement.

Le schéma de contenu pilote ajoute également catégorie, menace et tags. Ces données prépareront le Sprint 4 et le futur générateur de rencontre, mais le moteur de spawn ne les interprète pas.

### `CreatureInstance`

État d’une créature réellement présente dans une salle :

- `id` runtime unique, qui joue le rôle d’`instanceId` dans l’architecture ;
- `creatureId` pointant vers `CreatureDefinition.id` ;
- position ;
- PV actuels ;
- état vivant ou hors combat ;
- statistiques runtime ;
- blocage du déplacement.

Deux Gobelins Bricoleurs partagent le même `creatureId`, mais possèdent deux `id` runtime différents.

### `InitialCreaturePlacement`

Le contenu d’une salle ne recopie plus les statistiques des ennemis initiaux. Il fournit uniquement :

- un identifiant d’instance initial ;
- un `creatureId` ;
- une position logique.

`createRoomState` résout ensuite la définition correspondante et construit l’instance complète.

### `SpawnPoint`

Point stable appartenant à la géométrie logique de la salle :

- identifiant ;
- position logique ;
- tags ;
- état activé ou désactivé.

Un point de spawn n’est pas une créature et n’est pas consommé automatiquement. La règle appelante décide s’il peut être réutilisé.

### `SpawnRequest`

Demande explicite et sérialisable :

- identifiant de requête ;
- source et identifiant du déclencheur ;
- `creatureId` ;
- quantité ;
- liste ordonnée de points candidats ;
- mode d’échec `all-or-nothing` ou `partial`.

### `SpawnResult`

Résultat pur comprenant :

- nouvel état de salle ;
- instances créées ;
- refus structurés ;
- événements tactiques explicatifs.

## État de salle version 2

`RoomState` conserve désormais :

- `spawnPoints` ;
- `processedSpawnRequestIds` ;
- `nextEnemyInstanceSequence` ;
- des ennemis portant un `creatureId` ;
- une version de format égale à `2`.

`processedSpawnRequestIds` protège contre la répétition accidentelle d’une même requête après un double clic, une reprise ou une nouvelle émission du déclencheur.

`nextEnemyInstanceSequence` produit des identifiants tels que `gobelin-bricoleur-spawn-1`. La séquence est persistée et saute tout identifiant déjà occupé.

## Algorithme d’apparition

Pour une requête valide, le moteur :

1. refuse une requête déjà traitée ;
2. vérifie que la quantité est un entier positif ;
3. refuse une salle en phase terminale ;
4. résout la `CreatureDefinition` ;
5. parcourt les identifiants de points dans l’ordre fourni ;
6. ignore et explique les doublons, points absents, désactivés, hors limites ou bloqués ;
7. applique le mode d’échec ;
8. crée les instances avec la séquence persistée ;
9. ajoute l’identifiant de requête à l’historique ;
10. retourne l’état, les instances, les refus et les événements.

Le mode `all-or-nothing` ne modifie jamais la salle si le nombre de points valides est insuffisant.

Le mode `partial` crée autant d’instances que possible, puis ajoute un refus expliquant le reliquat non créé.

## Invariants

1. À état, catalogue et requête identiques, le résultat est identique.
2. Aucun `Date.now()`, UUID aléatoire ou hasard implicite ne crée les identifiants.
3. Aucun `Math.random()` n’est utilisé dans le moteur de spawn.
4. Les identifiants proviennent d’une séquence monotone persistée dans la salle.
5. Une instance vivante ne peut pas apparaître hors limites.
6. Une instance bloquante ne peut pas apparaître sur une case bloquée ou occupée.
7. Une apparition totale refusée ne modifie pas l’état.
8. Chaque apparition ou refus produit un événement explicatif.
9. Les coordonnées restent des `GridPosition` logiques, indépendantes de la caméra.
10. Le moteur ne dépend ni du DOM, ni de PixiJS, ni d’IndexedDB.
11. Le renderer résout l’asset par `creatureId`, mais ne décide jamais de l’apparition.
12. Toute donnée ajoutée à `RoomState` est validée et sauvegardée.

## Événements implémentés

- `spawn-requested` ;
- `creature-instantiated` ;
- `spawn-succeeded` ;
- `spawn-rejected`.

Les événements contiennent selon leur nature la source, l’archétype, l’identifiant d’instance, la position, la quantité, le nombre disponible et les raisons du refus.

`reinforcement-triggered` n’est pas encore introduit. Il appartiendra à la règle de Brouhaha du Sprint 3.5, qui produira ensuite une `SpawnRequest`.

## Rapport avec le budget de menace

Le budget de menace est un **budget par salle**.

Il servira au générateur de rencontre du Sprint 5 pour composer la population initiale. Il ne s’agit pas d’un budget global d’étage.

Le moteur de spawn ne lit, ne dépense et ne valide aucun budget de menace. Les futurs renforts de Brouhaha pourront augmenter la menace runtime lorsque leur règle de déclenchement l’autorise explicitement.

## Contenu pilote Bastognac

Le paquet de contenu contient désormais :

- `creatures.json` avec Gobelin Bricoleur et Gobelin Lance-Tout ;
- une salle tactique de schéma version 2 ;
- deux instances initiales référençant le catalogue ;
- deux points de spawn à l’est ;
- un spawn scripté `renfort-controle-sprint-3-1`.

Le bouton de contrôle est une voie d’intégration temporaire et accessible. Il ne constitue pas encore un déclenchement de Brouhaha.

## Sauvegarde et migration

La sauvegarde tactique passe en version 2 et conserve :

- les `creatureId` ;
- les identifiants runtime ;
- les points de spawn ;
- les requêtes déjà traitées ;
- la prochaine séquence d’instance ;
- toutes les données tactiques précédentes.

Une sauvegarde tactique version 1 valide est migrée défensivement :

- la salle devient version 2 ;
- les points et requêtes traitées commencent vides ;
- la séquence commence à 1 ;
- l’ancien identifiant ennemi devient provisoirement son `creatureId`.

Cette migration préserve la reprise sans prétendre retrouver une définition éditoriale qui n’existait pas dans l’ancien format.

## Validation prévue dans la PR #34

- plusieurs instances du même archétype ;
- résultat identique pour les mêmes entrées ;
- ordre stable des points ;
- position occupée puis alternative ;
- rejet total sans mutation ;
- apparition partielle expliquée ;
- requête dupliquée ;
- quantité invalide, définition absente et salle terminale ;
- reprise du compteur persisté ;
- validation du catalogue et des références de contenu ;
- migration de sauvegarde version 1 ;
- restauration exacte après apparition ;
- rendu du sprite partagé via `creatureId` ;
- parcours Playwright desktop et mobile paysage.

## Préparation du Sprint 5

Le Sprint 5 produira des `RoomTemplate` et des `FloorPlan` comprenant leur géométrie, leurs connexions et leurs points de spawn. Le générateur de rencontre utilisera ensuite le budget propre à chaque salle pour produire des `SpawnRequest` initiales.

Le moteur de spawn restera l’exécutant générique de ces demandes. Il ne deviendra donc pas lui-même un générateur de donjon.
