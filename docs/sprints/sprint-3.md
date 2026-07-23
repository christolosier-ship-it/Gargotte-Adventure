# Sprint 3 : Brouhaha, spawn et décor interactif

- Statut : en cours
- Étape livrée par cette PR : Sprint 3.4
- Issue : #44
- Pull Request : #45
- Étape suivante : Sprint 3.5

## Objectif

Transformer la salle isométrique en système vivant, interactif et explicable sans perdre le déterminisme du moteur tactique.

Le Sprint 3 introduit successivement le spawn, le Brouhaha, les objets interactifs, les réactions en chaîne et les renforts.

## Décisions structurantes

1. Le spawn déterministe précède les renforts.
2. Définitions éditoriales et instances runtime restent séparées.
3. Le Brouhaha produit des demandes explicites et historisées.
4. Les objets produisent des intentions et des demandes de Brouhaha, sans choisir leurs conséquences.
5. Les réactions sont déclarées par salle et propagées dans un ordre reproductible.
6. Le renderer affiche les états sans décider des règles.
7. Le budget de menace appartient à chaque salle.
8. La géométrie complète des étages appartient au Sprint 5.
9. Gargottex reste strictement en lecture seule.

Références :

- [Architecture du moteur de spawn](../architecture/spawn-engine.md)
- [Architecture du Brouhaha](../architecture/brouhaha.md)
- [Architecture des objets interactifs](../architecture/interactable-objects.md)
- [Architecture des réactions en chaîne](../architecture/chain-reactions.md)
- [Architecture de la salle tactique](../architecture/tactical-room.md)

## Étapes livrées

### Sprint 3.1 : fondation de spawn déterministe ✅

Livré par la PR #35, commit `dd8c749f3afb73104270d87c9e920aab4e926bf3` :

- séparation de `CreatureDefinition` et `CreatureInstance` ;
- points, demandes, résultats et refus de spawn ;
- identifiants reproductibles ;
- apparition totale ou partielle ;
- sauvegarde version 2 et migration de la version 1 ;
- renfort fixe de contrôle.

### Sprint 3.2 : Brouhaha 0 à 12 ✅

Livré par la PR #37, commit `306cc037a5e64ef948b45d85e92d45e3a9909eb2` :

- jauge bornée de 0 à 12 ;
- demandes idempotentes et historique complet ;
- effets universels ou propres au donjon ;
- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12 ;
- sauvegarde version 3 et migrations ;
- HUD, journal et tests desktop/mobile.

### Sprint 3.3 : objets interactifs ✅

Livré par la PR #43 :

- catalogue versionné de tables, tonneaux, grilles, torches et piliers ;
- séparation `InteractableDefinition` et `InteractableInstance` ;
- états et transitions déterministes ;
- interaction à une case orthogonale pour une action ;
- demandes idempotentes et refus sans mutation ;
- Brouhaha automatique pour les interactions bruyantes ;
- prise en compte des objets dans déplacement, spawn et ligne de vue ;
- rendu isométrique avec formes de repli et clic direct ;
- commandes DOM accessibles ;
- sauvegarde version 4 et migrations depuis les versions 1 à 3 ;
- tests moteur, contenu, sauvegarde et Playwright.

Les objets ne donnent aucun loot direct.

### Sprint 3.4 : réactions en chaîne ✅

Livré par la PR #45 :

- poussée déterministe d'un objet selon la position du héros ;
- refus atomique lorsque la destination est hors plateau ou occupée ;
- graphe de réactions déclaré par salle ;
- déclencheurs `state-entered` et `moved` ;
- propagation FIFO, définitions triées et actions exécutées dans l'ordre déclaré ;
- transitions, déplacements, dégâts et demandes de Brouhaha secondaires ;
- causalité explicite depuis la demande racine jusqu'à chaque action ;
- historique persistant avec identifiants `reaction-N` monotones ;
- garde contre les cycles et limite stricte de 32 définitions exécutées ;
- sauvegarde version 5 et migrations depuis les versions 1 à 4 ;
- scénario pilote Bastognac avec table, pilier, dégâts, grille et Brouhaha en cascade ;
- tests unitaires et Playwright sur Chrome bureau et paysage tactile.

Aucun renfort n'est déclenché automatiquement par ces réactions. Ce lien appartient au Sprint 3.5.

## Étapes suivantes

### Sprint 3.5 : renforts déclenchés par le Brouhaha

- seuils de renfort ;
- sélection déterministe des points ;
- production de `SpawnRequest` ;
- apparition partielle ou refus ;
- limites du scénario ;
- intégration avec phases et victoire.

### Sprint 3.6 : présentation et finition

- overlays et retours visuels ;
- premiers effets sonores utiles ;
- journal enrichi ;
- reprise exacte ;
- mesures de fluidité ;
- tests desktop et mobile paysage.

## Invariants du Sprint 3.4

- mêmes état, catalogues, réactions et demande, même résultat ;
- aucun `Math.random()`, temps système ou UUID implicite ;
- demande héroïque exécutée une seule fois ;
- refus sans mutation ni consommation d'action ;
- poussée calculée uniquement depuis les coordonnées logiques ;
- propagation ordonnée et causalité identifiable ;
- une définition de réaction ne s'exécute qu'une fois par chaîne racine ;
- une chaîne excessive ou cyclique s'arrête explicitement ;
- plusieurs demandes de Brouhaha conservent leur ordre causal ;
- état et historique persistants ;
- aucune décision métier dans l'UI ou le renderer ;
- aucun renfort automatique avant le Sprint 3.5 ;
- aucune modification de Gargottex.

## Critères de sortie du Sprint 3.4

- une table peut être poussée d'une case selon la position du héros ;
- une destination occupée ou invalide produit un refus sans mutation ;
- un déplacement ou un changement d'état peut déclencher une réaction ;
- une chaîne peut ouvrir ou bloquer un passage, déplacer un objet et infliger des dégâts ;
- plusieurs demandes de Brouhaha sont résolues dans l'ordre causal ;
- chaque action possède une demande racine, une source et une réaction parente éventuelle ;
- les cycles et la profondeur maximale sont interrompus et historisés ;
- l'état final et l'historique survivent à une reprise ;
- les sauvegardes versions 1 à 4 sont migrées ;
- le scénario pilote fonctionne sur Chrome bureau et paysage tactile ;
- tous les contrôles automatisés sont verts avant fusion.

## Articulation avec les Sprints 4 et 5

Le Sprint 4 enrichira les héros et créatures sans modifier la frontière des objets. Le Sprint 5 générera la géométrie des salles et placera leurs objets initiaux, mais les interactions et réactions resteront résolues par le moteur runtime.

Le budget de menace reste calculé et validé par salle. Le moteur de réactions ne le lit pas.

## État de livraison

Les Sprints 3.1, 3.2 et 3.3 sont fusionnés dans `main`. Le Sprint 3.4 est livré par la PR #45 après validation complète. Le rapport de contrôle se trouve dans [Audit de livraison Sprint 3.4](../audits/sprint-3-4-chain-reactions.md).
