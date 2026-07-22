# Design Sprint 2 - Gabarits isométriques

## Statut

Direction validée et prototype pilote livré.

Les gabarits, tokens et règles d’ancrage sont versionnés dans le dépôt. Les assets pilotes de Brünhilda, du Gobelin Bricoleur et de l’environnement Bastognac sont intégrés dans la PWA.

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

Le gabarit runtime validé est :

- largeur : 128 px ;
- hauteur : 64 px ;
- centre logique au centre du losange ;
- grille dessinée et grille interactive alignées ;
- marge transparente autorisée pour les objets hauts ;
- export runtime SVG ou WebP uniquement.

Les sources maîtres peuvent utiliser d’autres formats sur Google Drive, mais le dépôt public runtime ne reçoit ni PNG, ni PDF, ni PSD.

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

Le prototype Sprint 2 utilise une orientation omnidirectionnelle pour Brünhilda et le Gobelin Bricoleur, avec un canvas commun 128 × 192 et un ancrage autour de 92 % de la hauteur.

### Micro-animations

Les personnages peuvent rester fixes. Les micro-animations suivantes sont autorisées lorsqu’elles servent une interaction réelle :

- respiration ou flottement de très faible amplitude ;
- interpolation pendant le déplacement ;
- impulsion courte lors d’une attaque ;
- recul, flash ou variation d’échelle à l’impact ;
- état KO simple ;
- aucune animation squelettique ;
- aucun rig.

Aucune micro-animation n’est obligatoire pour valider le prototype graphique.

## Décor pilote

Le Sprint 2 livre :

- deux variantes de sol Bastognac ;
- deux orientations de mur ;
- un tonneau statique utilisé comme obstacle ;
- une ombre ;
- des overlays atteignable, sélectionné, attaquable et bloqué ;
- un effet d’impact technique disponible dans le manifeste ;
- des fallbacks vectoriels.

Le tonneau du Sprint 2 est uniquement une représentation visuelle d’un obstacle logique. Les tonneaux interactifs, tables, grilles, torches, piliers et réactions en chaîne appartiennent au Sprint 3.

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

Les overlays ne doivent pas dépendre uniquement d’une variation subtile de couleur. Le prototype utilise une combinaison de remplissage, contour, épaisseur et contraste.

## Occlusion

Les éléments hauts peuvent masquer temporairement une unité, mais jamais rendre une action essentielle impossible.

Solutions retenues ou autorisées :

- transparence contextuelle ;
- réduction d’opacité ;
- silhouette ou contour de l’unité masquée ;
- masquage temporaire d’un mur ;
- priorité visuelle aux unités sélectionnées.

Le prototype réduit l’opacité des murs lorsqu’ils recouvrent une position active, atteignable ou attaquable. Les murs restent non interactifs.

## États à maintenir dans les futures maquettes

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

## Composants et gabarits

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

Les fondations Figma sont partielles à cause des limites du plan Starter. Les fichiers versionnés dans `design/isometric` et le manifeste runtime constituent le handoff technique de référence.

## Convention de nommage runtime

```text
apps/game/public/assets/isometric/tiles/<asset>.svg
apps/game/public/assets/isometric/walls/<asset>.svg
apps/game/public/assets/isometric/props/<asset>.svg
apps/game/public/assets/isometric/characters/<asset>.webp
apps/game/public/assets/isometric/fx/<asset>.svg
```

Les identifiants logiques restent indépendants des chemins et sont déclarés dans le manifeste runtime.

## Budget

- 1 Mio maximum pour le pilote complet ;
- 250 Kio maximum par sprite pilote ;
- 100 Kio maximum par asset technique ou environnemental ;
- SVG et WebP uniquement ;
- cache partagé pour éviter les chargements en double.

## Critère de réussite visuel

Une capture de la salle doit être immédiatement identifiable comme Gargotte Adventure, tout en permettant à un joueur de comprendre en quelques secondes qui est actif, où il peut aller et qui il peut attaquer.
