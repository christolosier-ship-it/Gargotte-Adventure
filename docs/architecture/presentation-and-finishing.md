# Présentation et finition du Sprint 3.6

## Statut

- Cible : Sprint 3.6
- État : cadré, non implémenté
- Prérequis fusionnés : Sprints 3.1 à 3.5
- Base stable : `18a97f64f97760417f6c1e5e4cdcc139ae1e77ac`
- Issue documentaire : #50

## Objectif

Le Sprint 3.6 clôt le Sprint 3 en rendant les conséquences tactiques plus lisibles, plus audibles et plus confortables sans modifier les règles livrées.

Les événements du moteur restent la source de vérité. Les overlays, animations, sons et formulations du journal ne décident jamais qu'une action réussit, qu'un renfort apparaît ou qu'une phase se termine.

```text
intention joueur
      │
      ▼
moteur tactique
      │
      ├─ nouvel état RoomState
      └─ événements ordonnés
              │
              ▼
      routeur de présentation
          ┌───┴───────────┐
          ▼               ▼
     cues visuels      cues audio
          │               │
          └──────┬────────┘
                 ▼
        journal et rendu final
```

## État de départ

La base fusionnée possède déjà :

- un `RoomState` version 6 entièrement restaurable ;
- des événements explicites pour combat, Brouhaha, objets, réactions, spawn et renforts ;
- des traducteurs de messages dans `apps/game/src/event-messages.ts` ;
- un journal DOM limité aux six entrées les plus récentes ;
- un renderer PixiJS qui reconstruit les couches de scène à chaque rendu ;
- des diagnostics exposant notamment caméra, cache d'assets et nombre d'objets affichés ;
- un `AudioDirector` contenant volume général et mode muet, sans lecture sonore connectée à la boucle de jeu.

Le Sprint 3.6 branche et consolide ces fondations. Il ne crée pas un second moteur de règles.

## Frontières de responsabilité

### Moteur tactique

Le moteur produit l'état final et des événements ordonnés. Il ne connaît ni durée d'animation, ni volume, ni texture d'overlay, ni formulation visible.

Un événement peut être enrichi avec une donnée métier manquante uniquement lorsque cette donnée existe déjà dans la résolution. Le moteur ne produit pas d'instruction PixiJS ou Web Audio.

### Routeur de présentation

Une couche applicative dédiée transforme les événements en cues de présentation.

Un cue peut décrire :

- une catégorie visuelle ;
- une cible logique éventuelle ;
- une priorité ;
- une durée indicative ;
- une clé sonore éventuelle ;
- un texte court ou un groupe causal pour le journal.

Le routeur ne modifie jamais `RoomState`, ne recalcule aucune cible et ne choisit aucun résultat métier.

### Renderer

Le renderer affiche l'état stable puis joue les cues visuels transitoires : surbrillance, impact, apparition, variation du Brouhaha ou phase terminale.

Les effets transitoires vivent dans une couche dédiée et sont détruits ou annulés lors d'un nouveau rendu, d'une reprise ou de la destruction du renderer.

### Audio

`packages/audio` devient responsable de la lecture locale des premiers sons utiles.

Il doit :

- respecter `masterVolume` et `muted` ;
- attendre une interaction utilisateur avant toute lecture imposée par les règles d'autoplay ;
- tolérer un asset absent sans bloquer la partie ;
- mettre en cache les ressources déjà chargées ;
- ne jamais effectuer d'appel réseau vers un service tiers ;
- pouvoir être désactivé sans modifier le résultat tactique.

### UI et journal

L'UI affiche des formulations compréhensibles et peut regrouper les conséquences d'une même action racine.

Le journal reste une vue de présentation. Les historiques persistants du moteur demeurent la preuve complète pour les tests, la reprise et le diagnostic.

## Cues pilotes

Le premier lot reste petit et démontrable.

### Cues visuels

- sélection et activation du héros ;
- déplacement ou poussée d'objet ;
- impact et dégâts ;
- changement de niveau du Brouhaha ;
- franchissement de seuil et apparition d'un renfort ;
- refus ou apparition partielle ;
- victoire et défaite.

### Cues audio

- interaction ou impact ;
- dégâts ;
- montée significative du Brouhaha ;
- apparition d'un renfort ;
- victoire et défaite.

Les sons définitifs, doublages, musiques et bibliothèques complètes n'appartiennent pas à ce sprint.

## Ordre et concurrence

Les cues sont produits dans l'ordre des événements retournés par le moteur.

Principes :

1. l'état final est disponible immédiatement pour les règles et la sauvegarde ;
2. la présentation peut séquencer les cues sans retarder la validité de l'état ;
3. deux cues issus de la même action conservent leur ordre causal ;
4. une nouvelle intention invalide les effets transitoires devenus obsolètes ;
5. une phase terminale possède la priorité visuelle la plus haute ;
6. aucune animation ne bloque indéfiniment les commandes.

Le temps d'animation n'est jamais sauvegardé et n'entre pas dans le déterminisme métier.

## Journal enrichi

Le journal doit privilégier la compréhension plutôt que la répétition brute des identifiants techniques.

Le cadrage prévoit :

- un résumé de l'action racine ;
- les conséquences importantes dans leur ordre ;
- l'identification claire des succès partiels et refus ;
- un message explicite pour les seuils et renforts ;
- une formulation terminale stable ;
- des détails techniques conservés dans les diagnostics et historiques, pas imposés dans chaque phrase visible.

La limite visible actuelle de six entrées peut évoluer, mais la liste DOM doit rester bornée afin d'éviter une croissance permanente pendant une longue session.

## Reprise et restauration

Une reprise reconstruit la scène depuis le `RoomState` sauvegardé.

Elle ne rejoue pas :

- les animations déjà terminées ;
- les sons historiques ;
- les impacts transitoires ;
- les apparitions déjà résolues.

Après chargement :

- le plateau reflète immédiatement les positions, états, PV, objets, Brouhaha, renforts et phase terminale sauvegardés ;
- le journal annonce la restauration sans simuler de nouveaux événements métier ;
- les préférences audio appartiennent aux réglages applicatifs, pas au schéma tactique ;
- aucun changement de version de `RoomState` n'est prévu pour des données purement visuelles ou sonores.

## Accessibilité et confort

- `prefers-reduced-motion` remplace les mouvements non indispensables par des transitions courtes ou statiques ;
- le mode muet reste accessible sans entrer dans une partie ;
- aucune information essentielle n'est transmise uniquement par la couleur ou le son ;
- les messages restent disponibles dans le DOM ;
- le focus clavier et les commandes tactiles ne sont pas capturés par un overlay décoratif ;
- les effets visuels ne masquent pas durablement une cible ou une case jouable.

## Mesures de fluidité

Le Sprint 3.6 commence par établir une base mesurée sur le build de production, sur Chrome bureau et mobile paysage.

Les diagnostics existants servent de garde-fous :

- `data-display-objects` reste stable après des rendus répétés d'un état équivalent ;
- `data-asset-cache-size` se stabilise après le préchargement et la première utilisation ;
- un seul canvas reste monté ;
- les listeners de sélection ne se multiplient pas après rotation, reprise ou rerendu ;
- les effets transitoires sont détruits après lecture ou annulation ;
- une séquence répétée d'interactions ne provoque pas de croissance continue des objets PixiJS ou du DOM du journal.

Une optimisation structurelle n'est réalisée que si une mesure révèle une régression. Le Sprint 3.6 ne remplace pas automatiquement le rendu complet par un diff incrémental et n'introduit pas WebAssembly par anticipation.

## Stratégie de tests

### Tests unitaires

- conversion événement vers cue ;
- ordre et priorité des cues ;
- regroupement causal du journal ;
- réglages de volume et mode muet ;
- fallback lorsqu'un son ou un effet manque ;
- annulation des effets transitoires ;
- absence de mutation de `RoomState`.

### Tests renderer et UI

- overlays présents puis détruits ;
- focus, clavier et toucher préservés ;
- journal borné et lisible ;
- état terminal visible ;
- mode mouvement réduit ;
- absence de croissance des objets affichés après répétition.

### Playwright

Les parcours bureau et mobile paysage vérifient au minimum :

- combat avec impact et journal ;
- interaction bruyante et changement du Brouhaha ;
- chaîne table → pilier → grille ;
- apparition totale et partielle de renforts ;
- victoire ou défaite ;
- sauvegarde, rechargement et absence de replay transitoire ;
- mode muet et mouvement réduit ;
- stabilité des diagnostics après plusieurs cycles.

Les tests audio contrôlent les appels et états de lecture sans dépendre du matériel sonore de la machine CI.

## Critères de sortie du Sprint 3.6

- les cues proviennent exclusivement des événements et de l'état moteur ;
- aucune règle métier n'est ajoutée dans le renderer, l'UI ou l'audio ;
- les conséquences principales possèdent un retour visuel lisible ;
- les premiers sons utiles respectent volume, mute, autoplay et fallback ;
- le journal explique action racine, causalité, seuils, renforts et résultats partiels ;
- une reprise restaure l'état stable sans rejouer les effets historiques ;
- le mode mouvement réduit et l'usage sans son restent fonctionnels ;
- les objets PixiJS, listeners, cache d'assets et éléments du journal ne croissent pas sans limite ;
- les tests unitaires et Playwright passent sur Chrome bureau et mobile paysage ;
- aucun appel réseau tiers, secret, hasard métier ou dépendance à Gargottex n'est ajouté ;
- la documentation active et l'audit final du Sprint 3 sont alignés avant fusion.

## Hors périmètre

- nouvelles règles tactiques ;
- rééquilibrage des héros, créatures ou seuils ;
- catalogue final d'assets ;
- animations complètes de tous les personnages ;
- musique adaptative, doublage ou spatialisation avancée ;
- génération de donjon et de rencontres ;
- loot, progression et campagne ;
- véritable 3D ou WebAssembly.

Ces sujets appartiennent aux Sprints 4, 5 ou aux lots graphiques et audio ultérieurs.
