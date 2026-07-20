# ADR-0002 — Gargottex reste la source de vérité du contenu

- Statut : Accepté
- Date : 2026-07-20

## Contexte

Gargottex contient déjà les héros, créatures, donjons, loots, quêtes, objets, comportements IA, médias et règles de génération. Recréer ces données dans le jeu créerait deux vérités divergentes.

## Décision

Gargottex reste l’éditeur et la source de vérité éditoriale.

Gargotte Adventure consomme des **paquets de contenu générés**, validés et versionnés. Le pipeline :

1. lit un export Gargottex ;
2. normalise les identifiants et valeurs ;
3. valide les schémas et références ;
4. produit un paquet immuable pour le jeu ;
5. génère un rapport d’erreurs et de provenance.

Les fichiers Drive complètent les données structurées pour le lore, les règles et les médias, mais ne sont jamais lus directement par la PWA en production.

## Conséquences positives

- une seule source de vérité ;
- corrections centralisées ;
- ajout futur de donjons sans modifier le moteur ;
- validation avant publication ;
- traçabilité de la provenance ;
- tests reproductibles avec un paquet donné.

## Compromis et risques

- le pipeline d’import doit gérer les migrations ;
- un export Gargottex incomplet peut bloquer la génération ;
- les modifications urgentes nécessitent un nouvel export ;
- les médias doivent être associés à des identifiants stables.

## Réévaluation

Lorsque le format de contenu de Bastognac aura été utilisé avec succès pour un second donjon.
