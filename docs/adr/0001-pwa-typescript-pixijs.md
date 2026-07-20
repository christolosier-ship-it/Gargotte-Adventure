# ADR-0001 — PWA TypeScript avec rendu PixiJS

- Statut : Accepté
- Date : 2026-07-20

## Contexte

Le jeu doit fonctionner par un lien sur iPhone, iPad, Android et ordinateur, être installable, conserver les sauvegardes localement et permettre des mises à jour sans distribution native obligatoire.

Le gameplay est principalement 2D, tactique et au tour par tour. Les menus doivent rester accessibles tandis que le plateau doit pouvoir afficher des animations et effets fluides.

## Décision

Le socle initial utilisera :

- TypeScript strict ;
- Vite ;
- une Progressive Web App offline-first ;
- PixiJS pour le plateau et les effets 2D ;
- DOM et CSS pour les interfaces, menus et contenus accessibles ;
- IndexedDB pour les sauvegardes ;
- Vitest et Playwright pour les tests.

WebAssembly n’est pas inclus par défaut. Il sera introduit uniquement après mesure d’un problème de performance concret.

## Conséquences positives

- lancement immédiat par URL ;
- compatibilité large ;
- séparation entre rendu du plateau et interface ;
- écosystème TypeScript mature ;
- déploiement simple ;
- possibilité d’installation sur l’écran d’accueil ;
- tests du moteur sans navigateur.

## Compromis et risques

- les performances Web restent inférieures à une application native très exigeante ;
- Safari iOS impose des contraintes de mémoire et de cache ;
- le son et le plein écran nécessitent une interaction utilisateur ;
- certaines fonctions natives pourraient nécessiter une adaptation future.

## Réévaluation

Après le vertical slice complet de Bastognac, sur la base de mesures réelles sur iPhone et iPad.
