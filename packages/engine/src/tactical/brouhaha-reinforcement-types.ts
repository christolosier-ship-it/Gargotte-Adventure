import type { SpawnFailureMode } from "./types";

export interface BrouhahaReinforcementDefinition {
  id: string;
  threshold: number;
  creatureId: string;
  quantity: number;
  candidateSpawnPointIds: string[];
  failureMode: SpawnFailureMode;
  maxActivations: number;
}

export type BrouhahaReinforcementResult = "succeeded" | "partial" | "rejected";

export interface BrouhahaReinforcementHistoryEntry {
  id: string;
  sequence: number;
  reinforcementDefinitionId: string;
  brouhahaRequestId: string;
  previousLevel: number;
  level: number;
  threshold: number;
  activation: number;
  spawnRequestId: string;
  result: BrouhahaReinforcementResult;
  createdInstanceIds: string[];
  details: string[];
}
