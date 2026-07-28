import { BUILD_LABEL } from "@gargotte/common";
import {
  attackTarget,
  createEvent,
  createInitialGameState,
  endHeroActivation,
  endHeroesTurn,
  finishEnemyTurn,
  moveCombatant,
  reduceGameState,
  selectHero,
  type ExpeditionState,
  type GameState,
  type GridPosition,
  type RoomState,
  type TacticalResult,
} from "@gargotte/engine";
import type { TabletopRenderer } from "@gargotte/renderer";
import type { GameShell } from "@gargotte/ui";
import {
  executeBrouhahaControl,
  type BrouhahaControlId,
} from "./brouhaha-controller";
import { describeDomainEvent } from "./event-messages";
import { ExpeditionSession } from "./expedition-session";
import type { GameControllerOptions } from "./game-controller-options";
import { renderGameView } from "./game-view";
import { readSelectedHeroIds } from "./hero-selection";
import {
  availableInteractableActions,
  executeInteractableAction,
} from "./interactable-controller";
import { PersistenceController } from "./persistence-controller";
import { PresentationController } from "./presentation-controller";
import { executeScriptedSpawn } from "./scripted-spawn-controller";
import {
  runTacticalResultPipeline,
  type StatefulTacticalResult,
} from "./tactical-result-pipeline";

export class GameController {
  private readonly shell: GameShell;
  private readonly renderer: TabletopRenderer;
  private readonly options: GameControllerOptions;
  private readonly persistence = new PersistenceController();
  private readonly presentation: PresentationController;
  private readonly session: ExpeditionSession;
  private readonly defaultHeroId: string;
  private readonly validHeroIds: ReadonlySet<string>;
  private state: GameState;
  private selectedHeroIds: string[];
  private awaitingResume: boolean;
  private diagnosticMode: boolean;
  private readonly migratedLegacyRoom: boolean;

  constructor(options: GameControllerOptions) {
    this.options = options;
    this.shell = options.shell;
    this.renderer = options.renderer;
    this.presentation = new PresentationController({
      shell: this.shell,
      renderer: this.renderer,
      creatureDefinitions: options.creatureDefinitions,
      interactableDefinitions: options.interactableDefinitions,
    });
    this.session = new ExpeditionSession({
      definition: options.expeditionDefinition,
      roomDefinitions: options.roomDefinitions,
      creatureDefinitions: options.creatureDefinitions,
      interactableDefinitions: options.interactableDefinitions,
      restored: options.restored.expedition,
    });
    const defaultHeroId = options.roomDefinitions[0]?.heroes[0]?.id;
    if (!defaultHeroId)
      throw new Error("Aucun héros disponible dans le micro-donjon.");
    this.defaultHeroId = defaultHeroId;
    this.validHeroIds = new Set(
      options.roomDefinitions[0]!.heroes.map((hero) => hero.id),
    );
    this.state = reduceGameState(
      options.restored.gameState ?? createInitialGameState(1),
      createEvent("app/ready"),
    );
    if (this.session.expedition)
      this.state = { ...this.state, phase: "expedition" };
    this.selectedHeroIds = [...options.restored.selectedHeroIds];
    this.awaitingResume = options.restored.expeditionWasRestored;
    this.diagnosticMode = options.restored.diagnosticMode;
    this.migratedLegacyRoom = options.restored.migratedLegacyRoom;
  }

  start(): void {
    this.presentation.start();
    this.shell.heroPicker.addEventListener("change", () =>
      this.updateHeroSelection(),
    );
    this.shell.startButton.addEventListener("click", () =>
      this.startExpedition(),
    );
    this.shell.continueButton.addEventListener("click", () =>
      this.continueExpedition(),
    );
    this.shell.nextRoomButton.addEventListener("click", () =>
      this.enterNextRoom(),
    );
    this.shell.replayButton.addEventListener("click", () =>
      this.replayExpedition(),
    );
    this.shell.diagnosticToggleButton.addEventListener("click", () =>
      this.toggleDiagnosticMode(),
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
    this.render(this.awaitingResume ? "Expédition sauvegardée" : "Prête");
    this.shell.appendEvent(
      `${this.options.dungeon.name} chargé · ${BUILD_LABEL}.`,
    );
    if (this.migratedLegacyRoom)
      this.shell.appendEvent(
        "Ancienne salle migrée vers la première étape du micro-donjon, sans replay.",
      );
  }

  private render(saveText: string): void {
    renderGameView({
      shell: this.shell,
      renderer: this.renderer,
      state: this.state,
      expeditionDefinition: this.options.expeditionDefinition,
      expedition: this.session.expedition,
      room: this.session.room,
      roomDefinition: this.session.roomDefinition,
      roomMetadata: this.session.roomMetadata,
      connection: this.session.connection,
      awaitingResume: this.awaitingResume,
      diagnosticMode: this.diagnosticMode,
      selectedHeroIds: this.selectedHeroIds,
      saveText,
      audioSettings: this.presentation.audioSettings,
      reducedMotion: this.presentation.reducedMotion,
      brouhahaEffects: this.options.brouhahaEffects,
      interactableDefinitions: this.options.interactableDefinitions,
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
    const expedition = this.session.expedition;
    this.shell.setSaveStatus("Enregistrement…");
    void this.persistence
      .save(state, expedition, this.diagnosticMode)
      .then(() => this.shell.setSaveStatus("Enregistrée sur cet appareil"))
      .catch((error: unknown) => {
        console.error("[save] écriture locale échouée", error);
        this.shell.appendEvent("La sauvegarde locale a échoué.");
        this.shell.setSaveStatus("Échec de sauvegarde");
      });
  }

  private updateHeroSelection(): void {
    if (this.session.expedition) return;
    this.selectedHeroIds = readSelectedHeroIds(
      this.shell.heroPicker,
      this.validHeroIds,
      this.defaultHeroId,
    );
  }

  private startExpedition(): void {
    this.presentation.clear();
    this.updateHeroSelection();
    const expeditionNumber = this.state.expeditionNumber + 1;
    const built = this.session.start(
      `${this.options.expeditionDefinition.id}-${expeditionNumber}`,
      this.selectedHeroIds,
    );
    const seed = 10_000 + expeditionNumber * 137 + 1;
    const event = createEvent("expedition/started", { seed });
    this.state = reduceGameState(this.state, event);
    this.awaitingResume = false;
    this.shell.appendEvent(describeDomainEvent(event));
    this.shell.appendEvent(this.session.roomMetadata?.introduction ?? "");
    this.render("Enregistrement…");
    this.presentation.present(built.events);
    this.persist();
  }

  private continueExpedition(): void {
    if (!this.session.expedition || !this.session.room) return;
    this.presentation.clear();
    this.awaitingResume = false;
    this.state = { ...this.state, phase: "expedition" };
    this.shell.appendEvent("Reprise de l’expédition sauvegardée, sans replay.");
    this.render("Expédition restaurée");
  }

  private enterNextRoom(): void {
    if (this.awaitingResume || !this.session.canTransition) return;
    const built = this.session.transition();
    this.presentation.clear();
    this.shell.appendEvent(this.session.roomMetadata?.introduction ?? "");
    this.render("Enregistrement…");
    this.presentation.present(built.events);
    this.persist();
  }

  private replayExpedition(): void {
    if (!this.session.expedition?.result) return;
    this.selectedHeroIds = [...this.session.expedition.selectedHeroIds];
    this.startExpedition();
  }

  private toggleDiagnosticMode(): void {
    this.diagnosticMode = !this.diagnosticMode;
    this.shell.appendEvent(
      this.diagnosticMode
        ? "Mode diagnostic activé. Les commandes techniques sont visibles."
        : "Mode diagnostic désactivé. Retour au parcours joueur.",
    );
    this.render("Enregistrement…");
    this.persist();
  }

  private rotateCamera(): void {
    if (!this.session.room || this.awaitingResume) return;
    this.presentation.clear();
    const rotation = this.renderer.rotateCamera();
    this.shell.cameraStatus.textContent = `Vue : ${rotation}°`;
    this.shell.appendEvent(`Caméra pivotée à ${rotation}°.`);
  }

  private endActivation(): void {
    const room = this.activeRoom();
    if (room?.activeHeroId)
      this.applyResult(endHeroActivation(room, room.activeHeroId));
  }

  private finishHeroesTurn(): void {
    const room = this.activeRoom();
    if (room) this.applyResult(endHeroesTurn(room));
  }

  private resolveEnemyTurn(): void {
    const room = this.activeRoom();
    if (room) this.applyResult(finishEnemyTurn(room));
  }

  private activeRoom(): RoomState | null {
    return this.awaitingResume || this.session.expedition?.status !== "in-progress"
      ? null
      : this.session.room;
  }

  private readonly handleHeroSelection = (heroId: string): void => {
    const room = this.activeRoom();
    if (room) this.applyResult(selectHero(room, heroId));
  };

  private readonly handleMove = (position: GridPosition): void => {
    const room = this.activeRoom();
    if (room?.activeHeroId)
      this.applyResult(moveCombatant(room, room.activeHeroId, position));
  };

  private readonly handleAttack = (enemyId: string): void => {
    const room = this.activeRoom();
    if (room?.activeHeroId)
      this.applyResult(attackTarget(room, room.activeHeroId, enemyId));
  };

  private readonly handleInteractableSelection = (instanceId: string): void => {
    const room = this.activeRoom();
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
    const room = this.activeRoom();
    const definition = this.session.roomDefinition;
    if (!room || !definition) return;
    this.applyStatefulResult(
      executeInteractableAction(
        room,
        this.options.interactableDefinitions,
        this.options.brouhahaEffects,
        definition.chainReactions,
        this.options.creatureDefinitions,
        definition.brouhahaReinforcements,
        this.options.dungeon.id,
        instanceId,
        interactionId,
      ),
      "Interaction refusée",
    );
  };

  private readonly handleScriptedSpawn = (spawnId: string): void => {
    if (!this.diagnosticMode) return;
    const room = this.activeRoom();
    const scripted = this.session.roomDefinition?.scriptedSpawns.find(
      (candidate) => candidate.id === spawnId,
    );
    if (room && scripted)
      this.applyStatefulResult(
        executeScriptedSpawn(room, this.options.creatureDefinitions, scripted),
        "Apparition refusée",
      );
  };

  private readonly handleBrouhahaControl = (
    controlId: BrouhahaControlId,
  ): void => {
    if (!this.diagnosticMode) return;
    const room = this.activeRoom();
    const definition = this.session.roomDefinition;
    if (!room || !definition) return;
    this.applyStatefulResult(
      executeBrouhahaControl(
        room,
        this.options.brouhahaEffects,
        this.options.creatureDefinitions,
        definition.brouhahaReinforcements,
        this.options.dungeon.id,
        controlId,
      ),
      "Brouhaha inchangé",
    );
  };

  private applyStatefulResult(
    result: StatefulTacticalResult,
    unchangedText: string,
  ): void {
    const previousRoom = this.session.room;
    const changed = result.state !== previousRoom;
    if (changed) this.applyRoomState(result.state);
    runTacticalResultPipeline({
      previousRoom,
      nextRoom: result.state,
      events: result.events,
      render: () => this.render(changed ? "Enregistrement…" : unchangedText),
      present: (events) => this.presentation.present(events),
      persist: changed ? () => this.persist() : undefined,
    });
  }

  private applyResult(result: TacticalResult<StatefulTacticalResult>): void {
    if (!result.ok) {
      this.shell.appendEvent(result.error.message);
      return;
    }
    const previousRoom = this.session.room;
    this.applyRoomState(result.value.state);
    runTacticalResultPipeline({
      previousRoom,
      nextRoom: result.value.state,
      events: result.value.events,
      render: () => this.render("Enregistrement…"),
      present: (events) => this.presentation.present(events),
      persist: () => this.persist(),
    });
  }

  private applyRoomState(room: RoomState): void {
    const previous = this.session.expedition;
    const next = this.session.synchronize(room);
    this.announceProgress(previous, next);
  }

  private announceProgress(
    previous: ExpeditionState | null,
    next: ExpeditionState,
  ): void {
    if (next.completedRoomIds.length > (previous?.completedRoomIds.length ?? 0))
      this.shell.appendEvent(
        `${this.session.roomMetadata?.name ?? "Salle"} sécurisée.`,
      );
    if (previous?.status !== next.status && next.status === "victory")
      this.shell.appendEvent("Victoire : les trois salles sont sécurisées.");
    if (previous?.status !== next.status && next.status === "defeat")
      this.shell.appendEvent("Défaite : l’expédition est terminée.");
  }
}
