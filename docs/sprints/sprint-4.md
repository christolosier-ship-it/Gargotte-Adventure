# Sprint 4 : micro-donjon, héros, créatures et comportements de Bastognac

## Statut

- Sprint 4.0 : ✅ terminé
- Issue Sprint 4.0 : #63
- PR fonctionnelle Sprint 4.0 : #64
- Commit fonctionnel stable : `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf`
- Sprint 4.1 : prochaine phase
- Périmètre fonctionnel : lots 4.1 à 4.7
- Génération procédurale : réservée au Sprint 5

Le Sprint 4.0 a définitivement stabilisé la présentation du Sprint 3.6. Les sept P2 post-fusion sont corrigés, les sept fils de revue sont résolus et la base est validée sur bureau et mobile paysage.

Voir [Audit du Sprint 4.0](../audits/sprint-4-0-stabilization.md).

## Résultat attendu du Sprint 4

Livrer un micro-donjon vertical de trois salles adjacentes, entièrement construit à la main, permettant de jouer une séquence proche du résultat final du jeu.

> Un joueur peut sélectionner son équipe, entrer dans trois salles fixes reliées, conserver l’état de ses héros, affronter plusieurs profils de créatures, utiliser ou subir le décor, gérer le Brouhaha et les renforts, comprendre les décisions de l’IA, passer d’une salle à l’autre puis atteindre une victoire ou une défaite sans commandes techniques dans le parcours normal.

## Socle stabilisé par le Sprint 4.0

Le socle désormais figé comprend :

- transitions réelles vers victoire et défaite présentées visuellement, textuellement et par audio ;
- préférences audio invalides ignorées sans écraser les valeurs par défaut ;
- plafonds de cues conservant les conséquences prioritaires ;
- tonalités répétées redémarrées sans superposition ;
- ordre runtime testé `rendu stable → présentation → persistance asynchrone` ;
- frontière automatisée `presentation → engine` uniquement ;
- sauvegarde tactique version 6 inchangée ;
- aucun fil P2 ouvert.

Le Sprint 4.1 peut s’appuyer sur ce socle sans rouvrir la mécanique de présentation.

## Structure du micro-donjon

```text
Préparation de l’expédition
          │
          ▼
┌─────────────────────────────┐
│ Salle 1                     │
│ Prise en main tactique      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Salle 2                     │
│ Décor, réactions, Brouhaha  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Salle 3                     │
│ Confrontation complète      │
└──────────────┬──────────────┘
               │
               ▼
Résultat du micro-donjon
```

Les salles sont adjacentes et reliées par des portes ou passages déclarés. La condition de sortie locale doit être remplie avant le transfert vers la salle suivante.

## Frontière Sprint 4 et Sprint 5

### Sprint 4 construit manuellement

- trois salles fixes ;
- leur ordre et leurs connexions ;
- leur géométrie, portes et passages ;
- leurs objectifs et conditions de sortie ;
- leurs populations et placements initiaux ;
- leurs objets, réactions et points de spawn ;
- leurs règles de renfort ;
- leurs conditions de victoire et de défaite ;
- la transition de l’équipe entre les salles.

Les populations initiales écrites à la main sont traduites en `SpawnRequest` déterministes lors de la première création d’une salle. Aucune `CreatureInstance` n’est construite directement par le contenu ou l’orchestrateur d’expédition.

### Sprint 5 générera

- les cinq étages ;
- la topologie et les embranchements ;
- la géométrie des salles ;
- la composition automatique des rencontres ;
- les budgets de menace propres à chaque salle ;
- le loot, la progression et la campagne ;
- le Baron Pas-Très-Terrifiant ;
- la reprise d’une expédition générée.

Le Sprint 4 ne crée aucun faux générateur provisoire.

## Salle 1 : prise en main tactique

- déplacement, portée et ligne de vue ;
- sélection et activation des héros ;
- attaque et compétences fondamentales ;
- premiers profils ennemis ;
- interactions simples avec le décor ;
- Brouhaha faible ;
- objectif local clair ;
- ouverture de la sortie.

Les réactions en chaîne restent courtes et faciles à expliquer.

## Salle 2 : décor, réactions et Brouhaha

- objets poussables et destructibles ;
- changements d’état et réactions en chaîne ;
- dégâts causés par le décor ;
- interactions des héros et créatures ;
- hausse et réduction du Brouhaha ;
- effets positifs, négatifs ou neutres ;
- franchissements de seuil ;
- renforts complets, partiels et refusés ;
- influences déclaratives du Brouhaha sur les comportements.

Elle propose plusieurs solutions tactiques et ne réduit pas la réussite à l’affrontement frontal.

## Salle 3 : confrontation complète

- plusieurs profils d’IA ;
- créatures basiques, tactiques et spéciales ;
- éventuellement une élite ou un mini-boss pilote ;
- utilisation ou destruction du décor par les ennemis ;
- Brouhaha intense ;
- renforts et réactions combinées ;
- compétences avancées des héros ;
- victoire et défaite globales ;
- écran final du micro-donjon.

Le véritable boss final reste réservé au Sprint 5.

## Phases de jeu

### Préparation

- présentation du micro-donjon ;
- sélection de un à quatre héros ;
- consultation rapide des rôles et compétences ;
- entrée dans la première salle.

### Première entrée dans une salle

- nom et objectif ;
- règle spéciale éventuelle ;
- Brouhaha initial ;
- portes et sorties ;
- demandes de spawn initiales ordonnées ;
- démarrage du premier tour.

Une reprise restaure les instances sauvegardées sans rejouer les demandes initiales.

### Tour des héros

Le joueur sélectionne un héros, se déplace, attaque, utilise une compétence, interagit avec un objet et termine son activation ou le tour des héros.

### Résolution

```text
intention
→ validation métier
→ conséquences directes
→ Brouhaha direct et renforts éventuels
→ réactions FIFO
→ Brouhaha et renforts secondaires
→ phase terminale éventuelle
→ rendu stable
→ présentation
→ persistance asynchrone
```

Le Sprint 4.0 a figé et testé les trois dernières étapes.

### Tour ennemi

Chaque créature choisit de manière déterministe entre attendre, se déplacer, attaquer, utiliser une capacité, agir sur un objet, protéger une zone ou réagir au Brouhaha.

Le journal explique les candidats utiles, la priorité retenue et le départage stable.

### Fin de salle

Toutes les conséquences sont résolues avant la complétion locale.

- salles 1 et 2 : la sortie devient disponible, puis l’état persistant des héros est transféré ;
- salle 3 : la complétion produit directement le résultat global.

Une victoire globale exige que la salle 3 figure dans `completedRoomIds`.

## État minimal d’expédition

`ExpeditionState` devra contenir :

- identifiant stable ;
- équipe sélectionnée ;
- salle actuelle ;
- ordre des trois salles ;
- salles visitées et terminées ;
- état persistant des héros ;
- états des salles ;
- statut global ;
- résultat final.

Persistent entre les salles : équipe, PV actuels, ressources explicitement persistantes et progression.

Restent locaux : Brouhaha, tour, phase tactique, ennemis, renforts, objets, réactions, objectif et condition de sortie.

Le Sprint 4.1 doit définir le schéma Zod, le format de sauvegarde, la version initiale et la migration de l’expédition avant les transitions inter-salles.

## Héros

Le Sprint 4 introduira un catalogue `HeroDefinition` distinct de l’état runtime et du placement initial.

Héros concernés :

- Brünhilda la Torgnole ;
- Aelion Trois-Gorgées ;
- Magdalena Coquinelle ;
- Grompif Arcabidon.

Chaque définition documentera rôle, statistiques, portée, mobilité, compétences, coûts, charges, interactions avec le décor, influence sur le Brouhaha, événements, UI et assets.

## Créatures de Bastognac

```text
CreatureDefinition
+ profil de comportement
+ placement éditorial
→ SpawnRequest
→ moteur de spawn
→ CreatureInstance
```

Les seize créatures documenteront catégorie, menace, statistiques, rôle, profil d’IA, capacités, objets, Brouhaha, priorité de cible, explications et assets.

## Profils d’IA

Profils génériques et combinables :

- mêlée ;
- tireur ;
- protecteur ;
- soutien ;
- opportuniste ;
- destructeur ;
- utilisateur du décor ;
- gardien d’objectif ;
- fuyard ;
- attiré ou perturbé par le bruit ;
- chef ou coordinateur.

```text
état de salle
→ profil
→ actions candidates
→ conditions et exclusions
→ priorités déterministes
→ départage stable
→ intention retenue et expliquée
→ résolution par les moteurs existants
```

Aucune architecture principale ne repose sur le nom d’une créature.

## Mode diagnostic

Le parcours joueur normal ne montre pas les commandes techniques.

Un mode diagnostic distinct pourra exposer Brouhaha manuel, spawn forcé, navigation directe, modification des PV, victoire ou défaite forcée et diagnostics internes.

## Découpage

### Sprint 4.0 : stabilisation finale du Sprint 3.6 ✅

Livré par la PR #64 au commit `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf` : sept P2 corrigés, revue résolue, CI complète verte et documentation de clôture.

### Sprint 4.1 : micro-donjon et phases de jeu

- `ExpeditionDefinition` et `ExpeditionState` ;
- sauvegarde et migration d’expédition ;
- trois salles fixes et connexions ;
- demandes de spawn initiales ;
- objectifs, portes et complétion ;
- transitions et persistance inter-salles ;
- résultat global et mode diagnostic.

### Sprint 4.2 : contrats des acteurs et comportements

`HeroDefinition`, évolution de `CreatureDefinition`, compétences, profils d’IA, objets, influences du Brouhaha et validation Zod.

### Sprint 4.3 : quatre héros

Rôles, statistiques, compétences, objets, Brouhaha, fiches et tests.

### Sprint 4.4 : bestiaire de Bastognac

Seize créatures, catégories, menace, capacités, profils, interactions, Brouhaha et assets progressifs.

### Sprint 4.5 : IA, objets et Brouhaha

Choix déterministe, utilisation ou évitement du décor, influences, explications et tests.

### Sprint 4.6 : salles 1 et 2

Prise en main, décor, réactions, Brouhaha, renforts, objectifs et transitions.

### Sprint 4.7 : salle 3 et intégration globale

Confrontation complète, résultat du micro-donjon, équilibrage, tutoriel, présentation, tests multi-formats et audit de sortie.

## Décisions figées

- micro-donjon manuel de trois salles adjacentes ;
- `ExpeditionState` minimal au-dessus des salles ;
- Brouhaha local à la salle ;
- profils génériques et déterministes ;
- acteurs producteurs d’intentions ;
- mode diagnostic séparé ;
- aucun faux générateur ;
- toutes les créatures instanciées par le moteur de spawn ;
- budget de menace par salle ;
- fonctionnement offline-first ;
- Gargottex strictement en lecture seule.

## Décisions ouvertes

- statistiques et capacités exactes des héros ;
- valeurs des seize créatures ;
- pondérations des profils d’IA ;
- ressources persistantes entre salles ;
- élite ou mini-boss pilote ;
- accélération finale du tour ennemi ;
- catalogue définitif des assets et sons ;
- équilibrage des salles, seuils et renforts.

## Validation attendue du Sprint 4 complet

- parcours normal sans commandes de diagnostic ;
- décisions ennemies déterministes et expliquées ;
- reprise cohérente dans les trois salles ;
- Brouhaha local et historique par salle ;
- populations initiales et renforts uniquement via le spawn ;
- salle 3 enregistrée comme terminée lors de la victoire ;
- aucun générateur du Sprint 5 ;
- tests unitaires, contenu, sauvegarde et Playwright ;
- desktop, tablette et mobile paysage ;
- audit final avant le Sprint 5.

## Références

- [Micro-donjon et état d’expédition](../architecture/micro-dungeon-and-expedition.md)
- [Héros, créatures et comportements](../architecture/actors-and-behaviors.md)
- [Présentation stabilisée](../architecture/presentation-and-finishing.md)
- [Audit Sprint 4.0](../audits/sprint-4-0-stabilization.md)
- [ADR-0008 : micro-donjon manuel](../adr/0008-hand-authored-micro-dungeon.md)
- [ADR-0009 : profils déclaratifs](../adr/0009-declarative-actor-behaviors.md)
- [Roadmap](../roadmap.md)
