# Roadmap

La roadmap décrit des résultats vérifiables, pas un calendrier contractuel. Chaque sprint doit réduire le risque principal du projet et laisser une base démontrable.

## Sprint 0 — Fondations

Objectif : rendre le projet développable, testable et documenté sans commencer par une montagne de fonctionnalités.

- gouvernance GitHub ;
- documentation produit et architecture ;
- sécurité des secrets ;
- choix technologiques formalisés ;
- design system initial ;
- squelette TypeScript/PWA ;
- pipeline qualité, build et déploiement ;
- import minimal d’un paquet de contenu Bastognac.

**Sortie attendue :** une PWA vide mais installable, testée et publiée, avec un écran de diagnostic du contenu.

## Sprint 1 — Boucle de salle

Objectif : jouer une salle tactique complète avec des représentations temporaires.

- sélection de 1 à 4 héros ;
- plateau quadrillé ;
- trois actions par héros ;
- déplacement, portée et ligne de vue ;
- attaque déterministe ;
- tour ennemi ;
- victoire et défaite de salle ;
- sauvegarde d’une partie en cours.

**Sortie attendue :** une salle jouable de bout en bout sur téléphone.

## Sprint 2 — Brouhaha et décor

- jauge 0–12 ;
- événements pairs et impairs ;
- renforts ;
- tables, tonneaux, grilles, torches et piliers ;
- réactions en chaîne ;
- journal d’événements explicatif ;
- premiers effets visuels et sonores.

## Sprint 3 — Héros et créatures de Bastognac

- quatre héros officiels ;
- compétences ;
- comportements IA différenciés ;
- seize créatures ;
- fiches et tutoriel contextuel ;
- équilibrage du vertical slice.

## Sprint 4 — Donjon complet

- cinq étages ;
- génération contrôlée selon les budgets de menace ;
- loot ;
- progression entre salles ;
- boss Baron Pas-Très-Terrifiant ;
- reprise de campagne.

## Sprint 5 — Direction artistique et confort

- intégration des médias définitifs ;
- animations ;
- audio ;
- accessibilité ;
- performances mobile ;
- installation PWA complète ;
- tests utilisateurs.

## Après Bastognac

- stabilisation du format de paquet de donjon ;
- outillage d’import depuis Gargottex ;
- ajout de La Forêt en Chantier ;
- campagne, quêtes et taverne ;
- coop locale enrichie ;
- évaluation d’une distribution native uniquement si la PWA atteint ses limites.

## Principes de priorisation

1. expérience joueur avant sophistication technique ;
2. règles testables avant animations ;
3. Bastognac complet avant multiplication des donjons ;
4. données versionnées avant automatisation massive ;
5. mesures de performance avant WebAssembly ;
6. aucune dépendance à l’API OpenAI pour lancer ou terminer une partie.


## Sprint 1 — Boucle de salle

Livraison ciblée : salle déterministe jouable, sans Brouhaha, loot, progression, boss ni contenu définitif.
