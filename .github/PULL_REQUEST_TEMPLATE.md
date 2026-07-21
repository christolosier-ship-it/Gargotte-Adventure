## Objectif

Décrire le problème résolu ou la fonctionnalité apportée.

## Changements

-

## Vérification

### Commandes exécutées

```text
npm ci
npm run format:check
npm run validate:content
npm run typecheck
npm run test
npm run build
python tools/validate_repository.py
npm run test:e2e
```

Supprimer ou annoter les commandes non pertinentes. Ne jamais déclarer une commande réussie sans l’avoir exécutée ou sans disposer d’un workflow GitHub vert.

### Checklist

- [ ] Les contrôles automatisés passent.
- [ ] Le comportement a été testé sur le périmètre concerné.
- [ ] L’usage tactile, clavier et mobile paysage a été considéré.
- [ ] Aucun secret, fichier `.env`, build local ou export volumineux n’est inclus.
- [ ] La documentation est mise à jour.
- [ ] Les index et liens Markdown concernés sont à jour.
- [ ] Un ADR est ajouté ou modifié si une décision structurante change.

## Impacts

### Règles et gameplay

Aucun / À préciser.

### Données Gargottex et contenu versionné

Aucun / À préciser.

### Sauvegardes et migrations

Aucun / À préciser.

### UI, accessibilité et performances

Aucun / À préciser.

### Architecture et dépendances

Aucun / À préciser.

### Documentation, Drive et Figma

Aucun / À préciser.

## Captures ou démonstration

Ajouter les captures, vidéos ou instructions de reproduction utiles. Pour PixiJS, préciser l’état ou le scénario affiché afin que la capture reste interprétable.

## Limites et travaux reportés

Lister les éléments volontairement hors périmètre. Ne pas masquer un blocage nécessaire à la fusion.
