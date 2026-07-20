# Gargotte Adventure

Jeu de plateau numérique coopératif dans l’univers de **Gargotte & Va-Nu-Pieds**.

Le projet vise une expérience tactile, installable et jouable sur téléphone, tablette et ordinateur. Le premier vertical slice sera consacré au **Château de Bastognac**.

## État du projet

**Sprint 0 — Fondations**

- dépôt et gouvernance GitHub ;
- documentation d’architecture ;
- séparation stricte entre moteur et contenu ;
- pipeline qualité et prévention des fuites de secrets ;
- préparation du futur socle PWA TypeScript.

Aucune version jouable n’est encore publiée depuis ce dépôt.

## Principes directeurs

1. **Un jeu, pas un éditeur.** Gargottex reste la source de vérité pour les créatures, héros, loots, quêtes et médias.
2. **Déterministe et lisible.** Aucun dé caché ni résultat opaque. Les règles doivent être explicables au joueur.
3. **Mobile d’abord.** Interface tactile en paysage, compatible iPhone, iPad, Android et ordinateur.
4. **Offline-first.** Les parties et réglages doivent rester disponibles localement.
5. **Aucun secret côté client.** Une clé OpenAI ne doit jamais être incluse dans la PWA, les builds ou le dépôt.
6. **Une version jouable à chaque sprint fonctionnel.** Les fondations doivent servir le jeu, pas devenir un château administratif.

## Architecture cible

```text
Gargottex V5 ── export JSON versionné ──► pipeline de contenu
Google Drive ── règles, lore, médias ────► pipeline de contenu
                                                  │
                                                  ▼
                                      Gargotte Adventure PWA
                                      ├─ moteur déterministe
                                      ├─ rendu WebGL
                                      ├─ interface tactile
                                      ├─ sauvegarde IndexedDB
                                      └─ audio et animations
```

Le schéma éditable est disponible dans [FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9).

## Documentation

- [Vision produit](docs/product/vision.md)
- [Architecture générale](docs/architecture/overview.md)
- [Structure du dépôt](docs/architecture/repository-structure.md)
- [Roadmap](docs/roadmap.md)
- [Sprint 0](docs/sprints/sprint-0.md)
- [Sécurité et secrets](docs/security/secrets.md)
- [Décisions d’architecture](docs/adr/README.md)
- [Contribution](CONTRIBUTING.md)

## Branches et livraison

- `main` : état stable et publiable ;
- `sprint-N/<sujet>` : travail d’un sprint ;
- `feature/<sujet>` : fonctionnalité isolée ;
- `fix/<sujet>` : correction ciblée.

Les changements passent par une Pull Request et les contrôles automatisés avant fusion.

## Sources du projet

- dépôt **Gargotte-V5 / Gargottex** pour les données structurées ;
- dossier Google Drive **Projet Gargotte** pour les règles, le lore et les médias sources ;
- Figma / FigJam pour le design system, les écrans et les diagrammes ;
- ce dépôt pour le moteur, l’interface, les builds et les tests du jeu.

## Licence

Aucune licence open source n’est accordée pour le moment. Les droits sur le code, l’univers, les textes et les ressources restent réservés à leur auteur.


## Sprint 1 jouable

La branche Sprint 1 ajoute une salle tactique jouable : sélection de 1 à 4 héros, grille 8 × 4, déplacements, attaques, IA ennemie déterministe, victoire, défaite et sauvegarde locale v2. Les statistiques et jetons sont provisoires.
