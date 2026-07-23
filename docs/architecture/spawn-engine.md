# Architecture du moteur de spawn

- Statut : cadrage approuvé
- Étape cible : Sprint 3.1
- Implémentation : non commencée

## Objectif

Le moteur de spawn doit ajouter des créatures à une salle déjà créée, en cours de partie ou lors de son initialisation, sans confondre la définition éditoriale d’une créature avec son état runtime.

Il constitue la première fondation du Sprint 3, car les seuils de Brouhaha devront pouvoir déclencher des renforts déterministes, explicables et sauvegardables.

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
    ├─ valide les règles et les positions
    ├─ crée des identifiants d'instance stables
    ├─ met à jour RoomState
    └─ produit des événements explicatifs
    ▼
CreatureInstance dans RoomState
```

Le moteur de spawn ne choisit pas seul la composition tactique d’une salle. Il exécute une demande produite par le scénario, le Brouhaha, un objet, un boss ou, plus tard, le générateur de rencontre du Sprint 5.

## Contrats cibles

### `CreatureDefinition`

Définition stable issue du contenu éditorial, à terme fournie par Gargottex :

- `id` d’archétype, par exemple `gobelin-bricoleur` ;
- nom ;
- catégorie et menace ;
- statistiques de base ;
- portée ;
- profil d’IA ;
- tags ;
- références d’assets ;
- éventuelles capacités.

Cette définition n’est pas modifiée pendant une partie.

### `CreatureInstance`

État d’une créature réellement présente dans une salle :

- `instanceId` unique dans l’expédition ;
- `creatureId` pointant vers `CreatureDefinition.id` ;
- position ;
- PV actuels ;
- état vivant ou hors combat ;
- blocage du déplacement ;
- modificateurs runtime éventuels ;
- données temporaires nécessaires à l’IA ou aux effets.

Deux Gobelins Bricoleurs partagent le même `creatureId`, mais possèdent deux `instanceId` différents.

### `SpawnPoint`

Point stable appartenant à la géométrie physique de la salle :

- identifiant ;
- position logique ;
- tags, par exemple `reinforcement`, `entry`, `edge`, `door` ou `boss` ;
- état activé ou désactivé ;
- contraintes éventuelles de taille ou de catégorie.

Un point de spawn n’est pas une créature et n’est pas consommé automatiquement. Les règles appelantes décident s’il peut être réutilisé.

### `SpawnRequest`

Demande explicite et sérialisable :

- identifiant de requête ;
- source ou déclencheur ;
- `creatureId` ;
- quantité ;
- points candidats ou politique de sélection ;
- ordre déterministe des candidats ;
- contexte éventuel de Brouhaha ;
- règle d’échec, par exemple rejet total ou apparition partielle.

### `SpawnResult`

Résultat pur comprenant :

- nouvel état de salle ;
- instances créées ;
- demandes rejetées ;
- événements de domaine ;
- explications de sélection ou d’échec.

## Invariants

1. À état et requête identiques, le résultat est identique.
2. Aucun `Date.now()`, UUID aléatoire ou hasard implicite ne crée les identifiants.
3. Les `instanceId` proviennent d’un compteur monotone ou d’une séquence déterministe persistée dans la salle.
4. Une instance vivante ne peut pas apparaître hors limites.
5. Une instance bloquante ne peut pas apparaître sur une case déjà bloquée.
6. Une apparition refusée ne modifie pas l’état.
7. Chaque apparition ou refus produit un événement explicatif.
8. Les coordonnées restent des `GridPosition` logiques, indépendantes de la caméra et du renderer.
9. Le moteur ne dépend ni du DOM, ni de PixiJS, ni d’IndexedDB.
10. Toute donnée ajoutée à `RoomState` est validée et sauvegardée.

## Sélection déterministe d’un point

L’ordre recommandé est :

1. filtrer les points autorisés par la demande ;
2. retirer les positions hors limites, désactivées ou occupées ;
3. appliquer les contraintes du déclencheur ;
4. trier selon une règle stable ;
5. sélectionner le premier candidat valide, ou utiliser un PRNG seedé explicitement lorsque la règle de jeu exige une variété reproductible.

Le moteur doit enregistrer la raison du choix. Il ne doit jamais masquer un tirage derrière un simple `Math.random()`.

## Événements cibles

- `spawn/requested` ;
- `spawn/succeeded` ;
- `spawn/rejected` ;
- `reinforcement/triggered` ;
- `creature/instantiated`.

Les noms définitifs seront figés pendant l’implémentation, mais chaque événement devra contenir au minimum la source, l’archétype, l’instance, la position et la raison.

## Rapport avec le budget de menace

Le budget de menace est un **budget par salle**.

Il sert au générateur de rencontre pour composer la population initiale d’une salle. Il ne s’agit pas d’un budget global d’étage.

Le moteur de spawn ne dépense pas automatiquement ce budget. Les renforts de Brouhaha peuvent augmenter la menace runtime au-delà de la composition initiale lorsque la règle de déclenchement l’autorise. Le système appelant doit alors fournir la justification et les limites applicables.

## Compatibilité avec l’état actuel

La salle actuelle contient directement des ennemis complets avec un identifiant unique. La première implémentation devra introduire la distinction `creatureId` / `instanceId` sans casser la salle pilote.

La stratégie documentaire retenue est :

- adapter les ennemis initiaux existants vers des instances ;
- conserver leurs identifiants actuels comme identifiants d’instance lors de la migration ;
- associer explicitement leur archétype avec `creatureId` ;
- versionner et migrer la sauvegarde si `RoomState` change ;
- rejeter proprement toute sauvegarde incohérente.

## Périmètre de l’étape Sprint 3.1

### Inclus

- contrats définition / instance ;
- points de spawn ;
- requêtes et résultats ;
- création déterministe des identifiants ;
- validation des positions ;
- événements explicatifs ;
- adaptation de la salle pilote ;
- sauvegarde et migration ;
- tests unitaires exhaustifs ;
- un scénario d’intégration avec renfort fixe.

### Exclus

- jauge de Brouhaha complète ;
- choix définitif des seize créatures ;
- équilibrage des catégories ;
- génération de géométrie ;
- génération de rencontre par budget ;
- vagues complexes ;
- animations et sons définitifs.

## Critères d’acceptation de l’implémentation future

- deux instances d’un même archétype peuvent coexister ;
- leurs identifiants restent uniques et reproductibles ;
- un point occupé est refusé sans mutation ;
- un point alternatif est sélectionné selon un ordre stable ;
- l’événement explique le résultat ;
- la sauvegarde restaure exactement les instances et le compteur ;
- les ennemis initiaux de Bastognac restent jouables ;
- le renderer affiche les instances sans connaître leurs règles de création ;
- desktop et mobile paysage restent fonctionnels ;
- aucune fonctionnalité du Brouhaha n’est requise pour valider cette fondation.

## Préparation du Sprint 5

Le Sprint 5 produira des `RoomTemplate` et des `FloorPlan` comprenant leur géométrie, leurs connexions et leurs points de spawn. Le générateur de rencontre utilisera ensuite le budget propre à chaque salle pour produire des `SpawnRequest` initiales.

Le moteur de spawn restera l’exécutant générique de ces demandes. Il ne deviendra donc pas lui-même un générateur de donjon.
