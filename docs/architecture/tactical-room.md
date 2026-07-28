# Architecture, salle tactique

## Responsabilités

La salle tactique sépare :

1. **Contenu** : géométrie logique, populations initiales, points de spawn, objets, réactions, renforts, objectif local et sortie.
2. **Moteur** : grille, déplacements, ligne de vue, combat, tours, IA, Brouhaha, objets, réactions, renforts et spawn.
3. **Présentation pure** : cues et journal dérivés de l'état final et des événements.
4. **Renderer PixiJS** : projection isométrique, assets, picking et diagnostics.
5. **UI DOM** : sélection, HUD, commandes accessibles et journal.
6. **Sauvegarde** : persistance IndexedDB, schémas versionnés et migrations.

`apps/game` assemble ces responsabilités. Il traduit les intentions, mais ne décide pas si une action, réaction, complétion, sortie ou transition est valide.

## Contenu de salle actuel

La salle Bastognac pilote contient :

- héros et placements ennemis initiaux ;
- obstacles structurels ;
- instances initiales d'objets ;
- réactions en chaîne déclarées ;
- points et scripts de spawn ;
- règles `brouhahaReinforcements` ;
- dimensions et notes.

Les statistiques de créatures et les états d'objets restent dans leurs catalogues. Le validateur contrôle identifiants, références, positions, collisions, états, déclencheurs, cibles, créatures de renfort et points candidats.

Pour les nouvelles salles du Sprint 4, les populations initiales déclarées sont traduites en `SpawnRequest` et ne deviennent jamais directement des `CreatureInstance` par le chargeur de contenu.

## `RoomState` version 6

L'état runtime actuel contient :

- dimensions, obstacles, phase et tour ;
- héros et instances ennemies ;
- instances d'objets, demandes traitées et séquences ;
- historique des réactions ;
- points, demandes et séquence de spawn ;
- niveau, historique et séquence du Brouhaha ;
- historique et séquence des renforts ;
- roster figé du tour ennemi.

Aucune coordonnée écran, texture, orientation de caméra ou référence PixiJS n'entre dans le moteur.

## Définitions et instances

`CreatureDefinition` décrit un archétype stable. `CreatureInstance` porte l'identifiant runtime, le `creatureId`, la position, les PV et les statistiques courantes.

`InteractableDefinition` décrit une famille, ses états et transitions. `InteractableInstance` porte l'identifiant runtime, la position, l'état et les propriétés de blocage.

Le Sprint 4 ajoutera `HeroDefinition`, compétences, profils de comportement et influences déclaratives du Brouhaha, sans fusionner définition, instance et placement.

## Objets interactifs

Une interaction produit une intention validée par le moteur d'objets. Une réussite consomme les ressources prévues, applique la transition et peut produire une demande de Brouhaha. Un refus ne modifie rien.

Le Sprint 4 étendra les acteurs autorisés aux créatures selon leur définition et leur profil. Les créatures ne changent jamais directement l'état d'un objet.

Le Brouhaha direct d'une interaction et ses renforts sont résolus avant les réactions secondaires.

Voir [Architecture des objets interactifs](interactable-objects.md).

## Réactions en chaîne

Le graphe de salle utilise des déclencheurs déclarés. Le moteur :

- reçoit les déclencheurs après le Brouhaha direct éventuel ;
- traite les déclencheurs dans une file FIFO ;
- trie les définitions applicables ;
- exécute les actions dans l'ordre déclaré ;
- applique transitions, déplacements, dégâts et Brouhaha secondaire ;
- résout chaque Brouhaha secondaire et ses renforts à sa position causale ;
- conserve la causalité ;
- interrompt cycles et propagations excessives.

Une transition vers une autre salle ne peut pas interrompre cette file.

Voir [Réactions en chaîne tactiques](chain-reactions.md).

## Spawn déterministe

Une `SpawnRequest` fournit archétype, quantité et liste ordonnée de points candidats. Le moteur filtre les points invalides et applique le mode total ou partiel.

Les identifiants reposent sur une séquence persistée. Le moteur de spawn ne lit ni ne dépense le budget de menace.

Au Sprint 4 :

- les populations des trois salles restent écrites à la main ;
- leurs placements sont traduits en demandes initiales déterministes ;
- les renforts utilisent les règles de salle ;
- toute créature initiale ou ajoutée est instanciée par le moteur de spawn ;
- aucune composition automatique de rencontre n'est introduite.

## Brouhaha et renforts

La jauge reste bornée de 0 à 12. Les demandes sont idempotentes et historisées.

Après chaque changement accepté, les règles de renfort dont le seuil est franchi à la hausse sont triées par seuil puis identifiant :

```text
previousLevel < threshold <= level
```

Chaque activation produit une `SpawnRequest` ordinaire. Le moteur de spawn conserve l'autorité sur les points, l'occupation et le mode d'échec.

Le Brouhaha reste local à chaque salle du micro-donjon. Le niveau de la salle précédente n'est pas transféré.

Les profils du Sprint 4 peuvent consulter le Brouhaha et modifier leurs intentions candidates ou priorités, mais toute variation passe encore par le moteur dédié.

## Ordre de résolution tactique

### Action sans interaction d'objet bruyante

```text
intention
→ validation
→ effet tactique direct
→ réactions éventuelles
→ Brouhaha secondaire éventuel à sa position causale
→ effets et renforts associés
→ phase terminale locale
→ état final et événements
```

### Interaction d'objet bruyante

```text
intention d'interaction
→ validation
→ transition ou déplacement direct de l'objet
→ Brouhaha direct éventuel
→ effets et renforts directs
→ réactions en chaîne FIFO
→ Brouhaha secondaire éventuel de chaque action
→ effets et renforts secondaires
→ phase terminale locale
→ état final et événements
```

La victoire locale n'est calculée qu'après toutes les apparitions de la résolution courante. Une salle terminale refuse toute nouvelle action, demande de Brouhaha ou apparition.

Le Sprint 4.0 doit stabiliser les cues terminaux et l'ordre runtime de présentation et persistance. Il ne change pas cet ordre métier sans décision explicite.

## Tour ennemi

Le roster du tour ennemi est figé au début de la phase. Un ennemi créé après son ouverture agit au prochain tour ennemi.

Le Sprint 4 ajoute des profils de comportement génériques. Chaque créature génère des intentions candidates, les classe sans hasard implicite, produit une explication et transmet l'intention au moteur approprié.

Un bouton unique de résolution du tour ennemi reste acceptable pendant le Sprint 4.

## Objectif, complétion et sortie de salle

Chaque salle du Sprint 4 doit déclarer :

- objectif local ;
- état de progression de l'objectif ;
- condition de complétion ;
- condition d'ouverture de la sortie ;
- porte ou passage cible lorsqu'une salle suivante existe ;
- point d'entrée de la salle suivante ;
- texte de présentation utile.

Après résolution complète, une salle dont la condition est remplie est ajoutée idempotemment à `completedRoomIds`.

- Pour les salles 1 et 2, la sortie devient ensuite disponible et le joueur produit une intention explicite de transition.
- Pour la salle 3, la complétion déclenche le calcul du résultat global sans transition vers une salle inexistante.

La victoire locale reste distincte du résultat global de l'expédition.

## Grille, déplacement et ligne de vue

Le moteur utilise des coordonnées logiques. Obstacles, combattants et objets bloquants participent à l'occupation.

La ligne de vue supercover considère obstacles, combattants et objets opaques. Les interactions peuvent libérer une case ou une ligne de vue sans modifier le renderer.

Les trois salles peuvent avoir des géométries fixes différentes, à condition que leur schéma soit explicitement validé. Le Sprint 4 ne génère aucune géométrie.

## Présentation isométrique

Le renderer distingue espace logique, espace de vue et espace écran. Les rotations ne modifient jamais l'état sauvegardé.

Le canvas remonte seulement les intentions. Il ne décide pas qu'un objectif est atteint, qu'une salle est terminée, qu'une sortie est ouverte ou qu'une transition est valide.

## Articulation avec `ExpeditionState`

`RoomState` reste local à une salle. `ExpeditionState` conserve :

- équipe sélectionnée ;
- état persistant validé des héros ;
- salle courante ;
- ordre des trois salles ;
- salles visitées et terminées ;
- états de salles ;
- statut et résultat global.

La complétion est enregistrée avant une transition. La transition extrait uniquement les propriétés persistantes des héros, clôt la salle source et restaure ou crée la salle cible.

Voir [Micro-donjon et état d'expédition](micro-dungeon-and-expedition.md).

## Sauvegarde et migrations

La sauvegarde tactique actuelle reste en version 6.

Le Sprint 4.1 doit ajouter et valider l'enveloppe d'expédition, son format de sauvegarde, sa version initiale et sa stratégie de migration avant les transitions. Le Sprint 4.2 ajoute ensuite les schémas et migrations propres aux acteurs et comportements.

Une migration ne doit :

- exécuter aucune réaction ;
- changer aucun niveau de Brouhaha ;
- créer aucun spawn initial ou renfort ;
- inventer aucune compétence ou ressource persistante ;
- rejouer aucune transition.

## Tests cibles du Sprint 4

- populations initiales par `SpawnRequest` ;
- actions, compétences et profils de héros ;
- décisions ennemies déterministes et expliquées ;
- interactions des créatures avec les objets ;
- Brouhaha direct avant réactions ;
- influences du Brouhaha ;
- objectif et complétion de chaque salle ;
- troisième salle terminée sans transition supplémentaire ;
- transition refusée avant résolution complète ;
- transfert des héros ;
- Brouhaha local ;
- reprise dans chacune des trois salles ;
- victoire et défaite globales ;
- mode diagnostic séparé ;
- desktop, tablette et mobile paysage.

## Hors périmètre du Sprint 4

- composition automatique de rencontre ;
- génération de topologie ou géométrie ;
- embranchements générés ;
- loot et progression ;
- campagne ;
- Baron Pas-Très-Terrifiant ;
- équilibrage implicite non validé.
