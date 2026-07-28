# Micro-donjon et état d’expédition

## Statut

- Socle Sprint 4.1 : ✅ implémenté
- Issue : #66
- Pull Request : #67
- Commit fonctionnel : `18acb7947fc9625d606213c6db02e7947e5e9f44`
- Extension des acteurs et comportements : Sprints 4.2 à 4.7
- ADR : [ADR-0008](../adr/0008-hand-authored-micro-dungeon.md)

## Objectif

L’orchestrateur d’expédition relie trois `RoomState` sans déplacer les règles tactiques hors du moteur de salle. Il gère la topologie, la progression, la persistance inter-salles et le résultat global.

```text
ExpeditionDefinition
        │
        ▼
ExpeditionState v1
        │
        ├── RoomState salle 1 v6
        ├── RoomState salle 2 v6
        └── RoomState salle 3 v6
```

## Séparation des responsabilités

### Contenu

`ExpeditionDefinition` décrit l’ordre des salles, les entrées, les sorties, les connexions, les objectifs et les textes terminaux.

Les fichiers de salle décrivent la grille, les objets, les points de spawn, les populations initiales, les réactions et les renforts. Ils ne contiennent aucune instance runtime préfabriquée.

### Moteur d’expédition

`packages/engine/src/expedition` porte :

- `ExpeditionState` version 1 ;
- création et démarrage de l’expédition ;
- extraction et injection des PV persistants ;
- synchronisation de la salle courante ;
- complétion idempotente ;
- transition vers la salle suivante ;
- victoire et défaite globales ;
- synthèse du résultat.

### Application

`ExpeditionSession` compose le contenu et le moteur :

- construit une salle neuve ;
- restaure une salle déjà visitée ;
- applique la connexion déclarée ;
- expose la salle, ses métadonnées et la transition disponible ;
- refuse une sauvegarde appartenant à une autre définition.

### Sauvegarde

`packages/save` valide le payload `expedition-autosave` :

- `kind: "expedition"` ;
- `version: 1` ;
- état d’expédition complet ;
- état du mode diagnostic.

Le schéma vérifie les identifiants uniques, les salles visitées, les salles terminées, la cohérence des `RoomState`, l’état des héros persistants et la présence de la troisième salle dans une victoire globale.

## Construction d’une salle

L’ordre est impératif :

```text
1. créer le RoomState de base
2. exécuter les SpawnRequest initiales
3. injecter les PV persistants
4. calculer la phase terminale
5. enregistrer la salle dans l’expédition
```

Les populations initiales sont exécutées avant l’injection des héros persistants. Sans cet ordre, une salle vide d’ennemis pourrait être considérée victorieuse avant ses spawns.

## Persistance

Persistant entre les salles :

- équipe sélectionnée ;
- PV actuels et PV maximum ;
- état vivant des héros ;
- liste des salles visitées et terminées ;
- états complets des salles déjà créées ;
- résultat global.

Local à chaque salle :

- tour et phase ;
- Brouhaha et historique ;
- ennemis et séquences d’instances ;
- objets et réactions ;
- renforts ;
- requêtes déjà traitées ;
- roster du tour ennemi.

## Populations initiales et idempotence

```text
InitialSpawnDefinition
→ SpawnRequest
→ spawnCreatures
→ CreatureInstance
```

Les identifiants de requête sont persistés dans le `RoomState`. Une reprise restaure les instances existantes et ne réexécute pas les populations initiales.

Une transition vers une salle jamais visitée la construit. Une transition vers une salle déjà enregistrée réutilise son état exact.

## Complétion et transition

La salle courante est synchronisée après chaque changement tactique.

- victoire locale : l’identifiant de salle est ajouté une seule fois à `completedRoomIds` ;
- salles 1 et 2 : la connexion suivante devient utilisable ;
- salle 3 : la complétion est enregistrée avant le passage du statut global à `victory` ;
- défaite locale : le statut global devient `defeat`.

La transition ne modifie pas rétroactivement le Brouhaha, les objets ou les ennemis de la salle quittée.

## Migration

Une ancienne sauvegarde tactique unique peut être reconnue et transformée en nouvelle expédition commençant dans la première salle. L’équipe et les PV sont conservés, mais aucun historique de présentation n’est rejoué et aucune progression fictive dans les salles suivantes n’est inventée.

## Parcours joueur et diagnostic

Le parcours joueur normal expose uniquement les actions de jeu, la progression, la transition et le résultat.

Le mode diagnostic est activé explicitement. Il peut afficher les commandes manuelles de Brouhaha et de spawn, mais ne contourne pas les moteurs ni les validations.

## Validation

La livraison est couverte par :

- tests Zod du contenu et de la sauvegarde ;
- tests des invariants de l’expédition ;
- tests de construction déterministe ;
- tests de transition et de complétion ;
- tests de reprise sans replay ;
- Playwright bureau et mobile paysage ;
- test de victoire globale avec salle 3 enregistrée ;
- test du mode diagnostic séparé.

Voir [Audit du Sprint 4.1](../audits/sprint-4-1-micro-dungeon-expedition.md).

## Frontières

Cette architecture ne définit pas les statistiques finales, compétences ou comportements des acteurs. Le Sprint 4.2 doit enrichir les définitions d’acteurs tout en produisant des intentions résolues par les moteurs existants.

La génération de topologie, de géométrie et de rencontres reste réservée au Sprint 5. Gargottex reste strictement en lecture seule.
