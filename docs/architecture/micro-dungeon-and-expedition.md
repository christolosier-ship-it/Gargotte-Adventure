# Micro-donjon et état d'expédition

## Statut

- Cible : Sprint 4.1 à 4.7
- État : architecture acceptée, non implémentée
- Prérequis : stabilisation Sprint 4.0
- Issue documentaire : #61
- ADR : [ADR-0008](../adr/0008-hand-authored-micro-dungeon.md)

## Objectif

Faire évoluer la démonstration d'une salle isolée vers une expédition fixe de trois salles adjacentes, sans introduire la génération procédurale réservée au Sprint 5.

Le micro-donjon doit permettre une expérience proche du jeu final : préparation, progression, objectifs locaux, transfert de l'équipe, victoire ou défaite globale et reprise cohérente.

## Responsabilités

```text
ExpeditionDefinition
        │
        ├─ ordre et connexions des trois salles
        ├─ objectifs et règles de transition
        └─ références vers les salles écrites à la main
        │
        ▼
ExpeditionState
        ├─ équipe et héros persistants
        ├─ salle actuelle
        ├─ progression globale
        └─ RoomState de chaque salle
```

`ExpeditionState` orchestre la progression. `RoomState` reste la source de vérité tactique locale. Le renderer, l'UI, l'audio et la présentation ne décident jamais qu'une salle est terminée ou qu'un transfert est autorisé.

## Définitions éditoriales

### `ExpeditionDefinition`

Décrit le micro-donjon fixe :

- identifiant stable ;
- nom et introduction ;
- ordre déclaré des salles ;
- salle d'entrée ;
- connexions adjacentes ;
- texte de résultat ;
- éventuelles règles globales explicitement autorisées.

La définition ne contient aucun algorithme de génération.

### `ExpeditionRoomDefinition`

Associe une salle tactique à sa place dans l'expédition :

- identifiant de salle ;
- nom et objectif ;
- référence de contenu ;
- entrée et sorties ;
- condition de sortie ;
- règle spéciale éventuelle ;
- transition suivante ;
- informations de présentation.

La géométrie, les placements, objets, réactions, points de spawn et renforts restent dans le contenu de salle.

### `RoomConnectionDefinition`

Une connexion explicite contient :

- salle source ;
- porte ou passage source ;
- salle cible ;
- point d'entrée cible ;
- condition de disponibilité ;
- sens autorisé ;
- texte de transition éventuel.

Le Sprint 4 utilise une chaîne fixe sans embranchement. La structure doit néanmoins éviter de confondre une connexion déclarée avec une navigation codée en dur dans l'UI.

## État runtime minimal

Structure conceptuelle :

```text
ExpeditionState
├─ id
├─ definitionId
├─ selectedHeroIds
├─ currentRoomId
├─ orderedRoomIds
├─ visitedRoomIds
├─ completedRoomIds
├─ persistentHeroes
├─ roomStates
├─ status
└─ result
```

### Identité et ordre

- `id` est stable et reproductible selon le contrat retenu lors de l'implémentation ;
- `definitionId` référence le micro-donjon éditorial ;
- `orderedRoomIds` correspond exactement aux trois salles déclarées ;
- `currentRoomId` doit appartenir à cet ordre ;
- les listes visitées et terminées sont uniques et cohérentes.

### Statut global

Le statut conceptuel distingue au minimum :

- `preparation` ;
- `in-progress` ;
- `victory` ;
- `defeat`.

Une expédition terminale refuse toute nouvelle intention tactique ou transition.

### Résultat final

Le résultat conserve les informations nécessaires à l'écran final :

- issue victoire ou défaite ;
- nombre total de tours ;
- état final des héros ;
- ennemis vaincus ;
- résumé par salle ;
- conséquences majeures ;
- date ou temps système uniquement si cette métadonnée est explicitement hors déterminisme métier.

Le résultat ne recalcule pas les historiques tactiques.

## État persistant des héros

L'état transféré entre les salles contient uniquement les propriétés explicitement persistantes :

- identité du héros ;
- PV courants ;
- ressources persistantes validées ;
- charges persistantes validées ;
- effets dont la portée est l'expédition ;
- état vivant ou hors combat selon la règle produit retenue.

Les actions restantes, cibles temporaires, surbrillances, position et effets limités au tour ne traversent pas une transition.

La liste exacte des ressources persistantes reste une décision ouverte du Sprint 4.2. Aucune propriété n'est rendue persistante par simple commodité technique.

## État propre à chaque salle

Chaque salle conserve son propre `RoomState`, notamment :

- tour et phase ;
- héros placés dans la salle ;
- ennemis et roster du tour ennemi ;
- objets et états des objets ;
- réactions et historiques ;
- Brouhaha et historique ;
- règles et historique de renfort ;
- points et demandes de spawn ;
- objectif et état de sortie ;
- phase terminale locale.

Le Brouhaha est local à chaque salle. Entrer dans une nouvelle salle utilise son niveau initial déclaré, sans recopier le niveau de la salle précédente.

## Création d'une salle

Lors de la première entrée :

1. charger et valider la définition de salle ;
2. construire son état initial déterministe ;
3. injecter l'équipe à ses points d'entrée déclarés ;
4. appliquer uniquement les états persistants autorisés ;
5. conserver les ennemis initiaux comme demandes ou placements validés par les contrats existants ;
6. démarrer la phase prévue ;
7. produire les événements de présentation de salle ;
8. persister l'expédition.

Une salle déjà visitée est restaurée depuis son état enregistré. Elle n'est pas réinitialisée silencieusement.

## Objectif et sortie de salle

Une salle distingue :

- condition d'objectif atteinte ;
- conséquences encore en cours ;
- sortie disponible ;
- transition effectivement demandée par le joueur.

L'objectif ne suffit pas à transférer immédiatement l'équipe. Avant d'ouvrir la sortie :

1. achever la résolution tactique courante ;
2. traiter réactions, Brouhaha et renforts ;
3. calculer la phase locale ;
4. stabiliser l'état ;
5. rendre la sortie disponible ;
6. attendre l'intention explicite de quitter la salle.

Cette séparation évite qu'une animation, une apparition tardive ou une conséquence de décor soit sautée par une transition automatique.

## Transition entre salles

Une intention de transition est valide uniquement lorsque :

- l'expédition est active ;
- la salle source est la salle courante ;
- sa sortie est disponible ;
- la connexion cible est déclarée ;
- aucun effet tactique n'est en cours de résolution ;
- l'équipe possède un état transférable cohérent.

La transition :

1. clôture l'état local de la salle source ;
2. extrait l'état persistant des héros ;
3. marque la salle visitée et terminée ;
4. sélectionne la connexion déclarée ;
5. restaure ou crée la salle cible ;
6. place l'équipe aux points d'entrée ;
7. met à jour `currentRoomId` ;
8. produit les événements d'expédition ;
9. rend, présente et persiste le nouvel état stable.

Aucune porte ne doit modifier directement `ExpeditionState` depuis le renderer ou l'UI.

## Phase terminale locale et globale

La victoire locale signifie que la condition de sortie est remplie et que les conséquences de la salle sont résolues. Elle ne signifie pas nécessairement la victoire de l'expédition.

La défaite de l'équipe peut rendre l'expédition terminale selon le contrat produit retenu.

La victoire globale est acquise lorsque la troisième salle est terminée et sa condition finale validée. Le Baron Pas-Très-Terrifiant n'est pas introduit par ce micro-donjon.

## Présentation du parcours

Le parcours joueur comprend :

1. préparation de l'expédition ;
2. présentation de la salle ;
3. tours héroïques et ennemis ;
4. résolution des conséquences ;
5. disponibilité de la sortie ;
6. transition choisie ;
7. résultat final.

Les commandes de diagnostic ne participent pas à ce parcours.

## Mode diagnostic

Le mode diagnostic est une capacité applicative distincte. Il peut permettre :

- navigation directe entre les salles ;
- modification artificielle de PV ;
- changement manuel de Brouhaha ;
- spawn ou effet forcé ;
- victoire ou défaite forcée ;
- affichage des diagnostics internes.

Il doit :

- être explicitement activé ;
- être visuellement identifiable ;
- ne pas modifier les règles de production ;
- ne pas être requis pour terminer le micro-donjon ;
- être exclu des critères d'expérience joueur ;
- être couvert par des tests séparés.

Le mécanisme précis d'activation reste ouvert. Aucun secret de sécurité ne doit être supposé pour une option locale de diagnostic.

## Sauvegarde et reprise

La sauvegarde du Sprint 4 doit distinguer :

- schéma d'expédition ;
- schéma tactique de chaque salle ;
- état persistant des héros ;
- préférences applicatives hors état métier.

Une reprise :

- restaure l'expédition et la salle courante ;
- ne recrée pas une salle déjà enregistrée ;
- ne rejoue aucun événement historique ;
- ne rejoue aucun cue visuel ou sonore ;
- ne réactive aucun renfort historique ;
- ne change pas le Brouhaha d'une salle ;
- restaure le parcours joueur ou le mode diagnostic explicitement choisi selon le contrat retenu.

La version et la stratégie de migration seront décidées au Sprint 4.2 après inventaire des formats réellement nécessaires.

## Contenu des trois salles

### Salle 1

Valide la sélection, les règles fondamentales, les compétences simples, une IA lisible, un décor limité et une première sortie.

### Salle 2

Valide objets, réactions, Brouhaha, renforts complets, partiels ou refusés, interactions ennemies avec le décor et plusieurs solutions tactiques.

### Salle 3

Valide la combinaison des profils, les compétences avancées, le Brouhaha intense, les renforts, la victoire ou défaite globale et l'écran final.

## Invariants

1. Les trois salles sont définies à la main.
2. Aucune géométrie ou rencontre n'est générée.
3. `RoomState` reste local à une salle.
4. `ExpeditionState` ne réimplémente aucune règle tactique.
5. Le Brouhaha ne traverse pas les salles.
6. Une sortie ne s'ouvre qu'après résolution complète.
7. Une transition exige une intention explicite du joueur.
8. Une reprise ne rejoue aucune conséquence historique.
9. Le mode diagnostic est séparé du parcours normal.
10. Le budget de menace reste propre à chaque salle.
11. Gargottex reste en lecture seule.
12. L'expérience reste offline-first.

## Validation

### Tests unitaires

- cohérence de l'ordre et des connexions ;
- création et restauration des salles ;
- extraction et injection de l'état persistant des héros ;
- Brouhaha local ;
- transition refusée avant la fin des conséquences ;
- victoire locale distincte de la victoire globale ;
- reprise dans chacune des trois salles ;
- idempotence des transitions ;
- validation des états corrompus.

### Tests d'intégration

- parcours complet des trois salles ;
- conservation des PV ;
- restauration après fermeture dans chaque salle ;
- absence de replay ;
- victoire et défaite ;
- mode diagnostic non nécessaire au parcours.

### Playwright

- desktop ;
- tablette paysage ;
- mobile paysage ;
- clavier, souris et toucher ;
- reprise dans les trois salles ;
- écran final et rejeu ;
- absence de commandes techniques en mode joueur.

## Hors périmètre

- génération procédurale ;
- embranchements générés ;
- composition automatique des rencontres ;
- loot et progression ;
- campagne ;
- boss final ;
- expédition de cinq étages ;
- équilibrage définitif.
