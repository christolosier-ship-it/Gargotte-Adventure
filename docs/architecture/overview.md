# Architecture générale

## Vue d'ensemble

Gargotte Adventure est organisé en six responsabilités conceptuelles :

1. **contenu** : héros, créatures, compétences, profils, expéditions, salles, objets, réactions, renforts, spawn et assets ;
2. **orchestration d'expédition** : équipe, salle courante, progression, transitions et résultat global ;
3. **moteur tactique** : règles déterministes de salle, déplacement, combat, IA, Brouhaha, objets, réactions et renforts ;
4. **présentation pure** : transformation de l'état final et des événements ordonnés en cues visuels, audio et journal ;
5. **adaptateurs** : renderer PixiJS, audio Web Audio et UI DOM accessible ;
6. **plateforme** : PWA, IndexedDB, validation, tests, build et déploiement.

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB, ni d'un donjon particulier.

Le lot documentaire du Sprint 4 n'ajoute aucun package ni code. Il définit les responsabilités futures sans créer de dossier vide.

## Flux actuel d'une résolution tactique

```text
intention d'acteur
      │
      ▼
apps/game
      │
      ▼
packages/engine
      ├─ RoomState final
      └─ événements ordonnés
              │
              ├─ rendu stable
              ├─ packages/presentation
              │     ├─ cues visuels → renderer
              │     ├─ cues audio → audio
              │     └─ journal → UI
              └─ persistance asynchrone
```

La documentation reflète l'orchestration livrée observée : rendu stable, présentation, puis demande de persistance asynchrone. Le Sprint 4.0 doit confirmer ou ajuster ce contrat et ses tests.

L'interface et les adaptateurs n'implémentent aucune seconde version des règles.

## Flux cible du micro-donjon

```text
ExpeditionDefinition
        │
        ▼
ExpeditionState
        ├─ équipe persistante
        ├─ salle actuelle
        ├─ progression
        └─ RoomState par salle
                │
                ▼
        résolution tactique existante
                │
                ▼
        objectif et sortie locale
                │
                ▼
        transition explicite
                │
                ▼
        salle suivante ou résultat global
```

`ExpeditionState` orchestre sans réimplémenter déplacement, combat, objets, Brouhaha, renforts ou phase tactique.

## Contenu du Sprint 4

Le contenu futur distingue :

- `HeroDefinition` ;
- `HeroState` ou `HeroInstance` ;
- état persistant du héros dans l'expédition ;
- `CreatureDefinition` ;
- `CreatureInstance` ;
- compétences et capacités ;
- profils de comportement ;
- influences déclaratives du Brouhaha ;
- définition du micro-donjon ;
- définitions de salles et connexions ;
- placements ou demandes de spawn.

Définition, instance, placement et génération restent séparés.

## Moteur tactique

`packages/engine` contient actuellement :

- grille, cheminement et ligne de vue ;
- combat, tours et IA pilote ;
- spawn déterministe ;
- Brouhaha 0 à 12 ;
- objets interactifs ;
- réactions en chaîne FIFO ;
- renforts de seuil ;
- événements, historiques et erreurs métier.

Le Sprint 4 doit enrichir les intentions, compétences et décisions ennemies en réutilisant ces moteurs.

Les séquences métier sont monotones et persistées. Une migration n'exécute aucune règle runtime.

## Acteurs et comportements

Les profils de comportement sont génériques, combinables et déterministes.

```text
état de salle
→ définition et profils
→ intentions candidates
→ exclusions et priorités
→ départage stable
→ intention et explication
→ moteur de résolution
```

Les acteurs peuvent proposer une interaction avec un objet ou une variation de Brouhaha. Ils ne changent jamais directement l'état de l'objet ou le niveau de Brouhaha.

Voir [Héros, créatures et comportements](actors-and-behaviors.md).

## Expédition et salles

Le Sprint 4 utilise trois salles écrites à la main. `RoomState` reste local à une salle. Le Brouhaha, les ennemis, objets, réactions, renforts et objectifs locaux ne sont pas fusionnés dans un état global unique.

Seuls l'équipe, les propriétés persistantes validées des héros, la progression et le résultat appartiennent à `ExpeditionState`.

Voir [Micro-donjon et état d'expédition](micro-dungeon-and-expedition.md).

## Présentation

`packages/presentation` est pur et testable sans navigateur.

Il ne mute aucune entrée et groupe les événements d'une action racine. Les sorties visuelles et audio sont bornées, mais la version fusionnée ne garantit pas encore la conservation de toutes les conséquences prioritaires lorsque les plafonds sont dépassés. Ce point appartient au Sprint 4.0.

Un cue est transitoire et dérivé. Il n'est ni une définition éditoriale, ni une instance tactique, ni un plan généré.

## Renderer

`packages/renderer` projette l'état stable sur un plateau isométrique puis affiche les cues dans une couche dédiée.

Il gère caméra, picking, profondeur, assets, objets transitoires et diagnostics. Il ne décide jamais d'une interaction, réaction, apparition, victoire locale ou transition d'expédition.

## Audio

`packages/audio` joue des sons locaux Web Audio après déverrouillage utilisateur. Il respecte volume et mute, met en cache ses lecteurs et tolère les échecs.

La validation des préférences persistées et le redémarrage des tonalités répétées font partie du Sprint 4.0.

## UI

`packages/ui` fournit la coque accessible, le HUD, les contrôles audio et le journal groupé borné.

Le parcours normal du Sprint 4 doit masquer les commandes techniques. Le mode diagnostic reste distinct et identifiable.

## Sauvegarde

`packages/save` conserve actuellement `RoomState` version 6 dans IndexedDB. Les préférences audio et effets transitoires ne sont pas sauvegardés dans l'état tactique.

Le Sprint 4 devra ajouter une enveloppe d'expédition versionnée après définition de sa stratégie de migration. Il ne doit pas rendre global ce qui reste local aux salles.

## Reprise

Une reprise restaure l'état stable sans rejouer les événements historiques, sons, impacts ou apparitions. Dans le micro-donjon, elle devra restaurer l'expédition, la salle courante et l'état persistant des héros selon les mêmes principes.

## Structure active

```text
apps/game                 composition et orchestration
packages/engine           règles tactiques pures
packages/presentation     routage pur des événements
packages/renderer         scène PixiJS et effets transitoires
packages/audio            lecture locale, volume, mute et cache
packages/ui               interface et journal accessibles
packages/save             persistance et migrations
packages/content-schema   validation du contenu
packages/common           utilitaires partagés
content/bastognac         vertical slice éditorial
tests/e2e                 parcours bureau et mobile
```

L'architecture cible n'impose pas encore l'emplacement de `ExpeditionState` ou des profils. Ce choix de structure de fichiers relève de l'implémentation du Sprint 4.1 et 4.2, après la stabilisation 4.0.

## Frontière avec le Sprint 5

Le Sprint 4 écrit manuellement les trois salles. Il ne produit aucune topologie, géométrie ou rencontre par algorithme.

Le Sprint 5 produira des plans générés avant instanciation. Chaque salle possède son propre budget de menace. Le moteur de spawn restera l'exécutant des placements initiaux et renforts.

## Frontières externes

- Gargottex : source éditoriale consultée en lecture seule ;
- Google Drive : règles humaines, lore, médias maîtres et comptes rendus ;
- Figma / FigJam : écrans et diagrammes ;
- OpenAI API : absente de la boucle de jeu publique.

## Propriétés garanties ou requises

- déterminisme à entrées identiques ;
- état sérialisable et versionné ;
- packages sans cycles ;
- présentation sans mutation métier ;
- adaptateurs sans autorité tactique ;
- profils de comportement explicables ;
- intentions d'acteurs résolues par les moteurs ;
- Brouhaha local à chaque salle ;
- spawn comme frontière d'instanciation ;
- fonctionnement offline-first ;
- aucun secret côté client ;
- aucune dépendance runtime à Gargottex ;
- aucune génération du Sprint 5 dans le Sprint 4 ;
- aucune 3D ou WebAssembly sans besoin mesuré.

La couverture automatisée de `packages/presentation` par le validateur de frontières reste un P2 à résoudre au Sprint 4.0.
