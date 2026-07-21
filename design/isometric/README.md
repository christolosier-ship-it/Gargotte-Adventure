# Handoff isométrique du Sprint 2

Ce dossier transforme la direction artistique du Sprint 2 en contrat exploitable par Codex et par `packages/renderer`.

## Sources de vérité

- **Figma Design** : [Gargotte Adventure — Sprint 2 — Système isométrique](https://www.figma.com/design/Fx1ZqDlMwsfdfdyjDYJDBE)
- **Google Drive** : document `Gargotte Adventure — Sprint 2 — Cadrage plateau isométrique`
- **GitHub** : géométrie, tokens, manifeste et critères d’acceptation versionnés dans ce dossier
- **Moteur** : coordonnées logiques `column` et `row`, indépendantes du rendu

## État du fichier Figma

Le fichier contient actuellement :

- trois collections de variables ;
- les primitives de couleur issues du CSS actuel ;
- les rôles sémantiques du plateau et des états tactiques ;
- les dimensions 128 × 64 et les règles d’ancrage ;
- les styles typographiques et l’ombre de panneau ;
- une couverture et deux planches de fondations ;
- le composant `Iso / Tile` avec six variants ;
- le composant `Iso / Wall` avec deux orientations.

Nœuds de référence :

| Élément                  | Nœud Figma |
| ------------------------ | ---------- |
| Couverture               | `5:2`      |
| Palette                  | `5:32`     |
| Typographie et géométrie | `5:72`     |
| Variants de tuile        | `6:14`     |
| Variants de mur          | `7:10`     |

La limite d’appels MCP du plan Figma Starter a interrompu la création après les murs. Les composants restant à construire dans Figma sont listés dans `asset-manifest.json`. Les spécifications présentes ici permettent néanmoins de démarrer le renderer sans ambiguïté.

## Invariants

1. La grille logique reste orthogonale et inchangée.
2. L’isométrie appartient exclusivement au renderer.
3. Une tuile mesure `128 × 64` unités de référence.
4. Le point d’ancrage d’un sprite correspond au contact des pieds avec le sol.
5. Le tri de profondeur est déterministe.
6. Les commandes DOM accessibles restent fonctionnelles.
7. Les illustrations Drive sont des sources artistiques, pas des assets runtime prêts à charger.
8. Aucun rig, squelette, modèle 3D ou moteur 3D n’est introduit.

## Personnages pilotes

- **Brünhilda la Torgnole** : source Drive `1PVT0BKb_zf9f3A01gFneRvdXxYYe3hKG`
- **Gobelin Bricoleur** : visuel identifié dans `bestiaire_creatures_standards.pdf`, source Drive `1tydL8kQSblMp8N1nsP0xgVxIEE-pCCXy`

Les deux illustrations possèdent encore un arrière-plan. Elles doivent être détourées, cadrées et exportées avec transparence avant intégration dans `apps/game`.

## Fichiers du handoff

- `tokens.json` : valeurs machine-readable ;
- `tokens.css` : correspondance CSS proposée ;
- `asset-manifest.json` : composants, sources, formats et statut ;
- `projection-spec.md` : projection, picking, profondeur et ancrage ;
- `codex-task.md` : premier lot de développement recommandé ;
- `reference-board.svg` : blueprint autonome du plateau 8 × 4.

## Ordre recommandé pour Codex

1. implémenter et tester `gridToScreen` ;
2. implémenter et tester le picking écran vers grille ;
3. rendre les tuiles avec les états décrits dans `tokens.json` ;
4. ajouter le tri de profondeur ;
5. rendre murs, obstacles et ombres avec placeholders vectoriels ;
6. intégrer les sprites détourés seulement après validation du prototype ;
7. conserver les résultats du moteur et les sauvegardes à l’identique.
