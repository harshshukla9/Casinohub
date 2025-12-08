'use client';

import { useEffect, useState } from 'react';
import audioManager from '@/lib/audioManager';

export const AudioController = () => {
  const [bgmVolume, setBgmVolume] = useState(audioManager?.bgmVolume ?? 0.5);
  const [sfxVolume, setSfxVolume] = useState(audioManager?.sfxVolume ?? 0.7);

  // Subscribe to audio manager updates
  useEffect(() => {
    if (!audioManager) return;

    // Sync initial values
    setBgmVolume(audioManager.bgmVolume);
    setSfxVolume(audioManager.sfxVolume);

    // Subscribe to changes
    const unsubscribe = audioManager.subscribe(() => {
      if (audioManager) {
        setBgmVolume(audioManager.bgmVolume);
        setSfxVolume(audioManager.sfxVolume);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleBgmChange = (value: number) => {
    if (audioManager) {
      audioManager.bgmVolume = value;
      audioManager.ensureInitialized();
    }
  };

  const handleSfxChange = (value: number) => {
    if (audioManager) {
      audioManager.sfxVolume = value;
      audioManager.ensureInitialized();
    }
  };

  const formatVolume = (value: number) => `${Math.round(value * 100)}%`;

  const toggleBgmMute = () => {
    if (audioManager) {
      audioManager.bgmVolume = bgmVolume <= 0 ? 0.5 : 0;
    }
  };

  const toggleSfxMute = () => {
    if (audioManager) {
      audioManager.sfxVolume = sfxVolume <= 0 ? 0.7 : 0;
    }
  };

  return (
    <div 
      className="w-full space-y-3"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Background Music</span>
          <span className="text-xs text-white/60">{formatVolume(bgmVolume)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(bgmVolume * 100)}
          onChange={(e) => {
            e.stopPropagation();
            handleBgmChange(Number(e.target.value) / 100);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleBgmMute();
          }}
          className="w-full text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
        >
          {bgmVolume <= 0 ? 'Unmute BGM' : 'Mute BGM'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Sound Effects</span>
          <span className="text-xs text-white/60">{formatVolume(sfxVolume)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(sfxVolume * 100)}
          onChange={(e) => {
            e.stopPropagation();
            handleSfxChange(Number(e.target.value) / 100);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSfxMute();
          }}
          className="w-full text-xs px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
        >
          {sfxVolume <= 0 ? 'Unmute SFX' : 'Mute SFX'}
        </button>
      </div>
    </div>
  );
};
