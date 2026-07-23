# Sprint 3 — Brouhaha, spawn et décor interactif

- Statut : cadrage documentaire approuvé
- Implémentation : non commencée
- Prérequis : Sprint 2 et désendettement pré-Sprint 3 terminés

## Objectif

Transformer la salle isométrique en système vivant, interactif et explicable, sans perdre le déterminisme du moteur tactique.

Le Sprint 3 doit introduire le Brouhaha 0–12, les objets interactifs, les réactions en chaîne et les renforts, tout en conservant une sauvegarde complète et une lecture claire de chaque conséquence.

## Décisions structurantes

1. La première étape est un moteur de spawn déterministe.
2. Une définition de créature est séparée de ses instances runtime.
3. Les renforts du Brouhaha passent par le même moteur de spawn que les futures populations initiales.
4. Le budget de menace est un budget **par salle**.
5. Le budget de menace n’est pas consommé implicitement par le moteur de spawn.
6. La génération complète de la géométrie des salles et des étages appartient au Sprint 5.
7. Le renderer affiche les nouveaux états mais ne décide jamais de leurs règles.

Références :

- [ADR-0007 — Définitions, instances et spawn déterministe](../adr/0007-creature-instances-and-deterministic-spawn.md)
- [Architecture du moteur de spawn](../architecture/spawn-engine.md)
- [Architecture de la salle tactique](../architecture/tactical-room.md)

## Découpage du Sprint 3

### Sprint 3.1 — Fondation de spawn déterministe

Mettre en place les contrats et règles nécessaires pour créer plusieurs instances d’un même archétype et faire apparaître des renforts dans une salle existante.

Livrables futurs :

- `CreatureDefinition` et `CreatureInstance` ;
- `SpawnPoint`, `SpawnRequest` et `SpawnResult` ;
- identifiants d’instance reproductibles ;
- validation des positions ;
- événements explicatifs ;
- adaptation de la salle pilote ;
- migration et validation des sauvegardes ;
- tests unitaires et scénario d’intégration.

Cette étape n’introduit pas encore la jauge de Brouhaha complète.

### Sprint 3.2 — État et événements de Brouhaha

- jauge 0–12 ;
- incrémentation et diminution explicites ;
- historique ;
- effets universels ou propres au donjon ;
- un effet aux niveaux 0–9 ;
- deux effets aux niveaux 10–12 ;
- événements déterministes et sauvegardables.

### Sprint 3.3 — Objets interactifs

- tables ;
- tonneaux ;
- grilles ;
- torches ;
- piliers ;
- états intacts, activés, déplacés, ouverts, détruits ou épuisés selon l’objet ;
- interactions validées par le moteur.

### Sprint 3.4 — Réactions en chaîne

- déclencheurs ;
- propagation ordonnée ;
- dégâts, déplacement, blocage ou ouverture ;
- prévention des boucles infinies ;
- journal détaillé de la chaîne causale.

### Sprint 3.5 — Renforts déclenchés par le Brouhaha

- seuils et événements de renfort ;
- sélection des points de spawn ;
- demandes d’apparition ;
- refus ou apparition partielle selon les règles ;
- limites propres au scénario ;
- intégration avec le tour et la victoire.

### Sprint 3.6 — Présentation, sauvegarde et finition du sprint

- rendu des nouveaux états ;
- overlays et retours visuels ;
- premiers effets sonores utiles ;
- journal enrichi ;
- reprise exacte d’une salle ;
- mesures de fluidité ;
- tests desktop et mobile paysage.

## Première étape à implémenter

La prochaine étape de code sera le Sprint 3.1. Son objectif n’est pas de produire déjà tout le Brouhaha, mais de créer la tuyauterie propre qui permettra aux renforts, objets, boss et futurs générateurs de demander des apparitions sans dupliquer la logique.

### Invariants du Sprint 3.1

- moteur pur et déterministe ;
- mêmes entrées, même résultat ;
- aucune dépendance navigateur ;
- aucune décision métier dans le renderer ;
- aucune utilisation de l’heure ou d’un UUID aléatoire ;
- positions logiques uniquement ;
- événements explicatifs ;
- sauvegarde versionnée ;
- compatibilité de la salle actuelle ;
- aucun équilibrage définitif du bestiaire.

### Critères de sortie du Sprint 3.1

- deux instances d’un même type peuvent coexister ;
- les identifiants restent uniques après sauvegarde et reprise ;
- une apparition hors limites ou sur une case occupée est refusée ;
- une position alternative est choisie selon une règle stable ;
- le journal peut expliquer le choix ou le refus ;
- un renfort fixe peut être instancié dans un scénario de test ;
- les ennemis existants continuent de se déplacer et d’attaquer ;
- tous les contrôles automatisés restent verts.

## Hors périmètre du Sprint 3

- génération complète des salles ;
- génération de la topologie des étages ;
- composition procédurale finale par budget de menace ;
- seize créatures définitives et équilibrées ;
- compétences définitives des héros ;
- loot et progression entre salles ;
- boss final complet.

## Articulation avec le Sprint 4

Le Sprint 4 enrichira le catalogue de définitions :

- quatre héros définitifs ;
- seize créatures de Bastognac ;
- catégories et menace ;
- compétences ;
- profils d’IA différenciés ;
- ciblage et explications enrichis ;
- sprites progressifs.

Le moteur d’instances du Sprint 3 devra accepter ces définitions sans modification structurelle majeure.

## Articulation avec le Sprint 5

Le Sprint 5 générera les cinq étages complets.

Chaque étage sera un graphe de salles reliées. La génération comprendra :

- nombre et ordre des salles ;
- géométrie complète de chaque salle ;
- dimensions et formes ;
- murs, portes, passages, entrées et sorties ;
- connectivité et chemin critique ;
- zones, obstacles structurels et points de spawn ;
- décor initial ;
- rencontre propre à chaque salle ;
- validation de jouabilité et de connectivité.

Chaque salle recevra son propre budget de menace. Il n’existe pas de budget unique partagé par tout l’étage.

Le générateur de rencontre transformera ce budget de salle en plan de population. Le moteur de spawn exécutera ensuite les demandes d’instanciation initiales.

## Validation documentaire actuelle

Le présent document prépare uniquement l’implémentation. Aucun type, schéma, état, sauvegarde ou comportement de jeu n’est modifié par ce lot documentaire.