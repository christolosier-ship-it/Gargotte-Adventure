# Sources artistiques pilotes

## Brünhilda la Torgnole

- source : Google Drive ;
- fichier : `Brunhilda.PNG` ;
- identifiant Drive : `1PVT0BKb_zf9f3A01gFneRvdXxYYe3hKG` ;
- usage : référence de silhouette, couleurs, équipement et expression ;
- état : export WebP runtime intégré, canvas transparent `128 × 192`, 11 364 octets, SHA-256 `8c474cc2c5a8c41801b2e6d484eea19c1662758b3d6571ddd91ec40073d82fb9`.

Traitement attendu :

1. détourer sans supprimer la branche ni la chope ;
2. conserver une marge de sécurité autour des accessoires ;
3. cadrer dans un canvas transparent de ratio maximal `128 × 192` ;
4. positionner le contact au sol vers `y = 92 %` du canvas ;
5. exporter en WebP transparent ;
6. produire une version orientée sud-est ;
7. orientation runtime retenue : `omni` frontale fixe, car la source ne fournit pas de vue arrière honnête ; aucun miroir horizontal déclaré afin de ne pas inverser la chope et la branche.

## Gobelin Bricoleur

- source : Google Drive ;
- fichier : `bestiaire_creatures_standards.pdf` ;
- identifiant Drive : `1tydL8kQSblMp8N1nsP0xgVxIEE-pCCXy` ;
- position : première créature du bestiaire standard ;
- silhouette : lunettes sur le front, bombe ronde, clé plate et équipement de bricoleur ;
- usage : premier ennemi pilote ;
- état : export WebP runtime intégré, canvas transparent `128 × 192`, 12 064 octets, SHA-256 `4fb8c4b7278d99c069bd54777e2fd87ae47f58ccbac4842cb19c21e0b59492c2`.

Traitement attendu :

1. extraire l’image originale du PDF ;
2. détourer le gobelin en décidant si le socle illustré est conservé ou supprimé ;
3. conserver la bombe et la clé pour la lisibilité du rôle ;
4. cadrer dans un canvas transparent de ratio maximal `128 × 192` ;
5. aligner son point de contact au sol avec celui de Brünhilda ;
6. exporter en WebP transparent ;
7. orientation runtime retenue : `omni` frontale fixe, car la source ne fournit pas de vue arrière honnête ; aucun miroir horizontal déclaré afin de ne pas inverser la bombe, la clé et les accessoires.

## Règle de dépôt

Les sources maîtres restent sur Google Drive. GitHub reçoit uniquement :

- les manifestes ;
- les tokens ;
- les exports optimisés pour le jeu ;
- les previews nécessaires aux Pull Requests ;
- la documentation des transformations.

Les exports runtime définitifs ne doivent être ajoutés qu’après validation visuelle et mesure de leur poids.
