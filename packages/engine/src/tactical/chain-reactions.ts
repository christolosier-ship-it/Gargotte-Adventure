import { resolveChainReactionAction } from "./chain-reaction-actions";
import type { TacticalEvent } from "./events";
import { samePosition } from "./grid";
import type {
  ChainReactionDefinition,
  ChainReactionHistoryEntry,
  ChainReactionResult,
  ChainReactionRuntimeTrigger,
  ChainReactionTriggerDefinition,
} from "./chain-reaction-types";
import type {
  BrouhahaEffectDefinition,
  InteractableDefinition,
  RoomState,
} from "./types";

export const MAX_CHAIN_REACTION_STEPS = 32;

export interface ChainReactionContext {
  dungeonId: string;
  rootRequestId: string;
}

export function resolveChainReactions(
  initialState: RoomState,
  interactableDefinitions: readonly InteractableDefinition[],
  brouhahaEffects: readonly BrouhahaEffectDefinition[],
  reactionDefinitions: readonly ChainReactionDefinition[],
  initialTriggers: readonly ChainReactionRuntimeTrigger[],
  context: ChainReactionContext,
): ChainReactionResult {
  let state = initialState;
  const events: TacticalEvent[] = [];
  const history: ChainReactionHistoryEntry[] = [];
  const queue = [...initialTriggers];
  const executed = new Set<string>();
  const orderedDefinitions = [...reactionDefinitions].sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  let guarded = false;

  while (queue.length > 0) {
    const runtimeTrigger = queue.shift()!;
    const matching = orderedDefinitions.filter((definition) =>
      triggerMatches(definition.trigger, runtimeTrigger.trigger),
    );

    for (const definition of matching) {
      if (executed.has(definition.id)) {
        const recorded = recordGuard(
          state,
          history,
          context,
          definition,
          runtimeTrigger,
          "cycle-detected",
        );
        state = recorded.state;
        events.push(recorded.event);
        guarded = true;
        continue;
      }
      if (executed.size >= MAX_CHAIN_REACTION_STEPS) {
        const recorded = recordGuard(
          state,
          history,
          context,
          definition,
          runtimeTrigger,
          "max-steps",
        );
        state = recorded.state;
        events.push(recorded.event);
        guarded = true;
        return { state, events, history, guarded };
      }

      executed.add(definition.id);
      events.push({
        type: "chain-reaction-triggered",
        rootRequestId: context.rootRequestId,
        reactionDefinitionId: definition.id,
        triggerType: runtimeTrigger.trigger.type,
        sourceInstanceId: runtimeTrigger.trigger.interactableInstanceId,
        parentReactionId: runtimeTrigger.parentReactionId,
      });

      for (const [actionIndex, action] of definition.actions.entries()) {
        const sequence = state.nextChainReactionSequence;
        const reactionId = `reaction-${sequence}`;
        const resolution = resolveChainReactionAction(
          state,
          interactableDefinitions,
          brouhahaEffects,
          action,
          reactionId,
          context.dungeonId,
        );
        const entry: ChainReactionHistoryEntry = {
          id: reactionId,
          rootRequestId: context.rootRequestId,
          sequence,
          reactionDefinitionId: definition.id,
          triggerType: runtimeTrigger.trigger.type,
          sourceInstanceId: runtimeTrigger.trigger.interactableInstanceId,
          parentReactionId: runtimeTrigger.parentReactionId,
          actionIndex,
          actionType: action.type,
          targetId: resolution.targetId,
          outcome: resolution.outcome,
          details: resolution.details,
        };
        state = {
          ...resolution.state,
          nextChainReactionSequence: sequence + 1,
          chainReactionHistory: [
            ...resolution.state.chainReactionHistory,
            entry,
          ],
        };
        history.push(entry);
        events.push(...resolution.events);
        queue.push(
          ...resolution.triggers.map((trigger) => ({
            trigger,
            parentReactionId: reactionId,
          })),
        );
      }
    }
  }

  return { state, events, history, guarded };
}

function triggerMatches(
  expected: ChainReactionTriggerDefinition,
  actual: ChainReactionTriggerDefinition,
): boolean {
  if (
    expected.type !== actual.type ||
    expected.interactableInstanceId !== actual.interactableInstanceId
  )
    return false;
  if (expected.type === "state-entered" && actual.type === "state-entered")
    return expected.stateId === actual.stateId;
  if (expected.type === "moved" && actual.type === "moved")
    return (
      !expected.position ||
      Boolean(
        actual.position && samePosition(expected.position, actual.position),
      )
    );
  return false;
}

function recordGuard(
  state: RoomState,
  history: ChainReactionHistoryEntry[],
  context: ChainReactionContext,
  definition: ChainReactionDefinition,
  runtimeTrigger: ChainReactionRuntimeTrigger,
  reason: "cycle-detected" | "max-steps",
): { state: RoomState; event: TacticalEvent } {
  const sequence = state.nextChainReactionSequence;
  const id = `reaction-${sequence}`;
  const entry: ChainReactionHistoryEntry = {
    id,
    rootRequestId: context.rootRequestId,
    sequence,
    reactionDefinitionId: definition.id,
    triggerType: runtimeTrigger.trigger.type,
    sourceInstanceId: runtimeTrigger.trigger.interactableInstanceId,
    parentReactionId: runtimeTrigger.parentReactionId,
    actionIndex: 0,
    actionType: "guard",
    targetId: null,
    outcome: "guarded",
    details: [reason],
  };
  history.push(entry);
  return {
    state: {
      ...state,
      nextChainReactionSequence: sequence + 1,
      chainReactionHistory: [...state.chainReactionHistory, entry],
    },
    event: {
      type: "chain-reaction-guarded",
      reactionId: id,
      rootRequestId: context.rootRequestId,
      reactionDefinitionId: definition.id,
      reason,
    },
  };
}
