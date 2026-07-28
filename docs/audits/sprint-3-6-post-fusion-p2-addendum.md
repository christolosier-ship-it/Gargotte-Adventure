# Addenda post-fusion du Sprint 3.6

## Statut final

- Date du constat : 28 juillet 2026
- Sprint fonctionnel : 3.6
- PR fonctionnelle initiale : #59
- PR documentaire initiale : #60
- Lot correctif : Sprint 4.0
- Issue : #63
- PR corrective : #64
- HEAD validé : `1c806a8d7362bc125fcf8c5ea92185e7cf9be7d1`
- Commit de fusion : `8c31f1adc26cc1ad56008ef5328d8f27b3ddd0bf`
- Écarts P2 ouverts : 0
- Fils de revue ouverts : 0

## Origine

La revue post-fusion du Sprint 3.6 avait identifié sept écarts P2. Ils ne remettaient pas en cause les règles tactiques ou la sauvegarde, mais empêchaient de considérer la couche de présentation comme définitivement stabilisée.

Le Sprint 4.0 a été isolé pour traiter ces écarts avant l’introduction de l’expédition et des acteurs définitifs.

## Résolution des sept écarts

1. **Transitions terminales** : victoire et défaite produisent désormais les cues terminaux à partir de la transition réelle du `RoomState`.
2. **Préférences audio** : les champs absents, invalides ou non finis sont ignorés et les valeurs par défaut sont préservées.
3. **Plafonds de cues** : les cues les plus prioritaires sont retenus, puis remis dans leur ordre causal.
4. **Tonalités répétées** : le lecteur actif d’une même clé est arrêté avant redémarrage.
5. **Garantie de priorité** : la documentation est alignée sur les sorties visuelles, audio et journal.
6. **Ordre runtime** : le contrat testé est rendu stable, présentation, puis persistance asynchrone.
7. **Frontière presentation** : `packages/presentation` est couvert par le validateur et ne peut dépendre que de `packages/engine`.

## Preuves

- Repository quality `30361556238` : succès complet ;
- Validate application `30361556300` : succès complet ;
- tests unitaires des transitions terminales réelles ;
- tests des plafonds prioritaires ;
- tests des préférences audio invalides ;
- tests du redémarrage audio ;
- test de l’ordre d’orchestration ;
- test de frontière `presentation → engine` autorisée et `presentation → renderer` refusée ;
- Playwright Chromium bureau et mobile paysage.

Les quatre fils P2 de la PR #59 et les trois fils P2 de la PR #60 ont été commentés avec leurs preuves puis résolus.

## Conclusion

La réserve post-fusion du Sprint 3.6 est close. Le Sprint 3 est définitivement stabilisé et le Sprint 4.1 peut démarrer sur la base publiée par le Sprint 4.0.

Voir [Audit de livraison du Sprint 4.0](sprint-4-0-stabilization.md).
