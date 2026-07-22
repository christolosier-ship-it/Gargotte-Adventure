# Gargotte Adventure

Jeu de plateau numérique coopératif et tactique dans l’univers de **Gargotte & Va-Nu-Pieds**.

Gargotte Adventure vise une expérience installable, tactile et offline-first sur téléphone, tablette et ordinateur. Le premier vertical slice est consacré au **Château de Bastognac**.

## État du projet

**Sprint 2 - Plateau isométrique et pipeline graphique : livré**

La version actuelle permet de :

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

## Prochaine étape théorique

**Sprint 3 - Brouhaha et décor interactif**

Le prochain sprint doit exploiter le socle isométrique pour introduire :

- la jauge de Brouhaha 0-12 ;
- les événements et seuils associés ;
- les objets interactifs ;
- les réactions en chaîne ;
- un journal explicatif enrichi ;
- les nouveaux états de sauvegarde ;
- les premiers effets visuels et sonores liés au décor.

Le démarrage du Sprint 3 reste précédé d’une phase d’ajustements produit et visuels sur la version Sprint 2.

## Héros disponibles

- **Brünhilda la Torgnole** ;
- **Aelion Trois-Gorgées** ;
- **Magdalena Coquinelle** ;
- **Grompif Arcabidon**.

## Principes directeurs

1. **Un jeu, pas un éditeur.** Gargottex reste la source de vérité pour les créatures, héros, loots, quêtes et médias.
2. **Déterministe et lisible.** Aucun dé caché ni résultat opaque. Les règles et décisions ennemies doivent être explicables.
3. **Mobile d’abord.** Interface tactile en paysage, compatible iPhone, iPad, Android et ordinateur.
4. **Offline-first.** Les parties et réglages restent disponibles localement.
5. **Aucun secret côté client.** Une clé OpenAI ne doit jamais être incluse dans la PWA, les builds ou le dépôt.
6. **Une version démontrable à chaque sprint.** Les fondations servent le jeu, pas un château administratif.
7. **Le rendu ne gouverne pas les règles.** L’isométrie appartient au renderer et ne modifie pas le moteur tactique.

## Architecture actuelle

```text
apps/game                    composition de la PWA et orchestration
packages/engine              moteur déterministe et salle tactique
packages/content-schema      validation Zod du contenu
packages/renderer            projection isométrique, assets, picking et profondeur PixiJS
packages/ui                  menus, HUD et commandes accessibles
packages/save                sauvegardes IndexedDB et migrations
packages/common              types et utilitaires partagés
packages/audio               fondation de réglages audio, non connectée à la boucle de jeu
content/bastognac            paquet de contenu du vertical slice
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
- [Structure réelle et cible du dépôt](docs/architecture/repository-structure.md)
- [Roadmap](docs/roadmap.md)
- [Sprint 1 - rapport de clôture](docs/sprints/sprint-1.md)
- [Sprint 2 - rapport de clôture](docs/sprints/sprint-2.md)
- [Audit d’alignement du Sprint 2](docs/audits/sprint-2-alignment.md)
- [Gabarits isométriques](docs/design/sprint-2-isometric-guidelines.md)
- [ADR-0006 - Plateau 2D isométrique](docs/adr/0006-isometric-2d-renderer.md)
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
