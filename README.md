<div align="center">
  <img src="./apps/game/public/icon.svg" alt="Gargotte Adventure logo" width="112" height="112" />

# Gargotte Adventure

**Un dungeon crawler tactique, coopératif et offline-first dans l’univers de _Gargotte & Va-Nu-Pieds_.**

[![Play](https://img.shields.io/badge/Jouer-GitHub%20Pages-b66b35?style=flat-square)](https://christolosier-ship-it.github.io/Gargotte-Adventure/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?style=flat-square&logo=typescript&logoColor=white)](./package.json)
[![PixiJS](https://img.shields.io/badge/PixiJS-8-E91E63?style=flat-square)](https://pixijs.com/)
[![PWA](https://img.shields.io/badge/PWA-Offline--first-f1c86f?style=flat-square)](./vite.config.ts)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20%2B%20Playwright-6E9F18?style=flat-square)](#qualité-et-validation)

[Présentation](#présentation) · [Jouer](#jouer) · [Fonctionnalités](#fonctionnalités) · [Architecture](#architecture) · [Développement](#développement-local)

</div>

## Présentation

Gargotte Adventure est un jeu de plateau numérique coopératif et tactique, pensé pour le téléphone, la tablette et l’ordinateur. Les joueurs dirigent une équipe de héros dans des salles isométriques, affrontent des créatures, manipulent le décor et tentent de contenir le **Brouhaha** avant que la situation ne se transforme en banquet pour monstres.

Le vertical slice actuel se déroule au **Château de Bastognac** et propose une expédition écrite à la main de trois salles. Le moteur privilégie des règles déterministes, testables et explicables plutôt que des résultats opaques ou dépendants d’un service distant.

> [!NOTE]
> Le projet est en développement actif. La boucle tactique, la sauvegarde, le micro-donjon et les principaux systèmes de salle sont opérationnels ; la génération complète des cinq étages, la campagne, le loot et le boss final restent prévus pour les phases suivantes.

## Jouer

La version publiée est accessible sur GitHub Pages :

**[Ouvrir Gargotte Adventure](https://christolosier-ship-it.github.io/Gargotte-Adventure/)**

L’application est conçue en priorité pour une utilisation en **mode paysage**. Après un premier chargement complet, elle peut être installée comme PWA et utilisée hors connexion.

## Fonctionnalités

- Expédition coopérative composée de trois salles reliées.
- Plateau isométrique rendu avec PixiJS.
- Caméra tactile avec déplacement, zoom et rotation.
- Déplacements, actions, tours et résolution tactique déterministes.
- Héros persistants entre les salles, notamment leurs PV et leur état vivant.
- Créatures gérées par des comportements et intentions résolus par le moteur.
- Spawn initial et renforts idempotents, sans duplication lors d’une reprise.
- Système de **Brouhaha** local à chaque salle.
- Objets interactifs, réactions en chaîne et événements de présentation.
- Victoire et défaite locales intégrées à un résultat global d’expédition.
- Sauvegarde automatique IndexedDB avec migrations.
- Reprise d’une partie sans rejouer les événements déjà résolus.
- Mode diagnostic séparé du parcours joueur.
- Audio et assets locaux.
- PWA installable et offline-first.

> [!IMPORTANT]
> Les trois salles actuelles sont volontairement écrites à la main. Le générateur complet de donjon est réservé au Sprint 5 afin d’éviter de simuler une génération procédurale avant que les règles, acteurs et rencontres soient stabilisés.

## Parcours actuel

```text
Préparation de l’équipe
        ↓
Salle 1 · prise en main tactique
        ↓
Salle 2 · décor, réactions et Brouhaha
        ↓
Salle 3 · confrontation pilote
        ↓
Résultat global de l’expédition
```

Chaque salle conserve son propre tour, Brouhaha, historique, état des ennemis, objets, réactions et renforts. L’équipe et ses PV persistent à l’échelle de l’expédition.

## Principes de conception

1. **Un jeu, pas un éditeur** : les outils techniques restent séparés du parcours joueur.
2. **Déterminisme** : une même entrée produit des conséquences compréhensibles et testables.
3. **Mobile et tactile d’abord** : l’expérience principale vise la tablette et le téléphone en paysage.
4. **Offline-first** : aucun backend ni compte n’est nécessaire pour jouer.
5. **Contenu séparé du runtime** : définitions, instances et placements ont des responsabilités distinctes.
6. **Intentions puis conséquences** : les acteurs proposent des intentions, les moteurs appliquent les règles.
7. **Brouhaha local** : chaque salle conserve son propre niveau et son propre historique.
8. **Gargottex en lecture seule** : le codex éditorial n’est pas une dépendance d’exécution.

## Architecture

Le dépôt utilise une organisation en monorepo sans gestionnaire de workspaces séparé. L’application assemble plusieurs packages TypeScript spécialisés :

```text
Gargotte-Adventure/
├── apps/
│   └── game/                    # Composition de la PWA et interface du jeu
├── packages/
│   ├── common/                  # Types et utilitaires partagés
│   ├── engine/                  # Tactique, expédition, spawn, objets et Brouhaha
│   ├── presentation/            # Conversion des événements en cues et journal
│   ├── content-schema/          # Schémas Zod et validation du contenu
│   ├── renderer/                # Scène PixiJS, projection et assets
│   ├── ui/                      # HUD, menus, progression et commandes
│   ├── save/                    # IndexedDB, sauvegardes et migrations
│   └── audio/                   # Lecture audio locale
├── content/
│   └── bastognac/               # Expédition, salles et contenu éditorial
├── tools/
│   └── validators/              # Validation automatisée du contenu
├── tests/
│   └── e2e/                     # Parcours Playwright bureau et mobile
├── docs/                        # Vision, architecture, ADR, sprints et audits
├── vite.config.ts               # Build, alias et configuration PWA
└── package.json                 # Scripts et dépendances
```

### Flux d’exécution

```text
Définition de contenu validée par Zod
                ↓
ExpeditionSession construit ou restaure la salle
                ↓
RoomState reçoit les commandes et intentions
                ↓
Moteurs tactiques appliquent les conséquences
                ↓
Événements de domaine
       ├── sauvegarde IndexedDB
       ├── présentation et journal
       └── rendu PixiJS et interface
```

> [!TIP]
> Les packages métier restent indépendants du DOM lorsque cela est possible. Cette séparation permet de tester les règles, les migrations et les invariants sans démarrer le moteur de rendu.

## Modèle d’expédition

Le micro-donjon repose sur deux niveaux d’état :

- `ExpeditionState` orchestre la progression globale, les salles visitées, les héros persistants et le résultat final ;
- chaque `RoomState` conserve l’état tactique propre à une salle.

La construction d’une nouvelle salle suit un ordre volontairement strict :

```text
Créer le RoomState de base
        ↓
Exécuter les SpawnRequest initiales
        ↓
Injecter les PV persistants des héros
        ↓
Calculer la phase terminale
        ↓
Enregistrer la salle dans l’expédition
```

Les requêtes déjà exécutées sont mémorisées afin qu’une sauvegarde reprise ne recrée ni créatures, ni renforts, ni réactions déjà traitées.

## Sauvegarde et fonctionnement hors ligne

Les sauvegardes sont stockées localement dans IndexedDB. Le package `packages/save` valide les données, gère les versions et peut migrer d’anciens états tactiques vers le format d’expédition actuel.

La PWA est générée avec `vite-plugin-pwa` et Workbox. Le build met en cache l’application, les scripts, les styles, les définitions de contenu, les illustrations isométriques et les fichiers audio nécessaires.

> [!WARNING]
> Effacer les données du site dans le navigateur supprime les sauvegardes locales. Le cache PWA et les sauvegardes IndexedDB sont deux mécanismes distincts, mais ils peuvent être effacés ensemble depuis les réglages du navigateur.

## Stack technique

| Technologie | Utilisation |
| --- | --- |
| TypeScript | Contrats stricts et logique métier |
| PixiJS | Rendu isométrique et scène interactive |
| Zod | Validation du contenu et des sauvegardes |
| IndexedDB avec `idb` | Sauvegarde locale et reprise |
| Vite | Développement et build de production |
| Vite PWA / Workbox | Installation et cache offline-first |
| Vitest | Tests unitaires et d’intégration |
| Playwright | Parcours end-to-end bureau et mobile paysage |
| Web Audio | Lecture des effets audio locaux |

## Développement local

### Prérequis

- Node.js 24 ou supérieur ;
- npm ;
- Chromium pour les tests Playwright.

### Installation

```bash
 git clone https://github.com/christolosier-ship-it/Gargotte-Adventure.git
 cd Gargotte-Adventure
 npm ci
 npm run dev
```

Vite affiche ensuite l’adresse locale de l’application.

### Build de production

```bash
npm run build
npm run preview
```

## Qualité et validation

La commande principale contrôle le formatage, le contenu, TypeScript, les tests, le build et la structure du dépôt :

```bash
npm run check
```

Les tests end-to-end nécessitent Chromium :

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

Commandes utiles :

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Démarre Vite sur le réseau local |
| `npm run validate:content` | Valide les définitions éditoriales avec Zod |
| `npm run typecheck` | Vérifie les contrats TypeScript |
| `npm run test` | Exécute la suite Vitest |
| `npm run test:e2e` | Lance les parcours Playwright |
| `npm run build` | Valide le contenu, typechecke et construit la PWA |
| `npm run validate:repository` | Contrôle les règles structurelles du dépôt |
| `npm run check` | Exécute la chaîne de validation complète |

## Contenu et extension

Le contenu du vertical slice est versionné dans `content/bastognac`. Les fichiers décrivent notamment :

- l’expédition et ses connexions ;
- la géométrie et les objectifs des salles ;
- les acteurs et leurs placements ;
- les populations initiales ;
- les objets interactifs ;
- les réactions et renforts ;
- les textes de présentation.

Toute évolution doit respecter les schémas de `packages/content-schema` et passer `npm run validate:content`.

> [!IMPORTANT]
> Gargottex sert de référence éditoriale consultée en lecture seule. Le contenu nécessaire au jeu doit être explicitement versionné et validé dans ce dépôt ; l’application ne lit pas Gargottex à l’exécution.

## État du projet

| Phase | État |
| --- | --- |
| Fondations, PWA, CI et gouvernance | Livré |
| Boucle tactique, IA et sauvegarde | Livré |
| Plateau isométrique, caméra et pipeline d’assets | Livré |
| Spawn, Brouhaha, objets, réactions et renforts | Livré |
| Stabilisation et correctifs P2 | Livré |
| Micro-donjon manuel et état d’expédition | Livré |
| Contrats détaillés des acteurs et comportements | Prochaine phase |
| Génération des cinq étages, loot, progression et campagne | Sprint 5 |

## Documentation

La documentation détaillée est versionnée avec le code :

- [Index documentaire](docs/README.md)
- [Vision produit](docs/product/vision.md)
- [Roadmap](docs/roadmap.md)
- [Architecture générale](docs/architecture/overview.md)
- [Salle tactique](docs/architecture/tactical-room.md)
- [Micro-donjon et expédition](docs/architecture/micro-dungeon-and-expedition.md)
- [Acteurs et comportements](docs/architecture/actors-and-behaviors.md)
- [Décisions d’architecture](docs/adr/README.md)
- [Audits de livraison](docs/audits/)

## Déploiement

Le projet est configuré pour être publié sous le chemin GitHub Pages `/Gargotte-Adventure/`.

```bash
npm run check
npm run build
```

Le contenu généré dans `dist/` peut ensuite être publié par le workflow du dépôt. Le manifest, le scope PWA et les chemins d’assets sont déjà alignés sur le sous-chemin GitHub Pages.
