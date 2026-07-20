import { describe, expect, it } from "vitest";
import {
  createDeterministicRandom,
  createEvent,
  createInitialGameState,
  reduceGameState,
} from "./index";

describe("moteur déterministe", () => {
  it("produit la même séquence avec la même graine", () => {
    const left = createDeterministicRandom(42);
    const right = createDeterministicRandom(42);

    expect([left(), left(), left()]).toEqual([right(), right(), right()]);
  });

  it("fait passer une expédition par un événement explicite", () => {
    const boot = createInitialGameState(1);
    const menu = reduceGameState(boot, createEvent("app/ready"));
    const expedition = reduceGameState(
      menu,
      createEvent("expedition/started", { seed: 734 }),
    );

    expect(menu.phase).toBe("menu");
    expect(expedition).toMatchObject({
      phase: "expedition",
      seed: 734,
      expeditionNumber: 1,
    });
  });
});
