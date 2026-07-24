# Structure du dépôt

## Règle générale

La structure suit les responsabilités réelles du projet. Aucun dossier vide n'est créé uniquement pour anticiper une fonctionnalité future.

Cette page décrit l'état livré par le Sprint 3.5.

## Arborescence active

```text
Gargotte-Adventure/
├── apps/
│   └── game/
│       ├── public/assets/isometric/
│       └── src/
│           ├── main.ts
│           ├── bootstrap.ts
│           ├── bastognac.ts
│           ├── game-controller.ts
│           ├── game-controller-options.ts
│           ├── game-view.ts
│           ├── tactical-actions.ts
│           ├── brouhaha-controller.ts
│           ├── interactable-controller.ts
│           ├── scripted-spawn-controller.ts
│           ├── event-messages.ts
│           ├── persistence-controller.ts
│           ├── pwa-install.ts
│           ├── styles.css
│           └── theme.css
├── packages/
│   ├── audio/
│   ├── common/
│   ├── content-schema/
│   │   └── src/
│   │       ├── index.ts
│   │       ├── tactical-room.ts
│   │       ├── brouhaha.ts
│   │       ├── brouhaha-reinforcements.ts
│   │       ├── interactables.ts
│   │       └── chain-reactions.ts
│   ├── engine/
│   │   └── src/tactical/
│   │       ├── types.ts
│   │       ├── spawn.ts
│   │       ├── brouhaha.ts
│   │       ├── brouhaha-reinforcements.ts
│   │       ├── brouhaha-reinforcement-types.ts
│   │       ├── interactables.ts
│   │       ├── chain-reactions.ts
│   │       ├── chain-reaction-actions.ts
│   │       ├── chain-reaction-types.ts
│   │       ├── grid.ts
│   │       ├── combat.ts
│   │       ├── turn-machine.ts
│   │       ├── enemy-ai.ts
│   │       └── tests associés
│   ├── renderer/
│   │   └── src/
│   │       ├── scene/
│   │       ├── assets.ts
│   │       ├── catalog.ts
│   │       ├── projection.ts
│   │       ├── view.ts
│   │       ├── tabletop-renderer.ts
│   │       ├── types.ts
│   │       └── index.ts
│   ├── save/
│   │   └── src/
│   │       ├── schema.ts
│   │       ├── saved-room-schema.ts
│   │       ├── room-state-schema.ts
│   │       ├── brouhaha-reinforcement-schema.ts
│   │       ├── chain-reaction-schema.ts
│   │       ├── history-validation.ts
│   │       └── index.ts
│   └── ui/
│       └── src/
├── content/
│   └── bastognac/
│       ├── manifest.json
│       ├── dungeon.json
│       ├── creatures.json
│       ├── brouhaha-effects.json
│       ├── interactables.json
│       └── sprint-1-room.json
├── design/isometric/
├── tools/
│   ├── validators/
│   └── validate_repository.py
├── tests/e2e/
│   └── helpers/
├── docs/
├── .github/
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

La racine publique de Vite est `apps/game/public`. Le dossier racine `public/` n'est pas utilisé.

## Responsabilités

### `apps/game`

Point de composition de la PWA.

- `bootstrap.ts` assemble les dépendances ;
- `bastognac.ts` valide donjon, salle, catalogues et assets ;
- `game-controller.ts` orchestre état, moteur, UI, renderer et sauvegarde ;
- `brouhaha-controller.ts` adapte commandes et événements de Brouhaha et renfort ;
- `interactable-controller.ts` adapte les interactions d'objets ;
- `scripted-spawn-controller.ts` adapte les spawns de scénario ;
- `event-messages.ts` produit les phrases du journal ;
- `persistence-controller.ts` restaure et sérialise les écritures.

Cette couche transmet les règles de salle et catalogues, mais ne réimplémente aucune règle de déplacement, combat, IA, spawn, Brouhaha, objet, réaction, renfort ou phase.

### `packages/engine`

Logique de jeu pure : état, grille, déplacement, ligne de vue, combat, tours, IA, spawn, Brouhaha, objets, réactions, renforts, événements et erreurs.

Modules principaux du Sprint 3 :

- `spawn.ts` valide les points et crée les instances ;
- `brouhaha.ts` résout niveau, effets et historique ;
- `brouhaha-reinforcements.ts` détecte les seuils, applique les limites et délègue au spawn ;
- `interactables.ts` valide transitions, poussées et coûts ;
- `chain-reactions.ts` propage la file FIFO et calcule la phase terminale à la fin ;
- `enemy-ai.ts` capture et exécute un roster ennemi figé ;
- `types.ts` porte les contrats publics et `RoomState` version 6.

Le moteur n'importe ni PixiJS, ni API navigateur, ni UI, ni IndexedDB.

### `packages/content-schema`

Schémas Zod du contenu : manifeste, donjon, créatures, effets de Brouhaha, objets, réactions, salle tactique version 5, points, scripts de spawn et règles de renfort.

Le schéma contrôle positions, unicité, références, collisions, créatures de renfort, points candidats et limites d'activation.

### `packages/renderer`

Projection isométrique, caméra, picking, profondeur, environnement, combattants, assets et diagnostics E2E.

Le renderer ne décide jamais si une interaction, réaction, règle de seuil ou apparition est autorisée. Les diagnostics de renfort exposent uniquement l'état déjà calculé.

### `packages/ui`

Composants DOM accessibles : template, sélection des héros, HUD, boutons, journal et mise à jour de la coque.

### `packages/save`

Persistance IndexedDB et validation profonde :

- salle tactique version 6 ;
- héros, ennemis, objets et références ;
- points et demandes de spawn ;
- Brouhaha et historique ;
- réactions et causalité ;
- activations, résultats et séquence des renforts ;
- héros sélectionnés ;
- migrations depuis les versions 1 à 5 ;
- rejet des données incompatibles ou corrompues.

Les schémas d'historique sont isolés et la validation des séquences est mutualisée. Une migration ne déclenche aucune règle runtime.

### `packages/common`

Label de build et utilitaires génériques. Les séquences métier restent dans `RoomState` et ne dépendent pas de l'heure ou d'un UUID.

### `packages/audio`

Fondation inactive de réglages audio, sans média ni consommateur applicatif.

### `content/bastognac`

Contenu du vertical slice : donjon, créatures, effets, objets et salle pilote.

`sprint-1-room.json` décrit les placements, réactions, points, spawn de contrôle et deux règles pilotes de renfort. Ce dossier ne contient jamais l'état mutable d'une partie.

### `tools/validators`

Valide le paquet Bastognac, les catalogues, références, placements, scripts, réactions, renforts, manifeste runtime et budgets d'assets.

### `tools/validate_repository.py`

Contrôle fichiers requis, UTF-8, secrets, assets, frontières de packages, cycles, taille des modules, neutralité du renderer, racine publique, tokens et index documentaire.

### `tests/e2e`

Parcours Playwright sur le build de production, Chromium desktop et mobile paysage.

Les helpers centralisent scène, conversion logique-écran, combattants, objets, points de spawn, Brouhaha, réactions, renforts et assets.

## Dépendances autorisées

```text
apps/game
  ├─► common
  ├─► content-schema
  ├─► engine
  ├─► renderer
  ├─► ui
  └─► save

renderer ─► engine + common
ui       ─► engine
save     ─► engine
engine   ─► common
```

`content-schema`, `common` et `audio` ne dépendent d'aucun autre package Gargotte. Aucun cycle n'est autorisé.

Gargottex n'est pas une dépendance. Son code peut être étudié en lecture seule, mais il n'est ni importé, ni sous-module, ni package npm.

## Limites de taille

- `apps/game/src/main.ts` : 80 lignes maximum ;
- `packages/renderer/src/index.ts` : 120 lignes maximum ;
- autre module TypeScript de production : 350 lignes maximum.

Une limite dépassée conduit à extraire une responsabilité stable. La politique de renfort et ses contrats ont ainsi été isolés au lieu d'alourdir `brouhaha.ts`, `spawn.ts` ou `game-controller.ts`.

## Extension cible du Sprint 5

La génération complète mérite un paquet distinct produisant des plans avant l'instanciation : donjon, étages, géométrie, rencontres, validation et types.

Le générateur de rencontre utilisera le budget propre à chaque salle pour produire des plans ou `SpawnRequest` initiales. Le moteur de spawn restera l'exécutant.

## Budget de menace

Le budget appartient à une salle ou une demande de génération de rencontre. Il n'est pas stocké comme un total unique d'étage.

Les renforts ne lisent ni ne dépensent automatiquement ce budget.

## Nommage

- dossiers et fichiers : `kebab-case` ;
- types et classes : `PascalCase` ;
- fonctions et variables : `camelCase` ;
- identifiants de contenu : slugs ASCII en minuscules ;
- chemins d'assets : relatifs à `apps/game/public` ;
- documents de sprint : `sprint-N.md` ;
- audits : `docs/audits/<sujet>.md` ;
- ADR : `docs/adr/NNNN-<sujet>.md`.
