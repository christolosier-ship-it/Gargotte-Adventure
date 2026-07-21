# Architecture générale

## Vue d’ensemble

Gargotte Adventure est organisé en quatre couches :

1. **contenu** : données versionnées de héros, créatures, salles et obstacles ;
2. **moteur** : règles déterministes, déplacements, combat, tours, IA et événements ;
3. **présentation** : plateau PixiJS, HUD et commandes DOM accessibles ;
4. **plateforme** : PWA, sauvegarde IndexedDB, validation, tests, build et déploiement.

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d’IndexedDB, ni d’un donjon particulier. Il reçoit un état et une intention, puis retourne un nouvel état, des événements de domaine ou une erreur métier typée.

## Flux principal actuel

```text
Interaction joueur
      │
      ├─ clic ou toucher PixiJS
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
      ├─► rendu PixiJS
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

Le contenu est validé par Zod avant la création du `RoomState`. Les identifiants, positions, dimensions et collisions initiales sont contrôlés.

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

- `packages/renderer` projette `RoomState` dans PixiJS et remonte les intentions de sélection ;
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

## Frontières externes

### Gargottex

Gargottex demeure la source de vérité éditoriale. Gargotte Adventure ne doit pas devenir un second formulaire d’administration.

À terme, le jeu consommera des paquets de contenu normalisés, validés et versionnés issus de Gargottex. Le scénario Sprint 1 est encore un paquet local de démonstration, conçu pour stabiliser le format et les règles.

### Google Drive

Drive conserve les sources humaines : règles, lore, images maîtres, tableaux de conception et archives. Ces fichiers ne sont jamais chargés directement par la PWA en production.

Le dépôt GitHub reste la source de vérité technique. Lorsqu’un document Drive décrit un comportement implémenté, la documentation du dépôt doit résumer la décision et pointer vers la source humaine sans la dupliquer intégralement.

### Figma et FigJam

FigJam contient le diagramme d’architecture. Figma doit accueillir les écrans, composants et tokens validés lorsque les droits d’édition sont disponibles.

Le code reste fonctionnel sans connexion à Figma et ne charge aucun document Figma à l’exécution.

### OpenAI API

L’API OpenAI peut assister des outils privés de préparation de contenu, de QA ou de développement. Elle ne fait pas partie de la boucle de jeu et ne doit jamais être appelée directement depuis la PWA publique.

## Structure actuelle du dépôt

```text
apps/
  game/                 PWA et composition de l’application
packages/
  engine/               règles pures et état de partie
  content-schema/       schémas et validations Zod
  renderer/             rendu PixiJS
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

Les éléments suivants restent des cibles et ne doivent pas être présentés comme déjà opérationnels :

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
- PixiJS pour le rendu 2D WebGL ;
- DOM/CSS pour les menus et interfaces accessibles ;
- IndexedDB pour les sauvegardes ;
- Zod pour les schémas de contenu ;
- Vitest pour les tests unitaires ;
- Playwright pour les parcours navigateur ;
- GitHub Actions pour la qualité et le déploiement.

WebAssembly n’est pas introduit. Il sera évalué uniquement si une mesure démontre qu’un calcul critique ne peut pas être traité correctement en TypeScript.

## Propriétés attendues du moteur

- déterministe à entrée identique ;
- sérialisable ;
- testable sans navigateur ;
- indépendant du framerate ;
- capable de produire un journal d’événements ;
- compatible avec la reprise de partie ;
- versionné pour permettre les migrations de sauvegarde ;
- indépendant des contenus particuliers d’un donjon.

## Sécurité

- aucune évaluation de code provenant des fichiers de contenu ;
- schémas stricts et listes blanches d’effets ;
- aucune clé API dans le bundle client ;
- dépendances verrouillées ;
- scan automatisé des motifs de secrets ;
- sauvegardes sans donnée sensible par défaut.

## Diagramme

Le diagramme éditable de référence est disponible dans [FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9).
