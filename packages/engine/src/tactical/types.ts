import type { ChainReactionHistoryEntry } from "./chain-reaction-types";

export interface GridPosition {
  column: number;
  row: number;
}

export type RoomPhase = "heroes-turn" | "enemy-turn" | "victory" | "defeat";

export interface Combatant {
  id: string;
  name: string;
  kind: "hero" | "enemy";
  position: GridPosition;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  range: number;
  alive: boolean;
  blocksMovement: boolean;
}

export interface HeroState extends Combatant {
  kind: "hero";
  actionsRemaining: number;
  activationCompleted: boolean;
}

export interface CreatureDefinition {
  id: string;
  name: string;
  maxHp: number;
  atk: number;
  def: number;
  range: number;
  blocksMovement: boolean;
}

export interface CreatureInstance extends Combatant {
  kind: "enemy";
  creatureId: string;
}

export type EnemyState = CreatureInstance;

export interface InitialCreaturePlacement {
  id: string;
  creatureId: string;
  position: GridPosition;
}

export type InteractableKind = "table" | "barrel" | "gate" | "torch" | "pillar";

export interface InteractableStateDefinition {
  id: string;
  label: string;
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
}

export interface InteractableMovementDefinition {
  type: "push";
  distance: 1;
}

export interface InteractableInteractionDefinition {
  id: string;
  label: string;
  fromStateId: string;
  toStateId: string;
  brouhahaDelta: number;
  reason: string;
  movement?: InteractableMovementDefinition;
}

export interface InteractableDefinition {
  id: string;
  name: string;
  kind: InteractableKind;
  initialStateId: string;
  states: InteractableStateDefinition[];
  interactions: InteractableInteractionDefinition[];
}

export interface InitialInteractablePlacement {
  id: string;
  interactableId: string;
  position: GridPosition;
  stateId: string;
}

export interface InteractableInstance {
  id: string;
  interactableId: string;
  name: string;
  kind: InteractableKind;
  position: GridPosition;
  stateId: string;
  blocksMovement: boolean;
  blocksLineOfSight: boolean;
}

export interface InteractableInteractionRequest {
  id: string;
  heroId: string;
  interactableInstanceId: string;
  interactionId: string;
}

export type InteractableRejectionReason =
  | "duplicate-request"
  | "terminal-room"
  | "not-heroes-turn"
  | "hero-not-found"
  | "not-active-hero"
  | "no-actions"
  | "interactable-not-found"
  | "definition-not-found"
  | "interaction-not-found"
  | "invalid-state"
  | "out-of-range"
  | "destination-occupied"
  | "movement-blocked";

export interface InteractableInteractionRejection {
  requestId: string;
  reason: InteractableRejectionReason;
  details: string[];
}

export interface SpawnPoint {
  id: string;
  position: GridPosition;
  tags: string[];
  enabled: boolean;
}

export type SpawnSourceType =
  "scenario" | "brouhaha" | "interactable" | "boss" | "generator" | "test";

export interface SpawnSource {
  type: SpawnSourceType;
  id: string;
}

export type SpawnFailureMode = "all-or-nothing" | "partial";

export interface SpawnRequest {
  id: string;
  source: SpawnSource;
  creatureId: string;
  quantity: number;
  candidateSpawnPointIds: string[];
  failureMode: SpawnFailureMode;
}

export type SpawnRejectionReason =
  | "duplicate-request"
  | "creature-not-found"
  | "invalid-quantity"
  | "terminal-room"
  | "not-enough-valid-points";

export interface SpawnRejection {
  requestId: string;
  creatureId: string;
  reason: SpawnRejectionReason;
  requested: number;
  available: number;
  details: string[];
}

export type BrouhahaEffectScope =
  { type: "universal" } | { type: "dungeon"; dungeonId: string };

export interface BrouhahaEffectDefinition {
  id: string;
  name: string;
  description: string;
  scope: BrouhahaEffectScope;
  minLevel: number;
  maxLevel: number;
}

export type BrouhahaSourceType =
  | "combat"
  | "object"
  | "explosion"
  | "door"
  | "ability"
  | "calm-turn"
  | "scenario"
  | "test";

export interface BrouhahaSource {
  type: BrouhahaSourceType;
  id: string;
}

export interface BrouhahaRequest {
  id: string;
  delta: number;
  source: BrouhahaSource;
  reason: string;
}

export interface BrouhahaHistoryEntry {
  id: string;
  requestId: string;
  sequence: number;
  previousLevel: number;
  level: number;
  requestedDelta: number;
  appliedDelta: number;
  source: BrouhahaSource;
  reason: string;
  effectIds: string[];
}

export interface BrouhahaState {
  level: number;
  processedRequestIds: string[];
  nextResolutionSequence: number;
  history: BrouhahaHistoryEntry[];
}

export type BrouhahaRejectionReason =
  | "duplicate-request"
  | "invalid-delta"
  | "terminal-room"
  | "no-level-change"
  | "insufficient-effects";

export interface BrouhahaRejection {
  requestId: string;
  reason: BrouhahaRejectionReason;
  previousLevel: number;
  requestedDelta: number;
  details: string[];
}

export interface RoomState {
  version: 5;
  scenarioId: string;
  width: number;
  height: number;
  obstacles: GridPosition[];
  interactables: InteractableInstance[];
  processedInteractableRequestIds: string[];
  nextInteractableInteractionSequence: number;
  nextChainReactionSequence: number;
  chainReactionHistory: ChainReactionHistoryEntry[];
  spawnPoints: SpawnPoint[];
  processedSpawnRequestIds: string[];
  nextEnemyInstanceSequence: number;
  brouhaha: BrouhahaState;
  heroes: HeroState[];
  enemies: EnemyState[];
  activeHeroId: string | null;
  phase: RoomPhase;
  turn: number;
}
