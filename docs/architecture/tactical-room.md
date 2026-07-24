# Architecture, salle tactique

## Responsabilités

La salle tactique sépare cinq responsabilités :

1. **Contenu** : catalogues, géométrie logique, placements, points de spawn, objets, réactions et règles de renfort.
2. **Moteur** : grille, déplacements, ligne de vue, combat, tours, IA, Brouhaha, objets, réactions, renforts et spawn.
3. **Renderer PixiJS** : projection isométrique, assets, picking et diagnostics.
4. **UI DOM** : sélection, HUD, commandes accessibles et journal.
5. **Sauvegarde** : persistance IndexedDB, schémas versionnés et migrations.

`apps/game` assemble ces responsabilités. Il traduit les intentions utilisateur, mais ne décide pas si une action, une réaction ou un renfort est valide.

## Contenu de salle version 5

La salle Bastognac contient :

- héros et placements ennemis initiaux ;
- obstacles structurels ;
- instances initiales d'objets ;
- réactions en chaîne déclarées ;
- points et scripts de spawn ;
- règles `brouhahaReinforcements` ;
- dimensions et notes.

Les statistiques de créatures et les états d'objets restent dans leurs catalogues. Le validateur contrôle identifiants, références, positions, collisions, états, déclencheurs, cibles, créatures de renfort et points candidats.

## `RoomState` version 6

L'état runtime contient :

- dimensions, obstacles, phase et tour ;
- héros et instances ennemies ;
- instances d'objets, demandes traitées et séquence d'interaction ;
- historique et séquence des réactions en chaîne ;
- points, demandes et séquence de spawn ;
- niveau, historique et séquence du Brouhaha ;
- historique et séquence des renforts.

Aucune coordonnée écran, texture, orientation de caméra ou référence PixiJS n'entre dans le moteur.

## Définitions et instances

`CreatureDefinition` décrit un archétype stable. `CreatureInstance` porte l'identifiant runtime, le `creatureId`, la position, les PV et les statistiques courantes.

`InteractableDefinition` décrit une famille, ses états et transitions. `InteractableInstance` porte l'identifiant runtime, la position, l'état et les propriétés de blocage.

Une `BrouhahaReinforcementDefinition` décrit une règle de salle, pas une créature déjà présente.

## Objets interactifs

Une interaction valide exige le tour des héros, un héros actif avec une action, une distance orthogonale d'une case, une transition autorisée et une destination valide.

Une réussite consomme une action. Une interaction bruyante produit une demande de Brouhaha stable. Un refus ne modifie rien.

Voir [Architecture des objets interactifs](interactable-objects.md).

## Réactions en chaîne

Le graphe de salle utilise les déclencheurs `state-entered` et `moved`. Le moteur :

- traite les déclencheurs dans une file FIFO ;
- trie les définitions applicables ;
- exécute les actions dans l'ordre déclaré ;
- applique transitions, déplacements, dégâts et Brouhaha ;
- conserve la causalité ;
- interrompt cycles et propagations excessives.

Voir [Réactions en chaîne tactiques](chain-reactions.md).

## Spawn déterministe

Une `SpawnRequest` fournit archétype, quantité et liste ordonnée de points candidats. Le moteur filtre les points absents, dupliqués, désactivés, hors limites ou bloqués.

`all-or-nothing` refuse sans mutation lorsque les positions sont insuffisantes. `partial` crée les instances possibles et explique le reliquat.

Les identifiants reposent sur une séquence persistée. Le moteur de spawn ne lit ni ne dépense le budget de menace.

## Brouhaha et renforts

La jauge reste bornée de 0 à 12. Les demandes sont idempotentes et historisées : un effet aux niveaux 0 à 9, deux effets aux niveaux 10 à 12.

Après chaque changement accepté, les règles de renfort dont le seuil est franchi à la hausse sont triées par seuil puis identifiant :

```text
previousLevel < threshold <= level
```

Chaque activation produit une `SpawnRequest` ordinaire. Le moteur de spawn conserve l'autorité sur les points, l'occupation et le mode d'échec.

Les activations, résultats et instances créées sont persistés. Une baisse, un chargement ou une migration ne produit aucun renfort rétroactif.

Voir [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

## Ordre de résolution et phases

```text
intention
   │
   ▼
transition / déplacement / dégâts
   │
   ▼
réactions en chaîne
   │
   ▼
demandes de Brouhaha
   │
   ▼
renforts de seuil
   │
   ▼
phase terminale
```

La victoire n'est calculée qu'après les renforts de la résolution courante. Une salle terminale refuse toute nouvelle action, demande de Brouhaha ou apparition.

Chaque héros commence avec trois actions. Le roster du tour ennemi est figé au début de la phase. Un ennemi créé après son ouverture agit au prochain tour ennemi.

## Grille, déplacement et ligne de vue

Le moteur utilise les coordonnées logiques de la grille 8 × 4. Obstacles, combattants et objets bloquants participent à l'occupation.

La ligne de vue supercover considère obstacles, combattants et objets opaques. Ouvrir une grille ou briser un tonneau peut libérer une case et une ligne de vue sans modifier le renderer.

## Présentation isométrique

Le renderer distingue espace logique, espace de vue et espace écran. Les rotations 0°, 90°, 180° et 270° ne modifient jamais l'état sauvegardé.

Le canvas remonte seulement les intentions et expose des diagnostics de test pour objets, spawns, Brouhaha, renforts, réactions, combattants, murs, caméra et assets.

## Sauvegarde version 6

La sauvegarde conserve :

- instances d'objets et états ;
- demandes d'interaction et séquence ;
- historique causal des réactions ;
- héros, ennemis, points et demandes de spawn ;
- Brouhaha complet ;
- activations et résultats des renforts ;
- positions, PV, actions, phase et tour.

Les versions 1 à 5 sont migrées défensivement. Les champs absents reçoivent des structures vides et séquences initiales, sans inventer d'événements ou d'apparitions.

## Tests actuels

Les tests couvrent déplacements, combats, tours, IA, objets, occupation, Brouhaha, poussées, réactions, seuils, succès total/partiel/refus, phase terminale, roster ennemi, sauvegarde version 6 et parcours desktop/mobile paysage.

## Hors périmètre actuel

- composition de rencontre ou génération de géométrie ;
- loot direct ;
- audio et animations définitifs ;
- équilibrage final des héros, créatures et seuils.
