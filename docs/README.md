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

## Sprints

- [Sprint 0 : cadrage historique](sprints/sprint-0.md)
- [Sprint 0 : rapport de clôture](sprints/sprint-0-completion.md)
- [Sprint 1 : rapport de clôture](sprints/sprint-1.md)
- [Sprint 2 : rapport de clôture](sprints/sprint-2.md)
- [Sprint 3 : Brouhaha, spawn, décor et finition](sprints/sprint-3.md)

## Audits

- [Audit d'alignement du Sprint 2](audits/sprint-2-alignment.md)
- [Stabilisation pré-Sprint 3 : murs arrière et rotation caméra](audits/pre-sprint-3-camera-aware-walls.md)
- [Désendettement structurel pré-Sprint 3](audits/pre-sprint-3-structural-debt.md)
- [Sprint 3.1 : fondation de spawn déterministe](audits/sprint-3-1-spawn-foundation.md)
- [Sprint 3.2 : état et effets du Brouhaha](audits/sprint-3-2-brouhaha-state.md)
- [Sprint 3.3 : objets interactifs](audits/sprint-3-3-interactable-objects.md)
- [Sprint 3.4 : réactions en chaîne déterministes](audits/sprint-3-4-chain-reactions.md)
- [Sprint 3.5 : renforts de Brouhaha](audits/sprint-3-5-brouhaha-reinforcements.md)
- [Sprint 3.6 : présentation et finition](audits/sprint-3-6-presentation-finishing.md)

## Design et sources externes

- [Interface du Sprint 1](design/sprint-1-interface.md)
- [Gabarits isométriques du Sprint 2](design/sprint-2-isometric-guidelines.md)
- [Environnement Bastognac du Sprint 2B.3](design/sprint-2b3-bastognac-environment.md)
- [Rapport Sprint 1 dans Google Drive](external/sprint-1-drive-content.md)
- [Relais Sprint 2 dans Google Drive](external/sprint-2-drive-content.md)
- [Relais Sprint 3 dans Google Drive](external/sprint-3-drive-content.md)
- [Diagramme FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9)

## Rôle des sources

| Source         | Rôle                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| GitHub         | Code, architecture technique, ADR, formats, tests et historique des changements |
| Gargottex      | Source de vérité éditoriale et référence consultable en lecture seule           |
| Google Drive   | Règles humaines, lore, médias maîtres, comptes rendus et archives               |
| Figma / FigJam | Écrans, composants, gabarits, tokens et diagrammes                              |

Gargottex n'est pas une dépendance runtime et reste strictement en lecture seule.

## État documentaire

Le Sprint 3 est terminé :

- Sprints 3.1 à 3.6 implémentés ;
- livraison fonctionnelle 3.6 par la PR #59 au commit `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4` ;
- routeur pur de présentation, cues PixiJS, audio local, journal groupé et reprise sans replay ;
- sauvegarde tactique toujours en version 6 ;
- mouvement réduit, mute, volume et diagnostics de stabilité validés ;
- tests unitaires et Playwright bureau/mobile verts ;
- prochaine phase : Sprint 4, héros et créatures de Bastognac.

Le relais GitHub et le document Google Drive sont alignés sur cette clôture.
