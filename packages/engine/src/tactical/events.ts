import type { GridPosition, SpawnRejectionReason, SpawnSource } from "./types";

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
  | { type: "phase-changed"; phase: string; turn: number }
  | {
      type: "spawn-requested";
      requestId: string;
      source: SpawnSource;
      creatureId: string;
      quantity: number;
    }
  | {
      type: "creature-instantiated";
      requestId: string;
      creatureId: string;
      instanceId: string;
      position: GridPosition;
    }
  | {
      type: "spawn-succeeded";
      requestId: string;
      creatureId: string;
      requested: number;
      createdInstanceIds: string[];
    }
  | {
      type: "spawn-rejected";
      requestId: string;
      creatureId: string;
      reason: SpawnRejectionReason;
      requested: number;
      available: number;
      details: string[];
    };

export interface EnemyDecisionExplanation {
  enemyId: string;
  targetId: string | null;
  action: "attack" | "move" | "move-and-attack" | "wait";
  reason: string;
  path: GridPosition[];
}
