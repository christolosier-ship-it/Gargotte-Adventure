import { err, ok, type TacticalResult } from "./errors";
import type { TacticalEvent } from "./events";
import type { RoomState } from "./types";
import { runEnemyTurn } from "./enemy-ai";
import { restoreHeroActions, withTerminalPhase } from "./room-state";
export function selectHero(
  state: RoomState,
  heroId: string,
): TacticalResult<{ state: RoomState; events: TacticalEvent[] }> {
  if (state.phase !== "heroes-turn")
    return err("invalid-phase", "La salle est terminée ou au tour ennemi.");
  const hero = state.heroes.find((h) => h.id === heroId && h.alive);
  if (!hero) return err("hero-not-found", "Héros introuvable.");
  if (state.activeHeroId && state.activeHeroId !== heroId)
    return err(
      "not-active-hero",
      "Terminez l'activation en cours avant de changer.",
    );
  if (hero.activationCompleted)
    return err("hero-completed", "Ce héros a déjà terminé.");
  return ok({
    state: { ...state, activeHeroId: heroId },
    events: [{ type: "hero-selected", heroId }],
  });
}
export function endHeroActivation(
  state: RoomState,
  heroId: string,
): TacticalResult<{ state: RoomState; events: TacticalEvent[] }> {
  if (state.phase !== "heroes-turn")
    return err("invalid-phase", "Phase invalide.");
  if (state.activeHeroId !== heroId)
    return err("not-active-hero", "Seul le héros actif peut terminer.");
  let next = {
    ...state,
    activeHeroId: null,
    heroes: state.heroes.map((h) =>
      h.id === heroId
        ? { ...h, actionsRemaining: 0, activationCompleted: true }
        : h,
    ),
  };
  const events: TacticalEvent[] = [{ type: "activation-ended", heroId }];
  if (next.heroes.filter((h) => h.alive).every((h) => h.activationCompleted)) {
    next = { ...next, phase: "enemy-turn" };
    events.push({
      type: "phase-changed",
      phase: "enemy-turn",
      turn: next.turn,
    });
  }
  return ok({ state: withTerminalPhase(next), events });
}
export function finishEnemyTurn(state: RoomState): {
  state: RoomState;
  events: TacticalEvent[];
} {
  const ran = runEnemyTurn({ ...state, phase: "enemy-turn" });
  const terminal = withTerminalPhase(ran.state);
  if (terminal.phase !== "enemy-turn")
    return { state: terminal, events: ran.events };
  const restored = {
    ...restoreHeroActions(terminal),
    phase: "heroes-turn" as const,
    turn: terminal.turn + 1,
  };
  return {
    state: restored,
    events: [
      ...ran.events,
      { type: "phase-changed", phase: "heroes-turn", turn: restored.turn },
    ],
  };
}
