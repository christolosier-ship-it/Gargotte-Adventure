# Structure du dépôt

## Règle générale

La structure suit les responsabilités réelles du projet. Aucun dossier vide n’est créé uniquement pour anticiper une fonctionnalité future.

Cette page distingue la structure présente sur la branche Sprint 3.1 des extensions prévues pour les sprints suivants.

## Arborescence active du Sprint 3.1

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
│           ├── scripted-spawn-controller.ts
│           ├── tactical-actions.ts
│           ├── persistence-controller.ts
│           ├── pwa-install.ts
│           ├── styles.css
│           └── theme.css
├── packages/
│   ├── audio/
│   ├── common/
│   ├── content-schema/
│   ├── engine/
│   │   └── src/tactical/
│   │       ├── spawn.ts
│   │       ├── spawn.test.ts
│   │       └── ...
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
│   │       └── index.ts
│   └── ui/
│       └── src/
├── content/
│   └── bastognac/
│       ├── manifest.json
│       ├── dungeon.json
│       ├── creatures.json
│       └── sprint-1-room.json
├── design/isometric/
├── tools/
│   ├── validators/
│   └── validate_repository.py
├── tests/e2e/
│   ├── helpers/
│   └── spawn.spec.ts
├── docs/
├── .github/
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

Le dossier racine `public/` n’est pas utilisé. La racine publique de Vite est `apps/game/public`.

## Responsabilités

### `apps/game`

Point de composition de la PWA.

- `main.ts` importe les styles et déclenche le bootstrap ;
- `bootstrap.ts` assemble les dépendances ;
- `bastognac.ts` valide le donjon, la salle, le catalogue pilote et décrit les assets ;
- `game-controller.ts` orchestre état, moteur, UI, renderer et sauvegarde ;
- `scripted-spawn-controller.ts` traduit un spawn de scénario en `SpawnRequest` et formate ses événements ;
- `tactical-actions.ts` crée les commandes accessibles dérivées de l’état ;
- `persistence-controller.ts` restaure la session et sérialise les écritures ;
- `pwa-install.ts` isole le cycle d’installation ;
- `theme.css` relie les tokens de conception aux variables du CSS.

Les règles de déplacement, combat, IA, spawn ou phase ne sont jamais réimplémentées dans cette couche.

### `packages/engine`

Contient la logique de jeu pure : état, grille, déplacement, ligne de vue, combat, tours, IA, spawn, événements et erreurs métier.

`src/tactical/spawn.ts` :

- valide une demande ;
- parcourt les points candidats dans un ordre stable ;
- crée les identifiants d’instance ;
- met à jour `RoomState` ;
- produit les événements et refus explicatifs.

Le moteur n’importe ni PixiJS, ni API navigateur, ni UI, ni IndexedDB.

### `packages/content-schema`

Définit les schémas Zod du contenu consommé par le jeu :

- manifeste ;
- donjon ;
- catalogue de créatures ;
- salle version 2 ;
- placements initiaux ;
- points de spawn ;
- scripts de spawn ;
- positions, unicité et collisions.

Le schéma pilote de `CreatureDefinition` sera enrichi au Sprint 4 sans déplacer la logique de spawn.

### `packages/renderer`

Traduit `RoomState` en plateau PixiJS 2D isométrique.

- `tabletop-renderer.ts` : cycle de vie PixiJS, caméra et reconstruction ;
- `catalog.ts` : contrat générique d’assets ;
- `projection.ts` : projection et fit caméra ;
- `view.ts` : rotation logique et murs physiques ;
- `scene/diagnostics.ts` : instrumentation E2E, y compris spawn ;
- `scene/environment.ts` : sols, obstacles et murs ;
- `scene/combatants.ts` : héros, créatures et résolution d’asset par `creatureId` ;
- `scene/room.ts` : composition d’une image de salle ;
- `index.ts` : API publique uniquement.

Le renderer ne décide jamais si une apparition est autorisée.

### `packages/ui`

Composants DOM accessibles : template, contrats, sélection des héros, HUD, boutons fixes, journal et mise à jour de la coque.

Les commandes tactiques variables restent dans l’application, car elles traduisent un état moteur en intentions utilisateur.

### `packages/save`

Persistance IndexedDB et validation profonde :

- état général de l’application ;
- salle tactique version 2 ;
- instances et `creatureId` ;
- points de spawn ;
- requêtes traitées ;
- compteur d’instances ;
- héros sélectionnés ;
- migration de la salle version 1 ;
- rejet des données incompatibles ou corrompues ;
- connexion IndexedDB réutilisée.

### `packages/common`

Socle minimal partagé : label de build et création d’identifiants pour les événements applicatifs.

La séquence d’instances ennemies reste dans le moteur tactique. Elle ne dépend pas de l’utilitaire général `createId`, qui utilise une autre finalité.

### `packages/audio`

Fondation inactive de réglages audio. Elle ne possède aucun consommateur applicatif et ne charge aucun média.

### `content/bastognac`

Contenu du vertical slice :

- `manifest.json` référence tous les fichiers du paquet ;
- `dungeon.json` décrit le donjon et conserve le placeholder historique `floorBudgets` ;
- `creatures.json` contient le catalogue pilote ;
- `sprint-1-room.json` décrit la salle, les placements, points et spawn de contrôle.

Ce dossier ne contient jamais l’état mutable d’une partie.

### `tools/validators`

Validation TypeScript hors bundle du jeu :

- paquet Bastognac ;
- catalogue de créatures ;
- références des placements et scripts ;
- manifeste runtime ;
- chemins, formats, dimensions et budgets d’assets.

### `tools/validate_repository.py`

Garde-fous transversaux :

- fichiers requis ;
- UTF-8 et fins de ligne ;
- motifs de secrets ;
- assets runtime ;
- frontières et cycles de packages ;
- taille des modules ;
- neutralité du renderer ;
- unicité de la racine publique ;
- cohérence des tokens ;
- complétude de l’index documentaire.

### `tests/e2e`

Parcours Playwright sur le build de production, en Chromium desktop et mobile paysage.

`helpers/canvas.ts` centralise la lecture de scène, la conversion logique-écran, le scroll, le clic ou toucher, les combattants, points de spawn, requêtes traitées et statuts d’assets.

`spawn.spec.ts` vérifie l’apparition du renfort, l’asset partagé, la disparition du bouton et la restauration exacte après rechargement.

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

`content-schema`, `common` et `audio` ne dépendent d’aucun autre package Gargotte. Aucun cycle n’est autorisé.

Gargottex n’est pas une dépendance du dépôt. Son code peut être étudié en lecture seule, mais il n’est ni importé, ni sous-module, ni package npm de Gargotte Adventure.

## Limites de taille

- `apps/game/src/main.ts` : 80 lignes maximum ;
- `packages/renderer/src/index.ts` : 120 lignes maximum ;
- autre module TypeScript de production : 350 lignes maximum.

Une limite dépassée conduit à extraire une responsabilité stable, pas à augmenter silencieusement le seuil.

Le contrôleur de spawn scripté a été séparé du contrôleur principal pour éviter que celui-ci absorbe les futures règles de Brouhaha.

## Extension cible du Sprint 5

La génération complète mérite une frontière distincte du moteur tactique, car elle produit des plans avant l’instanciation d’une salle.

Structure indicative :

```text
packages/generator/
└── src/
    ├── dungeon-generator.ts
    ├── floor-generator.ts
    ├── room-geometry-generator.ts
    ├── encounter-generator.ts
    ├── validation.ts
    ├── types.ts
    └── index.ts
```

Responsabilités :

- `dungeon-generator` : expédition et cinq étages ;
- `floor-generator` : graphe de salles et progression ;
- `room-geometry-generator` : dimensions, forme, murs, portes, zones et points de spawn ;
- `encounter-generator` : population initiale selon le budget propre à chaque salle ;
- `validation` : connectivité, limites, occupation et cohérence ;
- `types` : `DungeonPlan`, `FloorPlan`, `RoomTemplate` et `EncounterPlan`.

L’idée de recherche de combinaison exacte observée dans Gargottex pourra être adaptée dans `encounter-generator`, avec une seed explicite et sans modifier Gargottex.

Le plan généré sera validé puis transmis au moteur de salle et au moteur de spawn.

## Budget de menace

Le budget de menace appartient à `RoomTemplate` ou `EncounterGenerationRequest`.

Il n’est pas stocké comme un total unique consommé à l’échelle du `FloorPlan`. Un étage peut définir une courbe attribuant des budgets à ses salles, mais chaque `EncounterPlan` est calculé et validé séparément.

## Autres extensions cibles

```text
tools/
  content-importer/     conversion des exports Gargottex
  asset-pipeline/       optimisation industrielle des médias
```

Ces dossiers ne seront créés que lorsqu’un sprint les rend nécessaires.

## Nommage

- dossiers et fichiers techniques : `kebab-case` ;
- types et classes : `PascalCase` ;
- fonctions et variables : `camelCase` ;
- identifiants de contenu : minuscules avec tirets ;
- identifiants d’instance : stables, uniques et distincts des identifiants de contenu ;
- versions de schéma : entiers croissants ;
- branches : `sprint-N/sujet`, `feature/sujet`, `fix/sujet`, `refactor/sujet` ou `docs/sujet`.

## Fichiers générés

Chaque paquet généré doit indiquer source, date, version de schéma, empreinte et outil utilisé. Les sources humaines ne sont jamais écrasées automatiquement.
