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
- [Architecture d'exécution](architecture/runtime.md)
- [Salle tactique](architecture/tactical-room.md)
- [Moteur de spawn déterministe](architecture/spawn-engine.md)
- [Moteur de Brouhaha](architecture/brouhaha.md)
- [Objets interactifs](architecture/interactable-objects.md)
- [Réactions en chaîne déterministes](architecture/chain-reactions.md)
- [Renforts déclenchés par le Brouhaha](architecture/brouhaha-reinforcements.md)
- [Présentation et finition du Sprint 3.6](architecture/presentation-and-finishing.md)
- [Décisions d'architecture](adr/README.md)
- [ADR-0006 : plateau 2D isométrique](adr/0006-isometric-2d-renderer.md)
- [ADR-0007 : définitions, instances et spawn déterministe](adr/0007-creature-instances-and-deterministic-spawn.md)

## Sprints

- [Sprint 0 : cadrage historique](sprints/sprint-0.md)
- [Sprint 0 : rapport de clôture](sprints/sprint-0-completion.md)
- [Sprint 1 : rapport de clôture](sprints/sprint-1.md)
- [Sprint 2 : rapport de clôture](sprints/sprint-2.md)
- [Sprint 3 : Brouhaha, spawn et décor interactif](sprints/sprint-3.md)

## Audits

- [Audit d'alignement du Sprint 2](audits/sprint-2-alignment.md)
- [Stabilisation pré-Sprint 3 : murs arrière et rotation caméra](audits/pre-sprint-3-camera-aware-walls.md)
- [Désendettement structurel pré-Sprint 3](audits/pre-sprint-3-structural-debt.md)
- [Sprint 3.1 : fondation de spawn déterministe](audits/sprint-3-1-spawn-foundation.md)
- [Sprint 3.2 : état et effets du Brouhaha](audits/sprint-3-2-brouhaha-state.md)
- [Sprint 3.3 : objets interactifs](audits/sprint-3-3-interactable-objects.md)
- [Sprint 3.4 : réactions en chaîne déterministes](audits/sprint-3-4-chain-reactions.md)
- [Sprint 3.5 : renforts de Brouhaha](audits/sprint-3-5-brouhaha-reinforcements.md)

## Design et sources externes

- [Interface du Sprint 1](design/sprint-1-interface.md)
- [Gabarits isométriques du Sprint 2](design/sprint-2-isometric-guidelines.md)
- [Environnement Bastognac du Sprint 2B.3](design/sprint-2b3-bastognac-environment.md)
- [Rapport Sprint 1 dans Google Drive](external/sprint-1-drive-content.md)
- [Relais Sprint 2 dans Google Drive](external/sprint-2-drive-content.md)
- [Relais Sprint 3 dans Google Drive](external/sprint-3-drive-content.md)
- [Diagramme FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9)

## Sécurité

- [Gestion des secrets](security/secrets.md)
- [ADR-0003 : aucun secret ou appel OpenAI dans le client](adr/0003-no-client-secrets.md)

## Rôle des différentes sources

| Source         | Rôle                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| GitHub         | Code, architecture technique, ADR, formats, tests et historique des changements |
| Gargottex      | Source de vérité éditoriale et référence consultable en lecture seule           |
| Google Drive   | Règles humaines, lore, médias maîtres, comptes rendus et archives               |
| Figma / FigJam | Écrans, composants, gabarits, tokens et diagrammes                              |

Gargottex n'est pas une dépendance runtime de Gargotte Adventure. Le dépôt `christolosier-ship-it/Gargotte-V5` peut être étudié, mais il n'est jamais modifié depuis ce projet.

## Règles de maintenance

1. La documentation GitHub décrit l'état technique réel de `main` ou identifie explicitement une cible non implémentée.
2. Une cible future est étiquetée comme telle.
3. Une fonctionnalité n'est marquée comme livrée qu'après fusion et CI verte.
4. Les rapports de sprint sont historiques et ne servent pas d'instructions actives.
5. Les ADR consignent les décisions structurantes, pas les détails locaux.
6. Drive, Gargottex et Figma ne sont pas recopiés intégralement dans le dépôt.
7. Les liens internes au dépôt sont relatifs.
8. Toute modification d'architecture, de sauvegarde, de renderer ou de format de contenu met à jour les pages associées.
9. Toute modification des budgets de menace précise leur niveau d'application.
10. Les documents distinguent définition éditoriale, instance runtime et génération.
11. Toute étude de code Gargottex mentionne son caractère strictement non modifiant.
12. Une migration de sauvegarde ne doit jamais déclencher rétroactivement une règle runtime.
13. Un effet de présentation ne doit jamais modifier l'état ou l'ordre des règles métier.

## État documentaire

Après fusion des correctifs post-Sprint 3.5 et préparation du Sprint 3.6 :

- les Sprints 3.1 à 3.5 sont implémentés ;
- la base stable du Sprint 3.6 est `ecc933cf4c05bf0426d2198c92e748d2052ecdd3` ;
- les deux P2 relatives au roster ennemi sont corrigées par les PR #53 et #54 ;
- l'audit de livraison 3.5 contient les références finales de fusion, de correction et de CI ;
- les renforts sont déclarés par salle et déclenchés uniquement lors d'un franchissement montant ;
- succès total, partiel et refus sont historisés et expliqués ;
- la salle tactique utilise la sauvegarde version 6 ;
- les migrations depuis les versions 1 à 5 ne déclenchent aucun renfort rétroactif ;
- le Sprint 3.6 est cadré comme une couche de présentation dérivée des événements ;
- overlays, animations, sons et journal ne modifient jamais `RoomState` ;
- la reprise ne rejoue aucun effet transitoire historique ;
- les diagnostics du renderer servent de garde-fous de stabilité ;
- Gargottex reste strictement en lecture seule.

Le relais Google Drive est aligné sur l'ouverture du Sprint 3.6.
