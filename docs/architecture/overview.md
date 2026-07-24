# Architecture générale

## Vue d'ensemble

Gargotte Adventure est organisé en quatre couches :

1. **contenu** : définitions versionnées de héros, créatures, salles, objets, réactions, points de spawn et références d'assets ;
2. **moteur** : règles déterministes, déplacements, combat, tours, IA, Brouhaha, objets, réactions et spawn ;
3. **présentation** : plateau isométrique PixiJS, HUD et commandes DOM accessibles ;
4. **plateforme** : PWA, sauvegarde IndexedDB, validation, tests, build et déploiement.

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB, ni d'un donjon particulier. Il reçoit un état et une intention, puis retourne un nouvel état, des événements de domaine ou une erreur métier typée.

## Flux principal actuel

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
              ▼
      action directe et objet éventuel
              │
              ▼
      réactions en chaîne FIFO
              │
              ▼
      demandes de Brouhaha causales
              │
      ┌───────┴────────┐
      ▼                ▼
 nouvel état      événements / erreur
      │
      ├─► projection et rendu isométrique PixiJS
      ├─► mise à jour du HUD
      ├─► journal d'événements
      └─► file de sauvegarde IndexedDB
```

Les interactions PixiJS et les commandes DOM utilisent les mêmes handlers. L'interface n'implémente donc pas une seconde version des règles.

## Flux des apparitions

```text
Scénario, futur seuil de Brouhaha, boss ou générateur
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

Le système déclencheur décide pourquoi une apparition est demandée. Le moteur de spawn décide seulement si la demande est valide, quels points candidats sont utilisables dans l'ordre déclaré et quelles instances sont créées.

Le moteur de spawn ne compose pas une rencontre et ne dépense aucun budget de menace.

## Flux cible des renforts du Sprint 3.5

```text
BrouhahaRequest acceptée
        │
        ▼
previousLevel → level
        │
        ▼
franchissements montants
        │
        ▼
politique de renfort de la salle
        │
        ▼
SpawnRequest avec source brouhaha
        │
        ▼
moteur de spawn existant
        │
        ▼
historique de renfort
        │
        ▼
calcul de la phase terminale
```

La politique de renfort sera une frontière séparée du moteur de Brouhaha et du moteur de spawn. Elle appliquera les limites de scénario, construira des identifiants déterministes et n'interprétera aucun budget de menace.

La spécification se trouve dans [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

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

Le budget de menace est attaché à chaque salle. La progression d'un étage peut influencer les valeurs attribuées, mais un étage ne dispose pas d'un portefeuille global partagé entre toutes ses salles.

## État actuel après le Sprint 3.4

### Contenu

`apps/game/src/bastognac.ts` charge et valide :

- `content/bastognac/dungeon.json` ;
- `content/bastognac/creatures.json` ;
- `content/bastognac/brouhaha-effects.json` ;
- `content/bastognac/interactables.json` ;
- `content/bastognac/sprint-1-room.json` ;
- le catalogue visuel propre à Bastognac.

La salle tactique de schéma version 4 décrit :

- une grille 8 × 4 ;
- les obstacles ;
- les quatre héros officiels ;
- les placements ennemis initiaux ;
- les instances d'objets ;
- les réactions en chaîne ;
- les points et scripts de spawn.

Les statistiques ennemies ne sont pas recopiées dans la salle. Chaque placement référence une `CreatureDefinition` par `creatureId`. Les objets suivent la même séparation entre définition et instance.

### Moteur

`packages/engine/src/tactical` contient :

- limites, voisins et occupation de grille ;
- cheminement déterministe ;
- ligne de vue supercover ;
- combat et cibles attaquables ;
- machine de tour et IA ennemie ;
- contrats et moteur de spawn ;
- état et résolution du Brouhaha ;
- interactions d'objets et poussées ;
- réactions en chaîne, causalité et garde-fous ;
- événements et erreurs métier.

Le moteur conserve exclusivement des coordonnées logiques. Il ne connaît ni l'isométrie, ni les dimensions des tuiles, ni les assets.

Les séquences de spawn, Brouhaha, interaction et réaction sont monotones et persistées. Elles ne dépendent ni de l'heure, ni d'un UUID, ni de `Math.random()`.

### Composition applicative

`apps/game/src/main.ts` reste un point d'entrée minimal. Les responsabilités sont distribuées :

- `bootstrap.ts` assemble contenu, UI, renderer, sauvegarde et contrôleur ;
- `game-controller.ts` traite les intentions et le cycle de jeu ;
- `brouhaha-controller.ts` adapte les commandes de Brouhaha ;
- `interactable-controller.ts` adapte les interactions d'objets ;
- `scripted-spawn-controller.ts` adapte les spawns de scénario ;
- `event-messages.ts` traduit les événements sans décider des règles ;
- `game-view.ts` prépare les données de présentation ;
- `persistence-controller.ts` restaure la session et sérialise les écritures ;
- `bastognac.ts` constitue la frontière entre le donjon et les composants génériques.

### Renderer isométrique

`packages/renderer` projette `RoomState` sur un plateau PixiJS 2D isométrique :

- projection grille vers écran et conversion inverse ;
- caméra responsive et rotation à quatre orientations ;
- picking par clic et toucher ;
- tri de profondeur déterministe ;
- murs arrière uniquement ;
- environnement, objets et combattants ancrés au sol ;
- overlays tactiques et diagnostics ;
- destruction des objets graphiques lors des reconstructions.

Le renderer reçoit un catalogue d'assets fourni par l'application et ne décide jamais d'une interaction, d'une réaction ou d'une apparition.

### Sauvegardes

`packages/save` utilise une connexion IndexedDB réutilisée et des schémas Zod profonds.

La sauvegarde tactique version 5 conserve :

- l'état complet de la salle ;
- les instances et leurs références éditoriales ;
- les points et demandes de spawn ;
- le niveau et l'historique du Brouhaha ;
- les objets et demandes d'interaction ;
- l'historique causal des réactions ;
- toutes les séquences nécessaires à une reprise exacte ;
- les héros sélectionnés.

Les sauvegardes versions 1 à 4 sont migrées défensivement. Les données incompatibles ou corrompues sont rejetées avant d'atteindre le moteur ou le renderer.

Le Sprint 3.5 prévoit une version 6 ajoutant l'historique et la séquence des renforts sans rejouer les anciens seuils.

### Tests et plateforme

- Vitest pour moteur, contenu, renderer et sauvegarde ;
- Playwright sur build de production, desktop et mobile paysage ;
- scénarios de spawn, Brouhaha, objets, réactions et restauration ;
- GitHub Actions pour qualité et validation ;
- garde-fous de frontières, tailles de modules, documentation, secrets et assets ;
- GitHub Pages pour la publication et le contrôle HTTP.

## Définitions, instances et plans

### Définition

Une définition éditoriale décrit ce qu'est une créature, un objet, un effet, une réaction ou une règle de salle. Elle est stable, versionnée et issue du contenu.

### Instance

Une instance décrit l'état mutable d'un élément présent dans une partie : identifiant runtime, référence à la définition, position, PV, état et effets.

### Plan généré

Un plan généré décrit une structure à instancier : topologie d'étage, géométrie de salle, connexions, points de spawn, obstacles et plan de rencontre.

Ces trois niveaux ne partagent pas le même objet mutable.

## Frontières externes

### Gargottex

Gargottex demeure la source de vérité éditoriale. Le dépôt `christolosier-ship-it/Gargotte-V5` peut être consulté en lecture seule.

Aucun fichier de Gargottex n'est modifié, aucune dépendance runtime n'est créée et aucun code aléatoire n'est importé dans le moteur.

### Google Drive

Drive conserve les règles humaines, le lore, les images maîtres, les tableaux de conception et les comptes rendus. Ces fichiers ne sont jamais chargés directement par la PWA.

### Figma et FigJam

Figma accueille les fondations visuelles. Le handoff versionné dans `design/isometric` reste la référence exploitable par le code.

### OpenAI API

L'API OpenAI peut assister des outils privés de préparation ou de QA. Elle ne fait pas partie de la boucle de jeu et ne doit jamais être appelée directement depuis la PWA publique.

## Structure actuelle du dépôt

```text
apps/game                 composition de la PWA et catalogue Bastognac
packages/engine           règles pures, état tactique et systèmes du Sprint 3
packages/content-schema   schémas du contenu
packages/renderer         projection, scène PixiJS et assets génériques
packages/ui               interface DOM accessible
packages/save             persistance, validation et migrations
packages/common           utilitaires partagés minimaux
packages/audio            fondation inactive
design/isometric          tokens, gabarits et handoff graphique
content/bastognac         donjon, catalogues et salle pilote
tools/validators          validation TypeScript du contenu
tools/validate_repository.py garde-fous du dépôt
tests/e2e                 parcours Playwright et helpers canvas
docs                      produit, architecture, audits, ADR et sprints
```

## Éléments non encore intégrés

- renforts automatiques de Brouhaha ;
- intégration audio réelle ;
- importeur complet Gargottex ;
- catalogue complet Bastognac ;
- compétences et équilibrage définitifs ;
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
