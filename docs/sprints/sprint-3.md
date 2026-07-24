# Sprint 3 : Brouhaha, spawn et décor interactif

- Statut : en cours
- Dernière étape livrée : Sprint 3.5
- Issue Sprint 3.5 : #48
- Pull Request Sprint 3.5 : #49
- Branche : `sprint-3/brouhaha-reinforcements`
- Base stable de départ : `66f2d30543c77327c86c460d8be874254719ecd0`
- Étape suivante : Sprint 3.6

## Objectif

Transformer la salle isométrique en système vivant, interactif et explicable sans perdre le déterminisme du moteur tactique.

Le Sprint 3 introduit successivement le spawn, le Brouhaha, les objets interactifs, les réactions en chaîne, les renforts automatiques puis leur finition visuelle et sonore.

## Décisions structurantes

1. Le spawn déterministe précède les renforts.
2. Définitions éditoriales et instances runtime restent séparées.
3. Le Brouhaha produit des demandes explicites et historisées.
4. Les objets produisent des intentions et demandes, sans choisir leurs conséquences.
5. Les réactions sont déclarées par salle et propagées dans un ordre reproductible.
6. Les renforts sont déclenchés par une politique de seuil puis exécutés par le moteur de spawn.
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

PR #35, commit `dd8c749f3afb73104270d87c9e920aab4e926bf3` : définitions et instances séparées, points et demandes de spawn, identifiants reproductibles, modes total et partiel, sauvegarde version 2 et renfort fixe de contrôle.

### Sprint 3.2 : Brouhaha 0 à 12 ✅

PR #37, commit `306cc037a5e64ef948b45d85e92d45e3a9909eb2` : jauge bornée, demandes idempotentes, historique, effets par niveau et portée, sauvegarde version 3, HUD et tests navigateur.

### Sprint 3.3 : objets interactifs ✅

PR #43, commit `83d1aa48eeb8411f01584d8321ea52357c2e6e07` : tables, tonneaux, grilles, torches, piliers, transitions déterministes, Brouhaha automatique, occupation commune, rendu isométrique et sauvegarde version 4.

### Sprint 3.4 : réactions en chaîne ✅

PR #45, commit `17ad00c0cb5abb9e66da6e320903f56606a8e8d5` : poussées, graphe déclaré par salle, file FIFO, transitions, déplacements, dégâts, Brouhaha causal, historique persistant, garde-fous et sauvegarde version 5.

### Sprint 3.5 : renforts déclenchés par le Brouhaha ✅

La PR #49 livre une politique de seuil séparée du Brouhaha et du spawn.

#### Contenu

La salle tactique utilise `schemaVersion: 5` et déclare des règles `brouhahaReinforcements` contenant :

- identifiant stable ;
- seuil entier de 1 à 12 ;
- `creatureId` et quantité ;
- liste ordonnée de points candidats ;
- mode `all-or-nothing` ou `partial` ;
- limite `maxActivations`.

Les identifiants, références de créatures, points et doublons sont validés avant le build.

#### Déclenchement

Une règle est éligible uniquement lorsque :

```text
previousLevel < threshold <= level
```

Une baisse ne déclenche rien. Une remontée peut réactiver une règle tant que sa limite n'est pas atteinte. Charger ou migrer une partie déjà au-dessus d'un seuil ne produit aucun renfort rétroactif.

Plusieurs règles franchies par une même demande sont triées par seuil puis identifiant et résolues séquentiellement.

#### Idempotence et limites

Chaque activation reçoit un identifiant dérivé de la demande de Brouhaha, de la règle et de son numéro d'activation. La `SpawnRequest` correspondante ajoute le suffixe `-spawn`.

Une activation est consommée dès que sa demande de spawn est soumise, y compris si le spawn est refusé. La règle ne choisit aucune case et délègue au moteur de spawn existant.

Le budget de menace n'est ni lu ni dépensé.

#### Résultats et événements

La couche de renfort distingue et historise :

- succès total ;
- succès partiel ;
- refus expliqué.

Elle produit `reinforcement-triggered`, les événements ordinaires du spawn, puis `reinforcement-resolved`.

#### Phase terminale et tour ennemi

L'ordre de résolution est :

1. intention directe ;
2. transitions, déplacements et dégâts ;
3. réactions en chaîne ;
4. demandes de Brouhaha ;
5. renforts de seuil ;
6. calcul de victoire ou défaite.

La victoire n'est acquise que si aucun ennemi vivant ne subsiste après les renforts de la résolution courante.

Le roster du tour ennemi est figé au début de la phase. Un ennemi ajouté après son ouverture agit au prochain tour ennemi.

#### Sauvegarde version 6

`RoomState` conserve :

- `nextBrouhahaReinforcementSequence` ;
- `brouhahaReinforcementHistory` ;
- la demande de Brouhaha racine ;
- la règle, le seuil et l'activation ;
- la `SpawnRequest` ;
- le résultat et les instances créées.

Les versions 1 à 5 migrent avec un historique vide et une séquence égale à 1, sans réinterpréter leur niveau de Brouhaha.

#### Scénario pilote Bastognac

- `seuil-1-bricoleur` : seuil 1, une créature, succès total, deux activations maximum ;
- `seuil-2-lance-tout` : seuil 2, deux créatures, mode partiel, une activation maximum.

Briser le tonneau démontre le premier seuil. La chaîne table → pilier → grille franchit les deux seuils et produit un succès total puis un succès partiel, sans bouton de spawn manuel.

#### Contrôles couverts

- franchissement montant uniquement ;
- ordre stable de plusieurs seuils ;
- idempotence et réactivation après baisse ;
- limite persistante et activation refusée consommée ;
- occupation déléguée au spawn ;
- phase terminale après renforts ;
- roster ennemi figé ;
- restauration exacte de la version 6 ;
- migrations versions 1 à 5 sans apparition rétroactive ;
- parcours Chrome bureau et mobile paysage ;
- absence de hasard implicite, temps système ou UUID ;
- aucune règle métier dans l'UI ou le renderer ;
- aucune modification de Gargottex.

## Étape suivante

### Sprint 3.6 : présentation et finition

- overlays et retours visuels ;
- premiers effets sonores utiles ;
- journal enrichi ;
- reprise exacte de tous les états ;
- mesures de fluidité ;
- tests desktop et mobile paysage.

## Articulation avec les Sprints 4 et 5

Le Sprint 4 équilibrera les seuils, quantités et archétypes pilotes sans modifier la frontière du moteur.

Le Sprint 5 générera la géométrie, les points de spawn et la population initiale selon le budget propre à chaque salle. Les renforts de Brouhaha resteront une augmentation runtime distincte.

## État de livraison

Les Sprints 3.1 à 3.5 sont implémentés. Le rapport de contrôle du Sprint 3.5 se trouve dans [Audit de livraison Sprint 3.5](../audits/sprint-3-5-brouhaha-reinforcements.md).
