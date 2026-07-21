# Pipeline runtime des assets isométriques

## Rôle

Le pipeline du Sprint 2B.1 charge les assets techniques sans rendre la logique tactique dépendante des textures. Le renderer conserve ses placeholders vectoriels lorsqu’un manifeste, une variante ou une texture est indisponible.

## Sources

- les sources maîtres restent sur Google Drive ;
- le dépôt ne contient que les exports runtime optimisés ;
- le manifeste runtime se trouve dans `apps/game/public/assets/isometric/manifest.json` ;
- le handoff de conception reste dans `design/isometric/asset-manifest.json`.

## Variantes et orientations

Un identifiant logique peut posséder plusieurs variantes orientées. L’unicité porte sur le couple `id + orientation`, et non sur l’identifiant seul. Cette règle permettra au lot 2B.2 de fournir deux vues dessinées d’un même personnage et leurs orientations miroir.

## Chargement et cache

`IsometricAssetRegistry` :

- résout l’asset direct, omnidirectionnel ou miroir ;
- évite les chargements en double par URL publique ;
- retourne un résultat explicite en cas d’échec ;
- expose le fallback déclaré sans interrompre la salle ;
- libère les textures chargées lors de sa destruction ;
- libère aussi une texture dont le chargement se termine après la destruction du renderer.

## GitHub Pages et PWA

Tous les chemins du manifeste sont relatifs à `assets/isometric/`. Le registre les combine avec `import.meta.env.BASE_URL`, afin de respecter le sous-chemin `/Gargotte-Adventure/` en production. Les fichiers SVG, WebP et le manifeste sont inclus dans le précache PWA.

## Validation

Les contrôles automatiques vérifient notamment :

- le schéma et sa version ;
- les variantes dupliquées ;
- les orientations et miroirs ;
- les fallbacks ;
- les chemins publics sûrs ;
- les formats SVG et WebP ;
- les budgets individuels et total ;
- les fichiers obligatoires et non déclarés ;
- l’absence de sources PDF, PSD et PNG dans le runtime.

## Test de panne

Playwright intercepte réellement le chargement d’un SVG technique et force son échec réseau. Le test vérifie ensuite que l’erreur est capturée, que le canvas reste visible et qu’un déplacement tactique par clic ou toucher fonctionne encore sur desktop et mobile paysage.
