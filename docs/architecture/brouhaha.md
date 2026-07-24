# Architecture du Brouhaha

## Statut

- Cible initiale : Sprint 3.2
- État : livré, étendu par les Sprints 3.3 à 3.5
- Issue initiale : #36, clôturée
- Pull Request initiale : #37, fusionnée
- Commit initial : `306cc037a5e64ef948b45d85e92d45e3a9909eb2`
- Extension de renforts : issue #48, PR #49

## Responsabilité

Le moteur de Brouhaha transforme une demande explicite en un nouvel état de salle, un historique et des événements explicatifs.

Il calcule le niveau et les effets associés. Il ne choisit pas une interaction d'objet, ne propage pas une réaction et ne crée aucune créature directement.

Depuis le Sprint 3.5, chaque changement accepté transmet son niveau précédent et son nouveau niveau à une politique séparée de renfort. Cette politique peut produire des `SpawnRequest`, toujours exécutées par le moteur de spawn.

## État persistant

`RoomState.brouhaha` contient :

- le niveau courant entre 0 et 12 ;
- les identifiants de demandes déjà traitées ;
- la prochaine séquence de résolution ;
- l'historique complet des changements et effets.

La séquence est sauvegardée afin de conserver le même ordre de résolution après une reprise. La salle tactique utilise désormais la version 6, qui ajoute séparément l'historique des renforts.

## Demande

Une `BrouhahaRequest` contient :

- un identifiant idempotent ;
- une variation entière non nulle ;
- une source typée ;
- une raison destinée au journal.

Les sources couvrent combat, objets, explosions, portes, capacités, tours calmes, scénarios et tests.

Les objets et réactions construisent des identifiants dérivés de leur demande racine. Une conséquence rejouée ne peut donc pas modifier deux fois le Brouhaha ni reproduire les mêmes renforts.

## Catalogue d'effets

Un effet possède un identifiant, un nom, une description, une portée universelle ou propre à un donjon, et une plage de niveaux.

Le validateur exige un filet universel suffisant pour résoudre :

- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12.

Les effets propres à Bastognac enrichissent ce filet sans le remplacer.

## Résolution déterministe

La résolution suit cet ordre :

1. refuser une demande dupliquée, invalide ou appliquée à une salle terminée ;
2. borner le niveau entre 0 et 12 ;
3. refuser une demande qui ne change pas le niveau ;
4. filtrer et trier les effets ;
5. sélectionner un ou deux effets selon la séquence persistée ;
6. ajouter l'entrée d'historique ;
7. produire les événements de Brouhaha ;
8. résoudre les règles de renfort franchies ;
9. retourner l'état enrichi et tous les événements causaux.

Aucun `Math.random()`, temps système ou UUID aléatoire n'est utilisé.

## Franchissements et renforts

Une règle est observée uniquement lors d'un franchissement montant :

```text
previousLevel < threshold <= level
```

Une baisse ne déclenche rien. Plusieurs règles franchies par la même demande sont traitées par seuil puis identifiant.

Le moteur de Brouhaha ne connaît ni les points candidats ni le mode d'échec. Il transmet la transition à [la politique de renfort](brouhaha-reinforcements.md), qui délègue ensuite au spawn.

La migration d'une sauvegarde ne passe jamais par `changeBrouhaha`. Aucun niveau historique n'est donc réinterprété comme un nouveau seuil.

## Intégration aux objets et réactions

Une interaction bruyante soumet sa demande après validation et changement d'état de l'objet.

Une chaîne de réactions peut produire plusieurs demandes. Elles sont résolues dans l'ordre causal de la file FIFO. Après chaque demande acceptée, ses éventuels renforts sont entièrement résolus avant l'action suivante.

Le Brouhaha ne déclenche aucune nouvelle réaction d'objet implicite. Chaque conséquence reste déclarée et traçable.

## Événements

Le moteur produit :

- `brouhaha-change-requested` ;
- `brouhaha-level-changed` ;
- `brouhaha-effect-resolved` ;
- `brouhaha-change-rejected`.

La politique de seuil ajoute :

- `reinforcement-triggered` ;
- les événements ordinaires du moteur de spawn ;
- `reinforcement-resolved`.

L'UI traduit ces événements en phrases sans choisir niveau, effets, seuils ou points.

## Sauvegarde et migrations

Le Brouhaha a été introduit en version 3. La sauvegarde version 6 conserve :

- le niveau, les demandes traitées, la séquence et l'historique du Brouhaha ;
- les objets et réactions ;
- les séquences de spawn ;
- la prochaine séquence de renfort ;
- l'historique des activations, résultats et instances créées.

Les versions 1 et 2 migrent vers un Brouhaha à zéro. Les versions suivantes préservent son état exact. Les versions 1 à 5 reçoivent un historique de renfort vide et une séquence à 1, sans apparition rétroactive.

## Interface pilote

La salle Bastognac propose quatre commandes accessibles de démonstration :

- combat engagé : +1 ;
- objet cassé : +1 ;
- explosion : +2 ;
- tour calme : -2.

Les objets et réactions produisent également de vraies demandes. Briser le tonneau franchit le premier seuil ; la chaîne table → pilier → grille franchit les deux seuils pilotes.

## Frontières ultérieures

- Sprint 3.6 : présentation visuelle et sonore des conséquences ;
- Sprint 4 : équilibrage des seuils, quantités et archétypes ;
- Sprint 5 : composition de la population initiale selon le budget propre à chaque salle.

Gargottex reste strictement en lecture seule et n'est pas une dépendance runtime.
