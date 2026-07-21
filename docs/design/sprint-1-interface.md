# Interface du Sprint 1

## Statut

L’interface décrite ici est implémentée dans la PWA. Aucun fichier Figma Design dédié au Sprint 1 n’a été créé pendant le développement, faute d’accès en écriture depuis l’environnement Codex.

Le diagramme général du projet reste disponible dans [FigJam](https://www.figma.com/board/wscHfycwhhvJRWQqelY4f9).

## Objectifs

- rendre la salle jouable à un doigt en paysage ;
- préserver un HUD lisible sans masquer le plateau ;
- proposer les mêmes actions au clavier, à la souris et au toucher ;
- ne jamais dépendre du survol ;
- conserver PixiJS pour le plateau et le DOM pour les contrôles accessibles.

## Composition

### Zone plateau

Le plateau PixiJS affiche :

- grille 8 × 4 ;
- obstacles ;
- héros ;
- ennemis ;
- PV ;
- héros actif ;
- cases atteignables ;
- cibles attaquables.

Le canvas possède un rôle et un libellé accessibles. Son état tactique utile aux tests est exposé par des attributs de données, sans devenir une seconde source de vérité.

### Zone de contrôle

Le panneau DOM affiche :

- sélection de 1 à 4 héros ;
- nom du héros actif ;
- nombre d’actions restantes ;
- statut de sauvegarde ;
- journal d’événements ;
- fin d’activation ;
- fin du tour des héros ;
- résolution du tour ennemi ;
- reprise de la partie.

### Commandes tactiques accessibles

Les intentions disponibles dans le moteur sont aussi exposées par des boutons nommés :

- `Activer <nom du héros>` ;
- `Se déplacer en colonne X, ligne Y` ;
- `Attaquer <nom de la cible>`.

Ces commandes partagent les mêmes handlers que les interactions PixiJS. Elles ne contournent donc ni la portée, ni la ligne de vue, ni les phases.

## États visuels attendus

- héros actif clairement identifié ;
- héros terminé distingué d’un héros disponible ;
- cases atteignables visibles ;
- cibles réellement attaquables visibles ;
- boutons désactivés lorsque la phase ne permet pas leur action ;
- victoire et défaite annoncées dans l’interface et le plateau ;
- statut de sauvegarde compréhensible.

## Contraintes tactiles

- zones interactives d’au moins 44 × 44 pixels ;
- format paysage prioritaire ;
- fonctionnement à un doigt ;
- aucun geste complexe obligatoire ;
- aucun contrôle essentiel uniquement au survol ;
- libellés français ;
- adaptation téléphone et tablette.

## Direction visuelle temporaire

L’interface actuelle vise la lisibilité plus que la finition artistique :

- palette chaude de taverne ;
- bois, cuivre, cuir et parchemin comme références ;
- jetons temporaires ;
- contraste suffisant ;
- humour discret ;
- aucune illustration définitive.

## Écrans à formaliser dans Figma

Lorsqu’un fichier Figma Design éditable sera créé, il devra couvrir au minimum :

1. sélection des héros ;
2. début du tour des héros ;
3. héros actif et déplacement ;
4. cible attaquable ;
5. tour ennemi ;
6. victoire ;
7. défaite ;
8. reprise de sauvegarde ;
9. format téléphone paysage ;
10. format tablette paysage.

Composants à prévoir :

- carte héros ;
- personnage ou jeton héros ;
- personnage ou jeton ennemi ;
- compteur de trois actions ;
- bouton principal ;
- bouton secondaire ;
- case atteignable ;
- cible attaquable ;
- obstacle ;
- journal d’événements ;
- panneau victoire/défaite.

## Transition vers le Sprint 2

Le Sprint 2 remplace uniquement la projection visuelle du plateau par une vue 2D isométrique sous PixiJS.

Les garanties d’interface suivantes restent obligatoires :

- mêmes intentions métier ;
- mêmes commandes DOM accessibles ;
- même fonctionnement clavier, souris et tactile ;
- HUD lisible malgré l’augmentation de profondeur visuelle ;
- sélection des cases sans clic au pixel fragile ;
- héros actif et cibles attaquables visibles ;
- aucun contrôle essentiel masqué par un mur ou un objet haut.

Les personnages deviennent des sprites 2D fixes ou très légèrement animés. Aucun rig ou moteur 3D n’est prévu.

Les gabarits détaillés sont définis dans [Design Sprint 2 — Gabarits isométriques](sprint-2-isometric-guidelines.md).

## Suite au Sprint 3

L’arrivée du Brouhaha et du décor interactif devra ajouter de l’information sans saturer le HUD. Les nouvelles réactions devront rester :

- visibles sur le plateau isométrique ;
- expliquées dans le journal ;
- accessibles par les commandes DOM lorsque nécessaire ;
- lisibles sur téléphone paysage.
