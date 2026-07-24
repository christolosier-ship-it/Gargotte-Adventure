# Architecture du moteur de spawn

## Statut

- Cible initiale : Sprint 3.1
- État : livré dans `main`
- Issue : #33, clôturée
- Pull Request de livraison : #35, fusionnée
- Commit de fusion : `dd8c749f3afb73104270d87c9e920aab4e926bf3`
- Extension suivante : Sprint 3.5, renforts déclenchés par le Brouhaha

## Objectif

Le moteur de spawn ajoute des créatures à une salle déjà créée, pendant son initialisation ou en cours de partie, sans confondre la définition éditoriale d'une créature avec son état runtime.

Il constitue la fondation commune aux spawns de scénario, renforts de Brouhaha, boss et futures populations initiales générées.

## Étude de Gargottex en lecture seule

Le générateur du dépôt `christolosier-ship-it/Gargotte-V5` a été consulté sans aucune écriture.

Il fournit plusieurs idées utiles :

- filtrage des créatures par donjon et catégorie ;
- réutilisation possible du même archétype plusieurs fois ;
- recherche récursive mémoïsée d'une combinaison consommant exactement un budget ;
- résultat de rencontre séparé de l'affichage détaillé.

Il ne constitue cependant pas le moteur de spawn de Gargotte Adventure :

- il mélange les candidats avec `Math.random()` ;
- il s'appuie encore sur des budgets historiques par étage ;
- il retourne des définitions sélectionnées, pas des instances runtime persistées ;
- il compose une rencontre, tandis que le spawn exécute seulement une demande.

Aucun code de Gargottex n'est copié ni modifié.

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

Le moteur de spawn ne choisit pas seul la composition tactique d'une salle. Il exécute une demande produite par un scénario, le Brouhaha, un objet, un boss ou, plus tard, le générateur de rencontre du Sprint 5.

## Contrats implémentés

### `CreatureDefinition`

Définition stable issue du contenu éditorial :

- `id` d'archétype ;
- nom ;
- points de vie maximum ;
- attaque, défense et portée ;
- blocage du déplacement.

Le schéma pilote ajoute catégorie, menace et tags. Ces données prépareront le Sprint 4 et le futur générateur de rencontre, mais le moteur de spawn ne les interprète pas.

### `CreatureInstance`

État d'une créature réellement présente dans une salle :

- `id` runtime unique ;
- `creatureId` pointant vers `CreatureDefinition.id` ;
- position ;
- PV actuels ;
- état vivant ou hors combat ;
- statistiques runtime ;
- blocage du déplacement.

Deux Gobelins Bricoleurs partagent le même `creatureId`, mais possèdent deux identifiants runtime différents.

### `InitialCreaturePlacement`

Le contenu d'une salle fournit uniquement :

- un identifiant d'instance initial ;
- un `creatureId` ;
- une position logique.

`createRoomState` résout ensuite la définition correspondante et construit l'instance complète.

### `SpawnPoint`

Point stable appartenant à la géométrie logique de la salle :

- identifiant ;
- position logique ;
- tags ;
- état activé ou désactivé.

Un point de spawn n'est pas une créature et n'est pas consommé automatiquement. La règle appelante décide s'il peut être réutilisé.

### `SpawnRequest`

Demande explicite et sérialisable :

- identifiant de requête ;
- source et identifiant du déclencheur ;
- `creatureId` ;
- quantité ;
- liste ordonnée de points candidats ;
- mode d'échec `all-or-nothing` ou `partial`.

Le type de source `brouhaha` est déjà disponible. Le Sprint 3.5 l'utilisera sans modifier la responsabilité du moteur.

### `SpawnResult`

Résultat pur comprenant :

- nouvel état de salle ;
- instances créées ;
- refus structurés ;
- événements tactiques explicatifs.

## État de salle actuel

Les champs de spawn introduits dans `RoomState` version 2 sont toujours présents dans la version 5 actuelle :

- `spawnPoints` ;
- `processedSpawnRequestIds` ;
- `nextEnemyInstanceSequence` ;
- des ennemis portant un `creatureId`.

`processedSpawnRequestIds` protège contre la répétition accidentelle d'une même requête après un double clic, une reprise ou une nouvelle émission du déclencheur.

`nextEnemyInstanceSequence` produit des identifiants tels que `gobelin-bricoleur-spawn-1`. La séquence est persistée et saute tout identifiant déjà occupé.

## Algorithme d'apparition

Pour une requête valide, le moteur :

1. refuse une requête déjà traitée ;
2. vérifie que la quantité est un entier positif ;
3. refuse une salle en phase terminale ;
4. résout la `CreatureDefinition` ;
5. parcourt les identifiants de points dans l'ordre fourni ;
6. ignore et explique les doublons, points absents, désactivés, hors limites ou bloqués ;
7. applique le mode d'échec ;
8. crée les instances avec la séquence persistée ;
9. ajoute l'identifiant de requête à l'historique ;
10. retourne l'état, les instances, les refus et les événements.

Le mode `all-or-nothing` ne modifie jamais la salle si le nombre de points valides est insuffisant.

Le mode `partial` crée autant d'instances que possible, puis ajoute un refus expliquant le reliquat non créé.

Les objets bloquants et leurs états sont inclus dans l'occupation depuis le Sprint 3.3.

## Invariants

1. À état, catalogue et requête identiques, le résultat est identique.
2. Aucun `Date.now()`, UUID aléatoire ou hasard implicite ne crée les identifiants.
3. Aucun `Math.random()` n'est utilisé dans le moteur de spawn.
4. Les identifiants proviennent d'une séquence monotone persistée dans la salle.
5. Une instance vivante ne peut pas apparaître hors limites.
6. Une instance bloquante ne peut pas apparaître sur une case bloquée ou occupée.
7. Une apparition totale refusée ne modifie pas l'état.
8. Chaque apparition ou refus produit un événement explicatif.
9. Les coordonnées restent logiques, indépendantes de la caméra.
10. Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB.
11. Le renderer résout l'asset par `creatureId`, mais ne décide jamais de l'apparition.
12. Toute donnée ajoutée à `RoomState` est validée et sauvegardée.

## Événements implémentés

- `spawn-requested` ;
- `creature-instantiated` ;
- `spawn-succeeded` ;
- `spawn-rejected`.

Les événements contiennent selon leur nature la source, l'archétype, l'identifiant d'instance, la position, la quantité, le nombre disponible et les raisons du refus.

`reinforcement-triggered` appartient à la politique de Brouhaha du Sprint 3.5. Cette politique produira ensuite une `SpawnRequest` ordinaire.

## Rapport avec le budget de menace

Le budget de menace est un **budget par salle**.

Il servira au générateur de rencontre du Sprint 5 pour composer la population initiale. Il ne s'agit pas d'un budget global d'étage.

Le moteur de spawn ne lit, ne dépense et ne valide aucun budget de menace. Les renforts de Brouhaha pourront augmenter la menace runtime lorsque leur règle de seuil l'autorise explicitement.

## Contenu pilote Bastognac

Le paquet de contenu contient :

- `creatures.json` avec Gobelin Bricoleur et Gobelin Lance-Tout ;
- une salle tactique actuellement en schéma version 4 ;
- deux instances initiales référençant le catalogue ;
- deux points de spawn à l'est ;
- un spawn scripté de contrôle.

Le bouton de contrôle reste une voie d'intégration accessible. Le Sprint 3.5 devra démontrer les renforts automatiques sans dépendre de ce bouton.

## Sauvegarde et migration

La salle tactique actuelle utilise la sauvegarde version 5. Elle conserve les contrats de spawn introduits en version 2 :

- les `creatureId` ;
- les identifiants runtime ;
- les points de spawn ;
- les requêtes déjà traitées ;
- la prochaine séquence d'instance.

Les migrations successives préservent ces champs tout en ajoutant Brouhaha, objets et réactions en chaîne.

Le Sprint 3.5 prévoit une sauvegarde version 6 pour l'historique des règles de renfort. Les `SpawnRequest` déjà exécutées resteront protégées par le mécanisme existant.

## Validation livrée

Les tests couvrent notamment :

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
- migrations de sauvegarde ;
- restauration exacte après apparition ;
- rendu du sprite partagé via `creatureId` ;
- parcours Playwright desktop et mobile paysage.

## Préparation du Sprint 3.5

La politique détaillée est décrite dans [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

Elle doit :

- détecter les franchissements montants ;
- ordonner les règles ;
- appliquer les limites d'activation ;
- construire des identifiants déterministes ;
- soumettre les demandes au moteur existant ;
- historiser succès, apparition partielle ou refus ;
- ne jamais créer une instance directement.

## Préparation du Sprint 5

Le Sprint 5 produira des `RoomTemplate` et des `FloorPlan` comprenant leur géométrie, leurs connexions et leurs points de spawn. Le générateur de rencontre utilisera ensuite le budget propre à chaque salle pour produire des `SpawnRequest` initiales.

Le moteur de spawn restera l'exécutant générique de ces demandes. Il ne deviendra donc pas lui-même un générateur de donjon.
