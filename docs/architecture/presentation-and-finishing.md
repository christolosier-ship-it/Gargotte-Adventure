# Présentation et finition du Sprint 3.6

## Statut

- Sprint : 3.6
- État : implémenté dans la Pull Request #59, avant fusion
- Issue d'implémentation : #57
- Base de départ : `86aeb13d3705cb744dfe525a10e37fa11f38dcaa`
- HEAD fonctionnel validé : `91d88d28448e354c220a70f4525beaa317f6d54d`
- Audit : [Audit de livraison du Sprint 3.6](../audits/sprint-3-6-presentation-finishing.md)

## Objectif

Le Sprint 3.6 clôt le Sprint 3 en rendant les conséquences tactiques plus lisibles, audibles et confortables sans modifier les règles livrées.

Les événements du moteur restent la source de vérité. Les overlays, sons et formulations du journal ne décident jamais qu'une action réussit, qu'un renfort apparaît ou qu'une phase se termine.

```text
intention joueur
      │
      ▼
moteur tactique
      │
      ├─ RoomState final
      └─ TacticalEvent[] ordonnés
              │
              ▼
 packages/presentation
      ┌───────┼────────┐
      ▼       ▼        ▼
 cues visuels audio   journal groupé
      │       │        │
      ▼       ▼        ▼
 renderer   audio      UI
```

## Routeur pur

Le package `packages/presentation` contient un routeur sans DOM, PixiJS, Web Audio ni stockage.

`routeTacticalPresentation` reçoit :

- les événements tactiques déjà résolus ;
- une fonction de traduction textuelle ;
- les options de mouvement réduit et de bornage.

Il retourne :

- une liste ordonnée de cues visuels ;
- une liste ordonnée de cues audio ;
- une entrée de journal liée à une action racine.

Le routeur :

- conserve l'ordre causal ;
- ne mute ni `RoomState`, ni les événements ;
- ne choisit aucune cible ou conséquence métier ;
- ne recalcule ni dégâts, ni occupation, ni seuil, ni victoire ;
- borne ses sorties à dix cues visuels et six cues audio par défaut.

## Ports structurels

Les packages `renderer`, `audio` et `ui` ne dépendent pas du package `presentation`.

Chacun expose son propre port structurel :

- `VisualPresentationCue` côté renderer ;
- `AudioPresentationCue` côté audio ;
- `JournalPresentationEntry` côté UI.

Les objets produits par le routeur sont compatibles avec ces ports par typage structurel TypeScript. Le graphe des packages reste unidirectionnel et sans cycle.

## Cues visuels

Le lot pilote couvre :

- activation du héros ;
- déplacement et poussée ;
- impact et dégâts ;
- variation du Brouhaha ;
- franchissement de seuil ;
- renfort réussi, partiel ou refusé ;
- victoire et défaite.

Le renderer affiche d'abord l'état tactique final, puis joue les cues dans une couche PixiJS `presentation` dédiée.

Cette couche :

- n'accepte aucun événement de pointeur ;
- possède une profondeur supérieure au plateau stable ;
- annule ses timers lorsqu'une nouvelle lecture commence ;
- détruit ses objets lors d'un nouveau rendu, d'une rotation, d'une reprise ou de la destruction du renderer ;
- expose génération, quantité prévue et quantité active dans les diagnostics.

Les cues utilisent des anneaux courts et lisibles. Ils ne masquent pas durablement les cases ou combattants.

## Audio local

`AudioDirector` joue sept sons pilotes synthétisés localement avec Web Audio :

- interaction ;
- impact ;
- dégâts ;
- Brouhaha ;
- renfort ;
- victoire ;
- défaite.

La lecture :

- attend la première interaction pointeur ou clavier ;
- respecte le volume général et le mode muet ;
- met les lecteurs en cache par clé ;
- redémarre un son court depuis son début ;
- tolère Web Audio indisponible ou une lecture refusée ;
- ne réalise aucun appel réseau ;
- peut utiliser plus tard des fichiers locaux avec le même port.

Les préférences audio sont stockées dans `localStorage` sous une clé applicative. Elles ne sont pas ajoutées à `RoomState` et ne modifient pas la sauvegarde tactique version 6.

## Journal groupé

Le journal visible conserve six actions racines au maximum.

Chaque entrée possède :

- un résumé compréhensible ;
- une tonalité textuelle ;
- les types d'événements pour le diagnostic ;
- jusqu'à sept conséquences complémentaires.

Les conséquences majeures sont conservées en priorité. Une chaîne produisant un renfort total puis un renfort partiel affiche les deux résultats dans la même entrée.

Le journal n'est pas une deuxième sauvegarde. Les événements et historiques persistants du moteur restent la preuve complète.

## Reprise et annulation

Une reprise restaure immédiatement l'état stable sauvegardé.

Elle ne rejoue pas :

- les overlays historiques ;
- les sons historiques ;
- les impacts déjà terminés ;
- les apparitions déjà résolues.

Le journal ajoute uniquement un message de restauration. La rotation de caméra et le démarrage d'une nouvelle salle annulent aussi les effets transitoires en cours.

## Accessibilité

- `prefers-reduced-motion` réduit les cues à une transition de 70 ms maximum ;
- le mode muet et le volume sont accessibles dans le panneau de commandes ;
- le statut du mouvement réduit est visible dans le DOM ;
- aucune information essentielle n'est transmise uniquement par le son ou la couleur ;
- les overlays n'interceptent ni le focus, ni le clic, ni le toucher ;
- les commandes clavier, souris et tactiles restent disponibles.

## Diagnostics de stabilité

Le renderer et l'application exposent notamment :

- `data-display-objects` ;
- `data-transient-objects` ;
- `data-presentation-generation` ;
- `data-presentation-cue-count` ;
- `data-presentation-active` ;
- `data-listener-counts` ;
- `data-audio-cache-size` ;
- `data-audio-muted` ;
- `data-audio-unlocked` ;
- `data-reduced-motion`.

Les tests contrôlent :

- un seul canvas ;
- des listeners stables ;
- un nombre d'objets stable après quatre rotations ;
- un retour à zéro des objets transitoires ;
- un journal borné ;
- un cache audio limité aux sept clés ;
- l'absence de replay après rechargement.

Le rendu complet n'a pas été remplacé par un diff incrémental. Aucun WebAssembly ni véritable 3D n'a été introduit sans mesure le justifiant.

## Validation

Le HEAD fonctionnel `91d88d28448e354c220a70f4525beaa317f6d54d` a validé :

- Repository quality `30305294064` ;
- Validate application `30305294029` ;
- Prettier ;
- validation du contenu ;
- TypeScript strict ;
- 131 tests unitaires ;
- build de production ;
- validateur structurel ;
- Playwright Chrome bureau et mobile paysage ;
- package lock et artefact de production.

## Frontières confirmées

- aucune nouvelle règle tactique ;
- aucune mutation de `RoomState` par la présentation ;
- aucune nouvelle version de sauvegarde ;
- aucun rééquilibrage du contenu ;
- aucun appel réseau tiers ;
- aucun secret ;
- aucun hasard métier ;
- Gargottex strictement en lecture seule.

## Hors périmètre

- animations définitives de tous les personnages ;
- catalogue complet de bruitages ;
- musique adaptative, doublage ou spatialisation avancée ;
- équilibrage des héros et créatures ;
- génération du donjon et des rencontres ;
- loot, progression et campagne ;
- véritable 3D ou WebAssembly.
