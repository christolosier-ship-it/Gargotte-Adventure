# Vision produit

## Promesse

**Gargotte Adventure** est un jeu de plateau numérique coopératif, tactique et volontairement absurde, où des héros en slip nettoient des donjons qui semblent avoir été conçus par un architecte ivre mais méthodique.

Le joueur doit comprendre pourquoi chaque événement se produit, anticiper les conséquences de ses actions et rire lorsque le décor décide de participer.

## Public visé

- joueurs appréciant les jeux tactiques accessibles ;
- familles et groupes jouant autour d’une tablette ;
- amateurs de dungeon crawlers sans lourdeur comptable ;
- joueurs attirés par un humour fantasy brassicole et une forte identité visuelle.

## Piliers d’expérience

### 1. Tactique lisible

- trois actions par héros ;
- dégâts et portée compréhensibles ;
- IA déterministe et explicable ;
- priorité à l’anticipation plutôt qu’au hasard caché.

Le Sprint 1 valide ce pilier avec une première salle jouable, une ligne de vue explicite, des cibles attaquables calculées par le moteur et une IA reproductible.

### 2. Brouhaha vivant

Le bruit est à la fois une ressource, un risque et un moteur narratif. Les seuils du Brouhaha doivent modifier le plateau de manière visible et mémorable.

Ce pilier constitue le cœur du Sprint 2. Il n’est pas encore implémenté dans la version actuelle.

### 3. Décor acteur

Tables, tonneaux, grilles, torches, piliers et autres objets ne sont pas de simples illustrations. Ils créent des choix tactiques, des réactions en chaîne et des catastrophes comiques.

Le décor interactif reste à construire après la stabilisation de la boucle tactique.

### 4. Personnages immédiatement identifiables

Chaque héros et créature possède une silhouette, un rôle, un comportement et une personnalité lisibles en quelques secondes.

Les quatre héros officiels sont sélectionnables depuis le Sprint 1, mais leurs statistiques, compétences, médias et rôles définitifs restent à intégrer.

### 5. Partie fluide sur écran tactile

- commandes à un doigt ;
- informations essentielles visibles sans sous-menu permanent ;
- grandes zones tactiles ;
- fonctionnement en paysage ;
- reprise rapide d’une partie interrompue ;
- commandes alternatives au clavier et à la souris.

Le Sprint 1 valide la sauvegarde locale, la reprise et les parcours desktop/mobile paysage.

## Premier vertical slice

Le **Château de Bastognac** doit valider :

- la boucle salle → combat → loot → progression ;
- les quatre héros de départ ;
- le Brouhaha 0–12 ;
- les objets interactifs ;
- plusieurs comportements IA ;
- un boss final ;
- la sauvegarde locale ;
- l’installation sur l’écran d’accueil d’un téléphone.

## Avancement du vertical slice

### Validé

- PWA installable et offline-first ;
- architecture moteur / rendu / UI / sauvegarde ;
- quatre héros sélectionnables ;
- salle tactique 8 × 4 ;
- déplacement, portée, ligne de vue et combat ;
- première IA déterministe ;
- victoire et défaite de salle ;
- sauvegarde et reprise ;
- tests desktop et mobile paysage.

### Restant

- Brouhaha ;
- décor interactif ;
- compétences et rôles définitifs ;
- bestiaire complet ;
- loot et progression ;
- cinq étages ;
- boss final ;
- médias, animations et audio définitifs ;
- validation utilisateur sur appareils réels.

## Ce que le projet n’est pas

- un portage numérique strict du plateau physique ;
- un jeu de hasard déguisé ;
- un éditeur de contenu concurrent de Gargottex ;
- un service nécessitant une connexion permanente ;
- une vitrine technique remplie de systèmes sans intérêt joueur.

## Critères de réussite du prototype Bastognac

- une partie complète est jouable sur iPhone, iPad et ordinateur ;
- les règles principales sont apprises en jouant ;
- les décisions ennemies sont explicables ;
- aucune clé API n’est nécessaire pour jouer ;
- une sauvegarde survit à la fermeture du navigateur ;
- l’ajout d’une créature depuis un export validé ne nécessite pas de modifier le moteur ;
- le jeu conserve l’humour et le rythme de Gargotte & Va-Nu-Pieds.
