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
  getAttackableTargets,
  moveCombatant,
  reachablePositions,
  reduceGameState,
  selectHero,
  type DomainEvent,
  type GameState,
  type GridPosition,
  type RoomState,
} from "@gargotte/engine";
import type { TabletopRenderer } from "@gargotte/renderer";
import type { GameShell } from "@gargotte/ui";
import {
  PersistenceController,
  type RestoredSession,
} from "./persistence-controller";
import { renderTacticalActions } from "./tactical-actions";

interface GameControllerOptions {
  shell: GameShell;
  renderer: TabletopRenderer;
  dungeon: DungeonDefinition;
  roomDefinition: TacticalRoomDefinition;
  restored: RestoredSession;
}

export class GameController {
  private readonly shell: GameShell;
  private readonly renderer: TabletopRenderer;
  private readonly dungeon: DungeonDefinition;
  private readonly roomDefinition: TacticalRoomDefinition;
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
      heroes: chosen,
      enemies: this.roomDefinition.enemies,
    });
  }

  private highlights() {
    const hero = this.room?.heroes.find(
      (candidate) => candidate.id === this.room?.activeHeroId,
    );
    return {
      reachable:
        this.room && hero
          ? reachablePositions(
              this.room,
              hero.position,
              hero.actionsRemaining,
              hero.id,
            )
          : [],
      attackable:
        this.room && hero ? getAttackableTargets(this.room, hero.id) : [],
    };
  }

  private render(saveText: string): void {
    const active = this.room?.heroes.find(
      (hero) => hero.id === this.room?.activeHeroId,
    );
    this.shell.update({
      phase: this.state.phase,
      tacticalPhase: this.room?.phase ?? null,
      expeditionNumber: this.state.expeditionNumber,
      canContinue: Boolean(this.room),
      canRotateCamera: Boolean(this.room),
      cameraRotation: this.renderer.getCameraRotation(),
      saveText,
      actions: active?.actionsRemaining ?? 0,
      activeHero: active?.name ?? null,
      selectedHeroIds: this.selectedHeroIds,
    });
    renderTacticalActions(this.shell.tacticalActions, this.room, {
      selectHero: this.handleHeroSelection,
      move: this.handleMove,
      attack: this.handleAttack,
    });
    if (this.room) this.renderer.renderRoom(this.room, this.highlights());
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
    const result = endHeroActivation(this.room, this.room.activeHeroId);
    this.applyResult(result);
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
    else
      result.value.events.forEach((event) =>
        this.shell.appendEvent(event.type),
      );
    this.persist();
  }

  private eventMessage(event: DomainEvent): string {
    return event.type === "expedition/started"
      ? "Les héros entrent dans la salle tactique."
      : event.type === "expedition/returned-to-menu"
        ? "Retour au menu."
        : "Le moteur de jeu est prêt.";
  }
}
