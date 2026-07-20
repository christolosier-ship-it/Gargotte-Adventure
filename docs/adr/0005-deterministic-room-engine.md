# ADR-0005 — Moteur de salle déterministe

- Statut : Accepté
- Date : 2026-07-20

## Contexte

Le Sprint 1 doit être testable sans réseau ni hasard caché. Les mêmes intentions doivent produire les mêmes événements, PV et positions.

## Décision

Le moteur de salle utilise des ordres stables par identifiant et coordonnées, des dégâts fixes (`max(1, atk - def)`) et une IA déterministe. La ligne de vue repose sur un supercover de grille documenté.

## Conséquences

Les tests unitaires et Playwright peuvent rejouer une victoire complète. Les effets visuels restent libres, mais ne changent pas les règles.
