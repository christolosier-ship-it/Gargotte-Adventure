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
} from "@gargotte/engine";
import type { TabletopRenderer } from "@gargotte/renderer";
import type { GameShell } from "@gargotte/ui";
import {
  executeBrouhahaControl,
  type BrouhahaControlId,
} from "./brouhaha-controller";
import { describeDomainEvent } from "./event-messages";
import type { GameControllerOptions } from "./game-controller-options";
import { renderGameView } from "./game-view";
import { readSelectedHeroIds } from "./hero-selection";
import {
  availableInteractableActions,
  executeInteractableAction,
} from "./interactable-controller";
import { PersistenceController } from "./persistence-controller";
import { PresentationController } from "./presentation-controller";
import { buildTacticalRoom } from "./room-builder";
import { executeScriptedSpawn } from "./scripted-spawn-controller";
import {
  runTacticalResultPipeline,
  type StatefulTacticalResult,
} from "./tactical-result-pipeline";

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
  private readonly presentation: PresentationController;
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
    this.presentation = new PresentationController({
      shell: this.shell,
      renderer: this.renderer,
      creatureDefinitions: this.creatureDefinitions,
      interactableDefinitions: this.interactableDefinitions,
    });
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
    this.presentation.start();
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
      audioSettings: this.presentation.audioSettings,
      reducedMotion: this.presentation.reducedMotion,
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
    this.shell.setSaveStatus("Enregistrement…");
    void this.persistence
      .save(state, room, selectedHeroIds)
      .then(() => this.shell.setSaveStatus("Enregistrée sur cet appareil"))
      .catch((error: unknown) => {
        console.error("[save] écriture locale échouée", error);
        this.shell.appendEvent("La sauvegarde locale a échoué.");
        this.shell.setSaveStatus("Échec de sauvegarde");
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
    this.presentation.clear();
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
    this.presentation.clear();
    this.state = { ...this.state, phase: "expedition" };
    this.shell.appendEvent("Reprise de la salle sauvegardée, sans replay.");
    this.render("Salle restaurée");
  }

  private rotateCamera(): void {
    if (!this.room) return;
    this.presentation.clear();
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
    this.applyResult(selectHero(this.room, heroId));
  };

  private readonly handleMove = (position: GridPosition): void => {
    if (!this.room?.activeHeroId) return;
    this.applyResult(moveCombatant(this.room, this.room.activeHeroId, position));
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
        this.creatureDefinitions,
        this.roomDefinition.brouhahaReinforcements,
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
        this.creatureDefinitions,
        this.roomDefinition.brouhahaReinforcements,
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
    const previousRoom = this.room;
    const changed = result.state !== previousRoom;
    this.room = result.state;
    runTacticalResultPipeline({
      previousRoom,
      nextRoom: result.state,
      events: result.events,
      render: () => this.render(changed ? "Enregistrement…" : unchangedText),
      present: (events) => this.presentation.present(events),
      persist: changed ? () => this.persist() : undefined,
    });
  }

  private applyResult(
    result:
      | ReturnType<typeof selectHero>
      | ReturnType<typeof moveCombatant>
      | ReturnType<typeof attackTarget>
      | ReturnType<typeof endHeroActivation>
      | ReturnType<typeof endHeroesTurn>
      | ReturnType<typeof finishEnemyTurn>,
  ): void {
    if (!result.ok) {
      this.shell.appendEvent(result.error.message);
      return;
    }
    const previousRoom = this.room;
    this.room = result.value.state;
    runTacticalResultPipeline({
      previousRoom,
      nextRoom: result.value.state,
      events: result.value.events,
      render: () => this.render("Enregistrement…"),
      present: (events) => this.presentation.present(events),
      persist: () => this.persist(),
    });
  }
}
