# Lot Codex 2A.1 — Projection isométrique

> **Statut historique : terminé.** Ce brief décrit le premier lot du Sprint 2. Il est conservé pour la traçabilité et ne constitue plus une instruction active. La rotation de caméra, les assets pilotes et l’environnement Bastognac ont été livrés dans les lots suivants.

## Objectif initial

Remplacer le dessin orthogonal provisoire par une projection 2D isométrique minimale, sans ajouter d’asset définitif et sans modifier les règles tactiques.

## Périmètre obligatoire initial

- ajouter un module de projection pur dans `packages/renderer` ;
- implémenter `gridToScreen` ;
- rendre la grille 8 × 4 avec des losanges 128 × 64 ;
- afficher les six états de tuile définis dans `tokens.json` ;
- conserver les mêmes handlers de sélection ;
- conserver le HUD et les commandes DOM ;
- centrer le plateau dans le `boardHost` ;
- adapter le redimensionnement desktop, tablette et téléphone paysage ;
- ajouter des tests unitaires de projection ;
- maintenir tous les tests existants.

## Hors périmètre du lot initial

- images définitives ;
- détourage des personnages ;
- atlas de textures ;
- Brouhaha ;
- décor interactif ;
- nouvelles règles de déplacement ;
- animation complexe ;
- refonte du HUD ;
- rotation de caméra ;
- dépendance 3D.

La mention de la rotation comme hors périmètre s’applique uniquement au lot 2A.1. Une rotation de contrôle à quatre orientations a depuis été livrée et documentée.

## Contraintes

1. `packages/engine` ne doit pas dépendre de la projection.
2. `RoomState` et la version de sauvegarde ne changent pas.
3. Les positions logiques restent des entiers `column` et `row`.
4. Les clics et touchers doivent sélectionner la même case que les commandes DOM.
5. Les tokens de ce dossier servent de source commune.
6. Le renderer doit continuer à afficher des placeholders si un asset est absent.

## Critères d’acceptation initiaux

- la salle Sprint 1 reste jouable de bout en bout ;
- les mêmes actions produisent les mêmes états et événements ;
- les 32 tuiles sont rendues en vue isométrique ;
- les cases atteignables et attaquables restent lisibles ;
- aucune sélection ne se décale sur une tuile voisine ;
- la grille reste centrée lors du redimensionnement ;
- les tests de projection couvrent au minimum les quatre coins et le centre ;
- TypeScript, Vitest, build, validation du dépôt et Playwright sont verts.

## Résultat

Le livrable initial a été complété par le pipeline d’assets, les sprites pilotes, l’environnement Bastognac, les murs sensibles à la caméra et le désendettement structurel pré-Sprint 3. L’état technique courant est décrit dans `docs/architecture/overview.md` et `docs/architecture/repository-structure.md`.
