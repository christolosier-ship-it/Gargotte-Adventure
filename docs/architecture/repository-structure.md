# Structure du dépôt

## Règle générale

La structure suit les responsabilités réellement implémentées. Aucun dossier vide n'est créé uniquement pour anticiper une fonctionnalité future.

Cette page décrit l'état livré après le Sprint 3.6 et les emplacements conceptuels à décider lors des lots 4.1 et 4.2.

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
│   ├── renderer/
│   ├── audio/
│   ├── ui/
│   └── save/
├── content/bastognac/
├── design/isometric/
├── tools/validators/
├── tests/e2e/
├── docs/
└── .github/
```

La racine publique de Vite est `apps/game/public`.

## Responsabilités actives

### `apps/game`

Point de composition de la PWA.

- transmet les intentions au moteur ;
- orchestre état stable, présentation et persistance ;
- prépare la vue accessible ;
- traduit les événements ;
- adapte Brouhaha, objets et spawns.

Cette couche ne réimplémente aucune règle tactique.

### `packages/engine`

Logique pure : état, déplacement, combat, tours, IA pilote, spawn, Brouhaha, objets, réactions, renforts, événements et erreurs.

Le moteur n'importe ni PixiJS, ni API navigateur, ni UI, ni IndexedDB.

### `packages/presentation`

Routeur pur des événements vers cues visuels, cues audio et journal groupé. Il dépend du moteur pour les types d'événements, mais d'aucun adaptateur de sortie.

### `packages/renderer`

Projection isométrique, caméra, picking, scène, assets, couche transitoire et diagnostics. Il ne décide aucune règle ou transition d'expédition.

### `packages/audio`

Lecture locale Web Audio, volume, mute, autoplay, cache et fallback.

### `packages/ui`

Coque DOM accessible, HUD, contrôles audio, journal groupé et futures vues d'expédition. Le mode diagnostic doit rester séparé du parcours joueur.

### `packages/save`

Persistance IndexedDB, sauvegarde tactique version 6, migrations et validation profonde. Les effets transitoires et préférences audio n'y sont pas stockés.

### `packages/content-schema`

Validation Zod des catalogues, salles, objets, réactions, Brouhaha, spawn et renforts.

Le Sprint 4.2 devra y définir les contrats des héros, compétences, profils, influences du Brouhaha et expédition, selon la stratégie d'implémentation retenue.

### `packages/common`

Label de build et utilitaires génériques. Les séquences métier restent dans les états qui les gouvernent.

## Dépendances documentées

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

## Réserve du validateur

`tools/validate_repository.py` contrôle actuellement des frontières, cycles, tailles de modules, fichiers requis, secrets, UTF-8 et racine publique.

Cependant, le package `presentation` n'est pas encore couvert par la table automatisée des dépendances autorisées. La documentation ne doit donc pas prétendre que ce package est déjà protégé par le validateur.

Le Sprint 4.0 doit :

- ajouter `presentation` à la politique automatisée ;
- autoriser uniquement sa dépendance attendue vers `engine` ;
- vérifier les dépendances interdites vers renderer, audio, UI ou save ;
- couvrir les cycles impliquant ce package ;
- ajouter les tests du validateur ;
- résoudre le fil P2 de la PR #60.

## Extension cible du Sprint 4

Le cadrage introduit conceptuellement :

- `ExpeditionDefinition` et `ExpeditionState` ;
- définitions et états de héros ;
- compétences ;
- profils de comportement ;
- influences du Brouhaha ;
- trois définitions de salles reliées ;
- objectifs et connexions ;
- vues de préparation et résultat ;
- mode diagnostic distinct.

Leur emplacement exact n'est pas décidé par cette page. Les lots 4.1 et 4.2 doivent choisir la structure la plus cohérente avec les responsabilités réelles, puis mettre à jour cette documentation et le validateur.

Aucun dossier, package ou fichier de production n'est créé dans le lot documentaire.

## Contraintes de structure du Sprint 4

- ne pas créer un package de génération ;
- ne pas placer les règles d'expédition dans le renderer ou l'UI ;
- ne pas dupliquer les moteurs tactiques dans `apps/game` ;
- ne pas coder les profils par nom de créature dans des contrôleurs dispersés ;
- conserver la validation de contenu dans `content-schema` ou une frontière équivalente explicitement documentée ;
- conserver la persistance dans `save` ;
- conserver les adaptateurs sans autorité tactique ;
- maintenir le fonctionnement offline-first.

## Limites de taille

- `apps/game/src/main.ts` : 80 lignes maximum ;
- `packages/renderer/src/index.ts` : 120 lignes maximum ;
- autre module TypeScript de production : 350 lignes maximum.

Une limite dépassée conduit à extraire une responsabilité stable, pas à créer un fourre-tout d'expédition ou d'IA.

## Tests et validation futurs

Le validateur devra couvrir toute nouvelle frontière réellement créée. Les tests du Sprint 4 vérifieront notamment :

- absence de cycles ;
- neutralité du renderer, de l'audio et de l'UI ;
- absence d'import de génération ;
- séparation entre définition, instance et placement ;
- absence de conditions nominatives dispersées pour l'IA ;
- sauvegarde et schémas dans leurs packages dédiés ;
- mode diagnostic séparé du parcours normal.

## Frontières externes

Gargottex reste une source éditoriale consultée en lecture seule. Google Drive porte les règles humaines et comptes rendus, sans être chargé par la PWA.

## Sprint 5

Le Sprint 5 pourra ajouter une responsabilité de génération produisant topologie, géométrie et rencontres. Chaque salle conservera son propre budget de menace. Cette extension ne doit pas être simulée au Sprint 4.
