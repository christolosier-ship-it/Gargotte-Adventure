import type { RoomState, TacticalEvent } from "@gargotte/engine";

export interface StatefulTacticalResult {
  state: RoomState;
  events: TacticalEvent[];
}

interface TacticalResultPipelineOptions {
  previousRoom: RoomState | null;
  nextRoom: RoomState;
  events: readonly TacticalEvent[];
  render: () => void;
  present: (events: readonly TacticalEvent[]) => void;
  persist?: () => void;
}

export function runTacticalResultPipeline(
  options: TacticalResultPipelineOptions,
): TacticalEvent[] {
  const presentationEvents = appendTerminalPhaseTransitionEvent(
    options.previousRoom,
    options.nextRoom,
    options.events,
  );

  options.render();
  options.present(presentationEvents);
  options.persist?.();

  return presentationEvents;
}

export function appendTerminalPhaseTransitionEvent(
  previousRoom: RoomState | null,
  nextRoom: RoomState,
  events: readonly TacticalEvent[],
): TacticalEvent[] {
  const copiedEvents = [...events];
  const phase = nextRoom.phase;
  const isTerminal = phase === "victory" || phase === "defeat";

  if (!isTerminal || previousRoom?.phase === phase) return copiedEvents;
  if (
    copiedEvents.some(
      (event) => event.type === "phase-changed" && event.phase === phase,
    )
  )
    return copiedEvents;

  return [
    ...copiedEvents,
    {
      type: "phase-changed",
      phase,
      turn: nextRoom.turn,
    },
  ];
}
