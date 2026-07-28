# Addenda post-fusion du Sprint 3.6

## Statut

- Date du constat : 28 juillet 2026
- Sprint fonctionnel : 3.6
- Pull Request fonctionnelle : #59, fusionnée
- Commit fonctionnel : `7b8cd5adaece665ec2fb817a6f4b613e8c71cdc4`
- Pull Request documentaire de clôture : #60, fusionnée
- Base observée : `cc7756ba94a41be0eb2e20ca5a9f6ff6766df3fe`
- Écarts P2 ouverts : 7
- Lot de traitement : Sprint 4.0
- Issue documentaire : #61

## Rôle de cet addenda

Les audits historiques restent inchangés. Cet addenda consigne les constats apparus après les fusions des PR #59 et #60.

Le Sprint 3 est fonctionnellement livré et fusionné. Sa clôture définitive reste soumise à un dernier lot de stabilisation du Sprint 3.6 et à la résolution des écarts P2 post-fusion.

La CI verte de la livraison confirme que les contrôles automatisés existants passent. Elle ne clôt pas les écarts de comportement ou de couverture découverts ensuite par la revue.

## P2 fonctionnels de la PR #59

### P2-1 : cues terminaux sur les transitions réelles

- Fichier signalé : `packages/presentation/src/router.ts`
- Statut : ouvert
- Constat : les chemins ordinaires de victoire et de défaite peuvent produire un `RoomState` terminal sans événement `phase-changed` consommable par le routeur.
- Risque : absence de cue visuel, son de victoire ou défaite et message terminal dans le journal.
- Attendu Sprint 4.0 : dériver la transition terminale à partir des états précédent et suivant ou produire un événement moteur explicite, sans déplacer la règle dans la présentation.

### P2-2 : préférences audio persistées invalides

- Fichier signalé : `apps/game/src/presentation-controller.ts`
- Statut : ouvert
- Constat : un JSON valide mais incomplet ou mal typé peut transmettre `muted: undefined` et écraser la valeur par défaut.
- Risque : état audio incohérent et attribut accessible `aria-pressed` invalide.
- Attendu Sprint 4.0 : ne conserver que les champs validés ou ignorer les valeurs `undefined` lors de la configuration.

### P2-3 : plafonds et priorité des cues

- Fichier signalé : `packages/presentation/src/router.ts`
- Statut : ouvert
- Constat : les limites de dix cues visuels et six cues audio sont appliquées par troncature dans l'ordre, sans préserver les conséquences de priorité supérieure.
- Risque : renfort ou phase terminale tardive supprimé d'une longue chaîne.
- Attendu Sprint 4.0 : sélectionner les cues prioritaires tout en restaurant leur ordre causal, puis couvrir les chaînes longues.

### P2-4 : superposition des tonalités répétées

- Fichier signalé : `packages/audio/src/index.ts`
- Statut : ouvert
- Constat : rejouer rapidement une même clé ajoute des oscillateurs actifs au lieu de redémarrer le son.
- Risque : amplification et superposition involontaires dans une résolution dense.
- Attendu Sprint 4.0 : arrêter ou redémarrer le lecteur actif de la clé avant une nouvelle lecture.

## P2 documentaires et de frontière de la PR #60

### P2-5 : garantie de priorité trop large

- Fichier signalé : `docs/architecture/presentation-and-finishing.md`
- Statut : ouvert, corrigé dans le cadrage actif mais pas dans le code
- Constat : la documentation garantissait la conservation prioritaire de toutes les conséquences, alors que le comportement livré la garantit seulement pour le journal.
- Attendu Sprint 4.0 : aligner définitivement le code et les garanties après correction du P2-3.

### P2-6 : ordre runtime documenté incorrect

- Fichier signalé : `docs/architecture/runtime.md`
- Statut : ouvert, formulation active corrigée
- Constat : l'orchestration livrée effectue rendu stable, présentation puis persistance asynchrone, contrairement à l'ordre précédemment documenté.
- Attendu Sprint 4.0 : décider si cet ordre reste le contrat ou si l'orchestration doit changer, puis tester la décision.

### P2-7 : package presentation absent du validateur de frontières

- Fichier signalé : `docs/architecture/repository-structure.md`
- Statut : ouvert
- Constat : le graphe documentaire inclut `packages/presentation`, mais `tools/validate_repository.py` ne le couvre pas dans sa table de dépendances autorisées.
- Risque : une dépendance interdite ou un cycle impliquant ce package peut échapper au contrôle annoncé.
- Attendu Sprint 4.0 : étendre le validateur au package et ajouter les tests correspondants.

## Frontière du Sprint 4.0

Le Sprint 4.0 peut modifier uniquement ce qui est nécessaire pour :

- corriger les sept P2 ;
- ajouter les tests de non-régression ;
- résoudre les fils de revue ;
- aligner les documents actifs et Google Drive ;
- produire une base stable validée.

Il ne doit pas introduire :

- `ExpeditionState` ;
- les trois salles ;
- héros ou créatures définitifs ;
- compétences ;
- profils d'IA du Sprint 4 ;
- équilibrage ;
- génération procédurale.

## Critères de clôture du Sprint 4.0

- les sept fils P2 sont corrigés ou explicitement arbitrés ;
- les fils de revue correspondants sont résolus ;
- les cues terminaux sont couverts sur victoire et défaite réelles ;
- les plafonds préservent les priorités ;
- les préférences audio invalides conservent les défauts ;
- les tonalités répétées ne se superposent pas ;
- le chemin runtime documenté correspond au code ;
- le package `presentation` est couvert par le validateur de frontières ;
- tests unitaires, build et Playwright sont verts ;
- GitHub et Drive sont alignés ;
- un nouveau commit stable de `main` est identifié.

## Verdict actuel

- Livraison fonctionnelle du Sprint 3 : oui
- Clôture définitive du Sprint 3 : non
- Documentation du Sprint 4 : peut être préparée
- Développement fonctionnel des lots 4.1 à 4.7 : bloqué jusqu'à la clôture du Sprint 4.0
