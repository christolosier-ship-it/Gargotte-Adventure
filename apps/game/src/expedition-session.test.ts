import { describe, expect, it } from "vitest";
import {
  bastognacCreatureDefinitions,
  bastognacExpedition,
  bastognacInteractableDefinitions,
  bastognacRoomDefinitions,
} from "./bastognac";
import { ExpeditionSession } from "./expedition-session";

function session() {
  return new ExpeditionSession({
    definition: bastognacExpedition,
    roomDefinitions: bastognacRoomDefinitions,
    creatureDefinitions: bastognacCreatureDefinitions,
    interactableDefinitions: bastognacInteractableDefinitions,
    restored: null,
  });
}

describe("session d’expédition", () => {
  it("démarre la première salle et expose sa connexion", () => {
    const current = session();
    const built = current.start("expedition-1", ["brunhilda"]);

    expect(built.restored).toBe(false);
    expect(current.room?.scenarioId).toBe("bastognac-salle-1");
    expect(current.roomMetadata?.name).toBe("Le vestibule des maladroits");
    expect(current.connection?.toRoomId).toBe("bastognac-salle-2");
  });

  it("crée la salle suivante une seule fois après complétion", () => {
    const current = session();
    current.start("expedition-1", ["brunhilda"]);
    const first = current.room!;
    current.synchronize({
      ...first,
      enemies: first.enemies.map((enemy) => ({
        ...enemy,
        hp: 0,
        alive: false,
      })),
      phase: "victory",
    });

    const second = current.transition();
    expect(second.restored).toBe(false);
    expect(second.room.processedSpawnRequestIds).toEqual([
      "population-galerie-bricoleur",
      "population-galerie-lance-tout",
    ]);
    expect(current.expedition?.visitedRoomIds).toEqual([
      "bastognac-salle-1",
      "bastognac-salle-2",
    ]);
  });

  it("restaure l’état courant sans rejouer les événements initiaux", () => {
    const source = session();
    source.start("expedition-1", ["brunhilda"]);
    const restored = new ExpeditionSession({
      definition: bastognacExpedition,
      roomDefinitions: bastognacRoomDefinitions,
      creatureDefinitions: bastognacCreatureDefinitions,
      interactableDefinitions: bastognacInteractableDefinitions,
      restored: source.expedition,
    });

    expect(restored.room).toBe(source.room);
    expect(restored.room?.processedSpawnRequestIds).toEqual([
      "population-vestibule",
    ]);
  });
});
