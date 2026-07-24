import { spawnCreatures } from "./spawn";
import type { TacticalEvent } from "./events";
import type {
  BrouhahaReinforcementDefinition,
  BrouhahaReinforcementHistoryEntry,
  BrouhahaReinforcementResult,
} from "./brouhaha-reinforcement-types";
import type { CreatureDefinition, RoomState } from "./types";

export interface BrouhahaLevelTransition {
  requestId: string;
  previousLevel: number;
  level: number;
}

export interface BrouhahaReinforcementResolution {
  state: RoomState;
  events: TacticalEvent[];
  history: BrouhahaReinforcementHistoryEntry[];
}

export function resolveBrouhahaReinforcements(
  initialState: RoomState,
  creatureDefinitions: readonly CreatureDefinition[],
  reinforcementDefinitions: readonly BrouhahaReinforcementDefinition[],
  transition: BrouhahaLevelTransition,
): BrouhahaReinforcementResolution {
  let state = initialState;
  const events: TacticalEvent[] = [];
  const history: BrouhahaReinforcementHistoryEntry[] = [];

  const eligible = [...reinforcementDefinitions]
    .filter(
      (definition) =>
        transition.previousLevel < definition.threshold &&
        definition.threshold <= transition.level,
    )
    .sort(
      (left, right) =>
        left.threshold - right.threshold || left.id.localeCompare(right.id),
    );

  for (const definition of eligible) {
    const activation =
      state.brouhahaReinforcementHistory.filter(
        (entry) => entry.reinforcementDefinitionId === definition.id,
      ).length + 1;
    if (activation > definition.maxActivations) continue;

    const activationId = reinforcementActivationId(
      transition.requestId,
      definition.id,
      activation,
    );
    if (
      state.brouhahaReinforcementHistory.some(
        (entry) => entry.id === activationId,
      )
    )
      continue;

    const spawnRequestId = `${activationId}-spawn`;
    events.push({
      type: "reinforcement-triggered",
      reinforcementId: activationId,
      reinforcementDefinitionId: definition.id,
      brouhahaRequestId: transition.requestId,
      previousLevel: transition.previousLevel,
      level: transition.level,
      threshold: definition.threshold,
      activation,
      spawnRequestId,
    });

    const spawn = spawnCreatures(state, creatureDefinitions, {
      id: spawnRequestId,
      source: { type: "brouhaha", id: definition.id },
      creatureId: definition.creatureId,
      quantity: definition.quantity,
      candidateSpawnPointIds: definition.candidateSpawnPointIds,
      failureMode: definition.failureMode,
    });
    const result = reinforcementResult(
      spawn.created.length,
      definition.quantity,
    );
    const details = reinforcementDetails(
      spawn.created.length,
      definition.quantity,
      spawn.rejected.flatMap((rejection) => rejection.details),
    );
    const sequence = state.nextBrouhahaReinforcementSequence;
    const entry: BrouhahaReinforcementHistoryEntry = {
      id: activationId,
      sequence,
      reinforcementDefinitionId: definition.id,
      brouhahaRequestId: transition.requestId,
      previousLevel: transition.previousLevel,
      level: transition.level,
      threshold: definition.threshold,
      activation,
      spawnRequestId,
      result,
      createdInstanceIds: spawn.created.map((instance) => instance.id),
      details,
    };
    state = {
      ...spawn.state,
      nextBrouhahaReinforcementSequence: sequence + 1,
      brouhahaReinforcementHistory: [
        ...spawn.state.brouhahaReinforcementHistory,
        entry,
      ],
    };
    history.push(entry);
    events.push(...spawn.events, {
      type: "reinforcement-resolved",
      reinforcementId: activationId,
      reinforcementDefinitionId: definition.id,
      brouhahaRequestId: transition.requestId,
      threshold: definition.threshold,
      activation,
      spawnRequestId,
      result,
      createdInstanceIds: entry.createdInstanceIds,
      details,
    });
  }

  return { state, events, history };
}

export function reinforcementActivationId(
  brouhahaRequestId: string,
  reinforcementDefinitionId: string,
  activation: number,
): string {
  return `reinforcement-${brouhahaRequestId}-${reinforcementDefinitionId}-${activation}`;
}

function reinforcementResult(
  created: number,
  requested: number,
): BrouhahaReinforcementResult {
  if (created === 0) return "rejected";
  return created === requested ? "succeeded" : "partial";
}

function reinforcementDetails(
  created: number,
  requested: number,
  rejectionDetails: string[],
): string[] {
  const summary = `${created}/${requested} créature(s) créée(s).`;
  return rejectionDetails.length > 0
    ? [summary, ...rejectionDetails]
    : [summary];
}
