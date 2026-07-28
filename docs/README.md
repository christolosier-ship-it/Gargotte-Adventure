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
- [Micro-donjon et état d'expédition](architecture/micro-dungeon-and-expedition.md)
- [Héros, créatures et comportements](architecture/actors-and-behaviors.md)
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
- [Sprint 4 : héros, créatures et comportements de Bastognac](sprints/sprint-4.md)

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
- [Addenda post-fusion du Sprint 3.6](audits/sprint-3-6-post-fusion-p2-addendum.md)

Les audits historiques terminés ne sont pas réécrits. L'addenda consigne les sept P2 découverts après les fusions des PR #59 et #60.

## ADR du Sprint 4

- [ADR-0008 : micro-donjon manuel de trois salles](adr/0008-hand-authored-micro-dungeon.md)
- [ADR-0009 : profils de comportements déclaratifs](adr/0009-declarative-actor-behaviors.md)

## Design et sources externes

- [Interface du Sprint 1](design/sprint-1-interface.md)
- [Gabarits isométriques du Sprint 2](design/sprint-2-isometric-guidelines.md)
- [Environnement Bastognac du Sprint 2B.3](design/sprint-2b3-bastognac-environment.md)
- [Rapport Sprint 1 dans Google Drive](external/sprint-1-drive-content.md)
- [Relais Sprint 2 dans Google Drive](external/sprint-2-drive-content.md)
- [Relais Sprint 3 dans Google Drive](external/sprint-3-drive-content.md)
- [Relais Sprint 4 dans Google Drive](external/sprint-4-drive-content.md)
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

Le Sprint 3 est fonctionnellement livré et fusionné. Sa clôture définitive reste soumise au Sprint 4.0 et à la résolution de sept P2 post-fusion.

Le Sprint 4 est cadré comme un micro-donjon manuel de trois salles adjacentes couvrant :

- état minimal d'expédition ;
- quatre héros et seize créatures ;
- compétences et profils d'IA ;
- interactions des acteurs avec les objets ;
- influences déclaratives du Brouhaha ;
- transitions entre salles ;
- victoire ou défaite globale ;
- parcours joueur séparé du mode diagnostic ;
- sauvegarde et reprise sur l'ensemble du micro-donjon.

Le Sprint 5 conserve la génération complète des cinq étages, des salles et des rencontres, ainsi que loot, progression, campagne et boss final.

## Portes de démarrage

- La préparation documentaire du Sprint 4 est autorisée.
- Le Sprint 4.0 doit être livré avant le développement fonctionnel des lots 4.1 à 4.7.
- Aucun code ou contenu de jeu n'est introduit par ce cadrage.
