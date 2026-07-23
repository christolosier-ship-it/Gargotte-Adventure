# Roadmap

La roadmap décrit des résultats vérifiables, pas un calendrier contractuel. Chaque sprint doit réduire le risque principal du projet et laisser une base démontrable.

## État d'avancement

| Sprint                                     | Statut      | Résultat principal                                                             |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------------------ |
| Sprint 0 : Fondations                      | ✅ Terminé  | PWA installable, architecture modulaire, CI, Pages et premier paquet Bastognac |
| Sprint 1 : Boucle de salle                 | ✅ Terminé  | Salle tactique 8 × 4 jouable, IA déterministe, sauvegarde et reprise           |
| Sprint 2 : Plateau isométrique             | ✅ Terminé  | Même salle jouable en 2D isométrique avec pipeline graphique réutilisable      |
| Sprint 3 : Brouhaha, spawn et décor        | 🟡 En cours | Spawn livré, Brouhaha 0 à 12 en livraison, décor interactif à venir             |
| Sprint 4 : Héros et créatures de Bastognac | À venir     | Rôles, compétences, archétypes et comportements définitifs                     |
| Sprint 5 : Donjon généré et finition       | À venir     | Cinq étages générés, rencontres par salle, loot, boss et finition              |

## Sprint 0 : Fondations ✅

Objectif atteint : rendre le projet développable, testable, déployable et documenté avant d'empiler les fonctionnalités.

Livré :

- gouvernance GitHub et stratégie de branches ;
- documentation produit et architecture ;
- sécurité des secrets ;
- TypeScript strict, Vite, PWA, PixiJS et IndexedDB ;
- séparation moteur, renderer, UI, sauvegarde et contenu ;
- pipeline qualité, tests, build et déploiement GitHub Pages ;
- import minimal d'un paquet de contenu Bastognac.

**Sortie obtenue :** une PWA installable, testée et publiée avec un écran de fondation et un contenu Bastognac validé.

## Sprint 1 : Boucle de salle ✅

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

## Sprint 2 : Plateau isométrique et pipeline graphique ✅

Objectif atteint : donner au jeu sa direction visuelle cible avant d'ajouter le Brouhaha et les nombreux objets interactifs.

Livré :

- projection 2D isométrique 128 × 64 sous PixiJS ;
- grille logique et moteur tactique inchangés ;
- picking réel par clic et toucher sur le canvas ;
- caméra responsive avec quatre orientations de contrôle ;
- tri de profondeur déterministe ;
- quatre murs physiques dont seuls les deux murs arrière sont rendus ;
- manifeste versionné et registre centralisé d'assets ;
- cache de textures, destruction sûre et fallbacks non bloquants ;
- budgets automatiques pour les formats et le poids des assets ;
- sprites pilotes WebP de Brünhilda et du Gobelin Bricoleur ;
- deux sols Bastognac, deux orientations de mur et un tonneau illustré ;
- placeholders compatibles pour le reste du casting ;
- tests unitaires et Playwright desktop/mobile paysage, y compris les pannes d'assets ;
- maintien de la sauvegarde version 1 et des résultats déterministes ;
- désendettement de l'orchestrateur, du renderer et des sauvegardes avant Sprint 3.

Les sprites restent fixes pour cette première version. Les micro-animations pourront être ajoutées lorsqu'elles servent une interaction réelle.

**Sortie obtenue :** la salle du Sprint 1 conserve ses règles et devient jouable avec une présentation isométrique cohérente et une architecture prête à accueillir le monde vivant du Sprint 3.

Le rapport détaillé se trouve dans [Sprint 2 : plateau isométrique et pipeline graphique](sprints/sprint-2.md).

## Sprint 3 : Brouhaha, spawn et décor

Objectif : faire du plateau isométrique un acteur tactique visible, sans perdre le caractère déterministe du moteur.

Le cadrage détaillé se trouve dans [Sprint 3 : Brouhaha, spawn et décor interactif](sprints/sprint-3.md).

### Sprint 3.1 : fondation de spawn déterministe ✅

Livré par la PR #35, commit `dd8c749f3afb73104270d87c9e920aab4e926bf3` :

- séparation de `CreatureDefinition` et `CreatureInstance` ;
- points de spawn et demandes d'apparition explicites ;
- identifiants d'instance reproductibles ;
- refus des positions invalides ou occupées ;
- événements explicatifs ;
- sauvegarde tactique version 2 ;
- renfort fixe de contrôle.

### Sprint 3.2 : Brouhaha 0 à 12 🟡

Lot de la PR #37 :

- état de jauge borné ;
- incrémentation et diminution explicites ;
- demandes idempotentes ;
- effets universels ou propres au donjon ;
- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12 ;
- sélection déterministe et séquence persistée ;
- historique et explication ;
- HUD et commandes de démonstration ;
- sauvegarde version 3 et migrations ;
- tests desktop et mobile paysage.

Le Brouhaha ne déclenche pas encore de renfort. Cette connexion reste réservée au Sprint 3.5.

### Sprint 3.3 : Décor interactif

- tables, tonneaux, grilles, torches et piliers ;
- états et interactions propres aux objets ;
- règles validées par le moteur ;
- production de demandes de Brouhaha.

### Sprint 3.4 : Réactions en chaîne

- propagation ordonnée ;
- causalité explicite ;
- protection contre les boucles infinies ;
- premiers effets visuels et sonores utiles.

### Sprint 3.5 : Renforts de Brouhaha

- seuils déclenchant des renforts ;
- sélection déterministe des points ;
- spawn partiel ou refus selon les règles ;
- limites propres au scénario.

### Sprint 3.6 : Sauvegarde, journal et finition

- reprise de tous les nouveaux états ;
- journal d'événements enrichi ;
- rendu et retours visuels ;
- mesures de fluidité ;
- tests desktop et mobile paysage.

**Sortie attendue :** le bruit et le décor créent des décisions tactiques et des catastrophes lisibles, tandis que les renforts utilisent un moteur d'instances générique et reproductible.

## Sprint 4 : Héros et créatures de Bastognac

Les quatre héros officiels sont déjà sélectionnables depuis le Sprint 1. Ce sprint doit donner au casting son identité de gameplay définitive.

- caractéristiques et rôles équilibrés ;
- compétences propres aux quatre héros ;
- catalogue de `CreatureDefinition` ;
- seize créatures de Bastognac ;
- catégories et valeurs de menace ;
- comportements IA différenciés ;
- ciblage et explications de décision enrichis ;
- fiches et tutoriel contextuel ;
- intégration progressive des sprites définitifs ;
- équilibrage du vertical slice.

Les archétypes du Sprint 4 devront être instanciables par le moteur de spawn livré au Sprint 3 sans modifier sa frontière fondamentale.

## Sprint 5 : Donjon complet généré et finition

Objectif : générer une expédition complète de Bastognac, de la topologie des étages jusqu'à la population de chaque salle.

### Génération des cinq étages

- nombre et ordre des salles ;
- graphe de connexions ;
- entrée, sortie et chemin critique ;
- embranchements éventuels ;
- validation de la connectivité ;
- progression entre salles.

### Génération géométrique complète des salles

- dimensions et formes ;
- grille logique ;
- murs et segments physiques ;
- portes, passages et connexions ;
- zones particulières ;
- obstacles structurels ;
- points de spawn ;
- décor initial ;
- contraintes de jouabilité et de lisibilité isométrique.

### Génération des rencontres

Chaque salle reçoit son propre budget de menace. **Le budget de menace est un budget par salle et non par étage.**

Le générateur de rencontre :

- choisit des archétypes disponibles ;
- respecte exactement ou selon une tolérance explicitement définie le budget de la salle ;
- place la population initiale sur les points autorisés ;
- produit des demandes d'instanciation pour le moteur de spawn ;
- reste déterministe à seed identique.

Un étage ne partage pas un portefeuille unique de menace entre ses salles. Sa progression influence les budgets attribués aux salles, mais chaque rencontre est validée séparément.

### Progression et finition

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

**Sortie attendue :** une expédition complète de cinq étages, générée de manière contrôlée et reproductible, avec des salles géométriquement valides et des rencontres équilibrées individuellement.

## Après Bastognac

- stabilisation des formats de définition, instance, salle et étage ;
- outillage d'import depuis Gargottex ;
- ajout de La Forêt en Chantier ;
- campagne, quêtes et taverne ;
- coop locale enrichie ;
- évaluation d'une distribution native uniquement si la PWA atteint ses limites.

## Principes de priorisation

1. expérience joueur avant sophistication technique ;
2. règles testables avant animations ;
3. rendu isométrique stabilisé avant multiplication des objets interactifs ;
4. instances et spawn déterministes avant renforts Brouhaha ;
5. état et historique du Brouhaha avant objets qui le produisent ;
6. définitions de créatures stabilisées avant génération massive ;
7. budget de menace calculé et validé par salle ;
8. génération géométrique contrôlée avant multiplication des donjons ;
9. Bastognac complet avant ajout d'un second donjon ;
10. données et assets versionnés avant automatisation massive ;
11. mesures de performance avant WebAssembly ou véritable 3D ;
12. aucune dépendance à l'API OpenAI pour lancer ou terminer une partie.
