# Structure du dépôt

## Règle générale

La structure suit les responsabilités réelles du projet. Aucun dossier vide n’est créé uniquement pour donner l’illusion d’un gros studio.

Cette page distingue volontairement :

- **la structure actuelle**, qui doit correspondre au dépôt ;
- **les extensions cibles**, qui ne seront créées que lorsqu’un sprint en aura besoin.

## Arborescence actuelle

```text
Gargotte-Adventure/
├── apps/
│   └── game/
│       ├── public/assets/isometric/
│       └── src/
├── packages/
│   ├── audio/
│   ├── common/
│   ├── content-schema/
│   ├── engine/
│   │   └── src/tactical/
│   ├── renderer/
│   ├── save/
│   └── ui/
├── design/
│   └── isometric/
├── tools/
│   └── validators/
├── content/
│   └── bastognac/
├── tests/
│   └── e2e/
├── docs/
│   ├── adr/
│   ├── architecture/
│   ├── audits/
│   ├── design/
│   ├── external/
│   ├── product/
│   ├── security/
│   └── sprints/
├── public/
├── .github/
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

## Responsabilités actuelles

### `apps/game`

Point d’entrée de la PWA. Il assemble les packages, charge le contenu Bastognac, gère le cycle de vie de l’application, le service worker, la sélection des héros et la persistance automatique.

`apps/game/src/main.ts` reste un orchestrateur. Les règles de déplacement, combat, IA ou phase ne doivent pas y être réimplémentées.

Le sous-dossier `apps/game/public/assets/isometric` contient les exports runtime SVG et WebP déclarés dans le manifeste d’assets.

### `packages/engine`

Contient la logique de jeu pure.

Le sous-dossier `src/tactical` regroupe actuellement :

- état de salle ;
- grille et occupation ;
- déplacements et cheminement ;
- ligne de vue ;
- combat ;
- machine de tour ;
- IA ennemie ;
- événements ;
- erreurs métier.

Il ne doit importer ni PixiJS, ni API navigateur, ni composant UI, ni IndexedDB.

### `packages/content-schema`

Définit les schémas Zod et les validations du contenu consommé par le jeu :

- dimensions de salle ;
- positions ;
- héros et ennemis ;
- statistiques ;
- unicité des identifiants ;
- absence de collisions initiales ;
- cohérence du paquet Bastognac.

### `packages/renderer`

Traduit `RoomState` en plateau PixiJS 2D isométrique :

- projection grille vers écran ;
- conversion inverse et picking ;
- caméra responsive ;
- tuiles, murs et obstacles ;
- héros et ennemis ;
- PV et surbrillances ;
- tri de profondeur ;
- occlusion des murs ;
- chargement, cache et fallback des assets ;
- événements de sélection.

Il ne décide jamais si une action est autorisée.

### `packages/ui`

Composants DOM accessibles :

- menu ;
- sélection des héros ;
- HUD ;
- boutons de phase ;
- commandes tactiques utilisables au clavier, à la souris et au toucher ;
- journal d’événements.

### `packages/save`

Persistance IndexedDB :

- état général de l’application ;
- sauvegarde complète de la salle tactique ;
- héros sélectionnés ;
- détection des anciennes sauvegardes ;
- rejet défensif des données incompatibles ou corrompues.

### `packages/common`

Types, constantes et utilitaires partagés qui ne relèvent pas directement des règles tactiques.

### `packages/audio`

Socle minimal déjà présent :

- type de réglages audio ;
- volume principal borné entre 0 et 1 ;
- état muet ;
- `AudioDirector` de configuration.

Ce package n’est pas encore importé par `apps/game`, ne charge aucun média et ne produit aucun son. Il constitue une fondation inactive, pas une fonctionnalité audio livrée.

### `design/isometric`

Handoff graphique versionné :

- tokens ;
- gabarits ;
- blueprint du plateau ;
- règles de projection, picking, profondeur et ancrage ;
- manifeste de conception ;
- documentation du pipeline runtime ;
- références artistiques.

Ce dossier complète Figma et reste exploitable même lorsque les droits ou quotas du service externe sont limités.

### `tools/validators`

Validation hors bundle du jeu :

- contenu Bastognac ;
- structure du dépôt ;
- encodage UTF-8 ;
- motifs courants de secrets ;
- cohérence des fichiers attendus ;
- manifeste, extensions, dimensions et budgets des assets ;
- absence de sources PNG, PDF ou PSD dans le runtime.

### `content/bastognac`

Contenu compilé du premier vertical slice, notamment :

- manifeste du paquet ;
- définition minimale du donjon ;
- scénario de salle du Sprint 1.

Les statistiques restent provisoires. Le moteur ne doit pas dépendre des noms ou identifiants spécifiques de Bastognac.

### `tests/e2e`

Parcours Playwright sur le build de production servi par Vite Preview.

Les projets couvrent :

- Chromium desktop ;
- format mobile paysage avec interactions tactiles ;
- sélection des héros ;
- déplacement par commandes DOM et canvas ;
- tour ennemi ;
- sauvegarde et reprise ;
- victoire ;
- manifeste et service worker ;
- caméra, picking et resize ;
- chargement des sprites et de l’environnement ;
- pannes réelles de textures et fallbacks.

### `docs/audits`

Rapports de contrôle transversaux qui comparent l’état réel de `main` à la roadmap, aux critères de sprint et aux décisions d’architecture.

## Dépendances autorisées

```text
apps/game
  ├─► engine
  ├─► renderer
  ├─► ui
  ├─► save
  ├─► common
  └─► contenu validé

renderer ─► engine + common
ui       ─► types partagés utiles
save     ─► types sérialisables du moteur
engine   ─► common
```

Le moteur ne dépend d’aucune couche applicative.

Le renderer dépend des types sérialisables du moteur, mais le moteur ne connaît ni le renderer, ni le manifeste d’assets.

`packages/audio` ne possède actuellement aucun consommateur applicatif. Une dépendance depuis `apps/game` ne sera ajoutée que lors d’une intégration audio testée.

## Extensions cibles

Ces dossiers sont prévus mais ne doivent être créés que lorsqu’un sprint les rend utiles :

```text
tools/
  content-importer/     conversion des exports Gargottex
  asset-pipeline/       optimisation industrielle des médias
```

Le registre et la validation runtime des assets isométriques existent déjà dans `packages/renderer` et `tools/validate_repository.py`. Un futur `tools/asset-pipeline` ne sera créé que pour automatiser une production plus importante.

L’intégration audio réelle, les médias sonores et le mixage restent également des cibles futures, mais le package `packages/audio` existe déjà comme fondation minimale.

D’autres packages ne seront ajoutés que si une responsabilité stable ne peut pas rester dans un module existant.

## Nommage

- dossiers et fichiers techniques : `kebab-case` ;
- types et classes : `PascalCase` ;
- fonctions et variables : `camelCase` ;
- identifiants de contenu : minuscules avec tirets ;
- versions de schéma : entiers croissants ;
- branches : `sprint-N/sujet`, `feature/sujet`, `fix/sujet` ou `docs/sujet`.

## Fichiers générés

Chaque paquet généré doit pouvoir indiquer :

- source ;
- date de génération ;
- version de schéma ;
- empreinte des données ;
- outil et version utilisés.

Les sources humaines ne sont jamais écrasées automatiquement par le pipeline.
