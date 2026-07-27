# Architecture d'exécution

## Chemin nominal

1. `apps/game` monte la coque DOM accessible.
2. `packages/renderer` initialise PixiJS.
3. `packages/save` restaure l'autosauvegarde versionnée.
4. `packages/engine` reçoit une intention et produit `RoomState` final plus des événements ordonnés.
5. Les réactions, Brouhaha, renforts et phase terminale sont entièrement résolus.
6. L'état stable est rendu et sauvegardé.
7. `packages/presentation` transforme les événements en cues visuels, audio et journal.
8. Les adaptateurs renderer, audio et UI jouent ces cues sans modifier l'état.

```text
intention → moteur → RoomState final + événements
                         │
                         ├─ sauvegarde
                         ├─ rendu stable
                         └─ routeur de présentation
                              ├─ cues PixiJS
                              ├─ cues Web Audio
                              └─ journal groupé
```

L'application ne réimplémente aucune règle métier.

## Résolution tactique

Une interaction complète suit l'ordre :

```text
interaction
  → transition directe
  → réactions FIFO
  → Brouhaha causal
  → renforts de seuil
  → phase terminale
  → état final et événements
```

Le renderer ne connaît ni le graphe, ni les seuils, ni les règles d'apparition.

## Présentation

`routeTacticalPresentation` reçoit uniquement les événements déjà résolus.

Il :

- conserve leur ordre ;
- produit des sorties bornées ;
- ne mute aucune entrée ;
- ne recalcule aucune cible ou conséquence ;
- associe les conséquences à une action racine.

Le renderer affiche l'état stable avant les cues. Une nouvelle intention, une rotation, une reprise ou un nouveau rendu annule les transitoires précédents.

## Audio

`AudioDirector` joue des tonalités locales Web Audio après une interaction utilisateur. Volume, mute et cache sont applicatifs. Un échec de lecture ne bloque jamais la partie.

## Reprise

Une reprise reconstruit l'état sauvegardé sans rejouer les événements historiques. Aucun son, overlay, impact ou renfort déjà résolu n'est reproduit.

## Tour ennemi

Le roster vivant est capturé et trié au passage en `enemy-turn`. La machine transmet cette liste figée à `runEnemyTurn`.

Un appel direct à `runEnemyTurn(state)` utilise le roster capturé s'il est non vide, sinon reconstruit un fallback vivant.

## Persistance

La sauvegarde tactique reste en version 6 et conserve :

- combattants, phase, tour et actions ;
- spawn, Brouhaha, objets, réactions et renforts ;
- `enemyTurnRoster`, toujours sérialisé et vide hors phase ennemie.

Les préférences audio et les effets transitoires ne sont pas ajoutés à `RoomState`.

## Diagnostics

Les tests observent :

- un seul canvas ;
- les listeners ;
- le nombre d'objets stables ;
- les objets transitoires ;
- la génération et la quantité de cues ;
- le cache et l'état audio ;
- le mouvement réduit ;
- le nombre d'entrées du journal.

## Frontières

- moteur sans DOM, PixiJS ou IndexedDB ;
- présentation sans décision métier ;
- renderer sans instanciation tactique ;
- audio sans appel réseau tiers ;
- sauvegarde indépendante des effets ;
- Gargottex en lecture seule ;
- PWA jouable hors ligne après le premier chargement.
