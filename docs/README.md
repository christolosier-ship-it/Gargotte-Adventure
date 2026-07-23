# Documentation de Gargotte Adventure

Ce dossier rassemble la documentation technique et produit versionnée avec le code.

## Point de départ

- [README du projet](../README.md)
- [Vision produit](product/vision.md)
- [Roadmap](roadmap.md)
- [Guide de contribution](../CONTRIBUTING.md)
- [Réglages GitHub](github-settings.md)

## Architecture

- [Architecture générale](architecture/overview.md)
- [Structure du dépôt](architecture/repository-structure.md)
- [Architecture d’exécution](architecture/runtime.md)
- [Salle tactique](architecture/tactical-room.md)
- [Moteur de spawn déterministe](architecture/spawn-engine.md)
- [Décisions d’architecture](adr/README.md)
- [ADR-0006 — Plateau 2D isométrique](adr/0006-isometric-2d-renderer.md)
- [ADR-0007 — Définitions, instances et spawn déterministe](adr/0007-creature-instances-and-deterministic-spawn.md)

## Sprints

- [Sprint 0 — cadrage historique](sprints/sprint-0.md)
- [Sprint 0 — rapport de clôture](sprints/sprint-0-completion.md)
- [Sprint 1 — rapport de clôture](sprints/sprint-1.md)
- [Sprint 2 — rapport de clôture](sprints/sprint-2.md)
- [Sprint 3 — Brouhaha, spawn et décor interactif](sprints/sprint-3.md)

## Audits

- [Audit d’alignement du Sprint 2](audits/sprint-2-alignment.md)
- [Stabilisation pré-Sprint 3 — murs arrière et rotation caméra](audits/pre-sprint-3-camera-aware-walls.md)
- [Désendettement structurel pré-Sprint 3](audits/pre-sprint-3-structural-debt.md)
- [Sprint 3.1 — Fondation de spawn déterministe](audits/sprint-3-1-spawn-foundation.md)

## Design et sources externes

- [Interface du Sprint 1](design/sprint-1-interface.md)
- [Gabarits isométriques du Sprint 2](design/sprint-2-isometric-guidelines.md)
- [Environnement Bastognac du Sprint 2B.3](design/sprint-2b3-bastognac-environment.md)
- [Rapport Sprint 1 dans Google Drive](external/sprint-1-drive-content.md)
- [Relais Sprint 2 dans Google Drive](external/sprint-2-drive-content.md)
- [Cadrage Sprint 3 dans Google Drive](external/sprint-3-drive-content.md)
- [Diagramme FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9)

## Sécurité

- [Gestion des secrets](security/secrets.md)
- [ADR-0003 — Aucun secret ou appel OpenAI dans le client](adr/0003-no-client-secrets.md)

## Rôle des différentes sources

| Source         | Rôle                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| GitHub         | Code, architecture technique, ADR, formats, tests et historique des changements |
| Gargottex      | Source de vérité éditoriale et référence consultable en lecture seule           |
| Google Drive   | Règles humaines, lore, médias maîtres, comptes rendus et archives               |
| Figma / FigJam | Écrans, composants, gabarits, tokens et diagrammes                              |

Gargottex n’est pas une dépendance runtime de Gargotte Adventure. Le dépôt `christolosier-ship-it/Gargotte-V5` peut être étudié, mais il n’est jamais modifié depuis ce projet.

## Règles de maintenance

1. La documentation GitHub décrit l’état technique réel de `main` ou identifie explicitement une PR en cours.
2. Une cible future est étiquetée comme telle.
3. Une fonctionnalité n’est marquée comme livrée qu’après fusion et CI verte.
4. Les rapports de sprint sont historiques et ne servent pas d’instructions actives.
5. Les ADR consignent les décisions structurantes, pas les détails locaux.
6. Drive, Gargottex et Figma ne sont pas recopiés intégralement dans le dépôt.
7. Les liens internes au dépôt sont relatifs.
8. Toute modification d’architecture, de sauvegarde, de renderer ou de format de contenu met à jour les pages associées.
9. Toute modification des budgets de menace précise leur niveau d’application.
10. Les documents distinguent définition éditoriale, instance runtime et génération.
11. Toute étude de code Gargottex mentionne son caractère strictement non modifiant.

## État documentaire

Pendant le Sprint 3.1 :

- README aligné sur la PR #34 ;
- roadmap et cadrage Sprint 3 conservés ;
- architecture générale alignée sur le spawn réellement implémenté ;
- structure du dépôt mise à jour ;
- salle tactique documentée en version 2 ;
- moteur de spawn documenté avec algorithme, événements et sauvegarde ;
- ADR-0007 respectée ;
- budget de menace maintenu par salle et hors du spawn ;
- étude du générateur Gargottex consignée en lecture seule ;
- sauvegarde version 2 et migration version 1 documentées ;
- audit de la fondation de spawn indexé ;
- suivi d’exécution présent dans Google Drive ;
- statut final encore conditionné à la CI et au contrôle de la PR #34.
