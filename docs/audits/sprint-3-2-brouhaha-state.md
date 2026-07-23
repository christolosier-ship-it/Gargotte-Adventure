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
- Gargottex consulté sans écriture.

## Architecture

Les contrats et le moteur appartiennent au paquet `engine`. Le contenu est validé dans `content-schema`. L'application traduit les événements et expose des commandes pilotes. Le renderer ne fait qu'exposer les diagnostics. La sauvegarde est découpée en schémas spécialisés afin de respecter les limites structurelles du dépôt.

L'orchestrateur de jeu reste sous la limite de taille grâce à l'extraction de `game-view.ts`.

## Sauvegarde

La salle tactique utilise la version 3. Les versions 1 et 2 sont migrées vers un état de Brouhaha initial vide. La reprise exacte du niveau, des effets, des demandes traitées et de la séquence est couverte par les tests.

## Interface et picking

L'ajout des commandes Brouhaha allongeait la colonne latérale et étirait initialement le plateau par le comportement par défaut de la grille CSS. La hauteur du plateau est maintenant indépendante de celle des commandes avec `align-items: start`, ce qui stabilise la caméra et le picking desktop/mobile.

## Validation attendue avant fusion

- Repository quality : succès ;
- formatage : succès ;
- validation du contenu : succès ;
- TypeScript strict : succès ;
- tests unitaires : succès ;
- build de production : succès ;
- validation du dépôt : succès ;
- Playwright Chromium desktop/mobile : succès ;
- package lock et artefact de production : succès.

Le verdict final, le HEAD validé et le commit de fusion seront inscrits après le dernier passage de CI.
