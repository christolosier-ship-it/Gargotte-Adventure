# Sprint 4 : micro-donjon, héros, créatures et comportements de Bastognac

## Statut

- Sprint 4.0 : ✅ terminé
- Sprint 4.1 : ✅ terminé
- Issue Sprint 4.1 : #66
- PR fonctionnelle Sprint 4.1 : #67
- Commit fonctionnel stable : `18acb7947fc9625d606213c6db02e7947e5e9f44`
- Repository quality : `30392188004`
- Validate application : `30392188280`
- Sprint 4.2 : prochaine phase
- Génération procédurale : réservée au Sprint 5

Voir [Audit du Sprint 4.1](../audits/sprint-4-1-micro-dungeon-expedition.md).

## Résultat livré par le Sprint 4.1

Le jeu ne repose plus sur une salle tactique isolée. Il propose un micro-donjon manuel de trois salles adjacentes :

```text
Préparation de l’expédition
→ Salle 1 : prise en main tactique
→ Salle 2 : décor, réactions et Brouhaha
→ Salle 3 : confrontation pilote
→ Résultat global
```

Le joueur peut sélectionner son équipe, commencer une expédition, sauvegarder, reprendre, sécuriser une salle, franchir explicitement un passage, conserver les PV de ses héros, atteindre une victoire ou une défaite globale puis rejouer.

## Contrats livrés

### Définition éditoriale

`ExpeditionDefinition` décrit :

- l’identifiant et le nom du micro-donjon ;
- l’ordre exact des trois salles ;
- la salle d’entrée ;
- les métadonnées, objectifs, entrées et sorties ;
- les deux connexions ;
- les textes de victoire et de défaite.

Le schéma Zod vérifie l’unicité, la cohérence des références, l’ordre des connexions et l’absence de sortie sur la dernière salle.

### État runtime

`ExpeditionState` version 1 contient :

- l’équipe sélectionnée ;
- la salle courante ;
- les salles visitées et terminées ;
- l’état persistant des héros ;
- les `RoomState` de chaque salle visitée ;
- le statut global ;
- le résultat final.

Les PV et l’état vivant des héros persistent. Brouhaha, ennemis, objets, réactions, tours et historiques restent locaux à chaque salle.

### Sauvegarde

La clé active est `expedition-autosave`. Le payload d’expédition est validé en profondeur et peut migrer l’ancienne sauvegarde tactique vers une première salle neuve sans rejouer les conséquences historiques.

## Populations initiales

Les contenus de salle ne construisent aucune `CreatureInstance` directement.

```text
contenu de salle
→ SpawnRequest ordonnée
→ moteur de spawn
→ CreatureInstance
→ identifiant reproductible
```

Les populations initiales sont exécutées avant l’injection des PV persistants. Une salle restaurée conserve ses instances et ses identifiants de requête, donc aucun spawn initial n’est rejoué.

## Progression et transitions

La complétion locale est enregistrée avant l’ouverture de la transition.

- salles 1 et 2 : la sortie devient disponible après victoire locale ;
- la transition est explicite et suit une connexion déclarée ;
- une salle déjà visitée est restaurée telle quelle ;
- salle 3 : la complétion est inscrite dans `completedRoomIds` avant la victoire globale ;
- la défaite d’équipe termine immédiatement l’expédition.

## Parcours joueur et diagnostic

Le parcours normal ne montre plus les commandes manuelles de Brouhaha ou de spawn. Un bouton distinct active le mode diagnostic, clairement identifié et persisté avec la sauvegarde d’expédition.

Le mode diagnostic ne modifie pas les règles du moteur. Il expose seulement des commandes techniques utiles aux tests et à l’inspection.

## Validation finale

La PR #67 a été revue sans fil bloquant. La validation finale comprend :

- formatage ;
- contenu ;
- TypeScript strict ;
- tests unitaires ;
- build ;
- validateur structurel ;
- Playwright sur Chromium bureau ;
- Playwright sur mobile paysage ;
- démarrage sans sauvegarde ;
- reprise sans replay ;
- transition vers la salle 2 ;
- victoire globale et rejeu ;
- populations initiales idempotentes ;
- décor riche et renforts dans la galerie ;
- diagnostic séparé.

Le workflow CI officiel a été restauré sans étape temporaire de diagnostic.

## Frontière avec les lots suivants

### Sprint 4.2 : prochaine phase

Le Sprint 4.2 doit définir les contrats détaillés des acteurs et comportements :

- `HeroDefinition` ;
- évolution de `CreatureDefinition` ;
- compétences et capacités ;
- profils d’IA déclaratifs ;
- interactions avec les objets ;
- influences du Brouhaha ;
- validation Zod et tests de frontières.

### Sprints 4.3 à 4.7

- quatre héros définitifs ;
- seize créatures de Bastognac ;
- IA, objets et Brouhaha ;
- enrichissement des salles 1 et 2 ;
- confrontation complète de la salle 3 ;
- équilibrage et audit de sortie.

### Sprint 5

Le Sprint 5 conserve les cinq étages générés, la topologie, les embranchements, la composition automatique des rencontres, le loot, la progression, la campagne et le Baron Pas-Très-Terrifiant.

## Décisions figées

- micro-donjon manuel de trois salles ;
- état d’expédition au-dessus des salles tactiques ;
- Brouhaha local à la salle ;
- populations initiales par le moteur de spawn ;
- complétion avant transition ;
- reprise sans replay ;
- mode diagnostic séparé ;
- aucun faux générateur ;
- Gargottex strictement en lecture seule.