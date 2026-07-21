# Architecture générale

## Vue d’ensemble

Gargotte Adventure est organisé en quatre couches :

1. **contenu** : données versionnées de héros, créatures, salles, obstacles et références d’assets ;
2. **moteur** : règles déterministes, déplacements, combat, tours, IA et événements ;
3. **présentation** : plateau PixiJS, HUD et commandes DOM accessibles ;
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
      ├─► projection et rendu PixiJS
      ├─► mise à jour du HUD
      ├─► journal d’événements
      └─► sauvegarde IndexedDB
```

Les interactions PixiJS et les commandes DOM utilisent les mêmes handlers. L’interface n’implémente donc pas une seconde version des règles.

## État actuel après le Sprint 1

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

### Présentation

- `packages/renderer` projette actuellement `RoomState` dans une grille orthogonale PixiJS provisoire ;
- `packages/ui` fournit menus, sélection des héros, HUD, commandes tactiques et boutons de phase ;
- `apps/game/src/main.ts` orchestre contenu, moteur, renderer, UI et sauvegarde.

### Plateforme

- PWA Vite installable et offline-first ;
- sauvegardes IndexedDB versionnées ;
- migration défensive des anciennes sauvegardes ;
- Vitest pour le moteur, le contenu et la sauvegarde ;
- Playwright sur build de production, en desktop et mobile paysage ;
- GitHub Actions pour formatage, contenu, types, tests, build, sécurité et artefacts ;
- GitHub Pages pour le déploiement.

## Direction du Sprint 2 : renderer 2D isométrique

Le Sprint 2 remplace la projection orthogonale provisoire par une projection isométrique, sans modifier la grille logique.

```text
RoomState logique
colonnes, lignes, obstacles, unités
              │
              ▼
packages/renderer
projection grille → écran
tri de profondeur
sprites et overlays
              │
              ▼
canvas PixiJS isométrique
```

### Invariants

- le moteur conserve `GridPosition { column, row }` ;
- les règles de déplacement, portée, ligne de vue, IA et sauvegarde ne connaissent pas l’isométrie ;
- le renderer possède la projection, le picking, la caméra, le tri et les animations visuelles ;
- le DOM conserve les commandes accessibles et le HUD ;
- PixiJS reste le moteur de rendu ;
- aucune dépendance 3D, aucun rig et aucune animation squelettique ne sont introduits.

### Projection de référence

```text
screenX = originX + (column - row) × tileWidth / 2
screenY = originY + (column + row) × tileHeight / 2
```

Les dimensions exactes sont validées par prototype. Le ratio de départ recommandé pour les tuiles est 2:1.

### Assets et profondeur

Le renderer doit gérer :

- tuiles de sol ;
- murs et bords ;
- obstacles ;
- personnages 2D ;
- ombres ;
- overlays de déplacement et d’attaque ;
- effets légers ;
- ordre de profondeur stable.

Les sprites sont ancrés au point de contact avec le sol. Leur illustration peut dépasser de la case sans changer leur position logique.

### Animation volontairement légère

Les personnages restent fixes ou très légèrement animés : interpolation de déplacement, respiration, impulsion d’attaque, recul, flash, petite variation d’échelle ou rotation. Le projet n’utilise pas de rig.

La décision complète est consignée dans [ADR-0006 — Plateau 2D isométrique sous PixiJS](../adr/0006-isometric-2d-renderer.md).

## Frontières externes

### Gargottex

Gargottex demeure la source de vérité éditoriale. À terme, le jeu consommera des paquets de contenu normalisés, validés et versionnés issus de Gargottex.

### Google Drive

Drive conserve les règles humaines, le lore, les images maîtres, les tableaux de conception et les archives. Ces fichiers ne sont jamais chargés directement par la PWA en production.

### Figma et FigJam

FigJam contient le diagramme d’architecture. Figma doit accueillir les écrans, composants, gabarits isométriques, dimensions de tuiles, points d’ancrage et états visuels lorsque les droits d’édition sont disponibles.

Le code reste fonctionnel sans connexion à Figma.

### OpenAI API

L’API OpenAI peut assister des outils privés de préparation de contenu, de QA ou de développement. Elle ne fait pas partie de la boucle de jeu et ne doit jamais être appelée directement depuis la PWA publique.

## Structure actuelle du dépôt

```text
apps/
  game/                 PWA et composition de l’application
packages/
  engine/               règles pures et état de partie
  content-schema/       schémas et validations Zod
  renderer/             rendu PixiJS, puis projection isométrique au Sprint 2
  ui/                   interface DOM accessible
  save/                 persistance et migrations IndexedDB
  common/               types et utilitaires partagés
content/
  bastognac/            contenu validé du vertical slice
tools/
  validators/           validation du contenu et du dépôt
tests/
  e2e/                  parcours Playwright
docs/                   produit, architecture, ADR et sprints
```

## Éléments cibles non encore créés

- renderer isométrique et pipeline d’assets ;
- package audio ;
- importeur complet Gargottex ;
- pipeline d’optimisation des médias ;
- catalogue complet Bastognac ;
- Brouhaha et décor interactif ;
- campagne, loot et progression.

Ils seront ajoutés uniquement lorsqu’un sprint leur fournit un comportement utile et testé.

## Choix technologiques

- TypeScript strict ;
- Vite pour le développement et le build ;
- PWA installable et offline-first ;
- PixiJS pour le rendu 2D WebGL orthogonal puis isométrique ;
- DOM/CSS pour les menus et interfaces accessibles ;
- IndexedDB pour les sauvegardes ;
- Zod pour les schémas de contenu ;
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
