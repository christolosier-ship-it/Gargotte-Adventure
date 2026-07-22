# Sprint 2 - Plateau isométrique et pipeline graphique

## Statut

✅ Terminé le 22 juillet 2026.

Le Sprint 2 a remplacé le rendu orthogonal provisoire du Sprint 1 par un plateau 2D isométrique sous PixiJS, sans modifier les règles tactiques, le format `RoomState` ni la sauvegarde version 1.

## Objectif atteint

La salle tactique conserve les mêmes positions logiques, déplacements, portées, lignes de vue, dégâts, décisions d’IA et états de sauvegarde. La transformation porte uniquement sur la présentation, le picking, la caméra, la profondeur et le pipeline graphique.

## Principes confirmés

- grille logique 2D inchangée ;
- moteur tactique indépendant de l’isométrie ;
- projection confinée au renderer ;
- PixiJS conservé ;
- HUD et commandes accessibles conservés dans le DOM ;
- personnages 2D fixes pour le prototype ;
- aucun rig, squelette, modèle 3D ou moteur 3D ;
- priorité aux performances mobile et tablette ;
- assets pilotes légers avant production définitive.

## Lots livrés

### Sprint 2A.1 - Projection isométrique minimale

Pull Request #15, commit `a94d2fb7a87d1cc06fc4f646a36f8b16819c907c`.

- projection pure `gridToScreen` ;
- conversion inverse `screenToGrid` ;
- tuiles 128 × 64 ;
- hit areas polygonales ;
- premiers overlays tactiques ;
- tri de profondeur déterministe ;
- séparation des couches fond, sol, objets et interface ;
- tests unitaires de projection et de profondeur.

### Correctif d’ancrage

Pull Request #17, commit `8e111303351154ea0eede2f62641b9d1b7c0e7e1`.

- suppression du décalage vertical d’une demi-tuile ;
- point de contact au sol aligné sur le centre projeté ;
- ombre et silhouette cohérentes avec la case logique ;
- test de non-régression dédié.

### Sprint 2A.2 - Caméra, picking et occlusion

Pull Request #18, commit `dee6d0c072a2daf7c7735d87c6ff6e597c11dd89`.

- dimensions de salle dynamiques ;
- calcul pur des bornes et de la caméra ;
- centrage et scale responsive ;
- couches PixiJS explicites ;
- murs hauts non interactifs ;
- occlusion contextuelle par réduction d’opacité ;
- picking réel par clic et toucher sur le canvas ;
- redimensionnement sans mutation des coordonnées logiques ;
- validation desktop et mobile paysage.

### Sprint 2B.1 - Pipeline d’assets

Pull Request #20, commit `18299dffbef8f6cb7afee3068a0053222ac1e304`.

- structure runtime des assets isométriques ;
- manifeste versionné et validé avec Zod ;
- registre PixiJS centralisé ;
- résolution par orientation et miroir ;
- cache sans double chargement ;
- destruction sûre des textures ;
- fallbacks non bloquants ;
- validation des chemins, formats, fichiers et budgets ;
- compatibilité GitHub Pages et précache PWA ;
- tests réels de panne réseau.

### Sprint 2B.2 - Sprites pilotes

Pull Request #22, commit `94042eb4a48cdeebd0db6be5ffb2bbcdfd48e313`.

- Brünhilda et Gobelin Bricoleur en WebP transparent 128 × 192 ;
- ancrage commun au contact au sol ;
- ombres et zones tactiles indépendantes des sprites ;
- placeholders conservés pour le reste du casting ;
- chargement asynchrone non bloquant ;
- tests séparés de panne de chaque sprite ;
- sélection directe de la silhouette sur desktop et mobile paysage.

### Sprint 2B.3 - Environnement Bastognac

Pull Request #24, commit `07d0b8320f9869e76504d38d0558ccd91d4e2db6`.

- deux variantes de sol Bastognac 128 × 64 ;
- murs sud-est et nord-est 128 × 128 ;
- tonneau 96 × 96 sur les obstacles logiques existants ;
- manifeste runtime `2B.3.0` ;
- alternance déterministe des sols ;
- overlays placés au-dessus des textures ;
- murs et obstacle en `eventMode = none` ;
- fallbacks conservés en cas d’échec ;
- tests de panne d’un sol, d’un mur et du tonneau ;
- correction d’une course d’initialisation du bouton de lancement.

## Matrice des critères d’acceptation

| Critère | Résultat | Preuve principale |
| --- | --- | --- |
| Salle Sprint 1 jouable de bout en bout en isométrie | ✅ | tests Playwright desktop et mobile |
| Moteur, dégâts, portée, ligne de vue et IA inchangés | ✅ | aucun changement de `packages/engine` dans les lots graphiques |
| Sauvegarde compatible | ✅ | sauvegarde version 1 conservée et tests de reprise verts |
| Picking aligné sur la grille logique | ✅ | hit areas polygonales et clic/toucher réels |
| Profondeur stable | ✅ | couches explicites et `stableDepth` testé |
| Objets hauts non bloquants | ✅ | murs non interactifs et opacité contextuelle |
| Commandes DOM toujours disponibles | ✅ | mêmes handlers que le canvas |
| Lisibilité téléphone et tablette paysage | ✅ | matrice Playwright desktop/mobile paysage |
| Pipeline d’assets versionné | ✅ | manifeste `2B.3.0`, Zod et registre centralisé |
| Formats et budgets contrôlés | ✅ | SVG/WebP uniquement et validation automatique |
| Assets pilotes Bastognac | ✅ | Brünhilda, gobelin, sols, murs et tonneau |
| Fallbacks non bloquants | ✅ | tests de panne réseau et salle toujours jouable |
| Aucun rig ou moteur 3D | ✅ | aucune dépendance 3D introduite |

## Assets pilotes

Le manifeste runtime contient notamment :

1. une ombre au sol ;
2. des fallbacks de tuile, mur et obstacle ;
3. un effet d’impact technique ;
4. Brünhilda ;
5. le Gobelin Bricoleur ;
6. deux sols Bastognac ;
7. deux orientations de mur ;
8. un tonneau Bastognac.

Les autres héros et créatures restent représentés par des placeholders compatibles avec le pipeline.

## Poids et performance

- budget total du pilote : 1 Mio ;
- budget par sprite pilote : 250 Kio ;
- budget par asset technique ou environnemental : 100 Kio ;
- lot environnemental 2B.3 : 30 354 octets ;
- textures mises en cache par URL ;
- résolution limitée à deux fois le ratio de pixels de l’appareil ;
- tests navigateur exécutés sur desktop et mobile paysage.

Le Sprint 2 ne possède pas encore de seuil quantitatif de FPS ou de temps de frame. Ce manque est non bloquant pour le prototype actuel, mais une mesure automatisée ou une procédure de profilage devra être ajoutée avant la multiplication des objets interactifs.

## Animations

Les micro-animations étaient autorisées mais non obligatoires. La décision de conserver des sprites fixes est conforme au cadrage « fixes ou très légèrement animés » et évite de lancer prématurément un chantier d’animation.

L’interpolation de déplacement, l’impulsion d’attaque, le flash d’impact et l’état KO pourront être ajoutés lorsqu’ils seront reliés à des événements de gameplay stables.

## Écarts et dettes non bloquantes

- absence de baseline quantitative de fluidité ;
- gabarits Figma incomplets à cause des limites du plan Starter ;
- effet d’impact technique présent dans le manifeste mais pas encore utilisé dans la boucle de jeu ;
- noms historiques de certains workflows et artefacts CI encore liés aux Sprints 0 et 1 ;
- captures visuelles de référence à consolider après les ajustements produit.

Ces éléments ne remettent pas en cause les critères de sortie du Sprint 2.

## Validation finale

- formatage Prettier : vert ;
- validation du contenu : verte ;
- TypeScript strict : vert ;
- tests unitaires : verts ;
- build PWA : vert ;
- validation du dépôt et scan de secrets : verts ;
- Playwright desktop : vert ;
- Playwright mobile paysage : vert ;
- artefacts de production : générés.

## Sortie obtenue

La salle tactique fonctionne avec une identité visuelle isométrique cohérente, un premier ensemble d’assets Bastognac et un pipeline graphique suffisamment stable pour accueillir le Brouhaha, les objets interactifs et les futurs personnages sans réécrire le renderer.

## Après le Sprint 2

Le Sprint 3 est la prochaine étape théorique. Il peut introduire le Brouhaha et le décor interactif sur cette base, après validation des ajustements produit et visuels demandés sur la version actuelle.
