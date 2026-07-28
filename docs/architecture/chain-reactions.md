# Réactions en chaîne tactiques

## Statut

- Cible initiale : Sprint 3.4
- État : livré et raccordé au Brouhaha et aux renforts
- Issue initiale : #44, clôturée
- Pull Request initiale : #45, fusionnée
- Extension cible : interactions des acteurs et trois salles du Sprint 4

## Objet

Le moteur propage de façon déterministe les conséquences secondaires d'une interaction : déplacement d'objet, transition, dégâts et demandes de Brouhaha.

Le renderer affiche l'état reçu. L'interface et les profils d'acteurs proposent uniquement des intentions que les moteurs peuvent valider.

## Modèle de contenu

Une salle peut déclarer une liste `chainReactions`.

Chaque réaction possède :

- identifiant stable ;
- déclencheur déclaré ;
- objet ou état source ;
- actions exécutées dans l'ordre ;
- éventuelles conditions ;
- détails explicatifs.

Actions actuelles :

- transition ;
- mouvement ;
- dégâts ;
- Brouhaha.

Les références aux instances, interactions et positions sont contrôlées avant le build.

## Poussée directe

Une interaction peut déclarer un mouvement de poussée. La direction est calculée logiquement depuis l'acteur vers l'objet.

La poussée est refusée sans mutation si la destination sort du plateau ou contient un obstacle, un combattant ou un autre objet.

Au Sprint 4, héros et créatures peuvent produire cette intention si leur définition, compétence ou profil l'autorise. Le moteur de réaction reste identique.

## Ordre de résolution

Une interaction d'objet bruyante résout d'abord sa conséquence directe, puis son Brouhaha direct et les renforts associés. La propagation secondaire commence ensuite.

```text
intention validée
→ conséquence directe de l'objet
→ Brouhaha direct éventuel
→ effets et renforts directs
→ déclencheurs racines
→ file FIFO de réactions
→ actions de réaction
→ Brouhaha secondaire éventuel à sa position causale
→ effets et renforts secondaires
→ nouveaux déclencheurs
→ phase terminale après épuisement de la file
```

La file FIFO locale à la demande racine suit donc :

1. recevoir les déclencheurs après la résolution complète du Brouhaha direct ;
2. trier les définitions correspondantes ;
3. exécuter les actions dans l'ordre du contenu ;
4. résoudre immédiatement toute demande de Brouhaha secondaire et ses renforts à la position causale de l'action ;
5. ajouter les nouveaux déclencheurs à la fin de la file ;
6. calculer la phase terminale après épuisement de la file.

Une apparition produite par le Brouhaha direct peut occuper une case ou modifier une condition avant la première action de réaction. Le Sprint 4 ne doit pas repousser toutes les demandes de Brouhaha après la propagation.

À entrées identiques, état final, événements, historiques et séquences sont identiques.

Une sortie de salle ne peut pas interrompre une propagation. L'objectif local, la complétion et l'ouverture de la sortie ne sont évalués qu'après résolution complète.

## Causalité

Chaque action propagée conserve :

- demande racine ;
- définition de réaction ;
- déclencheur et objet source ;
- réaction parente ;
- index et type de l'action ;
- cible ;
- résultat appliqué, ignoré ou interrompu ;
- détails explicatifs.

La cause racine peut provenir d'un héros, d'une créature, d'une compétence ou d'une interaction de diagnostic. Elle reste typée et traçable.

Une demande de Brouhaha issue d'une réaction conserve son identifiant causal. Les événements de renfort conservent ensuite cette demande comme racine.

## Garde-fous

Une définition ne peut être exécutée qu'une fois dans une propagation racine. Une nouvelle rencontre enregistre un cycle sans rejouer les actions.

La propagation conserve une limite explicite et persistée selon le contrat livré. Les interruptions ne reposent ni sur le temps système, ni sur un UUID, ni sur du hasard.

## Acteurs et profils du Sprint 4

Un profil peut évaluer une réaction connue avant de proposer une intention :

- déclencher une réaction utile ;
- éviter une zone dangereuse ;
- protéger un objet nécessaire à une réaction ;
- déplacer un objet pour ouvrir ou fermer une ligne ;
- empêcher un héros de provoquer une chaîne ;
- accepter un risque selon une priorité déclarée.

Le profil ne simule pas une seconde version de la réaction. Il utilise des informations déclarées et stables pour classer l'intention, puis le moteur applique la conséquence réelle.

La décision doit expliquer pourquoi l'acteur déclenche ou évite la réaction.

## Brouhaha et renforts

Les réactions ne choisissent aucun effet, seuil, archétype ou point de spawn. Elles produisent uniquement des demandes de Brouhaha explicites.

Le Brouhaha direct de l'interaction est résolu avant l'entrée dans la file. Le Brouhaha secondaire d'une action de réaction est résolu à sa place dans la file, avec ses renforts, avant la suite de la propagation.

La phase terminale est évaluée après toutes les actions, demandes de Brouhaha et apparitions de la résolution racine.

Si un renfort empêche une victoire locale, la salle n'est pas marquée terminée et la sortie ne devient pas disponible.

Voir [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

## Portée par salle

Les définitions et historiques de réaction sont locaux à chaque salle.

- la salle 1 utilise des chaînes courtes ;
- la salle 2 fait des réactions un mécanisme principal ;
- la salle 3 combine réactions, profils d'IA, Brouhaha et renforts.

Une transition vers la salle suivante ne propage aucun déclencheur restant et ne transfère aucun historique de réaction.

Une salle restaurée reprend son état stable sans rejouer ses réactions historiques.

## Présentation

Les événements de réaction alimentent le routeur de présentation. Le Sprint 4.0 doit garantir que les conséquences prioritaires tardives, notamment renfort et phase terminale, ne sont pas supprimées par les plafonds de cues.

Le journal visible reste borné. L'historique moteur conserve la preuve complète.

## Sauvegarde

La sauvegarde tactique version 6 conserve la séquence et l'historique causal des réactions.

Dans `ExpeditionState`, chaque salle conserve son propre `RoomState`. Une migration ne doit inventer aucune réaction ni déclencher de file historique.

## Tests cibles

- Brouhaha direct et renforts avant la file ;
- Brouhaha secondaire à la position causale ;
- renfort direct modifiant l'occupation avant une réaction ;
- racines héroïques et ennemies ;
- intention de déclenchement volontaire ;
- intention d'évitement ;
- protection d'un objet ;
- chaînes courtes de salle 1 ;
- chaînes principales de salle 2 ;
- chaînes combinées de salle 3 ;
- renfort empêchant une complétion et une sortie ;
- résolution complète avant transition ;
- reprise sans replay ;
- même décision et même historique à entrées identiques.

## Hors périmètre

- génération de graphes de réaction ;
- transfert d'une réaction entre salles ;
- simulation probabiliste par l'IA ;
- loot ou progression ;
- application d'une conséquence par le renderer ou l'UI.

Gargottex reste une source de contenu en lecture seule.
