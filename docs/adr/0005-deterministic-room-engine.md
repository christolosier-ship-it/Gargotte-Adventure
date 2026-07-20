# ADR 0005 — Moteur de salle déterministe

Décision : isoler les règles tactiques dans un moteur TypeScript pur. Les entrées sont des états et intentions validées. Les sorties sont des états clonés et événements explicatifs.

Conséquences : l'interface ne décide jamais des règles, les tests Node couvrent la grille, le combat, les tours et l'IA, et aucune source de hasard ou date système n'influence la salle.
