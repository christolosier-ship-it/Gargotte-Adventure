# Audit de livraison Sprint 3.3

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
- le renderer et l'UI ne portent aucune règle métier ;
- les réactions en chaîne restent exclues du Sprint 3.3 ;
- Gargottex reste strictement en lecture seule.

## Architecture

Le catalogue appartient au paquet de contenu. Les contrats et la résolution appartiennent au moteur. L'application traduit les intentions et événements. Le renderer affiche les états et remonte les sélections. La sauvegarde conserve les instances sans dépendre du DOM ou de PixiJS.

Le contrôleur principal reste sous la limite structurelle grâce aux extractions `room-builder.ts`, `hero-selection.ts`, `event-messages.ts` et `interactable-controller.ts`.

## Contenu pilote

Cinq objets sont placés dans la salle de contrôle : table, tonneau, grille, torche et pilier. Ils couvrent les transitions silencieuses, le Brouhaha automatique, l'ouverture d'un passage, les états réversibles et un objet opaque restant bloquant.

## Sauvegarde

La salle tactique utilise la version 4. Les versions 1 à 3 sont migrées. La reprise exacte couvre l'état des objets, les demandes déjà traitées, la séquence suivante, le Brouhaha et les renforts existants.

## Validation fonctionnelle

Le verdict final, le HEAD validé, les numéros de workflows et le commit de fusion seront consignés après le dernier passage complet de CI sans instrumentation temporaire.

## Verdict provisoire

Le périmètre fonctionnel est implémenté. La fusion reste interdite tant que le formatage, le contenu, TypeScript strict, les tests unitaires, le build, la validation structurelle, Playwright desktop/mobile et le déploiement Pages ne sont pas tous verts.
