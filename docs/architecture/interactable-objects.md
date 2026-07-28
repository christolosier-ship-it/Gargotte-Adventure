# Architecture des objets interactifs

## Statut

- Cible initiale : Sprint 3.3, livré
- Réactions en chaîne : Sprint 3.4, livré
- Renforts de Brouhaha : Sprint 3.5, livré
- Extension cible : héros, créatures et profils du Sprint 4

## Responsabilité

Le moteur d'objets transforme une intention explicite en transition de décor, consommation de ressource, événements et, lorsque l'interaction est bruyante, demande de Brouhaha.

La poussée et la propagation restent dans les systèmes tactiques dédiés. Les renforts ne sont jamais référencés directement par un objet.

Les acteurs du Sprint 4 ne doivent pas appliquer les conséquences d'un objet. Ils produisent une intention qui reste résolue par les moteurs existants.

## Séparation définition et instance

`InteractableDefinition` décrit une famille, ses états, blocages, transitions, coûts, acteurs autorisés et mouvement direct optionnel.

`InteractableInstance` représente un objet présent : identifiant runtime, référence, position, état courant et propriétés de blocage calculées.

Le contenu place les instances. Le moteur calcule leurs conséquences. Le renderer ne décide jamais si une transition est légale.

## Catalogue pilote Bastognac

| Objet              | États pilotes     | Interaction          | Brouhaha |
| ------------------ | ----------------- | -------------------- | -------- |
| Table bancale      | debout, renversée | pousser et renverser | 0        |
| Tonneau douteux    | intact, brisé     | briser               | +1       |
| Grille grinçante   | fermée, ouverte   | ouvrir ou fermer     | 0        |
| Torche murale      | allumée, éteinte  | éteindre ou rallumer | 0        |
| Pilier susceptible | intact, fissuré   | fissurer             | +1       |

Ces objets n'accordent aucun loot direct.

## Intention d'interaction

Le contrat du Sprint 4 doit généraliser l'acteur sans perdre l'idempotence :

- identifiant stable de demande ;
- type et identifiant de l'acteur ;
- instance ciblée ;
- interaction demandée ;
- éventuelle direction ou cible ;
- source et raison explicatives.

La résolution vérifie :

1. demande non traitée ;
2. salle non terminale ;
3. phase et acteur autorisés ;
4. acteur vivant et disposant de la ressource requise ;
5. objet, définition et transition présents ;
6. portée et ligne de vue éventuelle ;
7. destination valide pour une poussée ;
8. absence de collision interdite ;
9. restrictions de profil ou de compétence.

Un refus retourne le même état et ne consomme aucune ressource, sauf règle explicite différente validée pour une capacité particulière.

## Acteurs autorisés

Une interaction peut être accessible :

- à tous les héros ;
- à certains héros ou rôles ;
- à toutes les créatures ;
- à certains profils de créatures ;
- à une capacité identifiée ;
- au mode diagnostic uniquement.

L'autorisation est déclarative. Elle ne doit pas être déduite d'un nom affiché.

## Comportements possibles des créatures

Une créature peut :

- ignorer un objet ;
- le contourner ;
- l'utiliser ;
- le pousser ;
- le détruire ;
- le protéger ;
- le rejoindre ;
- empêcher un héros de l'utiliser ;
- déclencher volontairement une réaction ;
- éviter une réaction dangereuse.

Le profil produit une intention candidate. Le moteur d'objets valide et résout.

## Évaluation déterministe par l'IA

```text
profil de l'acteur
→ interactions accessibles
→ conditions et exclusions
→ intérêt tactique et risques déclarés
→ priorité déterministe
→ intention retenue et expliquée
→ moteur d'objets
```

Une interaction candidate peut considérer :

- accomplissement de l'objectif ;
- dommages ou protection attendus ;
- libération ou blocage d'une case ;
- ligne de vue ;
- réaction en chaîne connue ;
- variation de Brouhaha ;
- renfort possible ;
- risque pour les alliés ;
- distance logique ;
- départage stable.

Le moteur d'objets ne calcule pas cette priorité. Il résout l'intention retenue.

## Intégration au Brouhaha et aux renforts

Une transition dont la variation est non nulle produit une `BrouhahaRequest` dérivée de la demande racine.

Le moteur d'objets ne choisit aucun effet, seuil, créature ou point. Il délègue au Brouhaha, qui résout ensuite les règles franchies.

Ordre général :

```text
intention d'interaction
→ validation
→ déplacement éventuel
→ changement d'état
→ consommation de ressource
→ réactions en chaîne
→ demandes de Brouhaha
→ renforts
→ phase terminale
```

L'ordre exact des demandes directes et secondaires doit rester cohérent avec le moteur livré et être couvert par les tests.

## Déplacement, spawn et ligne de vue

- un objet bloquant interdit déplacement et apparition ;
- un objet opaque bloque la ligne de vue ;
- un état ouvert ou brisé peut libérer la case ;
- une transition rendant une case bloquante sur un acteur est refusée ;
- pousser sur un obstacle, combattant ou objet est refusé ;
- les coordonnées restent logiques et indépendantes de la caméra.

## Couverture des trois salles

### Salle 1

Interaction simple, faible risque et réaction courte.

### Salle 2

Poussées, destructions, états, réactions principales, dégâts du décor, interactions propres aux héros et créatures, Brouhaha et renforts.

### Salle 3

Usage stratégique du décor, protection d'objets ou de zones, déclenchement ou évitement volontaire de réactions et combinaisons avec plusieurs profils.

## Interface et renderer

L'application expose uniquement les interactions calculées. La sélection peut provenir du DOM ou du canvas, mais le même contrat moteur est utilisé.

Le renderer dessine l'état, remonte l'identifiant sélectionné et expose des diagnostics. Il ne connaît ni les transitions autorisées, ni les priorités d'IA, ni les seuils de renfort.

Les commandes de transition forcée ou de destruction artificielle appartiennent au mode diagnostic.

## Sauvegarde et expédition

Chaque `RoomState` conserve les objets et leur historique. Les objets ne traversent pas les salles du micro-donjon.

Une salle restaurée retrouve ses objets exactement dans leur état sauvegardé. Une transition d'expédition ne réinitialise ni ne rejoue leurs réactions.

## Invariants

1. Les acteurs produisent des intentions.
2. Le moteur d'objets applique les transitions.
3. Les réactions restent déclarées par salle.
4. Toutes les variations passent par le moteur de Brouhaha.
5. Les renforts passent par la politique de seuil et le spawn.
6. Les autorisations sont déclaratives.
7. Les décisions d'IA sont déterministes et expliquées.
8. Un refus n'applique aucune conséquence implicite.
9. Le renderer et l'UI ne décident aucune interaction.
10. Le loot reste hors de cette responsabilité.

## Tests cibles

- autorisations par type d'acteur et profil ;
- coût et refus sans consommation ;
- portée et destination ;
- choix déterministe d'un objet par l'IA ;
- utilisation, protection, destruction et évitement ;
- réactions et Brouhaha ;
- renforts complets, partiels et refusés ;
- reprise dans chaque salle ;
- absence de commandes diagnostic en mode joueur.

## Frontière avec le Sprint 5

Le Sprint 4 place les objets à la main dans ses trois salles. Le Sprint 5 pourra générer le décor initial, mais continuera à utiliser les mêmes définitions, instances, intentions et moteurs.

Gargottex reste strictement en lecture seule.
