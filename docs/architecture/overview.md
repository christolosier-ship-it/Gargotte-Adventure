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
      orchestrateur apps/game
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
      └─► sauvegarde IndexedDB
```

Les interactions PixiJS et les commandes DOM utilisent les mêmes handlers. L’interface n’implémente donc pas une seconde version des règles.

## État actuel après le Sprint 2

### Contenu

Le scénario `content/bastognac/sprint-1-room.json` définit :

- une grille 8 × 4 ;
- les obstacles ;
- les quatre héros officiels avec des statistiques provisoires ;
- deux gobelins provisoires ;
- les positions initiales.

Le contenu est validé par Zod avant la création du `RoomState`.

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

### Renderer isométrique

`packages/renderer` projette `RoomState` sur un plateau PixiJS 2D isométrique :

- projection grille vers écran et conversion inverse ;
- tuiles 128 × 64 ;
- caméra responsive et centrage ;
- hit areas polygonales ;
- picking par clic et toucher ;
- tri de profondeur déterministe ;
- couches fond, sol, objets, premier plan et interface ;
- murs hauts non interactifs ;
- occlusion contextuelle par réduction d’opacité ;
- obstacles et combattants ancrés au point de contact au sol ;
- overlays atteignable, sélectionné, attaquable et bloqué ;
- destruction des objets graphiques lors des reconstructions.

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

Le manifeste pilote contient notamment :

- ombre au sol ;
- fallbacks de tuile, mur et obstacle ;
- effet d’impact technique ;
- Brünhilda et Gobelin Bricoleur en WebP ;
- deux sols Bastognac ;
- deux orientations de mur ;
- un tonneau Bastognac.

Les textures restent indépendantes du gameplay. Une panne de manifeste ou d’asset conserve un plateau jouable grâce aux formes vectorielles de secours.

### UI et orchestration

- `packages/ui` fournit menus, sélection des héros, HUD, commandes tactiques et boutons de phase ;
- `apps/game/src/main.ts` orchestre contenu, moteur, renderer, UI et sauvegarde ;
- le bouton de lancement reste désactivé jusqu’à la fin de l’initialisation du renderer et des sauvegardes ;
- les commandes DOM restent disponibles même si l’interaction canvas échoue.

### Fondation audio

`packages/audio` existe déjà sous la forme d’un socle minimal de réglages et d’un `AudioDirector`. Il n’est pas encore connecté à `apps/game`, ne charge aucun média sonore et ne participe pas à la boucle de jeu. L’intégration audio réelle reste une cible ultérieure.

### Plateforme

- PWA Vite installable et offline-first ;
- sauvegardes IndexedDB versionnées ;
- migration défensive des anciennes sauvegardes ;
- Vitest pour le moteur, le contenu, le renderer et la sauvegarde ;
- Playwright sur build de production, en desktop et mobile paysage ;
- GitHub Actions pour formatage, contenu, types, tests, build, sécurité et artefacts ;
- GitHub Pages pour le déploiement.

## Projection de référence

Pour une case logique `(column, row)` :

```text
screenX = originX + (column - row) × tileWidth / 2
screenY = originY + (column + row) × tileHeight / 2
```

Le gabarit retenu est une tuile 128 × 64, soit un ratio 2:1.

## Profondeur et ancrages

Les éléments sont répartis dans des couches explicites et utilisent une profondeur stable dérivée de leur position projetée.

- les tuiles restent dans la couche sol ;
- les obstacles et combattants utilisent la couche objets ;
- les murs utilisent la couche premier plan ;
- les informations de salle utilisent la couche interface ;
- les sprites sont ancrés au contact avec le sol ;
- leur illustration peut dépasser de la case sans modifier leur position logique.

## Animations

Le renderer accepte des personnages fixes ou très légèrement animés. Le Sprint 2 utilise des sprites fixes.

Les futures animations légères pourront utiliser interpolation, translation, échelle, rotation ou opacité, sans rig ni animation squelettique. Elles doivent rester indépendantes des résultats métier et ne jamais retarder une action tactique.

## Frontières externes

### Gargottex

Gargottex demeure la source de vérité éditoriale. À terme, le jeu consommera des paquets de contenu normalisés, validés et versionnés issus de Gargottex.

### Google Drive

Drive conserve les règles humaines, le lore, les images maîtres, les tableaux de conception et les archives. Ces fichiers ne sont jamais chargés directement par la PWA en production.

### Figma et FigJam

FigJam contient le diagramme d’architecture. Figma accueille les fondations visuelles et certains gabarits isométriques. Le handoff versionné dans `design/isometric` reste la référence exploitable par le code lorsque les droits ou quotas Figma limitent la production.

Le code reste fonctionnel sans connexion à Figma.

### OpenAI API

L’API OpenAI peut assister des outils privés de préparation de contenu, de QA ou de développement. Elle ne fait pas partie de la boucle de jeu et ne doit jamais être appelée directement depuis la PWA publique.

## Structure actuelle du dépôt

```text
apps/
  game/                 PWA, composition et assets publics runtime
packages/
  engine/               règles pures et état de partie
  content-schema/       schémas et validations Zod
  renderer/             projection isométrique, picking, profondeur et assets
  ui/                   interface DOM accessible
  save/                 persistance et migrations IndexedDB
  common/               types et utilitaires partagés
  audio/                fondation de réglages, non intégrée à la boucle de jeu
content/
  bastognac/            contenu validé du vertical slice
design/
  isometric/            tokens, gabarits et handoff du pipeline graphique
tools/
  validators/           validation du contenu, du dépôt et des assets
tests/
  e2e/                  parcours Playwright
docs/                   produit, architecture, audits, ADR et sprints
```

## Éléments cibles non encore créés ou non encore intégrés

- Brouhaha et décor interactif ;
- intégration audio réelle, mixage et médias sonores ;
- importeur complet Gargottex ;
- pipeline industriel d’optimisation des médias ;
- catalogue complet Bastognac ;
- compétences définitives ;
- campagne, loot et progression.

Ils seront ajoutés ou activés uniquement lorsqu’un sprint leur fournit un comportement utile et testé.

## Choix technologiques

- TypeScript strict ;
- Vite pour le développement et le build ;
- PWA installable et offline-first ;
- PixiJS pour le rendu 2D isométrique ;
- DOM/CSS pour les menus et interfaces accessibles ;
- IndexedDB pour les sauvegardes ;
- Zod pour les schémas de contenu et d’assets ;
- Vitest pour les tests unitaires ;
- Playwright pour les parcours navigateur ;
- GitHub Actions pour la qualité et le déploiement.

WebAssembly et la véritable 3D ne sont pas introduits. Ils ne seront évalués qu’après mesure d’un besoin réel.

## Propriétés attendues du moteur

- déterministe à entrée identique ;
- sérialisable ;
- testable sans navigateur ;
- indépendant du framerate ;
- capable de produire un journal d’événements ;
- compatible avec la reprise de partie ;
- versionné pour permettre les migrations de sauvegarde ;
- indépendant de la projection visuelle et des contenus particuliers d’un donjon.

## Sécurité

- aucune évaluation de code provenant des fichiers de contenu ;
- schémas stricts et listes blanches d’effets ;
- aucune clé API dans le bundle client ;
- dépendances verrouillées ;
- scan automatisé des motifs de secrets ;
- sauvegardes sans donnée sensible par défaut.

## Diagramme

Le diagramme éditable de référence est disponible dans [FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9).
