# ADR-0003 — Aucun secret ou appel OpenAI dans le client

- Statut : Accepté
- Date : 2026-07-20

## Contexte

Une PWA est distribuée au navigateur. Ses fichiers, variables de build et appels réseau peuvent être inspectés. Une clé OpenAI intégrée au client serait donc publique et exploitable par un tiers.

Le jeu doit également rester jouable hors ligne et ne pas dépendre du coût, de la disponibilité ou de la variabilité d’un modèle distant.

## Décision

- aucune clé API n’est incluse dans le dépôt ou la PWA ;
- aucun appel OpenAI n’est requis pour jouer ;
- l’API OpenAI est réservée aux outils privés de développement, de préparation de contenu ou de QA ;
- ces outils lisent la clé depuis un secret sécurisé côté serveur, GitHub Actions ou environnement local ;
- leurs sorties doivent être validées, reproductibles lorsque nécessaire et dépourvues de secret.

## Conséquences positives

- absence de fuite de clé dans le navigateur ;
- jeu fonctionnel hors ligne ;
- coûts maîtrisés ;
- règles stables et testables ;
- aucune latence réseau dans la boucle de jeu.

## Compromis et risques

- les fonctions génératives éventuelles ne sont pas disponibles instantanément dans le jeu ;
- un service serveur séparé serait requis pour une future fonction en ligne ;
- les contenus générés doivent passer par une validation humaine ou automatisée avant intégration.

## Réévaluation

Uniquement si une fonctionnalité en ligne apporte une valeur joueur démontrée et dispose d’un backend sécurisé avec quotas, authentification et modération adaptés.
