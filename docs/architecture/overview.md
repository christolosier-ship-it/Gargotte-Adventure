# Architecture générale

## Vue d'ensemble

Gargotte Adventure est organisé en quatre couches :

1. **contenu** : définitions versionnées de héros, créatures, salles, objets, réactions, règles de renfort, points de spawn et assets ;
2. **moteur** : règles déterministes, déplacements, combat, tours, IA, Brouhaha, objets, réactions, renforts et spawn ;
3. **présentation** : plateau isométrique PixiJS, HUD et commandes DOM accessibles ;
4. **plateforme** : PWA, sauvegarde IndexedDB, validation, tests, build et déploiement.

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB, ni d'un donjon particulier. Il reçoit un état et une intention, puis retourne un nouvel état, des événements ou une erreur métier typée.

## Flux principal actuel

```text
Interaction joueur
      │
      ▼
contrôleur apps/game
      │
      ▼
validation moteur
      │
      ▼
action directe / objet
      │
      ▼
réactions FIFO
      │
      ▼
Brouhaha causal
      │
      ▼
renforts de seuil
      │
      ▼
phase terminale
      │
      ├─► rendu PixiJS
      ├─► HUD et journal
      └─► sauvegarde IndexedDB
```

Les interactions PixiJS et les commandes DOM utilisent les mêmes handlers. L'interface n'implémente aucune seconde version des règles.

## Flux des apparitions

```text
Scénario, seuil de Brouhaha, boss ou générateur
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
```

Le déclencheur décide pourquoi une apparition est demandée. Le moteur de spawn décide seulement si la demande est valide, quels points sont utilisables dans l'ordre déclaré et quelles instances sont créées.

Le moteur de spawn ne compose pas une rencontre et ne dépense aucun budget de menace.

## Flux des renforts du Sprint 3.5

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
SpawnRequest source brouhaha
        │
        ▼
moteur de spawn existant
        │
        ▼
historique réussi / partiel / refusé
```

La politique de renfort est séparée du Brouhaha et du spawn. Elle applique les limites de scénario, construit des identifiants déterministes et n'interprète aucun budget de menace.

Voir [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

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
 géométrie et points de spawn
              │
              ▼
 budget propre à chaque salle
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

Le budget de menace est attaché à chaque salle. Un étage ne dispose pas d'un portefeuille global partagé entre ses salles.

## État actuel après le Sprint 3.5

### Contenu

`apps/game/src/bastognac.ts` charge et valide les catalogues du donjon, des créatures, des effets, des objets et la salle pilote.

La salle tactique de schéma version 5 décrit :

- grille 8 × 4 et obstacles ;
- quatre héros et ennemis initiaux ;
- instances d'objets ;
- réactions en chaîne ;
- points et scripts de spawn ;
- règles de renfort de Brouhaha.

Les statistiques ennemies restent dans `CreatureDefinition`. Les objets suivent la même séparation définition/instance.

### Moteur

`packages/engine/src/tactical` contient :

- grille, cheminement et ligne de vue ;
- combat, machine de tour et IA ;
- contrats et moteur de spawn ;
- état et résolution du Brouhaha ;
- interactions, poussées et réactions ;
- politique et historique des renforts ;
- événements et erreurs métier.

Le moteur conserve exclusivement des coordonnées logiques. Les séquences de spawn, Brouhaha, interaction, réaction et renfort sont monotones et persistées.

### Composition applicative

- `bootstrap.ts` assemble contenu, UI, renderer, sauvegarde et contrôleur ;
- `game-controller.ts` traite les intentions et transmet les règles de salle ;
- `brouhaha-controller.ts` adapte les commandes et messages ;
- `interactable-controller.ts` adapte les interactions ;
- `scripted-spawn-controller.ts` adapte les spawns de scénario ;
- `event-messages.ts` traduit les événements ;
- `game-view.ts` prépare les données de présentation ;
- `persistence-controller.ts` sérialise les écritures ;
- `bastognac.ts` constitue la frontière du donjon.

### Renderer isométrique

`packages/renderer` projette `RoomState` sur un plateau PixiJS : caméra responsive, rotation, picking, profondeur, murs, environnement, objets, combattants, overlays et diagnostics.

Il reçoit un catalogue d'assets et ne décide jamais d'une interaction, réaction, règle de seuil ou apparition.

### Sauvegardes

`packages/save` utilise IndexedDB et des schémas Zod profonds.

La sauvegarde tactique version 6 conserve :

- état complet de la salle ;
- instances et références éditoriales ;
- points, demandes et séquences de spawn ;
- Brouhaha complet ;
- objets et réactions ;
- activations, résultats et séquence des renforts ;
- héros sélectionnés.

Les versions 1 à 5 sont migrées défensivement. Les données corrompues sont rejetées. La migration n'exécute aucune règle runtime.

### Tests et plateforme

- Vitest pour moteur, contenu, renderer et sauvegarde ;
- Playwright sur build de production, desktop et mobile paysage ;
- scénarios de spawn, Brouhaha, objets, réactions, renforts et restauration ;
- GitHub Actions pour qualité et validation ;
- GitHub Pages pour publication et contrôle HTTP.

## Définitions, instances et plans

- **Définition** : décrit une créature, un objet, un effet, une réaction ou une règle de salle.
- **Instance** : état mutable d'un élément réellement présent.
- **Plan généré** : structure à instancier, telle qu'une topologie, une géométrie ou une rencontre.

Ces trois niveaux ne partagent pas le même objet mutable.

## Frontières externes

### Gargottex

Gargottex demeure la source de vérité éditoriale. Le dépôt `christolosier-ship-it/Gargotte-V5` peut être consulté en lecture seule, mais n'est ni modifié ni importé comme dépendance runtime.

### Google Drive

Drive conserve les règles humaines, le lore, les médias maîtres et les comptes rendus. Ces fichiers ne sont jamais chargés directement par la PWA.

### Figma et FigJam

Figma accueille les fondations visuelles. Le handoff versionné dans `design/isometric` reste la référence exploitable par le code.

### OpenAI API

L'API OpenAI peut assister des outils privés de préparation ou de QA. Elle ne fait pas partie de la boucle de jeu et ne doit jamais être appelée depuis la PWA publique.

## Structure actuelle du dépôt

```text
apps/game                 composition de la PWA et catalogue Bastognac
packages/engine           règles pures et systèmes tactiques
packages/content-schema   schémas du contenu
packages/renderer         projection, scène PixiJS et assets
packages/ui               interface DOM accessible
packages/save             persistance, validation et migrations
packages/common           utilitaires partagés
packages/audio            fondation inactive
design/isometric          tokens, gabarits et handoff
content/bastognac         donjon, catalogues et salle pilote
tools/validators          validation du contenu et du dépôt
tests/e2e                 parcours Playwright
docs                      produit, architecture, audits, ADR et sprints
```

## Éléments non encore intégrés

- finition visuelle et audio du Sprint 3.6 ;
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
