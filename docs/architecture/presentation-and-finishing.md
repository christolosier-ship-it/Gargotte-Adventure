# Présentation et finition tactique

## Statut

- Sprint fonctionnel initial : 3.6
- Stabilisation finale : Sprint 4.0
- PR initiale : #59
- PR corrective : #64
- Commit stable correctif : `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf`
- Audit : [Sprint 4.0](../audits/sprint-4-0-stabilization.md)

La couche de présentation est définitivement stabilisée. Elle dérive exclusivement des événements tactiques et de la transition entre l’ancien et le nouvel état moteur.

## Flux

```text
intention joueur
      │
      ▼
moteur tactique
      │
      ├─ RoomState final
      └─ événements ordonnés
              │
              ▼
pipeline applicative
      │
      ├─ dérivation terminale éventuelle
      ├─ rendu stable
      ├─ routeur de présentation
      │    ├─ cues visuels
      │    ├─ cues audio
      │    └─ journal groupé
      └─ persistance asynchrone
```

## Source de vérité

Le moteur décide :

- succès ou refus d’une action ;
- dégâts et déplacements ;
- changements d’état des objets ;
- Brouhaha, effets et renforts ;
- victoire ou défaite.

La présentation ne recalcule aucune cible, occupation, condition de seuil, phase ou règle tactique.

## Transition terminale

Les chemins métier peuvent terminer une résolution avec un `RoomState` en `victory` ou `defeat` sans produire eux-mêmes un événement de présentation.

La pipeline compare donc l’ancien et le nouvel état. Lors d’une transition réelle vers une phase terminale, elle ajoute un unique événement `phase-changed` si cet événement n’existe pas déjà.

Cette dérivation :

- ne modifie pas `RoomState` ;
- ne change pas l’ordre métier ;
- ne rejoue rien lors d’une reprise ;
- permet au renderer, à l’audio et au journal de recevoir la même phase terminale.

## Routeur

`packages/presentation` transforme une liste ordonnée de `TacticalEvent` en :

- `VisualPresentationCue[]` ;
- `AudioPresentationCue[]` ;
- une entrée de journal groupée.

Chaque cue contient une séquence, une priorité, une catégorie et les informations logiques nécessaires à l’adaptateur concerné.

## Plafonds et priorités

Les sorties restent bornées pour éviter une croissance excessive pendant une longue chaîne.

Lorsque le nombre de cues dépasse le plafond :

1. les cues de priorité la plus élevée sont sélectionnés ;
2. les égalités sont départagées par séquence causale puis ordre d’origine ;
3. les cues retenus sont replacés dans leur ordre causal avant lecture.

La garantie de priorité s’applique aux cues visuels, aux cues audio et au résumé du journal. Un renfort ou une phase terminale tardive ne peut plus être évincé par une série de retours mineurs arrivés plus tôt.

## Renderer

`packages/renderer` affiche d’abord l’état stable, puis joue les cues transitoires dans une couche dédiée.

Les effets :

- n’interceptent aucun clic ou focus ;
- sont annulés lors d’un nouveau rendu, d’une rotation, d’une reprise ou d’une destruction ;
- respectent `prefers-reduced-motion` ;
- reviennent à zéro dans les diagnostics après leur lecture.

Le renderer ne connaît aucune règle de seuil, d’occupation, de victoire ou d’apparition.

## Audio

`packages/audio` reçoit uniquement des clés de cues.

`AudioDirector` :

- attend une interaction utilisateur avant lecture ;
- respecte volume général et mode muet ;
- conserve les lecteurs en cache ;
- tolère l’absence d’asset ou le refus du navigateur ;
- ne contacte aucun service tiers ;
- arrête le lecteur actif d’une clé répétée avant de la relancer.

Les réglages persistés sont filtrés champ par champ. Une valeur invalide ou absente ne remplace jamais un réglage par défaut par `undefined`.

## Journal

Le journal regroupe une action racine et ses conséquences importantes dans leur ordre.

Il distingue notamment :

- changement de niveau du Brouhaha ;
- renfort total, partiel ou refusé ;
- dégâts de chaîne ;
- défaite d’un combattant ;
- victoire ou défaite de la salle.

La liste DOM reste bornée. Les historiques persistants du moteur restent la preuve complète.

## Reprise

Une reprise reconstruit immédiatement l’état stable depuis la sauvegarde.

Elle ne rejoue pas :

- sons historiques ;
- impacts ;
- mouvements transitoires ;
- apparitions déjà résolues ;
- écrans terminaux déjà présentés.

Les préférences audio restent des réglages applicatifs et ne font pas partie de la sauvegarde tactique version 6.

## Ordre runtime

Pour un résultat accepté :

```text
nouvel état moteur
→ rendu stable
→ présentation des événements et de la transition terminale éventuelle
→ déclenchement de la persistance asynchrone
```

La lecture des cues ne dépend pas du succès préalable de l’écriture IndexedDB.

## Frontières de packages

`packages/presentation` peut dépendre uniquement de `packages/engine` parmi les packages Gargotte.

Le validateur automatisé refuse notamment les dépendances directes vers :

- renderer ;
- audio ;
- UI ;
- save.

`apps/game` assemble le routeur et ses adaptateurs.

## Validation

Le contrat est couvert par :

- tests unitaires événement vers cue ;
- tests de non-mutation ;
- tests de priorité sous plafond ;
- tests de transition réelle victoire et défaite ;
- tests audio et préférences invalides ;
- test d’ordre rendu, présentation, persistance ;
- tests des frontières ;
- Playwright bureau et mobile paysage.

## Hors périmètre

- musique adaptative ;
- doublages ;
- spatialisation avancée ;
- animations définitives de tous les acteurs ;
- règles tactiques ;
- génération procédurale.
