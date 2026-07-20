import { err, ok, type TacticalResult } from "./errors";
import type { TacticalEvent } from "./events";
import { manhattanDistance } from "./grid";
import { hasLineOfSight } from "./line-of-sight";
import { withTerminalPhase } from "./room-state";
import type { Combatant, RoomState } from "./types";

export const calculateDamage = (
  attacker: Combatant,
  target: Combatant,
): number => Math.max(1, attacker.atk - target.def);

export function canAttackTarget(
  state: RoomState,
  attacker: Combatant,
  target: Combatant,
): boolean {
  return (
    attacker.alive &&
    target.alive &&
    manhattanDistance(attacker.position, target.position) <= attacker.range &&
    hasLineOfSight(state, attacker.position, target.position, [
      attacker.id,
      target.id,
    ])
  );
}

export function getAttackableTargets(
  state: RoomState,
  heroId: string,
): string[] {
  const hero = state.heroes.find((candidate) => candidate.id === heroId);
  if (
    state.phase !== "heroes-turn" ||
    !hero?.alive ||
    state.activeHeroId !== heroId ||
    hero.actionsRemaining <= 0
  ) {
    return [];
  }

  return state.enemies
    .filter((enemy) => canAttackTarget(state, hero, enemy))
    .map((enemy) => enemy.id)
    .sort((a, b) => a.localeCompare(b));
}

export function attackTarget(
  state: RoomState,
  attackerId: string,
  targetId: string,
): TacticalResult<{ state: RoomState; events: TacticalEvent[] }> {
  if (state.phase !== "heroes-turn")
    return err("not-heroes-turn", "Ce n'est pas le tour des héros.");
  const attacker = state.heroes.find((hero) => hero.id === attackerId);
  if (!attacker?.alive) return err("hero-not-found", "Héros introuvable.");
  if (state.activeHeroId !== attackerId)
    return err("not-active-hero", "Seul le héros actif peut attaquer.");
  if (attacker.actionsRemaining <= 0)
    return err("no-actions", "Aucune action restante.");
  const target = state.enemies.find((enemy) => enemy.id === targetId);
  if (!target?.alive) return err("target-invalid", "Cible invalide.");
  if (manhattanDistance(attacker.position, target.position) > attacker.range)
    return err("out-of-range", "Cible hors portée.");
  if (
    !hasLineOfSight(state, attacker.position, target.position, [
      attacker.id,
      target.id,
    ])
  )
    return err("line-of-sight-blocked", "Ligne de vue bloquée.");

  const damage = calculateDamage(attacker, target);
  const hp = Math.max(0, target.hp - damage);
  const defeated = hp === 0;
  const events: TacticalEvent[] = [
    {
      type: "combatant-attacked",
      attackerId,
      targetId,
      damage,
      remainingHp: hp,
    },
  ];
  if (defeated)
    events.push({ type: "combatant-defeated", combatantId: targetId });

  const next = withTerminalPhase({
    ...state,
    heroes: state.heroes.map((hero) =>
      hero.id === attackerId
        ? { ...hero, actionsRemaining: hero.actionsRemaining - 1 }
        : hero,
    ),
    enemies: state.enemies.map((enemy) =>
      enemy.id === targetId
        ? {
            ...enemy,
            hp,
            alive: !defeated,
            blocksMovement: defeated ? false : enemy.blocksMovement,
          }
        : enemy,
    ),
  });

  return ok({ state: next, events });
}

export function enemyAttack(
  state: RoomState,
  enemyId: string,
  heroId: string,
): { state: RoomState; events: TacticalEvent[] } | null {
  const attacker = state.enemies.find(
    (enemy) => enemy.id === enemyId && enemy.alive,
  );
  const target = state.heroes.find((hero) => hero.id === heroId && hero.alive);
  if (!attacker || !target || !canAttackTarget(state, attacker, target))
    return null;

  const damage = calculateDamage(attacker, target);
  const hp = Math.max(0, target.hp - damage);
  const defeated = hp === 0;
  const events: TacticalEvent[] = [
    {
      type: "combatant-attacked",
      attackerId: enemyId,
      targetId: heroId,
      damage,
      remainingHp: hp,
    },
  ];
  if (defeated)
    events.push({ type: "combatant-defeated", combatantId: heroId });

  return {
    state: withTerminalPhase({
      ...state,
      heroes: state.heroes.map((hero) =>
        hero.id === heroId
          ? {
              ...hero,
              hp,
              alive: !defeated,
              blocksMovement: defeated ? false : hero.blocksMovement,
            }
          : hero,
      ),
    }),
    events,
  };
}
