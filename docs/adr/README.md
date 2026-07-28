# Architecture Decision Records

Les ADR conservent les décisions structurantes, leur contexte et leurs conséquences. Ils évitent de redébattre une décision sans connaître les raisons initiales.

## Statuts

- **Proposé** : décision en discussion ;
- **Accepté** : décision active ;
- **Remplacé** : une décision plus récente prend le relais ;
- **Abandonné** : décision non retenue.

## Index

| ADR                                                            | Statut  | Décision                                                  |
| -------------------------------------------------------------- | ------- | --------------------------------------------------------- |
| [ADR-0001](0001-pwa-typescript-pixijs.md)                      | Accepté | PWA TypeScript avec plateau PixiJS et UI DOM              |
| [ADR-0002](0002-gargottex-content-boundary.md)                 | Accepté | Gargottex reste la source de vérité éditoriale            |
| [ADR-0003](0003-no-client-secrets.md)                          | Accepté | Aucun secret ou appel OpenAI dans le client               |
| [ADR-0004](0004-lightweight-branching.md)                      | Accepté | Branches courtes et Pull Requests, squash privilégié      |
| [ADR-0005](0005-deterministic-room-engine.md)                  | Accepté | Moteur de salle, combat, IA et ligne de vue déterministes |
| [ADR-0006](0006-isometric-2d-renderer.md)                      | Accepté | Plateau 2D isométrique sous PixiJS, sans rig ni 3D        |
| [ADR-0007](0007-creature-instances-and-deterministic-spawn.md) | Accepté | Définitions, instances et spawn déterministe séparés      |
| [ADR-0008](0008-hand-authored-micro-dungeon.md)                | Accepté | Micro-donjon manuel de trois salles avant la génération   |
| [ADR-0009](0009-declarative-actor-behaviors.md)                | Accepté | Profils d'acteurs déclaratifs, déterministes et explicables |

## Décisions structurantes du Sprint 4

L'ADR-0008 fixe :

- trois salles adjacentes écrites à la main ;
- `ExpeditionState` au-dessus des `RoomState` locaux ;
- Brouhaha local à chaque salle ;
- aucune génération procédurale avant le Sprint 5.

L'ADR-0009 fixe :

- séparation des définitions et états d'acteurs ;
- profils génériques et combinables ;
- départage stable sans hasard implicite ;
- acteurs producteurs d'intentions ;
- moteurs existants responsables des conséquences.

Les statistiques, capacités, pondérations d'IA et valeurs d'équilibrage ne sont pas figées par ces ADR.

## Quand créer un ADR

Un ADR est attendu lorsqu'un changement :

- modifie une frontière entre packages ;
- change la source de vérité d'une donnée ;
- introduit une technologie ou une dépendance structurante ;
- modifie le format de sauvegarde ou de contenu de manière durable ;
- change un invariant de gameplay ;
- introduit une contrainte de sécurité ou de déploiement ;
- remplace une décision déjà acceptée.

Une correction locale, un ajustement visuel ou l'ajout d'un test ne nécessite généralement pas d'ADR.

## Modèle

```markdown
# ADR-XXXX : titre

- Statut : Proposé | Accepté | Remplacé | Abandonné
- Date : AAAA-MM-JJ

## Contexte

## Décision

## Conséquences positives

## Compromis et risques

## Réévaluation
```

Lorsqu'un ADR est remplacé, les deux documents doivent pointer l'un vers l'autre et l'index doit être mis à jour.
