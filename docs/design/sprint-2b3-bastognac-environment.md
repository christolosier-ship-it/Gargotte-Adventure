# Sprint 2B.3 — Environnement Bastognac

## Statut

Implémentation proposée dans la branche `codex/sprint-2b-bastognac-environment`.

## Intention visuelle

Le premier décor illustré de la salle pilote reprend une taverne médiévale-fantasy chaleureuse, usée et lisible : bois ambré, ferrures sombres, pierre, lumière de lanterne et désordre contrôlé. Les textures restent secondaires par rapport aux informations tactiques.

## Assets runtime

Les images générées ont été optimisées en WebP transparent, puis encapsulées dans des SVG runtime autonomes. Ce choix conserve les pixels produits, respecte la règle SVG ou WebP, évite les sources PNG dans le runtime et permet le précache PWA.

| Identifiant              | Orientation | Dimensions | Fichier                       |        Poids | SHA-256                                                            |
| ------------------------ | ----------- | ---------: | ----------------------------- | -----------: | ------------------------------------------------------------------ |
| `tile.bastognac-floor-a` | omni        |   128 × 64 | `tiles/bastognac-floor-a.svg` | 4 699 octets | `7e3754a08ca456a77dad35a7dc522cd3c664b4a2e69a3cf67ad4e0e0ecfa74e1` |
| `tile.bastognac-floor-b` | omni        |   128 × 64 | `tiles/bastognac-floor-b.svg` | 4 599 octets | `f3c11c0860b0986db7ad3e54303305b2bb87e4adf3a3147a0e2ddb9951fc9977` |
| `wall.bastognac`         | south-east  |  128 × 128 | `walls/bastognac-wall-se.svg` | 7 378 octets | `f1e7ade79dc24211fac9fceb469d43e9feed0d4202be3e15aaf22200d7332499` |
| `wall.bastognac`         | north-east  |  128 × 128 | `walls/bastognac-wall-ne.svg` | 7 866 octets | `d7e6bbd74c1b51709bedc2d55062fc13899f04619b4f8d16a44bb60074a223c1` |
| `prop.bastognac-barrel`  | omni        |    96 × 96 | `props/bastognac-barrel.svg`  | 5 812 octets | `3511d700bff5420335c2b69a3a713faa79bf6c14ae9fa940a24d5ee8a611565c` |

Poids total du lot environnemental : **30 354 octets**, très inférieur au budget global de 1 Mio et à la limite de 100 Kio par asset.

## Ancrages

- sols : centre du losange, `0.5 / 0.5` ;
- murs : centre horizontal et base visuelle, `0.5 / 0.82` ;
- tonneau : contact au sol, `0.5 / 0.96` ;
- personnages : règles du lot 2B.2 inchangées.

## Intégration renderer

- alternance déterministe des deux sols selon la parité colonne + ligne ;
- texture placée sous les overlays tactiques ;
- hit area du losange conservée indépendamment des pixels opaques ;
- murs illustrés dans les deux orientations sans miroir ;
- réduction d’opacité du conteneur mural conservée sur les positions importantes ;
- tonneau affiché uniquement aux positions de `state.obstacles` ;
- obstacle et murs en `eventMode = none` ;
- cache du registre réutilisé pour toutes les occurrences ;
- vérification de génération avant toute insertion asynchrone ;
- fallbacks vectoriels visibles immédiatement et conservés en cas d’échec.

## Invariants

Le lot ne modifie pas :

- `packages/engine` ;
- `RoomState` ;
- la sauvegarde version 1 ;
- les dégâts, la portée, la ligne de vue ou l’IA ;
- le HUD et les commandes DOM ;
- les sprites de Brünhilda et du Gobelin Bricoleur.

Aucun Brouhaha, objet interactif, rig, moteur 3D ou nouvelle règle tactique n’est introduit.

## Tests

Les tests couvrent :

- manifeste, formats, dimensions, poids et fallbacks ;
- alternance des variantes de sol ;
- orientations directes des murs ;
- ancrage du tonneau ;
- chargement réel dans le navigateur ;
- échec d’un sol, d’un mur et du tonneau ;
- maintien du picking canvas et du déplacement de Brünhilda ;
- desktop et mobile paysage via la matrice Playwright existante.
