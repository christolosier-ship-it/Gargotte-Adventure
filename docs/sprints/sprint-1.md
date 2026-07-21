# Sprint 1 — Rapport de clôture de la boucle tactique

- **Statut :** terminé
- **Pull Request :** #10
- **Fusion dans `main` :** 21 juillet 2026
- **Commit de fusion :** `fa9fb41089e56f830c5aa2b6c41a4ec0efdbc2ef`

## Objectif

Transformer le socle du Sprint 0 en une salle tactique jouable de bout en bout, sans supprimer la séparation entre moteur, contenu, renderer, interface et sauvegarde.

## Architecture conservée

Le Sprint 1 conserve et utilise :

- `apps/game` pour la composition de la PWA ;
- `packages/engine` pour les règles déterministes ;
- `packages/renderer` pour PixiJS ;
- `packages/ui` pour l’interface DOM accessible ;
- `packages/save` pour IndexedDB ;
- `packages/content-schema` pour Zod ;
- `content/bastognac` pour le scénario versionné.

`apps/game/src/main.ts` orchestre ces modules sans contenir les règles métier.

## Livré

### Salle et contenu

- grille 8 × 4 ;
- obstacles ;
- sélection de 1 à 4 héros ;
- Brünhilda la Torgnole ;
- Aelion Trois-Gorgées ;
- Magdalena Coquinelle ;
- Grompif Arcabidon ;
- Gobelin Bricoleur ;
- Gobelin Lance-Tout ;
- validation Zod des identifiants, positions, dimensions et collisions.

Les statistiques, positions et jetons restent provisoires.

### Moteur tactique

- trois actions par activation ;
- déplacement orthogonal ;
- cheminement déterministe ;
- cases atteignables ;
- portée ;
- ligne de vue supercover ;
- dégâts `max(1, ATK - DEF)` ;
- erreurs métier typées ;
- événements de déplacement, combat, activation et phase ;
- victoire et défaite immédiates.

### Machine de tour

- ordre libre d’activation des héros ;
- un seul héros actif ;
- changement de héros interdit pendant une activation ;
- fin anticipée d’une activation ;
- fin volontaire du tour des héros ;
- tour ennemi accessible uniquement pendant `enemy-turn` ;
- restauration des actions au tour suivant ;
- blocage des actions après victoire ou défaite.

### IA ennemie

- ordre stable ;
- choix déterministe de la cible ;
- recherche d’une case d’attaque libre ;
- prise en compte de la portée et de la ligne de vue ;
- déplacement d’une case ;
- attaque immédiate ou après déplacement ;
- explication structurée de la décision.

### Interface

- plateau PixiJS ;
- HUD ;
- héros actif et actions restantes ;
- cases atteignables ;
- cibles attaquables ;
- commandes tactiques DOM accessibles ;
- fonctionnement souris, clavier et tactile ;
- format téléphone et tablette en paysage ;
- manifeste PWA en français.

### Sauvegarde

- état complet de la salle ;
- héros sélectionnés ;
- positions, PV, actions, phase et tour ;
- reprise après rechargement ;
- détection d’une ancienne sauvegarde Sprint 0 ;
- rejet sûr des versions incompatibles et données corrompues.

## Revue et corrections intégrées

La première tentative du Sprint 1 a été abandonnée dans la PR #9. La PR #10 a été reconstruite depuis `main`, puis corrigée après revue.

Les corrections principales ont porté sur :

- restauration des quatre héros officiels ;
- calcul exact des cibles attaquables ;
- victoire et défaite immédiates ;
- IA respectant les obstacles et la ligne de vue ;
- verrouillage des phases ;
- véritable supercover aux coins des cases ;
- destruction des anciens objets PixiJS ;
- sauvegarde réaliste ;
- commandes accessibles ;
- suppression des clics Playwright dépendants de coordonnées fragiles.

## Validation

Le commit contrôlé avant fusion a passé :

- installation Node 24 et `npm ci` ;
- Prettier ;
- validation du contenu ;
- TypeScript strict ;
- tests unitaires ;
- build Vite/PWA ;
- validation du dépôt et scan des secrets ;
- installation Chromium ;
- Playwright desktop ;
- Playwright mobile paysage ;
- génération de l’artefact de production.

## Hors périmètre

- Brouhaha ;
- événements pairs et impairs ;
- objets et réactions du décor ;
- loot ;
- progression ;
- compétences définitives ;
- bestiaire complet ;
- animations et sons définitifs ;
- cinq étages et boss.

## Dette acceptée

- direction artistique temporaire ;
- statistiques non équilibrées ;
- seulement deux types d’ennemis ;
- une seule salle ;
- format de contenu encore local au dépôt ;
- absence de fichier Figma dédié aux écrans Sprint 1 ;
- documentation Drive du Sprint 1 non créée automatiquement lors du développement.

## Suite

Le Sprint 2 doit introduire le **Brouhaha et le décor interactif** sans casser les invariants suivants :

- déterminisme ;
- séparation moteur / rendu ;
- sauvegarde complète ;
- explication des événements ;
- jouabilité tactile ;
- tests desktop et mobile.
