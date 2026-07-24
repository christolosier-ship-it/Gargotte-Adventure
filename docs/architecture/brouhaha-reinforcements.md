# Renforts déclenchés par le Brouhaha

## Statut

- Cible : Sprint 3.5
- État : cadré, non implémenté
- Prérequis fusionnés : Sprint 3.1 à 3.4
- Base stable : `17ad00c0cb5abb9e66da6e320903f56606a8e8d5`
- Issue documentaire : #46

## Objectif

Le Sprint 3.5 relie les changements de niveau du Brouhaha au moteur de spawn livré au Sprint 3.1.

Une règle de renfort ne crée jamais directement une créature. Elle observe un franchissement de seuil, produit une `SpawnRequest` explicite, puis laisse le moteur de spawn valider les points, l'occupation, la phase et le mode d'échec.

```text
BrouhahaRequest acceptée
        │
        ▼
ancien niveau → nouveau niveau
        │
        ▼
franchissements montants de seuil
        │
        ▼
règles de renfort triées
        │
        ▼
SpawnRequest déterministes
        │
        ▼
moteur de spawn existant
        │
        ├─ succès total
        ├─ succès partiel
        └─ refus expliqué
```

## Frontières de responsabilité

### Moteur de Brouhaha

Il calcule le niveau, l'effet ou les effets résolus et l'entrée d'historique. Il fournit le niveau précédent, le nouveau niveau et l'identifiant de la demande racine.

### Politique de renfort

Elle décide si un seuil a été franchi, si la règle peut encore s'activer et quelle `SpawnRequest` doit être produite.

Elle ne choisit pas une case libre et ne crée pas d'instance.

### Moteur de spawn

Il reste l'unique autorité pour les apparitions. Il filtre les points candidats dans l'ordre déclaré, applique le mode `all-or-nothing` ou `partial`, crée les identifiants runtime et produit les événements de succès ou de refus.

### Application, UI et renderer

L'application assemble les catalogues et transmet les intentions au moteur. L'UI traduit les événements en messages. Le renderer affiche les nouvelles instances. Aucun de ces composants ne décide qu'un renfort doit apparaître.

## Modèle de contenu prévu

La salle tactique passera de `schemaVersion: 4` à `schemaVersion: 5` et pourra déclarer `brouhahaReinforcements`.

Une règle pilote contient :

```ts
interface BrouhahaReinforcementDefinition {
  id: string;
  threshold: number;
  creatureId: string;
  quantity: number;
  candidateSpawnPointIds: string[];
  failureMode: "all-or-nothing" | "partial";
  maxActivations: number;
}
```

Contraintes de validation du contenu :

- identifiant unique dans la salle ;
- seuil entier compris entre 1 et 12 ;
- quantité et `maxActivations` strictement positives ;
- créature présente dans le catalogue ;
- points candidats référencés par la salle et sans doublon dans la règle ;
- ordre des points conservé tel qu'il est déclaré ;
- aucune règle implicite issue du nom, d'un tag ou de la position.

L'activation, l'occupation et la disponibilité courante des points sont contrôlées au runtime par le moteur de spawn.

Les valeurs pilotes servent à valider le moteur. L'équilibrage final des seuils, quantités et archétypes appartient au Sprint 4.

## Règle de franchissement

Une règle devient éligible uniquement lors d'un franchissement montant :

```text
previousLevel < threshold <= level
```

Conséquences :

- passer de 3 à 4 franchit le seuil 4 ;
- passer de 4 à 6 ne refranchit pas le seuil 4 ;
- passer de 7 à 10 peut franchir plusieurs seuils ;
- une baisse de niveau ne déclenche aucun renfort ;
- après une baisse, une remontée peut déclencher de nouveau une règle tant que `maxActivations` n'est pas atteint ;
- charger une sauvegarde déjà au-dessus d'un seuil ne crée aucun renfort rétroactif.

Les règles franchies par une même demande sont triées par `threshold`, puis par `id`. Elles sont résolues séquentiellement sur l'état produit par la règle précédente.

## Idempotence et identifiants

Chaque activation reçoit un identifiant déterministe dérivé de :

- l'identifiant de la demande de Brouhaha ;
- l'identifiant de la règle ;
- le numéro d'activation de cette règle.

La `SpawnRequest` utilise elle aussi un identifiant dérivé de cette activation et une source :

```ts
{
  type: "brouhaha",
  id: reinforcementDefinition.id
}
```

Une même demande de Brouhaha ne peut donc pas produire deux fois la même activation, y compris après double clic, reprise ou réémission accidentelle.

## Limites de scénario

`maxActivations` limite chaque règle sur l'ensemble de la salle.

Une activation est consommée dès que le seuil est franchi et que la `SpawnRequest` est soumise. Un refus de spawn compte donc comme une activation : bloquer volontairement les points ne permet pas de repousser indéfiniment un renfort prévu.

Le moteur de spawn reste libre de :

- réussir complètement ;
- créer seulement les instances possibles en mode `partial` ;
- refuser sans mutation en mode `all-or-nothing` ;
- refuser une salle terminale.

Le budget de menace n'est ni lu ni dépensé par cette mécanique. Les renforts sont une augmentation runtime explicitement autorisée par le scénario.

## Ordre de résolution d'une action racine

Pour éviter une victoire temporaire suivie d'une réapparition, une action racine doit être finalisée dans cet ordre :

1. valider l'intention initiale ;
2. appliquer ses transitions, déplacements et dégâts ;
3. propager les réactions en chaîne ;
4. résoudre chaque demande de Brouhaha dans son ordre causal ;
5. produire et exécuter les renforts correspondant aux seuils franchis ;
6. calculer la phase terminale sur l'état final ;
7. publier les événements, rendre et sauvegarder.

La victoire n'est acquise que si aucun ennemi vivant ne subsiste après les renforts de la résolution courante.

Une salle déjà en `victory` ou `defeat` refuse toute nouvelle demande de Brouhaha et toute apparition.

## Articulation avec le tour ennemi

Les ennemis créés pendant le tour des héros participent normalement au prochain tour ennemi.

Si une source future déclenche un renfort pendant `enemy-turn`, les nouveaux ennemis ne jouent pas dans la liste d'activation déjà ouverte. Le roster du tour ennemi est figé au début de la phase. Ils agiront au prochain tour ennemi.

Cette règle évite qu'une apparition tardive modifie l'ordre en cours ou agisse immédiatement sans être visible et comprise par le joueur.

## État persistant prévu

La sauvegarde tactique passera de la version 5 à la version 6 et ajoutera :

```ts
interface BrouhahaReinforcementHistoryEntry {
  id: string;
  sequence: number;
  reinforcementDefinitionId: string;
  brouhahaRequestId: string;
  previousLevel: number;
  level: number;
  activation: number;
  spawnRequestId: string;
  result: "succeeded" | "partial" | "rejected";
  createdInstanceIds: string[];
  details: string[];
}
```

`RoomState` conservera :

- `nextBrouhahaReinforcementSequence` ;
- `brouhahaReinforcementHistory`.

Le nombre d'activations d'une règle est déduit de l'historique validé. Les sauvegardes versions 1 à 5 migrent avec un historique vide et une séquence égale à 1.

La migration ne rejoue aucun ancien niveau de Brouhaha et ne produit aucun renfort rétroactif.

## Événements prévus

La couche de renfort produit au minimum :

- `reinforcement-triggered` : seuil franchi et demande créée ;
- `reinforcement-resolved` : succès total, partiel ou refus ;
- les événements `spawn-requested`, `creature-instantiated`, `spawn-succeeded` et `spawn-rejected` déjà fournis par le moteur de spawn.

Chaque événement conserve la demande de Brouhaha racine, la règle, le seuil, le numéro d'activation et l'identifiant de `SpawnRequest`.

## Scénario pilote Bastognac

Le scénario de validation doit rester petit et lisible :

- au moins deux seuils distincts ;
- une règle d'une créature en succès total ;
- une règle de plusieurs créatures en mode `partial` ;
- un plafond d'activation explicite ;
- des points candidats réutilisant les points de spawn déjà présents ;
- des valeurs clairement marquées comme provisoires.

Le scénario doit pouvoir être déclenché par les commandes de Brouhaha existantes et par la chaîne table → pilier → grille du Sprint 3.4. Aucun bouton de spawn manuel ne doit être nécessaire pour démontrer la fonctionnalité automatique.

## Critères de sortie du Sprint 3.5

- un seuil est déclenché uniquement lors d'un franchissement montant ;
- plusieurs seuils franchis par une même demande sont traités dans un ordre stable ;
- `maxActivations` est respecté après sauvegarde et reprise ;
- une même demande ne peut pas produire deux fois le même renfort ;
- succès total, partiel et refus sont expliqués ;
- l'occupation par héros, ennemis, obstacles et objets est respectée par le moteur de spawn ;
- une victoire n'est calculée qu'après les renforts de la résolution courante ;
- un ennemi créé pendant `enemy-turn` n'agit pas dans le roster déjà ouvert ;
- la sauvegarde version 6 restaure exactement l'historique et les compteurs ;
- les migrations versions 1 à 5 ne déclenchent rien rétroactivement ;
- aucun hasard implicite, temps système ou UUID n'intervient ;
- aucune règle métier n'est ajoutée dans l'UI ou le renderer ;
- les tests unitaires et Playwright passent sur Chrome bureau et mobile paysage ;
- Gargottex reste strictement en lecture seule.

## Hors périmètre

- composition de rencontre par budget ;
- vagues complexes ou renforts adaptatifs ;
- sélection pondérée ou aléatoire d'archétypes ;
- équilibrage définitif des créatures ;
- boss, loot et progression ;
- audio et animations de finition ;
- géométrie ou topologie générée.

Ces sujets appartiennent aux Sprints 3.6, 4 ou 5 selon leur nature.
