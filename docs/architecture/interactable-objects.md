# Architecture des objets interactifs

## Statut

- Cible initiale : Sprint 3.3, livré
- Extension Sprint 3.4 : réactions en chaîne, livrée
- Extension Sprint 3.5 : renforts de Brouhaha, livrée
- Issue initiale : #42, clôturée
- Pull Request initiale : #43, fusionnée
- Réactions : [architecture dédiée](chain-reactions.md)
- Renforts : [architecture dédiée](brouhaha-reinforcements.md)

## Responsabilité

Le moteur d'objets transforme une demande explicite d'un héros actif en transition de décor, consommation d'action, événements et, lorsque l'interaction est bruyante, demande de Brouhaha.

La poussée et la propagation restent dans les systèmes tactiques dédiés. Les renforts ne sont jamais référencés par un objet : ils observent les changements de niveau du Brouhaha.

Le loot reste exclu de cette responsabilité.

## Séparation définition et instance

`InteractableDefinition` décrit un archétype stable : identité, famille, états, blocages, transitions, coût de Brouhaha et mouvement direct optionnel.

`InteractableInstance` représente un objet présent : identifiant runtime, référence, position, état courant et propriétés de blocage calculées.

Le contenu place les instances et le moteur calcule leurs conséquences. Le renderer ne décide jamais si une transition est légale.

## Catalogue pilote Bastognac

| Objet              | États pilotes     | Interaction          | Brouhaha |
| ------------------ | ----------------- | -------------------- | -------- |
| Table bancale      | debout, renversée | pousser et renverser | 0        |
| Tonneau douteux    | intact, brisé     | briser               | +1       |
| Grille grinçante   | fermée, ouverte   | ouvrir ou fermer     | 0        |
| Torche murale      | allumée, éteinte  | éteindre ou rallumer | 0        |
| Pilier susceptible | intact, fissuré   | fissurer             | +1       |

Ces objets n'accordent aucun loot direct.

## Demande d'interaction

Une `InteractableInteractionRequest` contient un identifiant idempotent, le héros, l'instance et l'interaction demandée.

La résolution vérifie :

1. demande non traitée ;
2. salle non terminale ;
3. tour des héros ;
4. héros vivant, actif et disposant d'une action ;
5. objet, définition et transition présents ;
6. distance orthogonale d'une case ;
7. destination valide pour une poussée ;
8. absence de combattant lorsqu'une transition rend la case bloquante.

Un refus retourne le même `RoomState` et ne consomme aucune action.

## Intégration au Brouhaha et aux renforts

Une transition dont `brouhahaDelta` est non nul produit une demande `<requestId>-brouhaha`.

Le moteur d'objets ne choisit aucun effet, seuil, créature ou point. Il délègue au Brouhaha, qui résout ensuite les règles de seuil franchies.

L'ordre causal est :

1. demande d'interaction ;
2. déplacement éventuel ;
3. changement d'état ;
4. succès et consommation d'action ;
5. Brouhaha direct éventuel et renforts associés ;
6. propagation des réactions secondaires ;
7. Brouhaha et renforts secondaires ;
8. phase terminale.

Le tonneau démontre un renfort au seuil 1. La chaîne table → pilier → grille démontre plusieurs seuils dans une même résolution.

## Déplacement, spawn et ligne de vue

- un objet bloquant interdit déplacement et apparition ;
- un objet opaque bloque la ligne de vue ;
- un état ouvert ou brisé peut libérer la case ;
- fermer une grille sur un combattant est refusé ;
- pousser un objet sur obstacle, combattant ou objet est refusé.

Les coordonnées restent logiques et indépendantes de la caméra.

## Interface et renderer

L'application expose les interactions disponibles sous forme de boutons accessibles. Le même contrat est utilisé lors d'une sélection directe sur le canvas.

Le renderer dessine l'état, utilise les assets disponibles, remonte l'identifiant sélectionné et expose des diagnostics de test. Il ne connaît ni transitions autorisées, ni seuils de renfort.

## Sauvegarde

Le Sprint 3.3 a introduit la version 4, le Sprint 3.4 la version 5 et le Sprint 3.5 la version 6.

La version 6 conserve sans modifier la structure des objets :

- prochaine séquence de réaction et historique causal ;
- prochaine séquence de renfort et historique des activations ;
- résultats appliqués, ignorés, interrompus, réussis, partiels ou refusés.

Les versions 1 à 5 migrent avec des structures absentes initialisées sans inventer de réactions ni déclencher de renforts.

## Frontière avec les phases suivantes

- Sprint 3.4 : poussée et réactions, livré ;
- Sprint 3.5 : renforts de seuil, livré ;
- Sprint 3.6 : retours visuels, audio utile et finition ;
- Sprint 4 : équilibrage définitif.

Gargottex reste strictement en lecture seule et n'est pas une dépendance runtime.
