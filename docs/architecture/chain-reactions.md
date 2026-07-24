# Réactions en chaîne tactiques

## Statut

- Cible initiale : Sprint 3.4
- État : livré, raccordé aux renforts du Sprint 3.5
- Issue initiale : #44, clôturée
- Pull Request initiale : #45, fusionnée
- Commit initial : `17ad00c0cb5abb9e66da6e320903f56606a8e8d5`

## Objet

Le moteur propage de façon déterministe les conséquences d'une interaction : déplacement d'objet, transition, dégâts et demandes de Brouhaha.

Le renderer affiche l'état reçu. L'interface propose uniquement les commandes calculées par le moteur.

## Modèle de contenu

Une salle tactique `schemaVersion: 5` peut déclarer une liste `chainReactions`.

Chaque réaction possède un identifiant stable, un déclencheur `state-entered` ou `moved`, et une ou plusieurs actions exécutées dans l'ordre déclaré.

Actions disponibles :

- `transition` ;
- `move` ;
- `damage` ;
- `brouhaha`.

Les références aux instances, interactions et positions sont contrôlées avant le build.

## Poussée directe

Une interaction peut déclarer :

```json
{
  "movement": { "type": "push", "distance": 1 }
}
```

La direction est calculée du héros vers l'objet. La poussée est refusée sans mutation si la destination sort du plateau ou contient un obstacle, un combattant ou un autre objet.

Le refus ne consomme aucune action et ne marque pas la demande comme traitée.

## Ordre de résolution

La propagation utilise une file FIFO locale à la demande racine :

1. interaction héroïque validée et appliquée ;
2. Brouhaha direct éventuel et ses renforts ;
3. déclencheurs racines `state-entered`, puis `moved` ;
4. définitions correspondantes triées par identifiant ;
5. actions exécutées dans l'ordre du contenu ;
6. Brouhaha secondaire et renforts résolus immédiatement ;
7. nouveaux déclencheurs ajoutés à la fin de la file ;
8. phase terminale calculée après épuisement de la file.

À entrées identiques, état final, événements, historiques et séquences sont identiques.

## Causalité

Chaque action propagée reçoit un identifiant monotone `reaction-N` et conserve :

- demande racine ;
- définition de réaction ;
- déclencheur et objet source ;
- réaction parente ;
- index et type de l'action ;
- cible ;
- résultat `applied`, `skipped` ou `guarded` ;
- détails explicatifs.

Les événements distinguent une cause `hero-interaction` d'une cause `chain-reaction`.

Une demande de Brouhaha issue d'une réaction conserve son identifiant causal. Les événements de renfort conservent ensuite cette demande comme racine.

## Garde-fous

Une définition ne peut être exécutée qu'une fois dans une propagation racine. Une nouvelle rencontre enregistre `cycle-detected` sans rejouer ses actions.

La propagation est limitée à 32 définitions. Le dépassement produit `max-steps` et arrête explicitement la chaîne.

Ces interruptions sont persistées et ne reposent ni sur le temps système, ni sur un UUID, ni sur du hasard.

## Phase terminale et renforts

Depuis le Sprint 3.5, les dégâts de réaction ne calculent plus immédiatement la victoire.

La phase terminale est évaluée après toutes les actions, demandes de Brouhaha et apparitions de la résolution racine. Si le dernier ennemi initial est vaincu mais qu'un seuil fait entrer un renfort, la salle reste active.

Les réactions ne choisissent aucun seuil, aucune créature et aucun point. Elles produisent uniquement une demande de Brouhaha ordinaire.

Voir [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

## Sauvegarde

La version 5 a introduit :

- `nextChainReactionSequence` ;
- `chainReactionHistory`.

La sauvegarde courante est la version 6. Elle conserve ces champs sans modification et ajoute séparément l'historique des renforts.

Les versions 1 à 5 migrent sans inventer de réactions ni déclencher d'apparitions rétroactives.

## Validation livrée

Le scénario table → pilier → grille démontre :

- poussée ;
- transition secondaire ;
- dégâts de zone ;
- ouverture d'un passage ;
- deux demandes de Brouhaha ;
- renfort total puis partiel ;
- phase terminale calculée à la fin ;
- reprise exacte ;
- même résultat sur Chrome bureau et mobile paysage.

Cycles, profondeur maximale, destinations bloquées et scénario où un renfort empêche une victoire prématurée sont également testés.

Gargottex reste une source de contenu en lecture seule et n'est pas modifié par cette mécanique.
