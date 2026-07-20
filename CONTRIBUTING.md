# Contribuer à Gargotte Adventure

## Philosophie

Le projet privilégie les changements petits, testables et compréhensibles. Une Pull Request doit raconter une seule histoire cohérente.

## Branches

- `main` : version stable et publiable ;
- `sprint-N/<sujet>` : ensemble cohérent d’un sprint ;
- `feature/<sujet>` : fonctionnalité isolée ;
- `fix/<sujet>` : correction ciblée ;
- `docs/<sujet>` : documentation uniquement.

Les noms utilisent des minuscules et des tirets.

## Commits

Le projet suit les Conventional Commits :

```text
feat: ajouter une fonctionnalité
fix: corriger un défaut
docs: modifier la documentation
test: ajouter ou corriger des tests
refactor: réorganiser sans changer le comportement
chore: maintenance du dépôt ou de l’outillage
ci: modifier l’intégration continue
```

## Pull Requests

Une PR doit :

1. expliquer le problème ou l’objectif ;
2. décrire les choix effectués ;
3. indiquer comment vérifier le résultat ;
4. signaler les impacts sur les règles, le contenu, les sauvegardes et le mobile ;
5. passer tous les contrôles automatisés.

Aucun secret, fichier `.env`, build local ou export volumineux ne doit être commité.

## Définition de terminé

Un changement est terminé lorsque :

- le comportement attendu est documenté ;
- les tests pertinents passent ;
- l’expérience tactile a été considérée ;
- les données restent séparées du moteur ;
- la documentation et les ADR sont mis à jour si une décision structurante change ;
- la PR est fusionnable sans travail caché restant.

## Contenu provenant de Gargottex

Les données de jeu ne sont pas modifiées directement à plusieurs endroits. Les corrections de créatures, héros, loots ou quêtes doivent être réalisées dans la source de vérité appropriée, puis importées par le pipeline versionné.

## Sécurité

Une clé OpenAI ou tout autre secret ne doit jamais être :

- ajouté au dépôt ;
- injecté dans une variable préfixée `VITE_` ;
- empaqueté dans la PWA ;
- affiché dans les logs ou les captures d’écran ;
- stocké dans un fichier partagé sans contrôle d’accès.

Voir [docs/security/secrets.md](docs/security/secrets.md).
