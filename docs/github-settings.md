# Réglages GitHub recommandés

Les connecteurs disponibles permettent de gérer les fichiers, branches, issues et Pull Requests, mais pas tous les réglages d’administration du dépôt. Les paramètres suivants doivent être appliqués dans les réglages GitHub lorsque l’interface le permet.

## Branche `main`

Créer une règle de protection ou un ruleset avec :

- Pull Request obligatoire avant fusion ;
- au moins une approbation lorsque plusieurs contributeurs participent ;
- conversations de revue résolues ;
- contrôle `Validate foundations` obligatoire ;
- branche à jour avant fusion ;
- interdiction des suppressions et des force-push ;
- application de la règle aux administrateurs lorsque le projet devient collaboratif.

## Fusion

- autoriser **Squash merging** ;
- désactiver les merge commits lorsque l’historique devient encombré ;
- supprimer automatiquement les branches après fusion ;
- autoriser l’auto-merge lorsque les contrôles sont verts.

## Issues et projets

- activer les Issues ;
- utiliser les formulaires fournis dans `.github/ISSUE_TEMPLATE` ;
- créer les labels fonctionnels au fur et à mesure des besoins réels ;
- éviter une taxonomie de labels trop fine au Sprint 0.

## GitHub Actions

- permissions par défaut en lecture seule ;
- autoriser l’écriture uniquement dans les workflows qui en ont besoin ;
- ne jamais enregistrer une clé dans un fichier du dépôt ;
- utiliser les secrets GitHub pour les futurs outils privés ;
- limiter les workflows OpenAI aux branches ou déclenchements nécessaires.

## Pages

La publication GitHub Pages sera configurée lors de la phase PWA du Sprint 0. Le déploiement devra provenir d’un workflow validé sur `main`.

## Dépendances

À l’arrivée du socle TypeScript :

- activer Dependabot pour npm et GitHub Actions ;
- activer les alertes de sécurité ;
- examiner les mises à jour majeures plutôt que les fusionner automatiquement ;
- conserver le fichier de verrouillage des dépendances.
