# Sprint 2 — Plateau isométrique et pipeline graphique

## Statut

Planifié.

## Objectif

Remplacer le rendu orthogonal provisoire du Sprint 1 par un plateau 2D isométrique sous PixiJS, sans modifier les règles tactiques ni introduire de véritable 3D.

Le Sprint 2 doit transformer l’apparence et les interactions du plateau tout en conservant la même salle jouable, les mêmes états, les mêmes sauvegardes et les mêmes résultats déterministes.

## Principes

- grille logique 2D inchangée ;
- moteur tactique inchangé sauf adaptation d’interface strictement nécessaire ;
- projection isométrique confinée au renderer ;
- PixiJS conservé ;
- HUD et commandes accessibles conservés dans le DOM ;
- personnages 2D fixes ou très légèrement animés ;
- aucun rig, squelette ou moteur 3D ;
- performances mobile et tablette prioritaires ;
- assets temporaires acceptés pour valider le pipeline avant la production définitive.

## Découpage recommandé

### Sprint 2A — Renderer isométrique

- fonction pure `gridToScreen` ;
- conversion inverse ou picking fiable écran vers grille ;
- tuiles isométriques de ratio 2:1 ;
- caméra centrée et redimensionnement adaptatif ;
- tri de profondeur stable ;
- obstacles et combattants ancrés au sol ;
- surbrillances de déplacement et d’attaque adaptées ;
- murs ou éléments hauts sans masquer définitivement l’action ;
- interactions tactiles vérifiées ;
- maintien des commandes DOM accessibles ;
- tests unitaires de projection et tests Playwright de sélection.

### Sprint 2B — Pipeline graphique minimal

- convention officielle de taille et d’ancrage ;
- structure des dossiers d’assets ;
- manifeste versionné pour tuiles, obstacles et personnages ;
- chargement PixiJS centralisé ;
- fallback graphique en cas d’asset absent ;
- premier sol Bastognac ;
- premier mur ou bord de salle ;
- premier obstacle ;
- Brünhilda et un gobelin en sprites 2D ;
- une ou deux orientations dessinées, avec miroir horizontal si acceptable ;
- micro-animations procédurales ;
- budget de poids et contrôle du nombre de textures ;
- documentation Figma des gabarits et états.

## Animations autorisées

Le Sprint 2 ne doit pas devenir un chantier d’animation de personnages.

Sont autorisés :

- respiration ou flottement très léger ;
- déplacement interpolé de case en case ;
- petite impulsion d’attaque ;
- recul ou flash à l’impact ;
- variation courte d’échelle ou de rotation ;
- état KO simple ;
- quelques frames dessinées uniquement si elles apportent une valeur nette.

Sont exclus :

- rigging ;
- animation squelettique ;
- animation 3D ;
- caméra libre ;
- production exhaustive de toutes les créatures avant validation du prototype.

## Assets pilotes

Le prototype doit fonctionner avec un ensemble réduit :

1. une tuile de sol ;
2. une variante de bord ou mur ;
3. un obstacle ;
4. Brünhilda ;
5. un gobelin ;
6. une ombre au sol ;
7. un overlay de case atteignable ;
8. un overlay de cible attaquable ;
9. un effet simple d’impact.

Les autres héros et créatures restent temporairement représentés par des placeholders compatibles avec le nouveau pipeline.

## Critères d’acceptation

- la salle Sprint 1 est jouable de bout en bout en vue isométrique ;
- moteur, dégâts, portée, ligne de vue, IA et sauvegarde produisent les mêmes résultats qu’avant ;
- les cases sélectionnées correspondent toujours à la position logique attendue ;
- les personnages et obstacles sont triés correctement en profondeur ;
- aucun objet haut ne rend une action essentielle impossible ;
- les commandes DOM permettent toujours de jouer sans dépendre du canvas ;
- le rendu est lisible sur téléphone et tablette paysage ;
- les tests existants restent verts ;
- de nouveaux tests couvrent projection, picking et ordre de profondeur ;
- le poids et le nombre de textures sont mesurés ;
- aucun rig, modèle 3D ou dépendance 3D n’est introduit.

## Sortie attendue

La salle tactique actuelle fonctionne avec une identité visuelle isométrique cohérente, un premier ensemble d’assets Bastognac et un pipeline graphique assez stable pour accueillir le Brouhaha, les objets interactifs et les futurs personnages sans réécrire le renderer.

## Après le Sprint 2

Le Sprint 3 peut introduire le Brouhaha et le décor interactif sur une base visuelle déjà adaptée aux tables, tonneaux, grilles, torches, piliers et réactions en chaîne.
