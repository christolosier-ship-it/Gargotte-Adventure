# Architecture du Brouhaha

## Statut

- Cible initiale : Sprint 3.2
- État : livré dans `main`, étendu par les Sprints 3.3 et 3.4
- Issue initiale : #36, clôturée
- Pull Request initiale : #37, fusionnée
- Commit initial : `306cc037a5e64ef948b45d85e92d45e3a9909eb2`
- Prochaine extension : Sprint 3.5, renforts automatiques

## Responsabilité

Le moteur de Brouhaha transforme une demande explicite en un nouvel état de salle, un historique et des événements explicatifs.

Il calcule le niveau et les effets associés. Il ne choisit pas une interaction d'objet, ne propage pas lui-même une réaction en chaîne et ne crée aucune créature directement.

Depuis les Sprints 3.3 et 3.4, les objets et les réactions en chaîne peuvent produire des demandes de Brouhaha ordinaires. Le Sprint 3.5 ajoutera une politique séparée qui observera les franchissements de seuil et produira des `SpawnRequest` exécutées par le moteur de spawn.

## État persistant

`RoomState.brouhaha` contient :

- le niveau courant entre 0 et 12 ;
- les identifiants de demandes déjà traitées ;
- la prochaine séquence de résolution ;
- l'historique complet des changements et effets.

La séquence est sauvegardée afin de conserver le même ordre de résolution après une reprise.

La salle tactique actuelle utilise la version 5. Les données de Brouhaha introduites en version 3 restent incluses dans cet état enrichi.

## Demande

Une `BrouhahaRequest` contient :

- un identifiant idempotent ;
- une variation entière non nulle ;
- une source typée ;
- une raison destinée au journal.

Les sources couvrent le combat, les objets, les explosions, les portes, les capacités, les tours calmes, les scénarios et les tests.

Les objets du Sprint 3.3 et les réactions du Sprint 3.4 construisent des identifiants dérivés de leur demande racine. Une conséquence rejouée ne peut donc pas modifier deux fois le Brouhaha.

## Catalogue d'effets

Un effet possède :

- un identifiant stable ;
- un nom et une description ;
- une portée universelle ou propre à un donjon ;
- une plage de niveaux éligibles.

Le validateur de contenu exige un filet universel suffisant pour résoudre :

- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12.

Les effets propres à Bastognac enrichissent ce filet sans le remplacer.

## Résolution déterministe

La résolution suit cet ordre :

1. refuser une demande dupliquée, invalide ou appliquée à une salle terminée ;
2. borner le niveau entre 0 et 12 ;
3. refuser une demande qui ne change pas le niveau ;
4. filtrer les effets par niveau et portée ;
5. trier les effets par identifiant ;
6. sélectionner un ou deux effets selon la séquence persistée ;
7. ajouter l'entrée d'historique ;
8. produire les événements explicatifs.

Aucun `Math.random()`, temps système ou UUID aléatoire n'est utilisé.

Le résultat expose le niveau précédent et le nouveau niveau. Cette frontière permettra au Sprint 3.5 de détecter les seuils franchis sans relire ou reconstruire l'historique.

## Intégration aux objets et réactions

Une interaction bruyante soumet sa demande après validation et changement d'état de l'objet.

Une chaîne de réactions peut produire plusieurs demandes. Elles sont résolues dans l'ordre causal établi par la file FIFO du moteur de réactions.

Le Brouhaha ne déclenche pas une seconde propagation d'objets de manière implicite. Chaque nouvelle conséquence doit être déclarée et conserver sa cause.

## Événements

Le moteur produit :

- `brouhaha-change-requested` ;
- `brouhaha-level-changed` ;
- `brouhaha-effect-resolved` ;
- `brouhaha-change-rejected`.

L'UI traduit ces événements en phrases, mais ne choisit ni le niveau ni les effets.

Le Sprint 3.5 ajoutera des événements de renfort portant la demande de Brouhaha racine, la règle franchie et la `SpawnRequest` produite.

## Sauvegarde et migrations

Le Brouhaha a été introduit dans la sauvegarde tactique version 3. La salle actuelle est en version 5 et conserve :

- le niveau ;
- les demandes traitées ;
- la séquence ;
- l'historique ;
- les objets et leurs interactions ;
- l'historique des réactions en chaîne.

Les sauvegardes versions 1 et 2 migrent vers un Brouhaha initial à zéro. Les migrations suivantes préservent son état exact.

Le Sprint 3.5 prévoit une version 6 pour l'historique des renforts. Une migration ne doit jamais interpréter un ancien niveau comme un nouveau franchissement de seuil.

## Interface pilote

La salle Bastognac propose quatre commandes accessibles de démonstration :

- combat engagé : +1 ;
- objet cassé : +1 ;
- explosion : +2 ;
- tour calme : -2.

Les objets et réactions en chaîne sont désormais réellement connectés au Brouhaha. Les commandes restent utiles pour tester directement les variations et les futurs franchissements de seuil.

## Frontière avec le Sprint 3.5

Le lien automatique est documenté dans [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

Principes verrouillés :

- seul un franchissement montant `previousLevel < threshold <= level` déclenche une règle ;
- plusieurs seuils sont traités dans un ordre stable ;
- la règle produit une `SpawnRequest`, elle ne choisit aucune case ;
- les limites d'activation sont persistées ;
- aucune apparition rétroactive n'est produite lors d'une reprise ou migration ;
- la victoire est calculée après les renforts de la résolution courante.

## Frontières ultérieures

- Sprint 3.6 : présentation visuelle et sonore des conséquences ;
- Sprint 4 : équilibrage des seuils, quantités et archétypes pilotes ;
- Sprint 5 : composition de la population initiale selon le budget propre à chaque salle.

Gargottex reste strictement en lecture seule et n'est pas une dépendance runtime.
