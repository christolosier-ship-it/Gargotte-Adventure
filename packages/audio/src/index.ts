import type {
  AudioCueKey,
  AudioPresentationCue,
} from "@gargotte/presentation";

export interface AudioSettings {
  masterVolume: number;
  muted: boolean;
}

export interface AudioPlayer {
  volume: number;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
}

export type AudioPlayerFactory = (source: string) => AudioPlayer | null;

export interface AudioDirectorOptions {
  assetBase?: string;
  createPlayer?: AudioPlayerFactory;
}

export const defaultAudioSettings: AudioSettings = {
  masterVolume: 0.7,
  muted: false,
};

const audioAssets: Record<AudioCueKey, string> = {
  interaction: "interaction.wav",
  impact: "impact.wav",
  damage: "damage.wav",
  brouhaha: "brouhaha.wav",
  reinforcement: "reinforcement.wav",
  victory: "victory.wav",
  defeat: "defeat.wav",
};

const browserPlayerFactory: AudioPlayerFactory = (source) => {
  if (typeof Audio === "undefined") return null;
  return new Audio(source);
};

export class AudioDirector {
  #settings = { ...defaultAudioSettings };
  #unlocked = false;
  readonly #assetBase: string;
  readonly #createPlayer: AudioPlayerFactory;
  readonly #players = new Map<AudioCueKey, AudioPlayer>();

  constructor(options: AudioDirectorOptions = {}) {
    this.#assetBase = (options.assetBase ?? "assets/audio").replace(/\/$/, "");
    this.#createPlayer = options.createPlayer ?? browserPlayerFactory;
  }

  get settings(): Readonly<AudioSettings> {
    return this.#settings;
  }

  get unlocked(): boolean {
    return this.#unlocked;
  }

  get cacheSize(): number {
    return this.#players.size;
  }

  configure(next: Partial<AudioSettings>): void {
    this.#settings = {
      ...this.#settings,
      ...next,
      masterVolume: Math.min(
        1,
        Math.max(0, next.masterVolume ?? this.#settings.masterVolume),
      ),
    };
    if (this.#settings.muted) this.stopAll();
  }

  unlock(): void {
    this.#unlocked = true;
  }

  async playCue(cue: AudioPresentationCue): Promise<boolean> {
    if (!this.#unlocked || this.#settings.muted) return false;
    const player = this.playerFor(cue.key);
    if (!player) return false;

    player.volume = this.#settings.masterVolume;
    player.currentTime = 0;
    try {
      await player.play();
      return true;
    } catch {
      return false;
    }
  }

  async playCues(cues: readonly AudioPresentationCue[]): Promise<number> {
    let played = 0;
    const ordered = [...cues].sort(
      (left, right) => left.sequence - right.sequence,
    );
    for (const cue of ordered) if (await this.playCue(cue)) played += 1;
    return played;
  }

  stopAll(): void {
    for (const player of this.#players.values()) {
      player.pause();
      player.currentTime = 0;
    }
  }

  private playerFor(key: AudioCueKey): AudioPlayer | null {
    const cached = this.#players.get(key);
    if (cached) return cached;
    const player = this.#createPlayer(`${this.#assetBase}/${audioAssets[key]}`);
    if (player) this.#players.set(key, player);
    return player;
  }
}
