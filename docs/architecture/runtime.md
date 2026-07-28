# Architecture d'exécution

## Statut

Cette page décrit le runtime livré après le Sprint 3.6 et son articulation cible avec le Sprint 4.

Le Sprint 3 est fonctionnellement livré. Sept P2 post-fusion restent à traiter au Sprint 4.0 avant l'ajout fonctionnel de l'expédition.

## Chemin nominal livré

1. `apps/game` monte la coque DOM accessible.
2. `packages/renderer` initialise PixiJS.
3. `packages/save` restaure l'autosauvegarde versionnée.
4. `packages/engine` reçoit une intention et produit `RoomState` final plus des événements ordonnés.
5. Les effets directs, Brouhaha, renforts, réactions et phase terminale sont entièrement résolus selon le type d'intention.
6. L'état stable est rendu.
7. `packages/presentation` transforme les événements en cues visuels, audio et journal.
8. Les adaptateurs jouent ces cues sans modifier l'état.
9. La demande de persistance est lancée de manière asynchrone par l'orchestration actuelle.

```text
intention → moteur → RoomState final + événements
                         │
                         ├─ rendu stable
                         ├─ routeur de présentation
                         │    ├─ cues PixiJS
                         │    ├─ cues Web Audio
                         │    └─ journal groupé
                         └─ persistance asynchrone
```

Cette séquence corrige la description antérieure qui plaçait la sauvegarde avant la présentation. Le Sprint 4.0 doit confirmer ce contrat ou modifier l'orchestration, puis verrouiller le choix par les tests.

L'application ne réimplémente aucune règle métier.

## Résolution tactique actuelle

### Action sans interaction d'objet bruyante

```text
intention
→ validation
→ déplacement, attaque, capacité ou autre effet direct
→ réactions éventuelles
→ Brouhaha secondaire éventuel à sa position causale
→ effets et renforts associés
→ phase terminale
→ RoomState final et événements
```

### Interaction d'objet bruyante

```text
intention d'interaction
→ validation
→ transition ou déplacement direct de l'objet
→ Brouhaha direct éventuel
→ effets et renforts directs
→ réactions FIFO
→ Brouhaha secondaire éventuel de chaque action
→ effets et renforts secondaires
→ phase terminale
→ RoomState final et événements
```

Le Brouhaha direct et ses renforts sont résolus avant la propagation. Une apparition directe peut donc modifier l'occupation ou la condition terminale avant les réactions secondaires.

Les acteurs du Sprint 4 produiront de nouvelles intentions sans contourner ces ordres. Toute divergence future doit être explicitement décidée, documentée et testée.

## Présentation

`routeTacticalPresentation` reçoit les événements déjà résolus et produit des sorties bornées.

Il :

- ne mute aucune entrée ;
- ne recalcule aucune cible ou conséquence ;
- associe les conséquences à une action racine ;
- conserve l'ordre des cues retenus.

La version fusionnée applique encore les plafonds visuels et audio par troncature. Elle ne garantit donc pas la conservation de tous les cues prioritaires tardifs. Ce P2 doit être corrigé au Sprint 4.0.

Les cues terminaux doivent être dérivés d'une transition métier réelle. Le Sprint 4.0 doit couvrir les chemins ordinaires de victoire et de défaite, pas seulement un événement artificiel.

## Audio

`AudioDirector` joue des tonalités locales Web Audio après une interaction utilisateur. Volume, mute et cache sont applicatifs.

Le Sprint 4.0 doit :

- ignorer les préférences persistées invalides ou incomplètes ;
- conserver les valeurs par défaut ;
- empêcher la superposition de tonalités répétées de même clé ;
- maintenir une partie jouable lorsque Web Audio échoue.

## Reprise

Une reprise reconstruit l'état sauvegardé sans rejouer les événements historiques. Aucun son, overlay, impact, spawn initial ou renfort déjà résolu n'est reproduit.

Le Sprint 4 étendra ce principe à `ExpeditionState` : restaurer la salle courante, l'équipe et les salles enregistrées sans rejouer les transitions ou présentations historiques.

## Tour ennemi

Le roster vivant est capturé et trié au passage en `enemy-turn`. La machine transmet cette liste figée à `runEnemyTurn`.

Un appel direct à `runEnemyTurn(state)` utilise le roster capturé s'il est non vide, sinon reconstruit un fallback vivant.

Le Sprint 4 enrichira la sélection d'intentions ennemies par des profils déclaratifs. La résolution finale continuera à utiliser les moteurs tactiques existants.

## Runtime cible de l'expédition

```text
intention d'expédition ou tactique
        │
        ▼
ExpeditionState + RoomState courant
        │
        ├─ intention tactique → moteur de salle
        │
        └─ intention de transition
               ├─ vérifie complétion, sortie et connexion
               ├─ extrait l'état persistant des héros
               ├─ clôt la salle source
               ├─ restaure ou crée la salle cible
               └─ met à jour la progression
```

Une salle est ajoutée à `completedRoomIds` dès que sa condition locale est remplie et toutes ses conséquences résolues. Les salles 1 et 2 autorisent ensuite une transition explicite. La salle 3 peut produire directement la victoire globale sans transition supplémentaire.

Une transition est refusée tant que la résolution tactique courante n'est pas entièrement terminée ou que la salle source n'est pas enregistrée comme terminée.

Lors de la première création d'une salle, les populations initiales sont traduites en `SpawnRequest` déterministes et exécutées par le moteur de spawn. Aucun orchestrateur d'expédition ne construit directement une `CreatureInstance`.

## Persistance cible

La sauvegarde doit distinguer :

- enveloppe d'expédition ;
- états tactiques des trois salles ;
- état persistant des héros ;
- préférences applicatives hors état métier.

Le Brouhaha, les ennemis, objets, réactions et renforts restent propres à chaque salle.

Le Sprint 4.1 définit le schéma Zod, le format de sauvegarde, la version initiale et la stratégie de migration de l'expédition avant l'implémentation des transitions. Le Sprint 4.2 définit ensuite les contrats et migrations propres aux acteurs et comportements.

## Mode diagnostic

Le mode diagnostic est une branche explicite de l'orchestration applicative. Il peut produire des intentions techniques, mais n'ajoute aucune règle au moteur et n'est jamais requis dans le parcours joueur.

Le parcours normal ne doit plus afficher les commandes de changement manuel du Brouhaha, spawn forcé, navigation directe, modification de PV ou phase terminale forcée.

## Diagnostics et tests

Les tests actuels observent :

- canvas unique ;
- listeners ;
- objets stables et transitoires ;
- génération et quantité de cues ;
- cache et état audio ;
- mouvement réduit ;
- journal borné.

Le Sprint 4 ajoutera :

- schémas et sauvegarde d'expédition dès 4.1 ;
- population initiale par `SpawnRequest` ;
- état et salle courante d'expédition ;
- complétion de la troisième salle sans transition ;
- transitions ;
- persistance des héros ;
- reprise dans chaque salle ;
- absence de commandes techniques en mode joueur ;
- explications des décisions ennemies.

## Frontières

- moteur sans DOM, PixiJS ou IndexedDB ;
- présentation sans décision métier ;
- renderer sans instanciation tactique ni transition d'expédition ;
- audio sans appel réseau tiers ;
- sauvegarde indépendante des effets transitoires ;
- `ExpeditionState` sans duplication des règles de salle ;
- moteur de spawn comme frontière unique d'instanciation des créatures ;
- Gargottex en lecture seule ;
- PWA jouable hors ligne après le premier chargement ;
- aucune génération procédurale au Sprint 4.
