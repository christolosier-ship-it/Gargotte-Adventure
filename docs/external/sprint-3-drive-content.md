# Relais Google Drive, Sprint 3

Le cadrage humain et les comptes rendus du Sprint 3 sont conservés dans Google Drive :

- [Gargotte Adventure, Sprint 3.6, Présentation et finition](https://docs.google.com/document/d/1bzIqauCne-OThK1ZSd2IdYKmD_yBeRPJPTkb6EvRH9E/edit)

## État du document Drive

Le document Drive a été réellement actualisé le 27 juillet 2026. Son titre, son en-tête, son statut et sa section active sont alignés sur l'ouverture du Sprint 3.6.

Il conserve l'historique :

- du cadrage initial du Sprint 3 ;
- de la livraison du spawn déterministe 3.1 ;
- de la livraison du Brouhaha 3.2 ;
- de la livraison des objets interactifs 3.3 ;
- de la livraison des réactions en chaîne 3.4 ;
- du cadrage, de la livraison et des correctifs P2 des renforts de Brouhaha 3.5.

La section active d'ouverture du Sprint 3.6 précise :

- la fermeture du Sprint 3.5 après les PR #49, #53, #54 et #56 ;
- la base fonctionnelle `d7e7c11a4352f32881299e2135826724d17f3a93` ;
- l'issue d'implémentation [#57](https://github.com/christolosier-ship-it/Gargotte-Adventure/issues/57) ;
- la Pull Request documentaire de lancement #58 ;
- le contrat du roster du tour ennemi ;
- la sérialisation permanente de `enemyTurnRoster` en sauvegarde version 6 ;
- son obligation d'être vide hors de la phase `enemy-turn` ;
- l'objectif de présentation, journal, audio utile et stabilité du Sprint 3.6 ;
- la frontière interdisant aux effets visuels, sonores ou textuels de modifier `RoomState` ou l'ordre métier.

## Rôle du document Drive

- décisions produit validées ;
- articulation entre les Sprints 3, 4 et 5 ;
- budget de menace défini par salle ;
- génération complète des salles et étages prévue au Sprint 5 ;
- comptes rendus de livraison et contrôles humains ;
- synthèse lisible du périmètre actif.

## Source technique active

Les contrats exécutables, formats, critères de tests et architectures restent versionnés dans GitHub :

- [Issue Sprint 3.6 #57](https://github.com/christolosier-ship-it/Gargotte-Adventure/issues/57) ;
- [Roadmap](../roadmap.md) ;
- [Suivi du Sprint 3](../sprints/sprint-3.md) ;
- [Architecture d'exécution](../architecture/runtime.md) ;
- [Architecture du spawn](../architecture/spawn-engine.md) ;
- [Architecture du Brouhaha](../architecture/brouhaha.md) ;
- [Architecture des objets](../architecture/interactable-objects.md) ;
- [Architecture des réactions](../architecture/chain-reactions.md) ;
- [Renforts de Brouhaha](../architecture/brouhaha-reinforcements.md) ;
- [Audit de livraison Sprint 3.5](../audits/sprint-3-5-brouhaha-reinforcements.md) ;
- [Présentation et finition du Sprint 3.6](../architecture/presentation-and-finishing.md) ;
- [ADR-0007](../adr/0007-creature-instances-and-deterministic-spawn.md).

## Frontières

Le document Drive ne remplace pas les fichiers GitHub et n'est pas chargé par la PWA.

Gargottex reste la source de vérité éditoriale consultable en lecture seule. Aucune écriture dans le dépôt Gargottex n'est réalisée par Gargotte Adventure.
