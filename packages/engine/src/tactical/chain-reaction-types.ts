import type { GridPosition } from "./types";

export type ChainReactionTriggerDefinition =
  | {
      type: "state-entered";
      interactableInstanceId: string;
      stateId: string;
    }
  | {
      type: "moved";
      interactableInstanceId: string;
      position?: GridPosition;
    };

export type ChainReactionActionDefinition =
  | {
      type: "transition";
      targetInstanceId: string;
      interactionId: string;
    }
  | {
      type: "move";
      targetInstanceId: string;
      offset: GridPosition;
    }
  | {
      type: "damage";
      centerInstanceId: string;
      radius: number;
      amount: number;
    }
  | {
      type: "brouhaha";
      delta: number;
      reason: string;
    };

export interface ChainReactionDefinition {
  id: string;
  trigger: ChainReactionTriggerDefinition;
  actions: ChainReactionActionDefinition[];
}

export type ChainReactionActionType = ChainReactionActionDefinition["type"];
export type ChainReactionOutcome = "applied" | "skipped" | "guarded";

export interface ChainReactionHistoryEntry {
  id: string;
  rootRequestId: string;
  sequence: number;
  reactionDefinitionId: string;
  triggerType: ChainReactionTriggerDefinition["type"];
  sourceInstanceId: string;
  parentReactionId: string | null;
  actionIndex: number;
  actionType: ChainReactionActionType | "guard";
  targetId: string | null;
  outcome: ChainReactionOutcome;
  details: string[];
}

export interface ChainReactionRuntimeTrigger {
  trigger: ChainReactionTriggerDefinition;
  parentReactionId: string | null;
}

export interface ChainReactionActionResolution {
  state: import("./types").RoomState;
  events: import("./events").TacticalEvent[];
  triggers: ChainReactionTriggerDefinition[];
  outcome: ChainReactionOutcome;
  targetId: string | null;
  details: string[];
}

export interface ChainReactionResult {
  state: import("./types").RoomState;
  events: import("./events").TacticalEvent[];
  history: ChainReactionHistoryEntry[];
  guarded: boolean;
}
