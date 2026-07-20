export interface AudioSettings {
  masterVolume: number;
  muted: boolean;
}

export const defaultAudioSettings: AudioSettings = {
  masterVolume: 0.7,
  muted: false
};

export class AudioDirector {
  #settings = { ...defaultAudioSettings };

  get settings(): Readonly<AudioSettings> {
    return this.#settings;
  }

  configure(next: Partial<AudioSettings>): void {
    this.#settings = {
      ...this.#settings,
      ...next,
      masterVolume: Math.min(1, Math.max(0, next.masterVolume ?? this.#settings.masterVolume))
    };
  }
}
