# Réactions en chaîne tactiques

## Statut

- Cible : Sprint 3.4
- État : livré dans `main`
- Issue : #44, clôturée
- Pull Request : #45, fusionnée
- Commit de fusion : `17ad00c0cb5abb9e66da6e320903f56606a8e8d5`

## Objet

Le Sprint 3.4 étend les objets interactifs du Sprint 3.3 avec une propagation déterministe de conséquences. Une interaction directe peut déplacer un objet, changer son état, déclencher d'autres transitions, appliquer des dégâts et produire plusieurs demandes de Brouhaha.

Le moteur reste autoritaire. Le renderer affiche l'état reçu et l'interface propose seulement les commandes calculées par le moteur.

## Modèle de contenu

Une salle tactique `schemaVersion: 4` peut déclarer une liste `chainReactions`.

Chaque réaction possède :

- un identifiant stable ;
- un déclencheur `state-entered` ou `moved` ;
- une ou plusieurs actions exécutées dans l'ordre déclaré.

Actions disponibles :

- `transition` : applique une interaction d'objet sans coût d'action héroïque ;
- `move` : déplace un objet d'une case orthogonale si la destination est libre ;
- `damage` : inflige des dégâts fixes autour d'un objet centre ;
- `brouhaha` : soumet une demande de Brouhaha ordinaire au moteur dédié.

Les références aux instances, interactions et positions sont contrôlées avant le build.

## Poussée directe

Une interaction d'objet peut déclarer :

```json
{
  "movement": { "type": "push", "distance": 1 }
}
```

La direction est calculée avec le vecteur allant du héros vers l'objet. La poussée est refusée sans mutation si la destination :

- sort du plateau ;
- contient un obstacle ;
- contient un combattant vivant ;
- contient une autre instance d'objet.

Le refus ne consomme aucune action et ne marque pas la demande comme traitée.

## Ordre de résolution

La propagation utilise une file FIFO locale à la demande racine.

1. L'interaction héroïque est validée et appliquée atomiquement.
2. Son Brouhaha direct éventuel est résolu.
3. Les déclencheurs racines sont ajoutés à la file dans l'ordre `state-entered`, puis `moved`.
4. Pour chaque déclencheur, les définitions correspondantes sont triées par identifiant.
5. Les actions d'une définition sont exécutées dans l'ordre du contenu.
6. Les nouveaux déclencheurs sont ajoutés à la fin de la file.

À état, contenu et demande identiques, l'état final, les événements, l'historique et les numéros de séquence sont identiques.

## Causalité

Chaque action propagée reçoit un identifiant monotone `reaction-N` et conserve :

- la demande racine ;
- la définition de réaction ;
- le déclencheur et son objet source ;
- la réaction parente éventuelle ;
- l'index et le type de l'action ;
- la cible ;
- le résultat `applied`, `skipped` ou `guarded` ;
- les détails explicatifs.

Les événements de changement d'état et de déplacement distinguent une cause `hero-interaction` d'une cause `chain-reaction`.

## Garde-fous

Une définition ne peut être exécutée qu'une fois dans une propagation racine. Si elle est rencontrée de nouveau, le moteur enregistre `cycle-detected` et n'exécute pas ses actions.

Une propagation est également limitée à 32 définitions exécutées. Le dépassement produit `max-steps` et arrête explicitement la chaîne.

Ces interruptions sont persistées et visibles dans le journal. Elles ne reposent ni sur le temps système, ni sur un UUID, ni sur un hasard implicite.

## Sauvegarde

L'état tactique version 5 ajoute :

- `nextChainReactionSequence` ;
- `chainReactionHistory`.

Les sauvegardes tactiques versions 1 à 4 sont migrées vers la version 5. Elles reçoivent un historique vide et une prochaine séquence égale à 1, sans inventer de conséquences passées.

## Validation livrée

Le scénario pilote table → pilier → grille démontre :

- une poussée ;
- une transition secondaire ;
- des dégâts de zone ;
- l'ouverture d'un passage ;
- deux demandes de Brouhaha causales ;
- une reprise exacte ;
- le même résultat sur Chrome bureau et mobile paysage.

Les cycles, la limite maximale et les destinations bloquées sont également testés.

## Frontière avec le Sprint 3.5

Les réactions peuvent produire du Brouhaha, mais elles ne choisissent aucun renfort.

Le Sprint 3.5 observera chaque changement de niveau accepté, détectera les franchissements montants et produira des `SpawnRequest` ordinaires. La politique détaillée se trouve dans [Renforts déclenchés par le Brouhaha](brouhaha-reinforcements.md).

Le calcul de victoire devra intervenir après les renforts de la résolution courante afin d'éviter une phase `victory` transitoire avant une apparition.

Gargottex reste une source de contenu en lecture seule et n'est pas modifié par cette mécanique.
