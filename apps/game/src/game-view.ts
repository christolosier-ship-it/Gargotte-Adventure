import type { TacticalRoomDefinition } from "@gargotte/content-schema";
import {
  getAttackableTargets,
  reachablePositions,
  type BrouhahaEffectDefinition,
  type GameState,
  type InteractableDefinition,
  type RoomState,
} from "@gargotte/engine";
import type { TabletopRenderer } from "@gargotte/renderer";
import type { GameShell } from "@gargotte/ui";
import { brouhahaControlActions } from "./brouhaha-controller";
import { availableInteractableActions } from "./interactable-controller";
import { availableScriptedSpawns } from "./scripted-spawn-controller";
import {
  renderTacticalActions,
  type TacticalActionHandlers,
} from "./tactical-actions";

interface GameViewOptions {
  shell: GameShell;
  renderer: TabletopRenderer;
  state: GameState;
  room: RoomState | null;
  selectedHeroIds: readonly string[];
  saveText: string;
  brouhahaEffects: readonly BrouhahaEffectDefinition[];
  interactableDefinitions: readonly InteractableDefinition[];
  roomDefinition: TacticalRoomDefinition;
  handlers: TacticalActionHandlers;
}

export function renderGameView(options: GameViewOptions): void {
  const active = options.room?.heroes.find(
    (hero) => hero.id === options.room?.activeHeroId,
  );
  const latestBrouhaha = options.room?.brouhaha.history.at(-1);
  const latestEffectNames = latestBrouhaha
    ? latestBrouhaha.effectIds.map(
        (id) =>
          options.brouhahaEffects.find((effect) => effect.id === id)?.name ??
          id,
      )
    : [];

  options.shell.update({
    phase: options.state.phase,
    tacticalPhase: options.room?.phase ?? null,
    expeditionNumber: options.state.expeditionNumber,
    canContinue: Boolean(options.room),
    canRotateCamera: Boolean(options.room),
    cameraRotation: options.renderer.getCameraRotation(),
    saveText: options.saveText,
    actions: active?.actionsRemaining ?? 0,
    activeHero: active?.name ?? null,
    selectedHeroIds: [...options.selectedHeroIds],
    brouhahaLevel: options.room?.brouhaha.level ?? 0,
    brouhahaMax: 12,
    brouhahaEffects: latestEffectNames,
  });

  renderTacticalActions(
    options.shell.tacticalActions,
    options.room,
    options.handlers,
    options.room
      ? availableScriptedSpawns(
          options.room,
          options.roomDefinition.scriptedSpawns,
        )
      : [],
    brouhahaControlActions,
    options.room
      ? availableInteractableActions(
          options.room,
          options.interactableDefinitions,
        )
      : [],
  );

  if (options.room)
    options.renderer.renderRoom(options.room, highlights(options.room));
}

function highlights(room: RoomState) {
  const hero = room.heroes.find(
    (candidate) => candidate.id === room.activeHeroId,
  );
  return {
    reachable: hero
      ? reachablePositions(room, hero.position, hero.actionsRemaining, hero.id)
      : [],
    attackable: hero ? getAttackableTargets(room, hero.id) : [],
  };
}
