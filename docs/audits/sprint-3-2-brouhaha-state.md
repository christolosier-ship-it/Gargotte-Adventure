# Audit de livraison Sprint 3.2

## Périmètre contrôlé

- état et contrats du Brouhaha ;
- résolution déterministe des effets ;
- catalogue Bastognac ;
- intégration application et HUD ;
- diagnostics renderer ;
- sauvegarde version 3 et migrations ;
- tests unitaires et Playwright ;
- stabilité de la mise en page.

## Décisions validées

- jauge bornée de 0 à 12 ;
- un effet aux niveaux 0 à 9 ;
- deux effets distincts aux niveaux 10 à 12 ;
- effets universels ou propres au donjon ;
- sélection stable par identifiant et séquence persistée ;
- demandes idempotentes et refus sans mutation ;
- aucun renfort automatique avant le Sprint 3.5 ;
- aucun hasard implicite ;
- Gargottex consulté en lecture seule.

## Architecture

Les contrats et le moteur appartiennent au paquet `engine`. Le contenu est validé dans `content-schema`. L'application traduit les événements et expose des commandes pilotes. Le renderer ne fait qu'exposer les diagnostics. La sauvegarde est découpée en schémas spécialisés afin de respecter les limites structurelles du dépôt.

L'orchestrateur de jeu reste sous la limite de taille grâce à l'extraction de `game-view.ts`.

## Sauvegarde

La salle tactique utilise la version 3. Les versions 1 et 2 sont migrées vers un état de Brouhaha initial vide. La reprise exacte du niveau, des effets, des demandes traitées et de la séquence est couverte par les tests.

## Interface et picking

L'ajout des commandes Brouhaha allongeait la colonne latérale et étirait initialement le plateau. La hauteur du plateau est maintenant indépendante de celle des commandes avec `align-items: start`.

Les tests historiques activent un héros depuis la colonne de commandes avant de cliquer le plateau. Le helper Playwright ramène maintenant le canvas dans la fenêtre après cette activation, afin de recalculer les coordonnées sur sa position visible.

## Validation finale

HEAD validé avant fusion : `1318fb261a63e1bc0ec60b3b0cda122efc7d3baf`.

Succès obtenus :

- Repository quality ;
- formatage ;
- contenu et assets ;
- TypeScript strict ;
- tests unitaires ;
- build de production ;
- validation structurelle ;
- Playwright Chromium desktop et mobile paysage ;
- scénario Brouhaha, diminution et reprise exacte ;
- parcours historiques de picking, rotation, redimensionnement et fallbacks ;
- package lock et artefact de production.

## Livraison

- Issue : #36, clôturée comme terminée ;
- Pull Request : #37, fusionnée par squash ;
- commit de fusion : `306cc037a5e64ef948b45d85e92d45e3a9909eb2` ;
- dépôt modifié : `christolosier-ship-it/Gargotte-Adventure` uniquement ;
- Gargottex : aucune écriture.

## Verdict

Le Sprint 3.2 satisfait son périmètre fonctionnel et ses invariants. Il est livré dans `main` et la roadmap peut passer au Sprint 3.3 consacré aux objets interactifs.
