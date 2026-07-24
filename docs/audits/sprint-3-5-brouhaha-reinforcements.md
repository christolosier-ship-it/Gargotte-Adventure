# Audit de livraison du Sprint 3.5

- Date de contrôle : 24 juillet 2026
- Statut final : fusionné et stabilisé dans `main`
- Issue : #48, clôturée comme terminée
- Pull Request fonctionnelle : #49, fusionnée par squash
- Branche fonctionnelle : `sprint-3/brouhaha-reinforcements`
- Base de départ : `66f2d30543c77327c86c460d8be874254719ecd0`
- HEAD final validé avant la fusion initiale : `709ada30b224cf1923b149256b29511330bc441d`
- Commit de fusion initial : `18a97f64f97760417f6c1e5e4cdcc139ae1e77ac`
- Correctif P2 roster persistant : PR #53, commit `568670a3cb0d61ef478653403cb31f9065e3a2df`
- Correctif P2 appel direct : PR #54, commit `ecc933cf4c05bf0426d2198c92e748d2052ecdd3`
- Base stable finale : `ecc933cf4c05bf0426d2198c92e748d2052ecdd3`
- Prochaine étape : Sprint 3.6

## Conclusion

Le Sprint 3.5 respecte entièrement le périmètre de l'issue #48 et est stabilisé dans `main` après deux correctifs P2 post-fusion consacrés au roster du tour ennemi.

Une variation acceptée du Brouhaha peut désormais déclencher une ou plusieurs règles de renfort lors d'un franchissement montant. Chaque activation produit une demande reproductible, déléguée au moteur de spawn existant, puis historisée comme réussite totale, réussite partielle ou refus expliqué.

La livraison conserve les frontières du projet : aucune règle métier n'a été ajoutée dans l'UI ou le renderer, aucun budget de menace n'est lu ou dépensé, aucun hasard implicite n'est utilisé et Gargottex est resté strictement en lecture seule.

## Contrôle du périmètre de l'issue #48

### Contenu de salle

- la salle tactique utilise `schemaVersion: 5` ;
- les règles `brouhahaReinforcements` sont déclarées dans le contenu ;
- chaque règle porte seuil, créature, quantité, points ordonnés, mode d'échec et limite d'activation ;
- les identifiants, références de créatures et points candidats sont validés avant le build ;
- les points dupliqués, absents ou références invalides sont rejetés.

### Franchissement montant

Une règle est éligible uniquement lorsque :

```text
previousLevel < threshold <= level
```

- une baisse ne déclenche rien ;
- rester au même niveau ne déclenche rien ;
- une remontée peut réactiver une règle si sa limite le permet ;
- plusieurs seuils franchis par la même demande sont triés par seuil puis identifiant ;
- chaque règle est résolue sur l'état produit par la règle précédente.

### Déterminisme et idempotence

Les identifiants d'activation suivent la forme :

```text
reinforcement-{brouhahaRequestId}-{definitionId}-{activation}
```

La demande de spawn ajoute le suffixe `-spawn`.

- une demande de Brouhaha dupliquée ne rejoue aucun renfort ;
- une activation déjà historisée ne peut pas être rejouée ;
- le numéro d'activation provient de l'historique persistant ;
- aucun `Math.random()`, UUID ou temps système n'intervient ;
- des entrées identiques produisent le même état et les mêmes événements.

### Limites du scénario

- `maxActivations` est appliqué par règle ;
- une activation est consommée dès que la demande de spawn est soumise ;
- une apparition totalement refusée consomme donc son activation ;
- une nouvelle traversée du seuil ne produit plus rien lorsque la limite est atteinte ;
- la limite survit à une reprise de partie.

### Délégation au moteur de spawn

La politique de renfort ne choisit aucune case et ne crée aucune instance directement.

Elle transmet au moteur de spawn :

- la créature ;
- la quantité ;
- les points candidats dans leur ordre éditorial ;
- le mode `all-or-nothing` ou `partial` ;
- une source `{ type: "brouhaha", id: definition.id }`.

Le moteur de spawn reste l'unique autorité pour limites, obstacles, héros, ennemis, objets, points désactivés, succès total, succès partiel et refus.

### Résultats et événements

Chaque activation conserve :

- la demande de Brouhaha racine ;
- la règle ;
- le niveau précédent et le nouveau niveau ;
- le seuil ;
- le numéro d'activation ;
- la demande de spawn ;
- le résultat ;
- les instances créées ;
- les détails explicatifs.

Les événements produits sont :

- `reinforcement-triggered` ;
- les événements ordinaires du moteur de spawn ;
- `reinforcement-resolved`.

L'UI traduit ces événements sans prendre de décision métier.

### Phase terminale

Les dégâts de réaction ne calculent plus immédiatement la victoire.

L'ordre de résolution est :

1. intention et transition directe ;
2. réactions en chaîne ;
3. demandes de Brouhaha ;
4. renforts franchis ;
5. calcul de la phase terminale.

Un test dédié vérifie que la destruction du dernier ennemi initial n'accorde pas la victoire lorsque la même résolution fait entrer un renfort vivant.

Une salle déjà terminale continue de refuser Brouhaha et spawn.

### Tour ennemi et correctifs P2

`createEnemyTurnRoster` capture les ennemis vivants au début de la phase. `finishEnemyTurn` transmet explicitement cette liste figée à `runEnemyTurn`.

Un ennemi ajouté après l'ouverture du roster ne joue pas pendant le tour courant et devient éligible au tour ennemi suivant.

La revue post-fusion a identifié deux écarts P2 successifs :

1. la PR #53 a persisté `enemyTurnRoster` dans `RoomState`, l'a capturé au passage en `enemy-turn`, l'a restauré après sauvegarde et l'a vidé en quittant la phase ;
2. la PR #54 a restauré le contrat public des appels directs à `runEnemyTurn` : lorsque aucun roster explicite n'est fourni, la fonction reconstruit la liste des ennemis vivants.

Cette séparation préserve les deux comportements attendus : roster figé pour la machine de tour, fallback vivant pour les tests, helpers et consommateurs directs du moteur.

### Sauvegarde version 6

`RoomState` et le payload tactique restent en version 6 avec :

- `nextBrouhahaReinforcementSequence` ;
- `brouhahaReinforcementHistory` ;
- `enemyTurnRoster` lorsque la phase ennemie est ouverte.

Les sauvegardes versions 1 à 5 sont migrées avec :

- historique de renfort vide ;
- prochaine séquence égale à 1 ;
- roster vide hors phase ennemie ;
- aucun déclenchement rétroactif ;
- conservation des objets, réactions, spawns et du Brouhaha déjà présents.

Les anciennes sauvegardes version 6 créées avant la PR #53 sont acceptées et reçoivent défensivement un roster cohérent avec leur phase.

La validation rejette notamment :

- identifiants ou séquences dupliqués ;
- couples règle/activation dupliqués ;
- demandes de spawn dupliquées ;
- prochaine séquence située avant l'historique ;
- résultat refusé contenant des instances ;
- succès total ou partiel sans instance créée ;
- roster dupliqué, non trié, contenant un ennemi absent ou présent hors phase ennemie.

## Scénario pilote Bastognac

Deux règles provisoires sont intégrées :

1. `seuil-1-bricoleur` : seuil 1, un Gobelin Bricoleur, mode total, deux activations maximum ;
2. `seuil-2-lance-tout` : seuil 2, deux Gobelins Lance-Tout, mode partiel, une activation maximum.

### Tonneau

Brünhilda brise le tonneau :

- le Brouhaha passe de 0 à 1 ;
- le premier seuil est franchi ;
- un Gobelin Bricoleur apparaît au point haut ;
- le résultat est historisé comme réussi ;
- l'état, les demandes et l'historique sont restaurés après rechargement.

### Domino table, pilier et grille

Magdalena pousse la table :

1. la table percute et fissure le pilier ;
2. le pilier produit un premier Brouhaha et un renfort total ;
3. les dégâts de zone touchent les combattants, y compris le renfort déjà apparu ;
4. la fissure ouvre la grille ;
5. le mécanisme produit un second Brouhaha ;
6. le seuil 2 demande deux créatures ;
7. le point haut étant occupé, une seule instance apparaît sur le point bas ;
8. le résultat est historisé comme partiel ;
9. l'état complet est restauré après rechargement.

Ce scénario ne dépend pas du bouton de spawn manuel.

## Validation automatisée finale

### Correctif PR #53

- Repository quality : exécution `30094773684`, succès complet ;
- Validate application : exécution `30094773656`, succès complet.

### Correctif PR #54

- Repository quality : exécution `30096591289`, succès complet ;
- Validate application : exécution `30096591282`, succès complet.

La dernière validation couvre :

- formatage Prettier ;
- validation du contenu ;
- TypeScript strict ;
- tests unitaires ;
- build de production ;
- validateur du dépôt ;
- installation Chromium ;
- Playwright Chrome bureau ;
- Playwright mobile paysage ;
- package lock et artefact de production.

## Couverture ajoutée

Les tests automatisés vérifient notamment :

- franchissement montant uniquement ;
- ordre stable de plusieurs seuils ;
- succès total et partiel ;
- refus total et activation consommée ;
- limite d'activation ;
- idempotence ;
- réactivation après baisse ;
- déterminisme à entrées identiques ;
- phase terminale calculée après les renforts ;
- roster ennemi capturé au début de la phase ;
- renfort tardif reporté au tour ennemi suivant ;
- appel direct à `runEnemyTurn` avec un état `enemy-turn` et un roster vide ;
- sauvegarde exacte version 6 ;
- migration des anciennes versions 6 sans roster ;
- migrations versions 1 à 5 ;
- corruption des historiques, séquences et rosters ;
- tonneau, domino et restauration sur desktop/mobile paysage.

## Documentation contrôlée

Les pages actives ont été alignées :

- README racine ;
- index documentaire ;
- vision produit et avancement du vertical slice ;
- roadmap ;
- suivi du Sprint 3 ;
- architecture de présentation du Sprint 3.6 ;
- audit Sprint 3.5 ;
- relais Google Drive.

Les audits historiques des Sprints 0 à 3.4 sont restés inchangés.

## Écarts et arbitrages

Aucun écart fonctionnel non autorisé ne subsiste.

Le journal visible conserve volontairement les six événements les plus récents. Les tests navigateur contrôlent donc les messages terminaux utiles, tandis que l'ordre causal complet est vérifié dans les événements, historiques persistants et tests unitaires.

Les valeurs des seuils et quantités pilotes restent provisoires et seront équilibrées au Sprint 4. Le mécanisme n'aura pas à être réécrit pour cet équilibrage.

## Décision de sortie

Le Sprint 3.5 a été fusionné initialement par squash le 24 juillet 2026, puis stabilisé par les PR #53 et #54. L'issue #48 reste clôturée comme terminée et `main` repose désormais sur la base fonctionnelle `ecc933cf4c05bf0426d2198c92e748d2052ecdd3`.

Le projet peut démarrer le Sprint 3.6 consacré à la présentation et à la finition. Son cadrage se trouve dans [Présentation et finition du Sprint 3.6](../architecture/presentation-and-finishing.md).
