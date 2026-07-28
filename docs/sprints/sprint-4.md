# Sprint 4 : héros, créatures et comportements de Bastognac

## Statut

- État : cadré, non implémenté
- Issue documentaire : #61
- Base observée : `cc7756ba94a41be0eb2e20ca5a9f6ff6766df3fe`
- Prérequis : Sprint 4.0, stabilisation finale du Sprint 3.6
- Périmètre fonctionnel : Sprints 4.1 à 4.7
- Génération procédurale : réservée au Sprint 5

## Résultat attendu

Livrer un micro-donjon vertical de trois salles adjacentes, entièrement construit à la main, permettant de jouer une séquence proche du résultat final du jeu.

Le critère principal est le suivant :

> Un joueur peut sélectionner son équipe, entrer dans un micro-donjon fixe de trois salles adjacentes, conserver l'état de ses héros, affronter plusieurs profils de créatures, utiliser ou subir le décor, gérer les influences du Brouhaha et les renforts, comprendre les décisions de l'IA, passer d'une salle à l'autre puis atteindre une victoire ou une défaite, sans utiliser les commandes techniques de diagnostic.

## Réserve de stabilisation du Sprint 3

Le Sprint 3 est fonctionnellement livré et fusionné. Sa clôture définitive reste soumise à un dernier lot de stabilisation du Sprint 3.6 et à la résolution des écarts P2 post-fusion.

Le Sprint 4.0 est un prérequis indépendant. Il ne doit pas absorber de héros, créature, salle, compétence, comportement ou équilibrage du Sprint 4.

Voir [Addenda P2 post-fusion du Sprint 3.6](../audits/sprint-3-6-post-fusion-p2-addendum.md).

## Structure du micro-donjon

```text
Préparation de l'expédition
          │
          ▼
┌─────────────────────────────┐
│ Salle 1                     │
│ Prise en main tactique      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Salle 2                     │
│ Décor, réactions, Brouhaha  │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Salle 3                     │
│ Confrontation complète      │
└──────────────┬──────────────┘
               │
               ▼
Résultat du micro-donjon
```

Les salles sont adjacentes et reliées par des portes ou passages explicitement déclarés. La condition de sortie locale doit être remplie avant le transfert vers la salle suivante.

## Frontière Sprint 4 et Sprint 5

### Sprint 4 construit manuellement

- trois salles fixes ;
- leur ordre et leurs connexions ;
- leur géométrie, portes et passages ;
- leurs objectifs et conditions de sortie ;
- leurs populations et placements initiaux ;
- leurs objets, réactions et points de spawn ;
- leurs règles de renfort ;
- leurs conditions de victoire et de défaite ;
- la transition de l'équipe entre les salles.

Les populations initiales écrites à la main sont traduites en `SpawnRequest` déterministes lors de la première création de chaque salle. Aucune `CreatureInstance` n'est construite directement par le contenu ou l'orchestrateur d'expédition.

### Sprint 5 générera

- les cinq étages ;
- la topologie et les embranchements ;
- la géométrie des salles ;
- la composition automatique des rencontres ;
- les budgets de menace propres à chaque salle ;
- le loot, la progression et la campagne ;
- le Baron Pas-Très-Terrifiant ;
- la reprise d'une expédition générée.

Le Sprint 4 ne crée aucun faux générateur provisoire. Le moteur de spawn reste l'unique frontière d'instanciation des créatures.

## Salle 1 : prise en main tactique

La première salle introduit progressivement :

- déplacement, portée et ligne de vue ;
- sélection et activation des héros ;
- attaque et compétences fondamentales ;
- premiers profils ennemis ;
- interactions simples avec le décor ;
- Brouhaha faible ;
- objectif local clair ;
- ouverture de la sortie.

Les réactions en chaîne restent courtes et faciles à expliquer.

## Salle 2 : décor, réactions et Brouhaha

La deuxième salle couvre principalement :

- objets poussables et destructibles ;
- changements d'état et réactions en chaîne ;
- dégâts causés par le décor ;
- interactions particulières des héros et créatures ;
- hausse et réduction du Brouhaha ;
- effets positifs, négatifs ou neutres ;
- franchissements de seuil ;
- renforts complets, partiels et refusés ;
- modifications déclaratives de comportement liées au Brouhaha.

Elle propose plusieurs solutions tactiques et ne réduit pas la réussite à l'affrontement frontal.

## Salle 3 : confrontation complète

La troisième salle combine :

- plusieurs profils d'IA ;
- créatures basiques, tactiques et spéciales ;
- éventuellement une élite ou un mini-boss pilote ;
- utilisation, protection, déplacement ou destruction du décor par les ennemis ;
- Brouhaha élevé ou rapidement évolutif ;
- renforts et réactions combinées ;
- compétences avancées des héros ;
- condition de victoire élaborée ;
- défaite de l'équipe ;
- écran final du micro-donjon.

Le véritable boss final reste réservé au Sprint 5.

## Phases de jeu

### Préparation de l'expédition

- présentation du micro-donjon ;
- sélection de un à quatre héros ;
- consultation rapide des rôles et compétences ;
- rappel des règles essentielles ;
- entrée dans la première salle.

### Présentation de la salle

- nom et objectif ;
- règle spéciale éventuelle ;
- placement initial ;
- Brouhaha initial ;
- ennemis présents ;
- sortie ou porte suivante ;
- démarrage du premier tour.

Lors de la première entrée, les ennemis présents sont instanciés par des demandes initiales ordonnées au moteur de spawn. Une reprise restaure les instances sauvegardées sans rejouer ces demandes.

### Tour des héros

Le joueur peut sélectionner un héros, consulter ses actions, se déplacer, attaquer, utiliser une compétence, interagir avec un objet, consulter les cibles disponibles, terminer l'activation et terminer le tour des héros.

### Résolution des conséquences

L'ordre dépend du type d'intention.

Pour une interaction d'objet bruyante :

```text
intention de l'acteur
→ validation de l'action
→ transition ou déplacement direct de l'objet
→ Brouhaha direct éventuel
→ effets et renforts directs
→ réactions en chaîne FIFO
→ Brouhaha secondaire éventuel à sa position causale
→ effets et renforts secondaires
→ phase terminale éventuelle
→ état et rendu stables
→ présentation visuelle, sonore et textuelle
→ persistance
```

Pour une action sans Brouhaha direct d'objet, la conséquence directe est suivie des réactions éventuelles, puis de chaque demande de Brouhaha secondaire à sa position causale.

Le Brouhaha direct et ses renforts sont résolus avant la propagation. Une apparition directe peut donc modifier l'occupation ou empêcher une phase terminale avant les réactions secondaires.

L'ordre exact doit suivre l'orchestration stabilisée et être documenté sans ambiguïté. Le Sprint 4.0 corrige d'abord les divergences actuellement relevées entre code et documentation.

### Tour ennemi

Chaque créature choisit de manière déterministe entre :

- attendre ;
- se déplacer ;
- attaquer ;
- utiliser une capacité ;
- interagir avec un objet ;
- déplacer ou détruire un objet ;
- protéger un objet ou une zone ;
- réagir au niveau de Brouhaha.

Le journal explique les candidats utiles, la priorité retenue et le départage stable. Un bouton unique de résolution du tour ennemi reste acceptable pendant le Sprint 4.

### Fin de salle

Toutes les conséquences en cours sont résolues avant la complétion locale.

La salle est ajoutée idempotemment à `completedRoomIds` dès que son objectif est atteint et son état stabilisé.

- Pour les salles 1 et 2, la sortie devient ensuite disponible. Le joueur choisit de quitter la salle, l'état local est clôturé et l'état persistant des héros est transféré vers la salle suivante.
- Pour la salle 3, la complétion produit le résultat global sans exiger une transition vers une quatrième salle.

### Fin du micro-donjon

L'écran final affiche :

- victoire ou défaite ;
- nombre de tours ;
- état final des héros ;
- ennemis vaincus ;
- synthèse du Brouhaha par salle ;
- conséquences principales ;
- bouton de rejeu ;
- mention du loot, de la progression et de la génération prévus au Sprint 5.

Une victoire globale exige que la salle 3 figure dans `completedRoomIds`.

## État minimal d'expédition

`ExpeditionState` contient conceptuellement :

- identifiant stable de l'expédition ;
- équipe sélectionnée ;
- salle actuelle ;
- ordre des trois salles ;
- salles visitées et terminées ;
- état persistant des héros ;
- états des salles ;
- statut global ;
- résultat final.

Persistent entre les salles : équipe, PV actuels, ressources et effets explicitement persistants, charges persistantes lorsqu'elles existent, progression des salles et statut global.

Restent propres à chaque salle : Brouhaha et historique, tour, phase tactique, ennemis, renforts, objets, réactions résolues, points de spawn, objectif et condition de sortie.

Le Brouhaha reste local à chaque salle, sauf décision produit ultérieure explicitement validée.

Le Sprint 4.1 définit le schéma Zod de l'expédition, son format de sauvegarde, sa version initiale et sa stratégie de migration avant les transitions.

## Héros

Le Sprint 4 introduit un catalogue `HeroDefinition` séparé de :

- `HeroInstance` ou `HeroState` ;
- placement initial dans une salle ;
- état persistant dans l'expédition.

Pour chaque héros sont documentés identité, rôle, statistiques, portée, mobilité, compétences actives et passives, coût en actions, charges éventuelles, interactions avec le décor, influence sur le Brouhaha, sensibilité éventuelle au Brouhaha, événements métier, présentation UI, asset et fallback.

Héros concernés :

- Brünhilda la Torgnole ;
- Aelion Trois-Gorgées ;
- Magdalena Coquinelle ;
- Grompif Arcabidon.

## Créatures de Bastognac

Les seize créatures utilisent la séparation suivante :

```text
CreatureDefinition
+ profil de comportement
+ placement initial éditorial
→ SpawnRequest initiale ou runtime
→ moteur de spawn
→ CreatureInstance
```

Pour chaque créature sont documentés identité, catégorie, menace, statistiques, portée, mobilité, rôle, profil d'IA, capacités, attaques spéciales, interactions avec les objets, réaction au Brouhaha, influence produite, priorité de cible, événements explicatifs, asset et fallback.

Les valeurs détaillées ne sont pas décidées implicitement par ce cadrage.

## Profils d'IA

Les comportements sont génériques, combinables et déclaratifs, par exemple :

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

Chaîne de décision :

```text
état de salle
→ profil de la créature
→ actions candidates
→ conditions et exclusions
→ scores ou priorités déterministes
→ départage stable
→ action retenue et explication
→ résolution par les moteurs existants
```

Aucune architecture principale ne repose sur des conditions dispersées par nom de créature.

## Objets interactifs

Les héros et créatures produisent des intentions. Le moteur d'objets résout la transition directe, le Brouhaha direct éventuel et ses renforts, puis les réactions et leurs conséquences secondaires dans l'ordre causal.

Les créatures peuvent ignorer, contourner, utiliser, pousser, détruire, protéger ou rejoindre un objet, empêcher un héros de l'utiliser, déclencher volontairement une réaction ou éviter une réaction dangereuse.

Chaque interaction définit acteurs autorisés, portée, coût, conditions, intérêt, risques, priorité d'IA, événements produits et passage vers les moteurs existants.

## Relations avec le Brouhaha

Toutes les variations continuent à passer par le moteur de Brouhaha.

Les influences sur les acteurs sont déclaratives et peuvent modifier actions candidates, priorité, cible, interaction avec le décor, capacité ou positionnement. Elles doivent toujours produire une explication.

Aucun bonus universel arbitraire ne dépend uniquement du niveau de Brouhaha.

## Mode diagnostic

Le parcours joueur normal ne montre plus les commandes techniques. Un mode diagnostic distinct peut exposer :

- modification manuelle du Brouhaha ;
- effet ou spawn forcé ;
- remplissage ou vidage d'une salle ;
- navigation directe ;
- modification artificielle des PV ;
- victoire ou défaite forcée ;
- diagnostics internes.

Ce mode est identifiable et exclu des critères d'expérience joueur.

## Découpage

### Sprint 4.0 : stabilisation finale du Sprint 3.6

Correction des sept P2 post-fusion, non-régression, résolution des fils de revue, alignement GitHub et Drive et validation de la base stable.

### Sprint 4.1 : micro-donjon et phases de jeu

- schémas `ExpeditionDefinition`, `ExpeditionState`, salles et connexions ;
- format de sauvegarde, version initiale et migration d'expédition ;
- demandes de spawn initiales ;
- trois salles fixes, objectifs, portes et complétion ;
- transitions et persistance inter-salles ;
- résultat global et mode diagnostic.

### Sprint 4.2 : contrats des acteurs et comportements

`HeroDefinition`, évolution de `CreatureDefinition`, compétences, profils d'IA, objets, influences du Brouhaha, validation Zod et migrations propres aux acteurs et contenus associés.

### Sprint 4.3 : quatre héros

Rôles, statistiques, compétences, objets, Brouhaha, fiches et tests.

### Sprint 4.4 : bestiaire de Bastognac

Seize créatures, catégories, menace, capacités, profils, interactions, Brouhaha et assets progressifs.

### Sprint 4.5 : IA, objets et Brouhaha

Choix déterministe des actions, utilisation ou évitement du décor, influences du Brouhaha, explications et tests.

### Sprint 4.6 : salles 1 et 2

Prise en main, décor, réactions, Brouhaha, renforts, objectifs et transitions.

### Sprint 4.7 : salle 3 et intégration globale

Confrontation complète, complétion de la troisième salle, résultat du micro-donjon, équilibrage, tutoriel, présentation, tests desktop, tablette et mobile paysage, puis audit de sortie.

## Matrice de couverture minimale

```text
Mécanisme                         Salle 1       Salle 2              Salle 3
Déplacement et combat             principal     présent              présent
Compétences des héros             introduction  approfondissement    combinaisons
IA différenciée                   introduction  plusieurs profils     combinaison complète
Interaction simple avec un objet  oui           oui                  oui
Poussée ou destruction            limitée       principale           stratégique
Réactions en chaîne               courte        principale           combinée
Brouhaha                           faible         principal            intense
Influence du Brouhaha sur l'IA    limitée       visible              complète
Interaction ennemie avec décor    introduction  principale           stratégique
Renforts                           absents/légers complets             complets
Renfort partiel ou refusé         non requis    requis               possible
Transition                        sortie        entrée et sortie      entrée et fin
Victoire locale                   oui           oui                  oui
Résultat d'expédition             non           non                  victoire ou défaite
```

## Décisions figées

- micro-donjon manuel de trois salles adjacentes ;
- `ExpeditionState` minimal au-dessus des états de salle ;
- schémas et sauvegarde d'expédition définis au Sprint 4.1 ;
- Brouhaha local à la salle ;
- profils de comportement génériques et déterministes ;
- acteurs producteurs d'intentions ;
- mode diagnostic séparé ;
- aucun faux générateur ;
- toute créature initiale ou runtime instanciée par le moteur de spawn ;
- complétion de la salle 3 enregistrée sans transition supplémentaire ;
- budget de menace par salle ;
- fonctionnement offline-first ;
- Gargottex strictement en lecture seule.

## Décisions ouvertes

- statistiques, coûts et capacités exactes des héros ;
- valeurs et capacités détaillées des seize créatures ;
- pondérations précises des profils d'IA ;
- ressources de héros persistantes entre les salles ;
- identité éventuelle d'une élite ou d'un mini-boss pilote ;
- accélération finale du tour ennemi ;
- catalogue définitif des assets et sons ;
- équilibrage des salles, seuils et renforts.

## Validation attendue

- aucune commande diagnostic dans le parcours joueur normal ;
- déterminisme et explication des décisions ennemies ;
- reprise cohérente dans les trois salles ;
- Brouhaha local et historique par salle ;
- populations initiales et renforts uniquement par le moteur de spawn ;
- Brouhaha direct résolu avant les réactions d'objet ;
- salle 3 présente dans `completedRoomIds` lors de la victoire ;
- aucune conséquence d'objet appliquée directement par un acteur ;
- aucun générateur du Sprint 5 ;
- tests unitaires, contenu, sauvegarde et Playwright ;
- desktop, tablette et mobile paysage ;
- audit final avant passage au Sprint 5.

## Références

- [Micro-donjon et état d'expédition](../architecture/micro-dungeon-and-expedition.md)
- [Héros, créatures et comportements](../architecture/actors-and-behaviors.md)
- [ADR-0008 : micro-donjon manuel](../adr/0008-hand-authored-micro-dungeon.md)
- [ADR-0009 : profils de comportement déclaratifs](../adr/0009-declarative-actor-behaviors.md)
- [Roadmap](../roadmap.md)
