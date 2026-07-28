# ADR-0009 : profils de comportements déclaratifs

- Statut : Accepté
- Date : 2026-07-28

## Contexte

Le Sprint 4 doit intégrer quatre héros, seize créatures, des compétences, des interactions avec le décor et des comportements influencés par le Brouhaha.

Coder chaque créature avec une suite de conditions fondées sur son nom rendrait les décisions difficiles à tester, expliquer, combiner et équilibrer. Cela déplacerait aussi des règles vers l'orchestration ou l'interface.

## Décision

Les héros et créatures sont décrits par des définitions éditoriales séparées de leurs états runtime.

Les comportements ennemis utilisent des profils génériques et combinables. Chaque profil contribue à la génération, à l'exclusion ou à la priorité d'intentions candidates.

La décision suit une chaîne déterministe :

```text
état de salle
→ définition et profils
→ intentions candidates
→ conditions et exclusions
→ priorités déterministes
→ départage stable
→ intention et explication
→ moteur de résolution existant
```

Les interactions avec les objets et les variations de Brouhaha sont des intentions explicites. Les acteurs n'appliquent jamais directement leurs conséquences.

Les influences du Brouhaha sur un acteur sont déclarées par plage ou seuil, condition, modification de comportement et explication.

## Conséquences positives

- ajout d'une créature sans réécrire le moteur ;
- comportements combinables ;
- décisions reproductibles ;
- explications structurées pour le journal ;
- tests unitaires indépendants du renderer et de l'UI ;
- réutilisation des moteurs de déplacement, combat, objets, Brouhaha et spawn ;
- équilibrage possible par contenu sans branchement nominatif dispersé.

## Compromis et risques

- le modèle de priorité doit rester assez simple pour être expliqué ;
- des profils trop génériques peuvent devenir opaques s'ils accumulent trop de paramètres ;
- les pondérations exactes nécessitent des tests et un équilibrage explicites ;
- les capacités réellement uniques doivent rester des contrats nommés sans contourner les moteurs communs ;
- les migrations de contenu ne doivent pas inventer des comportements non validés.

## Invariants

1. Définitions et instances sont séparées.
2. Aucun comportement principal n'est sélectionné par le nom de la créature.
3. À entrées identiques, l'intention et l'explication sont identiques.
4. Aucun hasard implicite ne départage les candidats.
5. Le renderer et l'UI ne choisissent aucune action.
6. Les acteurs produisent des intentions d'objet.
7. Le moteur d'objets applique les transitions et réactions.
8. Le moteur de Brouhaha applique toutes les variations.
9. Le moteur de spawn crée les instances de créature.
10. Les influences du Brouhaha sont déclaratives et expliquées.

## Réévaluation

Cette décision sera évaluée lors du Sprint 4.5 sur les scénarios des trois salles. Un profil peut être scindé ou remplacé si son comportement ne peut pas être expliqué simplement, mais la séparation entre définition, décision pure, intention et moteur de résolution doit être conservée.
