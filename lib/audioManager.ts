// Singleton Audio Manager - Lives outside React lifecycle
// Volume values NEVER reset

const AUDIO_ASSETS = {
  background: '/sounds/BGM.mp3',
  cashout: '/sounds/Cashout.mp3',
  diamond: '/sounds/Diamond%20Reveal.mp3',
  death: '/sounds/Death.mp3',
} as const;

const LOCAL_STORAGE_KEY = 'treasure-tower-audio-settings';

interface AudioSettings {
  bgmVolume: number;
  sfxVolume: number;
}

const DEFAULT_SETTINGS: AudioSettings = {
  bgmVolume: 0.5,
  sfxVolume: 0.7,
};

class AudioManager {
  private backgroundAudio: HTMLAudioElement | null = null;
  private cashoutAudio: HTMLAudioElement | null = null;
  private diamondAudio: HTMLAudioElement | null = null;
  private deathAudio: HTMLAudioElement | null = null;
  
  private _bgmVolume: number = DEFAULT_SETTINGS.bgmVolume;
  private _sfxVolume: number = DEFAULT_SETTINGS.sfxVolume;
  private isInitialized = false;
  private isPaused = false;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    if (typeof window === 'undefined') return;
    
    // Load settings immediately
    this.loadSettings();
    
    // Initialize audio on first user interaction
    const initAudio = () => {
      if (!this.isInitialized) {
        this.initialize();
      }
    };
    
    // Try to initialize on various events
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
  }

  private loadSettings() {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AudioSettings>;
        if (parsed.bgmVolume !== undefined) {
          this._bgmVolume = this.clampVolume(parsed.bgmVolume);
        }
        if (parsed.sfxVolume !== undefined) {
          this._sfxVolume = this.clampVolume(parsed.sfxVolume);
        }
      }
    } catch (_error) {
      // Keep defaults
    }
  }

  private saveSettings() {
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        bgmVolume: this._bgmVolume,
        sfxVolume: this._sfxVolume,
      }));
    } catch (_error) {
      // Ignore save errors
    }
  }

  private clampVolume(value: number): number {
    return Math.min(1, Math.max(0, value));
  }

  private safelyPlay(audio: HTMLAudioElement | null) {
    if (!audio) return;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {});
    }
  }

  private initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.backgroundAudio = new Audio(AUDIO_ASSETS.background);
    this.backgroundAudio.loop = true;
    this.backgroundAudio.preload = 'auto';
    this.backgroundAudio.volume = this._bgmVolume;

    this.cashoutAudio = new Audio(AUDIO_ASSETS.cashout);
    this.cashoutAudio.preload = 'auto';
    this.cashoutAudio.volume = this._sfxVolume;

    this.diamondAudio = new Audio(AUDIO_ASSETS.diamond);
    this.diamondAudio.preload = 'auto';
    this.diamondAudio.volume = this._sfxVolume;

    this.deathAudio = new Audio(AUDIO_ASSETS.death);
    this.deathAudio.preload = 'auto';
    this.deathAudio.volume = this._sfxVolume;

    this.isInitialized = true;
    
    // Try to play BGM if volume > 0
    if (this._bgmVolume > 0) {
      this.safelyPlay(this.backgroundAudio);
    }

    // Setup event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') return;

    // Game events
    window.addEventListener('game:safeReveal', () => this.playSfx('diamond'));
    window.addEventListener('game:trapReveal', () => this.playSfx('death'));
    window.addEventListener('game:cashout', () => this.playSfx('cashout'));

    // Settings events
    window.addEventListener('settings:open', () => this.pause());
    window.addEventListener('settings:close', () => this.resume());

    // Visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  // Public methods
  get bgmVolume(): number {
    return this._bgmVolume;
  }

  set bgmVolume(value: number) {
    this._bgmVolume = this.clampVolume(value);
    
    if (this.backgroundAudio) {
      this.backgroundAudio.volume = this._bgmVolume;
      if (this._bgmVolume <= 0) {
        this.backgroundAudio.pause();
      } else if (!this.isPaused) {
        this.safelyPlay(this.backgroundAudio);
      }
    } else {
      // Initialize if not already done
      this.initialize();
    }
    
    this.saveSettings();
    this.notifySubscribers();
  }

  get sfxVolume(): number {
    return this._sfxVolume;
  }

  set sfxVolume(value: number) {
    this._sfxVolume = this.clampVolume(value);
    
    if (this.isInitialized) {
      [this.cashoutAudio, this.diamondAudio, this.deathAudio].forEach(audio => {
        if (audio) audio.volume = this._sfxVolume;
      });
    }
    
    this.saveSettings();
    this.notifySubscribers();
  }

  pause() {
    this.isPaused = true;
    if (this.backgroundAudio) {
      this.backgroundAudio.pause();
    }
  }

  resume() {
    this.isPaused = false;
    if (this.backgroundAudio && this._bgmVolume > 0) {
      this.safelyPlay(this.backgroundAudio);
    }
  }

  playSfx(type: 'cashout' | 'diamond' | 'death') {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    if (this._sfxVolume <= 0) return;

    let audio: HTMLAudioElement | null = null;
    switch (type) {
      case 'cashout':
        audio = this.cashoutAudio;
        break;
      case 'diamond':
        audio = this.diamondAudio;
        break;
      case 'death':
        audio = this.deathAudio;
        break;
    }

    if (audio) {
      audio.currentTime = 0;
      audio.volume = this._sfxVolume;
      this.safelyPlay(audio);
    }
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  ensureInitialized() {
    if (!this.isInitialized) {
      this.initialize();
    }
  }
}

// Create singleton instance
const audioManager = typeof window !== 'undefined' ? new AudioManager() : null;

export default audioManager;

