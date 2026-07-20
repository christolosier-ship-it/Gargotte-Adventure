# Politique de sécurité

## Signaler un problème

Ne publiez pas de secret, clé API, donnée personnelle ou preuve d’exploitation dans une issue publique.

Pour le moment, le projet étant personnel, signalez directement le problème au propriétaire du dépôt par un canal privé.

## Périmètre prioritaire

- fuite de clés ou de jetons ;
- injection de contenu non fiable ;
- corruption ou perte de sauvegarde ;
- chargement de ressources distantes non contrôlées ;
- exécution de scripts provenant des données importées ;
- dépendances compromises ;
- exposition de données locales IndexedDB.

## Engagements

- aucun secret dans le dépôt ou le bundle client ;
- validation stricte des exports Gargottex ;
- mises à jour de dépendances examinées ;
- build reproductible ;
- sauvegardes versionnées et migrables ;
- permissions minimales pour les automatisations.
