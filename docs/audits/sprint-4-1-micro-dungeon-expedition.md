# Audit de clôture du Sprint 4.1

## Références

- Issue : #66
- Pull Request fonctionnelle : #67
- HEAD validé : `468bd6e9a0229af5d11d7a8fe5950349911bcfe4`
- Commit fonctionnel fusionné : `18acb7947fc9625d606213c6db02e7947e5e9f44`
- Repository quality : run `30392188004`, succès
- Validate application : run `30392188280`, succès

## Décision

Le Sprint 4.1 est fonctionnellement terminé. La salle tactique isolée est devenue un micro-donjon manuel de trois salles reliées par des transitions explicites, sans introduire la génération procédurale réservée au Sprint 5.

## Livré

- `ExpeditionDefinition` versionnée et validée par Zod ;
- `ExpeditionState` version 1 au-dessus des `RoomState` version 6 ;
- trois salles fixes de Bastognac et deux connexions déclarées ;
- création de toutes les populations initiales par `SpawnRequest` ;
- conservation des PV et de l’état vivant des héros entre les salles ;
- Brouhaha, ennemis, objets, réactions et historiques locaux à chaque salle ;
- complétion idempotente avant toute transition ;
- victoire globale après enregistrement de la troisième salle dans `completedRoomIds` ;
- défaite globale et résultat synthétique ;
- sauvegarde `expedition-autosave` version 1 ;
- migration de l’ancienne sauvegarde tactique ;
- reprise sans replay des spawns, événements, cues ou conséquences historiques ;
- écran de résultat et rejeu ;
- commandes techniques isolées dans un mode diagnostic explicite.

## Écarts révélés par Playwright et corrigés

### Première partie sans sauvegarde

L’absence de sauvegarde était interprétée comme une incompatibilité de définition par une comparaison utilisant l’optional chaining. Le constructeur accepte désormais explicitement `null` et ne vérifie `definitionId` que lorsqu’un état restauré existe.

### Ordre de création d’une salle

L’injection des héros persistants calculait trop tôt la phase terminale sur une salle encore vide d’ennemis. Les populations initiales sont désormais instanciées avant l’application des PV persistants. La phase est ainsi calculée sur l’état complet de la salle.

### Fixtures terminales

Les ennemis morts des sauvegardes de test conservent désormais `blocksMovement: false`, conformément au schéma tactique.

### Parcours historiques

Les tests de salle unique ont été alignés sur le micro-donjon : entrée, reprise, diagnostic, identifiants issus du spawn, transition vers la galerie et décor riche de la salle 2.

## Validation

La validation finale couvre :

- formatage Prettier ;
- validation du contenu ;
- TypeScript strict ;
- tests unitaires ;
- build de production ;
- validateur structurel du dépôt ;
- Playwright complet sur Chromium bureau ;
- Playwright complet sur mobile paysage ;
- sauvegarde et reprise dans l’expédition ;
- transition explicite ;
- victoire globale et rejeu ;
- absence de replay des populations initiales ;
- séparation du mode diagnostic.

## Frontières respectées

Le Sprint 4.1 ne livre ni les contrats détaillés des héros et créatures, ni les compétences définitives, ni les nouveaux profils d’IA, ni le bestiaire complet, ni l’équilibrage final. Ces sujets commencent au Sprint 4.2.

Aucune génération procédurale n’est introduite. Gargottex reste strictement en lecture seule.

## Suite

Le Sprint 4.2 est la prochaine phase active. Il doit définir les contrats des acteurs, compétences, capacités et comportements déclaratifs en réutilisant l’orchestrateur d’expédition livré ici.