# Sprint 3 : Brouhaha, spawn, décor et finition

- Statut : ✅ terminé
- Périmètre : Sprints 3.1 à 3.6
- Issue finale : #57
- PR fonctionnelle finale : #59
- Commit fonctionnel final : `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`
- Étape suivante : Sprint 4, héros et créatures de Bastognac

## Objectif

Transformer la salle isométrique en système vivant, interactif et explicable sans perdre le déterminisme du moteur tactique.

## Décisions structurantes

1. Le spawn déterministe précède les renforts.
2. Définitions éditoriales et instances runtime restent séparées.
3. Le Brouhaha produit des demandes explicites et historisées.
4. Les objets produisent des intentions sans choisir leurs conséquences.
5. Les réactions sont déclarées par salle et propagées dans un ordre reproductible.
6. Les renforts sont déclenchés par seuil puis exécutés par le moteur de spawn.
7. Les événements moteur sont la source de vérité de la présentation.
8. Renderer, UI, audio et journal ne décident jamais des règles.
9. Le budget de menace appartient à chaque salle.
10. Gargottex reste strictement en lecture seule.

## Étapes livrées

### Sprint 3.1 : spawn déterministe ✅

PR #35, commit `dd8c749f3afb73104270d87c9e920aab4e926bf3` : définitions et instances séparées, points de spawn, identifiants reproductibles, succès total/partiel et sauvegarde version 2.

### Sprint 3.2 : Brouhaha 0–12 ✅

PR #37, commit `306cc037a5e64ef948b45d85e92d45e3a9909eb2` : jauge bornée, demandes idempotentes, effets, historique, HUD et sauvegarde version 3.

### Sprint 3.3 : objets interactifs ✅

PR #43, commit `83d1aa48eeb8411f01584d8321ea52357c2e6e07` : tables, tonneaux, grilles, torches, piliers, occupation commune, rendu et sauvegarde version 4.

### Sprint 3.4 : réactions en chaîne ✅

PR #45, commit `17ad00c0cb5abb9e66da6e320903f56606a8e8d5` : poussées, file FIFO, causalité persistante, garde-fous et sauvegarde version 5.

### Sprint 3.5 : renforts de Brouhaha ✅

PR #49 puis correctifs #53, #54 et #56 : règles de seuil, limites d'activation, résultats totaux/partiels/refusés, phase terminale différée, roster ennemi figé et sauvegarde version 6.

### Sprint 3.6 : présentation et finition ✅

PR #59, commit `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`.

Livré :

- package pur `packages/presentation` ;
- routeur `TacticalEvent[]` vers cues visuels, cues audio et journal groupé ;
- ordre causal conservé et sorties bornées ;
- couche PixiJS transitoire dédiée, annulable et non interactive ;
- cues d'activation, mouvement, impact, dégâts, Brouhaha, seuil, renfort et phase terminale ;
- sept tonalités pilotes Web Audio entièrement locales ;
- volume, mode muet, déverrouillage autoplay et cache ;
- journal limité à six actions racines ;
- conservation des conséquences majeures, dont les résultats total et partiel d'une même chaîne ;
- support de `prefers-reduced-motion` ;
- reprise sans replay sonore ou visuel ;
- diagnostics de canvas, listeners, objets stables, cues actifs et cache audio.

## Architecture finale

```text
intention
   │
   ▼
packages/engine
   ├─ RoomState final
   └─ événements ordonnés
           │
           ▼
packages/presentation
   ┌───────┼─────────┐
   ▼       ▼         ▼
renderer  audio      UI/journal
```

Les adaptateurs renderer, audio et UI exposent leurs propres ports structurels. Aucun cycle de package n'est introduit.

## Reprise et sauvegarde

La sauvegarde tactique reste en version 6. Les préférences audio sont applicatives et locales.

Une reprise :

- restaure immédiatement l'état stable ;
- n'émet aucun nouvel événement métier ;
- ne rejoue ni son, ni overlay, ni apparition historique ;
- annonce seulement la restauration dans le journal.

## Accessibilité et stabilité

- mouvement réduit respecté ;
- volume et mute accessibles ;
- information disponible dans le DOM et non uniquement par couleur ou son ;
- overlays sans capture du focus ou du pointeur ;
- un seul canvas ;
- listeners et nombre d'objets stables après rotations ;
- objets transitoires détruits ;
- journal et cache audio bornés.

## Validation

Le HEAD de la PR #59 a validé :

- Repository quality `30306035478` ;
- Validate application `30306035634` ;
- formatage ;
- contenu ;
- TypeScript strict ;
- 131 tests unitaires ;
- build de production ;
- validation structurelle ;
- Playwright Chromium bureau et mobile paysage ;
- package lock et artefact de production.

## Frontières respectées

- aucune nouvelle règle tactique ;
- aucune mutation de `RoomState` par la présentation ;
- aucun rééquilibrage ;
- aucun appel réseau tiers ;
- aucun secret ou hasard métier ;
- aucune véritable 3D ou WebAssembly ;
- Gargottex non modifié.

## Décision de sortie

Le Sprint 3 est terminé. Le plateau est désormais un acteur tactique déterministe dont les conséquences sont lisibles, audibles et restaurables sans replay.

Références :

- [Architecture de présentation](../architecture/presentation-and-finishing.md) ;
- [Audit Sprint 3.6](../audits/sprint-3-6-presentation-finishing.md) ;
- [Roadmap](../roadmap.md).
