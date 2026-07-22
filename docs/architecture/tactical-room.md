# Architecture - Salle tactique

## Responsabilités

La salle tactique est divisée en cinq responsabilités :

1. **Contenu** (`content/bastognac` et `packages/content-schema`) : définition et validation du scénario.
2. **Moteur** (`packages/engine/src/tactical`) : grille, déplacements, ligne de vue, combat, tours, IA, événements et erreurs métier.
3. **Renderer PixiJS** (`packages/renderer`) : projection isométrique de `RoomState`, transformation de vue, assets et remontée des intentions de sélection.
4. **UI DOM** (`packages/ui`) : sélection des héros, HUD, boutons de phase, rotation de contrôle, commandes accessibles et journal.
5. **Sauvegarde** (`packages/save`) : persistance IndexedDB versionnée et restauration défensive.

`apps/game/src/main.ts` relie ces responsabilités. Il ne décide pas si un déplacement, une attaque ou un changement de phase est valide.

## État de salle

`RoomState` contient au minimum :

- version du format ;
- identifiant du scénario ;
- largeur et hauteur ;
- obstacles ;
- héros et ennemis ;
- héros actif ;
- phase ;
- numéro de tour.

Chaque combattant possède un identifiant stable, une position, des PV, une attaque, une défense, une portée et un état vivant ou hors combat.

Les héros ajoutent :

- actions restantes ;
- activation terminée ou disponible.

L’état ne contient aucune coordonnée écran, texture, orientation de caméra ou référence PixiJS.

## Phases

```text
heroes-turn
    │
    ├─ tous les héros vivants terminent
    ▼
enemy-turn
    │
    ├─ IA résolue
    ▼
heroes-turn du tour suivant

À tout moment :
- dernier ennemi hors combat → victory
- dernier héros hors combat  → defeat
```

Une phase terminale refuse toute nouvelle action tactique.

Le joueur ne peut pas appeler directement le tour ennemi pendant `heroes-turn`. Deux opérations distinctes existent :

- terminer volontairement le tour des héros ;
- résoudre le tour ennemi lorsque la phase l’autorise.

## Activation des héros

- un héros vivant et non terminé peut être sélectionné ;
- un seul héros est actif à la fois ;
- changer de héros pendant une activation est interdit ;
- chaque héros commence avec trois actions ;
- une activation peut être terminée avant consommation des trois actions ;
- un héros terminé ne peut plus agir pendant ce tour ;
- lorsque tous les héros vivants ont terminé, la phase devient `enemy-turn`.

## Grille et déplacement

La salle pilote utilise une grille 8 × 4. Le renderer calcule néanmoins sa projection, ses murs et sa caméra depuis n’importe quelles dimensions valides.

Le moteur fournit :

- contrôle des limites ;
- voisins orthogonaux ;
- distance de Manhattan ;
- occupation par obstacles ou combattants ;
- cases atteignables ;
- chemin le plus court ;
- départage déterministe des chemins équivalents.

Un déplacement orthogonal d’une case coûte une action. Une destination plus éloignée est résolue comme une succession de pas unitaires, chacun produisant un événement et consommant une action.

Une intention invalide ne modifie pas l’état et ne consomme aucune action.

## Ligne de vue

La ligne de vue repose sur un algorithme **supercover** : toutes les cases touchées par le segment entre le centre de la case attaquante et celui de la case cible sont examinées.

Cette règle couvre notamment :

- lignes horizontales et verticales ;
- diagonales ;
- pentes faibles et fortes ;
- passage exactement au coin de deux cases.

Lorsqu’un segment passe par un coin, les deux cases latérales touchées sont considérées. Un obstacle ou une entité configurée comme bloquante peut donc interrompre la visibilité.

La cible elle-même n’est pas traitée comme un obstacle à sa propre attaque.

## Combat

Une attaque valide vérifie :

1. phase `heroes-turn` pour un héros ;
2. attaquant vivant et actif ;
3. action disponible ;
4. cible ennemie vivante ;
5. portée ;
6. ligne de vue.

Les dégâts sont déterministes :

```ts
const damage = Math.max(1, attacker.atk - target.def);
```

Une attaque valide :

- consomme une action ;
- réduit les PV ;
- met la cible hors combat à zéro PV ;
- produit les événements de combat ;
- recalcule immédiatement victoire ou défaite.

Le moteur expose également `getAttackableTargets` afin que le renderer et l’UI n’affichent que les cibles réellement valides.

## IA ennemie

Les ennemis sont résolus dans un ordre stable.

Pour chaque ennemi vivant :

1. rechercher les héros vivants ;
2. identifier les positions libres depuis lesquelles chaque cible peut être attaquée avec portée et visibilité ;
3. calculer les chemins déterministes vers ces positions ;
4. choisir le meilleur plan selon des critères stables ;
5. attaquer immédiatement si la cible est déjà valide ;
6. sinon avancer d’une case ;
7. attaquer après déplacement si la cible devient valide ;
8. sinon attendre.

L’IA ne cherche pas un chemin vers la case occupée par le héros. Elle cherche une **case d’attaque libre**.

Chaque décision peut produire une explication structurée comprenant cible, action, motif et chemin retenu.

## Présentation isométrique

### Projection et caméra

Le renderer utilise une projection 2D isométrique 128 × 64 :

```text
screenX = originX + (column - row) × tileWidth / 2
screenY = originY + (column + row) × tileHeight / 2
```

Les bornes de la salle, le scale et le centrage sont recalculés depuis les dimensions visuelles et le viewport.

La caméra de contrôle possède quatre orientations : `0°`, `90°`, `180°` et `270°`. La rotation ne modifie jamais les coordonnées logiques. Elle transforme uniquement les positions avant projection.

À `90°` et `270°`, largeur et hauteur visuelles sont échangées. La transformation inverse permet de retrouver exactement la position logique d’origine.

### Référentiels

Le renderer distingue :

1. **espace logique** : positions de `RoomState` ;
2. **espace physique de salle** : quatre côtés permanents et segments muraux stables ;
3. **espace de vue** : positions transformées selon la caméra ;
4. **espace écran** : projection isométrique et fit responsive.

Les tuiles, overlays, héros, ennemis, obstacles et murs passent par la même transformation de vue.

### Murs périphériques

La salle possède quatre côtés physiques : nord, est, sud et ouest.

Chaque côté est découpé depuis les dimensions de la salle :

- nord et sud : `width` segments ;
- est et ouest : `height` segments.

Chaque segment possède un identifiant stable, par exemple `north:4` ou `east:2`. Les futures portes, fenêtres, grilles et décorations pourront être rattachées à ce couple côté-segment sans dépendre de l’angle de caméra.

Seuls les deux murs situés à l’arrière de la vue courante sont rendus :

| Rotation | Murs physiques visibles |
| ---: | --- |
| 0° | nord + ouest |
| 90° | nord + est |
| 180° | sud + est |
| 270° | sud + ouest |

Les murs devenus proches de l’utilisateur ne sont pas instanciés. Ils ne sont ni conservés devant les unités ni remplacés par une transparence.

Les deux murs visibles sont projetés sur les côtés nord et ouest de l’image et utilisent les deux orientations graphiques existantes. Leur ancrage repose sur les arêtes extérieures des tuiles, pas sur un décalage arbitraire depuis le centre de case.

### Couches

Le plateau distingue :

1. fond ;
2. sol ;
3. murs arrière ;
4. objets et combattants ;
5. premier plan réservé aux effets futurs ;
6. interface canvas.

La couche `backWall` est située entre le sol et les objets. Les murs périphériques visibles restent donc derrière les héros, ennemis et obstacles.

Le tri interne des objets utilise une profondeur stable dérivée de la position projetée et d’un offset de catégorie.

### Picking

- chaque tuile possède une hit area polygonale correspondant au losange logique ;
- les combattants possèdent une zone tactile explicite ;
- les textures et leurs pixels transparents ne décident jamais du picking ;
- clic et toucher produisent les mêmes intentions métier que les commandes DOM ;
- les cellules conservent leur position logique comme donnée d’événement après rotation ;
- murs et obstacles visuels utilisent `eventMode = none`.

Le test navigateur amène le point ciblé dans le viewport avant de cliquer ou toucher, puis recalcule sa position. Cette règle protège les écrans paysage où le canvas peut être plus haut que la fenêtre visible.

### Assets et fallbacks

Le manifeste runtime versionné décrit :

- identifiants ;
- catégories ;
- chemins ;
- formats SVG ou WebP ;
- dimensions ;
- ancrages ;
- orientations ;
- miroirs ;
- fallbacks ;
- budgets.

Le registre centralisé met les textures en cache, capture les erreurs et conserve les formes vectorielles de secours si un asset ne charge pas.

Les assets pilotes actuels comprennent Brünhilda, le Gobelin Bricoleur, deux sols, deux murs, un tonneau, une ombre et un effet d’impact technique.

### Cycle de vie

Les objets graphiques retirés lors d’une reconstruction sont détruits. Le registre libère les textures lors de la destruction du renderer, y compris lorsqu’un chargement se termine tardivement.

Un compteur de génération empêche un asset chargé en retard d’être réinséré dans une scène déjà reconstruite.

## DOM accessible

Les mêmes actions sont exposées sous forme de commandes DOM nommées :

- activer un héros ;
- se déplacer vers une case disponible ;
- attaquer une cible valide ;
- terminer l’activation ;
- terminer le tour des héros ;
- résoudre le tour ennemi.

Un bouton provisoire `Pivoter la caméra de 90°` modifie uniquement la présentation. Il ne consomme aucune action et reste séparé des commandes tactiques.

Ces commandes servent l’accessibilité clavier et offrent une voie de jeu indépendante du canvas.

Le bouton de lancement reste désactivé jusqu’à la fin de l’initialisation du renderer et des sauvegardes.

## Sauvegarde

La sauvegarde tactique contient :

- type et version ;
- héros sélectionnés ;
- état complet de la salle ;
- positions ;
- PV ;
- actions ;
- activations terminées ;
- phase ;
- tour.

Le chargement :

- restaure une sauvegarde compatible ;
- reconnaît une ancienne sauvegarde Sprint 0 ;
- rejette sans planter une version incompatible ;
- rejette les données corrompues.

La sauvegarde reste en version 1. L’orientation de caméra n’est pas persistée et revient à `0°` après rechargement.

## Contenu Bastognac actuel

Le scénario contient :

- Brünhilda la Torgnole ;
- Aelion Trois-Gorgées ;
- Magdalena Coquinelle ;
- Grompif Arcabidon ;
- Gobelin Bricoleur ;
- Gobelin Lance-Tout ;
- deux obstacles.

Brünhilda et le Gobelin Bricoleur disposent d’un sprite pilote. Les autres combattants restent en placeholders. Les statistiques et positions restent provisoires.

## Tests

### Unitaires

- grille et chemins ;
- supercover et visibilité ;
- dégâts et erreurs invalides ;
- cibles attaquables ;
- activation et phases ;
- victoire et défaite ;
- IA visible, bloquée ou inaccessible ;
- validation du contenu ;
- sauvegarde, migration et corruption ;
- projection, conversion inverse, caméra et profondeur ;
- transformations 0°, 90°, 180° et 270° ;
- dimensions visuelles rectangulaires ;
- côtés arrière et segments muraux stables ;
- manifeste, registre, cache, fallbacks, poids et dimensions.

### Playwright

Sur build de production :

- sélection des héros officiels ;
- lancement de la salle ;
- activation ;
- déplacement et consommation d’action ;
- clic et toucher réels sur le canvas ;
- picking logique après rotation ;
- quatre orientations successives ;
- deux murs physiques visibles par orientation ;
- verrouillage des phases ;
- tour ennemi ;
- sauvegarde et restauration exacte ;
- retour de la caméra à 0° après rechargement ;
- victoire reproductible ;
- service worker et assets précachés ;
- chargement des sprites et de l’environnement ;
- panne d’un sprite, d’un sol, d’un mur et du tonneau ;
- desktop et mobile paysage tactile.

## Limites actuelles

La version stabilisée avant le Sprint 3 n’implémente pas encore :

- portes, fenêtres ou grilles décrites dans le contenu ;
- Brouhaha ;
- objets interactifs ;
- réactions du décor ;
- compétences définitives ;
- loot et progression ;
- bestiaire complet ;
- micro-animations de déplacement ou d’impact ;
- sons définitifs ;
- plusieurs salles ou étages ;
- baseline quantitative de performance.
