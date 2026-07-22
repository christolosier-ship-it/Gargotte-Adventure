# Désendettement structurel pré-Sprint 3

- Issue : #29
- Pull Request : #30
- Branche : `refactor/pre-sprint-3-structural-debt`
- Périmètre : architecture, validation, tests, documentation et configuration
- Gameplay : inchangé

## Objectif

Réduire la concentration de responsabilités avant l’introduction du Brouhaha, des objets interactifs et des réactions en chaîne. Le chantier transforme les fondations du Sprint 2 sans ajouter de mécanique du Sprint 3.

## Orchestrateur applicatif

L’ancien `apps/game/src/main.ts` assemblait directement contenu, moteur, renderer, UI, sauvegarde, actions tactiques et installation PWA.

La composition est désormais répartie ainsi :

- `main.ts` : point d’entrée minimal ;
- `bootstrap.ts` : assemblage des dépendances ;
- `bastognac.ts` : contenu validé et catalogue visuel du donjon ;
- `game-controller.ts` : cycle de jeu et intentions utilisateur ;
- `tactical-actions.ts` : commandes DOM dynamiques ;
- `persistence-controller.ts` : restauration et file d’écriture ;
- `pwa-install.ts` : installation de la PWA.

## Renderer

Le renderer ne contient plus d’identifiant propre à Bastognac. L’application lui fournit un `TabletopAssetCatalog` décrivant le titre, les sols, murs, obstacles, ombre et sprites disponibles.

Le rendu est découpé entre :

- registre et schéma d’assets ;
- catalogue générique ;
- contexte de scène ;
- chargement asynchrone des sprites ;
- diagnostics ;
- primitives graphiques ;
- environnement ;
- combattants ;
- composition de salle ;
- cycle de vie PixiJS et caméra.

La couche vide `foreground` et l’API sans effet `setExpeditionActive` ont été retirées. Les coordonnées logiques, la caméra, le picking et les fallbacks restent inchangés.

## Sauvegardes

Les sauvegardes ne sont plus acceptées sur la seule présence d’un champ `phase`. Des schémas Zod vérifient désormais en profondeur :

- version et phase ;
- dimensions et coordonnées ;
- héros et ennemis ;
- PV, état vivant et blocage ;
- actions restantes ;
- identifiants uniques ;
- occupation des cases ;
- héros actif ;
- sélection de l’équipe.

La connexion IndexedDB est réutilisée et les écritures applicatives sont sérialisées afin d’éviter les courses entre sauvegardes successives.

## Tests et garde-fous

Les helpers Playwright liés au canvas, à la caméra, au picking et aux statuts d’assets sont mutualisés dans `tests/e2e/helpers/canvas.ts`.

La validation du dépôt contrôle maintenant :

- frontières d’import entre packages ;
- absence de cycles de packages ;
- taille maximale des modules principaux ;
- neutralité du renderer vis-à-vis des donjons ;
- caractère minimal de `main.ts` ;
- absence de l’icône publique dupliquée ;
- synchronisation des couleurs entre `tokens.json` et `tokens.css` ;
- présence des documents structurants dans l’index.

## Nettoyage

- copie inutilisée `public/icon.svg` supprimée ;
- label de build centralisé sur `Sprint 2` ;
- template HTML de l’UI séparé de sa logique ;
- tokens CSS de conception chargés par le runtime ;
- validateur de contenu branché sur l’API publique du renderer ;
- noms historiques du workflow et de l’artefact de verrouillage supprimés ;
- manifeste de conception aligné sur les vrais assets runtime ;
- brief Codex 2A.1 explicitement classé comme historique.

## Suivi Drive

Le suivi humain est conservé dans le document Google Drive `Gargotte Adventure - Désendettement pré-Sprint 3`.

## Validation finale

Le chantier est stabilisé sans modification des règles tactiques. Les contrôles suivants sont tous verts :

- formatage Prettier ;
- validation du contenu et des assets ;
- TypeScript strict ;
- tests unitaires ;
- build de production ;
- validation du dépôt et des frontières d’architecture ;
- Repository quality ;
- Playwright Chromium desktop ;
- Playwright mobile paysage ;
- scénarios de sauvegarde et reprise ;
- rotation et picking logique ;
- chargement, retard et panne des assets ;
- victoire reproductible.

La Pull Request reste ouverte pour le contrôle final de l’utilisateur. Elle n’est pas fusionnée automatiquement.
