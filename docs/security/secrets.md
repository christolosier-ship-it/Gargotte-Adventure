# Gestion des secrets

## Règle absolue

La PWA Gargotte Adventure est un client public. Tout ce qui est inclus dans son JavaScript, ses variables de build ou ses fichiers statiques doit être considéré comme lisible par n’importe quel joueur.

Une clé OpenAI ne doit donc jamais être utilisée directement dans le navigateur.

## Clé OpenAI actuelle

La clé créée pour le projet est destinée aux outils privés de développement ou de préparation de contenu. Elle ne doit pas être copiée dans ce dépôt.

Le fichier conservé sur Google Drive doit rester à accès privé et ne doit pas être placé dans un dossier partagé avec les assets ou la documentation publique.

## Stockages autorisés

Pour les futurs outils automatisés :

- secret chiffré GitHub Actions ;
- variable d’environnement locale non versionnée ;
- gestionnaire de secrets d’un éventuel service serveur ;
- fichier privé temporaire avec permissions minimales, supprimé après usage.

## Stockages interdits

- dépôt Git, même dans un commit ensuite supprimé ;
- issue, PR, commentaire ou log GitHub ;
- fichier `VITE_*` ;
- `localStorage`, IndexedDB ou service worker ;
- bundle JavaScript ;
- capture d’écran ou vidéo ;
- dossier Drive partagé avec les ressources du jeu ;
- fichier de sauvegarde joueur.

## Variables Vite

Toute variable préfixée `VITE_` est exposée au code client. Aucune clé ou jeton privé ne doit utiliser ce préfixe.

## Architecture d’un futur outil OpenAI

```text
outil privé ou GitHub Action
        │
        ├─ lit OPENAI_API_KEY depuis un secret sécurisé
        │
        ├─ traite un contenu de travail
        │
        └─ produit un fichier validé sans secret
                         │
                         ▼
                dépôt ou paquet de contenu
```

Le jeu publié ne connaît ni la clé ni l’existence du secret. Le Sprint 0 ne réalise aucun appel OpenAI côté client : la PWA, le service worker et les manifestes générés doivent rester dépourvus de clé, jeton ou secret.

## Rotation

La clé doit être révoquée et remplacée lorsqu’elle :

- apparaît dans un commit ou un log ;
- est envoyée dans un chat ou un formulaire non sécurisé ;
- est stockée dans un dossier partagé ;
- est utilisée depuis un appareil compromis ;
- n’est plus nécessaire.

## Contrôle automatisé

Le workflow `Repository quality` recherche les motifs courants de clés OpenAI, de clés privées et d’affectations de variables sensibles. Ce contrôle limite les erreurs mais ne remplace pas une revue attentive.
