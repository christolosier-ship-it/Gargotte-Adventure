# Audit de livraison du Sprint 4.0

## Références

- Date : 28 juillet 2026
- Issue : #63
- Pull Request fonctionnelle : #64
- Branche : `sprint-4/stabilize-sprint-3-6`
- Base de départ : `03a7bad26fe74c96ca6817e056dcb9d496fe0b81`
- HEAD fonctionnel validé : `1c806a8d7362bc125fcf8c5ea92185e7cf9be7d1`
- Commit de fusion fonctionnelle : `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf`
- Repository quality : `30361556238`, succès complet
- Validate application : `30361556300`, succès complet

## Conclusion

Le Sprint 4.0 corrige les sept écarts P2 post-fusion du Sprint 3.6. Il clôt la réserve technique du Sprint 3 sans introduire d’état d’expédition, de salle, de héros, de créature, de compétence, de profil d’IA ou d’équilibrage du Sprint 4 fonctionnel.

Le socle est prêt pour le Sprint 4.1.

## Écarts P2 clôturés

### 1. Transitions terminales

Une pipeline applicative compare l’ancien et le nouvel `RoomState`. Lors d’une transition réelle vers `victory` ou `defeat`, elle ajoute un unique événement `phase-changed` lorsque le moteur n’en a pas déjà produit.

Les tests couvrent une victoire réelle issue de `attackTarget` et une défaite réelle issue de `finishEnemyTurn`. Le journal, les cues visuels et les cues audio reçoivent donc la phase terminale sans modifier les règles métier.

### 2. Préférences audio invalides

`parseStoredAudioSettings` ne conserve que :

- un `masterVolume` numérique et fini ;
- un `muted` booléen.

`AudioDirector.configure` ignore les valeurs absentes ou invalides et préserve les réglages courants. Les anciennes préférences incomplètes ne peuvent plus produire un état d’accessibilité indéfini.

### 3. Priorité sous plafond

Les cues visuels et audio sont désormais sélectionnés par priorité décroissante, avec départage stable par séquence, puis restitués dans leur ordre causal.

Les plafonds restent bornés sans supprimer silencieusement un renfort ou une phase terminale arrivant tard dans une chaîne longue.

### 4. Tonalités répétées

Lorsqu’une clé sonore possède déjà un lecteur en cache, sa lecture active est arrêtée avant le retour à zéro et la relance. Les oscillateurs Web Audio ne se superposent plus pour une même clé répétée.

### 5. Garantie documentaire de priorité

La garantie est maintenant conforme au code pour les trois sorties :

- cues visuels ;
- cues audio ;
- journal.

### 6. Ordre runtime

Le contrat exécuté et testé est :

```text
état moteur final
→ rendu stable
→ présentation visuelle, sonore et textuelle
→ déclenchement de la persistance asynchrone
```

La présentation ne dépend pas du succès préalable de l’écriture IndexedDB.

### 7. Frontière du package presentation

`packages/presentation` est intégré au validateur automatisé des dépendances. Sa seule dépendance Gargotte autorisée est `packages/engine`.

Un test exécute le validateur sur un dépôt temporaire et vérifie :

- `presentation → engine` autorisé ;
- `presentation → renderer` refusé.

## Revue

Les quatre fils P2 de la PR #59 et les trois fils P2 de la PR #60 ont reçu une réponse avec les références de correction, puis ont été résolus le 28 juillet 2026.

Aucun fil n’est resté ouvert avant la fusion de la PR #64.

## Validation

Le HEAD fonctionnel a passé :

- formatage Prettier ;
- validation du contenu ;
- TypeScript strict ;
- tests unitaires, y compris les nouveaux tests Sprint 4.0 ;
- build de production ;
- validation structurelle du dépôt ;
- Playwright Chromium bureau ;
- Playwright mobile paysage ;
- contrôle du package lock ;
- création de l’artefact de production.

## Frontières respectées

- sauvegarde tactique version 6 inchangée ;
- aucun changement de contenu ou d’équilibrage ;
- aucun appel réseau tiers ;
- aucun secret client ;
- aucune génération procédurale ;
- Gargottex strictement en lecture seule.

## Suite

Le Sprint 4.1 peut définir le micro-donjon manuel, l’état d’expédition, les trois salles fixes, leurs connexions et la persistance inter-salles sur le commit stable issu du Sprint 4.0.
