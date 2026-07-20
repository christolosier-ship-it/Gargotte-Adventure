import type { Combatant, HeroState, RoomState } from "./types";
export const HERO_ACTIONS = 3;
export function createRoomState(input: {
  scenarioId: string;
  width: number;
  height: number;
  obstacles: { column: number; row: number }[];
  heroes: Omit<
    HeroState,
    | "kind"
    | "alive"
    | "blocksMovement"
    | "actionsRemaining"
    | "activationCompleted"
  >[];
  enemies: Omit<Combatant, "kind" | "alive" | "blocksMovement">[];
}): RoomState {
  return {
    version: 1,
    scenarioId: input.scenarioId,
    width: input.width,
    height: input.height,
    obstacles: input.obstacles,
    heroes: input.heroes.map((h) => ({
      ...h,
      kind: "hero",
      alive: h.hp > 0,
      blocksMovement: true,
      actionsRemaining: HERO_ACTIONS,
      activationCompleted: false,
    })),
    enemies: input.enemies.map((e) => ({
      ...e,
      kind: "enemy",
      alive: e.hp > 0,
      blocksMovement: true,
    })),
    activeHeroId: null,
    phase: "heroes-turn",
    turn: 1,
  };
}
export function withTerminalPhase(state: RoomState): RoomState {
  if (state.enemies.every((e) => !e.alive))
    return { ...state, phase: "victory", activeHeroId: null };
  if (state.heroes.every((h) => !h.alive))
    return { ...state, phase: "defeat", activeHeroId: null };
  return state;
}
export function restoreHeroActions(state: RoomState): RoomState {
  return {
    ...state,
    heroes: state.heroes.map((h) =>
      h.alive
        ? { ...h, actionsRemaining: HERO_ACTIONS, activationCompleted: false }
        : h,
    ),
    activeHeroId: null,
  };
}
