import { changeBrouhaha, type BrouhahaResult } from "./brouhaha";
import type { BrouhahaReinforcementDefinition } from "./brouhaha-reinforcement-types";
import type { TacticalEvent } from "./events";
import type {
  BrouhahaEffectDefinition,
  CreatureDefinition,
  InteractableInteractionDefinition,
  RoomState,
} from "./types";

export interface DirectInteractableBrouhahaResult {
  state: RoomState;
  events: TacticalEvent[];
  result: BrouhahaResult | null;
}

export function applyDirectInteractableBrouhaha(
  state: RoomState,
  effects: readonly BrouhahaEffectDefinition[],
  creatureDefinitions: readonly CreatureDefinition[],
  reinforcementDefinitions: readonly BrouhahaReinforcementDefinition[],
  interaction: InteractableInteractionDefinition,
  instanceId: string,
  requestId: string | null,
  dungeonId: string,
): DirectInteractableBrouhahaResult {
  if (!requestId) return { state, events: [], result: null };
  const result = changeBrouhaha(
    state,
    effects,
    {
      id: requestId,
      delta: interaction.brouhahaDelta,
      source: { type: "object", id: instanceId },
      reason: interaction.reason,
    },
    { dungeonId, creatureDefinitions, reinforcementDefinitions },
  );
  return { state: result.state, events: result.events, result };
}
