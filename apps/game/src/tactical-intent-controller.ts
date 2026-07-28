import type { TacticalRoomDefinition } from "@gargotte/content-schema";
import {
  attackTarget,
  endHeroActivation,
  endHeroesTurn,
  finishEnemyTurn,
  moveCombatant,
  selectHero,
  type BrouhahaEffectDefinition,
  type CreatureDefinition,
  type GridPosition,
  type InteractableDefinition,
  type RoomState,
  type TacticalResult,
} from "@gargotte/engine";
import {
  executeBrouhahaControl,
  type BrouhahaControlId,
} from "./brouhaha-controller";
import {
  availableInteractableActions,
  executeInteractableAction,
} from "./interactable-controller";
import { executeScriptedSpawn } from "./scripted-spawn-controller";
import type { TacticalActionHandlers } from "./tactical-actions";
import type { StatefulTacticalResult } from "./tactical-result-pipeline";

interface TacticalIntentControllerOptions {
  dungeonId: string;
  creatureDefinitions: readonly CreatureDefinition[];
  brouhahaEffects: readonly BrouhahaEffectDefinition[];
  interactableDefinitions: readonly InteractableDefinition[];
  getRoom(): RoomState | null;
  getRoomDefinition(): TacticalRoomDefinition | null;
  isDiagnosticMode(): boolean;
  applyResult(result: TacticalResult<StatefulTacticalResult>): void;
  applyStatefulResult(
    result: StatefulTacticalResult,
    unchangedText: string,
  ): void;
}

export class TacticalIntentController {
  constructor(private readonly options: TacticalIntentControllerOptions) {}

  get handlers(): TacticalActionHandlers {
    return {
      selectHero: this.handleHeroSelection,
      move: this.handleMove,
      attack: this.handleAttack,
      interact: this.handleInteractableAction,
      spawn: this.handleScriptedSpawn,
      brouhaha: this.handleBrouhahaControl,
    };
  }

  endActivation(): void {
    const room = this.options.getRoom();
    if (room?.activeHeroId)
      this.options.applyResult(endHeroActivation(room, room.activeHeroId));
  }

  finishHeroesTurn(): void {
    const room = this.options.getRoom();
    if (room) this.options.applyResult(endHeroesTurn(room));
  }

  resolveEnemyTurn(): void {
    const room = this.options.getRoom();
    if (room) this.options.applyResult(finishEnemyTurn(room));
  }

  readonly handleHeroSelection = (heroId: string): void => {
    const room = this.options.getRoom();
    if (room) this.options.applyResult(selectHero(room, heroId));
  };

  readonly handleMove = (position: GridPosition): void => {
    const room = this.options.getRoom();
    if (room?.activeHeroId)
      this.options.applyResult(
        moveCombatant(room, room.activeHeroId, position),
      );
  };

  readonly handleAttack = (enemyId: string): void => {
    const room = this.options.getRoom();
    if (room?.activeHeroId)
      this.options.applyResult(attackTarget(room, room.activeHeroId, enemyId));
  };

  readonly handleInteractableSelection = (instanceId: string): void => {
    const room = this.options.getRoom();
    if (!room) return;
    const action = availableInteractableActions(
      room,
      this.options.interactableDefinitions,
    ).find((candidate) => candidate.interactableInstanceId === instanceId);
    if (action)
      this.handleInteractableAction(instanceId, action.interactionId);
  };

  private readonly handleInteractableAction = (
    instanceId: string,
    interactionId: string,
  ): void => {
    const room = this.options.getRoom();
    const definition = this.options.getRoomDefinition();
    if (!room || !definition) return;
    this.options.applyStatefulResult(
      executeInteractableAction(
        room,
        this.options.interactableDefinitions,
        this.options.brouhahaEffects,
        definition.chainReactions,
        this.options.creatureDefinitions,
        definition.brouhahaReinforcements,
        this.options.dungeonId,
        instanceId,
        interactionId,
      ),
      "Interaction refusée",
    );
  };

  private readonly handleScriptedSpawn = (spawnId: string): void => {
    if (!this.options.isDiagnosticMode()) return;
    const room = this.options.getRoom();
    const scripted = this.options
      .getRoomDefinition()
      ?.scriptedSpawns.find((candidate) => candidate.id === spawnId);
    if (room && scripted)
      this.options.applyStatefulResult(
        executeScriptedSpawn(
          room,
          this.options.creatureDefinitions,
          scripted,
        ),
        "Apparition refusée",
      );
  };

  private readonly handleBrouhahaControl = (
    controlId: BrouhahaControlId,
  ): void => {
    if (!this.options.isDiagnosticMode()) return;
    const room = this.options.getRoom();
    const definition = this.options.getRoomDefinition();
    if (!room || !definition) return;
    this.options.applyStatefulResult(
      executeBrouhahaControl(
        room,
        this.options.brouhahaEffects,
        this.options.creatureDefinitions,
        definition.brouhahaReinforcements,
        this.options.dungeonId,
        controlId,
      ),
      "Brouhaha inchangé",
    );
  };
}
