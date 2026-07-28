# Roadmap

La roadmap décrit des résultats vérifiables, pas un calendrier contractuel. Chaque sprint réduit un risque principal et laisse une base démontrable.

## État d’avancement

| Sprint                                                    | Statut              | Résultat principal                                                        |
| --------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| Sprint 0 : Fondations                                     | ✅ Terminé          | PWA installable, architecture modulaire, CI, Pages et paquet Bastognac    |
| Sprint 1 : Boucle de salle                                | ✅ Terminé          | Salle tactique 8 × 4, IA déterministe, sauvegarde et reprise              |
| Sprint 2 : Plateau isométrique                            | ✅ Terminé          | Salle jouable en 2D isométrique avec pipeline graphique réutilisable      |
| Sprint 3 : Brouhaha, spawn, décor et présentation         | ✅ Stabilisé        | Systèmes tactiques et présentation définitivement validés                 |
| Sprint 4.0 : Stabilisation finale du Sprint 3.6           | ✅ Terminé          | Sept P2 corrigés, revue résolue et nouvelle base stable                   |
| Sprint 4.1 : Micro-donjon et état d’expédition            | Prochaine phase     | Trois salles fixes, connexions, transitions et persistance inter-salles   |
| Sprint 4.2 à 4.7 : Acteurs et intégration Bastognac       | Cadré               | Héros, créatures, IA, trois salles complètes et résultat du micro-donjon   |
| Sprint 5 : Donjon complet généré                          | À venir             | Cinq étages générés, rencontres par salle, loot, progression et boss final |

## Sprints 0 à 2

### Sprint 0 : fondations

Gouvernance, sécurité, TypeScript strict, PWA offline-first, CI et GitHub Pages.

### Sprint 1 : boucle de salle

Sélection des héros, actions, déplacement, combat, IA explicable, victoire, défaite et sauvegarde.

### Sprint 2 : plateau isométrique

Projection 128 × 64, picking, caméra, profondeur, murs, assets et fallbacks.

## Sprint 3 : définitivement stabilisé

Les six étapes fonctionnelles sont livrées :

- **3.1** : définitions et instances séparées, points et demandes de spawn, identifiants reproductibles ;
- **3.2** : Brouhaha 0 à 12, effets, historique et sauvegarde ;
- **3.3** : tables, tonneaux, grilles, torches et piliers interactifs ;
- **3.4** : poussées et réactions FIFO déterministes ;
- **3.5** : renforts par franchissement montant, limites persistantes et roster ennemi figé ;
- **3.6** : routeur de présentation, cues PixiJS, audio local, journal groupé, mouvement réduit et reprise sans replay.

Le Sprint 4.0 a fermé la réserve post-fusion du Sprint 3.6. Les sept P2 et leurs sept fils de revue sont résolus.

Références :

- [Suivi du Sprint 3](sprints/sprint-3.md) ;
- [Addenda P2 clôturés](audits/sprint-3-6-post-fusion-p2-addendum.md) ;
- [Présentation stabilisée](architecture/presentation-and-finishing.md).

## Sprint 4.0 : stabilisation finale du Sprint 3.6 ✅

Livré par la PR #64 au commit `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf`.

Résultats :

- cues terminaux dérivés des transitions réelles victoire et défaite ;
- préférences audio persistées validées défensivement ;
- cues prioritaires conservés sous les plafonds puis remis dans leur ordre causal ;
- tonalités répétées redémarrées sans superposition ;
- ordre runtime figé et testé : rendu stable, présentation, persistance asynchrone ;
- `packages/presentation` intégré au validateur des frontières ;
- tests unitaires et Playwright bureau/mobile verts ;
- sept fils de revue historiques résolus.

Voir [Audit du Sprint 4.0](audits/sprint-4-0-stabilization.md).

## Sprint 4 : micro-donjon, héros, créatures et comportements

### Résultat attendu

Un joueur sélectionne son équipe et parcourt un micro-donjon fixe de trois salles adjacentes. Il conserve l’état de ses héros, affronte plusieurs profils de créatures, utilise ou subit le décor, gère le Brouhaha et les renforts, comprend l’IA et atteint une victoire ou une défaite sans commandes techniques.

### Micro-donjon manuel

```text
Préparation
→ Salle 1 : prise en main tactique
→ Salle 2 : décor, réactions et Brouhaha
→ Salle 3 : confrontation complète
→ Résultat du micro-donjon
```

Les salles, connexions, objectifs, placements, objets, réactions, points de spawn, renforts et conditions de sortie sont écrits à la main.

### Lots

- **4.1** : micro-donjon, phases de jeu et état d’expédition ;
- **4.2** : contrats des héros, créatures, compétences et comportements ;
- **4.3** : quatre héros ;
- **4.4** : bestiaire de seize créatures ;
- **4.5** : IA, objets et Brouhaha ;
- **4.6** : salles 1 et 2 ;
- **4.7** : salle 3, intégration globale et audit de sortie.

Références :

- [Suivi détaillé du Sprint 4](sprints/sprint-4.md) ;
- [Micro-donjon et état d’expédition](architecture/micro-dungeon-and-expedition.md) ;
- [Héros, créatures et comportements](architecture/actors-and-behaviors.md).

## Frontière du Sprint 5

Le Sprint 5 reste responsable de :

- cinq étages ;
- topologie, chemin critique et embranchements ;
- géométrie complète des salles ;
- rencontres automatiques selon le budget propre à chaque salle ;
- loot, progression et campagne ;
- Baron Pas-Très-Terrifiant ;
- reprise d’une expédition générée.

Le Sprint 4 ne crée aucun faux générateur provisoire.

## Principes de priorisation

1. stabilité de la base avant nouvelle mécanique ;
2. expérience joueur avant sophistication technique ;
3. règles testables avant animations ;
4. définitions séparées des instances et placements ;
5. profils déclaratifs avant conditions nominatives dispersées ;
6. intentions d’acteurs avant conséquences résolues par les moteurs ;
7. Brouhaha local à la salle ;
8. micro-donjon manuel avant génération ;
9. budget de menace calculé par salle ;
10. Bastognac complet avant un second donjon ;
11. mesures de performance avant WebAssembly ou véritable 3D ;
12. aucune dépendance à l’API OpenAI pour jouer une partie.
