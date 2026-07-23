# Sprint 3 : Brouhaha, spawn et décor interactif

- Statut : en cours
- Étape active : Sprint 3.2
- Issue active : #36
- Pull Request active : #37
- Prérequis : Sprint 3.1 fusionné dans `main`

## Objectif

Transformer la salle isométrique en système vivant, interactif et explicable, sans perdre le déterminisme du moteur tactique.

Le Sprint 3 introduit le Brouhaha 0 à 12, les objets interactifs, les réactions en chaîne et les renforts, avec une sauvegarde complète et une lecture claire de chaque conséquence.

## Décisions structurantes

1. La fondation de spawn déterministe précède les renforts.
2. Une définition de créature est séparée de ses instances runtime.
3. Les renforts du Brouhaha utilisent le moteur de spawn du Sprint 3.1.
4. Le budget de menace est un budget par salle.
5. Le moteur de spawn ne consomme aucun budget implicitement.
6. La géométrie complète des salles et étages appartient au Sprint 5.
7. Le renderer affiche les états sans décider des règles.
8. Gargottex reste une source éditoriale et une référence en lecture seule.

Références :

- [ADR-0007 : définitions, instances et spawn déterministe](../adr/0007-creature-instances-and-deterministic-spawn.md)
- [Architecture du moteur de spawn](../architecture/spawn-engine.md)
- [Architecture du Brouhaha](../architecture/brouhaha.md)
- [Architecture de la salle tactique](../architecture/tactical-room.md)

## Retour d'expérience Gargottex

Le dépôt `christolosier-ship-it/Gargotte-V5` a été inspecté sans écriture pendant le Sprint 3.1. Son générateur de rencontres pourra inspirer la composition par budget du Sprint 5, mais il n'est ni copié ni modifié.

Le Sprint 3.2 ne dépend d'aucun code Gargottex. Son catalogue pilote est écrit dans Gargotte Adventure et respecte les frontières de contenu définies pour le runtime.

## Champ historique `floorBudgets`

Le paquet Bastognac conserve un champ `floorBudgets` issu des fondations. Il n'est utilisé ni par le spawn ni par le Brouhaha. Il sera remplacé au Sprint 5 par une politique attribuant un budget explicite à chaque salle.

## Découpage du Sprint 3

### Sprint 3.1 : fondation de spawn déterministe

**Statut : terminé et fusionné par la PR #35.**

Livré :

- `CreatureDefinition` et `CreatureInstance` séparées ;
- `creatureId` distinct de l'identifiant runtime ;
- points, demandes, résultats et refus de spawn typés ;
- identifiants reproductibles par séquence persistée ;
- ordre stable des points candidats ;
- apparition totale ou partielle ;
- événements explicatifs ;
- catalogue et salle pilote Bastognac ;
- sauvegarde tactique version 2 et migration de la version 1 ;
- renfort fixe de contrôle ;
- tests unitaires et navigateur desktop/mobile.

Commit de fusion : `dd8c749f3afb73104270d87c9e920aab4e926bf3`.

### Sprint 3.2 : état, effets et historique du Brouhaha

**Statut : implémentation candidate dans la PR #37.**

Livré sur la branche :

- `BrouhahaState` intégré à `RoomState` version 3 ;
- jauge bornée de 0 à 12 ;
- demandes explicites, typées et idempotentes ;
- historique complet des changements ;
- séquence de résolution persistée ;
- catalogue d'effets universels et propres à Bastognac ;
- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12 ;
- sélection déterministe par identifiant et séquence ;
- événements de demande, changement, effet et refus ;
- quatre commandes accessibles de démonstration ;
- niveau et derniers effets visibles dans le HUD ;
- diagnostics du canvas ;
- sauvegarde version 3 ;
- migrations des versions 1 et 2 ;
- tests moteur, contenu, sauvegarde et Playwright ;
- stabilisation de la hauteur du plateau lorsque les commandes s'allongent.

Les commandes pilotes simulent combat, objet cassé, explosion et tour calme. Elles ne remplacent pas les futurs branchements automatiques.

### Sprint 3.3 : objets interactifs

- tables, tonneaux, grilles, torches et piliers ;
- états propres à chaque objet ;
- interactions validées par le moteur ;
- demandes de Brouhaha émises par les objets.

### Sprint 3.4 : réactions en chaîne

- déclencheurs et propagation ordonnée ;
- causalité explicite ;
- dégâts, déplacement, blocage ou ouverture ;
- protection contre les boucles infinies ;
- plusieurs demandes de Brouhaha ordonnées.

### Sprint 3.5 : renforts déclenchés par le Brouhaha

- seuils de renfort ;
- sélection déterministe des points ;
- production de `SpawnRequest` ;
- apparition partielle ou refus ;
- limites du scénario ;
- intégration avec les phases de tour et de victoire.

### Sprint 3.6 : présentation, sauvegarde et finition

- rendu final des nouveaux états ;
- overlays et retours visuels ;
- premiers effets sonores utiles ;
- journal enrichi ;
- reprise exacte d'une salle ;
- mesures de fluidité ;
- tests desktop et mobile paysage.

## Invariants du Sprint 3.2

- mêmes état, catalogue et demande, même résultat ;
- aucun `Math.random()`, temps système ou UUID aléatoire ;
- niveau toujours compris entre 0 et 12 ;
- demande exécutée une seule fois ;
- refus sans mutation ;
- catalogue universel suffisant pour tous les niveaux ;
- deux effets distincts aux niveaux 10 à 12 ;
- coordonnées et règles indépendantes de la caméra ;
- aucune décision métier dans le renderer ou l'UI ;
- sauvegarde et migrations versionnées ;
- aucun spawn automatique avant le Sprint 3.5 ;
- aucune modification de Gargottex.

## Critères de sortie du Sprint 3.2

- la jauge augmente et diminue selon une demande explicite ;
- les variations sont bornées et expliquées ;
- une demande dupliquée ne modifie pas la salle ;
- un effet valide est produit aux niveaux 0 à 9 ;
- deux effets distincts sont produits aux niveaux 10 à 12 ;
- les effets propres à un autre donjon sont ignorés ;
- le niveau, l'historique et la séquence survivent à une reprise ;
- les sauvegardes versions 1 et 2 sont migrées ;
- le HUD et le journal rendent le résultat lisible ;
- le picking reste fonctionnel malgré l'allongement des commandes ;
- desktop et mobile paysage sont validés ;
- tous les contrôles automatisés sont verts avant fusion.

## Hors périmètre du Sprint 3.2

- déclenchement automatique depuis les combats et objets ;
- renforts automatiques par seuil ;
- conséquences tactiques définitives de tous les effets ;
- objets interactifs ;
- réactions en chaîne ;
- génération de rencontre ;
- génération géométrique ;
- équilibrage final du donjon ;
- audio et animations définitifs.

## Articulation avec le Sprint 4

Le Sprint 4 enrichira les quatre héros et les seize créatures de Bastognac. Le Brouhaha pourra référencer leurs capacités et profils sans modifier son contrat fondamental de demande et de résolution.

## Articulation avec le Sprint 5

Le Sprint 5 générera les cinq étages, la géométrie complète de leurs salles et les rencontres propres à chaque salle. Le générateur de rencontre composera un plan selon le budget de la salle, puis le moteur de spawn créera les instances.

Le Brouhaha restera un système runtime distinct. Ses renforts pourront dépasser la population initiale uniquement lorsqu'une règle de seuil l'autorise explicitement.

## État de livraison

La PR #37 concentre le lot Sprint 3.2. Le rapport de contrôle se trouve dans [Audit de livraison Sprint 3.2](../audits/sprint-3-2-brouhaha-state.md). Le HEAD final et le verdict complet de CI seront consignés avant passage de la PR en état prêt à fusionner.
