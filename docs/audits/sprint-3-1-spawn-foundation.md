# Audit du Sprint 3.1 — Fondation de spawn déterministe

- Statut : prêt à fusionner sous réserve de la CI du présent commit
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
- restauration après apparition ;
- picking logique après rotation de caméra.

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

Le run complet de contrôle a validé :

- formatage ;
- validation du contenu ;
- TypeScript strict ;
- tests unitaires ;
- build de production ;
- validation structurelle du dépôt ;
- Playwright Chromium desktop et mobile paysage ;
- vérification et empaquetage de `dist` ;
- upload des artefacts de contrôle et de production.

La CI a été débarrassée de ses captures temporaires. Le build de production est désormais vérifié par la présence de `dist/index.html`, puis empaqueté dans une archive unique avant publication comme artefact.

## Verdict final

Le périmètre fonctionnel et architectural du Sprint 3.1 est conforme. La PR #34 est fermée sans fusion et ne doit pas être intégrée séparément. La PR #35 est l’unique livraison autorisée. Sa fusion reste conditionnée aux workflows `Validate application` et `Repository quality` entièrement verts sur le présent état de branche.
