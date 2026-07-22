# Roadmap

La roadmap décrit des résultats vérifiables, pas un calendrier contractuel. Chaque sprint doit réduire le risque principal du projet et laisser une base démontrable.

## État d’avancement

| Sprint                                     | Statut     | Résultat principal                                                             |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------------ |
| Sprint 0 — Fondations                      | ✅ Terminé | PWA installable, architecture modulaire, CI, Pages et premier paquet Bastognac |
| Sprint 1 — Boucle de salle                 | ✅ Terminé | Salle tactique 8 × 4 jouable, IA déterministe, sauvegarde et reprise           |
| Sprint 2 — Plateau isométrique             | ✅ Terminé | Même salle jouable en 2D isométrique avec pipeline graphique réutilisable      |
| Sprint 3 — Brouhaha et décor               | Prochain   | Le plateau devient un système vivant, interactif et explicable                 |
| Sprint 4 — Héros et créatures de Bastognac | À venir    | Rôles, compétences et comportements définitifs                                 |
| Sprint 5 — Donjon complet et finition      | À venir    | Cinq étages, loot, boss, médias enrichis, audio, accessibilité et performances |

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

## Sprint 2 — Plateau isométrique et pipeline graphique ✅

Objectif atteint : donner au jeu sa direction visuelle cible avant d’ajouter le Brouhaha et les nombreux objets interactifs.

Livré :

- projection 2D isométrique 128 × 64 sous PixiJS ;
- grille logique et moteur tactique inchangés ;
- picking réel par clic et toucher sur le canvas ;
- caméra et redimensionnement adaptés au paysage ;
- tri de profondeur déterministe ;
- couches séparées pour le fond, le sol, les objets, le premier plan et l’interface ;
- murs hauts non interactifs avec occlusion contextuelle ;
- manifeste versionné et registre centralisé d’assets ;
- cache de textures, destruction sûre et fallbacks non bloquants ;
- budgets automatiques pour les formats et le poids des assets ;
- sprites pilotes WebP de Brünhilda et du Gobelin Bricoleur ;
- deux sols Bastognac, deux orientations de mur et un tonneau illustré ;
- placeholders compatibles pour le reste du casting ;
- tests unitaires et Playwright desktop/mobile paysage, y compris les pannes d’assets ;
- maintien de la sauvegarde version 1 et des résultats déterministes.

Les sprites restent fixes pour cette première version. Les micro-animations étaient autorisées mais non obligatoires et pourront être ajoutées lorsqu’elles servent une interaction réelle.

La charge graphique pilote reste très inférieure au budget de 1 Mio. Une mesure quantitative de fluidité sera ajoutée avant la multiplication des objets interactifs ou au début du Sprint 3.

**Sortie obtenue :** la salle du Sprint 1 conserve exactement ses règles et devient jouable avec une présentation isométrique cohérente et un pipeline graphique réutilisable.

Le rapport détaillé se trouve dans [Sprint 2 — Plateau isométrique et pipeline graphique](sprints/sprint-2.md).

## Sprint 3 — Brouhaha et décor

Objectif : faire du plateau isométrique un acteur tactique visible, sans perdre le caractère déterministe du moteur.

Périmètre envisagé :

- jauge de Brouhaha 0–12 ;
- événements pairs et impairs ;
- seuils déclenchant renforts ou effets cumulés ;
- tables, tonneaux, grilles, torches et piliers interactifs ;
- réactions en chaîne ;
- journal d’événements explicatif ;
- premiers effets visuels et sonores liés au décor ;
- sauvegarde et reprise de tous les nouveaux états.

**Sortie attendue :** le bruit et le décor créent des décisions tactiques et des catastrophes lisibles sur le plateau isométrique.

## Sprint 4 — Héros et créatures de Bastognac

Les quatre héros officiels sont déjà sélectionnables depuis le Sprint 1. Ce sprint doit leur donner leur identité de gameplay définitive.

- caractéristiques et rôles équilibrés ;
- compétences propres aux quatre héros ;
- comportements IA différenciés ;
- seize créatures de Bastognac ;
- ciblage et explications de décision enrichis ;
- fiches et tutoriel contextuel ;
- intégration progressive des sprites définitifs ;
- équilibrage du vertical slice.

## Sprint 5 — Donjon complet et finition

- cinq étages ;
- génération contrôlée selon les budgets de menace ;
- loot ;
- progression entre salles ;
- boss Baron Pas-Très-Terrifiant ;
- reprise de campagne ;
- intégration des médias définitifs ;
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
3. rendu isométrique stabilisé avant multiplication des objets interactifs ;
4. Bastognac complet avant multiplication des donjons ;
5. données et assets versionnés avant automatisation massive ;
6. mesures de performance avant WebAssembly ou véritable 3D ;
7. aucune dépendance à l’API OpenAI pour lancer ou terminer une partie.
