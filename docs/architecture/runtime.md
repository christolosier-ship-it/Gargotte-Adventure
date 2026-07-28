# Architecture d'exécution

## Statut

Cette page décrit le runtime stabilisé après le Sprint 4.0.

- Base fonctionnelle : `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf`
- Sauvegarde tactique : version 6
- Sprint 3 : définitivement stabilisé
- Étape suivante : Sprint 4.1, micro-donjon et état d’expédition

## Chemin nominal

1. `apps/game` monte la coque DOM accessible.
2. `packages/renderer` initialise PixiJS.
3. `packages/save` restaure l’autosauvegarde locale.
4. `packages/engine` reçoit une intention et produit un nouvel état avec des événements.
5. Les réactions, demandes de Brouhaha, renforts et phases terminales sont résolus dans leur ordre métier.
6. La pipeline applicative compare l’ancien et le nouvel état pour dériver une transition terminale de présentation lorsqu’elle manque.
7. Le renderer affiche le nouvel état stable.
8. Le routeur produit les cues visuels, audio et le journal groupé.
9. La persistance asynchrone est déclenchée.

L’application ne réimplémente aucune règle métier.

## Ordre garanti d’un résultat accepté

```text
intention
→ moteur tactique
→ RoomState final + événements
→ dérivation terminale éventuelle
→ rendu stable
→ présentation visuelle, sonore et textuelle
→ déclenchement de la persistance asynchrone
```

La présentation ne dépend pas du succès préalable de l’écriture IndexedDB. Une panne de sauvegarde produit un statut d’erreur mais ne revient pas sur une résolution tactique déjà acceptée.

## Interaction d’objet

```text
interaction du héros
→ validation de l’objet, de la portée et du coût
→ transition ou déplacement direct
→ Brouhaha direct éventuel
→ effets et renforts directs
→ file FIFO de réactions
→ transitions, déplacements et dégâts secondaires
→ Brouhaha secondaire à sa position causale
→ renforts secondaires
→ phase terminale
→ pipeline de présentation
```

Une réaction excessive ou cyclique s’arrête explicitement. Le renderer ne connaît ni le graphe, ni les seuils, ni les règles d’apparition.

## Spawn

1. Un scénario, une règle de renfort ou un futur générateur produit une `SpawnRequest`.
2. Le moteur valide phase, définition, points, limites et occupation.
3. Il crée des `CreatureInstance` avec des identifiants reproductibles.
4. Il retourne l’état, les instances et les événements explicatifs.
5. La présentation observe ces événements sans instancier elle-même une créature.
6. La sauvegarde persiste instances, demandes et séquence.

Une apparition n’est jamais créée directement depuis l’UI ou PixiJS.

## Renforts de Brouhaha

```text
BrouhahaRequest acceptée
→ previousLevel vers level
→ règles franchies vers le haut
→ ordre par seuil puis identifiant
→ activation déterministe
→ SpawnRequest source brouhaha
→ moteur de spawn
→ succès total, partiel ou refus
→ historique de renfort
→ cues de présentation
```

Une baisse ne déclenche rien. Une reprise ou une migration ne rejoue aucun seuil ancien. Une activation refusée est consommée et historisée.

## Tour ennemi

Le roster des ennemis vivants est capturé et trié au passage en `enemy-turn`.

La machine de tour transmet cette liste figée à `runEnemyTurn`, de sorte qu’un renfort créé après l’ouverture du roster attend le tour ennemi suivant.

Un appel direct à `runEnemyTurn(state)` utilise le roster capturé lorsqu’il est non vide. S’il est vide, la fonction reconstruit un fallback à partir des ennemis vivants.

## Phase terminale et présentation

Le moteur reste l’autorité sur `victory` et `defeat`.

La pipeline applicative ajoute un événement `phase-changed` uniquement lorsque :

- le nouvel état est terminal ;
- l’ancien état n’avait pas déjà cette phase ;
- les événements ne contiennent pas déjà la même transition.

Le cue terminal est donc disponible pour le renderer, l’audio et le journal sans modifier le moteur ni la sauvegarde.

## Audio

Les préférences sont chargées hors de `RoomState`.

- les champs persistés sont validés séparément ;
- une valeur invalide préserve le réglage courant ;
- une clé répétée redémarre son lecteur au lieu de superposer les sons ;
- le mode muet, l’autoplay et les fallbacks n’influencent pas les règles.

## Persistance tactique

La sauvegarde version 6 conserve notamment :

- combattants, phase, tour et actions ;
- Brouhaha, historique et séquence ;
- objets, interactions et réactions ;
- points, demandes et séquence de spawn ;
- historique, résultats et séquence des renforts ;
- `enemyTurnRoster` ;
- héros sélectionnés.

Les effets visuels et audio transitoires ne sont jamais sauvegardés.

## Frontières

- moteur sans DOM, PixiJS ou IndexedDB ;
- contenu validé avant le build et au chargement ;
- renderer sans décision métier ;
- présentation dérivée uniquement des événements et des changements d’état ;
- audio sans autorité tactique ;
- sauvegarde versionnée et validée avant restauration ;
- Gargottex consulté uniquement en lecture seule ;
- aucun secret ou appel OpenAI dans la PWA.

## Hors ligne

`vite-plugin-pwa` génère le service worker et précharge les ressources de production. IndexedDB conserve la progression. Après un premier chargement connecté, les sessions peuvent fonctionner hors ligne.

## Préparation du Sprint 4.1

Le futur `ExpeditionState` sera ajouté au-dessus des états de salle. Il ne doit pas modifier les contrats stabilisés de résolution tactique, de présentation ou de persistance d’une salle.
