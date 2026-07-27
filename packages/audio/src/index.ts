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

const toneSettings: Record<
  AudioCueKey,
  { frequency: number; duration: number; wave: OscillatorType }
> = {
  interaction: { frequency: 420, duration: 0.07, wave: "triangle" },
  impact: { frequency: 180, duration: 0.09, wave: "square" },
  damage: { frequency: 115, duration: 0.13, wave: "sawtooth" },
  brouhaha: { frequency: 520, duration: 0.14, wave: "triangle" },
  reinforcement: { frequency: 660, duration: 0.17, wave: "sine" },
  victory: { frequency: 784, duration: 0.22, wave: "triangle" },
  defeat: { frequency: 92, duration: 0.24, wave: "sawtooth" },
};

let sharedAudioContext: AudioContext | null = null;

class TonePlayer implements AudioPlayer {
  volume = 1;
  currentTime = 0;
  readonly #key: AudioCueKey;
  readonly #active = new Set<OscillatorNode>();

  constructor(key: AudioCueKey) {
    this.#key = key;
  }

  async play(): Promise<void> {
    if (typeof AudioContext === "undefined")
      throw new Error("Web Audio indisponible");
    sharedAudioContext ??= new AudioContext();
    if (sharedAudioContext.state === "suspended")
      await sharedAudioContext.resume();

    const settings = toneSettings[this.#key];
    const oscillator = sharedAudioContext.createOscillator();
    const gain = sharedAudioContext.createGain();
    const now = sharedAudioContext.currentTime;
    oscillator.type = settings.wave;
    oscillator.frequency.setValueAtTime(settings.frequency, now);
    gain.gain.setValueAtTime(Math.max(0.0001, this.volume * 0.18), now);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + settings.duration,
    );
    oscillator.connect(gain);
    gain.connect(sharedAudioContext.destination);
    oscillator.onended = () => this.#active.delete(oscillator);
    this.#active.add(oscillator);
    oscillator.start(now);
    oscillator.stop(now + settings.duration);
  }

  pause(): void {
    for (const oscillator of this.#active)
      try {
        oscillator.stop();
      } catch {
        // Un oscillateur déjà terminé n'a plus besoin d'être arrêté.
      }
    this.#active.clear();
  }
}

const browserPlayerFactory: AudioPlayerFactory = (source) => {
  if (source.startsWith("tone:"))
    return new TonePlayer(source.slice("tone:".length) as AudioCueKey);
  if (typeof Audio === "undefined") return null;
  return new Audio(source);
};

export class AudioDirector {
  #settings = { ...defaultAudioSettings };
  #unlocked = false;
  readonly #assetBase: string | null;
  readonly #createPlayer: AudioPlayerFactory;
  readonly #players = new Map<AudioCueKey, AudioPlayer>();

  constructor(options: AudioDirectorOptions = {}) {
    this.#assetBase = options.assetBase?.replace(/\/$/, "") ?? null;
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
    const source = this.#assetBase
      ? `${this.#assetBase}/${audioAssets[key]}`
      : `tone:${key}`;
    const player = this.#createPlayer(source);
    if (player) this.#players.set(key, player);
    return player;
  }
}
