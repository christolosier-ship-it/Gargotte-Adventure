import { BUILD_LABEL } from "@gargotte/common";
import type {
  DungeonDefinition,
  TacticalRoomDefinition,
} from "@gargotte/content-schema";
import {
  EventBus,
  attackTarget,
  createEvent,
  createInitialGameState,
  endHeroActivation,
  endHeroesTurn,
  finishEnemyTurn,
  moveCombatant,
  reduceGameState,
  selectHero,
  type BrouhahaEffectDefinition,
  type CreatureDefinition,
  type GameState,
  type GridPosition,
  type InteractableDefinition,
  type RoomState,
  type TacticalEvent,
} from "@gargotte/engine";
import type { TabletopRenderer } from "@gargotte/renderer";
import type { GameShell } from "@gargotte/ui";
import {
  executeBrouhahaControl,
  type BrouhahaControlId,
} from "./brouhaha-controller";
import { appendTacticalEvents, describeDomainEvent } from "./event-messages";
import { renderGameView } from "./game-view";
import { readSelectedHeroIds } from "./hero-selection";
import {
  availableInteractableActions,
  executeInteractableAction,
} from "./interactable-controller";
import {
  PersistenceController,
  type RestoredSession,
} from "./persistence-controller";
import { buildTacticalRoom } from "./room-builder";
import { executeScriptedSpawn } from "./scripted-spawn-controller";
interface GameControllerOptions {
  shell: GameShell;
  renderer: TabletopRenderer;
  dungeon: DungeonDefinition;
  roomDefinition: TacticalRoomDefinition;
  creatureDefinitions: CreatureDefinition[];
  brouhahaEffects: BrouhahaEffectDefinition[];
  interactableDefinitions: InteractableDefinition[];
  restored: RestoredSession;
}

interface StatefulTacticalResult {
  state: RoomState;
  events: TacticalEvent[];
}

export class GameController {
  private readonly shell: GameShell;
  private readonly renderer: TabletopRenderer;
  private readonly dungeon: DungeonDefinition;
  private readonly roomDefinition: TacticalRoomDefinition;
  private readonly creatureDefinitions: CreatureDefinition[];
  private readonly brouhahaEffects: BrouhahaEffectDefinition[];
  private readonly interactableDefinitions: InteractableDefinition[];
  private readonly events = new EventBus();
  private readonly persistence = new PersistenceController();
  private readonly defaultHeroId: string;
  private readonly validHeroIds: ReadonlySet<string>;
  private state: GameState;
  private room: RoomState | null;
  private selectedHeroIds: string[];
  private readonly roomWasRestored: boolean;

  constructor(options: GameControllerOptions) {
    this.shell = options.shell;
    this.renderer = options.renderer;
    this.dungeon = options.dungeon;
    this.roomDefinition = options.roomDefinition;
    this.creatureDefinitions = options.creatureDefinitions;
    this.brouhahaEffects = options.brouhahaEffects;
    this.interactableDefinitions = options.interactableDefinitions;
    const defaultHeroId = options.roomDefinition.heroes[0]?.id;
    if (!defaultHeroId)
      throw new Error("Aucun héros disponible dans le scénario.");
    this.defaultHeroId = defaultHeroId;
    this.validHeroIds = new Set(
      options.roomDefinition.heroes.map((hero) => hero.id),
    );
    this.state = options.restored.gameState ?? createInitialGameState(1);
    this.room = options.restored.room;
    this.selectedHeroIds = [...options.restored.selectedHeroIds];
    this.roomWasRestored = options.restored.roomWasRestored;

    if (this.room)
      this.state = {
        ...this.state,
        phase: "expedition",
        expeditionNumber: Math.max(1, this.state.expeditionNumber),
      };
    this.state = reduceGameState(this.state, createEvent("app/ready"));
    if (this.room) this.state = { ...this.state, phase: "expedition" };
  }

  start(): void {
    this.events.subscribe((event) => {
      this.state = reduceGameState(this.state, event);
      this.shell.appendEvent(describeDomainEvent(event));
      this.persist();
    });
    this.shell.heroPicker.addEventListener("change", () =>
      this.updateHeroSelection(),
    );
    this.shell.startButton.addEventListener("click", () => this.startRoom());
    this.shell.continueButton.addEventListener("click", () =>
      this.continueRoom(),
    );
    this.shell.rotateCameraButton.addEventListener("click", () =>
      this.rotateCamera(),
    );
    this.shell.endActivationButton.addEventListener("click", () =>
      this.endActivation(),
    );
    this.shell.endHeroesTurnButton.addEventListener("click", () =>
      this.finishHeroesTurn(),
    );
    this.shell.resolveEnemyTurnButton.addEventListener("click", () =>
      this.resolveEnemyTurn(),
    );

    this.renderer.onHeroSelected(this.handleHeroSelection);
    this.renderer.onCellSelected(this.handleMove);
    this.renderer.onEnemySelected(this.handleAttack);
    this.renderer.onInteractableSelected(this.handleInteractableSelection);

    this.shell.startButton.disabled = false;
    this.render(this.roomWasRestored ? "Salle restaurée" : "Prête");
    this.shell.appendEvent(`${this.dungeon.name} chargé · ${BUILD_LABEL}.`);
  }

  private render(saveText: string): void {
    renderGameView({
      shell: this.shell,
      renderer: this.renderer,
      state: this.state,
      room: this.room,
      selectedHeroIds: this.selectedHeroIds,
      saveText,
      brouhahaEffects: this.brouhahaEffects,
      interactableDefinitions: this.interactableDefinitions,
      roomDefinition: this.roomDefinition,
      handlers: {
        selectHero: this.handleHeroSelection,
        move: this.handleMove,
        attack: this.handleAttack,
        interact: this.handleInteractableAction,
        spawn: this.handleScriptedSpawn,
        brouhaha: this.handleBrouhahaControl,
      },
    });
  }

  private persist(): void {
    const state = this.state;
    const room = this.room;
    const selectedHeroIds = [...this.selectedHeroIds];
    void this.persistence
      .save(state, room, selectedHeroIds)
      .then(() => this.render("Enregistrée sur cet appareil"))
      .catch((error: unknown) => {
        console.error("[save] écriture locale échouée", error);
        this.shell.appendEvent("La sauvegarde locale a échoué.");
        this.render("Échec de sauvegarde");
      });
  }

  private updateHeroSelection(): void {
    this.selectedHeroIds = readSelectedHeroIds(
      this.shell.heroPicker,
      this.validHeroIds,
      this.defaultHeroId,
    );
  }

  private startRoom(): void {
    this.room = buildTacticalRoom(
      this.roomDefinition,
      this.creatureDefinitions,
      this.interactableDefinitions,
      this.selectedHeroIds,
    );
    const seed = 10_000 + this.state.expeditionNumber * 137 + 1;
    this.events.publish(createEvent("expedition/started", { seed }));
    this.render("Salle lancée");
  }

  private continueRoom(): void {
    if (!this.room) return;
    this.state = { ...this.state, phase: "expedition" };
    this.shell.appendEvent("Reprise de la salle sauvegardée.");
    this.render("Salle restaurée");
  }

  private rotateCamera(): void {
    if (!this.room) return;
    const rotation = this.renderer.rotateCamera();
    this.shell.cameraStatus.textContent = `Vue : ${rotation}°`;
    this.shell.appendEvent(`Caméra pivotée à ${rotation}°.`);
  }

  private endActivation(): void {
    if (!this.room?.activeHeroId) return;
    this.applyResult(endHeroActivation(this.room, this.room.activeHeroId));
  }

  private finishHeroesTurn(): void {
    if (this.room) this.applyResult(endHeroesTurn(this.room));
  }

  private resolveEnemyTurn(): void {
    if (this.room) this.applyResult(finishEnemyTurn(this.room));
  }

  private readonly handleHeroSelection = (heroId: string): void => {
    if (!this.room) return;
    this.applyResult(
      selectHero(this.room, heroId),
      `Héros sélectionné: ${heroId}.`,
    );
  };

  private readonly handleMove = (position: GridPosition): void => {
    if (!this.room?.activeHeroId) return;
    this.applyResult(
      moveCombatant(this.room, this.room.activeHeroId, position),
      "Déplacement.",
    );
  };

  private readonly handleAttack = (enemyId: string): void => {
    if (!this.room?.activeHeroId) return;
    this.applyResult(attackTarget(this.room, this.room.activeHeroId, enemyId));
  };

  private readonly handleInteractableSelection = (
    interactableInstanceId: string,
  ): void => {
    if (!this.room) return;
    const action = availableInteractableActions(
      this.room,
      this.interactableDefinitions,
    ).find(
      (candidate) =>
        candidate.interactableInstanceId === interactableInstanceId,
    );
    if (action)
      this.handleInteractableAction(
        action.interactableInstanceId,
        action.interactionId,
      );
  };

  private readonly handleInteractableAction = (
    interactableInstanceId: string,
    interactionId: string,
  ): void => {
    if (!this.room) return;
    this.applyStatefulResult(
      executeInteractableAction(
        this.room,
        this.interactableDefinitions,
        this.brouhahaEffects,
        this.roomDefinition.chainReactions,
        this.dungeon.id,
        interactableInstanceId,
        interactionId,
      ),
      "Interaction refusée",
    );
  };

  private readonly handleScriptedSpawn = (spawnId: string): void => {
    if (!this.room) return;
    const scripted = this.roomDefinition.scriptedSpawns.find(
      (candidate) => candidate.id === spawnId,
    );
    if (!scripted) return;
    this.applyStatefulResult(
      executeScriptedSpawn(this.room, this.creatureDefinitions, scripted),
      "Apparition refusée",
    );
  };

  private readonly handleBrouhahaControl = (
    controlId: BrouhahaControlId,
  ): void => {
    if (!this.room) return;
    this.applyStatefulResult(
      executeBrouhahaControl(
        this.room,
        this.brouhahaEffects,
        this.dungeon.id,
        controlId,
      ),
      "Brouhaha inchangé",
    );
  };

  private applyStatefulResult(
    result: StatefulTacticalResult,
    unchangedText: string,
  ): void {
    const changed = result.state !== this.room;
    this.room = result.state;
    this.writeEvents(result.events);
    if (changed) this.persist();
    else this.render(unchangedText);
  }

  private applyResult(
    result:
      | ReturnType<typeof selectHero>
      | ReturnType<typeof moveCombatant>
      | ReturnType<typeof attackTarget>
      | ReturnType<typeof endHeroActivation>
      | ReturnType<typeof endHeroesTurn>
      | ReturnType<typeof finishEnemyTurn>,
    successMessage?: string,
  ): void {
    if (!result.ok) {
      this.shell.appendEvent(result.error.message);
      return;
    }
    this.room = result.value.state;
    if (successMessage) this.shell.appendEvent(successMessage);
    else this.writeEvents(result.value.events);
    this.persist();
  }

  private writeEvents(events: readonly TacticalEvent[]): void {
    appendTacticalEvents(
      (message) => this.shell.appendEvent(message),
      events,
      this.creatureDefinitions,
      this.interactableDefinitions,
    );
  }
}
