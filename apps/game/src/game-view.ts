import type { AudioSettings } from "@gargotte/audio";
import type {
  ExpeditionDefinition,
  ExpeditionRoomDefinition,
  RoomConnectionDefinition,
  TacticalRoomDefinition,
} from "@gargotte/content-schema";
import {
  getAttackableTargets,
  reachablePositions,
  type BrouhahaEffectDefinition,
  type ExpeditionState,
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
  expeditionDefinition: ExpeditionDefinition;
  expedition: ExpeditionState | null;
  room: RoomState | null;
  roomDefinition: TacticalRoomDefinition | null;
  roomMetadata: ExpeditionRoomDefinition | null;
  connection: RoomConnectionDefinition | null;
  awaitingResume: boolean;
  diagnosticMode: boolean;
  selectedHeroIds: readonly string[];
  saveText: string;
  audioSettings: Readonly<AudioSettings>;
  reducedMotion: boolean;
  brouhahaEffects: readonly BrouhahaEffectDefinition[];
  interactableDefinitions: readonly InteractableDefinition[];
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
  const roomIndex = options.expedition?.currentRoomId
    ? options.expedition.orderedRoomIds.indexOf(
        options.expedition.currentRoomId,
      ) + 1
    : 0;

  options.shell.update({
    phase: options.state.phase,
    tacticalPhase: options.room?.phase ?? null,
    expeditionStatus: options.expedition?.status ?? null,
    expeditionNumber: options.state.expeditionNumber,
    canStart: !options.expedition,
    canContinue: options.awaitingResume,
    canTransition:
      Boolean(options.connection) &&
      options.expedition?.status === "in-progress" &&
      options.room?.phase === "victory",
    transitionLabel: options.connection?.label ?? null,
    canReplay:
      options.expedition?.status === "victory" ||
      options.expedition?.status === "defeat",
    canRotateCamera: Boolean(options.room) && !options.awaitingResume,
    cameraRotation: options.renderer.getCameraRotation(),
    saveText: options.saveText,
    roomName: options.roomMetadata?.name ?? options.expeditionDefinition.name,
    roomObjective:
      options.roomMetadata?.objective ??
      options.expeditionDefinition.introduction,
    roomProgress:
      roomIndex > 0
        ? `MICRO-DONJON · SALLE ${roomIndex}/3`
        : "MICRO-DONJON · PRÉPARATION",
    resultText: resultText(options.expedition, options.expeditionDefinition),
    actions: active?.actionsRemaining ?? 0,
    activeHero: active?.name ?? null,
    selectedHeroIds: [...options.selectedHeroIds],
    brouhahaLevel: options.room?.brouhaha.level ?? 0,
    brouhahaMax: 12,
    brouhahaEffects: latestEffectNames,
    audioMuted: options.audioSettings.muted,
    audioVolume: options.audioSettings.masterVolume,
    reducedMotion: options.reducedMotion,
    diagnosticMode: options.diagnosticMode,
  });

  renderTacticalActions(
    options.shell.tacticalActions,
    options.awaitingResume ? null : options.room,
    options.handlers,
    options.diagnosticMode && options.room && options.roomDefinition
      ? availableScriptedSpawns(
          options.room,
          options.roomDefinition.scriptedSpawns,
        )
      : [],
    options.diagnosticMode ? brouhahaControlActions : [],
    options.room
      ? availableInteractableActions(
          options.room,
          options.interactableDefinitions,
        )
      : [],
    options.diagnosticMode,
  );

  if (options.room)
    options.renderer.renderRoom(options.room, highlights(options.room));
}

function resultText(
  expedition: ExpeditionState | null,
  definition: ExpeditionDefinition,
): string | null {
  if (!expedition?.result) return null;
  const summary = `${expedition.result.totalTurns} tours · ${expedition.result.defeatedEnemies} ennemis vaincus`;
  return expedition.result.outcome === "victory"
    ? `${definition.victoryText} ${summary}.`
    : `${definition.defeatText} ${summary}.`;
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
