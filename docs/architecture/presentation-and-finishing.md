# Présentation et finition du Sprint 3.6

## Statut

- Sprint : 3.6, terminé
- Issue : #57
- Pull Request fonctionnelle : #59
- Commit fonctionnel : `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`
- Audit : [Audit de livraison du Sprint 3.6](../audits/sprint-3-6-presentation-finishing.md)

## Objectif

Rendre les conséquences tactiques lisibles, audibles et confortables sans déplacer aucune règle vers le renderer, l'UI, l'audio ou le journal.

```text
intention joueur
      │
      ▼
packages/engine
      ├─ RoomState final
      └─ TacticalEvent[] ordonnés
              │
              ▼
packages/presentation
      ┌───────┼────────┐
      ▼       ▼        ▼
 cues visuels audio   journal groupé
      │       │        │
      ▼       ▼        ▼
 renderer   audio      UI
```

## Routeur pur

`routeTacticalPresentation` reçoit les événements déjà résolus et une fonction de traduction. Il retourne des cues visuels, des cues audio et une entrée de journal.

Garanties :

- ordre causal conservé ;
- aucune mutation des événements ou de `RoomState` ;
- aucune cible, règle ou conséquence recalculée ;
- dix cues visuels et six cues audio au maximum par défaut ;
- regroupement par action racine ;
- conséquences majeures conservées en priorité.

## Ports de sortie

Renderer, audio et UI exposent leurs propres interfaces structurelles compatibles avec les sorties du routeur. Ils ne dépendent pas du package `presentation`.

Cette organisation conserve un graphe de packages unidirectionnel et sans cycle.

## Renderer

Une couche PixiJS `presentation` affiche après le rendu stable :

- activation du héros ;
- déplacement et poussée ;
- impact et dégâts ;
- variation du Brouhaha ;
- seuil et renfort ;
- victoire et défaite.

La couche n'accepte aucun événement de pointeur. Ses timers et objets sont détruits lors d'une nouvelle lecture, d'un rendu, d'une rotation, d'une reprise ou de la destruction du renderer.

## Audio

`AudioDirector` joue sept tonalités pilotes locales Web Audio : interaction, impact, dégâts, Brouhaha, renfort, victoire et défaite.

Il :

- attend une interaction utilisateur ;
- respecte volume et mute ;
- met les lecteurs en cache ;
- tolère Web Audio indisponible ou une lecture refusée ;
- n'effectue aucun appel réseau ;
- permet un futur remplacement par des fichiers locaux.

Les préférences sont stockées localement hors `RoomState`.

## Journal

Le journal conserve six actions racines au maximum. Chaque entrée contient un résumé et jusqu'à sept conséquences.

Une chaîne produisant un renfort total puis un renfort partiel affiche les deux résultats. Les historiques moteur restent la preuve persistante complète.

## Reprise

Une reprise restaure l'état stable et ne rejoue aucun son, overlay, impact ou renfort historique. Elle ajoute seulement un message de restauration.

## Accessibilité

- `prefers-reduced-motion` limite les cues à 70 ms ;
- mute et volume accessibles ;
- information disponible dans le DOM ;
- aucune information essentielle uniquement sonore ou colorée ;
- overlays sans capture du focus, du clic ou du toucher.

## Diagnostics

Le système expose :

- canvas unique ;
- nombre d'objets stables et transitoires ;
- génération et quantité de cues ;
- compteurs de listeners ;
- cache et état audio ;
- statut du mouvement réduit.

Les tests vérifient le retour à zéro des objets temporaires, la stabilité après quatre rotations, le journal borné et l'absence de replay.

## Validation

Le HEAD final de la PR #59 a validé :

- Repository quality `30306035478` ;
- Validate application `30306035634` ;
- formatage, contenu et TypeScript strict ;
- 131 tests unitaires ;
- build et validation structurelle ;
- Playwright Chromium bureau et mobile paysage ;
- package lock et artefact de production.

## Frontières

- aucune nouvelle règle tactique ;
- aucune nouvelle version de sauvegarde ;
- aucun rééquilibrage ;
- aucun appel réseau tiers ou secret ;
- aucun hasard métier ;
- aucune véritable 3D ou WebAssembly ;
- Gargottex strictement en lecture seule.

## Suite

Le Sprint 3 est clos. Le Sprint 4 finalisera les héros, créatures, compétences et valeurs d'équilibrage de Bastognac.
