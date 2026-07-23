import type {
  BrouhahaRejectionReason,
  BrouhahaSource,
  GridPosition,
  InteractableKind,
  InteractableRejectionReason,
  SpawnRejectionReason,
  SpawnSource,
} from "./types";

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
      type: "interactable-interaction-requested";
      requestId: string;
      heroId: string;
      interactableInstanceId: string;
      interactionId: string;
    }
  | {
      type: "interactable-state-changed";
      requestId: string;
      interactableInstanceId: string;
      interactableId: string;
      kind: InteractableKind;
      previousStateId: string;
      stateId: string;
    }
  | {
      type: "interactable-interaction-succeeded";
      requestId: string;
      heroId: string;
      interactableInstanceId: string;
      interactionId: string;
      actionCost: 1;
      brouhahaRequestId: string | null;
    }
  | {
      type: "interactable-interaction-rejected";
      requestId: string;
      heroId: string;
      interactableInstanceId: string;
      interactionId: string;
      reason: InteractableRejectionReason;
      details: string[];
    }
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
    }
  | {
      type: "brouhaha-change-requested";
      requestId: string;
      source: BrouhahaSource;
      delta: number;
      reason: string;
    }
  | {
      type: "brouhaha-level-changed";
      requestId: string;
      previousLevel: number;
      level: number;
      requestedDelta: number;
      appliedDelta: number;
      reason: string;
    }
  | {
      type: "brouhaha-effect-resolved";
      requestId: string;
      resolutionId: string;
      effectId: string;
      effectName: string;
      effectDescription: string;
      effectIndex: number;
      effectCount: number;
      level: number;
    }
  | {
      type: "brouhaha-change-rejected";
      requestId: string;
      reason: BrouhahaRejectionReason;
      previousLevel: number;
      requestedDelta: number;
      details: string[];
    };

export interface EnemyDecisionExplanation {
  enemyId: string;
  targetId: string | null;
  action: "attack" | "move" | "move-and-attack" | "wait";
  reason: string;
  path: GridPosition[];
}
