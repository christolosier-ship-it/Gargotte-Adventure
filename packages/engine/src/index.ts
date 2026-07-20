import { createId } from "@gargotte/common";

export type GamePhase = "boot" | "menu" | "expedition";

export interface GameState {
  version: 1;
  phase: GamePhase;
  seed: number;
  expeditionNumber: number;
  lastEventId: string | null;
}

export type DomainEvent =
  | {
      id: string;
      type: "app/ready";
      occurredAt: string;
    }
  | {
      id: string;
      type: "expedition/started";
      occurredAt: string;
      payload: { seed: number };
    }
  | {
      id: string;
      type: "expedition/returned-to-menu";
      occurredAt: string;
    };

export function createInitialGameState(seed = 1): GameState {
  return {
    version: 1,
    phase: "boot",
    seed,
    expeditionNumber: 0,
    lastEventId: null,
  };
}

export function reduceGameState(
  state: GameState,
  event: DomainEvent,
): GameState {
  switch (event.type) {
    case "app/ready":
      return { ...state, phase: "menu", lastEventId: event.id };
    case "expedition/started":
      return {
        ...state,
        phase: "expedition",
        seed: event.payload.seed,
        expeditionNumber: state.expeditionNumber + 1,
        lastEventId: event.id,
      };
    case "expedition/returned-to-menu":
      return { ...state, phase: "menu", lastEventId: event.id };
  }
}

export function createEvent<T extends DomainEvent["type"]>(
  type: T,
  payload?: Extract<DomainEvent, { type: T }> extends { payload: infer P }
    ? P
    : never,
): Extract<DomainEvent, { type: T }> {
  const event = {
    id: createId(),
    type,
    occurredAt: new Date().toISOString(),
    ...(payload === undefined ? {} : { payload }),
  };

  return event as Extract<DomainEvent, { type: T }>;
}

export type EventListener = (event: DomainEvent) => void;

export class EventBus {
  readonly #listeners = new Set<EventListener>();

  subscribe(listener: EventListener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  publish(event: DomainEvent): void {
    for (const listener of this.#listeners) listener(event);
  }
}

export function createDeterministicRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}
