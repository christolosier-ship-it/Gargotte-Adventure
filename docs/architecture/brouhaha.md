# Architecture du Brouhaha

## Statut

- Cible initiale : Sprint 3.2
- État : livré, étendu par les objets, réactions et renforts
- Issue initiale : #36, clôturée
- Pull Request initiale : #37, fusionnée
- Extension de renforts : issue #48, PR #49
- Extension cible : influences déclaratives des acteurs au Sprint 4

## Responsabilité

Le moteur de Brouhaha transforme une demande explicite en un nouvel état de salle, un historique et des événements explicatifs.

Il calcule le niveau et les effets associés. Il ne choisit pas une interaction d'objet, ne propage pas une réaction, ne crée aucune créature et ne décide pas du comportement d'un acteur.

Après une variation acceptée, une politique séparée peut produire des `SpawnRequest`, toujours exécutées par le moteur de spawn.

## État persistant et portée

`RoomState.brouhaha` contient :

- niveau courant entre 0 et 12 ;
- demandes déjà traitées ;
- prochaine séquence de résolution ;
- historique complet des changements et effets.

Au Sprint 4, chaque salle possède son propre état de Brouhaha. Le niveau, les demandes et l'historique ne sont pas transférés par `ExpeditionState`.

Une nouvelle salle utilise son niveau initial déclaré. Cette décision ne pourra être changée que par une décision produit ultérieure explicite.

## Demande

Une `BrouhahaRequest` contient :

- identifiant idempotent ;
- variation entière non nulle ;
- source typée ;
- raison destinée au journal.

Les sources couvrent combat, objets, explosions, portes, capacités, tours calmes, scénarios et diagnostics.

Les héros et créatures du Sprint 4 ne modifient jamais directement le niveau. Leurs actions ou capacités construisent une demande explicite après validation de l'intention.

## Catalogue d'effets

Un effet possède un identifiant, un nom, une description, une portée universelle ou propre à un donjon, et une plage de niveaux.

Le validateur exige un filet universel suffisant pour résoudre :

- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12.

Les effets peuvent être positifs, négatifs ou neutres selon le contenu validé. Ce cadrage n'ajoute aucun bonus universel arbitraire fondé uniquement sur le niveau.

## Résolution déterministe

La résolution suit cet ordre :

1. refuser une demande dupliquée, invalide ou appliquée à une salle terminée ;
2. borner le niveau entre 0 et 12 ;
3. refuser une demande qui ne change pas le niveau ;
4. filtrer et trier les effets ;
5. sélectionner les effets selon la séquence persistée ;
6. ajouter l'entrée d'historique ;
7. produire les événements ;
8. résoudre les règles de renfort franchies ;
9. retourner l'état enrichi et les événements causaux.

Aucun hasard implicite, temps système ou UUID aléatoire n'est utilisé.

## Franchissements et renforts

Une règle est observée uniquement lors d'un franchissement montant :

```text
previousLevel < threshold <= level
```

Une baisse ne déclenche rien. Plusieurs règles sont traitées par seuil puis identifiant.

Le moteur de Brouhaha ne connaît ni les points candidats ni le mode d'échec. Il transmet la transition à [la politique de renfort](brouhaha-reinforcements.md), qui délègue au spawn.

La migration d'une sauvegarde ne passe jamais par la résolution runtime et ne déclenche aucun seuil rétroactif.

## Les acteurs influencent le Brouhaha

Une définition de héros, créature, compétence ou interaction peut déclarer une variation produite.

Le chemin reste :

```text
intention d'acteur
→ validation par le moteur compétent
→ conséquence directe
→ BrouhahaRequest explicite
→ moteur de Brouhaha
→ effets et renforts
```

Une capacité peut amplifier ou limiter une demande seulement si cette règle est déclarée, déterministe, validée et expliquée.

Les variations liées à une interaction d'objet restent produites après validation de la transition de l'objet.

## Le Brouhaha influence les acteurs

Le Sprint 4 introduit conceptuellement :

```text
BrouhahaInfluence
├─ id
├─ plage ou seuil
├─ acteur ou profil concerné
├─ condition
├─ modification de candidature ou priorité
├─ capacité éventuellement activée
└─ explication
```

Une influence peut modifier :

- actions disponibles ;
- priorité d'action ;
- cible ;
- usage ou évitement du décor ;
- capacité spéciale ;
- positionnement ;
- volonté d'attaquer, fuir, protéger ou déclencher une réaction.

L'influence ne change pas directement une statistique universelle sans contrat explicite. Elle participe à la décision de l'acteur, puis l'intention retenue est résolue par le moteur approprié.

Les influences doivent être :

- déclaratives ;
- validées par schéma ;
- déterministes ;
- testables ;
- expliquées au joueur ;
- locales à la salle courante.

## Intégration aux objets et réactions

Une interaction bruyante soumet sa demande après validation et changement d'état de l'objet.

Une chaîne peut produire plusieurs demandes. Elles sont résolues dans l'ordre causal de la file FIFO. Après chaque demande acceptée, ses renforts sont entièrement résolus avant l'action suivante selon le contrat actuel.

Le Brouhaha ne déclenche aucune réaction d'objet implicite. Chaque conséquence reste déclarée et traçable.

## Événements

Le moteur produit :

- `brouhaha-change-requested` ;
- `brouhaha-level-changed` ;
- `brouhaha-effect-resolved` ;
- `brouhaha-change-rejected`.

La politique de seuil ajoute les événements de renfort et de spawn.

Le Sprint 4.2 devra définir les événements permettant d'expliquer une influence du Brouhaha sur une décision d'acteur. L'UI ne doit pas déduire cette influence à partir du niveau seul.

## Interface et mode diagnostic

Les commandes manuelles actuelles de hausse, baisse ou effet forcé appartiennent au futur mode diagnostic.

Le parcours joueur normal utilise uniquement les demandes produites par les actions, compétences, objets, scénarios et tours.

Le mode diagnostic reste utile aux tests, mais il est identifiable et n'entre pas dans les critères d'expérience joueur.

## Sauvegarde et migrations

La sauvegarde tactique version 6 conserve l'état complet du Brouhaha et l'historique séparé des renforts.

Le Sprint 4 doit :

- conserver un état par salle dans l'enveloppe d'expédition ;
- ne pas recalculer les influences lors d'une migration ;
- ne pas déclencher de capacité ou renfort historique ;
- valider les nouvelles définitions sans inventer de règle par défaut ambiguë.

## Couverture des trois salles

### Salle 1

Brouhaha faible, variations simples et influence limitée sur les comportements.

### Salle 2

Brouhaha central, hausse et réduction, effets positifs, négatifs ou neutres, seuils, renforts complets, partiels ou refusés et influences visibles sur l'IA.

### Salle 3

Brouhaha intense ou évolutif, plusieurs profils influencés, capacités ou priorités modifiées et renforts combinés.

## Tests cibles

- demandes d'acteurs idempotentes ;
- amplification ou limitation déclarée ;
- influence par plage ou seuil ;
- modification des candidats et priorités ;
- même décision et même explication à entrées identiques ;
- Brouhaha indépendant entre les trois salles ;
- reprise exacte sans replay ;
- absence de bonus universel implicite ;
- commandes manuelles absentes du parcours joueur.

## Frontière avec le Sprint 5

Le Sprint 4 peut équilibrer les effets et seuils de ses trois salles après validation produit. Le Sprint 5 composera les populations initiales selon le budget propre à chaque salle.

Le Brouhaha runtime et ses renforts restent distincts de la rencontre initiale générée.

Gargottex reste strictement en lecture seule et n'est pas une dépendance runtime.
