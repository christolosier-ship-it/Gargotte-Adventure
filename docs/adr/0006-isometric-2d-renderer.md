# ADR-0006 — Plateau 2D isométrique sous PixiJS

- Statut : Accepté
- Date : 2026-07-21

## Contexte

Le Sprint 1 valide la boucle tactique sur une grille logique 8 × 4 avec un renderer PixiJS provisoire en vue orthogonale. La direction visuelle finale doit donner davantage de profondeur au plateau sans introduire la complexité, le poids et le pipeline d’une véritable scène 3D.

Le moteur tactique manipule déjà uniquement des coordonnées de grille, des obstacles, des portées, des lignes de vue et des états déterministes. Il ne dépend pas des coordonnées écran ni de la perspective.

## Décision

Gargotte Adventure adopte un plateau **2D isométrique** rendu par PixiJS.

Les invariants suivants sont retenus :

- le moteur continue de travailler sur une grille 2D en colonnes et lignes ;
- la projection isométrique appartient exclusivement au renderer ;
- PixiJS reste la technologie de rendu du plateau ;
- le DOM reste utilisé pour le HUD et les commandes accessibles ;
- les personnages sont des sprites 2D fixes ou très légèrement animés ;
- aucun rig, squelette, modèle 3D ou moteur 3D n’est introduit ;
- les animations légères reposent sur interpolation, translation, échelle, rotation, opacité et éventuellement quelques frames ;
- les interactions tactiles et les commandes DOM continuent d’appeler les mêmes intentions métier ;
- la projection visuelle ne modifie ni portée, ni ligne de vue, ni déplacement, ni sauvegarde.

## Projection de référence

Pour une case logique `(column, row)` :

```text
screenX = originX + (column - row) × tileWidth / 2
screenY = originY + (column + row) × tileHeight / 2
```

Les dimensions exactes restent à valider pendant le prototype. La cible initiale recommandée est une tuile de ratio 2:1, par exemple 128 × 64 pixels.

## Ordre de profondeur

Les tuiles, obstacles, personnages et effets sont triés selon leur position projetée. L’ordre doit rester déterministe et stable en cas d’égalité.

Les points d’ancrage des sprites représentent le contact au sol, généralement au niveau des pieds. Les éléments graphiques peuvent dépasser de leur case sans modifier leur position logique.

## Personnages et animations

La première version du pipeline artistique vise :

- une ou deux orientations dessinées par personnage ;
- miroir horizontal lorsque cela ne dégrade pas la lisibilité ;
- pose d’attente fixe ou respiration très légère ;
- déplacement interpolé entre deux cases ;
- courte impulsion lors d’une attaque ;
- recul, flash ou variation d’échelle à l’impact ;
- état KO simple ;
- aucune animation squelettique.

## Conséquences positives

- identité visuelle plus forte dès le Sprint 2 ;
- conservation complète du moteur tactique existant ;
- maintien de bonnes performances sur téléphone et tablette ;
- production d’assets beaucoup plus légère qu’en 3D ;
- compatibilité avec Codex, Figma, GitHub et un pipeline d’images 2D ;
- lecture tactique conservée ;
- possibilité d’enrichir progressivement les décors et effets.

## Compromis et risques

- le tri de profondeur et les objets hauts demandent une convention stricte ;
- les murs peuvent masquer des cases ou personnages ;
- le picking doit convertir correctement écran et grille ;
- les assets doivent partager angle, échelle, éclairage et point d’ancrage ;
- la multiplication d’images individuelles peut alourdir la PWA sans atlas ni budget d’assets ;
- une perspective incohérente entre assets serait immédiatement visible.

## Hors périmètre

- véritable rendu 3D ;
- rotation libre de caméra ;
- rigging ;
- animation squelettique ;
- modèles GLTF ;
- éclairage 3D temps réel ;
- modification des règles de déplacement ou de combat.

## Réévaluation

Après validation du prototype Sprint 2 sur téléphone et tablette paysage, avec mesure des performances, du poids des assets, de la lisibilité et de la précision des interactions tactiles.
