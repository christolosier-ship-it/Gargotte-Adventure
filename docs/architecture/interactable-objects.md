# Architecture des objets interactifs

## Statut

- Cible initiale : Sprint 3.3, livré
- Extension Sprint 3.4 : livrée
- Issue initiale : #42, clôturée
- Pull Request initiale : #43, fusionnée
- Réactions en chaîne : [architecture dédiée](chain-reactions.md)
- Prochaine intégration : [renforts de Brouhaha](brouhaha-reinforcements.md)

## Responsabilité

Le moteur d'objets transforme une demande explicite d'un héros actif en une transition d'état du décor, une consommation d'action, des événements explicatifs et, lorsque l'interaction est bruyante, une demande de Brouhaha.

Le Sprint 3.4 étend cette frontière avec la poussée d'objets et l'émission de déclencheurs vers un moteur de propagation séparé. Les dégâts de zone, transitions secondaires et demandes de Brouhaha propagées restent résolus hors de l'interface et du renderer.

Le loot et les renforts automatiques restent exclus de cette responsabilité. Les renforts appartiennent au Sprint 3.5 et consomment les changements de Brouhaha, jamais les objets directement.

## Séparation définition et instance

`InteractableDefinition` décrit un archétype éditorial stable :

- identité, nom et famille ;
- états autorisés ;
- propriétés de blocage par état ;
- transitions disponibles ;
- coût de Brouhaha et raison explicative ;
- mouvement direct optionnel de type poussée.

`InteractableInstance` représente un objet réellement présent dans une salle :

- identifiant runtime ;
- référence vers la définition ;
- position logique ;
- état courant ;
- blocage du déplacement ;
- blocage de la ligne de vue.

Le contenu de Bastognac place les instances et le moteur calcule leurs conséquences. Le renderer ne décide jamais si une transition est légale.

## Catalogue pilote Bastognac

Les Sprints 3.3 et 3.4 livrent cinq familles :

| Objet              | États pilotes     | Interaction          | Brouhaha |
| ------------------ | ----------------- | -------------------- | -------- |
| Table bancale      | debout, renversée | pousser et renverser | 0        |
| Tonneau douteux    | intact, brisé     | briser               | +1       |
| Grille grinçante   | fermée, ouverte   | ouvrir ou fermer     | 0        |
| Torche murale      | allumée, éteinte  | éteindre ou rallumer | 0        |
| Pilier susceptible | intact, fissuré   | fissurer             | +1       |

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
9. destination de poussée dans le plateau et libre ;
10. absence de combattant lorsqu'une transition rend la case bloquante.

Un refus retourne exactement le même `RoomState` et ne consomme aucune action.

## Intégration au Brouhaha

Une transition dont `brouhahaDelta` est non nul produit une demande stable portant l'identifiant `<requestId>-brouhaha`.

Le moteur d'objets ne choisit aucun effet de Brouhaha. Il délègue au moteur dédié, puis concatène les événements dans l'ordre causal :

1. demande d'interaction ;
2. déplacement éventuel de l'objet ;
3. changement d'état de l'objet ;
4. succès de l'interaction ;
5. demande de Brouhaha directe ;
6. propagation des réactions secondaires.

Chaque demande de Brouhaha secondaire est soumise au même moteur et conserve son propre identifiant séquentiel.

Au Sprint 3.5, les franchissements de seuil seront observés après chaque demande acceptée. L'objet ne référencera aucune règle de renfort.

## Déplacement, spawn et ligne de vue

Les propriétés calculées de l'instance sont utilisées par les règles communes :

- un objet bloquant interdit le déplacement et l'apparition sur sa case ;
- un objet opaque bloque la ligne de vue ;
- un état ouvert ou brisé peut libérer la case ;
- fermer une grille sur un combattant est refusé ;
- pousser un objet sur un obstacle, un combattant ou un autre objet est refusé.

Les coordonnées restent logiques et indépendantes de la rotation de caméra.

## Interface et renderer

L'application expose les interactions disponibles sous forme de boutons accessibles. Le même contrat est utilisé lorsqu'un joueur sélectionne directement l'objet sur le canvas.

Le renderer :

- dessine une forme de repli distincte pour chaque famille ;
- rend visuellement l'état courant et la position calculée ;
- utilise un asset WebP lorsqu'une variante existe ;
- remonte uniquement l'identifiant de l'instance sélectionnée ;
- expose les diagnostics nécessaires aux tests navigateur.

## Sauvegarde

Le Sprint 3.3 a introduit la salle tactique version 4. Le Sprint 3.4 passe l'état à la version 5 pour conserver en plus :

- la prochaine séquence de réaction ;
- l'historique causal complet ;
- les résultats appliqués, ignorés ou interrompus par un garde-fou.

Les versions 1 à 4 sont migrées avec un historique vide et une séquence initiale à 1. Une ancienne sauvegarde reste donc lisible sans inventer rétroactivement des réactions.

Le Sprint 3.5 ajoutera l'historique des renforts dans une version 6, sans modifier la structure des instances d'objets.

## Frontière avec les phases suivantes

- Sprint 3.4 : poussée, propagation et réactions en chaîne ordonnées, livré ;
- Sprint 3.5 : renforts déclenchés par les seuils du Brouhaha, cadré ;
- Sprint 3.6 : retours visuels, audio utile et finition de reprise.

Gargottex reste strictement en lecture seule et n'est pas une dépendance runtime.
