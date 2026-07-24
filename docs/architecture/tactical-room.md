# Architecture, salle tactique

## Responsabilités

La salle tactique sépare cinq responsabilités :

1. **Contenu** : catalogues, géométrie logique, placements, points de spawn, objets et réactions déclarées.
2. **Moteur** : grille, déplacements, ligne de vue, combat, tours, IA, Brouhaha, objets, réactions et spawn.
3. **Renderer PixiJS** : projection isométrique, assets, picking et diagnostics.
4. **UI DOM** : sélection, HUD, commandes accessibles et journal.
5. **Sauvegarde** : persistance IndexedDB, schémas versionnés et migrations.

`apps/game` assemble ces responsabilités. Il traduit les intentions utilisateur, mais ne décide pas si une action est valide.

## Contenu de salle version 4

La salle Bastognac contient :

- les héros et placements ennemis initiaux ;
- les obstacles structurels ;
- les instances initiales d'objets ;
- les réactions en chaîne déclarées ;
- les points et scripts de spawn ;
- les dimensions et notes.

Les statistiques de créatures et les états d'objets restent dans leurs catalogues respectifs. Le validateur contrôle identifiants, références, positions, collisions, états initiaux, déclencheurs et cibles de réactions.

Le Sprint 3.5 prévoit un schéma version 5 ajoutant les règles `brouhahaReinforcements`.

## `RoomState` version 5

L'état runtime contient :

- dimensions, obstacles, phase et tour ;
- héros et instances ennemies ;
- instances d'objets et demandes d'interaction traitées ;
- prochaine séquence d'interaction ;
- historique et séquence des réactions en chaîne ;
- points, demandes et séquence de spawn ;
- niveau, historique et séquence du Brouhaha.

Aucune coordonnée écran, texture, orientation de caméra ou référence PixiJS n'entre dans le moteur.

## Définitions et instances

### Créatures

`CreatureDefinition` décrit l'archétype stable. `CreatureInstance` porte l'identifiant runtime, le `creatureId`, la position, les PV et les statistiques courantes.

### Objets

`InteractableDefinition` décrit la famille, les états et transitions autorisés. `InteractableInstance` porte l'identifiant runtime, la position, l'état courant et les propriétés de blocage calculées.

Plusieurs instances peuvent partager la même définition sans partager leur état.

## Objets interactifs

Le Sprint 3.3 livre table, tonneau, grille, torche et pilier. Une interaction valide exige :

- le tour des héros ;
- un héros vivant et actif ;
- au moins une action restante ;
- une distance orthogonale d'une case ;
- une transition autorisée depuis l'état courant ;
- une destination libre pour une poussée ;
- une case libre lorsqu'un objet redevient bloquant.

Une réussite consomme une action. Une interaction bruyante produit une demande de Brouhaha stable. Un refus ne modifie rien et ne consomme aucune action.

Les règles détaillées se trouvent dans [Architecture des objets interactifs](interactable-objects.md).

## Réactions en chaîne

Le Sprint 3.4 ajoute un graphe déclaré par salle.

Une transition ou un déplacement peut produire un déclencheur `state-entered` ou `moved`. Le moteur :

- traite les déclencheurs dans une file FIFO ;
- trie les définitions applicables par identifiant ;
- exécute leurs actions dans l'ordre déclaré ;
- applique transitions, déplacements, dégâts et demandes de Brouhaha ;
- conserve la causalité complète ;
- interrompt les cycles et les propagations excessives explicitement.

Une réaction n'est jamais décidée par le renderer ou l'UI.

Voir [Réactions en chaîne tactiques](chain-reactions.md).

## Spawn déterministe

Une `SpawnRequest` fournit un archétype, une quantité et une liste ordonnée de points candidats. Le moteur filtre les points absents, dupliqués, désactivés, hors limites ou bloqués.

Le mode `all-or-nothing` refuse sans mutation lorsque les positions sont insuffisantes. Le mode `partial` crée les instances possibles et explique le reliquat.

Les identifiants reposent sur une séquence persistée. Le moteur de spawn ne lit ni ne dépense le budget de menace.

Les objets bloquants participent à l'occupation. Une grille ouverte ou un tonneau brisé peut libérer une case de spawn.

## Brouhaha

La jauge reste bornée de 0 à 12. Les demandes sont idempotentes, historisées et résolues sans hasard implicite :

- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12.

Les objets et réactions ne choisissent aucun effet. Ils produisent seulement des demandes explicites que le moteur de Brouhaha résout dans leur ordre causal.

## Renforts de Brouhaha, cible Sprint 3.5

La prochaine étape introduira des règles déclarées par salle qui observent le passage d'un niveau précédent vers un nouveau niveau.

Une règle sera éligible uniquement lors d'un franchissement montant :

```text
previousLevel < threshold <= level
```

Elle produira une `SpawnRequest` ordinaire. Le moteur de spawn conservera l'autorité sur les points, l'occupation, le mode d'échec et la création des instances.

La limite d'activation et l'historique seront persistés. Une migration ou un chargement ne provoquera aucun renfort rétroactif.

Voir [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

## Ordre de résolution et phases

```text
heroes-turn
    │
    ├─ tous les héros vivants terminent
    ▼
enemy-turn
    │
    ├─ IA du roster ouvert résolue
    ▼
heroes-turn du tour suivant
```

Chaque héros commence avec trois actions. Changer de héros pendant une activation est interdit.

Une action racine peut produire plusieurs conséquences. L'ordre cible du Sprint 3.5 est :

1. intention directe ;
2. transitions et dégâts ;
3. réactions en chaîne ;
4. demandes de Brouhaha ;
5. renforts de seuil ;
6. calcul de la phase terminale.

La victoire ne doit être calculée qu'après les renforts de la résolution courante. Une salle déjà terminale refuse toute nouvelle action, demande de Brouhaha ou apparition.

Les ennemis créés pendant `enemy-turn` ne rejoignent pas le roster déjà ouvert. Ils agiront au prochain tour ennemi.

## Grille, déplacement et ligne de vue

Le moteur utilise les coordonnées logiques de la grille 8 × 4. Les obstacles, combattants et objets bloquants participent à l'occupation.

La ligne de vue supercover considère :

- les obstacles structurels ;
- les combattants bloquants ;
- les objets dont l'état bloque la visibilité.

Ouvrir une grille ou briser un tonneau peut donc libérer une case et une ligne de vue sans modifier le renderer.

## Présentation isométrique

Le renderer distingue espace logique, espace de vue et espace écran. Les rotations 0°, 90°, 180° et 270° ne modifient jamais l'état sauvegardé.

Le canvas remonte les intentions de case, héros, ennemi ou objet. Il expose aussi les diagnostics des objets, spawns, Brouhaha, réactions, combattants, murs, caméra et assets.

## Sauvegarde version 5

La sauvegarde conserve :

- toutes les instances d'objets et leurs états ;
- les demandes d'interaction traitées et la séquence suivante ;
- l'historique causal des réactions et sa séquence ;
- les héros, ennemis, spawns et Brouhaha ;
- les positions, PV, actions, phase et tour.

Les versions 1 à 4 sont migrées défensivement. Une ancienne sauvegarde reçoit les structures absentes avec des historiques vides et des séquences initiales, sans inventer rétroactivement des événements.

Le Sprint 3.5 prévoit une version 6 ajoutant l'historique et la séquence des renforts de Brouhaha.

## Tests actuels

Les tests couvrent :

- déplacements, combats, tours et IA ;
- transitions, coût d'action, portée et idempotence des objets ;
- blocage de déplacement, spawn et ligne de vue ;
- Brouhaha automatique ;
- poussées et réactions en chaîne ;
- causalité, cycles et limite de propagation ;
- sauvegarde version 5 et migrations ;
- clic direct, journal et reprise sur desktop et mobile paysage.

## Hors périmètre actuel

- renforts automatiques par seuil, cadrés pour le Sprint 3.5 ;
- composition de rencontre ou génération de géométrie ;
- loot direct ;
- audio et animations définitifs ;
- équilibrage final des héros et créatures.
