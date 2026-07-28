# Vision produit

## Promesse

**Gargotte Adventure** est un jeu de plateau numérique coopératif, tactique et volontairement absurde, où le joueur comprend pourquoi chaque événement se produit et peut anticiper les conséquences de ses actions.

Le premier vertical slice est consacré au **Château de Bastognac**.

## Public visé

- joueurs appréciant les jeux tactiques accessibles ;
- familles et groupes jouant autour d’une tablette ;
- amateurs de dungeon crawlers sans lourdeur comptable ;
- joueurs attirés par un humour fantasy brassicole et une forte identité visuelle.

## Piliers d’expérience

### Tactique lisible

Trois actions par héros, dégâts et portée compréhensibles, IA déterministe et priorité à l’anticipation plutôt qu’au hasard caché.

### Brouhaha vivant

Le Brouhaha 0 à 12, ses effets, son historique, ses renforts et sa présentation sont livrés. Il reste local à chaque salle et toutes ses variations passent par des demandes explicites au moteur.

### Décor acteur

Tables, tonneaux, grilles, torches et piliers créent des choix tactiques, des poussées, des changements d’état et des réactions en chaîne.

### Personnages immédiatement identifiables

Le Sprint 4 doit finaliser les quatre héros, les seize créatures de Bastognac, leurs compétences, leurs interactions avec le décor, leurs relations avec le Brouhaha et leurs profils d’IA expliqués.

### Partie fluide sur écran tactile

- commandes à un doigt ;
- grandes zones tactiles ;
- fonctionnement en paysage ;
- clavier et souris conservés ;
- reprise rapide ;
- mouvement réduit et mode muet ;
- commandes techniques absentes du parcours normal ;
- mode diagnostic séparé.

### Expédition compréhensible

Le Sprint 4.1 a livré une expédition fixe de trois salles adjacentes : préparation, progression, objectifs locaux, transfert des héros, victoire ou défaite globale et reprise cohérente.

Le Sprint 5 générera ensuite cinq étages, leur topologie, leur géométrie et leurs rencontres. Chaque salle conserve son propre budget de menace et son propre Brouhaha.

## Cible du Sprint 4

```text
Préparation de l’expédition
→ Salle 1 : prise en main tactique
→ Salle 2 : décor, réactions et Brouhaha
→ Salle 3 : confrontation complète
→ Résultat du micro-donjon
```

## Avancement du vertical slice

### Fonctionnellement livré

- PWA installable et offline-first ;
- architecture moteur, présentation, rendu, UI et sauvegarde ;
- quatre héros pilotes sélectionnables ;
- déplacement, portée, ligne de vue et combat ;
- IA déterministe pilote ;
- victoire et défaite tactiques ;
- plateau isométrique et caméra ;
- pipeline d’assets et fallbacks ;
- spawn déterministe et instances multiples ;
- Brouhaha 0 à 12, historique et effets ;
- objets interactifs, poussées et réactions ;
- renforts explicables et persistants ;
- routeur de présentation, cues visuels, audio local et journal causal ;
- reprise sans replay et mouvement réduit ;
- micro-donjon manuel de trois salles ;
- `ExpeditionState` version 1 ;
- sauvegarde d’expédition et migration ;
- PV des héros persistants entre les salles ;
- transitions explicites ;
- victoire ou défaite globale ;
- résultat et rejeu ;
- mode diagnostic distinct ;
- tests desktop et mobile paysage.

### Sprint 4 restant

- contrats détaillés des héros et créatures ;
- compétences et capacités ;
- quatre héros définitifs ;
- seize créatures ;
- profils d’IA différenciés ;
- interactions ennemies avec le décor ;
- influences du Brouhaha sur les comportements ;
- enrichissement des trois salles ;
- équilibrage et tutoriel final du micro-donjon.

Le Sprint 4.2 est la prochaine phase active.

### Sprint 5 restant

- génération complète des salles et étages ;
- composition automatique des rencontres ;
- embranchements ;
- loot et progression ;
- campagne ;
- boss final ;
- reprise d’une expédition générée ;
- médias, animations et audio définitifs ;
- validation utilisateur sur appareils réels.

## Critères de réussite du micro-donjon Sprint 4

Déjà validés par le Sprint 4.1 :

- trois salles fixes connectées ;
- état des héros conservé ;
- Brouhaha local ;
- victoire ou défaite globale ;
- sauvegarde survivant à la fermeture ;
- parcours normal sans commandes techniques ;
- fonctionnement desktop et mobile paysage ;
- aucune génération du Sprint 5.

Restent à valider dans les lots 4.2 à 4.7 :

- rôles et compétences définitifs ;
- plusieurs profils d’IA combinés ;
- objets utilisés par les héros et créatures ;
- comportements influencés par le Brouhaha ;
- équilibrage et lisibilité du parcours complet.

## Ce que le projet n’est pas

- un portage numérique strict du plateau physique ;
- un jeu de hasard déguisé ;
- un éditeur concurrent de Gargottex ;
- un générateur opaque ;
- un service nécessitant une connexion permanente ;
- une vitrine technique sans intérêt joueur ;
- un parcours dépendant de commandes de diagnostic.

## Frontières

Le Sprint 4 construit ses trois salles à la main. Le Sprint 5 porte la génération. Gargottex reste une source éditoriale externe strictement consultée en lecture seule.