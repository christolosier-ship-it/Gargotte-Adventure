import type { GridPosition } from "./types";
export type TacticalEvent =
  | { type: "hero-selected"; heroId: string }
  | {
      type: "combatant-moved";
      combatantId: string;
      from: GridPosition;
      to: GridPosition;
      actionCost: 1;
    }
  | {
      type: "combatant-attacked";
      attackerId: string;
      targetId: string;
      damage: number;
      remainingHp: number;
    }
  | { type: "combatant-defeated"; combatantId: string }
  | { type: "activation-ended"; heroId: string }
  | {
      type: "enemy-decision";
      enemyId: string;
      explanation: EnemyDecisionExplanation;
    }
  | { type: "phase-changed"; phase: string; turn: number };
export interface EnemyDecisionExplanation {
  enemyId: string;
  targetId: string | null;
  action: "attack" | "move" | "move-and-attack" | "wait";
  reason: string;
  path: GridPosition[];
}
