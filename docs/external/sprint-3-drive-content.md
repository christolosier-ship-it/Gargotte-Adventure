# Relais Google Drive, Sprint 3

Le cadrage humain et les comptes rendus du Sprint 3 sont conservés dans Google Drive :

- [Gargotte Adventure, Sprint 3.6, Présentation et finition](https://docs.google.com/document/d/1bzIqauCne-OThK1ZSd2IdYKmD_yBeRPJPTkb6EvRH9E/edit)

## État du document Drive

Le document conserve l'historique des livraisons 3.1 à 3.6 et la clôture documentaire initiale.

La formulation active est désormais :

> Le Sprint 3 est fonctionnellement livré et fusionné. Sa clôture définitive reste soumise à un dernier lot de stabilisation du Sprint 3.6 et à la résolution des écarts P2 post-fusion.

L'archive historique n'est pas réécrite. Un addenda de réserve doit y consigner :

- quatre P2 fonctionnels issus de la PR #59 ;
- trois P2 documentaires ou de frontière issus de la PR #60 ;
- le lot séparé Sprint 4.0 ;
- la condition de passage aux lots fonctionnels 4.1 à 4.7 ;
- le lien vers le nouveau document Drive du Sprint 4.

## Livraison fonctionnelle conservée

Le document rappelle :

- la PR #59 ;
- le commit `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4` ;
- le routeur pur des événements vers les cues ;
- la couche PixiJS transitoire ;
- l'audio local Web Audio ;
- le journal groupé et borné ;
- la reprise sans replay ;
- le mouvement réduit, le mute et le volume ;
- les contrôles de stabilité disponibles lors de la fusion.

Ces éléments restent livrés. La CI verte ne ferme pas les P2 détectés après fusion.

## Source technique active

- [Issue Sprint 3.6 #57](https://github.com/christolosier-ship-it/Gargotte-Adventure/issues/57) ;
- [Issue documentaire #61](https://github.com/christolosier-ship-it/Gargotte-Adventure/issues/61) ;
- [Roadmap](../roadmap.md) ;
- [Suivi du Sprint 3](../sprints/sprint-3.md) ;
- [Addenda P2 post-fusion](../audits/sprint-3-6-post-fusion-p2-addendum.md) ;
- [Architecture d'exécution](../architecture/runtime.md) ;
- [Structure du dépôt](../architecture/repository-structure.md) ;
- [Présentation et finition](../architecture/presentation-and-finishing.md) ;
- [Audit historique Sprint 3.6](../audits/sprint-3-6-presentation-finishing.md) ;
- [Relais Sprint 4](sprint-4-drive-content.md).

## Frontières

Le document Drive ne remplace pas les fichiers GitHub et n'est pas chargé par la PWA.

Gargottex reste la source de vérité éditoriale consultable en lecture seule. Aucune écriture n'y est réalisée.
