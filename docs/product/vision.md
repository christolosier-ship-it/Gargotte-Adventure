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

Le bruit est une ressource, un risque et un moteur narratif. Les Sprints 3.1 à 3.6 ont livré la jauge 0–12, les effets, les renforts et leur présentation visuelle, sonore et textuelle.

### 3. Décor acteur

Tables, tonneaux, grilles, torches et piliers créent des choix tactiques, des réactions en chaîne et des catastrophes comiques. Le Sprint 3 a validé leur interaction déterministe et la lisibilité de leurs conséquences.

### 4. Personnages immédiatement identifiables

Chaque héros et créature doit posséder une silhouette, un rôle, un comportement et une personnalité lisibles en quelques secondes.

Les quatre héros sont sélectionnables. Le Sprint 4 doit finaliser leurs statistiques, compétences, rôles et le bestiaire de Bastognac.

### 5. Partie fluide sur écran tactile

- commandes à un doigt ;
- informations essentielles visibles sans sous-menu permanent ;
- grandes zones tactiles ;
- fonctionnement en paysage ;
- reprise rapide ;
- clavier et souris conservés ;
- mouvement réduit et mode muet disponibles.

### 6. Donjons variés mais contrôlés

Le Sprint 5 doit générer la topologie des cinq étages, la géométrie des salles et une rencontre propre à chaque salle.

Chaque salle possède son propre budget de menace. À seed identique, une expédition générée doit être reproductible et explicable.

## Premier vertical slice

Le **Château de Bastognac** doit valider :

- la boucle salle → combat → loot → progression ;
- les quatre héros de départ ;
- le Brouhaha 0–12 ;
- les objets interactifs et réactions ;
- les renforts et instances multiples ;
- plusieurs comportements IA ;
- cinq étages générés ;
- les rencontres par budget de salle ;
- un boss final ;
- la sauvegarde locale ;
- l'installation sur l'écran d'accueil.

## Avancement du vertical slice

### Validé

- PWA installable et offline-first ;
- architecture moteur / présentation / rendu / UI / sauvegarde ;
- quatre héros sélectionnables ;
- salle tactique 8 × 4 ;
- déplacement, portée, ligne de vue et combat ;
- IA déterministe ;
- victoire et défaite ;
- sauvegarde et reprise versionnée ;
- plateau isométrique et caméra ;
- pipeline d'assets et fallbacks ;
- spawn déterministe et instances multiples ;
- Brouhaha 0–12, historique et effets ;
- objets interactifs ;
- poussées et réactions en chaîne ;
- renforts explicables, limités et persistants ;
- roster ennemi figé avec fallback direct compatible ;
- routeur pur de présentation ;
- cues visuels transitoires et annulables ;
- audio local avec volume, mute et autoplay ;
- journal causal groupé et borné ;
- reprise sans replay ;
- mouvement réduit ;
- diagnostics de stabilité ;
- tests desktop et mobile paysage.

### Restant

- compétences et rôles définitifs ;
- bestiaire complet ;
- génération complète des salles et étages ;
- rencontres par budget propre à chaque salle ;
- loot et progression ;
- boss final ;
- médias, animations et audio définitifs ;
- validation utilisateur sur appareils réels.

## Ce que le projet n'est pas

- un portage numérique strict du plateau physique ;
- un jeu de hasard déguisé ;
- un éditeur concurrent de Gargottex ;
- un générateur opaque ;
- un service nécessitant une connexion permanente ;
- une vitrine technique sans intérêt joueur.

## Critères de réussite du prototype Bastognac

- partie complète jouable sur iPhone, iPad et ordinateur ;
- règles principales apprises en jouant ;
- décisions ennemies, réactions et apparitions explicables ;
- aucune clé API nécessaire ;
- sauvegarde survivant à la fermeture ;
- plusieurs instances d'une créature coexistantes ;
- salles générées connectées, lisibles et jouables ;
- budget de menace respecté par salle ;
- ajout d'une créature sans modification du moteur ;
- humour et rythme de Gargotte & Va-Nu-Pieds conservés.
