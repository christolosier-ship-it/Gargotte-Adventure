# Architecture générale

## Vue d’ensemble

Gargotte Adventure est organisé en quatre couches :

1. **contenu** : données versionnées de héros, créatures, salles, obstacles et références d’assets ;
2. **moteur** : règles déterministes, déplacements, combat, tours, IA et événements ;
3. **présentation** : plateau isométrique PixiJS, HUD et commandes DOM accessibles ;
4. **plateforme** : PWA, sauvegarde IndexedDB, validation, tests, build et déploiement.

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d’IndexedDB, ni d’un donjon particulier. Il reçoit un état et une intention, puis retourne un nouvel état, des événements de domaine ou une erreur métier typée.

## Flux principal

```text
Interaction joueur
      │
      ├─ toucher ou clic PixiJS
      └─ commande DOM accessible
              │
              ▼
      contrôleur apps/game
              │
              ▼
      validation dans le moteur
              │
      ┌───────┴────────┐
      ▼                ▼
 nouvel état      événements / erreur
      │
      ├─► projection et rendu isométrique PixiJS
      ├─► mise à jour du HUD
      ├─► journal d’événements
      └─► file de sauvegarde IndexedDB
```

Les interactions PixiJS et les commandes DOM utilisent les mêmes handlers. L’interface n’implémente donc pas une seconde version des règles.

## État actuel après le désendettement pré-Sprint 3

### Contenu

`apps/game/src/bastognac.ts` charge et valide au runtime de développement comme en production :

- `content/bastognac/dungeon.json` ;
- `content/bastognac/sprint-1-room.json` ;
- le catalogue visuel propre à Bastognac.

Le scénario définit une grille 8 × 4, les obstacles, les quatre héros officiels, deux gobelins provisoires et les positions initiales. Les schémas Zod empêchent qu’un contenu invalide atteigne le contrôleur.

### Moteur

`packages/engine/src/tactical` contient :

- types d’état et positions ;
- limites, voisins et occupation de grille ;
- cheminement déterministe ;
- ligne de vue supercover ;
- combat et cibles attaquables ;
- machine de tour ;
- IA ennemie ;
- événements et erreurs métier.

Le moteur conserve exclusivement des coordonnées `GridPosition { column, row }`. Il ne connaît ni l’isométrie, ni les dimensions des tuiles, ni les assets.

### Composition applicative

`apps/game/src/main.ts` est un point d’entrée minimal. Les responsabilités sont distribuées :

- `bootstrap.ts` assemble contenu, UI, renderer, sauvegarde et contrôleur ;
- `game-controller.ts` traite les intentions et le cycle de jeu ;
- `tactical-actions.ts` génère les commandes DOM dynamiques ;
- `persistence-controller.ts` restaure la session et sérialise les écritures ;
- `pwa-install.ts` gère l’installation ;
- `bastognac.ts` constitue la frontière entre le donjon et les composants génériques.

Cette séparation évite que les futures mécaniques Brouhaha et décor interactif soient ajoutées directement dans le point d’entrée.

### Renderer isométrique

`packages/renderer` projette `RoomState` sur un plateau PixiJS 2D isométrique :

- projection grille vers écran et conversion inverse ;
- tuiles 128 × 64 ;
- caméra responsive et centrage ;
- rotation 0°, 90°, 180° et 270° ;
- hit areas polygonales ;
- picking par clic et toucher ;
- tri de profondeur déterministe ;
- murs arrière uniquement ;
- obstacles et combattants ancrés au point de contact au sol ;
- overlays atteignable, sélectionné, attaquable et bloqué ;
- destruction des objets graphiques lors des reconstructions.

Le renderer est générique. Il reçoit un `TabletopAssetCatalog` fourni par l’application et ne contient aucun identifiant de donjon, de héros ou de créature.

Son implémentation est séparée entre :

- cycle de vie PixiJS et caméra ;
- catalogue ;
- contexte de scène ;
- diagnostics ;
- chargement asynchrone des sprites ;
- primitives ;
- environnement ;
- combattants ;
- composition de salle.

Les couches actives sont : fond, sol, murs arrière, objets et interface canvas. Une couche vide n’est pas conservée par anticipation.

### Pipeline d’assets

Le renderer utilise un pipeline versionné :

- manifeste runtime `apps/game/public/assets/isometric/manifest.json` ;
- validation Zod des identifiants, catégories, formats, dimensions, ancrages, orientations et budgets ;
- registre `IsometricAssetRegistry` ;
- résolution directe, omnidirectionnelle ou miroir ;
- cache de texture par URL publique ;
- fallbacks non bloquants ;
- libération des textures lors de la destruction ;
- chemins compatibles avec le sous-répertoire GitHub Pages ;
- précache PWA des fichiers SVG et WebP.

Le manifeste pilote contient notamment ombre au sol, fallbacks techniques, effet d’impact de contrôle, Brünhilda, Gobelin Bricoleur, deux sols, deux orientations de mur et un tonneau.

Les formes PixiJS locales constituent le dernier niveau de secours jouable. Les assets déclarés servent de textures optimisées et de références de résolution.

### UI

`packages/ui` fournit la coque DOM accessible, le sélecteur de héros, le HUD, les boutons de phase et le journal. Le template HTML, les contrats TypeScript et la logique de mise à jour sont séparés.

Les commandes tactiques variables selon l’état restent dans `apps/game/src/tactical-actions.ts`, car elles traduisent un état moteur en intentions applicatives.

### Sauvegardes

`packages/save` utilise une connexion IndexedDB réutilisée et des schémas Zod profonds. Le chargement vérifie notamment versions, coordonnées, combattants, PV, actions, occupation, héros actif et sélection de l’équipe.

Les données incompatibles ou corrompues sont rejetées avant d’atteindre le moteur ou le renderer. L’application sérialise les écritures successives pour empêcher les courses entre autosauvegardes.

### Fondation audio

`packages/audio` reste un socle minimal de réglages et d’`AudioDirector`. Il n’est pas encore connecté à la boucle de jeu et ne charge aucun média sonore.

### Plateforme

- PWA Vite installable et offline-first ;
- sauvegardes IndexedDB versionnées ;
- Vitest pour moteur, contenu, renderer et sauvegarde ;
- Playwright sur build de production, desktop et mobile paysage ;
- helpers canvas mutualisés ;
- GitHub Actions pour qualité et déploiement ;
- validation automatique des frontières de packages, tailles de modules, tokens, documentation, secrets et assets ;
- GitHub Pages pour la publication.

## Projection de référence

Pour une case logique `(column, row)` :

```text
screenX = originX + (column - row) × tileWidth / 2
screenY = originY + (column + row) × tileHeight / 2
```

Le gabarit retenu est une tuile 128 × 64, soit un ratio 2:1.

## Frontières externes

### Gargottex

Gargottex demeure la source de vérité éditoriale. À terme, le jeu consommera des paquets normalisés, validés et versionnés issus de Gargottex.

### Google Drive

Drive conserve les règles humaines, le lore, les images maîtres, les tableaux de conception et les comptes rendus. Ces fichiers ne sont jamais chargés directement par la PWA.

### Figma et FigJam

Figma accueille les fondations visuelles. Le handoff versionné dans `design/isometric` reste la référence exploitable par le code. Les tokens CSS de ce dossier sont chargés par le runtime et leur cohérence avec les tokens JSON est contrôlée.

### OpenAI API

L’API OpenAI peut assister des outils privés de préparation ou de QA. Elle ne fait pas partie de la boucle de jeu et ne doit jamais être appelée directement depuis la PWA publique.

## Structure actuelle du dépôt

```text
apps/game                 composition de la PWA et catalogue Bastognac
packages/engine           règles pures et état de partie
packages/content-schema   schémas du contenu
packages/renderer         projection, scène PixiJS et assets génériques
packages/ui               interface DOM accessible
packages/save             persistance et validation des sauvegardes
packages/common           utilitaires partagés minimaux
packages/audio            fondation inactive
design/isometric          tokens, gabarits et handoff graphique
content/bastognac         contenu du vertical slice
tools/validators          validation TypeScript du contenu
tools/validate_repository.py garde-fous du dépôt
tests/e2e                 parcours Playwright et helpers canvas
docs                      produit, architecture, audits, ADR et sprints
```

## Éléments cibles non encore intégrés

- Brouhaha et décor interactif ;
- intégration audio réelle ;
- importeur complet Gargottex ;
- pipeline industriel d’optimisation des médias ;
- catalogue complet Bastognac ;
- compétences définitives ;
- campagne, loot et progression.

Ils seront ajoutés uniquement lorsqu’un sprint leur fournit un comportement utile et testé.

## Propriétés attendues

- moteur déterministe à entrée identique ;
- état sérialisable et versionné ;
- règles testables sans navigateur ;
- rendu indépendant des décisions métier ;
- sauvegardes validées avant utilisation ;
- packages sans cycles ;
- modules principaux de taille bornée ;
- aucun secret dans le client ;
- aucune dépendance 3D ou WebAssembly sans besoin mesuré.

## Diagramme

Le diagramme éditable de référence est disponible dans [FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9).
