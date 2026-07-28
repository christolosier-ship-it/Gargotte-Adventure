# Héros, créatures et comportements

## Statut

- Cible : Sprint 4.2 à 4.7
- État : architecture acceptée, non implémentée
- Prérequis : Sprint 4.0 puis contrats du Sprint 4.2
- Issue documentaire : #61
- ADR : [ADR-0009](../adr/0009-declarative-actor-behaviors.md)

## Objectif

Définir des héros, créatures, compétences et comportements déterministes sans disperser des conditions particulières dans l'UI, le renderer ou des branches de code fondées sur le nom d'un personnage.

Les acteurs choisissent ou soumettent des intentions. Les moteurs tactiques existants restent responsables de leur validation et de leurs conséquences.

## Séparation des concepts

```text
HeroDefinition                 CreatureDefinition
      │                               │
      ├─ compétences                  ├─ capacités
      ├─ profils et influences        ├─ profils et influences
      └─ présentation                 └─ présentation
      │                               │
      ▼                               ▼
HeroState / HeroInstance       CreatureInstance
      │                               │
      └──────── intentions ───────────┘
                      │
                      ▼
          moteurs tactiques existants
```

Une définition décrit un archétype. Une instance ou un état porte les valeurs mutables. Le placement dans une salle et la persistance dans une expédition sont des responsabilités séparées.

## `HeroDefinition`

Un héros stable documente au minimum :

- identifiant et nom ;
- rôle tactique ;
- statistiques de base ;
- portée et mobilité ;
- compétences actives ;
- compétences passives ;
- coûts en actions ;
- charges ou limites éventuelles ;
- interactions particulières avec le décor ;
- variations de Brouhaha produites ;
- influences éventuelles reçues du Brouhaha ;
- événements métier attendus ;
- informations de présentation ;
- référence d'asset et fallback.

Le Sprint 4 concerne :

- Brünhilda la Torgnole ;
- Aelion Trois-Gorgées ;
- Magdalena Coquinelle ;
- Grompif Arcabidon.

Les statistiques, coûts et capacités exactes restent ouverts jusqu'aux lots d'implémentation et d'équilibrage.

## `HeroState` ou `HeroInstance`

L'état mutable d'un héros contient uniquement les propriétés nécessaires au moteur :

- identifiant runtime ;
- référence `heroId` ;
- PV courants ;
- actions restantes ;
- position locale ;
- charges et ressources ;
- effets actifs ;
- état vivant ou indisponible ;
- éventuelles séquences nécessaires à l'idempotence.

La position, les actions restantes et les effets limités au tour sont locaux à la salle. Les PV et seules ressources explicitement déclarées persistantes peuvent être transférés par `ExpeditionState`.

## Compétences

Une compétence ne doit pas être une fonction opaque attachée à un nom de héros. Son contrat doit décrire :

- identifiant stable ;
- type actif ou passif ;
- coût en actions ;
- portée et forme de ciblage ;
- conditions et exclusions ;
- charges ou récupération ;
- intention produite ;
- moteur chargé de la résolution ;
- variation de Brouhaha éventuelle ;
- événements et explication ;
- informations UI ;
- portée de persistance de ses ressources.

Les compétences composent les primitives tactiques existantes. Une compétence qui interagit avec un objet produit une intention pour le moteur d'objets. Une compétence bruyante produit une demande explicite pour le moteur de Brouhaha.

## `CreatureDefinition`

La définition de créature est enrichie sans perdre la séparation introduite au Sprint 3 :

- identité ;
- catégorie ;
- valeur de menace ;
- statistiques ;
- portée et mobilité ;
- rôle tactique ;
- profils de comportement ;
- capacités et attaques spéciales ;
- interactions autorisées avec les objets ;
- influences reçues du Brouhaha ;
- variations de Brouhaha produites ;
- priorités de cible ;
- événements explicatifs ;
- asset et fallback.

Les seize créatures de Bastognac doivent être instanciables par le moteur de spawn sans modifier sa frontière.

## `CreatureInstance`

L'instance conserve :

- identifiant runtime ;
- `creatureId` ;
- position ;
- PV courants ;
- statistiques courantes ;
- effets et ressources runtime ;
- état vivant ;
- propriétés de blocage.

Elle ne duplique pas les profils éditoriaux. Les décisions utilisent la définition résolue et l'état courant.

## Profils de comportement

Les profils sont des briques génériques, combinables et déclaratives.

Exemples :

- combattant de mêlée ;
- tireur ;
- protecteur ;
- soutien ;
- opportuniste ;
- destructeur ;
- utilisateur du décor ;
- gardien d'objectif ;
- fuyard ;
- attiré par le bruit ;
- perturbé par le bruit ;
- chef ou coordinateur.

Un profil ne constitue pas automatiquement une classe TypeScript distincte. Il décrit des règles de candidature, exclusion, priorité et explication que le moteur interprète de manière déterministe.

## Chaîne de décision ennemie

```text
état de salle
→ définition et profils de la créature
→ intentions candidates
→ conditions et exclusions
→ scores ou priorités déterministes
→ départage stable
→ intention retenue
→ explication
→ résolution par le moteur approprié
```

### Intentions candidates

Une créature peut envisager :

- attendre ;
- se déplacer ;
- attaquer ;
- utiliser une capacité ;
- interagir avec un objet ;
- pousser ou détruire un objet ;
- protéger un objet ou une zone ;
- rejoindre une position ;
- fuir ;
- déclencher ou éviter une réaction ;
- adapter son comportement au Brouhaha.

### Conditions et exclusions

Chaque intention définit :

- phases autorisées ;
- portée ;
- ligne de vue ;
- cibles valides ;
- cases ou objets requis ;
- ressources nécessaires ;
- risques interdits ;
- compatibilité avec les profils ;
- restrictions liées au Brouhaha.

Une intention invalide n'entre pas dans le classement.

### Priorités déterministes

Les priorités peuvent utiliser des valeurs déclarées et des mesures stables :

- accomplissement d'un objectif ;
- protection d'une cible ;
- dégâts attendus selon les règles connues ;
- distance logique ;
- positionnement ;
- opportunité d'utiliser le décor ;
- exposition à une réaction ;
- plage de Brouhaha ;
- identifiant stable pour départager.

Les pondérations exactes restent une décision ouverte du Sprint 4.2 ou 4.5. Aucun hasard implicite ne départage deux candidats.

### Explication

La décision produit une structure explicative avant traduction par l'UI :

- créature active ;
- profil ou règle dominante ;
- action retenue ;
- cible ou objet ;
- motifs principaux ;
- candidats refusés utiles à comprendre ;
- règle de départage.

Le journal traduit cette structure sans recalculer la décision.

## Interactions avec les objets

Les profils d'acteurs déclarent les interactions autorisées et leur intérêt. Ils n'appliquent jamais directement les changements d'état d'un objet.

```text
profil de l'acteur
→ interactions disponibles
→ candidat évalué
→ intention d'interaction
→ moteur des objets
→ réactions en chaîne
→ Brouhaha
→ renforts
→ présentation
```

Une interaction décrit :

- types d'acteurs autorisés ;
- portée ;
- coût en actions ou ressource ;
- conditions ;
- intérêt tactique ;
- risques ;
- priorité pour l'IA ;
- événements attendus ;
- moteur de résolution.

Les comportements de créature peuvent :

- ignorer ou contourner un objet ;
- utiliser ou pousser un objet ;
- détruire un objet ;
- protéger un objet ;
- rejoindre un objet ;
- empêcher un héros de l'utiliser ;
- déclencher volontairement une réaction ;
- éviter une réaction dangereuse.

## Relations avec le Brouhaha

### Les acteurs influencent le Brouhaha

Une action ou capacité peut :

- augmenter le niveau ;
- le réduire ;
- produire une variation liée à une interaction ;
- amplifier ou limiter une demande selon une règle déclarée ;
- produire une demande explicite et historisée.

Toutes les variations passent par le moteur existant. Un acteur ne modifie jamais directement `RoomState.brouhaha.level`.

### Le Brouhaha influence les acteurs

Structure conceptuelle :

```text
BrouhahaInfluence
├─ id
├─ plage ou seuil
├─ cible, profil ou acteur
├─ condition
├─ modification de candidature ou priorité
├─ capacité éventuellement activée
└─ explication
```

Une influence peut modifier :

- actions disponibles ;
- priorité d'action ;
- choix de cible ;
- interaction avec le décor ;
- capacité spéciale ;
- positionnement ;
- volonté d'attaquer, fuir, protéger ou déclencher une réaction.

Elle ne donne pas un bonus universel arbitraire uniquement fondé sur le niveau.

Le Brouhaha reste local à la salle. Une influence est évaluée sur le niveau et l'état de la salle courante.

## Objectifs de salle

Un profil peut prendre en compte un objectif déclaré : protéger une zone, empêcher l'ouverture d'une porte, conserver un objet ou atteindre une position.

L'objectif appartient à la définition de salle. Une créature ne contient pas une référence codée en dur vers « salle 2 » ou « porte finale ».

## Héros et IA

Les héros sont contrôlés par le joueur. Le moteur calcule les actions et interactions disponibles à partir de leur définition, état, position et ressources.

Les mêmes primitives de validation sont utilisées pour les acteurs joueurs et ennemis lorsque les règles sont communes. Une capacité spécifique peut produire une intention spécialisée, mais ne duplique pas le moteur de déplacement, combat, objet, Brouhaha ou spawn.

## Événements métier

Les nouveaux contrats devront produire des événements structurés pour :

- compétence demandée, appliquée ou refusée ;
- ressource ou charge consommée ;
- décision ennemie expliquée ;
- intention d'interaction d'un ennemi ;
- influence du Brouhaha activée ;
- modification de priorité ;
- objectif protégé ou contesté.

La liste exacte et leur versionnement relèvent du Sprint 4.2. Renderer, audio et journal consomment les événements ou l'état final sans gouverner les règles.

## Validation Zod et migrations

Le Sprint 4.2 doit définir :

- schémas des héros ;
- évolution compatible des créatures ;
- schémas des compétences ;
- schémas des profils ;
- schémas des influences de Brouhaha ;
- validation des références croisées ;
- stratégie de migration des contenus existants ;
- valeurs par défaut uniquement lorsqu'elles sont sans ambiguïté.

Une migration de contenu ne doit pas inventer une capacité, un profil ou un équilibrage non validé.

## Présentation et assets

Chaque définition fournit des métadonnées destinées aux adaptateurs :

- nom court ;
- description ;
- rôle ;
- icône ou référence d'asset ;
- fallback ;
- informations de compétence ;
- éléments utiles au journal.

Les références d'assets ne donnent aucune autorité tactique au renderer. Un asset manquant conserve une forme de repli jouable.

## Invariants

1. Définition et instance restent séparées.
2. Placement et instanciation restent séparés de la définition.
3. Le moteur de spawn crée toutes les instances de créature.
4. Les profils sont génériques et combinables.
5. Aucun comportement principal n'est dispersé par nom de créature.
6. Le départage est stable et sans hasard implicite.
7. Chaque décision ennemie est explicable.
8. Les acteurs produisent des intentions d'objet.
9. Les moteurs existants appliquent les conséquences.
10. Toutes les variations de Brouhaha utilisent le moteur dédié.
11. Les influences du Brouhaha sont déclaratives.
12. Le renderer et l'UI ne prennent aucune décision.
13. Gargottex reste en lecture seule.

## Stratégie de tests

### Contrats et contenu

- références uniques et valides ;
- compétences compatibles avec leur acteur ;
- profils et influences valides ;
- assets avec fallback ;
- migrations défensives ;
- seize créatures et quatre héros complets selon le schéma.

### Décision ennemie

- mêmes entrées, même action et même explication ;
- départage stable ;
- candidats invalides exclus ;
- combinaison de plusieurs profils ;
- capacité, attaque, déplacement et attente ;
- choix d'objet et protection de zone ;
- influence du Brouhaha ;
- aucune mutation pendant l'évaluation.

### Intégration

- intentions résolues par combat, déplacement ou objets ;
- réactions et Brouhaha dans l'ordre ;
- renforts après franchissement ;
- journal expliquant la décision ;
- sauvegarde et reprise ;
- comportement cohérent dans les trois salles.

## Hors périmètre documentaire

- valeurs d'équilibrage finales ;
- capacités détaillées non validées ;
- choix de mini-boss pilote ;
- génération automatique de rencontres ;
- boss final ;
- loot et progression ;
- implémentation du code.
