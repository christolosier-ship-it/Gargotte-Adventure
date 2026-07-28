# Vision produit

## Promesse

**Gargotte Adventure** est un jeu de plateau numérique coopératif, tactique et volontairement absurde, où des héros en slip nettoient des donjons qui semblent avoir été conçus par un architecte ivre mais méthodique.

Le joueur doit comprendre pourquoi chaque événement se produit, anticiper les conséquences de ses actions et rire lorsque le décor décide de participer.

## Public visé

- joueurs appréciant les jeux tactiques accessibles ;
- familles et groupes jouant autour d'une tablette ;
- amateurs de dungeon crawlers sans lourdeur comptable ;
- joueurs attirés par un humour fantasy brassicole et une forte identité visuelle.

## Piliers d'expérience

### 1. Tactique lisible

Trois actions par héros, dégâts et portée compréhensibles, IA déterministe et explicable, priorité à l'anticipation plutôt qu'au hasard caché.

### 2. Brouhaha vivant

Le bruit est une ressource, un risque et un moteur narratif. Les Sprints 3.1 à 3.6 ont livré la jauge 0 à 12, les effets, les renforts et leur présentation visuelle, sonore et textuelle.

Le Sprint 4 doit en faire une donnée réellement utilisée par les héros et créatures. Les variations restent des demandes explicites au moteur de Brouhaha et les influences sur les comportements restent déclaratives.

### 3. Décor acteur

Tables, tonneaux, grilles, torches et piliers créent des choix tactiques, des réactions en chaîne et des catastrophes comiques.

Le Sprint 4 doit permettre aux héros et créatures d'utiliser, protéger, déplacer, détruire ou éviter ce décor par des intentions résolues par les moteurs existants.

### 4. Personnages immédiatement identifiables

Chaque héros et créature possède une silhouette, un rôle, un comportement et une personnalité lisibles en quelques secondes.

Le Sprint 4 doit finaliser :

- les quatre héros ;
- les seize créatures de Bastognac ;
- leurs compétences et capacités ;
- leurs interactions avec le décor ;
- leurs relations avec le Brouhaha ;
- des profils d'IA déterministes et expliqués.

Il ne s'agit pas d'un simple lot de statistiques, fiches et sprites.

### 5. Partie fluide sur écran tactile

- commandes à un doigt ;
- informations essentielles visibles sans sous-menu permanent ;
- grandes zones tactiles ;
- fonctionnement en paysage ;
- reprise rapide ;
- clavier et souris conservés ;
- mouvement réduit et mode muet disponibles ;
- commandes techniques absentes du parcours joueur normal ;
- mode diagnostic séparé.

### 6. Expédition compréhensible

Le Sprint 4 doit valider une expédition fixe de trois salles adjacentes : préparation, progression, objectifs locaux, transfert des héros, victoire ou défaite globale.

Le Sprint 5 générera ensuite les cinq étages, la topologie, la géométrie et les rencontres. Chaque salle possède son propre budget de menace et son propre Brouhaha.

## Premier vertical slice

Le **Château de Bastognac** doit finalement valider :

- la boucle préparation → salles → résultat → progression ;
- les quatre héros de départ ;
- seize créatures ;
- le Brouhaha 0 à 12 ;
- les objets interactifs et réactions ;
- les renforts et instances multiples ;
- plusieurs comportements IA ;
- cinq étages générés ;
- les rencontres par budget de salle ;
- le Baron Pas-Très-Terrifiant ;
- la sauvegarde locale ;
- l'installation sur l'écran d'accueil.

Le Sprint 4 valide une tranche intermédiaire proche du résultat final sur trois salles fixes. Le Sprint 5 complète la génération, le loot, la progression, la campagne et le boss.

## Cible du Sprint 4

```text
Préparation de l'expédition
→ Salle 1 : prise en main tactique
→ Salle 2 : décor, réactions et Brouhaha
→ Salle 3 : confrontation complète
→ Résultat du micro-donjon
```

Le joueur doit pouvoir :

- sélectionner de un à quatre héros ;
- comprendre leurs rôles et compétences ;
- conserver leur état entre les salles ;
- affronter plusieurs profils de créatures ;
- comprendre les décisions ennemies ;
- utiliser ou subir le décor ;
- influencer et subir le Brouhaha ;
- gérer des renforts complets, partiels ou refusés ;
- remplir un objectif local et ouvrir la sortie ;
- atteindre une victoire ou une défaite globale ;
- reprendre l'expédition après fermeture ;
- terminer sans commande technique.

## Avancement du vertical slice

### Fonctionnellement livré

- PWA installable et offline-first ;
- architecture moteur, présentation, rendu, UI et sauvegarde ;
- quatre héros pilotes sélectionnables ;
- salle tactique 8 × 4 ;
- déplacement, portée, ligne de vue et combat ;
- IA déterministe pilote ;
- victoire et défaite de salle ;
- sauvegarde et reprise versionnée ;
- plateau isométrique et caméra ;
- pipeline d'assets et fallbacks ;
- spawn déterministe et instances multiples ;
- Brouhaha 0 à 12, historique et effets ;
- objets interactifs ;
- poussées et réactions en chaîne ;
- renforts explicables, limités et persistants ;
- roster ennemi figé avec fallback direct ;
- routeur pur de présentation ;
- cues visuels transitoires ;
- audio local avec volume, mute et autoplay ;
- journal causal groupé et borné ;
- reprise sans replay ;
- mouvement réduit ;
- diagnostics de stabilité ;
- tests desktop et mobile paysage.

### Réserve de stabilisation

Sept P2 post-fusion doivent être traités avant l'ouverture fonctionnelle du Sprint 4 : cues terminaux, validation des préférences audio, priorité des cues, redémarrage des tonalités, garantie documentaire, ordre runtime et validation de frontière du package `presentation`.

### Sprint 4 restant

- état minimal d'expédition ;
- trois salles adjacentes fixes ;
- objectifs, portes et transitions ;
- quatre héros définitifs ;
- seize créatures ;
- compétences et capacités ;
- profils d'IA différenciés ;
- interactions ennemies avec le décor ;
- influences du Brouhaha sur les comportements ;
- parcours joueur débarrassé des commandes techniques ;
- mode diagnostic distinct ;
- résultat global et reprise sur les trois salles.

### Sprint 5 restant

- génération complète des salles et étages ;
- composition automatique des rencontres ;
- embranchements ;
- loot et progression ;
- campagne ;
- boss final ;
- reprise d'une expédition générée ;
- médias, animations et audio définitifs ;
- validation utilisateur sur appareils réels.

## Ce que le projet n'est pas

- un portage numérique strict du plateau physique ;
- un jeu de hasard déguisé ;
- un éditeur concurrent de Gargottex ;
- un générateur opaque ;
- un service nécessitant une connexion permanente ;
- une vitrine technique sans intérêt joueur ;
- un parcours dépendant de commandes de diagnostic.

## Critères de réussite du micro-donjon Sprint 4

- trois salles fixes connectées et jouables ;
- état des héros conservé entre les salles ;
- Brouhaha local à chaque salle ;
- décisions ennemies, réactions et apparitions explicables ;
- plusieurs profils d'IA combinés ;
- objets utilisés par les héros et créatures ;
- victoire ou défaite globale ;
- sauvegarde survivant à la fermeture ;
- parcours complet sans commandes techniques ;
- fonctionnement desktop, tablette et mobile paysage ;
- aucune génération du Sprint 5 ;
- aucune clé API nécessaire.

## Critères de réussite du prototype Bastognac final

- expédition de cinq étages générés ;
- budget de menace respecté par salle ;
- ajout d'une créature sans modification du moteur ;
- loot, progression, campagne et boss final ;
- humour et rythme de Gargotte & Va-Nu-Pieds conservés.
