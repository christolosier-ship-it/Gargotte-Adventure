# Architecture — Salle tactique

## Responsabilités

La salle tactique sépare cinq responsabilités :

1. **Contenu** : catalogues, géométrie logique, placements, points de spawn et scripts pilotes.
2. **Moteur** : grille, déplacements, ligne de vue, combat, tours, IA, Brouhaha, objets et spawn.
3. **Renderer PixiJS** : projection isométrique, assets, picking et diagnostics.
4. **UI DOM** : sélection, HUD, commandes accessibles et journal.
5. **Sauvegarde** : persistance IndexedDB, schémas versionnés et migrations.

`apps/game` assemble ces responsabilités. Il traduit les intentions utilisateur, mais ne décide pas si une action est valide.

## Contenu de salle version 3

La salle Bastognac contient :

- les héros et placements ennemis initiaux ;
- les obstacles structurels ;
- les instances initiales d'objets ;
- les points et scripts de spawn ;
- les dimensions et notes.

Les statistiques de créatures et les états d'objets restent dans leurs catalogues respectifs. Le validateur contrôle les identifiants, références, positions, collisions et états initiaux.

## `RoomState` version 4

L'état runtime contient :

- dimensions, obstacles, phase et tour ;
- héros et instances ennemies ;
- instances d'objets et demandes d'interaction traitées ;
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
- une case libre lorsqu'un objet redevient bloquant.

Une réussite consomme une action. Une interaction bruyante produit une demande de Brouhaha stable. Un refus ne modifie rien et ne consomme aucune action.

Les règles détaillées se trouvent dans [Architecture des objets interactifs](interactable-objects.md).

## Spawn déterministe

Une `SpawnRequest` fournit un archétype, une quantité et une liste ordonnée de points candidats. Le moteur filtre les points absents, dupliqués, désactivés, hors limites ou bloqués.

Le mode `all-or-nothing` refuse sans mutation lorsque les positions sont insuffisantes. Le mode `partial` crée les instances possibles et explique le reliquat.

Les identifiants reposent sur une séquence persistée. Le moteur de spawn ne lit ni ne dépense le budget de menace.

## Brouhaha

La jauge reste bornée de 0 à 12. Les demandes sont idempotentes, historisées et résolues sans hasard implicite :

- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12.

Les objets ne choisissent aucun effet. Ils produisent seulement une demande explicite que le moteur de Brouhaha résout.

## Phases et activations

```text
heroes-turn
    │
    ├─ tous les héros vivants terminent
    ▼
enemy-turn
    │
    ├─ IA résolue
    ▼
heroes-turn du tour suivant

À tout moment :
- dernier ennemi vaincu → victory
- dernier héros vaincu  → defeat
```

Chaque héros commence avec trois actions. Changer de héros pendant une activation est interdit. Une phase terminale refuse toute action et toute apparition.

## Grille, déplacement et ligne de vue

Le moteur utilise les coordonnées logiques de la grille 8 × 4. Les obstacles, combattants et objets bloquants participent à l'occupation.

La ligne de vue supercover considère :

- les obstacles structurels ;
- les combattants bloquants ;
- les objets dont l'état bloque la visibilité.

Ouvrir une grille ou briser un tonneau peut donc libérer une case et une ligne de vue sans modifier le renderer.

## Présentation isométrique

Le renderer distingue espace logique, espace de vue et espace écran. Les rotations 0°, 90°, 180° et 270° ne modifient jamais l'état sauvegardé.

Le canvas remonte les intentions de case, héros, ennemi ou objet. Il expose aussi les diagnostics des objets, spawns, Brouhaha, combattants, murs, caméra et assets.

## Sauvegarde version 4

La sauvegarde conserve :

- toutes les instances d'objets et leurs états ;
- les demandes d'interaction traitées et la séquence suivante ;
- les héros, ennemis, spawns et Brouhaha ;
- les positions, PV, actions, phase et tour.

Les versions 1 à 3 sont migrées défensivement. Elles reçoivent une liste d'objets vide et une séquence initiale à 1, sans inventer rétroactivement du décor.

## Tests du Sprint 3.3

Les tests couvrent :

- transitions, coût d'action, portée et idempotence ;
- blocage de déplacement et de ligne de vue ;
- Brouhaha automatique ;
- fermeture refusée sur une case occupée ;
- validation des catalogues et placements ;
- sauvegarde version 4 et migrations ;
- clic direct, journal et reprise sur desktop et mobile paysage.

## Hors périmètre

- poussée et lancement d'objets ;
- réactions en chaîne et dégâts de zone ;
- renforts automatiques par seuil ;
- loot direct ;
- génération de rencontre ou de géométrie ;
- audio et animations définitifs.
