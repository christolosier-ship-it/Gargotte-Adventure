import { describe, expect, it } from "vitest";
import { createRoomState } from "./room-state";
import {
  interactWithObject,
  listAvailableInteractableInteractions,
} from "./interactables";
import { isBlocked } from "./grid";
import type {
  BrouhahaEffectDefinition,
  CreatureDefinition,
  InteractableDefinition,
  InteractableInteractionRequest,
  RoomState,
} from "./types";

const creature: CreatureDefinition = {
  id: "gobelin",
  name: "Gobelin",
  maxHp: 5,
  atk: 2,
  def: 0,
  range: 1,
  blocksMovement: true,
};

const definitions: InteractableDefinition[] = [
  {
    id: "tonneau",
    name: "Tonneau douteux",
    kind: "barrel",
    initialStateId: "intact",
    states: [
      {
        id: "intact",
        label: "intact",
        blocksMovement: true,
        blocksLineOfSight: true,
      },
      {
        id: "brise",
        label: "brisé",
        blocksMovement: false,
        blocksLineOfSight: false,
      },
    ],
    interactions: [
      {
        id: "briser",
        label: "Briser",
        fromStateId: "intact",
        toStateId: "brise",
        brouhahaDelta: 1,
        reason: "Un objet vient d'être brisé.",
      },
    ],
  },
  {
    id: "grille",
    name: "Grille",
    kind: "gate",
    initialStateId: "fermee",
    states: [
      {
        id: "fermee",
        label: "fermée",
        blocksMovement: true,
        blocksLineOfSight: true,
      },
      {
        id: "ouverte",
        label: "ouverte",
        blocksMovement: false,
        blocksLineOfSight: false,
      },
    ],
    interactions: [
      {
        id: "ouvrir",
        label: "Ouvrir",
        fromStateId: "fermee",
        toStateId: "ouverte",
        brouhahaDelta: 0,
        reason: "La grille s'ouvre.",
      },
      {
        id: "fermer",
        label: "Fermer",
        fromStateId: "ouverte",
        toStateId: "fermee",
        brouhahaDelta: 0,
        reason: "La grille se ferme.",
      },
    ],
  },
];

const effects: BrouhahaEffectDefinition[] = [
  {
    id: "echo",
    name: "Écho",
    description: "Le donjon répond.",
    scope: { type: "universal" },
    minLevel: 0,
    maxLevel: 9,
  },
];

const request = (
  overrides: Partial<InteractableInteractionRequest> = {},
): InteractableInteractionRequest => ({
  id: "interaction-1",
  heroId: "hero",
  interactableInstanceId: "tonneau-1",
  interactionId: "briser",
  ...overrides,
});

function room(): RoomState {
  const state = createRoomState({
    scenarioId: "salle-test",
    width: 5,
    height: 3,
    obstacles: [],
    interactableDefinitions: definitions,
    interactables: [
      {
        id: "tonneau-1",
        interactableId: "tonneau",
        position: { column: 1, row: 1 },
        stateId: "intact",
      },
      {
        id: "grille-1",
        interactableId: "grille",
        position: { column: 3, row: 1 },
        stateId: "fermee",
      },
    ],
    spawnPoints: [],
    heroes: [
      {
        id: "hero",
        name: "Héroïne",
        position: { column: 0, row: 1 },
        hp: 10,
        maxHp: 10,
        atk: 3,
        def: 1,
        range: 1,
      },
    ],
    creatureDefinitions: [creature],
    enemies: [
      {
        id: "gobelin-1",
        creatureId: creature.id,
        position: { column: 4, row: 0 },
      },
    ],
  });
  return { ...state, activeHeroId: "hero" };
}

const context = { dungeonId: "bastognac" };

describe("objets interactifs déterministes", () => {
  it("brise un objet, consomme une action et produit le Brouhaha", () => {
    const result = interactWithObject(
      room(),
      definitions,
      effects,
      request(),
      context,
    );

    expect(result.rejection).toBeNull();
    expect(result.state.interactables[0]).toMatchObject({
      id: "tonneau-1",
      stateId: "brise",
      blocksMovement: false,
      blocksLineOfSight: false,
    });
    expect(result.state.heroes[0]?.actionsRemaining).toBe(2);
    expect(result.state.brouhaha.level).toBe(1);
    expect(result.state.processedInteractableRequestIds).toEqual([
      "interaction-1",
    ]);
    expect(result.state.nextInteractableInteractionSequence).toBe(2);
    expect(result.events.map((event) => event.type)).toEqual([
      "interactable-interaction-requested",
      "interactable-state-changed",
      "interactable-interaction-succeeded",
      "brouhaha-change-requested",
      "brouhaha-level-changed",
      "brouhaha-effect-resolved",
    ]);
  });

  it("retourne exactement le même résultat pour les mêmes entrées", () => {
    const current = room();
    expect(
      interactWithObject(current, definitions, effects, request(), context),
    ).toEqual(
      interactWithObject(current, definitions, effects, request(), context),
    );
  });

  it("refuse une demande dupliquée sans mutation", () => {
    const first = interactWithObject(
      room(),
      definitions,
      effects,
      request(),
      context,
    );
    const duplicate = interactWithObject(
      first.state,
      definitions,
      effects,
      request(),
      context,
    );

    expect(duplicate.state).toBe(first.state);
    expect(duplicate.rejection?.reason).toBe("duplicate-request");
    expect(duplicate.state.heroes[0]?.actionsRemaining).toBe(2);
  });

  it("refuse un objet hors portée sans consommer d'action", () => {
    const current = room();
    const result = interactWithObject(
      current,
      definitions,
      effects,
      request({
        interactableInstanceId: "grille-1",
        interactionId: "ouvrir",
      }),
      context,
    );

    expect(result.state).toBe(current);
    expect(result.rejection?.reason).toBe("out-of-range");
    expect(current.heroes[0]?.actionsRemaining).toBe(3);
  });

  it("ouvre une grille et libère la case", () => {
    const current = {
      ...room(),
      heroes: room().heroes.map((hero) => ({
        ...hero,
        position: { column: 2, row: 1 },
      })),
    };
    const result = interactWithObject(
      current,
      definitions,
      effects,
      request({
        interactableInstanceId: "grille-1",
        interactionId: "ouvrir",
      }),
      context,
    );

    expect(isBlocked(current, { column: 3, row: 1 })).toBe(true);
    expect(isBlocked(result.state, { column: 3, row: 1 })).toBe(false);
    expect(result.state.brouhaha.level).toBe(0);
  });

  it("refuse de refermer une grille sur un combattant", () => {
    const current = {
      ...room(),
      interactables: room().interactables.map((interactable) =>
        interactable.id === "grille-1"
          ? {
              ...interactable,
              stateId: "ouverte",
              blocksMovement: false,
              blocksLineOfSight: false,
            }
          : interactable,
      ),
      heroes: room().heroes.map((hero) => ({
        ...hero,
        position: { column: 2, row: 1 },
      })),
      enemies: room().enemies.map((enemy) => ({
        ...enemy,
        position: { column: 3, row: 1 },
      })),
    };
    const result = interactWithObject(
      current,
      definitions,
      effects,
      request({
        interactableInstanceId: "grille-1",
        interactionId: "fermer",
      }),
      context,
    );

    expect(result.state).toBe(current);
    expect(result.rejection?.reason).toBe("destination-occupied");
  });

  it("liste uniquement les interactions adjacentes et valides", () => {
    expect(
      listAvailableInteractableInteractions(room(), definitions, "hero"),
    ).toEqual([
      {
        interactableInstanceId: "tonneau-1",
        interactableId: "tonneau",
        objectName: "Tonneau douteux",
        interactionId: "briser",
        label: "Briser",
      },
    ]);
  });
});
