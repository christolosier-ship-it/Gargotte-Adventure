# Architecture générale

## Vue d’ensemble

Gargotte Adventure est organisé en quatre couches :

1. **contenu** : définitions versionnées de héros, créatures, salles, obstacles, points de spawn et références d’assets ;
2. **moteur** : règles déterministes, déplacements, combat, tours, IA, instances, spawn et événements ;
3. **présentation** : plateau isométrique PixiJS, HUD et commandes DOM accessibles ;
4. **plateforme** : PWA, sauvegarde IndexedDB, validation, tests, build et déploiement.

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d’IndexedDB, ni d’un donjon particulier. Il reçoit un état et une intention, puis retourne un nouvel état, des événements de domaine ou une erreur métier typée.

## Flux principal

```text
Interaction joueur
      │
      ├─ toucher ou clic PixiJS
      └─ commande DOM accessible
              │
              ▼
      contrôleur apps/game
              │
              ▼
      validation dans le moteur
              │
      ┌───────┴────────┐
      ▼                ▼
 nouvel état      événements / erreur
      │
      ├─► projection et rendu isométrique PixiJS
      ├─► mise à jour du HUD
      ├─► journal d’événements
      └─► file de sauvegarde IndexedDB
```

Les interactions PixiJS et les commandes DOM utilisent les mêmes handlers. L’interface n’implémente donc pas une seconde version des règles.

## Flux des apparitions

```text
Scénario, Brouhaha, objet, boss ou générateur
                     │
                     ▼
                SpawnRequest
                     │
                     ▼
          moteur de spawn déterministe
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
 nouvel état de salle      événements / refus
         │
         ├─► rendu
         ├─► journal
         └─► sauvegarde
```

Le système déclencheur décide pourquoi une apparition est demandée. Le moteur de spawn décide seulement si la demande est valide, quels points candidats sont utilisables dans l’ordre déclaré et quelles instances sont créées.

Le moteur de spawn ne compose pas une rencontre et ne dépense aucun budget de menace.

## Flux de génération prévu au Sprint 5

```text
DungeonGenerationRequest + seed
              │
              ▼
      générateur d'étages
              │
              ▼
 FloorPlan avec salles reliées
              │
              ▼
 générateur géométrique de salle
              │
              ▼
 RoomTemplate + points de spawn
              │
              ▼
 budget de menace de la salle
              │
              ▼
 générateur de rencontre
              │
              ▼
 SpawnRequest initiales
              │
              ▼
 moteur de spawn
```

Le budget de menace est attaché à chaque salle. La progression d’un étage peut influencer les valeurs attribuées, mais un étage ne dispose pas d’un portefeuille global partagé entre toutes ses salles.

## État du Sprint 3.1

### Contenu

`apps/game/src/bastognac.ts` charge et valide :

- `content/bastognac/dungeon.json` ;
- `content/bastognac/creatures.json` ;
- `content/bastognac/sprint-1-room.json` ;
- le catalogue visuel propre à Bastognac.

Le catalogue pilote contient Gobelin Bricoleur et Gobelin Lance-Tout. La salle de schéma version 2 décrit :

- une grille 8 × 4 ;
- les obstacles ;
- les quatre héros officiels ;
- deux placements d’instances ennemies initiales ;
- deux points de spawn ;
- un renfort scripté de contrôle.

Les statistiques ennemies ne sont plus recopiées dans la salle. Chaque placement référence une `CreatureDefinition` par `creatureId`.

### Moteur

`packages/engine/src/tactical` contient :

- types d’état et positions ;
- limites, voisins et occupation de grille ;
- cheminement déterministe ;
- ligne de vue supercover ;
- combat et cibles attaquables ;
- machine de tour ;
- IA ennemie ;
- contrats définition, instance, point et requête de spawn ;
- moteur de spawn pur ;
- événements et erreurs métier.

Le moteur conserve exclusivement des coordonnées `GridPosition { column, row }`. Il ne connaît ni l’isométrie, ni les dimensions des tuiles, ni les assets.

Le spawn utilise une séquence monotone persistée. Il ne dépend ni de l’heure, ni d’un UUID, ni de `Math.random()`.

### Composition applicative

`apps/game/src/main.ts` reste un point d’entrée minimal. Les responsabilités sont distribuées :

- `bootstrap.ts` assemble contenu, UI, renderer, sauvegarde et contrôleur ;
- `game-controller.ts` traite les intentions et le cycle de jeu ;
- `scripted-spawn-controller.ts` adapte les spawns de scénario aux contrats du moteur et produit les messages lisibles ;
- `tactical-actions.ts` génère les commandes DOM dynamiques ;
- `persistence-controller.ts` restaure la session et sérialise les écritures ;
- `pwa-install.ts` gère l’installation ;
- `bastognac.ts` constitue la frontière entre le donjon et les composants génériques.

Le bouton de renfort de contrôle ne contient aucune règle de placement. Il transmet seulement l’identifiant du spawn scripté au contrôleur.

### Renderer isométrique

`packages/renderer` projette `RoomState` sur un plateau PixiJS 2D isométrique :

- projection grille vers écran et conversion inverse ;
- caméra responsive et rotation 0°, 90°, 180° et 270° ;
- picking par clic et toucher ;
- tri de profondeur déterministe ;
- murs arrière uniquement ;
- obstacles et combattants ancrés au sol ;
- overlays tactiques ;
- destruction des objets graphiques lors des reconstructions.

Le renderer reçoit un `TabletopAssetCatalog` fourni par l’application et ne décide jamais d’une apparition.

Pour un héros, l’asset est résolu par son `id`. Pour une créature, l’asset est résolu par `creatureId`, ce qui permet à plusieurs instances de partager la même texture mise en cache tout en conservant des identifiants runtime distincts.

Les diagnostics canvas exposent les points de spawn, les requêtes traitées, la prochaine séquence et le `creatureId` de chaque ennemi pour les tests navigateur.

### Sauvegardes

`packages/save` utilise une connexion IndexedDB réutilisée et des schémas Zod profonds.

La sauvegarde tactique version 2 conserve :

- l’état complet de la salle ;
- les instances et leurs `creatureId` ;
- les points de spawn ;
- les identifiants de requêtes déjà traitées ;
- la prochaine séquence d’instance ;
- les héros sélectionnés.

Une sauvegarde tactique version 1 valide est migrée défensivement vers la version 2. Les données incompatibles ou corrompues sont rejetées avant d’atteindre le moteur ou le renderer.

### Tests et plateforme

- Vitest pour moteur, contenu, renderer et sauvegarde ;
- Playwright sur build de production, desktop et mobile paysage ;
- scénario navigateur de renfort et restauration ;
- GitHub Actions pour qualité et validation ;
- garde-fous de frontières, tailles de modules, documentation, secrets et assets ;
- GitHub Pages pour la publication.

## Définitions, instances et plans

### Définition

Une définition éditoriale décrit ce qu’est une créature, un objet ou un type de salle. Elle est stable, versionnée et issue du contenu.

### Instance

Une instance décrit l’état mutable d’un élément présent dans une partie : identifiant runtime, référence à la définition, position, PV, état et effets.

### Plan généré

Un plan généré décrit une structure à instancier : topologie d’étage, géométrie de salle, connexions, points de spawn, obstacles et plan de rencontre.

Ces trois niveaux ne partagent pas le même objet mutable.

## Frontières externes

### Gargottex

Gargottex demeure la source de vérité éditoriale. Le dépôt `christolosier-ship-it/Gargotte-V5` a été consulté en lecture seule pour étudier son générateur de rencontres.

Aucun fichier de Gargottex n’est modifié, aucune dépendance runtime n’est créée et aucun code aléatoire n’est importé dans le moteur.

L’idée de combinaison exacte pourra être réévaluée au Sprint 5 pour le générateur de rencontre, avec un PRNG explicitement seedé et un budget propre à chaque salle.

### Google Drive

Drive conserve les règles humaines, le lore, les images maîtres, les tableaux de conception et les comptes rendus. Ces fichiers ne sont jamais chargés directement par la PWA.

### Figma et FigJam

Figma accueille les fondations visuelles. Le handoff versionné dans `design/isometric` reste la référence exploitable par le code.

### OpenAI API

L’API OpenAI peut assister des outils privés de préparation ou de QA. Elle ne fait pas partie de la boucle de jeu et ne doit jamais être appelée directement depuis la PWA publique.

## Structure actuelle du dépôt

```text
apps/game                 composition de la PWA et catalogue Bastognac
packages/engine           règles pures, état tactique et spawn
packages/content-schema   schémas du contenu
packages/renderer         projection, scène PixiJS et assets génériques
packages/ui               interface DOM accessible
packages/save             persistance, validation et migrations
packages/common           utilitaires partagés minimaux
packages/audio            fondation inactive
design/isometric          tokens, gabarits et handoff graphique
content/bastognac         donjon, catalogue de créatures et salle pilote
tools/validators          validation TypeScript du contenu
tools/validate_repository.py garde-fous du dépôt
tests/e2e                 parcours Playwright et helpers canvas
docs                      produit, architecture, audits, ADR et sprints
```

## Éléments non encore intégrés

- jauge de Brouhaha ;
- déclenchement automatique des renforts ;
- décor interactif et réactions en chaîne ;
- intégration audio réelle ;
- importeur complet Gargottex ;
- catalogue complet Bastognac ;
- compétences définitives ;
- générateurs de topologie, géométrie et rencontre ;
- campagne, loot et progression.

## Propriétés attendues

- moteur déterministe à entrée identique ;
- état sérialisable et versionné ;
- règles testables sans navigateur ;
- rendu indépendant des décisions métier ;
- sauvegardes validées avant utilisation ;
- packages sans cycles ;
- modules principaux de taille bornée ;
- aucun secret dans le client ;
- aucune dépendance runtime à Gargottex ;
- aucune dépendance 3D ou WebAssembly sans besoin mesuré.

## Diagramme

Le diagramme éditable de référence est disponible dans [FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9).
