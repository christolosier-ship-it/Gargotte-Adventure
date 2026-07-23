# Sprint 3 — Brouhaha, spawn et décor interactif

- Statut : en cours
- Étape active : Sprint 3.1
- Issue : #33
- Pull Request : #34 en brouillon
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
8. Gargottex reste une source éditoriale et une référence en lecture seule, jamais un dépôt modifié par Gargotte Adventure.

Références :

- [ADR-0007 — Définitions, instances et spawn déterministe](../adr/0007-creature-instances-and-deterministic-spawn.md)
- [Architecture du moteur de spawn](../architecture/spawn-engine.md)
- [Architecture de la salle tactique](../architecture/tactical-room.md)

## Retour d’expérience Gargottex

Le générateur du dépôt `christolosier-ship-it/Gargotte-V5` a été inspecté sans écriture.

Il filtre les créatures par donjon et catégorie, permet les doublons et cherche une combinaison exacte au moyen d’une recherche récursive mémoïsée. Cette approche sera utile au Sprint 5 pour la composition des rencontres.

Le Sprint 3.1 ne reprend pas directement cet algorithme : Gargottex utilise un mélange `Math.random()`, manipule encore des budgets historiques par étage et retourne des définitions sélectionnées plutôt que des instances runtime persistées.

Le moteur de spawn de Gargotte Adventure reste donc un exécutant déterministe indépendant du futur générateur de rencontre.

## Champ historique `floorBudgets`

Le paquet Bastognac contient encore un champ `floorBudgets` créé pendant les fondations. Ce champ n’est pas utilisé par le moteur de spawn et ne constitue pas la règle produit définitive.

Sa dénomination reste un placeholder historique. Elle devra être remplacée lors du cadrage technique du Sprint 5 par une politique attribuant un budget propre à chaque salle.

## Découpage du Sprint 3

### Sprint 3.1 — Fondation de spawn déterministe

**Statut : implémentation en cours dans la PR #34.**

Livrables réalisés sur la branche :

- `CreatureDefinition` et `CreatureInstance` séparées ;
- `creatureId` distinct de l’identifiant runtime ;
- `SpawnPoint`, `SpawnRequest`, `SpawnResult` et refus typés ;
- identifiants reproductibles par séquence persistée ;
- ordre stable des points candidats ;
- modes apparition totale ou partielle ;
- événements explicatifs ;
- catalogue pilote Bastognac ;
- salle de contenu version 2 avec deux points de renfort ;
- renfort fixe de contrôle ;
- sauvegarde version 2 et migration défensive de la version 1 ;
- asset ennemi résolu par `creatureId` ;
- tests unitaires et parcours navigateur.

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

## Invariants du Sprint 3.1

- moteur pur et déterministe ;
- mêmes entrées, même résultat ;
- aucune dépendance navigateur ;
- aucune décision métier dans le renderer ;
- aucune utilisation de l’heure, d’un UUID aléatoire ou de `Math.random()` ;
- positions logiques uniquement ;
- événements explicatifs ;
- sauvegarde versionnée ;
- requête exécutée une seule fois ;
- refus total sans mutation ;
- compatibilité des mécaniques Sprint 2 ;
- aucun équilibrage définitif du bestiaire ;
- aucune modification du dépôt Gargottex.

## Critères de sortie du Sprint 3.1

- deux instances d’un même type peuvent coexister ;
- les identifiants restent uniques après sauvegarde et reprise ;
- une apparition hors limites ou sur une case occupée est refusée ;
- une position alternative est choisie selon l’ordre déclaré ;
- une apparition partielle explique le reliquat ;
- une requête déjà traitée ne crée aucun doublon ;
- le journal explique le choix ou le refus ;
- le renfort fixe est instancié puis restauré ;
- les ennemis existants continuent de se déplacer et d’attaquer ;
- desktop et mobile paysage restent fonctionnels ;
- tous les contrôles automatisés sont verts ;
- la PR est laissée ouverte pour contrôle avant fusion.

## Hors périmètre du Sprint 3.1

- jauge de Brouhaha complète ;
- déclenchement automatique des renforts par seuil ;
- génération complète des salles ;
- génération de la topologie des étages ;
- composition procédurale finale par budget de menace ;
- remplacement runtime du champ historique `floorBudgets` ;
- seize créatures définitives et équilibrées ;
- compétences définitives des héros ;
- vagues complexes ;
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

Le générateur de rencontre pourra reprendre ou adapter l’idée de combinaison exacte observée dans Gargottex, à condition de devenir déterministe à seed identique et de respecter la frontière suivante : il compose un plan, puis le moteur de spawn exécute les demandes d’instanciation.

Le champ historique `floorBudgets` devra être migré vers un modèle de politique d’étage et de budgets de salles explicites avant l’implémentation de ce générateur.

## État de livraison

La PR #34 est ouverte en brouillon. Le code, le contenu, la sauvegarde et les tests sont en cours de stabilisation. Aucun changement n’a été apporté à Gargottex. Le verdict final de CI et le commit contrôlé seront consignés avant passage de la PR en état prêt à contrôler.
