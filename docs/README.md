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
- [Décisions d’architecture](adr/README.md)
- [ADR-0006 - Plateau 2D isométrique](adr/0006-isometric-2d-renderer.md)

## Sprints

- [Sprint 0 - cadrage historique](sprints/sprint-0.md)
- [Sprint 0 - rapport de clôture](sprints/sprint-0-completion.md)
- [Sprint 1 - rapport de clôture](sprints/sprint-1.md)
- [Sprint 2 - rapport de clôture](sprints/sprint-2.md)

## Audits

- [Audit d’alignement du Sprint 2](audits/sprint-2-alignment.md)
- [Stabilisation pré-Sprint 3 - murs arrière et rotation caméra](audits/pre-sprint-3-camera-aware-walls.md)
- [Désendettement structurel pré-Sprint 3](audits/pre-sprint-3-structural-debt.md)

## Design et sources externes

- [Interface du Sprint 1](design/sprint-1-interface.md)
- [Gabarits isométriques du Sprint 2](design/sprint-2-isometric-guidelines.md)
- [Environnement Bastognac du Sprint 2B.3](design/sprint-2b3-bastognac-environment.md)
- [Rapport Sprint 1 dans Google Drive](external/sprint-1-drive-content.md)
- [Relais Sprint 2 dans Google Drive](external/sprint-2-drive-content.md)
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

Après la clôture du Sprint 2, la stabilisation de la caméra et le désendettement pré-Sprint 3 :

- README aligné sur la salle isométrique actuelle ;
- roadmap mise à jour avec le Sprint 2 terminé et le Sprint 3 prochain ;
- architecture générale alignée sur le renderer et le pipeline d’assets livrés ;
- murs périphériques documentés comme quatre côtés physiques dont seuls les deux côtés arrière sont rendus ;
- rotation de contrôle 0°, 90°, 180° et 270° documentée sans modification du moteur ni de la sauvegarde ;
- orchestrateur applicatif et renderer découpés par responsabilité ;
- sauvegardes validées en profondeur ;
- garde-fous d’architecture automatisés ;
- rapports Sprint 0, Sprint 1 et Sprint 2 consolidés ;
- audits d’alignement et de stabilisation indexés ;
- index ADR complet jusqu’à ADR-0006 ;
- gabarits isométriques et contraintes d’assets actualisés ;
- suivi détaillé présent dans Google Drive ;
- aucun rig, moteur 3D ou animation squelettique introduit.
