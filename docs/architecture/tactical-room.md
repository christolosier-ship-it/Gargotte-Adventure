# Salle tactique déterministe

Le moteur de salle vit dans `packages/engine` et reste indépendant du DOM, de PixiJS, du navigateur, d'IndexedDB et de la date système. Il reçoit un `RoomState` et une intention, puis retourne un nouvel état ou une erreur métier typée.

La grille 8 × 4 utilise des coordonnées zéro-indexées. Les voisins sont orthogonaux. Les départages suivent un ordre stable : distance minimale, ligne croissante, colonne croissante, identifiant stable.

La ligne de vue échantillonne les cases traversées entre centres de cases par interpolation déterministe de type supercover simplifiée. Les obstacles et entités bloquantes intermédiaires coupent la vue.

La sauvegarde v2 stocke le scénario, les héros choisis, l'état complet de salle, la phase, le tour, PV, positions et actions restantes. Les sauvegardes Sprint 0 incompatibles sont ignorées pour revenir au menu sans crash.
