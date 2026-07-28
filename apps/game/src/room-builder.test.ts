import { describe, expect, it } from "vitest";
import {
  bastognacCreatureDefinitions,
  bastognacInteractableDefinitions,
  bastognacRoomDefinitions,
} from "./bastognac";
import { buildTacticalRoomWithEvents } from "./room-builder";

const selected = ["brunhilda", "aelion"];

describe("construction d’une salle d’expédition", () => {
  it("instancie toute population initiale par le moteur de spawn", () => {
    const built = buildTacticalRoomWithEvents(
      bastognacRoomDefinitions[0]!,
      bastognacCreatureDefinitions,
      bastognacInteractableDefinitions,
      selected,
    );

    expect(built.state.enemies).toHaveLength(2);
    expect(built.state.processedSpawnRequestIds).toEqual([
      "population-vestibule",
    ]);
    expect(built.events.map((event) => event.type)).toEqual([
      "spawn-requested",
      "creature-instantiated",
      "creature-instantiated",
      "spawn-succeeded",
    ]);
  });

  it("reste déterministe pour une même définition", () => {
    const first = buildTacticalRoomWithEvents(
      bastognacRoomDefinitions[2]!,
      bastognacCreatureDefinitions,
      bastognacInteractableDefinitions,
      selected,
    ).state;
    const second = buildTacticalRoomWithEvents(
      bastognacRoomDefinitions[2]!,
      bastognacCreatureDefinitions,
      bastognacInteractableDefinitions,
      selected,
    ).state;

    expect(second).toEqual(first);
    expect(first.enemies.map((enemy) => enemy.id)).toEqual([
      "gobelin-bricoleur-spawn-1",
      "gobelin-bricoleur-spawn-2",
      "gobelin-lance-tout-spawn-3",
    ]);
  });

  it("injecte les PV persistants après les spawns sans transférer le Brouhaha", () => {
    const built = buildTacticalRoomWithEvents(
      bastognacRoomDefinitions[1]!,
      bastognacCreatureDefinitions,
      bastognacInteractableDefinitions,
      selected,
      [
        { id: "brunhilda", hp: 5, maxHp: 12, alive: true },
        { id: "aelion", hp: 0, maxHp: 8, alive: false },
      ],
    ).state;

    expect(built.heroes.find((hero) => hero.id === "brunhilda")?.hp).toBe(5);
    expect(built.heroes.find((hero) => hero.id === "aelion")?.alive).toBe(
      false,
    );
    expect(built.enemies).toHaveLength(2);
    expect(built.processedSpawnRequestIds).toEqual([
      "population-galerie-bricoleur",
      "population-galerie-lance-tout",
    ]);
    expect(built.phase).toBe("heroes-turn");
    expect(built.brouhaha.level).toBe(0);
    expect(built.turn).toBe(1);
  });
});
