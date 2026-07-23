# Architecture des objets interactifs

## Statut

- Cible : Sprint 3.3
- Issue : #42
- Pull Request : #43
- Branche : `sprint-3/interactable-objects`

## Responsabilité

Le moteur d'objets transforme une demande explicite d'un héros actif en une transition d'état du décor, une consommation d'action, des événements explicatifs et, lorsque l'interaction est bruyante, une demande de Brouhaha.

Il ne résout pas les réactions en chaîne, les dégâts de zone, les déplacements d'objets, le loot ou les renforts automatiques. Ces extensions appartiennent aux phases suivantes.

## Séparation définition et instance

`InteractableDefinition` décrit un archétype éditorial stable :

- identité, nom et famille ;
- états autorisés ;
- propriétés de blocage par état ;
- transitions disponibles ;
- coût de Brouhaha et raison explicative.

`InteractableInstance` représente un objet réellement présent dans une salle :

- identifiant runtime ;
- référence vers la définition ;
- position logique ;
- état courant ;
- blocage du déplacement ;
- blocage de la ligne de vue.

Le contenu de Bastognac place les instances et le moteur calcule leurs conséquences. Le renderer ne décide jamais si une transition est légale.

## Catalogue pilote Bastognac

Le Sprint 3.3 livre cinq familles :

| Objet | États pilotes | Interaction | Brouhaha |
| --- | --- | --- | --- |
| Table bancale | debout, renversée | renverser | 0 |
| Tonneau douteux | intact, brisé | briser | +1 |
| Grille grinçante | fermée, ouverte | ouvrir ou fermer | 0 |
| Torche murale | allumée, éteinte | éteindre ou rallumer | 0 |
| Pilier susceptible | intact, fissuré | fissurer | +1 |

Ces objets n'accordent aucun loot direct.

## Demande d'interaction

Une `InteractableInteractionRequest` contient :

- un identifiant idempotent ;
- le héros demandeur ;
- l'instance ciblée ;
- l'interaction demandée.

La résolution vérifie dans cet ordre :

1. demande non déjà traitée ;
2. salle non terminée ;
3. tour des héros ;
4. héros vivant et actif ;
5. action disponible ;
6. objet et définition présents ;
7. transition valide depuis l'état courant ;
8. distance orthogonale égale à une case ;
9. absence de combattant lorsqu'une transition rend la case bloquante.

Un refus retourne exactement le même `RoomState` et ne consomme aucune action.

## Intégration au Brouhaha

Une transition dont `brouhahaDelta` est non nul produit une demande stable portant l'identifiant `<requestId>-brouhaha`.

Le moteur d'objets ne choisit aucun effet de Brouhaha. Il délègue au moteur livré au Sprint 3.2, puis concatène les événements dans l'ordre causal :

1. demande d'interaction ;
2. changement d'état de l'objet ;
3. succès de l'interaction ;
4. demande de Brouhaha ;
5. changement de niveau ;
6. effets résolus.

## Déplacement, spawn et ligne de vue

Les propriétés calculées de l'instance sont utilisées par les règles communes :

- un objet bloquant interdit le déplacement et l'apparition sur sa case ;
- un objet opaque bloque la ligne de vue ;
- un état ouvert ou brisé peut libérer la case ;
- fermer une grille sur un combattant est refusé.

Les coordonnées restent logiques et indépendantes de la rotation de caméra.

## Interface et renderer

L'application expose les interactions disponibles sous forme de boutons accessibles. Le même contrat est utilisé lorsqu'un joueur sélectionne directement l'objet sur le canvas.

Le renderer :

- dessine une forme de repli distincte pour chaque famille ;
- rend visuellement l'état courant ;
- utilise un asset WebP lorsqu'une variante existe ;
- remonte uniquement l'identifiant de l'instance sélectionnée ;
- expose les diagnostics nécessaires aux tests navigateur.

## Sauvegarde

La salle tactique passe en version 4. La sauvegarde conserve :

- toutes les instances et leurs états ;
- les demandes d'interaction déjà traitées ;
- la prochaine séquence d'interaction ;
- le Brouhaha, les spawns, les héros et les ennemis déjà présents.

Les versions 1, 2 et 3 sont migrées avec un catalogue d'instances vide et une séquence initiale à 1. Une ancienne sauvegarde reste donc lisible sans inventer rétroactivement des objets.

## Frontière avec les phases suivantes

- Sprint 3.4 : poussée, propagation et réactions en chaîne ordonnées ;
- Sprint 3.5 : renforts déclenchés par les seuils du Brouhaha ;
- Sprint 3.6 : retours visuels, audio utile et finition de reprise.

Gargottex reste strictement en lecture seule et n'est pas une dépendance runtime.
