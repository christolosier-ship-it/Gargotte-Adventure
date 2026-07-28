# Présentation et finition du Sprint 3.6

## Statut

- Sprint fonctionnel : 3.6, livré
- Clôture définitive : sous réserve du Sprint 4.0
- Issue fonctionnelle : #57
- Pull Request fonctionnelle : #59
- Commit fonctionnel : `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`
- Documentation de clôture initiale : PR #60
- Addenda : [P2 post-fusion](../audits/sprint-3-6-post-fusion-p2-addendum.md)

## Objectif

Rendre les conséquences tactiques lisibles, audibles et confortables sans déplacer aucune règle vers le renderer, l'UI, l'audio ou le journal.

```text
intention
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

`routeTacticalPresentation` reçoit les événements résolus et une fonction de traduction. Il retourne des cues visuels, des cues audio et une entrée de journal.

Garanties livrées :

- aucune mutation des événements ou de `RoomState` ;
- aucune cible, règle ou conséquence recalculée ;
- regroupement par action racine ;
- sorties bornées ;
- ordre causal des sorties retenues ;
- conservation prioritaire des conséquences importantes dans le journal borné.

Réserve importante : la version fusionnée applique encore les plafonds de dix cues visuels et six cues audio par troncature. Elle ne garantit pas la conservation de tous les cues visuels ou audio prioritaires tardifs.

Le Sprint 4.0 doit sélectionner les cues prioritaires, puis restaurer leur ordre causal.

## Cues terminaux

Le routeur sait produire des cues de victoire et défaite lorsqu'il reçoit l'information terminale attendue.

L'audit post-fusion a constaté que les chemins ordinaires de combat peuvent mettre `RoomState.phase` à `victory` ou `defeat` sans produire l'événement requis. Le résultat terminal peut donc rester sans overlay, son ou message dédié.

Le Sprint 4.0 doit :

- détecter une transition réelle entre l'état précédent et l'état suivant ou produire un événement moteur explicite ;
- couvrir victoire et défaite ordinaires ;
- éviter que la présentation recalcule elle-même la règle terminale ;
- tester les longues chaînes se terminant par une phase terminale.

## Ports de sortie

Renderer, audio et UI exposent leurs propres interfaces structurelles compatibles avec les sorties du routeur. Ils ne dépendent pas du package `presentation`.

Cette organisation vise un graphe unidirectionnel. Toutefois, `packages/presentation` n'est pas encore couvert par le validateur automatisé des dépendances autorisées. Cette couverture appartient au Sprint 4.0.

## Renderer

Une couche PixiJS transitoire affiche après le rendu stable :

- activation du héros ;
- déplacement et poussée ;
- impact et dégâts ;
- variation du Brouhaha ;
- seuil et renfort ;
- victoire et défaite lorsque la transition terminale est fournie.

La couche n'accepte aucun événement de pointeur. Ses timers et objets sont détruits lors d'une nouvelle lecture, d'un rendu, d'une rotation, d'une reprise ou de la destruction du renderer.

Au Sprint 4, elle pourra présenter :

- préparation d'expédition ;
- objectif et règle spéciale de salle ;
- sortie disponible ;
- transition entre salles ;
- résultat global.

Ces présentations restent dérivées et ne décident jamais de la progression.

## Audio

`AudioDirector` joue sept tonalités pilotes locales Web Audio : interaction, impact, dégâts, Brouhaha, renfort, victoire et défaite.

Garanties attendues :

- déverrouillage par interaction utilisateur ;
- volume et mute ;
- cache ;
- échec toléré ;
- aucun appel réseau ;
- remplacement futur possible par des fichiers locaux.

Réserves post-fusion :

- un champ persisté invalide peut écraser une valeur par défaut avec `undefined` ;
- rejouer rapidement une même tonalité peut superposer des oscillateurs.

Le Sprint 4.0 doit valider les champs avant configuration et implémenter un redémarrage réel des sons répétés.

## Journal

Le journal conserve six actions racines au maximum et un nombre borné de conséquences par entrée.

Une chaîne doit expliquer les résultats de renfort total, partiel ou refusé. Les historiques moteur restent la preuve persistante complète.

Au Sprint 4, le journal doit aussi expliquer :

- sélection d'une compétence ;
- décision ennemie et profil dominant ;
- interaction d'un ennemi avec le décor ;
- influence du Brouhaha ;
- objectif atteint ;
- sortie disponible ;
- transition et résultat global.

Il ne doit pas reconstruire ces raisons à partir de l'affichage.

## Reprise

Une reprise restaure l'état stable et ne rejoue aucun son, overlay, impact ou renfort historique. Elle ajoute seulement une information de restauration.

Dans le micro-donjon, ce principe s'applique également aux présentations de salle, transitions et résultat : seul l'état courant est reconstruit.

## Ordre runtime

L'orchestration livrée observée suit :

```text
résolution moteur
→ rendu stable
→ présentation
→ demande de persistance asynchrone
```

La formulation antérieure plaçait la persistance avant la présentation. Le Sprint 4.0 doit confirmer cet ordre comme contrat ou modifier le code, puis verrouiller la décision par des tests.

## Accessibilité

- mouvement réduit ;
- mute et volume accessibles ;
- information disponible dans le DOM ;
- aucune information essentielle uniquement sonore ou colorée ;
- overlays sans capture du focus, du clic ou du toucher ;
- état accessible du contrôle mute même après préférences persistées invalides.

## Diagnostics

Le système expose canvas, objets stables et transitoires, génération de cues, listeners, cache audio et statut du mouvement réduit.

Au Sprint 4, ces données appartiennent au mode diagnostic distinct. Elles ne doivent pas encombrer le parcours joueur normal.

## Sprint 4.0

Critères de stabilisation :

- cues terminaux sur les transitions réelles ;
- plafonds visuels et audio respectant les priorités ;
- préférences invalides conservant les défauts ;
- tonalités répétées sans superposition ;
- ordre runtime aligné ;
- package `presentation` couvert par le validateur ;
- tests unitaires et Playwright de non-régression ;
- sept fils P2 résolus ;
- documentation GitHub et Drive alignée.

## Articulation avec le Sprint 4

Les lots 4.1 à 4.7 réutilisent la couche de présentation pour expliquer l'expédition, les compétences, les décisions ennemies, les influences du Brouhaha, les sorties de salle et le résultat global.

La présentation ne doit jamais :

- modifier `ExpeditionState` ou `RoomState` ;
- ouvrir une porte ;
- transférer un héros ;
- choisir une action ennemie ;
- déclencher un renfort ;
- décider d'une victoire ou défaite.

## Validation historique

Le HEAD final de la PR #59 a validé les contrôles disponibles lors de la fusion : formatage, contenu, TypeScript strict, 131 tests unitaires, build, validation structurelle existante et Playwright bureau/mobile.

Cette CI verte ne résout pas les sept P2 découverts après fusion.

## Frontières

- aucune règle tactique dans la présentation ;
- aucune nouvelle version de sauvegarde pour les effets transitoires ;
- aucun appel réseau tiers ou secret ;
- aucun hasard métier ;
- aucune véritable 3D ou WebAssembly ;
- Gargottex strictement en lecture seule.

## Suite

Le Sprint 3 est fonctionnellement livré. Sa clôture définitive dépend du Sprint 4.0.

Après cette stabilisation, le Sprint 4 construira le micro-donjon manuel de trois salles, les héros, créatures et comportements de Bastognac.
