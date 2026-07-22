# Audit d’alignement du Sprint 2

- Date : 22 juillet 2026
- Référence auditée : `main` au commit `07d0b8320f9869e76504d38d0558ccd91d4e2db6`
- Pull Request finale : #24
- Issue finale : #23, clôturée comme terminée

## Objectif de l’audit

Vérifier que l’état réel de `main` respecte la roadmap, les critères du Sprint 2, les invariants d’architecture et le niveau de qualité nécessaire avant de passer au Brouhaha et au décor interactif.

L’audit ne modifie pas le code de production. Les corrections proposées portent uniquement sur la documentation.

## Sources contrôlées

- `README.md` ;
- `docs/roadmap.md` ;
- `docs/sprints/sprint-2.md` ;
- `docs/design/sprint-2-isometric-guidelines.md` ;
- `docs/adr/0006-isometric-2d-renderer.md` ;
- `docs/architecture/overview.md` ;
- `docs/architecture/tactical-room.md` ;
- `design/isometric/runtime-pipeline.md` ;
- manifeste runtime des assets ;
- renderer, projection et registre d’assets ;
- tests unitaires et Playwright ;
- Issues #14, #16, #19, #21 et #23 ;
- Pull Requests #15, #17, #18, #20, #22 et #24 ;
- rapport de suivi Google Drive.

## Verdict exécutif

**Le Sprint 2 est terminé.**

La sortie attendue de la roadmap est atteinte : la salle du Sprint 1 conserve ses règles et sa sauvegarde, tout en devenant jouable avec une présentation 2D isométrique cohérente et un pipeline graphique réutilisable.

Aucun écart bloquant ne justifie un lot de code supplémentaire dans le Sprint 2.

## Alignement avec la roadmap

### Renderer isométrique

Résultat : conforme.

- projection 128 × 64 ;
- conversion grille vers écran et conversion inverse ;
- caméra responsive ;
- picking clic et toucher ;
- profondeur stable ;
- couches explicites ;
- murs hauts et occlusion ;
- ancrages au contact au sol.

### Moteur tactique

Résultat : conforme.

- `RoomState` reste basé sur colonnes et lignes ;
- aucune règle ne dépend de PixiJS ;
- déplacements, portée, ligne de vue, dégâts et IA restent déterministes ;
- sauvegarde version 1 conservée.

### Pipeline graphique

Résultat : conforme.

- manifeste versionné ;
- validation Zod ;
- formats SVG et WebP ;
- cache de textures ;
- orientations et miroirs ;
- fallbacks non bloquants ;
- destruction sûre ;
- budgets automatiques ;
- compatibilité GitHub Pages et PWA.

### Assets pilotes

Résultat : conforme.

- Brünhilda ;
- Gobelin Bricoleur ;
- ombre au sol ;
- deux variantes de sol ;
- deux orientations de mur ;
- tonneau statique ;
- effet d’impact technique ;
- placeholders pour le reste du casting.

### Mobile, tablette et accessibilité

Résultat : conforme pour le périmètre du prototype.

- Playwright desktop ;
- Playwright mobile paysage tactile ;
- commandes DOM indépendantes du canvas ;
- picking testé avec clic et toucher ;
- redimensionnement sans mutation logique ;
- fallbacks testés en panne réseau.

## Points forts

1. La séparation moteur et renderer est restée intacte pendant toute la transformation visuelle.
2. Les bugs de profondeur, d’ancrage et d’initialisation ont été détectés puis protégés par des tests.
3. Le pipeline d’assets échoue proprement sans rendre la salle injouable.
4. Les assets sont très légers par rapport aux budgets définis.
5. Le code ne dépend ni de Figma, ni de Google Drive, ni d’une API externe pour fonctionner.
6. Les commandes DOM offrent une voie de secours accessible et testable.
7. Les lots ont été fusionnés progressivement, avec une Issue et une PR isolées par objectif.

## Écarts détectés

### Documentation centrale obsolète

Sévérité initiale : importante.

Avant correction :

- la roadmap indiquait encore le Sprint 2 comme prochain ;
- le README annonçait encore une grille orthogonale ;
- l’architecture décrivait le renderer isométrique comme futur ;
- le rapport Sprint 2 restait au statut planifié ;
- les gabarits indiquaient que les assets pilotes n’étaient pas produits.

Correction : mise à jour dans la branche `docs/close-sprint-2-audit`.

### Performance non quantifiée

Sévérité : moyenne, non bloquante.

Les budgets de poids, le cache et les tests mobile sont présents, mais aucune baseline de FPS, temps de frame ou mémoire GPU n’est enregistrée.

Recommandation : ajouter une procédure simple de profilage ou un seuil automatisé avant de multiplier les objets interactifs du Sprint 3.

### Figma partiel

Sévérité : faible.

Les fondations Figma existent mais tous les états prévus n’ont pas été formalisés, en raison des limites du plan Starter. Le handoff versionné dans GitHub compense ce manque pour le développement.

Recommandation : compléter Figma seulement lorsque cela apporte une valeur de conception ou de revue visuelle réelle.

### Micro-animations non implémentées

Sévérité : aucune.

Le cadrage autorise des sprites fixes ou très légèrement animés. Les animations étaient optionnelles et leur absence respecte l’objectif de ne pas créer prématurément un chantier d’animation.

### Effet d’impact non utilisé

Sévérité : faible.

Un asset technique d’impact est présent et précaché, mais il n’est pas encore relié aux événements de combat.

Recommandation : l’intégrer avec les premiers effets du Sprint 3 ou avec les compétences définitives, plutôt que d’ajouter une animation isolée sans système d’effets.

### Noms historiques dans la CI

Sévérité : faible.

Le workflow principal s’appelle encore `Validate foundations` et l’artefact du lockfile reste nommé `sprint-1-package-lock`.

Recommandation : renommer ces éléments lors d’un prochain lot de maintenance, sans en faire un prérequis au Sprint 3.

## Risques avant le Sprint 3

Le Sprint 3 multipliera les objets, états et effets. Les risques principaux deviennent :

- croissance de `RoomState` sans version de sauvegarde adaptée ;
- surcharge visuelle des overlays ;
- multiplication des objets PixiJS reconstruits à chaque rendu ;
- manque de métriques de performance ;
- réactions en chaîne difficiles à expliquer ;
- confusion entre obstacle statique et objet interactif ;
- journal d’événements trop technique pour le joueur.

Ces risques doivent être traités dans le cadrage du Sprint 3, pas en prolongeant artificiellement le Sprint 2.

## Décision

Le Sprint 2 est clôturé.

La prochaine étape de roadmap est le Sprint 3, après prise en compte des ajustements produit et visuels demandés par le propriétaire du projet.

Aucune modification de gameplay n’est recommandée avant cette phase d’ajustement.
