# Audit de livraison du Sprint 3.6

- Date de contrôle fonctionnel : 27 juillet 2026
- Issue : #57
- Pull Request : #59
- Branche : `sprint-3/presentation-finishing`
- Base de départ : `86aeb13d3705cb744dfe525a10e37fa11f38dcaa`
- HEAD fonctionnel validé : `91d88d28448e354c220a70f4525beaa317f6d54d`
- Repository quality : exécution `30305294064`, succès complet
- Validate application : exécution `30305294029`, succès complet
- Statut : fonctionnalité validée avant fusion

## Conclusion

Le Sprint 3.6 relie les événements tactiques déjà résolus à une couche de présentation visuelle, sonore et textuelle. Cette couche n'ajoute aucune règle métier et ne modifie jamais `RoomState`.

Le Sprint 3 peut être clôturé lorsque la PR #59 est fusionnée, que son audit documentaire final est aligné sur le commit publié et que l'issue #57 est fermée comme terminée.

## Architecture livrée

### Routeur de présentation

Le nouveau package `packages/presentation` reçoit une liste ordonnée de `TacticalEvent` et produit :

- des cues visuels ;
- des cues audio ;
- une entrée de journal groupée par action racine.

Le routeur :

- conserve l'ordre causal ;
- ne lit ni DOM, ni PixiJS, ni Web Audio ;
- ne mute ni les événements, ni l'état moteur ;
- borne le nombre de cues produits ;
- choisit uniquement une représentation, jamais un résultat tactique.

### Adaptateurs indépendants

Les packages `audio`, `renderer` et `ui` exposent leurs propres ports structurels compatibles avec les sorties du routeur. Ils ne dépendent pas du package `presentation` et conservent un graphe de dépendances unidirectionnel.

### Renderer

Une couche PixiJS `presentation` dédiée affiche les effets transitoires après le rendu de l'état stable.

Elle :

- n'accepte aucun événement de pointeur ;
- annule les timers et détruit ses objets lors d'un nouveau rendu ;
- est vidée lors d'une rotation, d'une reprise et de la destruction du renderer ;
- expose des diagnostics de génération, quantité et objets actifs ;
- revient à zéro après la lecture ou l'annulation des cues.

### Audio

`AudioDirector` joue sept tonalités pilotes synthétisées localement par Web Audio :

- interaction ;
- impact ;
- dégâts ;
- Brouhaha ;
- renfort ;
- victoire ;
- défaite.

La lecture :

- attend une interaction utilisateur ;
- respecte `masterVolume` et `muted` ;
- met les lecteurs en cache ;
- tolère Web Audio indisponible ou une lecture refusée ;
- ne réalise aucun appel réseau ;
- peut être remplacée plus tard par des fichiers locaux via le même port.

Les préférences audio sont stockées dans les réglages applicatifs locaux et ne changent pas la version de sauvegarde tactique.

### Journal

Le journal conserve au maximum six actions racines visibles.

Chaque entrée :

- affiche un résumé compréhensible ;
- conserve les conséquences majeures dans leur ordre causal ;
- garde visibles plusieurs résultats de renfort d'une même chaîne ;
- distingue succès, avertissement et danger sans dépendre uniquement de la couleur ;
- laisse les historiques moteur comme preuve persistante complète.

## Reprise et accessibilité

Une reprise :

- restaure immédiatement l'état stable sauvegardé ;
- n'émet aucun nouvel événement tactique ;
- ne rejoue ni son, ni overlay, ni apparition historique ;
- annonce seulement la restauration dans le journal.

`prefers-reduced-motion` réduit les durées des cues à une transition courte. Le mode muet, le volume, le clavier, la souris et le toucher restent accessibles.

## Diagnostics et stabilité

Les tests contrôlent :

- un seul canvas monté ;
- des compteurs de listeners stables ;
- `data-display-objects` stable après quatre rotations ;
- `data-transient-objects` revenu à zéro ;
- un cache audio borné par les sept clés de sons ;
- un journal limité à six entrées racines ;
- l'absence de replay transitoire après rechargement.

Aucune réécriture du renderer en diff incrémental, aucun WebAssembly et aucune véritable 3D n'ont été introduits sans mesure le justifiant.

## Couverture automatisée

### Tests unitaires

Les 131 tests passent et couvrent notamment :

- conversion événement vers cues ;
- ordre causal et priorités ;
- regroupement du journal ;
- conservation des conséquences majeures ;
- absence de mutation des événements ;
- mouvement réduit ;
- volume, mute et déverrouillage audio ;
- cache, fallback et ordre des sons.

### Playwright

Les parcours Chrome bureau et mobile paysage couvrent :

- réglages audio persistants ;
- journal groupé et borné ;
- cues transitoires ;
- mouvement réduit ;
- disparition des objets temporaires ;
- reprise sans replay ;
- stabilité du canvas, des listeners et du nombre d'objets ;
- non-régression du scénario table → pilier → grille et de ses deux renforts.

## Contrôles de livraison

Le HEAD fonctionnel `91d88d28448e354c220a70f4525beaa317f6d54d` a validé :

- Prettier ;
- contenu ;
- TypeScript strict ;
- 131 tests unitaires ;
- build de production ;
- validateur structurel du dépôt ;
- Playwright Chromium bureau ;
- Playwright mobile paysage ;
- package lock ;
- artefact de production.

## Frontières respectées

- aucune modification du schéma tactique version 6 ;
- aucune règle ajoutée au renderer, à l'UI ou à l'audio ;
- aucun rééquilibrage de héros, créature ou seuil ;
- aucun appel réseau tiers ;
- aucun secret ajouté ;
- aucun hasard métier ajouté ;
- Gargottex strictement en lecture seule.

## Hors périmètre confirmé

Restent réservés aux phases suivantes :

- animations définitives de tous les personnages ;
- catalogue complet de bruitages ;
- musique adaptative et doublages ;
- équilibrage du bestiaire ;
- génération du donjon ;
- loot, progression et campagne ;
- tests utilisateurs sur appareils réels.
