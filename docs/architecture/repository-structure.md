# Structure du dépôt

## Règle générale

La structure suit les responsabilités réelles du projet. Aucun dossier vide n’est créé uniquement pour anticiper une fonctionnalité future.

Cette page distingue :

- **la structure actuelle**, qui doit correspondre au dépôt ;
- **les extensions cibles**, créées seulement lorsqu’un sprint en a besoin.

## Arborescence actuelle

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
│           ├── shell-template.ts
│           ├── types.ts
│           └── index.ts
├── design/isometric/
├── tools/
│   ├── validators/
│   └── validate_repository.py
├── content/bastognac/
├── tests/e2e/
│   └── helpers/
├── docs/
│   ├── adr/
│   ├── architecture/
│   ├── audits/
│   ├── design/
│   ├── external/
│   ├── product/
│   ├── security/
│   └── sprints/
├── .github/
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

Le dossier racine `public/` n’est pas utilisé. La racine publique de Vite est `apps/game/public`.

## Responsabilités actuelles

### `apps/game`

Point de composition de la PWA.

- `main.ts` importe les styles et déclenche le bootstrap ;
- `bootstrap.ts` assemble les dépendances ;
- `bastognac.ts` valide le contenu et décrit les assets propres au donjon ;
- `game-controller.ts` orchestre état, moteur, UI et renderer ;
- `tactical-actions.ts` crée les commandes accessibles dérivées de l’état ;
- `persistence-controller.ts` restaure la session et sérialise les écritures ;
- `pwa-install.ts` isole le cycle d’installation ;
- `theme.css` relie les tokens de conception aux variables historiques du CSS.

Les règles de déplacement, combat, IA, spawn ou phase ne doivent jamais être réimplémentées dans cette couche.

### `packages/engine`

Contient la logique de jeu pure : état, grille, déplacement, ligne de vue, combat, tours, IA, événements et erreurs métier.

Le moteur de spawn du Sprint 3 appartiendra à cette frontière, car il transforme un `RoomState` par une intention métier et produit des événements. Il ne sera pas placé dans `apps/game` ni dans le renderer.

Le moteur ne doit importer ni PixiJS, ni API navigateur, ni UI, ni IndexedDB.

### `packages/content-schema`

Définit les schémas Zod du contenu consommé par le jeu : paquet, donjon, salle, positions, statistiques, unicité et collisions initiales.

Le Sprint 3.1 devra y définir ou valider les archétypes minimaux, les points de spawn et les données de scénario nécessaires. Le Sprint 4 enrichira les `CreatureDefinition` définitives.

### `packages/renderer`

Traduit `RoomState` en plateau PixiJS 2D isométrique.

- `tabletop-renderer.ts` : cycle de vie PixiJS, caméra et reconstruction ;
- `catalog.ts` : contrat générique d’assets fourni par l’application ;
- `projection.ts` : projection et fit caméra ;
- `view.ts` : rotation logique et murs physiques ;
- `scene/context.ts` : contexte partagé d’un rendu ;
- `scene/asset-sprite.ts` : chargement asynchrone ;
- `scene/diagnostics.ts` : instrumentation E2E ;
- `scene/primitives.ts` : formes et styles élémentaires ;
- `scene/environment.ts` : sols, obstacles et murs ;
- `scene/combatants.ts` : héros, ennemis et ombres ;
- `scene/room.ts` : composition d’une image de salle ;
- `index.ts` : API publique uniquement.

Le renderer ne décide jamais si une action ou une apparition est autorisée et ne connaît aucun identifiant de donjon.

Plusieurs instances d’un même archétype pourront partager la même référence d’asset sans que le renderer connaisse leur logique de création.

### `packages/ui`

Composants DOM accessibles : template, contrats, sélection des héros, HUD, boutons fixes, journal et mise à jour de la coque.

Les actions tactiques variables appartiennent à l’application, car elles traduisent l’état moteur en intentions utilisateur.

### `packages/save`

Persistance IndexedDB et validation profonde :

- état général de l’application ;
- salle tactique complète ;
- héros sélectionnés ;
- détection des anciennes sauvegardes ;
- rejet des données incompatibles ou corrompues ;
- connexion IndexedDB réutilisée.

Le Sprint 3.1 devra sauvegarder les identifiants d’instance, leur archétype, la séquence déterministe et les points de spawn si ces données entrent dans `RoomState`.

### `packages/common`

Socle minimal partagé : label de build et création d’identifiants.

La création des identifiants runtime déterministes ne doit pas devenir un utilitaire opaque dépendant de l’heure. Elle restera liée au contrat métier du moteur de spawn.

### `packages/audio`

Fondation inactive de réglages audio. Elle ne possède aucun consommateur applicatif et ne charge aucun média.

### `design/isometric`

Handoff graphique versionné : tokens JSON et CSS, gabarits, projection, pipeline runtime, sources artistiques et historique de conception.

`tokens.json` nourrit le renderer. `tokens.css` nourrit la présentation DOM. Leur cohérence est contrôlée automatiquement.

### `tools/validators`

Validation TypeScript hors bundle du jeu : contenu Bastognac, manifeste runtime, chemins, formats, dimensions et budgets.

Les futurs contenus de créatures, points de spawn, salles et plans générés devront être validés avant leur consommation.

### `tools/validate_repository.py`

Garde-fous transversaux sans dépendance tierce :

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

### `content/bastognac`

Contenu compilé du vertical slice : manifeste, définition du donjon et salle tactique. Les statistiques restent provisoires.

À terme, ce paquet contiendra ou référencera les définitions de créatures, règles de donjon, contraintes de génération, familles de salles et données nécessaires à Bastognac. Il ne contiendra pas l’état mutable d’une partie.

### `tests/e2e`

Parcours Playwright sur le build de production, en Chromium desktop et mobile paysage.

`tests/e2e/helpers/canvas.ts` centralise lecture de scène, conversion logique-écran, scroll, clic/toucher, attentes de héros et statuts d’assets.

Les tests futurs vérifieront la présence de plusieurs instances, les apparitions, les refus, la reprise et l’affichage partagé des assets.

### `docs/audits`

Rapports transversaux comparant l’état réel de `main` aux critères de sprint, décisions et risques architecturaux.

## Dépendances autorisées actuelles

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

Ces frontières sont vérifiées par `tools/validate_repository.py`.

## Limites de taille

Les fichiers principaux restent volontairement bornés :

- `apps/game/src/main.ts` : 80 lignes maximum ;
- `packages/renderer/src/index.ts` : 120 lignes maximum ;
- autre module TypeScript de production : 350 lignes maximum.

Une limite dépassée doit conduire à créer une responsabilité stable, pas à augmenter silencieusement le seuil.

## Extensions cibles du Sprint 3

Les noms précis seront validés pendant l’implémentation. La frontière attendue est la suivante :

```text
packages/engine/src/tactical/
├── spawn.ts              validation et création déterministe des instances
├── spawn.test.ts         cas de succès, refus, ordre et reproductibilité
└── types.ts              contrats runtime ou imports depuis un module dédié

packages/content-schema/src/
└── ...                   schémas des définitions et points de spawn

packages/save/src/
├── schema.ts             validation du nouvel état
└── migrations.ts         uniquement si une migration distincte devient nécessaire
```

Aucun dossier ne sera créé avant le premier code utile.

La séparation peut évoluer vers un sous-dossier `spawn/` si plusieurs responsabilités stables apparaissent, par exemple sélection des points, fabrique d’instances et événements. La limite de taille existante décidera, pas une arborescence décorative.

## Extension cible du Sprint 5

La génération complète mérite une frontière distincte du moteur tactique, car elle produit des plans avant l’instanciation d’une salle.

Structure cible indicative :

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

Dépendances cibles probables :

```text
apps/game ─► generator

generator ─► common + content-schema
engine    ─► common
```

Le générateur ne devra pas dépendre du renderer, de l’UI, d’IndexedDB ni du contrôleur applicatif.

Le plan généré sera validé puis transmis au moteur de salle et au moteur de spawn.

## Budget de menace dans l’architecture

Le budget de menace appartient à `RoomTemplate` ou `EncounterGenerationRequest`.

Il ne doit pas être stocké comme un total unique consommé à l’échelle du `FloorPlan`.

Un étage peut définir une courbe ou une politique attribuant des budgets à ses salles, mais chaque `EncounterPlan` est calculé et validé séparément.

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

Chaque plan généré de salle ou d’étage doit également conserver la seed, la version du générateur et les contraintes utilisées afin de rester reproductible.