# Roadmap

La roadmap décrit des résultats vérifiables, pas un calendrier contractuel. Chaque sprint réduit un risque principal et laisse une base démontrable.

## État d'avancement

| Sprint                                                    | Statut                | Résultat principal                                                         |
| --------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------- |
| Sprint 0 : Fondations                                     | ✅ Terminé            | PWA installable, architecture modulaire, CI, Pages et paquet Bastognac     |
| Sprint 1 : Boucle de salle                                | ✅ Terminé            | Salle tactique 8 × 4, IA déterministe, sauvegarde et reprise               |
| Sprint 2 : Plateau isométrique                            | ✅ Terminé            | Salle jouable en 2D isométrique avec pipeline graphique réutilisable       |
| Sprint 3 : Brouhaha, spawn, décor et présentation         | 🟠 Livré sous réserve | Fonctionnellement fusionné, sept P2 post-fusion à stabiliser               |
| Sprint 4.0 : Stabilisation finale du Sprint 3.6           | Prérequis             | Résolution des P2, non-régression et nouvelle base stable                  |
| Sprint 4 : Héros, créatures et comportements de Bastognac | Cadré, non implémenté | Micro-donjon manuel de trois salles proche de l'expérience finale          |
| Sprint 5 : Donjon complet généré                          | À venir               | Cinq étages générés, rencontres par salle, loot, progression et boss final |

## Sprints 0 à 2

### Sprint 0 : fondations

Gouvernance, sécurité, TypeScript strict, PWA offline-first, CI et GitHub Pages.

### Sprint 1 : boucle de salle

Sélection des héros, actions, déplacement, combat, IA explicable, victoire, défaite et sauvegarde.

### Sprint 2 : plateau isométrique

Projection 128 × 64, picking, caméra, profondeur, murs, assets et fallbacks.

## Sprint 3 : livré sous réserve de stabilisation

Les six étapes fonctionnelles sont fusionnées :

- **3.1** : définitions et instances séparées, points et demandes de spawn, identifiants reproductibles ;
- **3.2** : Brouhaha 0 à 12, effets, historique et sauvegarde ;
- **3.3** : tables, tonneaux, grilles, torches et piliers interactifs ;
- **3.4** : poussées et réactions FIFO déterministes ;
- **3.5** : renforts par franchissement montant, limites persistantes et roster ennemi figé ;
- **3.6** : routeur de présentation, cues PixiJS, audio local, journal groupé, mouvement réduit et reprise sans replay.

La PR #59 a livré le Sprint 3.6 au commit `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`. La PR #60 a publié la documentation de clôture au commit `cc7756ba94a41be0eb2e20ca5a9f6ff6766df3fe`.

L'audit post-fusion conserve sept écarts P2 ouverts. Le Sprint 3 ne doit donc plus être présenté comme définitivement stabilisé sans réserve.

Formulation active :

> Le Sprint 3 est fonctionnellement livré et fusionné. Sa clôture définitive reste soumise à un dernier lot de stabilisation du Sprint 3.6 et à la résolution des écarts P2 post-fusion.

Références :

- [Suivi du Sprint 3](sprints/sprint-3.md) ;
- [Addenda P2 post-fusion](audits/sprint-3-6-post-fusion-p2-addendum.md) ;
- [Présentation et finition du Sprint 3.6](architecture/presentation-and-finishing.md).

## Sprint 4.0 : stabilisation finale du Sprint 3.6

Ce lot est un prérequis technique indépendant du périmètre fonctionnel du Sprint 4.

Il doit :

- corriger les cues terminaux de victoire et défaite ;
- valider défensivement les préférences audio persistées ;
- préserver les cues prioritaires sous les plafonds ;
- empêcher la superposition des tonalités répétées ;
- aligner les garanties documentaires avec le comportement ;
- documenter ou ajuster l'ordre runtime réel ;
- intégrer `packages/presentation` au validateur de frontières ;
- ajouter les tests de non-régression ;
- résoudre les sept fils de revue ;
- publier une nouvelle base stable GitHub et Drive.

Il ne doit introduire ni héros, ni créature, ni compétence, ni salle, ni équilibrage du Sprint 4.

## Sprint 4 : héros, créatures et comportements de Bastognac

### Résultat attendu

Un joueur sélectionne son équipe et parcourt un micro-donjon fixe de trois salles adjacentes. Il conserve l'état de ses héros, affronte plusieurs profils de créatures, utilise ou subit le décor, gère le Brouhaha et les renforts, comprend l'IA et atteint une victoire ou une défaite sans commandes techniques.

### Micro-donjon manuel

```text
Préparation
→ Salle 1 : prise en main tactique
→ Salle 2 : décor, réactions et Brouhaha
→ Salle 3 : confrontation complète
→ Résultat du micro-donjon
```

Les salles, connexions, objectifs, placements, objets, réactions, points de spawn, renforts et conditions de sortie sont écrits à la main.

### Contenu fonctionnel

- quatre héros définitifs ;
- seize créatures de Bastognac ;
- rôles, statistiques, compétences et capacités ;
- profils d'IA différenciés, déterministes et explicables ;
- interactions des héros et créatures avec les objets ;
- influences déclaratives du Brouhaha ;
- état minimal d'expédition ;
- persistance des héros entre les salles ;
- Brouhaha, ennemis, objets et renforts locaux à chaque salle ;
- portes, objectifs et transitions ;
- victoire ou défaite globale ;
- parcours joueur sans commandes techniques ;
- mode diagnostic distinct ;
- sauvegarde et reprise sur les trois salles.

### Lots

- **4.1** : micro-donjon, phases de jeu et état d'expédition ;
- **4.2** : contrats des héros, créatures, compétences et comportements ;
- **4.3** : quatre héros ;
- **4.4** : bestiaire de seize créatures ;
- **4.5** : IA, objets et Brouhaha ;
- **4.6** : salles 1 et 2 ;
- **4.7** : salle 3, intégration globale et audit de sortie.

Références :

- [Suivi détaillé du Sprint 4](sprints/sprint-4.md) ;
- [Micro-donjon et état d'expédition](architecture/micro-dungeon-and-expedition.md) ;
- [Héros, créatures et comportements](architecture/actors-and-behaviors.md).

## Frontière du Sprint 5

Le Sprint 5 reste responsable de :

### Génération

- cinq étages ;
- topologie, chemin critique et embranchements ;
- géométrie complète des salles ;
- murs, portes, passages, obstacles et points de spawn ;
- validation de connectivité et de jouabilité.

### Rencontres

Chaque salle reçoit son propre budget de menace. **Le budget est validé par salle, jamais comme un portefeuille global d'étage.**

Le générateur compose une population, puis le moteur de spawn crée les instances. Les renforts de Brouhaha restent une augmentation runtime distincte.

### Progression

- loot ;
- progression ;
- campagne ;
- Baron Pas-Très-Terrifiant ;
- reprise d'une expédition générée ;
- tests utilisateurs et performances mobile.

Le Sprint 4 ne crée aucun faux générateur provisoire destiné à être supprimé au Sprint 5.

## Principes de priorisation

1. stabilité de la base avant nouvelle mécanique ;
2. expérience joueur avant sophistication technique ;
3. règles testables avant animations ;
4. définitions séparées des instances et placements ;
5. profils déclaratifs avant conditions nominatives dispersées ;
6. intentions d'acteurs avant conséquences résolues par les moteurs ;
7. Brouhaha local à la salle ;
8. micro-donjon manuel avant génération ;
9. budget de menace calculé par salle ;
10. Bastognac complet avant un second donjon ;
11. mesures de performance avant WebAssembly ou véritable 3D ;
12. aucune dépendance à l'API OpenAI pour jouer une partie.
