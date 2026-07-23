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
  createRoomState,
  endHeroActivation,
  endHeroesTurn,
  finishEnemyTurn,
  moveCombatant,
  reduceGameState,
  selectHero,
  type BrouhahaEffectDefinition,
  type BrouhahaResult,
  type CreatureDefinition,
  type DomainEvent,
  type GameState,
  type GridPosition,
  type RoomState,
  type SpawnResult,
  type TacticalEvent,
} from "@gargotte/engine";
import type { TabletopRenderer } from "@gargotte/renderer";
import type { GameShell } from "@gargotte/ui";
import {
  describeBrouhahaEvent,
  executeBrouhahaControl,
  type BrouhahaControlId,
} from "./brouhaha-controller";
import { renderGameView } from "./game-view";
import {
  PersistenceController,
  type RestoredSession,
} from "./persistence-controller";
import {
  describeSpawnEvent,
  executeScriptedSpawn,
} from "./scripted-spawn-controller";

interface GameControllerOptions {
  shell: GameShell;
  renderer: TabletopRenderer;
  dungeon: DungeonDefinition;
  roomDefinition: TacticalRoomDefinition;
  creatureDefinitions: CreatureDefinition[];
  brouhahaEffects: BrouhahaEffectDefinition[];
  restored: RestoredSession;
}

export class GameController {
  private readonly shell: GameShell;
  private readonly renderer: TabletopRenderer;
  private readonly dungeon: DungeonDefinition;
  private readonly roomDefinition: TacticalRoomDefinition;
  private readonly creatureDefinitions: CreatureDefinition[];
  private readonly brouhahaEffects: BrouhahaEffectDefinition[];
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
      this.shell.appendEvent(this.eventMessage(event));
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

    this.shell.startButton.disabled = false;
    this.render(this.roomWasRestored ? "Salle restaurée" : "Prête");
    this.shell.appendEvent(`${this.dungeon.name} chargé · ${BUILD_LABEL}.`);
  }

  private buildRoom(): RoomState {
    const chosen = this.roomDefinition.heroes.filter((hero) =>
      this.selectedHeroIds.includes(hero.id),
    );
    return createRoomState({
      scenarioId: this.roomDefinition.id,
      width: this.roomDefinition.grid.width,
      height: this.roomDefinition.grid.height,
      obstacles: this.roomDefinition.obstacles,
      spawnPoints: this.roomDefinition.spawnPoints,
      heroes: chosen,
      creatureDefinitions: this.creatureDefinitions,
      enemies: this.roomDefinition.enemies,
    });
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
      roomDefinition: this.roomDefinition,
      handlers: {
        selectHero: this.handleHeroSelection,
        move: this.handleMove,
        attack: this.handleAttack,
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
    const inputs = [
      ...this.shell.heroPicker.querySelectorAll<HTMLInputElement>(
        "input:checked",
      ),
    ];
    this.selectedHeroIds = inputs
      .map((input) => input.value)
      .filter((id) => this.validHeroIds.has(id))
      .slice(0, 4);
    if (this.selectedHeroIds.length > 0) return;
    this.selectedHeroIds = [this.defaultHeroId];
    const fallback = this.shell.heroPicker.querySelector<HTMLInputElement>(
      `input[value="${this.defaultHeroId}"]`,
    );
    if (fallback) fallback.checked = true;
  }

  private startRoom(): void {
    this.room = this.buildRoom();
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
    if (!this.room) return;
    this.applyResult(endHeroesTurn(this.room));
  }

  private resolveEnemyTurn(): void {
    if (!this.room) return;
    this.applyResult(finishEnemyTurn(this.room));
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

  private readonly handleScriptedSpawn = (spawnId: string): void => {
    if (!this.room) return;
    const scripted = this.roomDefinition.scriptedSpawns.find(
      (candidate) => candidate.id === spawnId,
    );
    if (!scripted) return;
    this.applySpawnResult(
      executeScriptedSpawn(this.room, this.creatureDefinitions, scripted),
    );
  };

  private readonly handleBrouhahaControl = (
    controlId: BrouhahaControlId,
  ): void => {
    if (!this.room) return;
    this.applyBrouhahaResult(
      executeBrouhahaControl(
        this.room,
        this.brouhahaEffects,
        this.dungeon.id,
        controlId,
      ),
    );
  };

  private applySpawnResult(result: SpawnResult): void {
    const changed = result.state !== this.room;
    this.room = result.state;
    this.appendTacticalEvents(result.events);
    if (changed) this.persist();
    else this.render("Apparition refusée");
  }

  private applyBrouhahaResult(result: BrouhahaResult): void {
    const changed = result.state !== this.room;
    this.room = result.state;
    this.appendTacticalEvents(result.events);
    if (changed) this.persist();
    else this.render("Brouhaha inchangé");
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
    else this.appendTacticalEvents(result.value.events);
    this.persist();
  }

  private appendTacticalEvents(events: readonly TacticalEvent[]): void {
    events.forEach((event) =>
      this.shell.appendEvent(this.tacticalEventMessage(event)),
    );
  }

  private tacticalEventMessage(event: TacticalEvent): string {
    return (
      describeBrouhahaEvent(event) ??
      describeSpawnEvent(event, this.creatureDefinitions) ??
      event.type
    );
  }

  private eventMessage(event: DomainEvent): string {
    return event.type === "expedition/started"
      ? "Les héros entrent dans la salle tactique."
      : event.type === "expedition/returned-to-menu"
        ? "Retour au menu."
        : "Le moteur de jeu est prêt.";
  }
}
