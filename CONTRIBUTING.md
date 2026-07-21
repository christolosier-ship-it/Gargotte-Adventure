# Contribuer à Gargotte Adventure

## Philosophie

Le projet privilégie les changements petits, testables et compréhensibles. Une Pull Request doit raconter une seule histoire cohérente.

Une amélioration spectaculaire qui contourne les frontières du moteur, supprime les tests ou duplique les règles dans l’interface n’est pas considérée comme un progrès.

## Prérequis

- Node.js 24 ou supérieur ;
- npm ;
- Chromium Playwright pour les tests navigateur ;
- Python 3 pour le validateur du dépôt.

## Branches

- `main` : version stable et publiable ;
- `sprint-N/<sujet>` : ensemble cohérent d’un sprint ;
- `feature/<sujet>` : fonctionnalité isolée ;
- `fix/<sujet>` : correction ciblée ;
- `docs/<sujet>` : documentation uniquement.

Les noms utilisent des minuscules et des tirets. Une branche part du dernier `main` et reste courte.

## Commits

Le projet suit les Conventional Commits :

```text
feat: ajouter une fonctionnalité
fix: corriger un défaut
docs: modifier la documentation
test: ajouter ou corriger des tests
refactor: réorganiser sans changer le comportement
chore: maintenir le dépôt ou l’outillage
ci: modifier l’intégration continue
style: appliquer un formatage sans changement métier
```

Un sprint peut comporter plusieurs commits lisibles. La Pull Request est généralement fusionnée par squash.

## Installation

```bash
npm ci
```

## Contrôles locaux

Avant de pousser :

```bash
npm run format:check
npm run validate:content
npm run typecheck
npm run test
npm run build
python tools/validate_repository.py
```

Pour les changements affectant l’application, la sauvegarde, le renderer ou l’interface :

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm run check` regroupe formatage, contenu, types, tests unitaires et build. Il ne remplace pas les E2E ni le validateur Python.

## Pull Requests

Une PR doit :

1. expliquer le problème ou l’objectif ;
2. décrire les choix effectués ;
3. indiquer comment vérifier le résultat ;
4. signaler les impacts sur les règles, le contenu, les sauvegardes et le mobile ;
5. signaler les documents ou ADR modifiés ;
6. passer tous les contrôles automatisés ;
7. rester sans secret, `.env`, build local ou export volumineux.

Une PR de gameplay doit préciser :

- l’invariant de règle concerné ;
- les erreurs invalides attendues ;
- les nouveaux événements de domaine ;
- la stratégie de sauvegarde ;
- les scénarios unitaires et E2E.

## Frontières à respecter

### Moteur

Les règles tactiques appartiennent à `packages/engine`. Le moteur ne dépend pas du DOM, de PixiJS, d’IndexedDB ou d’un donjon particulier.

### Renderer

Le renderer affiche l’état et remonte des intentions. Il ne valide pas les règles.

### Interface DOM

L’UI rend les actions accessibles au clavier, à la souris et au toucher. Elle doit utiliser les mêmes handlers que PixiJS.

### Sauvegarde

Toute évolution de `RoomState` doit considérer :

- version du format ;
- migration ou rejet sûr ;
- tests de restauration ;
- compatibilité avec une partie interrompue.

### Contenu

Les données de jeu ne sont pas modifiées directement à plusieurs endroits. Gargottex reste la source éditoriale cible. Les paquets intégrés au dépôt sont validés et versionnés.

## Définition de terminé

Un changement est terminé lorsque :

- le comportement attendu est documenté ;
- les tests pertinents passent ;
- l’expérience tactile et clavier a été considérée ;
- les données restent séparées du moteur ;
- la sauvegarde est compatible ou migre proprement ;
- la documentation et les ADR sont à jour ;
- la CI est verte ;
- la PR ne dissimule aucun travail restant bloquant.

## Documentation

Une modification documentaire doit :

- décrire l’état réel plutôt qu’une intention ancienne ;
- distinguer clairement les fonctionnalités livrées des cibles futures ;
- éviter les doublons entre GitHub, Drive, Gargottex et Figma ;
- utiliser des liens relatifs pour les pages du dépôt ;
- mettre à jour les index concernés.

## Sécurité

Une clé OpenAI ou tout autre secret ne doit jamais être :

- ajouté au dépôt ;
- injecté dans une variable préfixée `VITE_` ;
- empaqueté dans la PWA ;
- affiché dans les logs ou captures ;
- stocké dans un fichier partagé avec le projet.

Voir [docs/security/secrets.md](docs/security/secrets.md).
