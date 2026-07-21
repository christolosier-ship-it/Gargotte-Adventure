# Gargotte Adventure

Jeu de plateau numérique coopératif et tactique dans l’univers de **Gargotte & Va-Nu-Pieds**.

Gargotte Adventure vise une expérience installable, tactile et offline-first sur téléphone, tablette et ordinateur. Le premier vertical slice est consacré au **Château de Bastognac**.

## État du projet

**Sprint 1 — Boucle tactique d’une salle : livré**

La version actuelle permet de :

- sélectionner de 1 à 4 héros officiels ;
- lancer une salle tactique 8 × 4 ;
- déplacer les héros avec trois actions par activation ;
- appliquer portée, ligne de vue et dégâts déterministes ;
- résoudre un tour ennemi explicable et reproductible ;
- gagner ou perdre la salle ;
- sauvegarder et reprendre la partie avec IndexedDB ;
- jouer au clavier, à la souris ou sur écran tactile en paysage.

Les personnages, statistiques, obstacles et ennemis du scénario restent provisoires. Le **Brouhaha**, les objets interactifs, le loot, la progression, les compétences définitives et le donjon complet appartiennent aux prochains sprints.

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

## Architecture actuelle

```text
apps/game                    composition de la PWA et orchestration
packages/engine              moteur déterministe et salle tactique
packages/content-schema      validation Zod du contenu
packages/renderer            plateau PixiJS
packages/ui                  menus, HUD et commandes accessibles
packages/save                sauvegardes IndexedDB et migrations
packages/common              types et utilitaires partagés
content/bastognac            paquet de contenu du vertical slice
tools/validators             validation du dépôt et du contenu
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

La commande suivante exécute les contrôles de formatage, contenu, types, tests unitaires et build :

```bash
npm run check
```

Les tests Playwright utilisent le build de production servi par Vite Preview, sur Chromium desktop et en format mobile paysage tactile.

## Documentation

- [Vision produit](docs/product/vision.md)
- [Architecture générale](docs/architecture/overview.md)
- [Architecture de la salle tactique](docs/architecture/tactical-room.md)
- [Structure réelle et cible du dépôt](docs/architecture/repository-structure.md)
- [Roadmap](docs/roadmap.md)
- [Sprint 0 — cadrage historique](docs/sprints/sprint-0.md)
- [Sprint 0 — rapport de clôture](docs/sprints/sprint-0-completion.md)
- [Sprint 1 — rapport de clôture](docs/sprints/sprint-1.md)
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
- **Figma / FigJam** pour les écrans, composants et diagrammes ;
- ce dépôt pour le moteur, l’interface, les paquets de contenu, les builds et les tests du jeu.

## Licence

Aucune licence open source n’est accordée pour le moment. Les droits sur le code, l’univers, les textes et les ressources restent réservés à leur auteur.
