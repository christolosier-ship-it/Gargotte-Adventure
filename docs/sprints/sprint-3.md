# Sprint 3 : Brouhaha, spawn, décor et finition

- Statut fonctionnel : ✅ livré et fusionné
- Clôture définitive : 🟠 sous réserve de stabilisation
- Périmètre : Sprints 3.1 à 3.6
- Issue fonctionnelle finale : #57
- PR fonctionnelle finale : #59
- Commit fonctionnel final : `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`
- Documentation de clôture initiale : PR #60
- Base observée après clôture initiale : `cc7756ba94a41be0eb2e20ca5a9f6ff6766df3fe`
- Lot de stabilisation : Sprint 4.0
- Étape fonctionnelle suivante : Sprint 4, héros, créatures et comportements de Bastognac

## Objectif historique

Transformer la salle isométrique en système vivant, interactif et explicable sans perdre le déterminisme du moteur tactique.

## Décisions structurantes

1. Le spawn déterministe précède les renforts.
2. Définitions éditoriales et instances runtime restent séparées.
3. Le Brouhaha produit des demandes explicites et historisées.
4. Les objets produisent des intentions sans choisir leurs conséquences.
5. Les réactions sont déclarées par salle et propagées dans un ordre reproductible.
6. Les renforts sont déclenchés par seuil puis exécutés par le moteur de spawn.
7. Les événements et l'état moteur sont les sources de vérité de la présentation.
8. Renderer, UI, audio et journal ne décident jamais des règles.
9. Le budget de menace appartient à chaque salle.
10. Gargottex reste strictement en lecture seule.

## Étapes livrées

### Sprint 3.1 : spawn déterministe ✅

PR #35, commit `dd8c749f3afb73104270d87c9e920aab4e926bf3` : définitions et instances séparées, points de spawn, identifiants reproductibles, succès total ou partiel et sauvegarde version 2.

### Sprint 3.2 : Brouhaha 0 à 12 ✅

PR #37, commit `306cc037a5e64ef948b45d85e92d45e3a9909eb2` : jauge bornée, demandes idempotentes, effets, historique, HUD et sauvegarde version 3.

### Sprint 3.3 : objets interactifs ✅

PR #43, commit `83d1aa48eeb8411f01584d8321ea52357c2e6e07` : tables, tonneaux, grilles, torches, piliers, occupation commune, rendu et sauvegarde version 4.

### Sprint 3.4 : réactions en chaîne ✅

PR #45, commit `17ad00c0cb5abb9e66da6e320903f56606a8e8d5` : poussées, file FIFO, causalité persistante, garde-fous et sauvegarde version 5.

### Sprint 3.5 : renforts de Brouhaha ✅

PR #49 puis correctifs #53, #54 et #56 : règles de seuil, limites d'activation, résultats totaux, partiels ou refusés, phase terminale différée, roster ennemi figé et sauvegarde version 6.

### Sprint 3.6 : présentation et finition ✅ fonctionnellement

PR #59, commit `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`.

Livré :

- package pur `packages/presentation` ;
- routeur `TacticalEvent[]` vers cues visuels, cues audio et journal groupé ;
- sorties bornées ;
- couche PixiJS transitoire, annulable et non interactive ;
- cues d'activation, mouvement, impact, dégâts, Brouhaha, seuil, renfort et phase terminale ;
- sept tonalités pilotes Web Audio locales ;
- volume, mode muet, déverrouillage autoplay et cache ;
- journal limité à six actions racines ;
- support de `prefers-reduced-motion` ;
- reprise sans replay sonore ou visuel ;
- diagnostics de canvas, listeners, objets stables, cues actifs et cache audio.

## Architecture livrée

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

Les adaptateurs renderer, audio et UI exposent leurs propres ports structurels. La présentation ne doit introduire aucun cycle et ne doit muter aucune règle ou état tactique.

## Reprise et sauvegarde

La sauvegarde tactique reste en version 6. Les préférences audio sont applicatives et locales.

Une reprise :

- restaure immédiatement l'état stable ;
- n'émet aucun nouvel événement métier ;
- ne rejoue ni son, ni overlay, ni apparition historique ;
- annonce seulement la restauration dans le journal.

## Validation de la livraison

Le HEAD de la PR #59 a validé :

- Repository quality `30306035478` ;
- Validate application `30306035634` ;
- formatage ;
- contenu ;
- TypeScript strict ;
- 131 tests unitaires ;
- build de production ;
- validation structurelle existante ;
- Playwright Chromium bureau et mobile paysage ;
- package lock et artefact de production.

Ces contrôles attestent la livraison selon la couverture disponible au moment de la fusion. Ils ne ferment pas les écarts P2 détectés ensuite.

## Réserve post-fusion

Sept fils P2 restent ouverts après les PR #59 et #60 :

1. les transitions réelles victoire et défaite peuvent ne pas produire leurs cues terminaux ;
2. des préférences audio persistées invalides peuvent écraser les valeurs par défaut ;
3. les plafonds visuels et audio peuvent supprimer des cues prioritaires tardifs ;
4. les tonalités répétées peuvent se superposer au lieu d'être redémarrées ;
5. la garantie documentaire de priorité était plus large que le comportement livré ;
6. l'ordre runtime documenté ne correspondait pas à l'orchestration réelle ;
7. le package `presentation` n'est pas encore couvert par le validateur automatisé des frontières.

Voir [Addenda post-fusion du Sprint 3.6](../audits/sprint-3-6-post-fusion-p2-addendum.md).

## Sprint 4.0 : condition de clôture définitive

Le Sprint 4.0 doit corriger ou arbitrer les sept P2, ajouter les tests de non-régression, résoudre les fils de revue et identifier une nouvelle base stable.

Il reste séparé du périmètre fonctionnel du Sprint 4 et ne doit introduire aucune salle, compétence, créature, mécanique ou valeur d'équilibrage nouvelle.

## Frontières historiques respectées

- aucune règle tactique ajoutée par la présentation ;
- aucune mutation volontaire de `RoomState` par renderer, UI, audio ou journal ;
- aucune nouvelle version de sauvegarde pour les effets transitoires ;
- aucun appel réseau tiers ;
- aucun secret ou hasard métier ;
- aucune véritable 3D ou WebAssembly ;
- Gargottex non modifié.

La validation définitive de ces frontières inclura la correction du P2 relatif au validateur de packages.

## Décision de sortie actualisée

Le Sprint 3 est fonctionnellement livré et fusionné. Sa clôture définitive reste soumise à un dernier lot de stabilisation du Sprint 3.6 et à la résolution des écarts P2 post-fusion.

La documentation du Sprint 4 peut être préparée. Le développement fonctionnel des lots 4.1 à 4.7 ne doit commencer qu'après validation du Sprint 4.0.

Références :

- [Architecture de présentation](../architecture/presentation-and-finishing.md) ;
- [Audit historique Sprint 3.6](../audits/sprint-3-6-presentation-finishing.md) ;
- [Addenda P2 post-fusion](../audits/sprint-3-6-post-fusion-p2-addendum.md) ;
- [Sprint 4](sprint-4.md) ;
- [Roadmap](../roadmap.md).
