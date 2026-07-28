# Relais Google Drive, Sprint 4

Le cadrage humain et les comptes rendus du Sprint 4 sont conservés dans Google Drive :

- [Gargotte Adventure, Sprint 4, Héros, créatures et comportements de Bastognac](https://docs.google.com/document/d/1ONeLklDClKMyfvqLS-HtVSL3dfy9SmSEkjh2PsOIJyI/edit)

## État du document Drive

Le document a été créé le 28 juillet 2026 puis actualisé lors de la livraison du Sprint 4.0.

Il conserve :

- l’historique de décision après le Sprint 3 ;
- le cadrage du Sprint 4 ;
- le micro-donjon manuel de trois salles ;
- les phases de jeu ;
- l’état minimal d’expédition ;
- les héros et seize créatures ;
- les profils d’IA ;
- les interactions avec les objets ;
- les influences du Brouhaha ;
- le mode diagnostic ;
- la matrice de couverture ;
- les lots 4.0 à 4.7 ;
- les frontières avec le Sprint 5 ;
- la clôture fonctionnelle du Sprint 4.0.

## Clôture du Sprint 4.0

La section de clôture consigne :

- l’issue #63 ;
- la PR fonctionnelle #64 ;
- le HEAD validé `1c806a8d7362bc125fcf8c5ea92185e7cf9be7d1` ;
- le commit de fusion `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf` ;
- les workflows Repository quality `30361556238` et Validate application `30361556300` ;
- les sept écarts P2 corrigés ;
- les sept fils de revue résolus ;
- la frontière `presentation → engine` ;
- l’ordre runtime rendu, présentation, persistance asynchrone ;
- l’ouverture du Sprint 4.1 comme prochaine phase.

## Références GitHub actives

- [Issue Sprint 4.0 #63](https://github.com/christolosier-ship-it/Gargotte-Adventure/issues/63) ;
- [Pull Request fonctionnelle #64](https://github.com/christolosier-ship-it/Gargotte-Adventure/pull/64) ;
- [Suivi du Sprint 4](../sprints/sprint-4.md) ;
- [Audit du Sprint 4.0](../audits/sprint-4-0-stabilization.md) ;
- [Présentation stabilisée](../architecture/presentation-and-finishing.md) ;
- [Architecture runtime](../architecture/runtime.md) ;
- [Structure du dépôt](../architecture/repository-structure.md) ;
- [Micro-donjon et état d’expédition](../architecture/micro-dungeon-and-expedition.md) ;
- [Héros, créatures et comportements](../architecture/actors-and-behaviors.md) ;
- [ADR-0008](../adr/0008-hand-authored-micro-dungeon.md) ;
- [ADR-0009](../adr/0009-declarative-actor-behaviors.md) ;
- [Roadmap](../roadmap.md).

## Répartition des responsabilités

Google Drive porte :

- le cadrage humain ;
- les décisions produit ;
- les synthèses et comptes rendus ;
- la matrice de couverture ;
- les éléments destinés à la lecture projet.

GitHub reste la source de vérité technique pour :

- les contrats et formats ;
- les ADR ;
- les schémas et migrations ;
- la stratégie de tests ;
- les changements versionnés ;
- les preuves de CI.

## Frontières

Le document Drive n’est pas chargé par la PWA et ne remplace aucune validation GitHub.

Gargottex reste une source éditoriale consultée en lecture seule. Aucune écriture dans le dépôt Gargottex n’est réalisée par Gargotte Adventure.
