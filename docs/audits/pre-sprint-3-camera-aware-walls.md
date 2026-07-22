# Stabilisation pré-Sprint 3 - Murs arrière et rotation caméra

## Contexte

Une validation sur iPad a montré que la vue initiale dessinait le mur sud au premier plan, alors que les deux murs visibles devaient former le fond nord-ouest de la salle. Le correctif est réalisé avant le Sprint 3 afin que les futurs objets interactifs et éléments muraux reposent sur une géométrie stable.

## Règle de rendu validée

La salle possède quatre côtés physiques permanents : nord, est, sud et ouest. La caméra n’affiche que les deux côtés situés à l’arrière de la vue courante.

| Rotation | Murs physiques rendus |
| ---: | --- |
| 0° | nord + ouest |
| 90° | nord + est |
| 180° | sud + est |
| 270° | sud + ouest |

Les murs devenus proches de l’utilisateur ne sont pas rendus et ne sont pas remplacés par une transparence. Les deux murs visibles sont projetés sur les côtés nord et ouest de la vue isométrique.

## Référentiels

Le lot distingue trois espaces :

1. **espace logique** : coordonnées de `RoomState`, utilisées par le moteur et la sauvegarde ;
2. **espace physique de salle** : quatre côtés et segments muraux stables ;
3. **espace de vue** : coordonnées transformées pour 0°, 90°, 180° ou 270°.

Une rotation ne modifie jamais les positions logiques. À 90° et 270°, largeur et hauteur visuelles sont échangées avant le calcul de projection et de caméra.

## Segments muraux

Chaque côté est découpé dynamiquement depuis les dimensions de la salle :

- nord et sud : `width` segments ;
- est et ouest : `height` segments.

Chaque segment possède un identifiant physique stable, par exemple `north:4` ou `east:2`. Cette convention prépare les futures portes, fenêtres, grilles, torches et décorations murales. Un élément restera rattaché à son côté et à son segment, puis sera visible uniquement lorsque ce côté appartient aux murs arrière de la caméra.

## Renderer

Le renderer applique une transformation commune aux :

- tuiles et overlays ;
- héros et ennemis ;
- obstacles ;
- murs visibles.

Une couche PixiJS `backWall` est placée entre le sol et les objets. Les murs périphériques sont ainsi toujours derrière les combattants et les obstacles. Les murs avant ne sont pas instanciés.

Le point d’ancrage des murs est calculé sur les arêtes extérieures des tuiles. Les deux orientations graphiques existantes restent utilisées selon le côté visuel nord ou ouest.

## Contrôle provisoire

L’interface ajoute un bouton `Pivoter la caméra de 90°` et un indicateur `Vue : 0°`, `90°`, `180°` ou `270°`.

Ce contrôle :

- ne consomme aucune action ;
- ne produit aucune règle de gameplay ;
- ne modifie pas `RoomState` ;
- n’est pas enregistré dans la sauvegarde version 1 ;
- revient à 0° après rechargement.

## Tests ajoutés

### Unitaires

- cycle complet des quatre rotations ;
- transformation logique vers vue et transformation inverse ;
- échange des dimensions visuelles ;
- sélection des deux murs arrière ;
- stabilité des identifiants physiques ;
- visibilité d’un élément mural fictif ;
- salles 5 × 6, 12 × 3 et 1 × 7.

### Playwright

- quatre rotations successives sur build de production ;
- deux murs physiques visibles par orientation ;
- conservation des coordonnées logiques des héros ;
- picking réel après rotation sur desktop et mobile paysage ;
- défilement jusqu’au point exact du canvas avant clic ou toucher ;
- retour à 0° après rechargement sans mutation de la sauvegarde ;
- maintien des tests de sprites et de fallbacks.

## Invariants

- moteur tactique inchangé ;
- `RoomState` inchangé ;
- sauvegarde version 1 inchangée ;
- manifeste et assets inchangés ;
- aucune mécanique du Sprint 3 ajoutée.

## Suivi

- Issue : #27 ;
- Pull Request : #28 ;
- branche : `fix/pre-sprint-3-camera-aware-walls`.

Le commit de fusion et le verdict CI final seront ajoutés lors de la clôture du lot.
