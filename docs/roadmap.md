# Roadmap

La roadmap décrit des résultats vérifiables, pas un calendrier contractuel. Chaque sprint réduit un risque principal et laisse une base démontrable.

## État d'avancement

| Sprint                                     | Statut     | Résultat principal                                                     |
| ------------------------------------------ | ---------- | ---------------------------------------------------------------------- |
| Sprint 0 : Fondations                      | ✅ Terminé | PWA installable, architecture modulaire, CI, Pages et paquet Bastognac |
| Sprint 1 : Boucle de salle                 | ✅ Terminé | Salle tactique 8 × 4, IA déterministe, sauvegarde et reprise           |
| Sprint 2 : Plateau isométrique             | ✅ Terminé | Salle jouable en 2D isométrique avec pipeline graphique réutilisable   |
| Sprint 3 : Brouhaha, spawn et décor        | ✅ Terminé | Plateau acteur, renforts déterministes et présentation lisible         |
| Sprint 4 : Héros et créatures de Bastognac | À venir    | Rôles, compétences, archétypes et comportements définitifs             |
| Sprint 5 : Donjon généré et finition       | À venir    | Cinq étages générés, rencontres par salle, loot et boss                |

## Sprints terminés

### Sprint 0 : fondations

Gouvernance, sécurité, TypeScript strict, PWA offline-first, CI et GitHub Pages.

### Sprint 1 : boucle de salle

Sélection des héros, trois actions, déplacement, combat, IA explicable, victoire, défaite et sauvegarde.

### Sprint 2 : plateau isométrique

Projection 128 × 64, picking, caméra à quatre orientations, profondeur, murs, assets et fallbacks.

### Sprint 3 : Brouhaha, spawn, décor et finition

Le Sprint 3 est entièrement livré :

- **3.1** : définitions/instances séparées, points et demandes de spawn, identifiants reproductibles ;
- **3.2** : Brouhaha 0–12, effets, historique et sauvegarde ;
- **3.3** : tables, tonneaux, grilles, torches et piliers interactifs ;
- **3.4** : poussées et réactions FIFO déterministes ;
- **3.5** : renforts par franchissement montant, limites persistantes et roster ennemi figé ;
- **3.6** : routeur de présentation, cues PixiJS, audio local, journal groupé, mouvement réduit et reprise sans replay.

La PR #59 a livré le Sprint 3.6 au commit `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`.

Résultat obtenu : le bruit et le décor produisent des décisions tactiques et des catastrophes lisibles, tandis que le moteur reste déterministe et indépendant de la présentation.

Références :

- [Suivi du Sprint 3](sprints/sprint-3.md) ;
- [Présentation et finition du Sprint 3.6](architecture/presentation-and-finishing.md) ;
- [Audit de livraison du Sprint 3.6](audits/sprint-3-6-presentation-finishing.md).

## Sprint 4 : héros et créatures de Bastognac

- caractéristiques et rôles équilibrés ;
- compétences propres aux quatre héros ;
- seize créatures de Bastognac ;
- catégories et valeurs de menace ;
- comportements IA différenciés ;
- fiches et tutoriel contextuel ;
- intégration progressive des sprites définitifs ;
- équilibrage du vertical slice.

Les archétypes restent instanciables par le moteur de spawn sans modifier sa frontière. Les valeurs pilotes des renforts pourront être rééquilibrées sans réécrire leur mécanisme.

## Sprint 5 : donjon complet généré

### Génération

- topologie des cinq étages ;
- graphe, chemin critique et embranchements ;
- géométrie complète des salles ;
- murs, portes, passages, obstacles et points de spawn ;
- validation de connectivité et de jouabilité.

### Rencontres

Chaque salle reçoit son propre budget de menace. **Le budget est validé par salle, jamais comme un portefeuille global d'étage.**

Le générateur compose une population, puis le moteur de spawn crée les instances. Les renforts de Brouhaha restent une augmentation runtime distincte.

### Progression

- loot et progression ;
- boss Baron Pas-Très-Terrifiant ;
- reprise de campagne ;
- tests utilisateurs et performances mobile.

## Principes de priorisation

1. expérience joueur avant sophistication technique ;
2. règles testables avant animations ;
3. rendu stabilisé avant multiplication du décor ;
4. événements stables avant effets de présentation ;
5. définitions stabilisées avant génération massive ;
6. budget de menace calculé par salle ;
7. Bastognac complet avant un second donjon ;
8. mesures de performance avant WebAssembly ou véritable 3D ;
9. aucune dépendance à l'API OpenAI pour jouer une partie.
