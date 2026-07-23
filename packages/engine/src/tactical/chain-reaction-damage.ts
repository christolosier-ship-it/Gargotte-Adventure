import type { ChainReactionActionResolution } from "./chain-reaction-types";
import { manhattanDistance } from "./grid";
import { withTerminalPhase } from "./room-state";
import type { Combatant, RoomState } from "./types";

export function resolveChainReactionDamage(
  state: RoomState,
  action: {
    type: "damage";
    centerInstanceId: string;
    radius: number;
    amount: number;
  },
  reactionId: string,
): ChainReactionActionResolution {
  const center = state.interactables.find(
    (candidate) => candidate.id === action.centerInstanceId,
  );
  if (!center)
    return {
      state,
      events: [
        {
          type: "chain-reaction-action-skipped",
          reactionId,
          actionType: action.type,
          targetId: action.centerInstanceId,
          details: ["Centre de dégâts absent."],
        },
      ],
      triggers: [],
      outcome: "skipped",
      targetId: action.centerInstanceId,
      details: ["Centre de dégâts absent."],
    };

  const targets = [...state.heroes, ...state.enemies]
    .filter(
      (combatant) =>
        combatant.alive &&
        manhattanDistance(combatant.position, center.position) <= action.radius,
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  const hpById = new Map(
    targets.map((target) => [
      target.id,
      Math.max(0, target.hp - action.amount),
    ]),
  );
  const updateCombatant = <T extends Combatant>(combatant: T): T => {
    const hp = hpById.get(combatant.id);
    if (hp === undefined) return combatant;
    return {
      ...combatant,
      hp,
      alive: hp > 0,
      blocksMovement: hp > 0 ? combatant.blocksMovement : false,
    };
  };
  const nextState = withTerminalPhase({
    ...state,
    heroes: state.heroes.map(updateCombatant),
    enemies: state.enemies.map(updateCombatant),
  });
  const events = targets.flatMap((target) => {
    const hp = hpById.get(target.id)!;
    return [
      {
        type: "chain-reaction-damage-applied" as const,
        reactionId,
        combatantId: target.id,
        damage: action.amount,
        remainingHp: hp,
        centerInstanceId: center.id,
      },
      ...(hp === 0
        ? [{ type: "combatant-defeated" as const, combatantId: target.id }]
        : []),
    ];
  });

  return {
    state: nextState,
    events,
    triggers: [],
    outcome: "applied",
    targetId: center.id,
    details: [`${targets.length} combattant(s) touché(s).`],
  };
}
