# Architecture — Salle tactique

La salle tactique est divisée en quatre responsabilités :

1. **Moteur** (`packages/engine/src/tactical`) : règles de grille, déplacements, ligne de vue, combat, tours et IA. Il retourne des états immuables, événements et erreurs métier typées.
2. **Renderer PixiJS** (`packages/renderer`) : projection visuelle de `RoomState`, surbrillances et émissions d'intentions UI. Il ne modifie jamais l'état métier.
3. **UI DOM** (`packages/ui`) : sélection des héros, HUD, boutons et écrans finaux accessibles en français.
4. **Sauvegarde** (`packages/save`) : persistance IndexedDB versionnée et restauration défensive.

Les données Bastognac sont validées par Zod avant de devenir un `RoomState` initial.
