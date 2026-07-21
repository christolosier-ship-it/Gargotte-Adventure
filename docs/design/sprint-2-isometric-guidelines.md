# Design Sprint 2 — Gabarits isométriques

## Statut

Direction validée, assets définitifs non encore produits.

## Intention

Le plateau doit évoquer un petit diorama tactique lisible, chaleureux et légèrement théâtral. L’isométrie sert la profondeur et l’identité visuelle sans transformer le projet en jeu 3D.

## Cadre visuel

- vue 2D isométrique fixe ;
- tuiles de ratio 2:1 ;
- caméra sans rotation libre ;
- lecture prioritaire en paysage ;
- palette Bastognac chaude : pierre, bois, cuivre, cuir, mousse et lumière ambrée ;
- silhouettes immédiatement identifiables ;
- surbrillances tactiques toujours prioritaires sur le décor.

## Tuile de référence

La première hypothèse à prototyper est :

- largeur : 128 px ;
- hauteur : 64 px ;
- centre logique au centre du losange ;
- grille dessinée et grille interactive alignées ;
- marge transparente autorisée pour les objets hauts ;
- export WebP ou PNG transparent selon le besoin.

Ces dimensions ne deviennent définitives qu’après test sur téléphone et tablette.

## Personnages

Les personnages sont des illustrations 2D, pas des modèles animés.

### Production minimale

- une pose principale trois-quarts ;
- idéalement deux orientations : sud-est et nord-est ;
- miroir horizontal pour sud-ouest et nord-ouest lorsque l’équipement et la silhouette le permettent ;
- point d’ancrage au sol commun ;
- ombre séparée du sprite ;
- débordement vertical autorisé ;
- cohérence stricte d’échelle entre héros et créatures.

### Micro-animations

- respiration ou flottement de très faible amplitude ;
- interpolation pendant le déplacement ;
- impulsion courte lors d’une attaque ;
- recul, flash ou variation d’échelle à l’impact ;
- état KO simple ;
- aucune animation squelettique ;
- aucun rig.

## Décor

Le prototype utilise seulement :

- un sol ;
- un mur ou bord ;
- un obstacle ;
- une ombre ;
- un overlay atteignable ;
- un overlay attaquable ;
- un effet d’impact.

Le Brouhaha, les tonneaux, tables, grilles, torches et réactions en chaîne arrivent après stabilisation du renderer isométrique.

## Lisibilité tactique

Chaque état doit rester identifiable malgré la richesse du décor :

- héros actif ;
- héros ayant terminé son activation ;
- case atteignable ;
- cible attaquable ;
- obstacle bloquant ;
- PV ;
- victoire ;
- défaite.

Les overlays ne doivent pas dépendre uniquement d’une variation subtile de couleur.

## Occlusion

Les éléments hauts peuvent masquer temporairement une unité, mais jamais rendre une action essentielle impossible.

Solutions autorisées :

- transparence contextuelle ;
- réduction d’opacité ;
- silhouette ou contour de l’unité masquée ;
- masquage temporaire d’un mur ;
- priorité visuelle aux unités sélectionnées.

## États à formaliser dans Figma

1. salle isométrique vide ;
2. héros sélectionné ;
3. déplacement possible ;
4. cible attaquable ;
5. obstacle haut masquant partiellement une unité ;
6. tour ennemi ;
7. impact ;
8. KO ;
9. victoire ;
10. téléphone paysage ;
11. tablette paysage.

## Composants et gabarits Figma

- tuile isométrique ;
- grille de placement ;
- point d’ancrage au sol ;
- gabarit héros ;
- gabarit créature ;
- ombre ;
- mur court ;
- mur haut ;
- obstacle ;
- overlay de déplacement ;
- overlay d’attaque ;
- effet d’impact ;
- HUD existant adapté au nouvel encombrement visuel.

## Convention de nommage proposée

```text
assets/isometric/tiles/<theme>/<asset>.webp
assets/isometric/props/<theme>/<asset>.webp
assets/isometric/characters/<id>/<orientation>.webp
assets/isometric/effects/<effect>.webp
```

Le nommage définitif doit être synchronisé avec le manifeste d’assets implémenté pendant le Sprint 2.

## Critère de réussite visuel

Une capture de la salle doit être immédiatement identifiable comme Gargotte Adventure, tout en permettant à un joueur de comprendre en quelques secondes qui est actif, où il peut aller et qui il peut attaquer.
