# Sprint 3 : Brouhaha, spawn et décor interactif

- Statut : en cours
- Dernière étape fusionnée : Sprint 3.4
- Issue Sprint 3.4 : #44, clôturée
- Pull Request Sprint 3.4 : #45, fusionnée
- Commit stable : `17ad00c0cb5abb9e66da6e320903f56606a8e8d5`
- Étape suivante : Sprint 3.5
- Issue documentaire de préparation : #46

## Objectif

Transformer la salle isométrique en système vivant, interactif et explicable sans perdre le déterminisme du moteur tactique.

Le Sprint 3 introduit successivement le spawn, le Brouhaha, les objets interactifs, les réactions en chaîne, les renforts automatiques puis leur finition visuelle et sonore.

## Décisions structurantes

1. Le spawn déterministe précède les renforts.
2. Définitions éditoriales et instances runtime restent séparées.
3. Le Brouhaha produit des demandes explicites et historisées.
4. Les objets produisent des intentions et des demandes de Brouhaha, sans choisir leurs conséquences.
5. Les réactions sont déclarées par salle et propagées dans un ordre reproductible.
6. Les renforts sont déclenchés par une politique de seuil, puis exécutés par le moteur de spawn existant.
7. Le renderer affiche les états sans décider des règles.
8. Le budget de menace appartient à chaque salle.
9. La géométrie complète des étages appartient au Sprint 5.
10. Gargottex reste strictement en lecture seule.

Références :

- [Architecture du moteur de spawn](../architecture/spawn-engine.md)
- [Architecture du Brouhaha](../architecture/brouhaha.md)
- [Architecture des objets interactifs](../architecture/interactable-objects.md)
- [Architecture des réactions en chaîne](../architecture/chain-reactions.md)
- [Renforts déclenchés par le Brouhaha](../architecture/brouhaha-reinforcements.md)
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

Livré par la PR #43, commit `83d1aa48eeb8411f01584d8321ea52357c2e6e07` :

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

Livré par la PR #45, commit `17ad00c0cb5abb9e66da6e320903f56606a8e8d5` :

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

## Sprint 3.5 : renforts déclenchés par le Brouhaha

### Objectif

Transformer un franchissement montant de seuil en une ou plusieurs `SpawnRequest` déterministes, explicables et persistées, sans confondre la politique de déclenchement avec l'exécution du spawn.

### Contrat de contenu prévu

La salle tactique passera à `schemaVersion: 5` et déclarera des règles `brouhahaReinforcements` comprenant :

- un identifiant stable ;
- un seuil entre 1 et 12 ;
- un `creatureId` ;
- une quantité ;
- une liste ordonnée de points candidats ;
- un mode `all-or-nothing` ou `partial` ;
- un nombre maximal d'activations dans la salle.

Les références vers les créatures et points de spawn seront validées avant le build.

### Règle de déclenchement

Une règle est éligible uniquement lorsque :

```text
previousLevel < threshold <= level
```

Une baisse ne déclenche rien. Une remontée ultérieure peut réactiver la règle tant que sa limite n'est pas atteinte. Une sauvegarde chargée au-dessus d'un seuil ne déclenche rien rétroactivement.

Lorsque plusieurs seuils sont franchis par une même demande, les règles sont traitées par seuil croissant puis par identifiant.

### Idempotence et limites

Chaque activation et chaque `SpawnRequest` utilisent un identifiant déterministe dérivé de la demande de Brouhaha, de la règle et de son numéro d'activation.

Une activation est consommée lorsque sa demande de spawn est soumise, y compris si le spawn est refusé. Bloquer les points ne permet donc pas de repousser indéfiniment un renfort prévu.

Le budget de menace n'est pas lu ni dépensé. Les renforts représentent une augmentation runtime explicitement autorisée par la salle.

### Phases et victoire

La phase terminale doit être calculée après l'ensemble des conséquences de l'action racine :

1. action directe ;
2. réactions en chaîne ;
3. demandes de Brouhaha ;
4. renforts associés ;
5. calcul de victoire ou défaite.

La victoire n'est acquise que si aucun ennemi vivant ne subsiste après les renforts de la résolution courante.

Les ennemis créés pendant `enemy-turn` ne rejoignent pas le roster d'activation déjà ouvert. Ils agiront au prochain tour ennemi.

### Sauvegarde prévue

La sauvegarde tactique passera à la version 6 et conservera :

- la prochaine séquence de renfort ;
- l'historique des règles activées ;
- le niveau précédent et le nouveau niveau ;
- la demande de Brouhaha racine ;
- la `SpawnRequest` produite ;
- le résultat total, partiel ou refusé ;
- les identifiants des instances créées.

Les versions 1 à 5 migreront avec un historique vide et une séquence initiale à 1. La migration ne rejouera aucun ancien niveau.

### Scénario pilote

Le scénario Bastognac doit valider au minimum :

- deux seuils distincts ;
- un succès total ;
- une apparition partielle ;
- un refus sans mutation du spawn ;
- une limite d'activation ;
- un déclenchement par commande de Brouhaha ;
- un déclenchement par la chaîne table → pilier → grille ;
- une reprise exacte sur bureau et mobile paysage.

Les valeurs de seuil, quantité et créature restent provisoires jusqu'au Sprint 4.

## Critères de sortie du Sprint 3.5

- un seuil est déclenché uniquement lors d'un franchissement montant ;
- plusieurs seuils franchis par une même demande sont traités dans un ordre stable ;
- une même demande ne produit jamais deux fois la même activation ;
- la limite d'activation reste correcte après sauvegarde et reprise ;
- succès total, partiel et refus sont expliqués ;
- les points occupés ou invalides restent contrôlés par le moteur de spawn ;
- une activation refusée est consommée et historisée ;
- la victoire est calculée après les renforts de la résolution courante ;
- les ennemis créés pendant `enemy-turn` attendent le prochain tour ennemi ;
- les sauvegardes versions 1 à 5 sont migrées sans apparition rétroactive ;
- aucun `Math.random()`, temps système ou UUID implicite n'intervient ;
- aucune décision métier n'est placée dans l'UI ou le renderer ;
- tous les contrôles automatisés sont verts avant fusion ;
- Gargottex n'est pas modifié.

## Étape suivante

### Sprint 3.6 : présentation et finition

- overlays et retours visuels ;
- premiers effets sonores utiles ;
- journal enrichi ;
- reprise exacte ;
- mesures de fluidité ;
- tests desktop et mobile paysage.

## Articulation avec les Sprints 4 et 5

Le Sprint 4 enrichira les héros et créatures sans modifier la frontière des objets, du Brouhaha ou du spawn. Il équilibrera les valeurs pilotes des renforts.

Le Sprint 5 générera la géométrie des salles et placera leurs points de spawn et objets initiaux. Le générateur de rencontre composera la population initiale selon le budget propre à chaque salle. Les renforts de Brouhaha resteront une règle runtime distincte.

## État de livraison

Les Sprints 3.1, 3.2, 3.3 et 3.4 sont fusionnés dans `main`. Le rapport de contrôle du dernier lot se trouve dans [Audit de livraison Sprint 3.4](../audits/sprint-3-4-chain-reactions.md).

Le Sprint 3.5 est cadré mais n'est pas implémenté. Son architecture de référence est [Renforts déclenchés par le Brouhaha](../architecture/brouhaha-reinforcements.md).
