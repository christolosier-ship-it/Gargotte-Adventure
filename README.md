# Gargotte Adventure

Jeu de plateau numérique coopératif et tactique dans l’univers de **Gargotte & Va-Nu-Pieds**.

Gargotte Adventure vise une expérience installable, tactile et offline-first sur téléphone, tablette et ordinateur. Le premier vertical slice est consacré au **Château de Bastognac**.

## Jouer

[🎮 Ouvrir Gargotte Adventure sur GitHub Pages](https://christolosier-ship-it.github.io/Gargotte-Adventure/)

## État du projet

- **Sprint 0** : fondations, PWA, CI et gouvernance livrées ;
- **Sprint 1** : boucle tactique, IA et sauvegarde livrées ;
- **Sprint 2** : plateau isométrique, caméra et pipeline d’assets livrés ;
- **Sprint 3** : spawn, Brouhaha, objets, réactions, renforts et présentation définitivement stabilisés ;
- **Sprint 4.0** : sept correctifs P2 livrés par la PR #64 ;
- **Sprint 4.1** : prochaine phase, micro-donjon manuel et état d’expédition.

La base fonctionnelle stable du Sprint 4.0 est le commit `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf`.

## Livraison Sprint 4.0

Le lot de stabilisation finale apporte :

- des cues terminaux lors des transitions réelles vers victoire ou défaite ;
- une validation défensive des préférences audio persistées ;
- la conservation des cues prioritaires lorsque les plafonds sont atteints ;
- le redémarrage des tonalités répétées sans superposition ;
- l’ordre runtime testé `rendu stable → présentation → persistance asynchrone` ;
- la validation automatisée de la frontière `presentation → engine` ;
- la résolution des sept fils P2 issus des PR #59 et #60 ;
- une validation complète sur Chromium bureau et mobile paysage.

Voir [Audit du Sprint 4.0](docs/audits/sprint-4-0-stabilization.md).

## Sprint 4 : micro-donjon de Bastognac

Le résultat attendu est une expérience presque finale sur trois salles fixes adjacentes :

```text
Préparation
→ Salle 1 : prise en main tactique
→ Salle 2 : décor, réactions et Brouhaha
→ Salle 3 : confrontation complète
→ Résultat de l’expédition
```

Les lots 4.1 à 4.7 couvriront :

- l’état minimal d’expédition et la persistance inter-salles ;
- les objectifs, portes, transitions, victoire et défaite ;
- quatre héros définitifs ;
- seize créatures de Bastognac ;
- les compétences et profils d’IA déterministes ;
- les interactions des acteurs avec le décor ;
- les influences déclaratives du Brouhaha ;
- le parcours joueur sans commandes techniques ;
- un mode diagnostic distinct.

Voir [Suivi du Sprint 4](docs/sprints/sprint-4.md).

## Frontière avec le Sprint 5

Le Sprint 4 écrit ses trois salles à la main. Il ne crée aucun générateur provisoire.

Le Sprint 5 générera les cinq étages, leur topologie, leur géométrie, les rencontres automatiques, le loot, la progression, la campagne et le Baron Pas-Très-Terrifiant.

Chaque salle conserve son propre budget de menace. Le moteur de spawn reste l’unique frontière d’instanciation des créatures.

## Version fonctionnelle actuelle

La version fusionnée permet de :

- sélectionner de 1 à 4 héros pilotes ;
- jouer une salle tactique 8 × 4 ;
- déplacer, attaquer et résoudre une IA déterministe ;
- interagir avec tables, tonneaux, grilles, torches et piliers ;
- pousser certains objets et propager des réactions déclarées ;
- faire évoluer une jauge de Brouhaha de 0 à 12 ;
- déclencher des renforts lors de franchissements montants ;
- expliquer les apparitions totales, partielles ou refusées ;
- sauvegarder et restaurer une salle tactique version 6 ;
- afficher des cues visuels et jouer des sons locaux ;
- regrouper les conséquences dans un journal borné ;
- présenter correctement victoire et défaite ;
- respecter le mouvement réduit ;
- reprendre sans rejouer les effets historiques ;
- rester jouable au clavier, à la souris et au toucher en paysage.

## Héros concernés par le Sprint 4

- **Brünhilda la Torgnole** ;
- **Aelion Trois-Gorgées** ;
- **Magdalena Coquinelle** ;
- **Grompif Arcabidon**.

Les valeurs détaillées, capacités exactes et équilibrages seront décidés dans les lots fonctionnels dédiés.

## Principes directeurs

1. **Un jeu, pas un éditeur.** Gargottex reste une source éditoriale externe en lecture seule.
2. **Déterministe et lisible.** Aucun résultat caché ou opaque.
3. **Mobile d’abord.** Interface tactile en paysage.
4. **Offline-first.** Parties et réglages restent locaux.
5. **Aucun secret côté client.** Aucune clé OpenAI dans la PWA.
6. **Une version démontrable à chaque sprint.**
7. **Le rendu et la présentation ne gouvernent pas les règles.**
8. **Définitions, instances, placements et génération restent séparés.**
9. **Le budget de menace appartient à la salle.**
10. **Les acteurs produisent des intentions, les moteurs appliquent les conséquences.**
11. **Le mode diagnostic reste distinct du parcours joueur.**
12. **Aucun faux générateur avant le Sprint 5.**

## Architecture actuelle

```text
apps/game                    composition de la PWA et orchestration
packages/engine              tactique, spawn, Brouhaha, objets, réactions et renforts
packages/presentation        routage pur des événements vers cues et journal
packages/content-schema      validation Zod du contenu
packages/renderer            projection, scène PixiJS, assets et effets transitoires
packages/ui                  menus, HUD, journal et commandes accessibles
packages/save                sauvegardes IndexedDB versionnées et migrations
packages/audio               lecture locale Web Audio, volume, mute et cache
packages/common              types et utilitaires partagés
content/bastognac            contenu éditorial du vertical slice
tests/e2e                    parcours Playwright bureau et mobile
```

`packages/presentation` ne peut dépendre que de `packages/engine`. Cette frontière est contrôlée par le validateur automatisé.

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
- [Audit Sprint 4.0](docs/audits/sprint-4-0-stabilization.md)
- [Présentation stabilisée](docs/architecture/presentation-and-finishing.md)
- [Architecture runtime](docs/architecture/runtime.md)
- [Structure du dépôt](docs/architecture/repository-structure.md)
- [Micro-donjon et état d’expédition](docs/architecture/micro-dungeon-and-expedition.md)
- [Héros, créatures et comportements](docs/architecture/actors-and-behaviors.md)
- [Décisions d’architecture](docs/adr/README.md)

## Sources du projet

- **Gargottex V5** pour les données structurées et l’édition du contenu, strictement en lecture seule depuis ce projet ;
- **Google Drive** pour les règles humaines, le lore, les médias maîtres et comptes rendus ;
- **Figma / FigJam** pour les écrans et diagrammes ;
- ce dépôt pour le moteur, l’interface, les builds, les contrats et les tests.

## Licence

Aucune licence open source n’est accordée pour le moment. Les droits sur le code, l’univers, les textes et les ressources restent réservés à leur auteur.
