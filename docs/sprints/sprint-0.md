# Sprint 0 — Fondations

## Objectif

Créer un environnement de développement fiable pour Gargotte Adventure, sans engager prématurément le gameplay dans une architecture difficile à corriger.

## Périmètre

### Phase 1 — GitHub

- dépôt organisé ;
- stratégie de branches ;
- modèles d’issues et de Pull Requests ;
- CODEOWNERS ;
- intégration continue minimale ;
- validation automatique de la structure et des secrets ;
- documentation des réglages GitHub à appliquer.

### Phase 2 — Documentation

- vision produit ;
- architecture générale ;
- structure du dépôt ;
- roadmap ;
- décisions d’architecture ;
- politique de sécurité ;
- workflow de contribution ;
- diagramme FigJam.

### Phases suivantes du Sprint 0

- design system initial dans Figma ;
- préparation contrôlée des assets Drive ;
- squelette PWA TypeScript ;
- pipeline de build et déploiement ;
- premier paquet de contenu Bastognac validé.

## Critères d’acceptation des phases 1 et 2

- [x] une branche dédiée contient les fondations ;
- [x] les contributions passent par une PR documentée ;
- [x] un workflow GitHub vérifie la structure et recherche des secrets ;
- [x] la séparation Gargottex / jeu est documentée ;
- [x] les choix techniques initiaux sont consignés ;
- [x] la clé OpenAI est explicitement interdite dans le client et le dépôt ;
- [x] le diagramme d’architecture est disponible dans FigJam ;
- [x] la roadmap décrit un résultat jouable par sprint fonctionnel.

## Hors périmètre actuel

- code de gameplay ;
- design définitif des écrans ;
- intégration des images ;
- publication d’une PWA ;
- appels OpenAI depuis le jeu ;
- migration automatique complète de Gargottex.

## Risques suivis

| Risque                            | Réponse                                         |
| --------------------------------- | ----------------------------------------------- |
| Duplication des données Gargottex | Paquets de contenu générés et versionnés        |
| Fuite de clé API                  | Aucun secret côté client, contrôle CI           |
| Architecture trop lourde          | Dossiers créés seulement lorsqu’ils sont utiles |
| Mauvaise expérience mobile        | Mobile-first et tests sur appareils réels       |
| Règles ambiguës                   | Moteur déterministe et ADR de règles            |
| Assets trop volumineux            | Pipeline d’optimisation dédié                   |

## Sortie des phases 1 et 2

Une PR de fondations fusionnable, un corpus documentaire cohérent et un backlog prêt pour la suite du Sprint 0.
