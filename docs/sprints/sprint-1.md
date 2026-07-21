# Sprint 1 — Boucle tactique d'une salle

Objectif : transformer le vertical slice Sprint 0 en salle tactique jouable sans supprimer les fondations existantes.

## Architecture Sprint 0 conservée

Sprint 0 sépare déjà l'application Vite/PWA (`apps/game`), le moteur déterministe (`packages/engine`), le rendu PixiJS (`packages/renderer`), l'interface DOM (`packages/ui`), la sauvegarde IndexedDB (`packages/save`) et les schémas de contenu Zod (`packages/content-schema`). `apps/game/src/main.ts` orchestre ces modules sans contenir les règles métier.

## Portée Sprint 1

- Salle 8 × 4.
- Sélection de 1 à 4 héros.
- Trois actions par activation de héros.
- Déplacement orthogonal, portée, ligne de vue et combat déterministes.
- Tour ennemi déterministe avec explications.
- Victoire, défaite, sauvegarde et reprise.
- Plateau rendu par PixiJS et HUD DOM tactile paysage.
