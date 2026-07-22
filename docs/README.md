# Documentation de Gargotte Adventure

Ce dossier rassemble la documentation technique et produit versionnée avec le code.

## Point de départ

- [README du projet](../README.md)
- [Vision produit](product/vision.md)
- [Roadmap](roadmap.md)
- [Guide de contribution](../CONTRIBUTING.md)

## Architecture

- [Architecture générale](architecture/overview.md)
- [Structure du dépôt](architecture/repository-structure.md)
- [Salle tactique](architecture/tactical-room.md)
- [Décisions d’architecture](adr/README.md)
- [ADR-0006 - Plateau 2D isométrique](adr/0006-isometric-2d-renderer.md)

## Sprints

- [Sprint 0 - cadrage historique](sprints/sprint-0.md)
- [Sprint 0 - rapport de clôture](sprints/sprint-0-completion.md)
- [Sprint 1 - rapport de clôture](sprints/sprint-1.md)
- [Sprint 2 - rapport de clôture](sprints/sprint-2.md)

## Audits

- [Audit d’alignement du Sprint 2](audits/sprint-2-alignment.md)

## Design et sources externes

- [Interface du Sprint 1](design/sprint-1-interface.md)
- [Gabarits isométriques du Sprint 2](design/sprint-2-isometric-guidelines.md)
- [Rapport Sprint 1 dans Google Drive](external/sprint-1-drive-content.md)
- [Diagramme FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9)

## Sécurité

- [Gestion des secrets](security/secrets.md)
- [ADR-0003 - Aucun secret ou appel OpenAI dans le client](adr/0003-no-client-secrets.md)

## Rôle des différentes sources

| Source         | Rôle                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| GitHub         | Code, architecture technique, ADR, formats, tests et historique des changements |
| Gargottex      | Source de vérité éditoriale des données structurées                             |
| Google Drive   | Règles humaines, lore, médias maîtres, comptes rendus et archives               |
| Figma / FigJam | Écrans, composants, gabarits, tokens et diagrammes                              |

## Règles de maintenance

1. La documentation GitHub décrit l’état technique réel de `main`.
2. Une cible future est explicitement étiquetée comme telle.
3. Une fonctionnalité n’est marquée comme livrée qu’après fusion et CI verte.
4. Les rapports de sprint sont historiques et ne servent pas d’instructions actives.
5. Les ADR consignent les décisions structurantes, pas les détails locaux.
6. Drive, Gargottex et Figma ne sont pas recopiés intégralement dans le dépôt.
7. Les liens internes au dépôt sont relatifs.
8. Toute modification d’architecture, de sauvegarde, de renderer ou de format de contenu met à jour les pages associées.

## État documentaire

Après la clôture du Sprint 2 :

- README aligné sur la salle isométrique actuelle ;
- roadmap mise à jour avec le Sprint 2 terminé et le Sprint 3 prochain ;
- architecture générale alignée sur le renderer et le pipeline d’assets livrés ;
- rapports Sprint 0, Sprint 1 et Sprint 2 consolidés ;
- audit d’alignement du Sprint 2 ajouté ;
- index ADR complet jusqu’à ADR-0006 ;
- gabarits isométriques et contraintes d’assets actualisés ;
- suivi détaillé présent dans Google Drive ;
- aucun rig, moteur 3D ou animation squelettique introduit.
