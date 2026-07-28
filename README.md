# Gargotte Adventure

Jeu de plateau numérique coopératif et tactique dans l’univers de **Gargotte & Va-Nu-Pieds**.

Gargotte Adventure vise une expérience installable, tactile et offline-first sur téléphone, tablette et ordinateur. Le premier vertical slice est consacré au **Château de Bastognac**.

## Jouer

[🎮 Ouvrir Gargotte Adventure sur GitHub Pages](https://christolosier-ship-it.github.io/Gargotte-Adventure/)

## État du projet

- **Sprint 0** : fondations, PWA, CI et gouvernance livrées ;
- **Sprint 1** : boucle tactique, IA et sauvegarde livrées ;
- **Sprint 2** : plateau isométrique, caméra et pipeline d’assets livrés ;
- **Sprint 3** : spawn, Brouhaha, objets, réactions, renforts et présentation stabilisés ;
- **Sprint 4.0** : sept correctifs P2 livrés ;
- **Sprint 4.1** : micro-donjon manuel et état d’expédition livrés ;
- **Sprint 4.2** : prochaine phase, contrats des acteurs et comportements.

La base fonctionnelle stable du Sprint 4.1 est le commit `18acb7947fc9625d606213c6db02e7947e5e9f44`.

## Livraison Sprint 4.1

Le jeu propose désormais :

- une expédition fixe de trois salles de Bastognac ;
- un `ExpeditionState` version 1 au-dessus des salles tactiques version 6 ;
- des connexions et transitions explicites ;
- des populations initiales exécutées par `SpawnRequest` ;
- la conservation des PV et de l’état vivant des héros ;
- un Brouhaha, des ennemis, des objets et des historiques propres à chaque salle ;
- une complétion idempotente avant transition ;
- une victoire ou une défaite globale ;
- une sauvegarde d’expédition, une migration et une reprise sans replay ;
- un écran de résultat et un rejeu ;
- un mode diagnostic séparé du parcours joueur.

La validation complète est verte sur Chromium bureau et mobile paysage.

Voir [Audit du Sprint 4.1](docs/audits/sprint-4-1-micro-dungeon-expedition.md).

## Parcours actuel

```text
Préparation
→ Salle 1 : prise en main tactique
→ Salle 2 : décor, réactions et Brouhaha
→ Salle 3 : confrontation pilote
→ Résultat de l’expédition
```

## Suite du Sprint 4

Le Sprint 4.2 doit définir les contrats détaillés des héros, créatures, compétences et comportements déclaratifs. Les lots suivants finaliseront les quatre héros, le bestiaire de Bastognac, les interactions avec le décor, les influences du Brouhaha et l’équilibrage des trois salles.

## Frontière avec le Sprint 5

Le Sprint 4 conserve trois salles écrites à la main. Le Sprint 5 générera les cinq étages, leur topologie, leur géométrie, les rencontres, le loot, la progression, la campagne et le Baron Pas-Très-Terrifiant.

## Principes directeurs

1. un jeu, pas un éditeur ;
2. règles déterministes et explicables ;
3. mobile et tactile d’abord ;
4. fonctionnement offline-first ;
5. aucune clé API dans la PWA ;
6. définitions, instances et placements séparés ;
7. acteurs producteurs d’intentions, moteurs responsables des conséquences ;
8. Brouhaha local à la salle ;
9. mode diagnostic distinct ;
10. aucun faux générateur avant le Sprint 5 ;
11. Gargottex strictement en lecture seule.

## Architecture

```text
apps/game                    composition de la PWA et orchestration
packages/engine              tactique, expédition, spawn, Brouhaha et objets
packages/presentation        routage pur des événements vers cues et journal
packages/content-schema      validation Zod du contenu
packages/renderer            scène PixiJS, projection, assets et effets
packages/ui                  menus, HUD, progression et commandes
packages/save                sauvegardes IndexedDB et migrations
packages/audio               lecture locale Web Audio
content/bastognac            contenu éditorial du vertical slice
tests/e2e                    parcours bureau et mobile paysage
```

## Démarrage local

Prérequis : Node.js 24 ou supérieur, npm et Chromium Playwright.

```bash
npm ci
npm run dev
```

Contrôle complet :

```bash
npm run check
npx playwright install --with-deps chromium
npm run test:e2e
```

## Documentation

- [Index documentaire](docs/README.md)
- [Vision produit](docs/product/vision.md)
- [Roadmap](docs/roadmap.md)
- [Suivi du Sprint 4](docs/sprints/sprint-4.md)
- [Audit Sprint 4.1](docs/audits/sprint-4-1-micro-dungeon-expedition.md)
- [Architecture du micro-donjon](docs/architecture/micro-dungeon-and-expedition.md)
- [Héros, créatures et comportements](docs/architecture/actors-and-behaviors.md)

## Sources du projet

- **Gargottex V5** : source éditoriale consultée en lecture seule ;
- **Google Drive** : règles humaines, lore et comptes rendus ;
- **Figma / FigJam** : écrans et diagrammes ;
- **GitHub** : moteur, interface, contrats, builds et tests.

## Licence

Aucune licence open source n’est accordée pour le moment. Les droits sur le code, l’univers, les textes et les ressources restent réservés à leur auteur.