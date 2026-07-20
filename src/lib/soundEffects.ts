class SoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx =
        window.AudioContext ||
        (
          window as Window &
            typeof globalThis & { webkitAudioContext?: typeof AudioContext }
        ).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  // Play a dual-tone chord chime (E5 -> B5) + Haptic Pulse on transfer completion
  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") void this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "sine";
      osc2.type = "sine";

      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc2.frequency.setValueAtTime(987.77, now + 0.1); // B5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.1);
      osc1.stop(now + 0.5);
      osc2.stop(now + 0.5);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {
      console.warn("Audio chime prevented by browser autoplay policy.");
    }
  }

  // Play a subtle rising pop tone on initial peer handshake
  playConnect() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === "suspended") void this.ctx.resume();

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch {
      console.warn("Audio chime prevented by browser autoplay policy.");
    }
  }
}

export const sounds = new SoundEngine();
