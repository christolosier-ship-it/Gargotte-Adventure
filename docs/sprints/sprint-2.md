# Sprint 2 — Plateau isométrique et pipeline graphique

## Statut

✅ Terminé.

Le Sprint 2 a été livré en trois blocs successifs :

- Sprint 2A : projection, caméra, picking, profondeur et occlusion ;
- Sprint 2B.1 : manifeste, registre, cache, fallbacks et validation des assets ;
- Sprint 2B.2 et 2B.3 : sprites pilotes et premier environnement Bastognac.

## Objectif

Remplacer le rendu orthogonal provisoire du Sprint 1 par un plateau 2D isométrique sous PixiJS, sans modifier les règles tactiques ni introduire de véritable 3D.

Le Sprint 2 transforme l’apparence et les interactions du plateau tout en conservant la même salle jouable, les mêmes états, les mêmes sauvegardes et les mêmes résultats déterministes.

## Principes respectés

- grille logique 2D inchangée ;
- moteur tactique inchangé ;
- projection isométrique confinée au renderer ;
- PixiJS conservé ;
- HUD et commandes accessibles conservés dans le DOM ;
- personnages 2D fixes ;
- aucun rig, squelette ou moteur 3D ;
- performances mobile et tablette prioritaires ;
- assets pilotes limités afin de valider le pipeline avant la production définitive.

## Sprint 2A — Renderer isométrique livré

- fonction pure `gridToScreen` ;
- conversion inverse et picking fiable ;
- tuiles isométriques 128 × 64 ;
- caméra centrée et redimensionnement adaptatif ;
- tri de profondeur stable ;
- obstacles et combattants ancrés au sol ;
- surbrillances de déplacement et d’attaque adaptées ;
- murs non interactifs avec réduction d’opacité lorsqu’ils masquent une position importante ;
- interactions tactiles vérifiées ;
- commandes DOM accessibles conservées ;
- tests unitaires de projection et tests Playwright de sélection ;
- correction dédiée de l’ancrage des pions ;
- couches PixiJS explicites : fond, sol, objets, premier plan et interface.

## Sprint 2B — Pipeline graphique minimal livré

- convention officielle de taille et d’ancrage ;
- structure des dossiers d’assets ;
- manifeste versionné pour tuiles, obstacles et personnages ;
- chargement PixiJS centralisé ;
- cache sans double chargement ;
- fallback graphique en cas d’asset absent ;
- validation automatique des formats, chemins, dimensions, budgets et fichiers ;
- libération des textures lors de la destruction du renderer ;
- premier sol Bastognac avec deux variantes ;
- murs Bastognac sud-est et nord-est ;
- premier obstacle illustré sous forme de tonneau ;
- Brünhilda et le Gobelin Bricoleur en sprites 2D ;
- placeholders conservés pour le reste du casting ;
- budget de poids et nombre de textures contrôlés ;
- documentation des ancrages, dimensions, poids et empreintes ;
- tests de panne réelle des assets sur desktop et mobile paysage.

## Animations

Le Sprint 2 ne devait pas devenir un chantier d’animation de personnages. Les micro-animations procédurales étaient autorisées, mais non indispensables à la sortie attendue.

Le renderer et le pipeline ont été validés avec des sprites fixes. Les animations légères, telles que déplacement interpolé, impulsion d’attaque, recul ou flash d’impact, pourront être introduites progressivement lorsqu’elles servent le Brouhaha, les objets interactifs ou la lisibilité des effets du Sprint 3.

## Assets pilotes intégrés

1. deux tuiles de sol Bastognac ;
2. deux orientations de mur Bastognac ;
3. un tonneau Bastognac ;
4. Brünhilda ;
5. le Gobelin Bricoleur ;
6. une ombre au sol ;
7. les overlays de cases ;
8. un effet d’impact technique ;
9. les fallbacks techniques associés.

Les autres héros et créatures restent temporairement représentés par des placeholders compatibles avec le pipeline.

## Critères d’acceptation validés

- la salle Sprint 1 est jouable de bout en bout en vue isométrique ;
- moteur, dégâts, portée, ligne de vue, IA et sauvegarde produisent les mêmes résultats qu’avant ;
- les cases sélectionnées correspondent à la position logique attendue ;
- les personnages et obstacles sont triés correctement en profondeur ;
- les murs ne rendent aucune action essentielle impossible ;
- les commandes DOM permettent toujours de jouer sans dépendre du canvas ;
- le rendu est lisible sur téléphone et tablette paysage ;
- les tests existants restent verts ;
- les tests couvrent projection, picking, profondeur, chargement différé et fallbacks ;
- le poids et le nombre de textures sont mesurés ;
- aucun rig, modèle 3D ou dépendance 3D n’est introduit.

## Pull Requests de livraison

- PR #15 : projection isométrique minimale ;
- PR #17 : correction de l’ancrage des pions ;
- PR #18 : caméra, picking, couches et occlusion ;
- PR #20 : pipeline d’assets ;
- PR #22 : sprites pilotes ;
- PR #24 : environnement Bastognac.

## Résultat obtenu

La salle tactique du Sprint 1 fonctionne avec une identité visuelle isométrique cohérente, un premier ensemble d’assets Bastognac et un pipeline graphique assez stable pour accueillir le Brouhaha, les objets interactifs et les futurs personnages sans réécrire le renderer.

## Étape suivante

Le Sprint 3 peut introduire le Brouhaha et le décor interactif sur une base adaptée aux tables, tonneaux, grilles, torches, piliers, renforts et réactions en chaîne.

Le cadrage du Sprint 3 devra préserver les règles fondamentales déjà établies : système déterministe, trois actions par héros, dégâts `max(1, ATK - DEF)`, bruit de 0 à 12, événements impairs pour le décor et événements pairs pour les renforts.
