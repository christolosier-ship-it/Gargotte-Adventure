# Structure du dépôt

## Règle générale

La structure suit les responsabilités réellement implémentées. Aucun dossier vide n’est créé uniquement pour anticiper une fonctionnalité future.

Cette page décrit la base stabilisée par le Sprint 4.0 au commit `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf`.

## Arborescence active

```text
Gargotte-Adventure/
├── apps/game/
│   ├── public/assets/isometric/
│   └── src/
│       ├── bootstrap.ts
│       ├── game-controller.ts
│       ├── tactical-result-pipeline.ts
│       ├── presentation-controller.ts
│       ├── audio-settings.ts
│       ├── game-view.ts
│       ├── room-builder.ts
│       ├── brouhaha-controller.ts
│       ├── interactable-controller.ts
│       ├── scripted-spawn-controller.ts
│       ├── event-messages.ts
│       └── persistence-controller.ts
├── packages/
│   ├── audio/
│   ├── common/
│   ├── content-schema/
│   ├── engine/
│   ├── presentation/
│   ├── renderer/
│   ├── save/
│   └── ui/
├── content/bastognac/
├── design/isometric/
├── tools/
│   ├── validators/
│   ├── validate_repository.py
│   └── validate-repository-boundaries.test.ts
├── tests/e2e/
├── docs/
└── .github/
```

La racine publique de Vite est `apps/game/public`.

## Responsabilités

### `apps/game`

Point de composition de la PWA.

- `bootstrap.ts` assemble les dépendances ;
- `game-controller.ts` traite les intentions et conserve l’état courant ;
- `tactical-result-pipeline.ts` dérive la transition terminale de présentation et impose l’ordre rendu, présentation, persistance ;
- `presentation-controller.ts` relie routeur, renderer, audio et journal ;
- `audio-settings.ts` valide les préférences persistées ;
- `room-builder.ts` construit la salle pilote ;
- les contrôleurs spécialisés adaptent Brouhaha, objets et spawns ;
- `persistence-controller.ts` restaure et écrit les sauvegardes.

Cette couche orchestre, mais ne décide aucune règle tactique.

### `packages/engine`

Logique pure : état, grille, déplacement, ligne de vue, combat, tours, IA, spawn, Brouhaha, objets, réactions, renforts, événements et erreurs.

Le moteur ne dépend ni de PixiJS, ni du DOM, ni d’IndexedDB.

### `packages/presentation`

Routeur pur des événements tactiques vers :

- cues visuels ;
- cues audio ;
- journal groupé.

Il sélectionne les cues prioritaires sous plafond, puis restaure leur ordre causal. Il ne dépend que de `packages/engine`.

### `packages/renderer`

Projection isométrique, caméra, picking, profondeur, environnement, combattants, objets, couches transitoires, assets et diagnostics.

Il affiche l’état et les cues reçus sans recalculer de règle.

### `packages/audio`

Réglages, cache des lecteurs, autoplay, lecture locale, tonalités pilotes et fallbacks.

Une clé répétée arrête son lecteur actif avant redémarrage.

### `packages/ui`

Composants DOM accessibles : sélection, HUD, commandes, journal, réglages audio et statuts.

### `packages/save`

Persistance IndexedDB, validation profonde, migrations et sauvegarde tactique version 6.

Les cues visuels ou audio ne sont pas persistés.

### `packages/content-schema`

Schémas Zod du contenu : donjon, créatures, effets de Brouhaha, objets, réactions, salle tactique, points, spawns et règles de renfort.

### `packages/common`

Label de build et utilitaires génériques sans règle métier.

### `content/bastognac`

Contenu versionné du vertical slice. Il contient des définitions et placements éditoriaux, jamais l’état mutable d’une partie.

### `tools/validate_repository.py`

Contrôle notamment :

- fichiers requis et UTF-8 ;
- secrets potentiels ;
- assets runtime ;
- dépendances autorisées ;
- cycles de packages ;
- limites de taille ;
- neutralité du renderer ;
- index documentaire.

Le chemin racine peut être remplacé par `GARGOTTE_VALIDATION_ROOT` pour tester le validateur sur un dépôt temporaire.

### `tools/validate-repository-boundaries.test.ts`

Vérifie explicitement :

- `presentation → engine` autorisé ;
- `presentation → renderer` interdit.

### `tests/e2e`

Parcours Playwright sur le build de production, Chromium bureau et mobile paysage.

## Dépendances autorisées

```text
apps/game
  ├─ common
  ├─ content-schema
  ├─ engine
  ├─ presentation
  ├─ renderer
  ├─ audio
  ├─ ui
  └─ save

presentation ─► engine
renderer     ─► engine + common
ui           ─► engine
save         ─► engine
engine       ─► common
audio        ─► aucun package Gargotte
content-schema ─► aucun package Gargotte
common       ─► aucun package Gargotte
```

Aucun cycle n’est autorisé. `packages/presentation` est réellement couvert par le validateur automatisé.

## Limites de taille

- `apps/game/src/main.ts` : 80 lignes maximum ;
- `packages/renderer/src/index.ts` : 120 lignes maximum ;
- autre module TypeScript de production : 350 lignes maximum.

Une limite dépassée conduit à extraire une responsabilité stable. La pipeline de résultats tactiques a ainsi été isolée au Sprint 4.0 au lieu d’alourdir le contrôleur principal.

## Frontières externes

- Gargottex est une source éditoriale consultée en lecture seule ;
- Google Drive porte les décisions humaines et comptes rendus ;
- Figma et FigJam portent les références visuelles ;
- aucun de ces outils n’est une dépendance runtime de la PWA.

## Extension au Sprint 4.1

L’état d’expédition, les connexions des trois salles et la persistance inter-salles seront ajoutés seulement lorsque leurs responsabilités auront été définies. Ils devront s’appuyer sur les packages actuels sans contourner le moteur de spawn ou la pipeline de présentation.
