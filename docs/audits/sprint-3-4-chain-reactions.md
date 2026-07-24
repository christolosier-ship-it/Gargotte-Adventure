# Audit de livraison du Sprint 3.4

- Date de contrôle : 24 juillet 2026
- Statut final : fusionné dans `main`
- Issue : #44, clôturée
- Pull Request : #45, fusionnée par squash
- Branche : `sprint-3/chain-reactions`
- Base de départ : `d4d0419903a0695fb736bffb239c35c351c6def7`
- Commit fonctionnel validé : `665f20e8f82c5546026342db2180625805b0e4c9`
- HEAD validé avant fusion : `088efdeef3b9b9e15279b8fc434d109a18eac3b4`
- Commit de fusion : `17ad00c0cb5abb9e66da6e320903f56606a8e8d5`
- Prochaine étape : Sprint 3.5

## Conclusion

Le Sprint 3.4 est conforme au périmètre documenté et fusionné dans `main`. Le moteur tactique peut pousser des objets, propager des réactions en chaîne dans un ordre reproductible, appliquer des transitions et des dégâts, ouvrir ou bloquer un passage et soumettre plusieurs demandes de Brouhaha dans leur ordre causal.

La livraison respecte les frontières d'architecture : aucune règle métier n'a été ajoutée dans l'interface ou le renderer, aucun renfort automatique n'est déclenché avant le Sprint 3.5 et Gargottex n'a pas été modifié.

## Contrôle du périmètre

### Poussée et déplacement

- la direction d'une poussée est déduite des coordonnées logiques du héros et de l'objet ;
- la distance pilote est limitée à une case orthogonale ;
- une destination hors plateau, occupée ou bloquée provoque un refus sans mutation ;
- un refus ne consomme pas l'action du héros ;
- le déplacement produit un événement portant sa cause.

### Propagation déterministe

- les déclencheurs disponibles sont `state-entered` et `moved` ;
- les réactions applicables sont triées par identifiant ;
- les actions d'une réaction sont exécutées dans l'ordre du contenu ;
- les déclencheurs secondaires sont placés dans une file FIFO ;
- les actions disponibles sont `transition`, `move`, `damage` et `brouhaha` ;
- aucun hasard implicite, temps système ou UUID n'intervient dans la résolution.

### Causalité et garde-fous

Chaque action propagée conserve :

- la demande racine ;
- la définition de réaction ;
- le type de déclencheur ;
- l'objet source ;
- la réaction parente éventuelle ;
- l'index et le type de l'action ;
- la cible ;
- le résultat et ses détails.

Une définition ne peut être exécutée qu'une fois dans une chaîne racine. Une nouvelle rencontre produit `cycle-detected`. La propagation est également limitée à 32 définitions, avec interruption explicite `max-steps`.

## Scénario pilote Bastognac

Le contenu de contrôle réalise la séquence suivante :

1. Magdalena pousse et renverse la table bancale ;
2. le déplacement de la table fissure le pilier susceptible ;
3. la réaction du pilier inflige deux dégâts dans sa zone ;
4. l'état fissuré ouvre la grille grinçante ;
5. le pilier puis le mécanisme de la grille produisent deux demandes de Brouhaha ordonnées.

Le résultat final est identique pour des entrées identiques et survit à une reprise de partie.

## Sauvegarde

L'état tactique passe en version 5 avec :

- `nextChainReactionSequence` ;
- `chainReactionHistory`.

Les sauvegardes versions 1 à 4 sont migrées. Elles reçoivent un historique vide et une prochaine séquence égale à 1, sans reconstruction fictive d'événements passés.

Les contrôles rejettent les historiques dont les identifiants ou séquences sont dupliqués, ainsi qu'une prochaine séquence incohérente.

## Validation automatisée

### Validate application

Exécution GitHub Actions `30070552316` : succès complet.

- formatage Prettier ;
- validation du contenu ;
- TypeScript strict ;
- tests unitaires ;
- build de production ;
- validateur du dépôt ;
- installation Chromium ;
- Playwright Chrome bureau ;
- Playwright paysage tactile ;
- création des artefacts de production.

### Repository quality

Exécution GitHub Actions `30070552367` : succès complet.

- structure du dépôt ;
- limites de taille des fichiers ;
- contrôle des secrets et fichiers interdits.

## Couverture ajoutée

Les tests automatisés vérifient notamment :

- le domino complet et l'ordre des demandes de Brouhaha ;
- la reproductibilité à entrées identiques ;
- le refus atomique d'une poussée bloquée ;
- l'interruption d'un cycle ;
- la persistance de l'historique causal ;
- les migrations versions 1 à 4 ;
- la corruption des séquences ;
- le scénario pilote sur desktop et mobile paysage ;
- l'absence d'action de fermeture proposée lorsqu'une grille ouverte est occupée.

## Écarts et arbitrages

Le contrôle final de la PR a détecté une incohérence mineure entre l'interface et le moteur : la fermeture d'une grille occupée pouvait encore être proposée dans la liste des actions, alors que la résolution la refusait correctement. La disponibilité des actions utilise désormais la même règle de destination que l'exécution, et un test dédié verrouille ce comportement.

Aucun écart fonctionnel non autorisé ne subsiste.

Le journal visible conserve volontairement une fenêtre courte des événements récents. L'ordre causal complet est donc contrôlé par l'historique persistant et les tests unitaires, tandis que le test navigateur vérifie les événements encore visibles et l'état final.

## Décision de sortie

Le Sprint 3.4 a été fusionné après validation complète. Le dépôt stable au commit `17ad00c0cb5abb9e66da6e320903f56606a8e8d5` est prêt à démarrer le Sprint 3.5, consacré aux renforts déclenchés par les seuils du Brouhaha.

Le cadrage de l'étape suivante se trouve dans [Renforts déclenchés par le Brouhaha](../architecture/brouhaha-reinforcements.md).
