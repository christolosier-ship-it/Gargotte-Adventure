import { describe, expect, it } from "vitest";
import {
  AudioDirector,
  type AudioPlayer,
  type AudioPlayerFactory,
  type AudioPresentationCue,
} from "./index";

class FakePlayer implements AudioPlayer {
  volume = 0;
  currentTime = 4;
  playCount = 0;
  pauseCount = 0;
  shouldFail = false;

  async play(): Promise<void> {
    this.playCount += 1;
    if (this.shouldFail) throw new Error("lecture refusée");
  }

  pause(): void {
    this.pauseCount += 1;
  }
}

const cue = (key: AudioPresentationCue["key"], sequence = 0) => ({
  id: `audio-${key}-${sequence}`,
  sequence,
  key,
  priority: 50,
});

describe("AudioDirector", () => {
  it("attend le déverrouillage, applique le volume et met en cache", async () => {
    const players = new Map<string, FakePlayer>();
    const factory: AudioPlayerFactory = (source) => {
      const player = new FakePlayer();
      players.set(source, player);
      return player;
    };
    const director = new AudioDirector({
      assetBase: "assets/audio",
      createPlayer: factory,
    });

    await expect(director.playCue(cue("impact"))).resolves.toBe(false);
    expect(director.cacheSize).toBe(0);

    director.configure({ masterVolume: 0.45 });
    director.unlock();
    await expect(director.playCue(cue("impact"))).resolves.toBe(true);
    await expect(director.playCue(cue("impact", 1))).resolves.toBe(true);

    const player = players.get("assets/audio/impact.wav");
    expect(player?.volume).toBe(0.45);
    expect(player?.currentTime).toBe(0);
    expect(player?.playCount).toBe(2);
    expect(director.cacheSize).toBe(1);
  });

  it("respecte le mode muet et arrête les lecteurs", async () => {
    const player = new FakePlayer();
    const director = new AudioDirector({ createPlayer: () => player });
    director.unlock();

    await director.playCue(cue("damage"));
    director.configure({ muted: true });

    expect(player.pauseCount).toBe(1);
    await expect(director.playCue(cue("damage", 1))).resolves.toBe(false);
  });

  it("tolère un asset absent ou une lecture refusée", async () => {
    const missing = new AudioDirector({ createPlayer: () => null });
    missing.unlock();
    await expect(missing.playCue(cue("brouhaha"))).resolves.toBe(false);

    const player = new FakePlayer();
    player.shouldFail = true;
    const failing = new AudioDirector({ createPlayer: () => player });
    failing.unlock();
    await expect(failing.playCue(cue("reinforcement"))).resolves.toBe(false);
  });

  it("joue les cues selon leur séquence", async () => {
    const order: string[] = [];
    const factory: AudioPlayerFactory = (source) => ({
      volume: 0,
      currentTime: 0,
      async play() {
        order.push(source);
      },
      pause() {},
    });
    const director = new AudioDirector({ createPlayer: factory });
    director.unlock();

    await expect(
      director.playCues([cue("victory", 20), cue("interaction", 10)]),
    ).resolves.toBe(2);
    expect(order).toEqual(["tone:interaction", "tone:victory"]);
  });
});
