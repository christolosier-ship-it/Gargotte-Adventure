# ADR-0004 — Organisation des branches

- Statut : Accepté
- Date : 2026-07-20

## Décision

Le projet utilise `main` comme branche stable. Les travaux sont réalisés sur des branches courtes nommées `sprint-N/sujet`, `feature/sujet`, `fix/sujet` ou `docs/sujet`, puis réunis par Pull Request.

La fusion par squash est privilégiée et les branches terminées sont supprimées.

## Motif

Cette organisation garde un historique lisible et évite une branche intermédiaire permanente tant que l’équipe reste petite.

## Réévaluation

Cette décision sera revue si plusieurs versions doivent être maintenues simultanément.
