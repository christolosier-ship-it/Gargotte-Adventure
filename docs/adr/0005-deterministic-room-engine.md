# ADR-0005 — Moteur de salle déterministe

- Statut : Accepté
- Date : 2026-07-20

## Contexte

La boucle de salle doit être testable sans réseau ni hasard caché. À état et intention identiques, les mêmes événements, positions, PV et décisions ennemies doivent être produits.

Le plateau PixiJS, le HUD DOM, les sauvegardes et les tests navigateur doivent tous reposer sur une seule implémentation des règles.

## Décision

### Moteur pur

Les règles de salle sont placées dans `packages/engine/src/tactical` et ne dépendent pas :

- du DOM ;
- de PixiJS ;
- d’IndexedDB ;
- du navigateur ;
- de la date système ;
- d’un nom de héros, de créature ou de donjon ;
- d’une API distante.

### Résolution explicite

Une intention valide retourne :

- un nouvel état ;
- une liste ordonnée d’événements.

Une intention invalide retourne une erreur métier typée, sans modifier l’état ni consommer de ressource.

### Ordres stables

Les égalités sont départagées avec des critères explicites et stables :

- distance ;
- coordonnées ;
- identifiant.

Le résultat ne dépend pas de l’ordre accidentel d’itération d’un objet JavaScript.

### Combat

Les dégâts utilisent :

```ts
Math.max(1, attacker.atk - target.def)
```

Aucun dé ni tirage aléatoire n’intervient dans le Sprint 1.

### Ligne de vue

La ligne de vue utilise un supercover de grille. Toutes les cases touchées par le segment sont examinées, y compris les deux cases latérales lorsqu’il passe exactement par un coin.

### IA

L’IA :

- choisit une cible avec un ordre stable ;
- cherche une case d’attaque libre ;
- vérifie portée et visibilité ;
- avance d’une case ;
- attaque immédiatement ou après déplacement ;
- fournit une explication structurée.

### Présentation

Le renderer PixiJS et les commandes DOM produisent les mêmes intentions vers le moteur. Aucun des deux ne décide directement si une action est autorisée.

## Conséquences positives

- tests unitaires sans navigateur ;
- scénarios Playwright reproductibles ;
- sauvegardes sérialisables ;
- IA explicable ;
- absence de divergence entre canvas et commandes accessibles ;
- ajout futur de contenus sans modifier les règles génériques ;
- effets visuels libres tant qu’ils ne changent pas l’état métier.

## Compromis et risques

- les règles doivent définir explicitement tous les cas d’égalité ;
- l’ajout de hasard visible nécessitera une graine et une journalisation ;
- le supercover peut être plus strict qu’une intuition visuelle simplifiée ;
- une IA totalement déterministe peut devenir prévisible ;
- les animations doivent suivre les événements sans retarder ou altérer la résolution.

## Réévaluation

Cette décision sera réévaluée lorsque :

- le Brouhaha introduira des événements pseudo-aléatoires ;
- plusieurs salles ou étages partageront le même moteur ;
- des compétences modifieront fortement le cheminement ou la visibilité ;
- un besoin de hasard joueur sera validé.

Toute évolution devra préserver la reproductibilité par graine, l’explication des résultats et l’absence de hasard caché.
