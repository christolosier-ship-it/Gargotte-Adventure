# Audit du Sprint 3.1 — Fondation de spawn déterministe

- Statut : validation finale
- Issue : #33
- Branche : `sprint-3/spawn-engine-validation`
- Pull Request de livraison : #35
- Pull Request de travail remplacée : #34, fermée sans fusion
- Base : `67c88e61fbde9258cadce7dd53c9655040316dbf`

## Objectif de l’audit

Contrôler que le Sprint 3.1 introduit une fondation de spawn générique, déterministe, explicable et sauvegardable sans anticiper le Brouhaha complet ni le générateur de rencontre du Sprint 5.

## Protection de Gargottex

Le dépôt `christolosier-ship-it/Gargotte-V5` a été consulté en lecture seule.

Aucune écriture n’a été effectuée dans Gargottex :

- aucun fichier modifié ;
- aucun commit ;
- aucune branche ;
- aucune issue ou Pull Request ;
- aucun réglage ;
- aucune dépendance ajoutée depuis Gargotte Adventure.

Le générateur de Gargottex a uniquement servi à identifier des principes réutilisables : catalogue filtrable, doublons d’archétypes et recherche d’une combinaison exacte. Son mélange `Math.random()`, son budget d’étage historique et sa production de définitions sélectionnées ne sont pas repris par le moteur de spawn.

## Périmètre contrôlé

### Moteur

- séparation `CreatureDefinition` / `CreatureInstance` ;
- `creatureId` distinct de l’identifiant runtime ;
- points, demandes, résultats et refus ;
- ordre stable des points candidats ;
- protection contre plusieurs points candidats partageant la même position ;
- modes total et partiel ;
- séquence persistée ;
- protection contre les requêtes rejouées ;
- événements explicatifs.

### Contenu

- catalogue pilote Bastognac ;
- salle version 2 ;
- placements initiaux par référence ;
- deux points de spawn ;
- un renfort fixe de contrôle ;
- validation des références.

### Application et rendu

- adaptateur de spawn scripté séparé ;
- commande accessible de contrôle ;
- journal lisible ;
- asset ennemi résolu par `creatureId` ;
- diagnostics canvas enrichis.

### Sauvegarde

- payload tactique version 2 ;
- persistance des instances, points, requêtes et compteur ;
- migration défensive de la version 1 ;
- rejet des corruptions profondes.

### Tests

- moteur de spawn ;
- contenu ;
- sauvegarde ;
- compatibilité tactique ;
- Playwright desktop et mobile paysage ;
- restauration après apparition.

## Invariants contrôlés

- mêmes entrées, même résultat ;
- aucun hasard implicite ;
- aucun identifiant fondé sur l’heure ;
- aucune dépense de budget de menace dans le spawn ;
- budget de menace maintenu par salle ;
- aucune règle métier dans le renderer ;
- aucun changement dans Gargottex ;
- aucune régression Sprint 2 ;
- sauvegarde et reprise exactes.

## Hors périmètre confirmé

- jauge Brouhaha 0–12 ;
- déclenchement automatique des renforts ;
- génération de rencontre par budget ;
- génération géométrique ;
- bestiaire définitif ;
- équilibrage final ;
- vagues complexes.

## Validation technique

Le run de validation précédant la clôture a franchi :

- formatage ;
- validation du contenu ;
- TypeScript strict ;
- tests unitaires ;
- build de production ;
- validation structurelle du dépôt ;
- Playwright Chromium desktop et mobile paysage.

Le dernier feu rouge provenait uniquement de l’upload direct du dossier `dist` après ces contrôles. Le workflow a été nettoyé de ses captures temporaires et empaquette désormais le build en archive après vérification de `dist/index.html`.

## Verdict provisoire

Le périmètre fonctionnel et architectural du Sprint 3.1 est conforme. La fusion de la PR #35 reste conditionnée au dernier passage entièrement vert des workflows `Validate application` et `Repository quality`. La PR #34 est fermée sans fusion et ne doit pas être intégrée séparément.
