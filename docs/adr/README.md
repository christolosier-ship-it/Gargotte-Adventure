# Architecture Decision Records

Les ADR conservent les décisions structurantes, leur contexte et leurs conséquences. Ils évitent de redébattre une décision sans connaître les raisons initiales.

## Statuts

- **Proposé** : décision en discussion ;
- **Accepté** : décision active ;
- **Remplacé** : une décision plus récente prend le relais ;
- **Abandonné** : décision non retenue.

## Index

| ADR                                            | Statut  | Décision                                                  |
| ---------------------------------------------- | ------- | --------------------------------------------------------- |
| [ADR-0001](0001-pwa-typescript-pixijs.md)      | Accepté | PWA TypeScript avec plateau PixiJS et UI DOM              |
| [ADR-0002](0002-gargottex-content-boundary.md) | Accepté | Gargottex reste la source de vérité éditoriale            |
| [ADR-0003](0003-no-client-secrets.md)          | Accepté | Aucun secret ou appel OpenAI dans le client               |
| [ADR-0004](0004-lightweight-branching.md)      | Accepté | Branches courtes et Pull Requests, squash privilégié      |
| [ADR-0005](0005-deterministic-room-engine.md)  | Accepté | Moteur de salle, combat, IA et ligne de vue déterministes |

## Quand créer un ADR

Un ADR est attendu lorsqu’un changement :

- modifie une frontière entre packages ;
- change la source de vérité d’une donnée ;
- introduit une technologie ou une dépendance structurante ;
- modifie le format de sauvegarde ou de contenu de manière durable ;
- change un invariant de gameplay ;
- introduit une contrainte de sécurité ou de déploiement ;
- remplace une décision déjà acceptée.

Une correction locale, un ajustement visuel ou l’ajout d’un test ne nécessite généralement pas d’ADR.

## Modèle

```markdown
# ADR-XXXX — Titre

- Statut : Proposé | Accepté | Remplacé | Abandonné
- Date : AAAA-MM-JJ

## Contexte

## Décision

## Conséquences positives

## Compromis et risques

## Réévaluation
```

Lorsqu’un ADR est remplacé, les deux documents doivent pointer l’un vers l’autre et l’index doit être mis à jour.
