# Structure du dépôt

## Règle générale

La structure suit les responsabilités réelles du projet. Aucun dossier vide n'est créé uniquement pour anticiper une fonctionnalité future.

Cette page décrit l'état de `main` après le Sprint 3.4 et distingue les extensions prévues pour le Sprint 3.5.

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
│   │       ├── brouhaha.ts
│   │       ├── interactables.ts
│   │       └── chain-reactions.ts
│   ├── engine/
│   │   └── src/tactical/
│   │       ├── types.ts
│   │       ├── spawn.ts
│   │       ├── brouhaha.ts
│   │       ├── interactables.ts
│   │       ├── chain-reactions.ts
│   │       ├── chain-reaction-types.ts
│   │       ├── grid.ts
│   │       ├── combat.ts
│   │       ├── turns.ts
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

Le dossier racine `public/` n'est pas utilisé. La racine publique de Vite est `apps/game/public`.

## Responsabilités

### `apps/game`

Point de composition de la PWA.

- `main.ts` importe les styles et déclenche le bootstrap ;
- `bootstrap.ts` assemble les dépendances ;
- `bastognac.ts` valide le donjon, la salle, les catalogues et les assets ;
- `game-controller.ts` orchestre état, moteur, UI, renderer et sauvegarde ;
- `game-controller-options.ts` isole le contrat de construction du contrôleur ;
- `brouhaha-controller.ts` transforme les commandes de démonstration en demandes moteur ;
- `interactable-controller.ts` adapte les interactions d'objets et leurs événements ;
- `scripted-spawn-controller.ts` traduit un spawn de scénario en `SpawnRequest` ;
- `event-messages.ts` produit les phrases du journal sans décider des règles ;
- `game-view.ts` prépare les données de présentation ;
- `tactical-actions.ts` crée les commandes accessibles dérivées de l'état ;
- `persistence-controller.ts` restaure la session et sérialise les écritures ;
- `pwa-install.ts` isole le cycle d'installation ;
- `theme.css` relie les tokens de conception aux variables du CSS.

Les règles de déplacement, combat, IA, spawn, Brouhaha, objet, réaction ou phase ne sont jamais réimplémentées dans cette couche.

### `packages/engine`

Contient la logique de jeu pure : état, grille, déplacement, ligne de vue, combat, tours, IA, spawn, Brouhaha, objets, réactions, événements et erreurs métier.

Principaux modules du Sprint 3 :

- `spawn.ts` valide les points candidats et crée les instances ;
- `brouhaha.ts` résout niveau, effets et historique ;
- `interactables.ts` valide les transitions, poussées et coûts d'action ;
- `chain-reactions.ts` propage les conséquences dans une file FIFO ;
- `chain-reaction-types.ts` décrit les causes et l'historique persistant ;
- `types.ts` porte les contrats publics et `RoomState` version 5.

Le moteur n'importe ni PixiJS, ni API navigateur, ni UI, ni IndexedDB.

### `packages/content-schema`

Définit les schémas Zod du contenu consommé par le jeu :

- manifeste ;
- donjon ;
- catalogue de créatures ;
- catalogue d'effets de Brouhaha ;
- catalogue d'objets interactifs ;
- salle tactique version 4 ;
- placements initiaux ;
- points et scripts de spawn ;
- réactions en chaîne ;
- positions, unicité, références et collisions.

Le Sprint 3.5 prévoit une salle version 5 ajoutant les règles de renfort. Aucun fichier ou dossier anticipatif n'est créé avant l'implémentation.

### `packages/renderer`

Traduit `RoomState` en plateau PixiJS 2D isométrique.

- `tabletop-renderer.ts` : cycle de vie PixiJS, caméra et reconstruction ;
- `catalog.ts` : contrat générique d'assets ;
- `projection.ts` : projection et fit caméra ;
- `view.ts` : rotation logique et murs physiques ;
- `scene/diagnostics.ts` : instrumentation E2E des systèmes tactiques ;
- `scene/environment.ts` : sols, obstacles, murs et objets ;
- `scene/combatants.ts` : héros, créatures et résolution d'asset par `creatureId` ;
- `scene/room.ts` : composition d'une image de salle ;
- `index.ts` : API publique uniquement.

Le renderer ne décide jamais si une interaction, réaction ou apparition est autorisée.

### `packages/ui`

Composants DOM accessibles : template, contrats, sélection des héros, HUD, boutons, journal et mise à jour de la coque.

Les commandes tactiques variables restent dans l'application, car elles traduisent un état moteur en intentions utilisateur sans porter la règle métier.

### `packages/save`

Persistance IndexedDB et validation profonde :

- état général de l'application ;
- salle tactique version 5 ;
- héros, ennemis, objets et références éditoriales ;
- points et demandes de spawn ;
- Brouhaha et historique ;
- interactions d'objets et séquence ;
- réactions en chaîne, causalité et séquence ;
- héros sélectionnés ;
- migrations depuis les versions 1 à 4 ;
- rejet des données incompatibles ou corrompues ;
- connexion IndexedDB réutilisée.

Le Sprint 3.5 prévoit une version 6 pour l'historique des renforts. La migration ne devra déclencher aucune règle runtime.

### `packages/common`

Socle minimal partagé : label de build et utilitaires génériques.

Les séquences métier restent dans `RoomState`. Elles ne dépendent pas d'un identifiant créé depuis l'heure ou un UUID.

### `packages/audio`

Fondation inactive de réglages audio. Elle ne possède aucun consommateur applicatif et ne charge aucun média.

### `content/bastognac`

Contenu du vertical slice :

- `manifest.json` référence tous les fichiers du paquet ;
- `dungeon.json` décrit le donjon et conserve le placeholder historique `floorBudgets` ;
- `creatures.json` contient le catalogue pilote ;
- `brouhaha-effects.json` contient les effets universels et Bastognac ;
- `interactables.json` contient les cinq familles d'objets ;
- `sprint-1-room.json` décrit la salle, les placements, réactions, points et spawn de contrôle.

Ce dossier ne contient jamais l'état mutable d'une partie.

### `tools/validators`

Validation TypeScript hors bundle du jeu :

- paquet Bastognac ;
- catalogues et références ;
- placements, scripts et réactions ;
- manifeste runtime ;
- chemins, formats, dimensions et budgets d'assets.

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
- complétude de l'index documentaire.

### `tests/e2e`

Parcours Playwright sur le build de production, en Chromium desktop et mobile paysage.

Les helpers centralisent lecture de scène, conversion logique-écran, clic ou toucher, combattants, objets, points de spawn, Brouhaha, réactions et statuts d'assets.

Les scénarios couvrent la boucle tactique, les apparitions, les interactions, les réactions en chaîne, la sauvegarde et la reprise.

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

Gargottex n'est pas une dépendance du dépôt. Son code peut être étudié en lecture seule, mais il n'est ni importé, ni sous-module, ni package npm de Gargotte Adventure.

## Limites de taille

- `apps/game/src/main.ts` : 80 lignes maximum ;
- `packages/renderer/src/index.ts` : 120 lignes maximum ;
- autre module TypeScript de production : 350 lignes maximum.

Une limite dépassée conduit à extraire une responsabilité stable, pas à augmenter silencieusement le seuil.

La future politique de renfort devra être isolée dans un module dédié, au lieu d'alourdir `brouhaha.ts`, `spawn.ts` ou `game-controller.ts`.

## Extension prévue du Sprint 3.5

Structure indicative, à créer seulement pendant l'implémentation :

```text
packages/engine/src/tactical/
├── brouhaha-reinforcements.ts
├── brouhaha-reinforcement-types.ts
└── brouhaha-reinforcements.test.ts

packages/content-schema/src/
└── brouhaha-reinforcements.ts
```

Responsabilités :

- détection des franchissements montants ;
- ordre stable des règles ;
- limites d'activation ;
- création des `SpawnRequest` ;
- historique persistant ;
- événements de renfort ;
- aucune logique d'occupation dupliquée hors du moteur de spawn.

## Extension cible du Sprint 5

La génération complète mérite une frontière distincte du moteur tactique, car elle produit des plans avant l'instanciation d'une salle.

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

Le générateur de rencontre utilisera le budget propre à chaque salle pour produire des plans ou `SpawnRequest` initiales. Le moteur de spawn restera l'exécutant des demandes.

## Budget de menace

Le budget de menace appartient à `RoomTemplate` ou `EncounterGenerationRequest`.

Il n'est pas stocké comme un total unique consommé à l'échelle du `FloorPlan`. Un étage peut définir une courbe attribuant des budgets à ses salles, mais chaque rencontre est calculée et validée séparément.

Les renforts du Sprint 3.5 ne lisent ni ne dépensent automatiquement ce budget.

## Nommage

- dossiers et fichiers techniques : `kebab-case` ;
- types et classes : `PascalCase` ;
- fonctions et variables : `camelCase` ;
- identifiants de contenu : minuscules avec tirets ;
- identifiants d'instance : stables, uniques et distincts des identifiants de contenu ;
- versions de schéma : entiers croissants ;
- branches : `sprint-N/sujet`, `feature/sujet`, `fix/sujet`, `refactor/sujet` ou `docs/sujet`.

## Fichiers générés

Chaque paquet généré doit indiquer source, date, version de schéma, empreinte et outil utilisé. Les sources humaines ne sont jamais écrasées automatiquement.
