import { changeBrouhaha, type BrouhahaResult } from "./brouhaha";
import type { TacticalEvent } from "./events";
import type {
  BrouhahaEffectDefinition,
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
    { dungeonId },
  );
  return { state: result.state, events: result.events, result };
}
