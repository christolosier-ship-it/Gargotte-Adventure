# Audit de livraison Sprint 3.3

## Statut

- Issue : #42
- Pull Request : #43
- Branche : `sprint-3/interactable-objects`
- HEAD fonctionnel validé : `2cb37af1bd6cd5b89258ccb310f2e0a24c82cd3f`
- Repository quality : run #288, succès
- Validate application : run #274, succès complet
- Verdict : prêt pour fusion par squash après le dernier contrôle du commit documentaire

## Périmètre contrôlé

- catalogue et placements d'objets Bastognac ;
- définitions éditoriales et instances runtime ;
- transitions déterministes ;
- coût d'action et portée d'interaction ;
- intégration au Brouhaha ;
- déplacement, spawn et ligne de vue ;
- renderer, picking et commandes accessibles ;
- sauvegarde version 4 et migrations ;
- tests moteur, contenu, sauvegarde et navigateur ;
- documentation et déploiement GitHub Pages.

## Décisions validées

- une interaction réussie coûte une action ;
- le héros doit être orthogonalement adjacent ;
- une demande est idempotente ;
- un refus ne mute pas l'état et ne consomme rien ;
- les objets brisés ou fissurés produisent une demande de Brouhaha explicite ;
- un objet peut bloquer déplacement et ligne de vue selon son état ;
- les identifiants des héros, ennemis et objets partagent un espace unique ;
- le renderer et l'UI ne portent aucune règle métier ;
- les réactions en chaîne restent exclues du Sprint 3.3 ;
- Gargottex reste strictement en lecture seule.

## Architecture

Le catalogue appartient au paquet de contenu. Les contrats et la résolution appartiennent au moteur. L'application traduit les intentions et événements. Le renderer affiche les états et remonte les sélections. La sauvegarde conserve les instances sans dépendre du DOM ou de PixiJS.

Le contrôleur principal reste sous la limite structurelle grâce aux extractions `room-builder.ts`, `hero-selection.ts`, `event-messages.ts`, `tactical-actions.ts` et `interactable-controller.ts`.

## Contenu pilote

Cinq objets sont placés dans la salle de contrôle : table, tonneau, grille, torche et pilier. Ils couvrent les transitions silencieuses, le Brouhaha automatique, l'ouverture d'un passage, les états réversibles et un objet opaque restant bloquant.

Les objets ne donnent aucun loot direct, conformément aux règles V2. Le tonneau brisé et le pilier fissuré produisent chacun une demande de Brouhaha de +1.

## Intégration tactique

Les objets bloquants participent aux fonctions communes de déplacement, de spawn et de ligne de vue. Une grille ne peut pas redevenir bloquante lorsqu'un combattant occupe sa case.

Le picking direct a été durci après contrôle Playwright : un objet ne capture les événements de pointeur que lorsqu'une interaction est réellement disponible. Une case libérée par un objet brisé reste donc sélectionnable pour le déplacement sur ordinateur comme sur écran tactile.

## Sauvegarde

La salle tactique utilise la version 4. Les versions 1 à 3 sont migrées. La reprise exacte couvre l'état des objets, les demandes déjà traitées, la séquence suivante, le Brouhaha et les renforts existants.

## Revue de code

Cinq fils de revue ont été traités et résolus :

1. espace commun des identifiants combattants et objets ;
2. fixtures `RoomState` migrées en version 4 ;
3. clics laissés aux cases libérées ;
4. contrôleur principal maintenu sous la limite du dépôt ;
5. formatage Prettier de tous les fichiers touchés.

Aucun fil de revue ouvert ne reste avant fusion.

## Validation automatisée

Le HEAD `2cb37af1bd6cd5b89258ccb310f2e0a24c82cd3f` a validé :

- formatage Prettier ;
- catalogue et références de contenu ;
- TypeScript strict ;
- tests unitaires ;
- build de production ;
- validation structurelle et secrets ;
- Playwright Chromium desktop ;
- Playwright mobile paysage tactile ;
- package lock ;
- création et dépôt de l'artefact de production.

Le diagnostic TypeScript temporaire utilisé pendant la correction a été retiré. Le workflow final exécute à nouveau directement `npm run typecheck` et conserve uniquement les diagnostics permanents prévus par le dépôt.

## Hors périmètre confirmé

- réactions en chaîne ;
- explosions de zone ;
- renforts automatiques par seuil ;
- déplacement ou lancer d'objets ;
- loot direct ;
- assets définitifs de toutes les variantes.

Ces éléments restent réservés aux Sprints 3.4 à 3.6.

## Verdict

Le Sprint 3.3 respecte les règles V2, les frontières d'architecture et les garde-fous du dépôt. Son périmètre fonctionnel est complet, reproductible, sauvegardable et jouable au clavier, à la souris et au toucher.

La fusion par squash de la PR #43 est autorisée dès que le dernier passage de CI sur ce rapport est entièrement vert. Après fusion, l'issue #42 doit être clôturée, le déploiement GitHub Pages contrôlé et le compte rendu Google Drive complété avec le commit final.
