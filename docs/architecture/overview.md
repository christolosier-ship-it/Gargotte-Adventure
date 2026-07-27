# Architecture générale

## Vue d'ensemble

Gargotte Adventure est organisé en cinq couches :

1. **contenu** : héros, créatures, salles, objets, réactions, renforts, spawn et assets ;
2. **moteur** : règles déterministes, déplacement, combat, IA, Brouhaha, objets, réactions et renforts ;
3. **présentation pure** : transformation des événements ordonnés en cues visuels, audio et journal ;
4. **adaptateurs** : renderer PixiJS, audio Web Audio et UI DOM accessible ;
5. **plateforme** : PWA, IndexedDB, validation, tests, build et déploiement.

Le moteur ne dépend ni du DOM, ni de PixiJS, ni d'IndexedDB, ni d'un donjon particulier.

## Flux principal

```text
interaction joueur
      │
      ▼
apps/game
      │
      ▼
packages/engine
      ├─ RoomState final
      └─ événements ordonnés
              │
              ├─ sauvegarde IndexedDB
              ├─ rendu stable
              └─ packages/presentation
                    ├─ cues visuels → renderer
                    ├─ cues audio → audio
                    └─ journal → UI
```

L'interface et les adaptateurs n'implémentent aucune seconde version des règles.

## Moteur tactique

`packages/engine` contient :

- grille, cheminement et ligne de vue ;
- combat, tours et IA ;
- spawn déterministe ;
- Brouhaha 0–12 ;
- objets interactifs ;
- réactions en chaîne FIFO ;
- renforts de seuil ;
- événements, historiques et erreurs métier.

Les séquences métier sont monotones et persistées. Une migration n'exécute aucune règle runtime.

## Présentation

`packages/presentation` est pur et testable sans navigateur.

Il conserve l'ordre causal, ne mute aucune entrée, borne ses sorties et groupe les événements d'une action racine.

Un cue est transitoire et dérivé. Il n'est ni une définition éditoriale, ni une instance tactique, ni un plan généré.

## Renderer

`packages/renderer` projette l'état stable sur un plateau isométrique puis affiche les cues dans une couche dédiée.

Il gère caméra, picking, profondeur, assets, objets transitoires et diagnostics. Il ne décide jamais d'une interaction, réaction, apparition ou victoire.

## Audio

`packages/audio` joue des sons locaux Web Audio après déverrouillage utilisateur. Il respecte volume et mute, met en cache ses lecteurs et tolère les échecs.

## UI

`packages/ui` fournit la coque accessible, le HUD, les contrôles audio et le journal groupé borné.

## Sauvegarde

`packages/save` conserve `RoomState` version 6 dans IndexedDB. Les préférences audio et effets transitoires ne sont pas sauvegardés dans l'état tactique.

## Reprise

Une reprise restaure l'état stable sans rejouer les événements historiques, sons, impacts ou apparitions.

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

## Génération future

Le Sprint 5 produira topologie, géométrie et rencontres avant instanciation. Chaque salle possède son propre budget de menace. Le moteur de spawn restera l'exécutant des plans générés.

## Frontières externes

- Gargottex : source éditoriale consultée en lecture seule ;
- Google Drive : règles humaines, lore, médias maîtres et comptes rendus ;
- Figma / FigJam : écrans et diagrammes ;
- OpenAI API : absente de la boucle de jeu publique.

## Propriétés garanties

- déterminisme à entrées identiques ;
- état sérialisable et versionné ;
- packages sans cycles ;
- présentation sans mutation métier ;
- adaptateurs sans autorité tactique ;
- fonctionnement offline-first ;
- aucun secret côté client ;
- aucune dépendance runtime à Gargottex ;
- aucune 3D ou WebAssembly sans besoin mesuré.
