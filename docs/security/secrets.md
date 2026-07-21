# Gestion des secrets

## Règle absolue

La PWA Gargotte Adventure est un client public. Tout ce qui est inclus dans son JavaScript, ses variables de build, ses sourcemaps ou ses fichiers statiques doit être considéré comme lisible par n’importe quel joueur.

Aucune clé OpenAI, clé privée, jeton d’accès, mot de passe ou secret ne doit donc être utilisé directement dans le navigateur.

## Position du projet

La boucle de jeu ne dépend d’aucune API OpenAI ni d’aucun service distant.

Une éventuelle clé utilisée par un outil privé de développement, de préparation de contenu ou de QA :

- ne doit pas être mentionnée comme existante dans la documentation publique ;
- ne doit jamais être copiée dans ce dépôt ;
- ne doit pas être stockée avec les assets ou documents partagés du jeu ;
- doit être gérée dans un environnement privé avec droits minimaux.

## Stockages autorisés

Pour les futurs outils automatisés :

- secret chiffré GitHub Actions ;
- variable d’environnement locale non versionnée ;
- gestionnaire de secrets d’un service serveur ;
- coffre de secrets d’entreprise ou personnel ;
- fichier privé temporaire avec permissions minimales, supprimé après usage.

## Stockages interdits

- dépôt Git, même dans un commit ensuite supprimé ;
- branche, tag ou artefact public ;
- issue, PR, commentaire ou log GitHub ;
- fichier `.env` versionné ;
- variable `VITE_*` ;
- `localStorage`, IndexedDB ou service worker ;
- bundle JavaScript ou sourcemap ;
- capture d’écran ou vidéo ;
- dossier Drive partagé avec les ressources du jeu ;
- fichier Figma partagé ;
- sauvegarde joueur.

## Variables Vite

Toute variable préfixée `VITE_` est exposée au code client. Aucune clé ou aucun jeton privé ne doit utiliser ce préfixe.

Une variable non préfixée n’est pas automatiquement sûre : elle ne doit être utilisée dans un build client que si elle contient une valeur publique.

## Architecture d’un futur outil privé

```text
outil privé ou GitHub Action
        │
        ├─ lit le secret depuis un stockage sécurisé
        │
        ├─ traite un contenu de travail
        │
        └─ produit un fichier validé sans secret
                         │
                         ▼
                dépôt ou paquet de contenu
```

Le jeu publié ne connaît ni la clé ni le stockage du secret.

## Prévention dans le dépôt

- `.gitignore` exclut les fichiers locaux sensibles attendus ;
- le workflow `Repository quality` recherche des motifs courants de secrets ;
- le validateur du dépôt inspecte les fichiers attendus et l’encodage ;
- la revue de Pull Request exige l’absence de fichier `.env`, secret ou build local ;
- le build et les sourcemaps doivent être contrôlés lorsqu’un nouvel outil de build est introduit.

Les scans automatisés réduisent le risque mais ne remplacent pas une revue humaine.

## Réaction à une fuite

Lorsqu’un secret apparaît dans un commit, un log, un chat, une capture ou un espace partagé :

1. le révoquer immédiatement ;
2. en créer un nouveau uniquement si nécessaire ;
3. supprimer l’exposition visible ;
4. analyser l’historique et les artefacts ;
5. vérifier les usages inhabituels ;
6. documenter l’incident sans recopier le secret ;
7. renforcer le contrôle qui aurait dû l’empêcher.

Supprimer simplement le dernier commit ne suffit pas : le secret doit être considéré comme compromis.

## Rotation

Un secret doit être révoqué et remplacé lorsqu’il :

- apparaît dans un commit, un log ou une conversation ;
- est stocké dans un dossier ou fichier partagé ;
- est utilisé depuis un appareil compromis ;
- a été transmis à une personne ou un service non autorisé ;
- n’est plus nécessaire ;
- atteint la durée de vie définie par sa politique de sécurité.
