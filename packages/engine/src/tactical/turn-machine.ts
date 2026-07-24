import { err, ok, type TacticalResult } from "./errors";
import type { TacticalEvent } from "./events";
import { createEnemyTurnRoster, runEnemyTurn } from "./enemy-ai";
import { restoreHeroActions, withTerminalPhase } from "./room-state";
import type { RoomState } from "./types";

export function selectHero(
  state: RoomState,
  heroId: string,
): TacticalResult<{ state: RoomState; events: TacticalEvent[] }> {
  if (state.phase !== "heroes-turn")
    return err("invalid-phase", "La salle est terminée ou au tour ennemi.");
  const hero = state.heroes.find(
    (candidate) => candidate.id === heroId && candidate.alive,
  );
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

  let next: RoomState = {
    ...state,
    activeHeroId: null,
    heroes: state.heroes.map((hero) =>
      hero.id === heroId
        ? { ...hero, actionsRemaining: 0, activationCompleted: true }
        : hero,
    ),
  };
  const events: TacticalEvent[] = [{ type: "activation-ended", heroId }];

  if (
    next.heroes
      .filter((hero) => hero.alive)
      .every((hero) => hero.activationCompleted)
  ) {
    next = openEnemyTurn(next);
    if (next.phase === "enemy-turn")
      events.push({
        type: "phase-changed",
        phase: "enemy-turn",
        turn: next.turn,
      });
  }

  return ok({ state: withTerminalPhase(next), events });
}

export function endHeroesTurn(
  state: RoomState,
): TacticalResult<{ state: RoomState; events: TacticalEvent[] }> {
  if (state.phase !== "heroes-turn")
    return err("not-heroes-turn", "Ce n'est pas le tour des héros.");

  const events: TacticalEvent[] = [];
  const heroes = state.heroes.map((hero) => {
    if (!hero.alive || hero.activationCompleted) return hero;
    events.push({ type: "activation-ended", heroId: hero.id });
    return { ...hero, actionsRemaining: 0, activationCompleted: true };
  });
  const next = openEnemyTurn({
    ...state,
    heroes,
    activeHeroId: null,
  });
  if (next.phase === "enemy-turn")
    events.push({
      type: "phase-changed",
      phase: "enemy-turn",
      turn: next.turn,
    });

  return ok({ state: next, events });
}

export function finishEnemyTurn(
  state: RoomState,
): TacticalResult<{ state: RoomState; events: TacticalEvent[] }> {
  if (state.phase !== "enemy-turn")
    return err(
      "not-enemy-turn",
      "Le tour ennemi ne peut être résolu qu'en phase enemy-turn.",
    );

  const ran = runEnemyTurn(state, state.enemyTurnRoster);
  const terminal = withTerminalPhase(ran.state);
  if (terminal.phase !== "enemy-turn")
    return ok({ state: terminal, events: ran.events });

  const restored = {
    ...restoreHeroActions(terminal),
    phase: "heroes-turn" as const,
    turn: terminal.turn + 1,
  };
  return ok({
    state: restored,
    events: [
      ...ran.events,
      { type: "phase-changed", phase: "heroes-turn", turn: restored.turn },
    ],
  });
}

function openEnemyTurn(state: RoomState): RoomState {
  return withTerminalPhase({
    ...state,
    phase: "enemy-turn",
    enemyTurnRoster: createEnemyTurnRoster(state),
  });
}
