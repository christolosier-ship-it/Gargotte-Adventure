# Architecture du Brouhaha

## Statut

- Cible : Sprint 3.2
- État : livré dans `main`
- Issue : #36, clôturée
- Pull Request : #37, fusionnée
- Commit de fusion : `306cc037a5e64ef948b45d85e92d45e3a9909eb2`

## Responsabilité

Le moteur de Brouhaha transforme une demande explicite en un nouvel état de salle, un historique et des événements explicatifs.

Il ne déclenche pas encore de renfort, n'applique pas de conséquences tactiques définitives et ne décide rien dans l'interface ou le renderer.

## État persistant

`RoomState.brouhaha` contient :

- le niveau courant entre 0 et 12 ;
- les identifiants de demandes déjà traitées ;
- la prochaine séquence de résolution ;
- l'historique complet des changements et effets.

La séquence est sauvegardée afin de conserver le même ordre de résolution après une reprise.

## Demande

Une `BrouhahaRequest` contient :

- un identifiant idempotent ;
- une variation entière non nulle ;
- une source typée ;
- une raison destinée au journal.

Les sources prévues couvrent le combat, les objets, les explosions, les portes, les capacités, les tours calmes, les scénarios et les tests.

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

## Événements

Le moteur produit :

- `brouhaha-change-requested` ;
- `brouhaha-level-changed` ;
- `brouhaha-effect-resolved` ;
- `brouhaha-change-rejected`.

L'UI traduit ces événements en phrases, mais ne choisit ni le niveau ni les effets.

## Sauvegarde

La salle tactique utilise la version 3.

La sauvegarde conserve le niveau, les demandes traitées, la séquence et l'historique. Les versions 1 et 2 sont migrées vers un Brouhaha initial à zéro.

## Interface pilote

La salle Bastognac propose quatre commandes accessibles de démonstration :

- combat engagé : +1 ;
- objet cassé : +1 ;
- explosion : +2 ;
- tour calme : -2.

Ces commandes simulent les futures sources. Elles ne sont pas encore branchées automatiquement aux combats ou objets.

## Frontière avec les phases suivantes

- Sprint 3.3 : les objets interactifs produiront des demandes de Brouhaha ;
- Sprint 3.4 : les réactions en chaîne pourront produire plusieurs demandes ordonnées ;
- Sprint 3.5 : certains seuils produiront des `SpawnRequest` via le moteur livré au Sprint 3.1 ;
- Sprint 3.6 : la présentation visuelle et sonore sera finalisée.
