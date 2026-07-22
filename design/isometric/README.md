# Handoff isométrique du Sprint 2

Ce dossier transforme la direction artistique du Sprint 2 en contrat exploitable par le renderer et par les outils de production.

## Sources de vérité

- **Figma Design** : [Gargotte Adventure — Sprint 2 — Système isométrique](https://www.figma.com/design/Fx1ZqDlMwsfdfdyjDYJDBE)
- **Google Drive** : documents de cadrage et médias maîtres
- **GitHub** : géométrie, tokens, manifestes, exports runtime et critères d’acceptation
- **Moteur** : coordonnées logiques `column` et `row`, indépendantes du rendu

## Invariants

1. La grille logique reste orthogonale et inchangée.
2. L’isométrie appartient exclusivement au renderer.
3. Une tuile mesure `128 × 64` unités de référence.
4. Le point d’ancrage d’un sprite correspond au contact des pieds avec le sol.
5. Le tri de profondeur est déterministe.
6. Les commandes DOM accessibles restent fonctionnelles.
7. Les illustrations Drive sont des sources artistiques, pas des assets runtime directs.
8. Aucun rig, squelette, modèle 3D ou moteur 3D n’est introduit.
9. Le renderer ne connaît aucun identifiant propre à un donjon.

## État courant

Le Sprint 2 est livré :

- projection isométrique et picking ;
- caméra responsive avec quatre rotations ;
- quatre côtés physiques et deux murs arrière rendus ;
- sols et murs Bastognac ;
- tonneau pilote ;
- ombre au sol ;
- Brünhilda et Gobelin Bricoleur en WebP transparent ;
- manifeste runtime, cache et fallbacks ;
- contrôles desktop et mobile paysage.

Les exports pilotes ne sont plus à produire. Leurs dimensions, poids et empreintes sont consignés dans `asset-manifest.json` et `source-art.md`.

## Fichier Figma

Le fichier contient notamment :

- primitives et rôles de couleur ;
- géométrie 128 × 64 ;
- typographie et ombre de panneau ;
- composant `Iso / Tile` avec six variants ;
- composant `Iso / Wall` avec deux orientations.

Nœuds de référence :

| Élément                  | Nœud Figma |
| ------------------------ | ---------- |
| Couverture               | `5:2`      |
| Palette                  | `5:32`     |
| Typographie et géométrie | `5:72`     |
| Variants de tuile        | `6:14`     |
| Variants de mur          | `7:10`     |

Les composants Figma non produits ne bloquent pas le runtime. Le handoff versionné reste la référence exécutable lorsque les droits ou quotas du service externe sont limités.

## Fichiers du handoff

- `tokens.json` : source machine-readable pour le renderer ;
- `tokens.css` : projection CSS chargée par l’application ;
- `asset-manifest.json` : sources, transformations et état des composants ;
- `projection-spec.md` : projection, picking, profondeur et ancrage ;
- `runtime-pipeline.md` : règles du manifeste et des exports ;
- `source-art.md` : traçabilité Drive et transformations ;
- `reference-board.svg` : blueprint autonome du plateau 8 × 4 ;
- `codex-task.md` : brief historique du lot 2A.1, désormais terminé.

## Frontière runtime

Les assets chargés par le jeu résident dans `apps/game/public/assets/isometric`. Le fichier `apps/game/src/bastognac.ts` fournit au renderer générique le catalogue d’assets propre au donjon.

Le manifeste runtime reste responsable des formats, dimensions, ancrages, orientations, fallbacks et budgets. Les formes PixiJS locales constituent le dernier secours jouable en cas de panne de texture.

## Production future

Les nouveaux assets suivent l’ordre suivant :

1. source maître sur Drive ou Figma ;
2. transformation documentée ;
3. export SVG ou WebP optimisé ;
4. déclaration dans le manifeste runtime ;
5. ajout au catalogue applicatif du donjon ;
6. tests de chargement, panne et picking ;
7. mesure du poids avant fusion.
