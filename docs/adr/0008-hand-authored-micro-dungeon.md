# ADR-0008 : micro-donjon manuel de trois salles

- Statut : Accepté
- Date : 2026-07-28

## Contexte

La boucle tactique fonctionne actuellement dans une salle isolée. Le projet doit valider une expérience proche du jeu final avant de construire la génération procédurale complète des cinq étages.

Introduire un générateur provisoire au Sprint 4 créerait une seconde architecture destinée à être supprimée au Sprint 5 et mélangerait validation de l'expérience, génération, composition des rencontres et progression.

## Décision

Le Sprint 4 livre un micro-donjon fixe de trois salles adjacentes, entièrement écrit à la main.

Une structure `ExpeditionState` minimale orchestre l'équipe, la salle courante, la progression, les états de salles et le résultat final. Chaque `RoomState` reste local à sa salle.

Les connexions, portes, objectifs, placements, objets, réactions, points de spawn, renforts et conditions de sortie sont explicitement déclarés.

Le Brouhaha reste local à chaque salle. Les héros ne transfèrent que les propriétés explicitement persistantes.

La génération procédurale de topologie, géométrie et rencontres reste réservée au Sprint 5.

## Conséquences positives

- validation rapide d'une expérience presque finale ;
- séparation nette entre orchestration d'expédition et moteur tactique ;
- test réel des transitions, de la persistance et de l'écran final ;
- contenu déterministe et reproductible ;
- absence de générateur provisoire jetable ;
- base claire pour comparer plus tard une expédition générée au parcours de référence.

## Compromis et risques

- les trois salles nécessitent un travail éditorial manuel ;
- l'architecture doit éviter de coder l'ordre des salles dans l'UI ;
- l'état persistant des héros doit être limité et versionné ;
- la victoire locale doit rester distincte de la victoire globale ;
- une salle déjà visitée ne doit pas être réinitialisée silencieusement.

## Invariants

1. Trois salles fixes et adjacentes.
2. Aucune génération de géométrie ou de rencontre au Sprint 4.
3. `ExpeditionState` n'applique aucune règle tactique.
4. `RoomState` reste la source de vérité locale.
5. Brouhaha, ennemis, objets, réactions et renforts restent propres à la salle.
6. Une transition exige une sortie disponible et une intention explicite.
7. Le moteur de spawn reste la frontière d'instanciation.
8. Le budget de menace reste propre à chaque salle.
9. La reprise ne rejoue aucune conséquence historique.
10. Gargottex reste en lecture seule.

## Réévaluation

Cette décision sera réévaluée après l'audit du Sprint 4.7. Le Sprint 5 pourra remplacer les définitions fixes de topologie et de géométrie par des plans générés, sans remplacer `ExpeditionState`, `RoomState` ou le moteur de spawn si leurs frontières sont respectées.
