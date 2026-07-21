# Spécification de projection isométrique

## Coordonnées de référence

Le moteur continue de manipuler :

```ts
interface GridPosition {
  column: number;
  row: number;
}
```

Le renderer transforme cette position logique en position écran :

```ts
screenX = originX + ((column - row) * tileWidth) / 2;
screenY = originY + ((column + row) * tileHeight) / 2;
```

Valeurs initiales :

```ts
const tileWidth = 128;
const tileHeight = 64;
const halfTileWidth = 64;
const halfTileHeight = 32;
```

## Fonction pure attendue

```ts
export interface IsometricProjection {
  tileWidth: number;
  tileHeight: number;
  originX: number;
  originY: number;
}

export function gridToScreen(
  position: GridPosition,
  projection: IsometricProjection,
): { x: number; y: number };
```

Cette fonction ne dépend ni de PixiJS, ni du DOM, ni de la caméra.

## Picking écran vers grille

La conversion inverse commence par retirer l’origine :

```ts
const localX = screenX - originX;
const localY = screenY - originY;

const column = localX / tileWidth + localY / tileHeight;
const row = localY / tileHeight - localX / tileWidth;
```

Le résultat flottant ne doit pas être arrondi aveuglément. Le picking doit vérifier le losange candidat avec une équation locale ou utiliser des zones interactives PixiJS correspondant exactement aux tuiles rendues.

Pour le premier lot, la solution recommandée est :

1. rendre un objet interactif par tuile ;
2. conserver la position logique dans ses métadonnées ;
3. utiliser la conversion inverse uniquement pour les tests et les outils de caméra ;
4. ajouter un test spécifique aux bordures partagées entre deux losanges.

## Point d’ancrage

La position projetée d’une case représente le centre de son losange.

Pour un sprite de personnage :

```ts
sprite.anchor.set(0.5, 0.92);
sprite.position.set(screenX, screenY + tileHeight / 2);
```

L’ancrage réel pourra être ajusté par manifeste, mais il doit toujours désigner le contact au sol. La tête, l’arme et les accessoires peuvent dépasser de la case.

## Ordre de profondeur

Ordre recommandé :

```ts
const depth = Math.round((screenY + tileHeight / 2) * 1000) + tieBreaker;
```

Le `tieBreaker` doit être déterministe. Un identifiant stable ou un index de couche explicite est préférable au hasard ou à l’ordre d’arrivée asynchrone des textures.

Couches conceptuelles :

1. sol ;
2. overlays de sol ;
3. ombres ;
4. objets et combattants ;
5. murs avant avec traitement d’occlusion ;
6. effets et feedback ;
7. libellés temporaires de debug.

## Occlusion

Un mur ou objet haut ne doit jamais rendre une action essentielle impossible.

Le prototype doit prévoir au moins une stratégie :

- réduction d’opacité lorsque le héros actif se trouve derrière ;
- masquage temporaire au toucher ;
- séparation entre partie basse opaque et partie haute estompée ;
- caméra légèrement décalée sans rotation libre.

La stratégie finale sera choisie après test sur téléphone paysage.

## États de tuile

| État         | Rôle                           | Opacité indicative |
| ------------ | ------------------------------ | -----------------: |
| `base`       | sol sombre                     |                  1 |
| `alternate`  | variation visuelle             |                  1 |
| `reachable`  | déplacement autorisé           |               0,68 |
| `selected`   | héros ou case active           |               0,84 |
| `attackable` | cible valide                   |               0,76 |
| `blocked`    | collision ou case indisponible |               0,88 |

## Tests minimum

- origine `(0, 0)` ;
- quatre coins de la grille 8 × 4 ;
- symétrie des diagonales ;
- coordonnées négatives rejetées par le moteur ;
- picking au centre de chaque tuile ;
- picking près des quatre arêtes ;
- tri stable de deux sprites partageant le même `screenY` ;
- redimensionnement sans modification des positions logiques ;
- commandes DOM toujours opérationnelles lorsque le canvas est ignoré.
