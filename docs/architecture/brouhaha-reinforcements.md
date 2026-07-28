# Renforts déclenchés par le Brouhaha

## Statut

- Sprint initial : 3.5
- État fonctionnel : implémenté dans `main`
- Issue : #48
- Pull Request initiale : #49
- Correctifs roster : PR #53, #54 et #56
- Extension cible : trois salles du Sprint 4

## Objet

La politique de renfort relie les changements de niveau du Brouhaha au moteur de spawn déterministe.

Une règle ne crée jamais directement une créature. Elle observe un franchissement de seuil, produit une `SpawnRequest` explicite, puis laisse le moteur de spawn valider les points, l'occupation, la phase et le mode d'échec.

```text
BrouhahaRequest acceptée
→ ancien et nouveau niveau
→ seuils franchis triés
→ activations déterministes
→ SpawnRequest explicites
→ moteur de spawn
→ succès total, partiel ou refusé
```

## Frontières

### Moteur de Brouhaha

Calcule le niveau, résout les effets et conserve son historique. Il transmet la transition acceptée à la politique de renfort.

### Politique de renfort

- détecte les seuils franchis à la hausse ;
- trie les règles ;
- contrôle `maxActivations` ;
- crée des identifiants reproductibles ;
- délègue au moteur de spawn ;
- historise le résultat.

Elle ne choisit aucune case et ne construit aucune instance.

### Moteur de spawn

Reste l'unique autorité pour les points, l'occupation, les modes total ou partiel et les identifiants runtime.

### Acteurs du Sprint 4

Les héros, créatures, capacités et profils peuvent produire des actions qui modifient le Brouhaha. Ils ne déclenchent pas directement une règle de renfort et ne créent aucune instance.

### Application et adaptateurs

L'application transmet le catalogue et les règles. L'UI explique. Le renderer et l'audio présentent. Aucun adaptateur ne décide d'un seuil ou d'une apparition.

## Modèle de contenu

Une règle de salle contient conceptuellement :

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

Le schéma contrôle identifiants, seuil, quantité, limite, créature, points et ordre éditorial.

Les seuils, quantités et archétypes définitifs ne sont pas fixés par ce cadrage. Ils seront équilibrés dans les lots fonctionnels du Sprint 4.

## Franchissement et ordre

Une règle est éligible uniquement lorsque :

```text
previousLevel < threshold <= level
```

Une baisse ne déclenche rien. Une remontée peut réactiver une règle si sa limite le permet. Charger une sauvegarde déjà au-dessus d'un seuil ne produit aucun effet rétroactif.

Les règles sont triées par seuil puis identifiant et résolues séquentiellement.

## Idempotence et limites

L'identifiant d'activation dérive de la demande de Brouhaha, de la règle et du numéro d'activation. La demande de spawn dérive de cette activation.

Une activation est consommée dès que la demande de spawn est soumise, y compris lorsque tous les points sont bloqués. Une même demande de Brouhaha ne peut pas créer deux fois le même renfort.

## Résolution terminale et sortie de salle

La phase terminale locale est évaluée après les réactions, demandes de Brouhaha et renforts de la résolution racine.

Une condition d'objectif atteinte ne rend pas la sortie disponible tant que les renforts éventuels ne sont pas entièrement résolus.

Si un renfort vivant empêche la condition locale, la sortie reste fermée.

Le Sprint 4.0 doit corriger la présentation des transitions terminales réelles et garantir que les cues de renfort ou de fin prioritaires ne sont pas supprimés par les plafonds.

## Tour ennemi

Le roster du tour ennemi est figé au début de la phase. Un renfort apparu après son ouverture agit au tour ennemi suivant.

Les profils d'IA du Sprint 4 s'appliquent aux créatures nouvellement instanciées dès qu'elles deviennent éligibles à une phase ultérieure. Ils ne modifient pas le roster déjà ouvert.

## Portée par salle

Chaque salle possède :

- ses règles de renfort ;
- ses points candidats ;
- ses limites d'activation ;
- son historique ;
- son Brouhaha.

Aucune activation ou séquence n'est partagée entre les salles.

### Salle 1

Renforts absents ou légers. Aucun succès partiel ou refus n'est requis.

### Salle 2

Renforts complets, au moins un succès partiel et un refus expliqué.

### Salle 3

Renforts complets combinés avec Brouhaha intense, profils d'IA et condition finale.

## Relation avec le budget de menace

Le budget de menace reste propre à chaque salle, mais la politique de renfort ne le lit ni ne le dépense.

Au Sprint 4, les populations et renforts sont écrits à la main. Au Sprint 5, la population initiale pourra être composée selon le budget de salle, tandis que les renforts resteront une augmentation runtime explicitement autorisée.

## Persistance

La sauvegarde tactique version 6 conserve séquence, historique de renfort et roster ennemi.

Dans le micro-donjon, chaque `RoomState` conserve ses propres activations. Une transition ou une reprise ne rejoue aucun seuil historique.

Une migration d'expédition ne doit pas :

- fusionner les historiques de salles ;
- recalculer une limite d'activation depuis un autre état ;
- créer un renfort rétroactif ;
- modifier le Brouhaha local.

## Événements et présentation

La couche produit les événements de déclenchement, les événements ordinaires du spawn et le résultat du renfort.

Chaque événement conserve demande racine, règle, seuil, activation et demande de spawn. Le journal distingue réussite totale, partielle et refus.

Le Sprint 4.0 doit préserver ces conséquences lorsque les sorties de présentation sont plafonnées.

## Tests cibles du Sprint 4

- règles indépendantes dans les trois salles ;
- succès total en salle 2 et 3 ;
- succès partiel et refus en salle 2 ;
- limites persistantes ;
- renfort tardif reporté au tour suivant ;
- objectif local empêché par un renfort ;
- transition seulement après résolution complète ;
- reprise sans replay ;
- interaction d'un profil avec le Brouhaha sans spawn direct ;
- même résultat à entrées identiques.

## Hors périmètre du Sprint 4

- composition automatique des rencontres ;
- vagues adaptatives générées ;
- dépense du budget de menace ;
- transfert de renforts entre salles ;
- boss final, loot ou progression ;
- génération de topologie ou géométrie.
