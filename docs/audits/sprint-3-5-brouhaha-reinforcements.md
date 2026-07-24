# Audit de livraison du Sprint 3.5

- Date de contrôle : 24 juillet 2026
- Issue : #48
- Pull Request : #49
- Branche : `sprint-3/brouhaha-reinforcements`
- Base de départ : `66f2d30543c77327c86c460d8be874254719ecd0`
- HEAD fonctionnel et documentaire validé : `264fae4463dce682a32912ad520ba4776dd4b188`
- Prochaine étape : Sprint 3.6

## Conclusion

Le Sprint 3.5 respecte entièrement le périmètre de l'issue #48.

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

### Tour ennemi

`createEnemyTurnRoster` capture les ennemis vivants au début de la phase. `runEnemyTurn` exécute seulement cette liste.

Un ennemi ajouté après l'ouverture du roster ne joue pas pendant le tour courant et devient éligible au tour ennemi suivant.

### Sauvegarde version 6

`RoomState` et le payload tactique passent en version 6 avec :

- `nextBrouhahaReinforcementSequence` ;
- `brouhahaReinforcementHistory`.

Les sauvegardes versions 1 à 5 sont migrées avec :

- historique de renfort vide ;
- prochaine séquence égale à 1 ;
- aucun déclenchement rétroactif ;
- conservation des objets, réactions, spawns et du Brouhaha déjà présents.

La validation rejette notamment :

- identifiants ou séquences dupliqués ;
- couples règle/activation dupliqués ;
- demandes de spawn dupliquées ;
- prochaine séquence située avant l'historique ;
- résultat refusé contenant des instances ;
- succès total ou partiel sans instance créée.

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

## Validation automatisée

### Repository quality

Exécution GitHub Actions `30080543433` : succès complet.

- structure du dépôt ;
- limites de taille ;
- frontières de packages ;
- secrets et fichiers interdits ;
- documentation et assets attendus.

### Validate application

Exécution GitHub Actions `30080543369` : succès complet.

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
- roster ennemi figé ;
- sauvegarde exacte version 6 ;
- migrations versions 1 à 5 ;
- corruption des historiques et séquences ;
- tonneau, domino et restauration sur desktop/mobile paysage.

## Documentation contrôlée

Les pages actives ont été alignées :

- README racine ;
- index documentaire ;
- roadmap ;
- suivi du Sprint 3 ;
- structure du dépôt ;
- architecture générale et runtime ;
- salle tactique ;
- spawn ;
- Brouhaha ;
- objets interactifs ;
- réactions en chaîne ;
- renforts de Brouhaha ;
- relais Google Drive.

Les audits historiques des Sprints 0 à 3.4 sont restés inchangés.

## Écarts et arbitrages

Aucun écart fonctionnel non autorisé n'a été introduit.

Le journal visible conserve volontairement les six événements les plus récents. Les tests navigateur contrôlent donc les messages terminaux utiles, tandis que l'ordre causal complet est vérifié dans les événements, historiques persistants et tests unitaires.

Les valeurs des seuils et quantités pilotes restent provisoires et seront équilibrées au Sprint 4. Le mécanisme n'aura pas à être réécrit pour cet équilibrage.

## Décision de sortie

Le Sprint 3.5 peut être fusionné par squash.

Après fusion de la PR #49 et clôture de l'issue #48, le projet pourra démarrer le Sprint 3.6 consacré à la présentation et à la finition du Sprint 3.
