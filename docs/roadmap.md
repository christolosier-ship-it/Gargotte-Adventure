# Roadmap

La roadmap décrit des résultats vérifiables, pas un calendrier contractuel. Chaque sprint réduit un risque principal et laisse une base démontrable.

## État d'avancement

| Sprint                                     | Statut      | Résultat principal                                                        |
| ------------------------------------------ | ----------- | ------------------------------------------------------------------------- |
| Sprint 0 : Fondations                      | ✅ Terminé  | PWA installable, architecture modulaire, CI, Pages et paquet Bastognac    |
| Sprint 1 : Boucle de salle                 | ✅ Terminé  | Salle tactique 8 × 4, IA déterministe, sauvegarde et reprise              |
| Sprint 2 : Plateau isométrique             | ✅ Terminé  | Salle jouable en 2D isométrique avec pipeline graphique réutilisable      |
| Sprint 3 : Brouhaha, spawn et décor        | 🟡 En cours | Spawn, Brouhaha et objets interactifs livrés, réactions en chaîne à venir |
| Sprint 4 : Héros et créatures de Bastognac | À venir     | Rôles, compétences, archétypes et comportements définitifs                |
| Sprint 5 : Donjon généré et finition       | À venir     | Cinq étages générés, rencontres par salle, loot, boss et finition         |

## Sprint 0 : Fondations ✅

Livré : gouvernance, documentation, sécurité, TypeScript strict, PWA offline-first, séparation des paquets, CI, GitHub Pages et premier contenu Bastognac.

**Sortie obtenue :** une base installable, testable et publiable.

## Sprint 1 : Boucle de salle ✅

Livré : sélection de 1 à 4 héros, trois actions, déplacement orthogonal, combat déterministe, IA explicable, phases terminales, sauvegarde et tests desktop/mobile.

**Sortie obtenue :** une salle jouable de bout en bout.

## Sprint 2 : Plateau isométrique ✅

Livré : projection 128 × 64, picking souris/tactile, caméra à quatre orientations, profondeur stable, murs arrière, pipeline d'assets, fallbacks, sprites pilotes et tests de panne d'assets.

**Sortie obtenue :** la boucle tactique conserve ses règles avec une présentation isométrique réutilisable.

## Sprint 3 : Brouhaha, spawn et décor

Objectif : faire du plateau un acteur tactique visible sans perdre le déterminisme.

Le cadrage détaillé se trouve dans [Sprint 3 : Brouhaha, spawn et décor interactif](sprints/sprint-3.md).

### Sprint 3.1 : spawn déterministe ✅

Livré par la PR #35, commit `dd8c749f3afb73104270d87c9e920aab4e926bf3` :

- définitions séparées des instances ;
- points et demandes de spawn ;
- identifiants reproductibles ;
- apparition totale ou partielle ;
- sauvegarde version 2 ;
- renfort fixe de contrôle.

### Sprint 3.2 : Brouhaha 0 à 12 ✅

Livré par la PR #37, commit `306cc037a5e64ef948b45d85e92d45e3a9909eb2` :

- demandes idempotentes ;
- effets universels ou propres au donjon ;
- historique et séquence persistée ;
- un effet aux niveaux 0 à 9 ;
- deux effets aux niveaux 10 à 12 ;
- sauvegarde version 3 et migrations ;
- HUD, journal et tests navigateur.

### Sprint 3.3 : objets interactifs ✅

Livré par la PR #43 :

- tables, tonneaux, grilles, torches et piliers ;
- définitions et instances séparées ;
- états et transitions propres à chaque famille ;
- interaction adjacente coûtant une action ;
- refus idempotents sans mutation ;
- Brouhaha automatique pour les interactions bruyantes ;
- blocage du déplacement, du spawn et de la ligne de vue selon l'état ;
- rendu isométrique, clic direct et commandes accessibles ;
- sauvegarde version 4 et migrations depuis les versions 1 à 3 ;
- tests desktop et mobile paysage.

### Sprint 3.4 : réactions en chaîne

Prochaine phase :

- pousser ou déplacer certains objets ;
- propager les déclencheurs dans un ordre stable ;
- appliquer dégâts, blocage ou ouverture ;
- conserver une causalité explicite ;
- empêcher les boucles infinies ;
- produire plusieurs demandes de Brouhaha ordonnées.

### Sprint 3.5 : renforts de Brouhaha

- seuils déclenchant des renforts ;
- sélection déterministe des points ;
- spawn partiel ou refus ;
- limites propres au scénario ;
- articulation avec phases et victoire.

### Sprint 3.6 : présentation et finition

- overlays et retours visuels ;
- premiers effets sonores utiles ;
- journal enrichi ;
- reprise de tous les états ;
- mesures de fluidité ;
- tests desktop et mobile paysage.

**Sortie attendue du Sprint 3 :** le bruit et le décor créent des décisions tactiques et des catastrophes lisibles, tandis que les renforts utilisent un moteur générique et reproductible.

## Sprint 4 : héros et créatures de Bastognac

- caractéristiques et rôles équilibrés ;
- compétences propres aux quatre héros ;
- seize créatures de Bastognac ;
- catégories et valeurs de menace ;
- comportements IA différenciés ;
- fiches et tutoriel contextuel ;
- intégration progressive des sprites définitifs ;
- équilibrage du vertical slice.

Les archétypes restent instanciables par le moteur de spawn sans modifier sa frontière.

## Sprint 5 : donjon complet généré et finition

### Génération des cinq étages

- graphe et ordre des salles ;
- entrée, sortie, chemin critique et embranchements ;
- validation de connectivité ;
- progression entre salles.

### Géométrie complète des salles

- dimensions et formes ;
- murs, portes, passages et zones ;
- obstacles structurels ;
- points de spawn ;
- décor initial ;
- contraintes de jouabilité et de lisibilité.

### Rencontres

Chaque salle reçoit son propre budget de menace. **Le budget est validé par salle, jamais comme un portefeuille global d'étage.**

Le générateur compose une population, puis le moteur de spawn crée les instances. Il reste déterministe à seed identique.

### Progression et finition

- loot et progression entre salles ;
- boss Baron Pas-Très-Terrifiant ;
- reprise de campagne ;
- médias et audio ;
- accessibilité ;
- performances mobile ;
- installation PWA finalisée ;
- tests utilisateurs.

## Après Bastognac

- stabilisation des formats ;
- outillage d'import depuis Gargottex ;
- ajout de La Forêt en Chantier ;
- campagne, quêtes et taverne ;
- coop locale enrichie ;
- distribution native uniquement si la PWA atteint ses limites.

## Principes de priorisation

1. expérience joueur avant sophistication technique ;
2. règles testables avant animations ;
3. rendu stabilisé avant multiplication du décor ;
4. spawn déterministe avant renforts ;
5. Brouhaha persistant avant objets qui le produisent ;
6. objets isolés avant réactions en chaîne ;
7. définitions de créatures stabilisées avant génération massive ;
8. budget de menace calculé par salle ;
9. Bastognac complet avant un second donjon ;
10. données et assets versionnés avant automatisation massive ;
11. mesures de performance avant WebAssembly ou véritable 3D ;
12. aucune dépendance à l'API OpenAI pour jouer une partie.
