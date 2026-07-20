# Architecture générale

## Vue d’ensemble

Gargotte Adventure est séparé en quatre couches :

1. **contenu** : données de héros, créatures, donjons, loots, quêtes et médias ;
2. **moteur** : règles déterministes, tours, IA, Brouhaha, effets et résolution ;
3. **présentation** : plateau, animations, sons, interface tactile et accessibilité ;
4. **plateforme** : sauvegarde, installation PWA, import de contenu, tests et déploiement.

Le moteur ne dépend pas du DOM, du moteur de rendu ou d’un donjon particulier. Il reçoit un état et une commande, puis produit un nouvel état et une liste d’événements.

## Flux principal

```text
Commande joueur
      │
      ▼
Validation de commande
      │
      ▼
Moteur déterministe ─────► événements de domaine
      │                             │
      ▼                             ├─► animations
Nouvel état                       ├─► sons
      │                             ├─► journal de combat
      ├─► sauvegarde                └─► retours tactiles
      └─► rendu du plateau
```

## Frontières

### Gargottex

Gargottex demeure la source de vérité éditoriale. Gargotte Adventure ne doit pas devenir un second formulaire d’administration.

Le jeu consomme des paquets de contenu normalisés et versionnés. Un import invalide est refusé avant le lancement d’une partie.

### Google Drive

Drive conserve les sources humaines : règles, lore, images maîtres, tableaux de conception et archives. Ces fichiers ne sont pas chargés directement par la PWA en production.

### Figma

Figma contient le design system, les écrans et les prototypes. Les tokens validés sont exportés vers le code sous une forme versionnée.

### OpenAI API

L’API OpenAI peut assister les outils de préparation de contenu, de QA ou de développement. Elle ne fait pas partie de la boucle de jeu et ne doit jamais être appelée directement depuis la PWA publique.

## Architecture cible du dépôt

```text
apps/
  game/                 PWA et composition de l’application
packages/
  engine/               règles pures et état de partie
  content-schema/       schémas, validations et migrations
  renderer/             rendu WebGL et animations
  ui/                   composants d’interface
  save/                 persistance et migrations IndexedDB
  audio/                musique, voix et effets
  common/               types et utilitaires partagés
tools/
  content-importer/     conversion des exports Gargottex
  asset-pipeline/       optimisation et manifestes médias
  validators/           contrôles de cohérence
content/
  bastognac/            paquet de contenu du premier donjon
docs/
tests/
```

Cette structure est une cible. Les dossiers ne sont créés que lorsqu’ils accueillent du code utile.

## Choix technologiques initiaux

- TypeScript strict ;
- Vite pour le développement et le build ;
- PWA installable et offline-first ;
- PixiJS pour le rendu 2D WebGL ;
- DOM/CSS pour les menus et interfaces accessibles ;
- IndexedDB pour les sauvegardes ;
- Vitest pour les tests unitaires ;
- Playwright pour les parcours navigateur ;
- GitHub Actions pour la qualité et le déploiement.

WebAssembly n’est pas introduit au Sprint 0. Il sera évalué uniquement si une mesure démontre qu’un calcul critique ne peut pas être traité correctement en TypeScript.

## Propriétés attendues du moteur

- déterministe à entrée identique ;
- sérialisable ;
- testable sans navigateur ;
- indépendant du framerate ;
- capable de produire un journal d’événements ;
- compatible avec la reprise de partie ;
- versionné pour permettre les migrations de sauvegarde.

## Sécurité

- aucune évaluation de code provenant des fichiers de contenu ;
- schémas stricts et listes blanches d’effets ;
- aucune clé API dans le bundle client ;
- politique de sécurité du contenu ;
- dépendances réduites et verrouillées ;
- export des sauvegardes sans donnée sensible par défaut.

## Diagramme

Le diagramme éditable de référence est disponible dans [FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9).
