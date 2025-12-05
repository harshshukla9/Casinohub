'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
  bgmVolume: 0.02,
  sfxVolume: 0.7,
};

const safelyPlay = (audio?: HTMLAudioElement | null) => {
  if (!audio) return;
  const playPromise = audio.play();
  if (playPromise) {
    playPromise.catch(() => {});
  }
};

const stopAndReset = (audio?: HTMLAudioElement | null) => {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
};

export const AudioController = () => {
  const backgroundRef = useRef<HTMLAudioElement | null>(null);
  const cashoutRef = useRef<HTMLAudioElement | null>(null);
  const diamondRef = useRef<HTMLAudioElement | null>(null);
  const deathRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(DEFAULT_SETTINGS.bgmVolume);
  const [sfxVolume, setSfxVolume] = useState(DEFAULT_SETTINGS.sfxVolume);
  const [buttonPosition, setButtonPosition] = useState({ top: 0, right: 0 });
  const [isMounted, setIsMounted] = useState(false);

  const clampVolume = (value: number) => Math.min(1, Math.max(0, value));

  const persistSettings = useCallback((settings: AudioSettings) => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
  }, []);

  const loadPersistedSettings = useCallback(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(stored) as Partial<AudioSettings>;
      return {
        bgmVolume: parsed.bgmVolume !== undefined ? clampVolume(parsed.bgmVolume) : DEFAULT_SETTINGS.bgmVolume,
        sfxVolume: parsed.sfxVolume !== undefined ? clampVolume(parsed.sfxVolume) : DEFAULT_SETTINGS.sfxVolume,
      };
    } catch (_error) {
      return DEFAULT_SETTINGS;
    }
  }, []);

  useEffect(() => {
    const settings = loadPersistedSettings();
    setBgmVolume(settings.bgmVolume);
    setSfxVolume(settings.sfxVolume);
    setIsMounted(true);
  }, [loadPersistedSettings]);

  useEffect(() => {
    persistSettings({ bgmVolume, sfxVolume });
  }, [bgmVolume, persistSettings, sfxVolume]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    backgroundRef.current = new Audio(AUDIO_ASSETS.background);
    backgroundRef.current.loop = true;
    backgroundRef.current.preload = 'auto';

    cashoutRef.current = new Audio(AUDIO_ASSETS.cashout);
    cashoutRef.current.preload = 'auto';

    diamondRef.current = new Audio(AUDIO_ASSETS.diamond);
    diamondRef.current.preload = 'auto';

    deathRef.current = new Audio(AUDIO_ASSETS.death);
    deathRef.current.preload = 'auto';

    setIsReady(true);

    return () => {
      stopAndReset(backgroundRef.current);
      stopAndReset(cashoutRef.current);
      stopAndReset(diamondRef.current);
      stopAndReset(deathRef.current);
      backgroundRef.current = null;
      cashoutRef.current = null;
      diamondRef.current = null;
      deathRef.current = null;
    };
  }, []);

  const applyVolumes = useCallback(() => {
    if (!isReady) {
      return;
    }

    if (backgroundRef.current) {
      backgroundRef.current.volume = bgmVolume;
      if (bgmVolume <= 0) {
        backgroundRef.current.pause();
      } else {
        safelyPlay(backgroundRef.current);
      }
    }

    const sfxAudios = [cashoutRef.current, diamondRef.current, deathRef.current];
    sfxAudios.forEach((audio) => {
      if (!audio) return;
      audio.volume = sfxVolume;
    });
  }, [bgmVolume, isReady, sfxVolume]);

  useEffect(() => {
    applyVolumes();
  }, [applyVolumes]);

  useEffect(() => {
    if (!isReady || !backgroundRef.current) {
      return;
    }

    if (bgmVolume > 0) {
      safelyPlay(backgroundRef.current);
    }

    const handleInteraction = () => {
      if (bgmVolume > 0) {
        safelyPlay(backgroundRef.current);
      }
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };

    window.addEventListener('pointerdown', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [bgmVolume, isReady]);

  const playSfx = useCallback(
    (audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
      if (sfxVolume <= 0) {
        return;
      }
      const audio = audioRef.current;
      if (!audio) {
        return;
      }
      stopAndReset(audio);
      audio.volume = sfxVolume;
      safelyPlay(audio);
    },
    [sfxVolume],
  );

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const handleSafeReveal = () => {
      playSfx(diamondRef);
    };

    const handleTrapReveal = () => {
      playSfx(deathRef);
    };

    const handleCashout = () => {
      playSfx(cashoutRef);
    };

    window.addEventListener('game:safeReveal', handleSafeReveal);
    window.addEventListener('game:trapReveal', handleTrapReveal);
    window.addEventListener('game:cashout', handleCashout);

    return () => {
      window.removeEventListener('game:safeReveal', handleSafeReveal);
      window.removeEventListener('game:trapReveal', handleTrapReveal);
      window.removeEventListener('game:cashout', handleCashout);
    };
  }, [isReady, playSfx]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (buttonRef.current?.contains(target)) {
        return;
      }
      
      const panel = document.getElementById('audio-controls-panel');
      if (panel?.contains(target)) {
        return;
      }
      
      setIsExpanded(false);
    };

    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isExpanded]);

  const formatVolume = (value: number) => `${Math.round(value * 100)}%`;

  const toggleBgmMute = () => {
    setBgmVolume((prev) => (prev <= 0 ? DEFAULT_SETTINGS.bgmVolume : 0));
  };

  const toggleSfxMute = () => {
    setSfxVolume((prev) => (prev <= 0 ? DEFAULT_SETTINGS.sfxVolume : 0));
  };

  useEffect(() => {
    if (!isExpanded || !buttonRef.current) {
      return;
    }

    const updatePosition = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setButtonPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isExpanded]);

  const audioPanel = isExpanded && isMounted ? (
    <div
      id="audio-controls-panel"
      role="dialog"
      aria-label="Game audio settings"
      className="fixed w-64 rounded-xl bg-black/95 border border-white/20 shadow-2xl backdrop-blur-md p-4 space-y-4 z-[99999]"
      style={{
        top: `${buttonPosition.top}px`,
        right: `${buttonPosition.right}px`,
        pointerEvents: 'auto',
        touchAction: 'auto',
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-200">
          <span>Background Music</span>
          <span>{formatVolume(bgmVolume)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(bgmVolume * 100)}
          onChange={(event) => {
            event.stopPropagation();
            setBgmVolume(clampVolume(Number(event.target.value) / 100));
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full accent-yellow-500 cursor-pointer"
          style={{ touchAction: 'none' }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleBgmMute();
          }}
          className="w-full text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          {bgmVolume <= 0 ? 'Unmute Background' : 'Mute Background'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-200">
          <span>Sound Effects</span>
          <span>{formatVolume(sfxVolume)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(sfxVolume * 100)}
          onChange={(event) => {
            event.stopPropagation();
            setSfxVolume(clampVolume(Number(event.target.value) / 100));
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full accent-emerald-500 cursor-pointer"
          style={{ touchAction: 'none' }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSfxMute();
          }}
          className="w-full text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white"
        >
          {sfxVolume <= 0 ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isExpanded}
        aria-controls="audio-controls-panel"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="px-2 py-1 rounded-full bg-black/40 border border-white/10 text-white hover:bg-black/60 transition-colors"
      >
        <span aria-hidden="true">{bgmVolume <= 0 && sfxVolume <= 0 ? '🔇' : '🔊'}</span>
      </button>

      {isMounted && typeof document !== 'undefined' && createPortal(audioPanel, document.body)}
    </div>
  );
};
