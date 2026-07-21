# Sprint 0 — Cadrage historique des fondations

> Ce document décrit le périmètre prévu au lancement du projet. Le Sprint 0 est terminé. Son résultat réel est consigné dans [le rapport de clôture](sprint-0-completion.md).

## Objectif initial

Créer un environnement de développement fiable pour Gargotte Adventure, sans engager prématurément le gameplay dans une architecture difficile à corriger.

## Périmètre prévu

### GitHub et qualité

- dépôt organisé ;
- stratégie de branches ;
- modèles d’issues et de Pull Requests ;
- CODEOWNERS ;
- intégration continue ;
- validation automatique de la structure et des secrets ;
- déploiement GitHub Pages.

### Documentation

- vision produit ;
- architecture générale ;
- structure du dépôt ;
- roadmap ;
- décisions d’architecture ;
- politique de sécurité ;
- workflow de contribution ;
- diagramme FigJam.

### Socle applicatif

- design system initial ;
- PWA Vite + TypeScript ;
- renderer PixiJS ;
- moteur d’événements déterministe ;
- sauvegarde IndexedDB ;
- schémas Zod ;
- premier paquet Bastognac ;
- tests Vitest et Playwright.

## Critères d’acceptation

- [x] une branche dédiée contient les fondations ;
- [x] les contributions passent par une PR documentée ;
- [x] les workflows vérifient format, structure, contenu, types, tests et secrets ;
- [x] la séparation Gargottex / jeu est documentée ;
- [x] les choix techniques initiaux sont consignés ;
- [x] la clé OpenAI est interdite dans le client et le dépôt ;
- [x] le diagramme d’architecture est disponible dans FigJam ;
- [x] une PWA est installable, testée et déployée ;
- [x] le paquet Bastognac minimal est validé ;
- [x] la roadmap décrit un résultat démontrable par sprint.

## Hors périmètre du Sprint 0

Au moment du cadrage, les éléments suivants étaient volontairement reportés :

- gameplay de combat ;
- salle tactique ;
- IA ennemie ;
- design définitif ;
- médias définitifs ;
- audio ;
- migration complète de Gargottex.

La boucle tactique a depuis été livrée au Sprint 1.

## Risques suivis

| Risque | Réponse |
| --- | --- |
| Duplication des données Gargottex | Paquets de contenu générés et versionnés |
| Fuite de clé API | Aucun secret côté client et contrôle CI |
| Architecture trop lourde | Dossiers créés seulement lorsqu’ils sont utiles |
| Mauvaise expérience mobile | Mobile-first et tests desktop/mobile paysage |
| Règles ambiguës | Moteur déterministe, tests et ADR |
| Assets trop volumineux | Pipeline d’optimisation prévu lorsqu’il devient utile |

## Résultat

Le Sprint 0 a fourni le socle utilisé sans rupture par le Sprint 1 : application Vite/PWA, packages séparés, renderer PixiJS, IndexedDB, validation Zod, CI, Pages, documentation et premier contenu Bastognac.
