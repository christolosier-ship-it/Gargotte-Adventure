# Gargotte Adventure

Jeu de plateau numérique coopératif et tactique dans l'univers de **Gargotte & Va-Nu-Pieds**.

Gargotte Adventure vise une expérience installable, tactile et offline-first sur téléphone, tablette et ordinateur. Le premier vertical slice est consacré au **Château de Bastognac**.

## Jouer

[🎮 Ouvrir Gargotte Adventure sur GitHub Pages](https://christolosier-ship-it.github.io/Gargotte-Adventure/)

## État du projet

- **Sprint 2** : plateau isométrique livré ;
- **Sprint 3.1** : spawn déterministe livré par la PR #35 ;
- **Sprint 3.2** : Brouhaha 0 à 12 livré par la PR #37 ;
- **Sprint 3.3** : objets interactifs livrés par la PR #43 ;
- **Sprint 3.4** : réactions en chaîne livrées par la PR #45 ;
- **Sprint 3.5** : prochaine étape, renforts déclenchés par le Brouhaha.

La version stable permet de :

- sélectionner de 1 à 4 héros officiels ;
- jouer une salle tactique 8 × 4 ;
- déplacer, attaquer et résoudre une IA déterministe ;
- gagner ou perdre la salle ;
- instancier des renforts scriptés avec des identifiants reproductibles ;
- faire évoluer une jauge de Brouhaha de 0 à 12 ;
- interagir avec tables, tonneaux, grilles, torches et piliers ;
- pousser certains objets et propager des réactions déclarées par la salle ;
- appliquer des transitions, déplacements, dégâts et demandes de Brouhaha en cascade ;
- conserver une causalité persistante et interrompre les cycles explicitement ;
- prendre en compte le décor dans le déplacement, le spawn et la ligne de vue ;
- sauvegarder et reprendre exactement la salle dans IndexedDB ;
- jouer au clavier, à la souris ou sur écran tactile en paysage ;
- rester jouable grâce aux formes de repli lorsqu'un asset manque.

Brünhilda et le Gobelin Bricoleur disposent de sprites pilotes. Les autres personnages, statistiques, compétences et une partie du bestiaire restent provisoires.

## Livraison Sprint 3.4

La PR #45, fusionnée par squash au commit `17ad00c0cb5abb9e66da6e320903f56606a8e8d5`, livre :

- la poussée déterministe d'objets selon la position logique du héros ;
- un graphe de réactions déclaré par salle ;
- une propagation FIFO stable des transitions, déplacements, dégâts et demandes de Brouhaha ;
- une causalité explicite depuis l'interaction racine jusqu'à chaque conséquence ;
- un historique persistant avec identifiants monotones ;
- des garde-fous contre les cycles et les propagations excessives ;
- la sauvegarde tactique version 5 et les migrations depuis les versions 1 à 4 ;
- un scénario pilote Bastognac validé sur bureau et mobile paysage.

Aucun renfort n'est encore déclenché automatiquement. Le Sprint 3.5 reliera les franchissements de seuil du Brouhaha au moteur de spawn existant.

Gargottex reste strictement en lecture seule et n'est pas une dépendance runtime.

## Prochaine étape : Sprint 3.5

Le cadrage prévoit :

- des règles de seuil déclarées par salle ;
- un déclenchement uniquement lors d'un franchissement montant ;
- des `SpawnRequest` déterministes ;
- des limites d'activation persistées ;
- des succès totaux, partiels ou refus expliqués ;
- une victoire calculée après les renforts de la résolution courante ;
- une sauvegarde sans déclenchement rétroactif après migration.

Voir [Renforts déclenchés par le Brouhaha](docs/architecture/brouhaha-reinforcements.md).

## Génération future du donjon

Le Sprint 5 générera la topologie des cinq étages et la géométrie complète des salles : dimensions, formes, murs, portes, passages, zones, obstacles, points de spawn et décor initial.

Chaque salle reçoit son propre budget de menace. **Le budget est calculé et validé par salle, jamais comme un portefeuille global d'étage.**

Le générateur compose une rencontre, puis le moteur de spawn crée les instances.

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
7. **Le rendu ne gouverne pas les règles.**
8. **Définitions, instances et génération restent séparées.**
9. **Le budget de menace appartient à la salle.**
10. **Gargottex reste une frontière externe en lecture seule.**

## Architecture actuelle

```text
apps/game                    composition de la PWA et orchestration
packages/engine              moteur tactique, spawn, Brouhaha, objets et réactions
packages/content-schema      validation Zod du contenu
packages/renderer            projection, assets, picking et profondeur PixiJS
packages/ui                  menus, HUD et commandes accessibles
packages/save                sauvegardes IndexedDB versionnées et migrations
packages/common              types et utilitaires partagés
packages/audio               fondation audio non connectée à la boucle
content/bastognac            donjon, créatures, effets, objets et salle pilote
design/isometric             tokens et gabarits graphiques
apps/game/public/assets      exports runtime SVG et WebP
tools/validators             validation du dépôt, contenu et assets
tests/e2e                    parcours Playwright desktop et mobile
```

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB. Il reçoit un état et une intention, puis retourne un nouvel état, des événements ou une erreur métier typée.

## Démarrage local

### Prérequis

- Node.js **24 ou supérieur** ;
- npm ;
- Chromium Playwright pour les tests navigateur.

### Installation

```bash
npm ci
npm run dev
```

### Contrôles

```bash
npm run format:check
npm run validate:content
npm run typecheck
npm run test
npm run build
python tools/validate_repository.py
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run check` exécute formatage, contenu, types, tests unitaires, build et validation structurelle.

## Documentation

- [Index documentaire](docs/README.md)
- [Vision produit](docs/product/vision.md)
- [Roadmap](docs/roadmap.md)
- [Architecture générale](docs/architecture/overview.md)
- [Salle tactique](docs/architecture/tactical-room.md)
- [Moteur de spawn](docs/architecture/spawn-engine.md)
- [Moteur de Brouhaha](docs/architecture/brouhaha.md)
- [Objets interactifs](docs/architecture/interactable-objects.md)
- [Réactions en chaîne](docs/architecture/chain-reactions.md)
- [Renforts de Brouhaha, cadrage Sprint 3.5](docs/architecture/brouhaha-reinforcements.md)
- [Suivi du Sprint 3](docs/sprints/sprint-3.md)
- [Audit Sprint 3.4](docs/audits/sprint-3-4-chain-reactions.md)
- [Décisions d'architecture](docs/adr/README.md)
- [Contribution](CONTRIBUTING.md)

## Branches et livraison

- `main` : état stable et publiable ;
- `sprint-N/<sujet>` : travail cohérent d'un sprint ;
- `feature/<sujet>` : fonctionnalité isolée ;
- `fix/<sujet>` : correction ciblée ;
- `docs/<sujet>` : documentation uniquement.

Chaque changement passe par une Pull Request et les contrôles automatisés. La fusion par squash est privilégiée.

## Sources du projet

- **Gargottex V5** pour les données structurées et l'édition du contenu ;
- **Google Drive** pour les règles, le lore, les médias maîtres et comptes rendus ;
- **Figma / FigJam** pour les écrans et diagrammes ;
- ce dépôt pour le moteur, l'interface, les builds et les tests.

## Licence

Aucune licence open source n'est accordée pour le moment. Les droits sur le code, l'univers, les textes et les ressources restent réservés à leur auteur.
