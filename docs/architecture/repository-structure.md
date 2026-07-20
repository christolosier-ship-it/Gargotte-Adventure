# Structure du dépôt

## Règle générale

La structure doit suivre les responsabilités réelles du projet. Aucun dossier vide n’est créé uniquement pour ressembler à un gros studio.

## Arborescence cible

```text
Gargotte-Adventure/
├── apps/
│   └── game/
├── packages/
│   ├── engine/
│   ├── content-schema/
│   ├── renderer/
│   ├── ui/
│   ├── save/
│   ├── audio/
│   └── common/
├── tools/
│   ├── content-importer/
│   ├── asset-pipeline/
│   └── validators/
├── content/
│   └── bastognac/
├── tests/
├── docs/
│   ├── adr/
│   ├── architecture/
│   ├── product/
│   ├── security/
│   └── sprints/
└── .github/
```

## Responsabilités

### `apps/game`

Point d’entrée de la PWA. Assemble les packages, gère les routes, le cycle de vie de l’application, le service worker et la composition des écrans.

### `packages/engine`

Contient uniquement la logique de jeu pure :

- état de partie ;
- commandes ;
- résolution des actions ;
- IA ;
- Brouhaha ;
- effets ;
- événements de domaine.

Il ne doit importer ni PixiJS, ni API navigateur, ni composant UI.

### `packages/content-schema`

Définit les formats versionnés consommés par le jeu :

- schémas ;
- types TypeScript ;
- validation ;
- migration ;
- rapports d’erreurs.

### `packages/renderer`

Traduit l’état et les événements du moteur en plateau, pions, animations, particules et transitions visuelles.

### `packages/ui`

Composants DOM accessibles : menus, fiches, boutons, modales, HUD, réglages et tutoriel.

### `packages/save`

Persistance IndexedDB, profils, sauvegardes de campagne, migrations et export/import local.

### `packages/audio`

Chargement, mixage, réglages et déclenchement des ambiances, musiques et effets sonores.

### `tools/content-importer`

Transforme les exports Gargottex en paquets de contenu validés. Cet outil peut utiliser des scripts Node ou Python mais ne fait pas partie du bundle du jeu.

### `tools/asset-pipeline`

Optimise les images et sons, produit les variantes nécessaires et génère un manifeste déterministe.

### `content/bastognac`

Contenu compilé du premier donjon. Les fichiers générés portent leur version de schéma et leur provenance.

## Dépendances autorisées

```text
apps/game
  ├─► engine
  ├─► renderer
  ├─► ui
  ├─► save
  ├─► audio
  └─► content-schema

renderer ─► engine + common
ui       ─► engine + common
save     ─► engine + common
engine   ─► common
```

Le moteur ne dépend d’aucune autre couche applicative.

## Nommage

- dossiers et fichiers techniques : `kebab-case` ;
- types et classes : `PascalCase` ;
- fonctions et variables : `camelCase` ;
- identifiants de contenu : minuscules avec tirets ;
- versions de schéma : entiers croissants.

## Fichiers générés

Chaque dossier généré doit contenir un manifeste indiquant :

- source ;
- date de génération ;
- version de schéma ;
- empreinte des données ;
- outil et version utilisés.

Les sources humaines ne sont jamais écrasées par le pipeline.
