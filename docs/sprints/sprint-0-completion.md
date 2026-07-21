# Sprint 0 — Rapport de clôture

- **Statut :** terminé
- **Date de clôture :** 20 juillet 2026
- **Branche stable :** `main`

## Livré

- PWA Vite + TypeScript installable ;
- rendu PixiJS adaptatif ;
- moteur d’événements déterministe ;
- sauvegarde IndexedDB versionnée ;
- schémas Zod et validation du paquet Bastognac ;
- tests unitaires et smoke tests Playwright exécutés sur le build de production servi par Vite Preview ;
- CI GitHub et déploiement Pages ;
- Dependabot ;
- documentation, ADR, modèles GitHub et diagramme FigJam ;
- design system initial dans Figma.

## Définition de terminé atteinte

Le Sprint 0 est considéré comme terminé parce que :

- le socle est fusionné dans `main` ;
- les workflows de qualité sont verts ;
- la PWA est construite et déployable ;
- le build de production est testé ;
- la sauvegarde locale survit à un rechargement ;
- le contenu Bastognac minimal est validé ;
- aucun secret ni appel OpenAI n’est présent dans le client ;
- la documentation de référence existe.

Les anciennes indications relatives à l’ordre de fusion des PR #2 et #3 sont conservées dans l’historique GitHub mais ne constituent plus une instruction active.

## Dette acceptée à la clôture

- icône PWA provisoire en SVG ;
- contenu Bastognac limité à un manifeste et une définition minimale ;
- absence d’audio réel ;
- aucun gameplay de combat ;
- aucun appel OpenAI depuis le client.

## Évolution depuis la clôture

Le Sprint 1 a depuis traité une partie de cette dette :

- ajout d’une salle tactique jouable ;
- quatre héros officiels sélectionnables ;
- deux ennemis provisoires ;
- déplacement, combat, IA, victoire et défaite ;
- sauvegarde complète de la salle ;
- commandes accessibles ;
- tests Playwright desktop et mobile paysage.

L’icône, l’audio, le contenu complet et la direction artistique définitive restent à traiter dans les sprints ultérieurs.
