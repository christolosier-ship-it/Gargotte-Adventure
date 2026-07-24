# Sprint 3 : Brouhaha, spawn et décor interactif

- Statut : en cours
- Dernière étape livrée : Sprint 3.5
- Issue Sprint 3.5 : #48, clôturée
- Pull Request Sprint 3.5 : #49, fusionnée
- Commit stable : `18a97f64f97760417f6c1e5e4cdcc139ae1e77ac`
- Étape suivante : Sprint 3.6
- Issue documentaire de préparation : #50
- Branche documentaire : `docs/sprint-3-6-documentation`

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
7. Les événements moteur sont la source de vérité des effets de présentation.
8. Le renderer, l'UI et l'audio ne décident jamais des règles.
9. Le budget de menace appartient à chaque salle.
10. La géométrie complète des étages appartient au Sprint 5.
11. Gargottex reste strictement en lecture seule.

Références :

- [Architecture du moteur de spawn](../architecture/spawn-engine.md)
- [Architecture du Brouhaha](../architecture/brouhaha.md)
- [Architecture des objets interactifs](../architecture/interactable-objects.md)
- [Architecture des réactions en chaîne](../architecture/chain-reactions.md)
- [Renforts déclenchés par le Brouhaha](../architecture/brouhaha-reinforcements.md)
- [Présentation et finition du Sprint 3.6](../architecture/presentation-and-finishing.md)
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

PR #49, commit `18a97f64f97760417f6c1e5e4cdcc139ae1e77ac`.

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

Le contrôle final se trouve dans [Audit de livraison Sprint 3.5](../audits/sprint-3-5-brouhaha-reinforcements.md).

## Sprint 3.6 : présentation et finition

### Objectif

Rendre visibles et audibles les conséquences déjà calculées par le moteur, sans ajouter de règle tactique et sans modifier le déterminisme de la salle.

### État de départ

- le renderer reconstruit ses couches à chaque rendu ;
- les diagnostics exposent caméra, cache d'assets et nombre d'objets affichés ;
- le journal DOM conserve les six entrées les plus récentes ;
- `event-messages.ts` traduit déjà les événements tactiques ;
- `AudioDirector` expose volume et mode muet, sans lecture connectée ;
- la sauvegarde version 6 restaure tout l'état métier.

### Architecture cible

Une couche applicative transforme les événements ordonnés en cues visuels, audio et textuels.

Elle doit :

- conserver l'ordre causal ;
- produire des cues sans muter `RoomState` ;
- laisser le renderer afficher des effets transitoires dans une couche dédiée ;
- laisser `packages/audio` charger et jouer des sons locaux ;
- annuler ou détruire les effets devenus obsolètes ;
- fonctionner sans son, sans animation et avec des assets manquants.

### Cues pilotes

- activation du héros ;
- déplacement ou poussée ;
- impact et dégâts ;
- variation du Brouhaha ;
- franchissement de seuil ;
- apparition totale, partielle ou refusée ;
- victoire et défaite.

Les sons pilotes couvrent interaction, impact, dégâts, seuil, apparition et phase terminale.

### Journal

Le journal doit regrouper les conséquences d'une même action racine, distinguer clairement succès partiels et refus, et conserver une liste DOM bornée.

Les historiques persistants du moteur restent la preuve complète. Le journal visible n'est pas une seconde sauvegarde.

### Reprise

Une partie restaurée reconstruit immédiatement l'état stable sans rejouer les animations, sons, impacts ou apparitions déjà résolus.

Les réglages audio appartiennent à l'application, pas à `RoomState`. Aucun changement de version tactique n'est prévu pour des données purement visuelles ou sonores.

### Accessibilité

- support de `prefers-reduced-motion` ;
- mode muet accessible ;
- aucune information essentielle transmise uniquement par le son ou la couleur ;
- overlays sans capture du focus ;
- commandes clavier et tactiles conservées.

### Fluidité et stabilité

Le Sprint 3.6 mesure avant d'optimiser.

Les contrôles vérifient notamment :

- stabilité de `data-display-objects` après des rendus répétés ;
- stabilisation de `data-asset-cache-size` ;
- présence d'un seul canvas ;
- absence de multiplication des listeners ;
- destruction des effets transitoires ;
- journal sans croissance illimitée ;
- absence de régression sur bureau et mobile paysage.

Le rendu complet n'est pas remplacé automatiquement par un diff incrémental. WebAssembly et véritable 3D restent exclus sans besoin mesuré.

## Critères de sortie du Sprint 3.6

- les cues proviennent exclusivement des événements et de l'état moteur ;
- aucune règle métier n'est ajoutée dans le renderer, l'UI ou l'audio ;
- les conséquences principales possèdent un retour visuel lisible ;
- les premiers sons respectent volume, mute, autoplay et fallback ;
- le journal explique la causalité, les seuils et les résultats partiels ;
- une reprise ne rejoue aucun effet historique ;
- le mouvement réduit et l'usage sans son restent fonctionnels ;
- les objets PixiJS, listeners, cache et entrées du journal restent bornés ;
- les tests unitaires et Playwright passent sur Chrome bureau et mobile paysage ;
- aucun appel réseau tiers, secret ou dépendance à Gargottex n'est ajouté ;
- l'audit final clôt le Sprint 3 avant le passage au Sprint 4.

## Hors périmètre du Sprint 3.6

- nouvelles règles tactiques ;
- équilibrage des héros, créatures ou seuils ;
- animations définitives de tous les personnages ;
- musique adaptative, doublages ou spatialisation avancée ;
- génération de donjon ;
- loot, progression et campagne ;
- véritable 3D ou WebAssembly.

## Articulation avec les Sprints 4 et 5

Le Sprint 4 équilibrera les seuils, quantités et archétypes pilotes sans modifier la frontière du moteur ou du routeur de présentation.

Le Sprint 5 générera la géométrie, les points de spawn et la population initiale selon le budget propre à chaque salle. Les renforts de Brouhaha resteront une augmentation runtime distincte.

## État de livraison

Les Sprints 3.1 à 3.5 sont implémentés. Le Sprint 3.6 est cadré mais non implémenté. Son architecture de référence est [Présentation et finition du Sprint 3.6](../architecture/presentation-and-finishing.md).