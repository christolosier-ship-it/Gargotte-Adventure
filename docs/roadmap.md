# Roadmap

La roadmap décrit des résultats vérifiables, pas un calendrier contractuel. Chaque sprint doit réduire le risque principal du projet et laisser une base démontrable.

## État d’avancement

| Sprint                                     | Statut     | Résultat principal                                                             |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------------ |
| Sprint 0 — Fondations                      | ✅ Terminé | PWA installable, architecture modulaire, CI, Pages et premier paquet Bastognac |
| Sprint 1 — Boucle de salle                 | ✅ Terminé | Salle tactique 8 × 4 jouable, IA déterministe, sauvegarde et reprise           |
| Sprint 2 — Brouhaha et décor               | Prochain   | Le plateau devient un système vivant et explicable                             |
| Sprint 3 — Héros et créatures              | À venir    | Rôles, compétences et comportements définitifs de Bastognac                    |
| Sprint 4 — Donjon complet                  | À venir    | Cinq étages, loot, progression et boss                                         |
| Sprint 5 — Direction artistique et confort | À venir    | Médias définitifs, audio, accessibilité et performances                        |

## Sprint 0 — Fondations ✅

Objectif atteint : rendre le projet développable, testable, déployable et documenté avant d’empiler les fonctionnalités.

Livré :

- gouvernance GitHub et stratégie de branches ;
- documentation produit et architecture ;
- sécurité des secrets ;
- TypeScript strict, Vite, PWA, PixiJS et IndexedDB ;
- séparation moteur, renderer, UI, sauvegarde et contenu ;
- pipeline qualité, tests, build et déploiement GitHub Pages ;
- import minimal d’un paquet de contenu Bastognac.

**Sortie obtenue :** une PWA installable, testée et publiée avec un écran de fondation et un contenu Bastognac validé.

## Sprint 1 — Boucle de salle ✅

Objectif atteint : jouer une salle tactique complète avec des représentations provisoires.

Livré :

- sélection de 1 à 4 héros officiels ;
- plateau quadrillé 8 × 4 ;
- trois actions par héros ;
- déplacement orthogonal et cheminement déterministe ;
- portée et ligne de vue supercover ;
- attaque déterministe `max(1, ATK - DEF)` ;
- tour ennemi déterministe et explicable ;
- phases héros, ennemis, victoire et défaite verrouillées ;
- sauvegarde et reprise complète de la salle ;
- rendu PixiJS et commandes DOM accessibles ;
- tests unitaires et Playwright desktop/mobile paysage.

**Sortie obtenue :** une salle jouable de bout en bout, sauvegardable et reproductible sur navigateur.

## Sprint 2 — Brouhaha et décor

Objectif : faire du plateau un acteur tactique visible, sans perdre le caractère déterministe du moteur.

Périmètre envisagé :

- jauge de Brouhaha 0–12 ;
- événements pairs et impairs ;
- seuils déclenchant renforts ou effets cumulés ;
- tables, tonneaux, grilles, torches et piliers interactifs ;
- réactions en chaîne ;
- journal d’événements explicatif ;
- premiers effets visuels et sonores temporaires ;
- sauvegarde et reprise de tous les nouveaux états.

**Sortie attendue :** la même salle reste jouable, mais le bruit et le décor créent des décisions tactiques et des catastrophes lisibles.

## Sprint 3 — Héros et créatures de Bastognac

Les quatre héros officiels sont déjà sélectionnables depuis le Sprint 1. Ce sprint doit leur donner leur identité de gameplay définitive.

- caractéristiques et rôles équilibrés ;
- compétences propres aux quatre héros ;
- comportements IA différenciés ;
- seize créatures de Bastognac ;
- ciblage et explications de décision enrichis ;
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
- accessibilité renforcée ;
- performances mobile ;
- installation PWA finalisée ;
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
