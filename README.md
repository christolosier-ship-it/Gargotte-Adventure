# Gargotte Adventure

Jeu de plateau numérique coopératif et tactique dans l'univers de **Gargotte & Va-Nu-Pieds**.

Gargotte Adventure vise une expérience installable, tactile et offline-first sur téléphone, tablette et ordinateur. Le premier vertical slice est consacré au **Château de Bastognac**.

## Jouer

[🎮 Ouvrir Gargotte Adventure sur GitHub Pages](https://christolosier-ship-it.github.io/Gargotte-Adventure/)

## État du projet

- **Sprint 0** : fondations, PWA, CI et gouvernance livrées ;
- **Sprint 1** : boucle tactique, IA et sauvegarde livrées ;
- **Sprint 2** : plateau isométrique, caméra et pipeline d'assets livrés ;
- **Sprint 3.1** : spawn déterministe livré ;
- **Sprint 3.2** : Brouhaha 0 à 12 livré ;
- **Sprint 3.3** : objets interactifs livrés ;
- **Sprint 3.4** : réactions en chaîne livrées ;
- **Sprint 3.5** : renforts de Brouhaha livrés ;
- **Sprint 3.6** : présentation, audio utile, journal causal et reprise sans replay livrés par la PR #59.

Le Sprint 3 est fonctionnellement livré et fusionné. Sa clôture définitive reste soumise à un dernier lot de stabilisation du Sprint 3.6 et à la résolution des écarts P2 post-fusion.

Le **Sprint 4.0** traitera cette stabilisation séparément. Les lots fonctionnels **4.1 à 4.7** construiront ensuite le micro-donjon de Bastognac.

## Réserve de stabilisation Sprint 3.6

Sept P2 restent ouverts après les PR #59 et #60 :

- cues terminaux sur les transitions réelles victoire et défaite ;
- validation défensive des préférences audio persistées ;
- conservation des cues prioritaires lorsque les plafonds sont atteints ;
- redémarrage des tonalités répétées sans superposition ;
- garantie documentaire de priorité à aligner ;
- ordre runtime à documenter selon l'orchestration réelle ;
- package `presentation` à intégrer au validateur de frontières.

Voir [Addenda post-fusion du Sprint 3.6](docs/audits/sprint-3-6-post-fusion-p2-addendum.md).

## Sprint 4 : héros, créatures et comportements de Bastognac

Le résultat attendu n'est plus une simple collection de statistiques et de fiches. Le Sprint 4 doit livrer une expérience presque finale sur un micro-donjon fixe de trois salles adjacentes :

```text
Préparation
→ Salle 1 : prise en main tactique
→ Salle 2 : décor, réactions et Brouhaha
→ Salle 3 : confrontation complète
→ Résultat de l'expédition
```

Le Sprint 4 couvre :

- quatre héros définitifs ;
- seize créatures de Bastognac ;
- rôles, statistiques, compétences et capacités ;
- profils d'IA différenciés, déterministes et explicables ;
- interactions des héros et créatures avec le décor ;
- influences déclaratives du Brouhaha ;
- état minimal d'expédition et persistance inter-salles ;
- objectifs, portes, transitions, victoire et défaite ;
- parcours joueur sans commandes techniques ;
- mode diagnostic distinct ;
- sauvegarde et reprise sur les trois salles.

Voir [Suivi du Sprint 4](docs/sprints/sprint-4.md).

## Frontière avec le Sprint 5

Le Sprint 4 écrit ses trois salles à la main. Il ne crée aucun générateur provisoire.

Le Sprint 5 générera :

- la topologie des cinq étages ;
- la géométrie des salles ;
- les embranchements ;
- les rencontres automatiques ;
- le loot et la progression ;
- la campagne ;
- le Baron Pas-Très-Terrifiant ;
- la reprise d'une expédition générée.

Chaque salle conserve son propre budget de menace. Le moteur de spawn reste l'unique frontière d'instanciation des créatures.

## Version fonctionnelle actuelle

La version fusionnée permet de :

- sélectionner de 1 à 4 héros pilotes ;
- jouer une salle tactique 8 × 4 ;
- déplacer, attaquer et résoudre une IA déterministe ;
- interagir avec tables, tonneaux, grilles, torches et piliers ;
- pousser certains objets et propager des réactions déclarées ;
- faire évoluer une jauge de Brouhaha de 0 à 12 ;
- déclencher des renforts lors de franchissements montants ;
- expliquer les apparitions totales, partielles ou refusées ;
- sauvegarder et restaurer une salle tactique version 6 ;
- afficher des cues visuels et jouer des sons locaux ;
- regrouper les conséquences dans un journal borné ;
- respecter le mouvement réduit ;
- reprendre sans rejouer les effets historiques ;
- rester jouable au clavier, à la souris et au toucher en paysage.

Ces capacités restent soumises aux réserves P2 listées plus haut pour la clôture définitive du Sprint 3.

## Héros concernés par le Sprint 4

- **Brünhilda la Torgnole** ;
- **Aelion Trois-Gorgées** ;
- **Magdalena Coquinelle** ;
- **Grompif Arcabidon**.

Les valeurs détaillées, capacités exactes et équilibrages ne sont pas fixés par le cadrage documentaire.

## Principes directeurs

1. **Un jeu, pas un éditeur.** Gargottex reste une source éditoriale externe en lecture seule.
2. **Déterministe et lisible.** Aucun résultat caché ou opaque.
3. **Mobile d'abord.** Interface tactile en paysage.
4. **Offline-first.** Parties et réglages restent locaux.
5. **Aucun secret côté client.** Aucune clé OpenAI dans la PWA.
6. **Une version démontrable à chaque sprint.**
7. **Le rendu et la présentation ne gouvernent pas les règles.**
8. **Définitions, instances, placements et génération restent séparés.**
9. **Le budget de menace appartient à la salle.**
10. **Les acteurs produisent des intentions, les moteurs appliquent les conséquences.**
11. **Le mode diagnostic reste distinct du parcours joueur.**
12. **Aucun faux générateur avant le Sprint 5.**

## Architecture actuelle et cible

```text
apps/game                    composition de la PWA et orchestration
packages/engine              tactique, spawn, Brouhaha, objets, réactions et renforts
packages/presentation        routage pur des événements vers les cues et le journal
packages/content-schema      validation Zod du contenu
packages/renderer            projection, scène PixiJS, assets et effets transitoires
packages/ui                  menus, HUD, journal et commandes accessibles
packages/save                sauvegardes IndexedDB versionnées et migrations
packages/audio               lecture locale Web Audio, volume, mute et cache
packages/common              types et utilitaires partagés
content/bastognac            contenu éditorial du vertical slice
tests/e2e                    parcours Playwright desktop et mobile
```

Le Sprint 4 ajoutera conceptuellement `ExpeditionState`, `HeroDefinition`, les profils de comportement et les trois salles, sans créer de dossier vide ni d'implémentation dans ce lot documentaire.

## Démarrage local

Prérequis : Node.js 24 ou supérieur, npm et Chromium Playwright.

```bash
npm ci
npm run dev
```

Contrôle complet :

```bash
npm run check
npx playwright install --with-deps chromium
npm run test:e2e
```

## Documentation

- [Index documentaire](docs/README.md)
- [Vision produit](docs/product/vision.md)
- [Roadmap](docs/roadmap.md)
- [Suivi du Sprint 3](docs/sprints/sprint-3.md)
- [Suivi du Sprint 4](docs/sprints/sprint-4.md)
- [Micro-donjon et état d'expédition](docs/architecture/micro-dungeon-and-expedition.md)
- [Héros, créatures et comportements](docs/architecture/actors-and-behaviors.md)
- [Architecture générale](docs/architecture/overview.md)
- [Addenda P2 du Sprint 3.6](docs/audits/sprint-3-6-post-fusion-p2-addendum.md)
- [Décisions d'architecture](docs/adr/README.md)

## Sources du projet

- **Gargottex V5** pour les données structurées et l'édition du contenu, strictement en lecture seule depuis ce projet ;
- **Google Drive** pour les règles humaines, le lore, les médias maîtres et comptes rendus ;
- **Figma / FigJam** pour les écrans et diagrammes ;
- ce dépôt pour le moteur, l'interface, les builds, les contrats et les tests.

## Licence

Aucune licence open source n'est accordée pour le moment. Les droits sur le code, l'univers, les textes et les ressources restent réservés à leur auteur.
