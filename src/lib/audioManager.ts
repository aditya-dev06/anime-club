// ============================================================================
// RESILIENT WEB AUDIO SOUND MANAGER
// Supports sample-accurate scheduling, buffer preloading, stereo panning,
// and mobile user gesture unlocking to guarantee reliable playback.
// ============================================================================

export interface SoundScheduleOptions {
  volume?: number;
  delay?: number; // In seconds from ctx.currentTime
  pan?: number;   // -1.0 (left) to +1.0 (right)
  playbackRate?: number;
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private isUnlocked = false;
  private masterGain: GainNode | null = null;
  private pendingQueue: Array<{ src: string; options: SoundScheduleOptions; timestamp: number }> = [];
  private activeSources: Set<{ stop: () => void }> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupUnlockListeners();
    }
  }

  public stopAll() {
    this.activeSources.forEach((handle) => {
      try {
        handle.stop();
      } catch {
        // ignore
      }
    });
    this.activeSources.clear();
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1.0;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private setupUnlockListeners() {
    const events = ['pointerdown', 'touchstart', 'touchend', 'keydown', 'click'];
    const doUnlock = async () => {
      await this.unlock();
      if (this.isUnlocked) {
        events.forEach((e) => window.removeEventListener(e, doUnlock, { capture: true }));
      }
    };
    events.forEach((e) => window.addEventListener(e, doUnlock, { capture: true, passive: true }));

    // iOS Safari / Tab backgrounding reconnection
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.ctx && this.ctx.state !== 'running') {
        setTimeout(() => this.ctx?.resume().catch(() => {}), 80);
      }
    });
  }

  public async unlock(): Promise<boolean> {
    const ctx = this.getContext();
    if (ctx.state === 'running') {
      this.isUnlocked = true;
      this.flushQueue();
      return true;
    }

    try {
      await ctx.resume();
      // 1-sample silent kick to unlock WebKit audio hardware engine
      const silentBuffer = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = silentBuffer;
      src.connect(ctx.destination);
      src.start(0);

      if ((ctx.state as string) === 'running') {
        this.isUnlocked = true;
        this.flushQueue();
        return true;
      }
    } catch (err) {
      console.warn('AudioContext unlock failed:', err);
    }
    return false;
  }

  public async preload(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const fullUrl = url.startsWith('/') ? basePath + url.slice(1) : basePath + url;
      const res = await fetch(fullUrl);
      const arrayBuffer = await res.arrayBuffer();
      const ctx = this.getContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (err) {
      console.warn(`Failed to preload audio buffer for ${url}:`, err);
      return null;
    }
  }

  /**
   * Schedule audio playback at a precise timeline offset.
   */
  public async play(src: string, options: SoundScheduleOptions = {}) {
    const { volume = 1, delay = 0, pan = 0, playbackRate = 1 } = options;
    const ctx = this.getContext();

    // If context is still suspended, attempt unlock or queue
    if (ctx.state !== 'running') {
      this.pendingQueue.push({ src, options, timestamp: Date.now() });
      await this.unlock();
      if ((ctx.state as string) !== 'running') {
        // Fallback for HTML5 Audio
        this.fallbackPlay(src, volume, delay);
        return;
      }
    }

    let buffer = this.bufferCache.get(src);
    if (!buffer) {
      buffer = (await this.preload(src)) || undefined;
    }

    if (!buffer) {
      this.fallbackPlay(src, volume, delay);
      return;
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;

      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;

      // Stereo Panning for binaural whisper effect
      if (typeof ctx.createStereoPanner === 'function' && pan !== 0) {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        source.connect(gainNode);
        gainNode.connect(panner);
        panner.connect(this.masterGain || ctx.destination);
      } else {
        source.connect(gainNode);
        gainNode.connect(this.masterGain || ctx.destination);
      }

      const startTime = ctx.currentTime + Math.max(0, delay);
      source.start(startTime);

      const handle = {
        stop: () => {
          try {
            source.stop();
          } catch {
            // ignore
          }
        },
      };
      this.activeSources.add(handle);
      source.onended = () => {
        this.activeSources.delete(handle);
      };
    } catch (err) {
      console.warn(`Web Audio play failed for ${src}, using fallback:`, err);
      this.fallbackPlay(src, volume, delay);
    }
  }

  private fallbackPlay(src: string, volume: number, delay = 0) {
    const basePath = import.meta.env.BASE_URL || '/';
    const fullUrl = src.startsWith('/') ? basePath + src.slice(1) : basePath + src;
    
    const exec = () => {
      const audio = new Audio(fullUrl);
      audio.volume = volume;
      const handle = {
        stop: () => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch {
            // ignore
          }
        },
      };
      this.activeSources.add(handle);
      audio.onended = () => {
        this.activeSources.delete(handle);
      };
      audio.play().catch((err) => console.warn('HTML5 Audio fallback play rejected:', err));
    };

    if (delay > 0) {
      window.setTimeout(exec, delay * 1000);
    } else {
      exec();
    }
  }

  /**
   * Re:Zero Awakening Audio: Diaphragmatic inspiratory sub-bass shock
   * paired with high-frequency sinusoidal tinnitus whistle (5.1 kHz) decaying exponentially.
   */
  public playAwakeningGasp(delay = 0) {
    const ctx = this.getContext();
    if ((ctx.state as string) !== 'running') return;

    try {
      const now = ctx.currentTime + Math.max(0, delay);

      // 1. Tinnitus Generator (5.1 kHz sinusoidal whistle)
      const tinnitusOsc = ctx.createOscillator();
      const tinnitusGain = ctx.createGain();
      tinnitusOsc.type = 'sine';
      tinnitusOsc.frequency.setValueAtTime(5120, now);
      tinnitusOsc.frequency.exponentialRampToValueAtTime(4600, now + 1.8);

      tinnitusGain.gain.setValueAtTime(0.001, now);
      tinnitusGain.gain.linearRampToValueAtTime(0.28, now + 0.05); // sharp piercing onset
      tinnitusGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0); // gradual decay

      tinnitusOsc.connect(tinnitusGain);
      tinnitusGain.connect(this.masterGain || ctx.destination);
      tinnitusOsc.start(now);
      tinnitusOsc.stop(now + 2.1);

      // 2. Diaphragmatic inspiratory gasp sub-bass drop (115 Hz -> 32 Hz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(115, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.40);

      subGain.gain.setValueAtTime(0.55, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      subOsc.connect(subGain);
      subGain.connect(this.masterGain || ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.50);

      const handle = {
        stop: () => {
          try {
            tinnitusOsc.stop();
            subOsc.stop();
          } catch {}
        },
      };
      this.activeSources.add(handle);
    } catch (err) {
      console.warn('Awakening sound synthesis failed:', err);
    }
  }

  private flushQueue() {
    const now = Date.now();
    const queue = [...this.pendingQueue];
    this.pendingQueue = [];
    queue.forEach(({ src, options, timestamp }) => {
      if (now - timestamp < 1200) {
        this.play(src, options);
      }
    });
  }
}

export const audioManager = new SoundManager();

// Preload the essential sound effects
if (typeof window !== 'undefined') {
  audioManager.preload('/sounds/return-by-death.webm');
  audioManager.preload('/sounds/aishiteru.mp3');
  audioManager.preload('/sounds/atomic.webm');
}
