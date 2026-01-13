/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useCallback, useEffect, useRef } from 'react';

// Sound asset paths
const SOUNDS = {
  click: '/assets/audio/click.ogg',
  select: '/assets/audio/select.ogg',
  correct: '/assets/audio/correct.ogg',
  correctAlt: '/assets/audio/correct_alt.ogg',
  correctAlt2: '/assets/audio/correct_alt2.ogg',
  wrong: '/assets/audio/wrong.ogg',
  wrongAlt: '/assets/audio/wrong_alt.ogg',
  celebration: '/assets/audio/celebration.ogg',
  levelComplete: '/assets/audio/jingles/level_complete.ogg',
  perfect: '/assets/audio/jingles/perfect.ogg',
  streak: '/assets/audio/jingles/streak.ogg',
} as const;

type SoundName = keyof typeof SOUNDS;

// Preloaded audio cache
const audioCache: Map<string, HTMLAudioElement> = new Map();

// Preload all sounds
function preloadSounds() {
  Object.entries(SOUNDS).forEach(([, path]) => {
    if (!audioCache.has(path)) {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioCache.set(path, audio);
    }
  });
}

export function useSound() {
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      preloadSounds();
      initialized.current = true;
    }
  }, []);

  const play = useCallback((name: SoundName, volume = 0.5) => {
    const path = SOUNDS[name];
    const cached = audioCache.get(path);

    if (cached) {
      // Clone to allow overlapping sounds
      const audio = cached.cloneNode() as HTMLAudioElement;
      audio.volume = volume;
      audio.play().catch(() => {
        // Ignore errors (usually user hasn't interacted yet)
      });
    }
  }, []);

  const playClick = useCallback(() => play('click', 0.3), [play]);
  const playSelect = useCallback(() => play('select', 0.4), [play]);
  const playCorrect = useCallback(() => {
    // Random variation for engagement
    const variants: SoundName[] = ['correct', 'correctAlt', 'correctAlt2'];
    play(variants[Math.floor(Math.random() * variants.length)], 0.5);
  }, [play]);
  const playWrong = useCallback(() => {
    const variants: SoundName[] = ['wrong', 'wrongAlt'];
    play(variants[Math.floor(Math.random() * variants.length)], 0.4);
  }, [play]);
  const playCelebration = useCallback(() => play('celebration', 0.6), [play]);
  const playLevelComplete = useCallback(() => play('levelComplete', 0.7), [play]);
  const playPerfect = useCallback(() => play('perfect', 0.7), [play]);
  const playStreak = useCallback(() => play('streak', 0.6), [play]);

  return {
    play,
    playClick,
    playSelect,
    playCorrect,
    playWrong,
    playCelebration,
    playLevelComplete,
    playPerfect,
    playStreak,
  };
}

export default useSound;
