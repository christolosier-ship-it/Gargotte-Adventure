# Structure du dépôt

## Règle générale

La structure suit les responsabilités réelles du projet. Aucun dossier vide n'est créé uniquement pour anticiper une fonctionnalité future.

Cette page décrit l'état livré à la clôture du Sprint 3.

## Arborescence active

```text
Gargotte-Adventure/
├── apps/game/
│   ├── public/assets/isometric/
│   └── src/
│       ├── bootstrap.ts
│       ├── game-controller.ts
│       ├── game-view.ts
│       ├── presentation-controller.ts
│       ├── event-messages.ts
│       ├── persistence-controller.ts
│       ├── presentation.css
│       └── contrôleurs tactiques
├── packages/
│   ├── common/
│   ├── content-schema/
│   ├── engine/
│   ├── presentation/
│   │   └── src/
│   │       ├── types.ts
│   │       ├── router.ts
│   │       ├── router.test.ts
│   │       └── index.ts
│   ├── renderer/
│   │   └── src/
│   │       ├── scene/
│   │       ├── presentation-layer.ts
│   │       ├── tabletop-renderer.ts
│   │       └── projection, assets et types
│   ├── audio/
│   ├── ui/
│   └── save/
├── content/bastognac/
├── design/isometric/
├── tools/validators/
├── tests/e2e/
│   ├── helpers/
│   └── presentation.spec.ts
├── docs/
└── .github/
```

La racine publique de Vite est `apps/game/public`.

## Responsabilités

### `apps/game`

Point de composition de la PWA.

- `game-controller.ts` transmet les intentions au moteur ;
- `presentation-controller.ts` orchestre les sorties transitoires ;
- `game-view.ts` prépare l'état stable visible ;
- `event-messages.ts` produit les phrases compréhensibles ;
- `persistence-controller.ts` sérialise les écritures ;
- les contrôleurs spécialisés adaptent Brouhaha, objets et spawns.

Cette couche ne réimplémente aucune règle tactique.

### `packages/engine`

Logique pure : état, déplacement, combat, tours, IA, spawn, Brouhaha, objets, réactions, renforts, événements et erreurs.

Le moteur n'importe ni PixiJS, ni API navigateur, ni UI, ni IndexedDB.

### `packages/presentation`

Routeur pur des `TacticalEvent` vers :

- cues visuels ;
- cues audio ;
- journal groupé.

Il dépend du moteur pour les types d'événements, mais d'aucun adaptateur de sortie.

### `packages/renderer`

Projection isométrique, caméra, picking, scène, assets, couche transitoire et diagnostics.

Il expose son propre port `VisualPresentationCue` et ne dépend pas du package `presentation`.

### `packages/audio`

Lecture locale Web Audio, volume, mute, autoplay, cache et fallback. Il expose son propre port `AudioPresentationCue`.

### `packages/ui`

Coque DOM accessible, HUD, contrôles audio, journal groupé et port `JournalPresentationEntry`.

### `packages/save`

Persistance IndexedDB, sauvegarde tactique version 6, migrations et validation profonde. Les effets transitoires et préférences audio n'y sont pas stockés.

### `packages/content-schema`

Validation Zod des catalogues, salles, objets, réactions, Brouhaha, spawn et renforts.

### `packages/common`

Label de build et utilitaires génériques. Les séquences métier restent dans `RoomState`.

## Dépendances autorisées

```text
apps/game
  ├─► common
  ├─► content-schema
  ├─► engine
  ├─► presentation
  ├─► renderer
  ├─► audio
  ├─► ui
  └─► save

presentation ─► engine
renderer     ─► engine + common
audio        ─► aucun package Gargotte
ui           ─► engine
save         ─► engine
engine       ─► common
```

Les ports structurels évitent les dépendances inverses entre `presentation` et ses adaptateurs. Aucun cycle n'est autorisé.

## Validation

`tools/validate_repository.py` contrôle notamment :

- frontières et cycles de packages ;
- neutralité métier du renderer ;
- taille des modules ;
- fichiers et index requis ;
- secrets, UTF-8 et racine publique.

## Limites

- `apps/game/src/main.ts` : 80 lignes maximum ;
- `packages/renderer/src/index.ts` : 120 lignes maximum ;
- autre module TypeScript de production : 350 lignes maximum.

Une limite dépassée conduit à extraire une responsabilité stable.

## Frontières externes

Gargottex reste une source éditoriale consultée en lecture seule. Google Drive porte les règles humaines et comptes rendus, sans être chargé par la PWA.

## Extension future

Le Sprint 5 pourra ajouter un package de génération produisant topologie, géométrie et rencontres. Chaque salle conservera son propre budget de menace.
