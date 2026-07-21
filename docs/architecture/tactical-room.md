# Architecture — Salle tactique

## Responsabilités

La salle tactique est divisée en cinq responsabilités :

1. **Contenu** (`content/bastognac` et `packages/content-schema`) : définition et validation du scénario.
2. **Moteur** (`packages/engine/src/tactical`) : grille, déplacements, ligne de vue, combat, tours, IA, événements et erreurs métier.
3. **Renderer PixiJS** (`packages/renderer`) : projection visuelle de `RoomState` et remontée des intentions de sélection.
4. **UI DOM** (`packages/ui`) : sélection des héros, HUD, boutons de phase, commandes accessibles et journal.
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

La salle du Sprint 1 utilise une grille 8 × 4.

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

## Présentation

### PixiJS

Le renderer affiche :

- grille ;
- obstacles ;
- héros ;
- ennemis ;
- PV ;
- héros actif ;
- cases atteignables ;
- cibles attaquables.

Les objets graphiques retirés lors d’une reconstruction sont détruits afin d’éviter l’accumulation de textures, listeners ou objets GPU.

### DOM accessible

Les mêmes actions sont également exposées sous forme de commandes DOM nommées :

- activer un héros ;
- se déplacer vers une case disponible ;
- attaquer une cible valide ;
- terminer l’activation ;
- terminer le tour des héros ;
- résoudre le tour ennemi.

Ces commandes servent l’accessibilité clavier et rendent les tests Playwright indépendants de coordonnées de canvas fragiles.

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

## Contenu Bastognac du Sprint 1

Le scénario actuel contient :

- Brünhilda la Torgnole ;
- Aelion Trois-Gorgées ;
- Magdalena Coquinelle ;
- Grompif Arcabidon ;
- Gobelin Bricoleur ;
- Gobelin Lance-Tout ;
- deux obstacles.

Les statistiques et positions restent provisoires. Le moteur ne connaît aucun de ces noms.

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
- sauvegarde, migration et corruption.

### Playwright

Sur build de production :

- sélection des héros officiels ;
- lancement de la salle ;
- activation ;
- déplacement et consommation d’action ;
- verrouillage des phases ;
- tour ennemi ;
- sauvegarde et restauration exacte ;
- victoire reproductible ;
- manifeste français et service worker ;
- desktop et mobile paysage tactile.

## Limites actuelles

Le Sprint 1 n’implémente pas encore :

- Brouhaha ;
- objets interactifs ;
- réactions du décor ;
- compétences définitives ;
- loot et progression ;
- bestiaire complet ;
- animations et sons définitifs ;
- plusieurs salles ou étages.
