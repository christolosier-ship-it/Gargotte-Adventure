# Renforts déclenchés par le Brouhaha

## Statut

- Sprint : 3.5
- État : implémenté sur la branche de livraison
- Issue : #48
- Pull Request : #49
- Base documentaire : `66f2d30543c77327c86c460d8be874254719ecd0`

## Objet

Le Sprint 3.5 relie les changements de niveau du Brouhaha au moteur de spawn déterministe livré au Sprint 3.1.

Une règle de renfort ne crée jamais directement une créature. Elle observe un franchissement de seuil, produit une `SpawnRequest` explicite, puis laisse le moteur de spawn valider les points, l'occupation, la phase et le mode d'échec.

```text
BrouhahaRequest acceptée
        │
        ▼
ancien niveau → nouveau niveau
        │
        ▼
franchissements montants triés
        │
        ▼
activations déterministes
        │
        ▼
SpawnRequest explicites
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

Il calcule le nouveau niveau, résout les effets et conserve son historique. Après une variation acceptée, il transmet le niveau précédent, le nouveau niveau et l'identifiant de la demande racine à la politique de renfort.

### Politique de renfort

`resolveBrouhahaReinforcements` :

- détecte les seuils franchis à la hausse ;
- trie les règles par seuil puis identifiant ;
- contrôle `maxActivations` à partir de l'historique persistant ;
- crée des identifiants d'activation et de demande reproductibles ;
- délègue chaque apparition au moteur de spawn ;
- historise succès total, succès partiel ou refus.

Elle ne choisit jamais une case libre et ne construit aucune instance de créature.

### Moteur de spawn

`spawnCreatures` reste l'unique autorité pour :

- filtrer les points candidats dans leur ordre déclaré ;
- contrôler limites, obstacles, héros, ennemis et objets ;
- appliquer `all-or-nothing` ou `partial` ;
- créer les identifiants runtime ;
- expliquer chaque succès ou refus.

### Application, UI et renderer

L'application transmet le catalogue de créatures et les règles de salle. L'UI traduit les événements en messages. Le renderer affiche l'état et expose uniquement des diagnostics de test. Aucun de ces composants ne décide qu'un seuil doit produire un renfort.

## Modèle de contenu

La salle tactique utilise `schemaVersion: 5` et peut déclarer :

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

Le schéma et le validateur contrôlent :

- identifiants uniques dans la salle ;
- seuil entier de 1 à 12 ;
- quantité et limite strictement positives ;
- créature présente dans le catalogue ;
- points candidats présents et non dupliqués ;
- conservation de l'ordre éditorial des points.

L'équilibrage final des seuils, quantités et archétypes reste réservé au Sprint 4.

## Franchissement et ordre

Une règle est éligible uniquement lorsque :

```text
previousLevel < threshold <= level
```

Une baisse ne déclenche rien. Une remontée peut réactiver une règle tant que sa limite n'est pas atteinte. Charger une sauvegarde déjà au-dessus d'un seuil ne produit aucun effet rétroactif.

Les règles franchies par une même demande sont triées par `threshold`, puis par `id`, et résolues séquentiellement sur l'état produit par la règle précédente.

## Idempotence et limites

Une activation utilise l'identifiant :

```text
reinforcement-{brouhahaRequestId}-{definitionId}-{activation}
```

La demande de spawn ajoute le suffixe `-spawn`. La source transmise au moteur est `{ type: "brouhaha", id: definition.id }`.

Le numéro d'activation est déduit de l'historique de la règle. Une activation est consommée dès que la demande de spawn est soumise, y compris lorsque tous les points sont bloqués. Une même demande de Brouhaha est elle-même idempotente et ne peut donc pas créer deux fois le même renfort.

## Résolution terminale

Les dégâts de réaction ne calculent plus immédiatement la victoire. La phase terminale est évaluée après toute la file de réactions, les demandes de Brouhaha et les renforts de la résolution racine.

```text
intention → transitions/dégâts → réactions → Brouhaha → renforts → phase terminale
```

La victoire n'est acquise que si aucun ennemi vivant ne subsiste après les apparitions de cette résolution. Une salle déjà terminale refuse toujours Brouhaha et spawn.

## Tour ennemi

`createEnemyTurnRoster` capture les identifiants des ennemis vivants au début de la phase. `runEnemyTurn` exécute uniquement cette liste.

Un ennemi ajouté après l'ouverture du roster ne joue donc pas pendant le tour en cours. Il participe au prochain tour ennemi.

## Persistance

La sauvegarde tactique utilise la version 6 et conserve :

```ts
interface BrouhahaReinforcementHistoryEntry {
  id: string;
  sequence: number;
  reinforcementDefinitionId: string;
  brouhahaRequestId: string;
  previousLevel: number;
  level: number;
  threshold: number;
  activation: number;
  spawnRequestId: string;
  result: "succeeded" | "partial" | "rejected";
  createdInstanceIds: string[];
  details: string[];
}
```

`RoomState` ajoute `nextBrouhahaReinforcementSequence` et `brouhahaReinforcementHistory`.

Les sauvegardes versions 1 à 5 migrent vers la version 6 avec une séquence égale à 1 et un historique vide. La migration ne rejoue aucun ancien niveau de Brouhaha.

Le validateur rejette notamment :

- identifiants ou séquences dupliqués ;
- couples règle/activation dupliqués ;
- demandes de spawn dupliquées ;
- prochaine séquence située avant l'historique ;
- résultat refusé contenant des instances créées ;
- succès sans instance créée.

## Événements

La couche produit :

- `reinforcement-triggered` ;
- les événements existants du moteur de spawn ;
- `reinforcement-resolved`.

Chaque événement conserve la demande de Brouhaha racine, la règle, le seuil, l'activation et la demande de spawn. Le journal distingue renfort réussi, partiel ou refusé.

## Scénario pilote Bastognac

La salle de contrôle contient deux règles provisoires :

- `seuil-1-bricoleur` : seuil 1, un Gobelin Bricoleur, mode total, deux activations maximum ;
- `seuil-2-lance-tout` : seuil 2, deux Gobelins Lance-Tout, mode partiel, une activation maximum.

Briser le tonneau démontre le premier seuil. La chaîne table → pilier → grille franchit les deux seuils : le premier renfort occupe le point haut, puis le second ne peut créer qu'une instance sur le point bas et produit un résultat partiel expliqué.

## Garanties couvertes

Les tests vérifient :

- franchissement montant uniquement ;
- ordre stable de plusieurs seuils ;
- idempotence ;
- réactivation après baisse ;
- limite persistante et activation refusée consommée ;
- succès total, partiel et refus ;
- phase terminale après renforts ;
- roster ennemi figé ;
- sauvegarde exacte et migrations versions 1 à 5 ;
- scénario naturel et reprise sur Chrome bureau et mobile paysage.

## Hors périmètre

- composition de rencontre par budget ;
- vagues adaptatives ou pondérées ;
- équilibrage définitif ;
- boss, loot et progression ;
- animations et audio de finition ;
- génération de géométrie ou de topologie.
