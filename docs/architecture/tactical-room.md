# Architecture — Salle tactique

## Responsabilités

La salle tactique est divisée en cinq responsabilités :

1. **Contenu** (`content/bastognac` et `packages/content-schema`) : catalogue de créatures, géométrie logique, placements initiaux, points de spawn et scripts de contrôle.
2. **Moteur** (`packages/engine/src/tactical`) : grille, déplacements, ligne de vue, combat, tours, IA, instances, spawn, événements et erreurs métier.
3. **Renderer PixiJS** (`packages/renderer`) : projection isométrique de `RoomState`, transformation de vue, assets et remontée des intentions.
4. **UI DOM** (`packages/ui`) : sélection des héros, HUD, boutons de phase, rotation, commandes accessibles et journal.
5. **Sauvegarde** (`packages/save`) : persistance IndexedDB versionnée, migration et restauration défensive.

`apps/game/src/bootstrap.ts` assemble ces responsabilités. `game-controller.ts` traduit les intentions utilisateur, mais ne décide pas si un déplacement, une attaque, un spawn ou un changement de phase est valide.

## Contenu de salle version 2

La salle de contenu distingue désormais :

- les quatre héros et leurs statistiques provisoires ;
- les placements ennemis initiaux, limités à `id`, `creatureId` et position ;
- les obstacles ;
- les points de spawn ;
- les spawns scriptés de contrôle ;
- les dimensions et les notes.

Les définitions de créatures sont conservées dans `content/bastognac/creatures.json`. La salle ne duplique plus les statistiques de Gobelin Bricoleur et Gobelin Lance-Tout.

Les schémas Zod contrôlent notamment :

- unicité des identifiants d’instances ;
- unicité des points et scripts ;
- limites du plateau ;
- collisions initiales ;
- références des scripts vers des points existants ;
- références des placements et scripts vers le catalogue, via le validateur du paquet.

## `RoomState` version 2

`RoomState` contient :

- version `2` ;
- identifiant du scénario ;
- largeur et hauteur ;
- obstacles ;
- points de spawn ;
- identifiants des requêtes de spawn déjà traitées ;
- prochaine séquence d’instance ennemie ;
- héros ;
- instances ennemies ;
- héros actif ;
- phase ;
- numéro de tour.

L’état ne contient aucune coordonnée écran, texture, orientation de caméra ou référence PixiJS.

## Définitions et instances

### `CreatureDefinition`

Une définition décrit l’archétype stable : nom, statistiques de base et blocage. Le schéma de contenu pilote ajoute catégorie, menace et tags.

### `CreatureInstance`

Une instance ennemie possède :

- un `id` runtime unique ;
- un `creatureId` pointant vers la définition ;
- position, PV et statistiques runtime ;
- état vivant ;
- blocage du déplacement.

L’`id` runtime joue le rôle d’`instanceId` défini dans l’ADR-0007. Plusieurs instances peuvent partager le même `creatureId`.

`createRoomState` transforme les placements initiaux en instances complètes à partir du catalogue. Une définition absente provoque une erreur avant le démarrage de la salle.

## Spawn déterministe

Le moteur reçoit :

- l’état de salle ;
- le catalogue de définitions ;
- une `SpawnRequest`.

Il retourne un `SpawnResult` comprenant :

- le nouvel état ;
- les instances créées ;
- les refus structurés ;
- les événements explicatifs.

La demande contient une liste ordonnée d’identifiants de points. Le moteur conserve cet ordre et élimine les candidats absents, dupliqués, désactivés, hors limites ou bloqués.

Le mode `all-or-nothing` refuse sans mutation lorsque les positions valides sont insuffisantes. Le mode `partial` crée les instances possibles et explique le reliquat.

Une requête réussie est inscrite dans `processedSpawnRequestIds`. Elle ne peut donc pas être exécutée deux fois.

Les identifiants générés utilisent `nextEnemyInstanceSequence`, par exemple `gobelin-bricoleur-spawn-1`. Aucun temps système, UUID aléatoire ou `Math.random()` n’est utilisé.

Le moteur de spawn ne lit ni ne dépense le budget de menace. Ce budget appartient au futur générateur de rencontre et reste défini par salle.

## Renfort de contrôle

La salle pilote contient :

- `renfort-est-haut` en colonne 7, ligne 1 dans l’affichage humain ;
- `renfort-est-bas` en colonne 7, ligne 4 ;
- le script `renfort-controle-sprint-3-1`.

Une commande DOM temporaire permet d’exécuter ce script. Elle sert au contrôle d’intégration, à l’accessibilité et aux tests navigateur. Elle ne simule pas encore le Brouhaha.

Après un succès, le bouton disparaît parce que la requête est déjà traitée. Après rechargement, la sauvegarde restaure la même instance, le même historique et la même séquence.

## Phases

```text
heroes-turn
    │
    ├─ tous les héros vivants terminent
    ▼
enemy-turn
    │
    ├─ IA résolue
    ▼
heroes-turn du tour suivant

À tout moment :
- dernier ennemi hors combat → victory
- dernier héros hors combat  → defeat
```

Une phase terminale refuse toute nouvelle action tactique et toute apparition.

Le renfort de contrôle est disponible pendant `heroes-turn`. Les futurs déclenchements du Brouhaha préciseront leur point exact de résolution sans court-circuiter les transitions existantes.

## Activation des héros

- un héros vivant et non terminé peut être sélectionné ;
- un seul héros est actif à la fois ;
- changer de héros pendant une activation est interdit ;
- chaque héros commence avec trois actions ;
- une activation peut être terminée avant consommation des trois actions ;
- un héros terminé ne peut plus agir pendant ce tour ;
- lorsque tous les héros vivants ont terminé, la phase devient `enemy-turn`.

## Grille, déplacement et occupation

La salle pilote utilise une grille 8 × 4. Le moteur fournit :

- contrôle des limites ;
- voisins orthogonaux ;
- distance de Manhattan ;
- occupation par obstacles ou combattants ;
- cases atteignables ;
- chemin le plus court ;
- départage déterministe des chemins équivalents.

Un déplacement orthogonal d’une case coûte une action. Une intention invalide ne modifie pas l’état et ne consomme aucune action.

Le spawn réutilise les mêmes règles de limites et d’occupation. Une instance bloquante ne peut pas apparaître sur une case déjà bloquée.

## Ligne de vue et combat

La ligne de vue repose sur un algorithme supercover. Toutes les cases touchées par le segment entre attaquant et cible sont examinées, y compris les deux cases latérales lors du passage exact par un coin.

Une attaque valide vérifie phase, attaquant actif, action disponible, cible vivante, portée et visibilité.

Les dégâts restent déterministes :

```ts
const damage = Math.max(1, attacker.atk - target.def);
```

Les instances créées par le spawn utilisent ensuite exactement les mêmes fonctions de combat et d’IA que les ennemis initiaux.

## IA ennemie

Les ennemis sont résolus dans un ordre stable. Chaque ennemi cherche une case d’attaque libre, se déplace si nécessaire, attaque lorsqu’il le peut ou attend avec une explication structurée.

Le moteur d’IA utilise l’identifiant runtime de l’instance. Deux créatures du même archétype restent donc indépendantes.

## Présentation isométrique

Le renderer distingue :

1. espace logique de `RoomState` ;
2. espace physique de salle ;
3. espace de vue après rotation ;
4. espace écran après projection et fit responsive.

La rotation 0°, 90°, 180° ou 270° ne modifie jamais les coordonnées logiques, les points de spawn ni la sauvegarde.

Le renderer résout :

- les héros par leur `id` ;
- les ennemis par leur `creatureId`.

Ainsi, toutes les instances de Gobelin Bricoleur partagent l’asset `character.gobelin-bricoleur` sans perdre leur identité runtime.

Le canvas expose pour les tests :

- positions logiques et de vue ;
- `creatureId` des ennemis ;
- points de spawn ;
- requêtes traitées ;
- prochaine séquence d’instance ;
- murs, caméra et états d’assets.

## Sauvegarde

La sauvegarde tactique version 2 contient :

- héros sélectionnés ;
- état complet de la salle ;
- instances et `creatureId` ;
- points de spawn ;
- requêtes traitées ;
- prochaine séquence ;
- positions, PV, actions, phase et tour.

Une sauvegarde tactique version 1 valide est migrée défensivement. Les anciennes instances reçoivent temporairement leur ancien `id` comme `creatureId`, les points et requêtes commencent vides et la séquence repart à 1.

Les données corrompues, incompatibles ou incohérentes sont rejetées avant le moteur et le renderer.

## Tests du Sprint 3.1

### Unitaires

- plusieurs instances du même archétype ;
- ordre stable des points ;
- point occupé puis alternative ;
- apparition totale ou partielle ;
- refus sans mutation ;
- requête dupliquée ;
- séquence persistée et collision d’identifiant ;
- catalogue et références de contenu ;
- migration et corruption de sauvegarde ;
- compatibilité des tours, déplacements, combat et IA.

### Playwright

- entrée dans la salle ;
- présence des deux points ;
- exécution du renfort fixe ;
- création de `gobelin-bricoleur-spawn-1` ;
- rendu par l’asset partagé ;
- disparition du bouton traité ;
- rechargement ;
- restauration exacte de l’instance, de la requête et de la séquence ;
- desktop et mobile paysage.

## Hors périmètre actuel

- jauge de Brouhaha ;
- seuils déclenchant automatiquement des renforts ;
- objets interactifs ;
- réactions en chaîne ;
- génération de rencontre par budget ;
- génération géométrique ;
- bestiaire définitif ;
- vagues complexes.
