# Gargotte Adventure

Jeu de plateau numérique coopératif et tactique dans l'univers de **Gargotte & Va-Nu-Pieds**.

Gargotte Adventure vise une expérience installable, tactile et offline-first sur téléphone, tablette et ordinateur. Le premier vertical slice est consacré au **Château de Bastognac**.

## Jouer

[🎮 Ouvrir Gargotte Adventure sur GitHub Pages](https://christolosier-ship-it.github.io/Gargotte-Adventure/)

## État du projet

- **Sprint 0** : fondations, PWA, CI et gouvernance livrées ;
- **Sprint 1** : boucle tactique, IA et sauvegarde livrées ;
- **Sprint 2** : plateau isométrique, caméra et pipeline d'assets livrés ;
- **Sprint 3.1** : spawn déterministe livré ;
- **Sprint 3.2** : Brouhaha 0 à 12 livré ;
- **Sprint 3.3** : objets interactifs livrés ;
- **Sprint 3.4** : réactions en chaîne livrées ;
- **Sprint 3.5** : renforts de Brouhaha livrés et stabilisés ;
- **Sprint 3.6** : présentation, audio utile et finition livrés par la PR #59.

Le **Sprint 3 est terminé**. La prochaine phase est le Sprint 4 consacré aux héros et créatures de Bastognac.

## Version stable

La version stable permet de :

- sélectionner de 1 à 4 héros officiels ;
- jouer une salle tactique 8 × 4 ;
- déplacer, attaquer et résoudre une IA déterministe ;
- interagir avec tables, tonneaux, grilles, torches et piliers ;
- pousser certains objets et propager des réactions déclarées par la salle ;
- faire évoluer une jauge de Brouhaha de 0 à 12 ;
- déclencher des renforts lors de franchissements montants ;
- expliquer les apparitions totales, partielles ou refusées ;
- figer le roster du tour ennemi et reprendre une sauvegarde version 6 ;
- afficher des cues visuels dérivés des événements tactiques ;
- jouer des sons locaux respectant volume, mute et autoplay ;
- regrouper les conséquences d'une action dans un journal borné ;
- respecter `prefers-reduced-motion` ;
- restaurer une partie sans rejouer les effets historiques ;
- rester jouable au clavier, à la souris et au toucher en paysage.

## Livraison Sprint 3.6

La PR #59, fusionnée au commit `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`, livre :

- le package pur `packages/presentation` ;
- un routeur événements → cues visuels, cues audio et journal ;
- une couche PixiJS transitoire dédiée et non interactive ;
- sept sons pilotes synthétisés localement par Web Audio ;
- les réglages locaux de volume et de mode muet ;
- un journal groupé limité à six actions racines ;
- l'annulation des effets lors d'un rendu, d'une rotation ou d'une reprise ;
- des diagnostics sur canvas, listeners, objets stables, cues actifs et cache audio ;
- 131 tests unitaires et des parcours Playwright bureau/mobile.

La présentation ne modifie jamais `RoomState`, ne recalcule aucune règle et ne change pas la version de sauvegarde tactique.

Voir [Présentation et finition du Sprint 3.6](docs/architecture/presentation-and-finishing.md) et l'[audit de livraison](docs/audits/sprint-3-6-presentation-finishing.md).

## Génération future du donjon

Le Sprint 5 générera la topologie des cinq étages et la géométrie complète des salles : dimensions, formes, murs, portes, passages, zones, obstacles, points de spawn et décor initial.

Chaque salle reçoit son propre budget de menace. **Le budget est calculé et validé par salle, jamais comme un portefeuille global d'étage.**

Le générateur compose une rencontre, puis le moteur de spawn crée les instances. Les renforts restent une augmentation runtime distincte de la rencontre initiale.

## Héros disponibles

- **Brünhilda la Torgnole** ;
- **Aelion Trois-Gorgées** ;
- **Magdalena Coquinelle** ;
- **Grompif Arcabidon**.

## Principes directeurs

1. **Un jeu, pas un éditeur.** Gargottex reste la source de vérité éditoriale.
2. **Déterministe et lisible.** Aucun résultat caché ou opaque.
3. **Mobile d'abord.** Interface tactile en paysage.
4. **Offline-first.** Parties et réglages restent locaux.
5. **Aucun secret côté client.** Aucune clé OpenAI dans la PWA.
6. **Une version démontrable à chaque sprint.**
7. **Le rendu et la présentation ne gouvernent pas les règles.**
8. **Définitions, instances et génération restent séparées.**
9. **Le budget de menace appartient à la salle.**
10. **Gargottex reste une frontière externe en lecture seule.**

## Architecture actuelle

```text
apps/game                    composition de la PWA et orchestration
packages/engine              tactique, spawn, Brouhaha, objets, réactions et renforts
packages/presentation        routage pur des événements vers les cues et le journal
packages/content-schema      validation Zod du contenu
packages/renderer            projection, scène PixiJS, assets et effets transitoires
packages/ui                  menus, HUD, journal et commandes accessibles
packages/save                sauvegardes IndexedDB versionnées et migrations
packages/audio               lecture locale Web Audio, volume, mute et cache
packages/common              types et utilitaires partagés
content/bastognac            donjon, créatures, effets, objets et salle pilote
tests/e2e                    parcours Playwright desktop et mobile
```

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB. Il reçoit un état et une intention, puis retourne un nouvel état, des événements ou une erreur métier typée.

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
- [Architecture générale](docs/architecture/overview.md)
- [Présentation et finition du Sprint 3.6](docs/architecture/presentation-and-finishing.md)
- [Suivi du Sprint 3](docs/sprints/sprint-3.md)
- [Audit Sprint 3.6](docs/audits/sprint-3-6-presentation-finishing.md)
- [Décisions d'architecture](docs/adr/README.md)

## Sources du projet

- **Gargottex V5** pour les données structurées et l'édition du contenu, en lecture seule depuis ce projet ;
- **Google Drive** pour les règles, le lore, les médias maîtres et comptes rendus ;
- **Figma / FigJam** pour les écrans et diagrammes ;
- ce dépôt pour le moteur, l'interface, les builds et les tests.

## Licence

Aucune licence open source n'est accordée pour le moment. Les droits sur le code, l'univers, les textes et les ressources restent réservés à leur auteur.
