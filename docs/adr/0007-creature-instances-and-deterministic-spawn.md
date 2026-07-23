# ADR-0007 — Séparer les définitions de créatures, les instances runtime et le spawn déterministe

- Statut : Accepté
- Date : 2026-07-23

## Contexte

La salle pilote contient actuellement des ennemis décrits directement avec leurs statistiques, leur position et un identifiant unique. Cette représentation suffit pour une salle statique, mais elle ne permet pas proprement :

- plusieurs exemplaires du même type de créature ;
- des renforts déclenchés en cours de partie ;
- des vagues ;
- la persistance d’instances distinctes ;
- la composition future des rencontres par budget de menace ;
- l’utilisation d’un même catalogue de créatures dans plusieurs salles.

Le Sprint 3 doit introduire des renforts liés au Brouhaha. Le Sprint 4 apportera les définitions et comportements définitifs des créatures. Le Sprint 5 générera les salles, les étages et leur population initiale.

Sans séparation explicite, le contenu éditorial, l’état runtime et la logique de génération seraient mélangés dans `RoomState` ou dans le contrôleur applicatif.

## Décision

Le projet distingue durablement trois responsabilités.

### 1. Définition éditoriale

Une `CreatureDefinition` décrit un archétype stable : identité, statistiques de base, catégorie, menace, comportement, tags et références d’assets.

Sa source de vérité éditoriale reste Gargottex, via des paquets validés par le jeu.

### 2. Instance runtime

Une `CreatureInstance` représente une créature présente dans une partie. Elle possède :

- un `instanceId` unique et persisté ;
- un `creatureId` référençant sa définition ;
- son état mutable, notamment position, PV et effets temporaires.

Plusieurs instances peuvent partager le même `creatureId`.

### 3. Spawn déterministe

Un moteur pur reçoit un état de salle et une `SpawnRequest`, puis retourne un `SpawnResult` contenant le nouvel état et des événements explicatifs.

À entrée identique, le résultat doit être identique. Les identifiants d’instance ne reposent ni sur l’heure ni sur un UUID aléatoire. Les points candidats sont ordonnés de façon stable ou sélectionnés par un PRNG explicitement seedé.

## Budget de menace

Le budget de menace est défini **par salle**.

Il appartient au futur générateur de rencontre, qui compose la population initiale d’une salle. Il ne constitue pas un budget global d’étage.

Le moteur de spawn n’applique pas implicitement ce budget. Une règle de Brouhaha peut ajouter des renforts au-delà de la population initiale, à condition que cette augmentation soit explicitement définie, bornée et expliquée par le système appelant.

## Génération future

Le Sprint 5 générera :

- la topologie des cinq étages ;
- la géométrie complète des salles ;
- leurs murs, portes, connexions, entrées, sorties et zones ;
- leurs points de spawn et éléments structurels ;
- une rencontre contrôlée pour chaque salle selon son propre budget de menace.

Le générateur produira des plans et des demandes d’instanciation. Le moteur de spawn restera l’exécutant générique.

## Conséquences positives

- plusieurs exemplaires d’une créature deviennent possibles sans dupliquer sa définition ;
- les renforts restent déterministes et sauvegardables ;
- le moteur tactique ne dépend pas de Gargottex ni du renderer ;
- le Sprint 4 peut enrichir les archétypes sans réécrire la logique d’instance ;
- le Sprint 5 peut générer des rencontres sans injecter directement des objets runtime non validés ;
- le journal peut expliquer chaque apparition ou refus ;
- les sauvegardes distinguent clairement contenu stable et état mutable.

## Compromis et risques

- `RoomState` et la sauvegarde devront probablement évoluer de version ;
- les ennemis actuels nécessiteront une adaptation ou migration ;
- les identifiants d’archétype et d’instance devront être rigoureusement distingués dans l’UI, les événements et les tests ;
- les règles de spawn peuvent devenir complexes si les responsabilités du déclencheur et de l’exécutant ne restent pas séparées.

## Garde-fous

- aucun `Math.random()` implicite dans le moteur ;
- aucun identifiant fondé sur l’heure ;
- aucun spawn directement déclenché par le renderer ou l’UI ;
- aucune définition éditoriale mutable dans `RoomState` ;
- toute évolution de sauvegarde possède une validation et une migration testées ;
- toute apparition produit une explication de domaine.

## Réévaluation

Cette décision sera réévaluée uniquement si :

- le modèle d’instance empêche une mécanique essentielle ;
- le générateur complet du Sprint 5 révèle une frontière plus adaptée ;
- la persistance des instances devient incompatible avec les contraintes offline-first.

Une optimisation de performance seule ne justifie pas de fusionner à nouveau définition, instance et génération.
