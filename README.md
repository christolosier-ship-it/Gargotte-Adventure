# Gargotte Adventure

Jeu de plateau numérique coopératif et tactique dans l’univers de **Gargotte & Va-Nu-Pieds**.

Gargotte Adventure vise une expérience installable, tactile et offline-first sur téléphone, tablette et ordinateur. Le premier vertical slice est consacré au **Château de Bastognac**.

## État du projet

**Sprint 2 — Plateau isométrique et pipeline graphique : livré**

**Désendettement pré-Sprint 3 : livré**

**Sprint 3.1 — Fondation de spawn déterministe : en cours dans la PR #34**

La version stable de `main` permet de :

- sélectionner de 1 à 4 héros officiels ;
- lancer une salle tactique 8 × 4 ;
- déplacer les héros avec trois actions par activation ;
- appliquer portée, ligne de vue et dégâts déterministes ;
- résoudre un tour ennemi explicable et reproductible ;
- gagner ou perdre la salle ;
- sauvegarder et reprendre la partie avec IndexedDB ;
- jouer au clavier, à la souris ou sur écran tactile en paysage ;
- utiliser un plateau 2D isométrique PixiJS avec caméra responsive ;
- sélectionner les cases et combattants directement sur le canvas ;
- afficher des sols, murs, obstacles et sprites pilotes Bastognac ;
- rester jouable grâce aux fallbacks si un asset ne charge pas.

Brünhilda et le Gobelin Bricoleur disposent de sprites pilotes. Les autres personnages, les statistiques, les compétences et une partie du bestiaire restent provisoires.

## Chantier actuel

La PR #34 implémente la première fondation du Sprint 3 :

- catalogue `CreatureDefinition` séparé des instances runtime ;
- `CreatureInstance` avec `creatureId` et identifiant propre ;
- points, demandes, résultats et refus de spawn ;
- identifiants reproductibles par séquence persistée ;
- ordre stable des positions candidates ;
- événements expliquant chaque apparition ou refus ;
- sauvegarde tactique version 2 et migration défensive de la version 1 ;
- renfort fixe de contrôle dans la salle pilote ;
- tests moteur, contenu, sauvegarde, desktop et mobile paysage.

Le générateur de Gargottex a été consulté en lecture seule. Gargottex n’est pas modifié par ce chantier. Son principe de séparation entre catalogue et composition est utile, mais son mélange aléatoire et son budget d’étage historique ne sont pas repris par le moteur de spawn.

Le cadrage complet est disponible dans :

- [Sprint 3 — Brouhaha, spawn et décor interactif](docs/sprints/sprint-3.md) ;
- [Architecture du moteur de spawn](docs/architecture/spawn-engine.md) ;
- [ADR-0007 — Définitions, instances et spawn déterministe](docs/adr/0007-creature-instances-and-deterministic-spawn.md).

## Génération future du donjon

Le Sprint 5 doit générer la géométrie complète des cinq étages et de leurs salles : topologie, dimensions, formes, murs, portes, passages, zones, obstacles structurels, points de spawn et décor initial.

Chaque salle recevra son propre budget de menace. **Le budget de menace est calculé et validé par salle, jamais comme un portefeuille global d’étage.**

Le générateur de rencontre transformera le budget de chaque salle en plan de population, puis le moteur de spawn instanciera les créatures correspondantes.

## Héros disponibles

- **Brünhilda la Torgnole** ;
- **Aelion Trois-Gorgées** ;
- **Magdalena Coquinelle** ;
- **Grompif Arcabidon**.

## Principes directeurs

1. **Un jeu, pas un éditeur.** Gargottex reste la source de vérité pour les créatures, héros, loots, quêtes et médias.
2. **Déterministe et lisible.** Aucun dé caché ni résultat opaque. Les règles, décisions ennemies, apparitions et générations doivent être explicables.
3. **Mobile d’abord.** Interface tactile en paysage, compatible iPhone, iPad, Android et ordinateur.
4. **Offline-first.** Les parties et réglages restent disponibles localement.
5. **Aucun secret côté client.** Une clé OpenAI ne doit jamais être incluse dans la PWA, les builds ou le dépôt.
6. **Une version démontrable à chaque sprint.** Les fondations servent le jeu, pas un château administratif.
7. **Le rendu ne gouverne pas les règles.** L’isométrie appartient au renderer et ne modifie pas le moteur tactique.
8. **Définition, instance et génération restent séparées.** Le contenu décrit, le spawn instancie et le générateur compose.
9. **Le budget de menace appartient à la salle.** La progression d’étage peut influencer les budgets, mais chaque rencontre est validée indépendamment.
10. **Gargottex reste une frontière externe.** Son code peut être étudié en lecture seule, mais Gargotte Adventure ne le modifie ni ne l’importe comme dépendance runtime.

## Architecture actuelle

```text
apps/game                    composition de la PWA et orchestration
packages/engine              moteur déterministe, salle tactique et spawn
packages/content-schema      validation Zod du contenu
packages/renderer            projection isométrique, assets, picking et profondeur PixiJS
packages/ui                  menus, HUD et commandes accessibles
packages/save                sauvegardes IndexedDB et migrations
packages/common              types et utilitaires partagés
packages/audio               fondation de réglages audio, non connectée à la boucle de jeu
content/bastognac            paquet de contenu et catalogue pilote
design/isometric             tokens, gabarits et handoff graphique
apps/game/public/assets      exports runtime SVG et WebP
tools/validators             validation du dépôt, du contenu et des assets
tests/e2e                    parcours Playwright desktop et mobile
```

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d’IndexedDB. Il reçoit un état et une intention, puis retourne un nouvel état, des événements ou une erreur métier typée.

Le diagramme d’architecture éditable est disponible dans [FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9).

## Démarrage local

### Prérequis

- Node.js **24 ou supérieur** ;
- npm ;
- Chromium Playwright uniquement pour les tests navigateur.

### Installation et développement

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

La commande suivante exécute les contrôles de formatage, contenu, types, tests unitaires, build et validation du dépôt :

```bash
npm run check
```

Les tests Playwright utilisent le build de production servi par Vite Preview, sur Chromium desktop et en format mobile paysage tactile.

## Documentation

- [Index documentaire](docs/README.md)
- [Vision produit](docs/product/vision.md)
- [Architecture générale](docs/architecture/overview.md)
- [Architecture de la salle tactique](docs/architecture/tactical-room.md)
- [Architecture du moteur de spawn](docs/architecture/spawn-engine.md)
- [Structure réelle et cible du dépôt](docs/architecture/repository-structure.md)
- [Roadmap](docs/roadmap.md)
- [Sprint 1 — rapport de clôture](docs/sprints/sprint-1.md)
- [Sprint 2 — rapport de clôture](docs/sprints/sprint-2.md)
- [Sprint 3 — cadrage](docs/sprints/sprint-3.md)
- [Audit d’alignement du Sprint 2](docs/audits/sprint-2-alignment.md)
- [Gabarits isométriques](docs/design/sprint-2-isometric-guidelines.md)
- [ADR-0007 — Spawn déterministe](docs/adr/0007-creature-instances-and-deterministic-spawn.md)
- [Sécurité et secrets](docs/security/secrets.md)
- [Décisions d’architecture](docs/adr/README.md)
- [Contribution](CONTRIBUTING.md)

## Branches et livraison

- `main` : état stable et publiable ;
- `sprint-N/<sujet>` : travail cohérent d’un sprint ;
- `feature/<sujet>` : fonctionnalité isolée ;
- `fix/<sujet>` : correction ciblée ;
- `docs/<sujet>` : documentation uniquement.

Chaque changement passe par une Pull Request et les contrôles automatisés avant fusion. La fusion par squash est privilégiée.

## Sources du projet

- **Gargottex V5** pour les données structurées et l’édition du contenu ;
- **Google Drive / Projet Gargotte** pour les règles, le lore, les sources humaines et les médias maîtres ;
- **Figma / FigJam** pour les écrans, composants, gabarits et diagrammes ;
- ce dépôt pour le moteur, l’interface, les paquets de contenu, les builds et les tests du jeu.

## Licence

Aucune licence open source n’est accordée pour le moment. Les droits sur le code, l’univers, les textes et les ressources restent réservés à leur auteur.
