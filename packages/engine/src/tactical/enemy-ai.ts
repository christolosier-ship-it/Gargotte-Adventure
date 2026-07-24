import { canAttackTarget, enemyAttack } from "./combat";
import { comparePositions, isBlocked } from "./grid";
import { hasLineOfSight } from "./line-of-sight";
import { shortestPath } from "./movement";
import type { EnemyDecisionExplanation, TacticalEvent } from "./events";
import type { GridPosition, RoomState } from "./types";

export function createEnemyTurnRoster(state: RoomState): string[] {
  return state.enemies
    .filter((candidate) => candidate.alive)
    .map((enemy) => enemy.id)
    .sort((a, b) => a.localeCompare(b));
}

export function runEnemyTurn(
  state: RoomState,
  roster: readonly string[] = createEnemyTurnRoster(state),
): {
  state: RoomState;
  events: TacticalEvent[];
} {
  let next = state;
  const events: TacticalEvent[] = [];

  for (const enemyId of roster) {
    if (next.phase === "victory" || next.phase === "defeat") break;
    const enemy = next.enemies.find(
      (candidate) => candidate.id === enemyId && candidate.alive,
    );
    if (!enemy) continue;

    const decision = chooseEnemyDecision(next, enemy.id);
    events.push({
      type: "enemy-decision",
      enemyId: enemy.id,
      explanation: decision,
    });

    if (decision.action === "attack" && decision.targetId) {
      const hit = enemyAttack(next, enemy.id, decision.targetId);
      if (hit) {
        next = hit.state;
        events.push(...hit.events);
      }
      continue;
    }

    if (decision.action !== "move" || !decision.path[0]) continue;

    const current = next.enemies.find((candidate) => candidate.id === enemy.id);
    if (!current) continue;
    const destination = decision.path[0];
    next = {
      ...next,
      enemies: next.enemies.map((candidate) =>
        candidate.id === enemy.id
          ? { ...candidate, position: destination }
          : candidate,
      ),
    };
    events.push({
      type: "combatant-moved",
      combatantId: enemy.id,
      from: current.position,
      to: destination,
      actionCost: 1,
    });

    const afterMove = chooseEnemyDecision(next, enemy.id);
    if (afterMove.action === "attack" && afterMove.targetId) {
      const hit = enemyAttack(next, enemy.id, afterMove.targetId);
      if (hit) {
        next = hit.state;
        events.push(...hit.events);
      }
    }
  }

  return { state: next, events };
}

export function chooseEnemyDecision(
  state: RoomState,
  enemyId: string,
): EnemyDecisionExplanation {
  const enemy = state.enemies.find((candidate) => candidate.id === enemyId);
  const heroes = state.heroes
    .filter((hero) => hero.alive)
    .sort((a, b) => a.id.localeCompare(b.id));

  if (!enemy || heroes.length === 0) {
    return {
      enemyId,
      targetId: null,
      action: "wait",
      reason: "aucune cible",
      path: [],
    };
  }

  const immediateTarget = heroes.find((hero) =>
    canAttackTarget(state, enemy, hero),
  );
  if (immediateTarget) {
    return {
      enemyId,
      targetId: immediateTarget.id,
      action: "attack",
      reason: "cible visible en portée",
      path: [],
    };
  }

  const plans: {
    targetId: string;
    cell: GridPosition;
    path: GridPosition[];
  }[] = [];

  for (const hero of heroes) {
    for (let column = 0; column < state.width; column += 1) {
      for (let row = 0; row < state.height; row += 1) {
        const cell = { column, row };
        if (isBlocked(state, cell, enemy.id)) continue;
        if (
          Math.abs(cell.column - hero.position.column) +
            Math.abs(cell.row - hero.position.row) >
          enemy.range
        )
          continue;
        if (!hasLineOfSight(state, cell, hero.position, [enemy.id, hero.id]))
          continue;

        const path = shortestPath(state, enemy.position, cell, enemy.id);
        if (path && path.length > 0)
          plans.push({ targetId: hero.id, cell, path });
      }
    }
  }

  plans.sort(
    (a, b) =>
      a.path.length - b.path.length ||
      a.targetId.localeCompare(b.targetId) ||
      comparePositions(a.cell, b.cell),
  );

  const plan = plans[0];
  if (!plan) {
    return {
      enemyId,
      targetId: null,
      action: "wait",
      reason: "cible inaccessible",
      path: [],
    };
  }

  return {
    enemyId,
    targetId: plan.targetId,
    action: "move",
    reason: "avance vers une case d'attaque visible et libre",
    path: plan.path,
  };
}
