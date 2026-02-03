/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useArcade } from '../../context/ArcadeContext';
import { useSound } from '../../hooks/useSound';
import SkateCanvas from './SkateCanvas';
import SkateUI from './SkateUI';
import { useSkateControls, InputState } from './useSkateControls';
import { SkaterState } from './Skater';
import { STARS } from './skateConstants';

type GamePhase = 'menu' | 'playing' | 'paused';
type SkateCharacter = 'boy' | 'girl';

const MiniSkateGame: React.FC = () => {
  const { state, updateSkateProgress } = useArcade();
  const { playClick, playCorrect } = useSound();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [character, setCharacter] = useState<SkateCharacter>(
    state.skateProgress.favoriteCharacter || 'boy'
  );
  const [skaterState, setSkaterState] = useState<SkaterState | null>(null);
  const [trickCount, setTrickCount] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [lastTrick, setLastTrick] = useState<string | null>(null);
  const [sessionStars, setSessionStars] = useState<number[]>([]); // Stars collected this session
  const [starFlash, setStarFlash] = useState<{ points: number; show: boolean }>({ points: 0, show: false });

  // Skater position for star collision - use ref for performance
  const skaterPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  const skaterPosition = useMemo(() => skaterPositionRef.current, []);

  // Combine persisted and session stars for filtering
  const allCollectedStars = useMemo(() => {
    const combined = [...state.skateProgress.collectedStars, ...sessionStars];
    return [...new Set(combined)]; // Remove duplicates
  }, [state.skateProgress.collectedStars, sessionStars]);

  // Refs to avoid stale closures in callbacks passed to R3F components
  const comboCountRef = useRef(comboCount);
  const trickCountRef = useRef(0);
  const bestComboRef = useRef(state.skateProgress.bestCombo);
  const prevGroundedRef = useRef(true);

  // Keep refs in sync with state
  useEffect(() => {
    comboCountRef.current = comboCount;
  }, [comboCount]);

  useEffect(() => {
    trickCountRef.current = state.skateProgress.totalTricks;
    bestComboRef.current = state.skateProgress.bestCombo;
  }, [state.skateProgress.totalTricks, state.skateProgress.bestCombo]);

  // Controls
  const { input, updateJoystick, setTouchButton } = useSkateControls();

  // Handle trick performed - stable callback using refs to avoid stale closures
  const handleTrickPerformed = useCallback((trickName: string) => {
    playCorrect();
    setTrickCount((prev) => prev + 1);
    setComboCount((prev) => prev + 1);
    setLastTrick(trickName);

    // Use refs to get current values (avoids stale closure)
    const newTrickCount = trickCountRef.current + 1;
    const newCombo = comboCountRef.current + 1;
    const newBestCombo = Math.max(bestComboRef.current, newCombo);

    updateSkateProgress({
      totalTricks: newTrickCount,
      bestCombo: newBestCombo,
    });
  }, [playCorrect, updateSkateProgress]);

  // Handle skater state update - stable callback using refs
  const handleSkaterUpdate = useCallback((newState: SkaterState) => {
    setSkaterState(newState);

    // Update skater position ref for star collision detection
    skaterPositionRef.current.copy(newState.position);

    // Reset combo when landing (grounded and was airborne)
    // Use ref to track previous grounded state to avoid stale closure
    if (newState.isGrounded && !prevGroundedRef.current) {
      // Small delay to allow combo to register
      setTimeout(() => {
        setComboCount(0);
      }, 100);
    }
    prevGroundedRef.current = newState.isGrounded;
  }, []);

  // Handle star collection
  const handleStarCollected = useCallback((starId: number, points: number) => {
    // Skip if already collected (either this session or previously)
    if (sessionStars.includes(starId) || state.skateProgress.collectedStars.includes(starId)) {
      return;
    }

    playCorrect();
    setSessionStars((prev) => [...prev, starId]);
    setStarFlash({ points, show: true });

    // Hide flash after delay
    setTimeout(() => {
      setStarFlash((prev) => ({ ...prev, show: false }));
    }, 1000);

    // Update persistent progress
    const newCollectedStars = [...state.skateProgress.collectedStars, starId];
    const newTotalPoints = state.skateProgress.totalStarPoints + points;

    updateSkateProgress({
      collectedStars: newCollectedStars,
      totalStarPoints: newTotalPoints,
    });
  }, [sessionStars, state.skateProgress.collectedStars, state.skateProgress.totalStarPoints, playCorrect, updateSkateProgress]);

  // Handle joystick movement from UI
  const handleJoystickMove = useCallback((x: number, y: number, active: boolean) => {
    updateJoystick(x, y, active);
  }, [updateJoystick]);

  // Handle button press from UI
  const handleButtonPress = useCallback((button: string, pressed: boolean) => {
    setTouchButton(button as keyof InputState, pressed);
  }, [setTouchButton]);

  // Start game
  const handleStart = useCallback(() => {
    playClick();
    setPhase('playing');
    setTrickCount(0);
    setComboCount(0);
    setSessionStars([]);
    skaterPositionRef.current.set(0, 0, 0); // Reset position
    updateSkateProgress({
      sessionsPlayed: state.skateProgress.sessionsPlayed + 1,
      favoriteCharacter: character,
    });
  }, [playClick, character, updateSkateProgress, state.skateProgress.sessionsPlayed]);

  // Pause/Resume
  const handlePause = useCallback(() => {
    playClick();
    setPhase('paused');
  }, [playClick]);

  const handleResume = useCallback(() => {
    playClick();
    setPhase('playing');
  }, [playClick]);

  // Return to menu
  const handleExit = useCallback(() => {
    playClick();
    setPhase('menu');
    setTrickCount(0);
    setComboCount(0);
  }, [playClick]);

  // Character selection
  const handleCharacterSelect = useCallback((char: SkateCharacter) => {
    playClick();
    setCharacter(char);
  }, [playClick]);

  // Menu screen
  if (phase === 'menu') {
    return (
      <div className="relative w-full h-full bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 text-8xl">🛹</div>
          <div className="absolute bottom-20 right-20 text-8xl rotate-12">🛹</div>
          <div className="absolute top-1/3 right-10 text-6xl -rotate-12">🛹</div>
        </div>

        <div className="relative z-10 text-center">
          {/* Title */}
          <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
            Mini Skate
          </h1>
          <p className="text-xl text-white/80 mb-8">Free Skate Mode</p>

          {/* Character Selection */}
          <div className="mb-8">
            <p className="text-white/80 text-sm mb-4">Choose your skater:</p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleCharacterSelect('boy')}
                className={`w-24 h-32 rounded-xl transition-all ${
                  character === 'boy'
                    ? 'bg-cyan-500 scale-110 ring-4 ring-white'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <div className="text-4xl mb-2">🧑</div>
                <div className="text-white font-bold">Boy</div>
              </button>
              <button
                onClick={() => handleCharacterSelect('girl')}
                className={`w-24 h-32 rounded-xl transition-all ${
                  character === 'girl'
                    ? 'bg-pink-500 scale-110 ring-4 ring-white'
                    : 'bg-white/20 hover:bg-white/30'
                }`}
              >
                <div className="text-4xl mb-2">👧</div>
                <div className="text-white font-bold">Girl</div>
              </button>
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="px-8 py-4 bg-green-500 hover:bg-green-400 text-white text-xl font-bold rounded-xl shadow-lg hover:scale-105 transition-all"
          >
            Start Skating!
          </button>

          {/* Stats */}
          <div className="mt-8 space-y-2">
            {/* Star progress */}
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <span className="text-2xl">⭐</span>
              <span className="font-bold text-lg">
                {state.skateProgress.collectedStars.length} / {STARS.length}
              </span>
              <span className="text-sm text-white/60">stars collected</span>
            </div>

            {/* Trick stats */}
            {state.skateProgress.totalTricks > 0 && (
              <div className="text-white/60 text-sm">
                Total tricks: {state.skateProgress.totalTricks} | Best combo: {state.skateProgress.bestCombo}x
              </div>
            )}

            {/* Points */}
            {state.skateProgress.totalStarPoints > 0 && (
              <div className="text-cyan-400 text-sm">
                Total Points: {state.skateProgress.totalStarPoints}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <SkateCanvas
        character={character}
        input={input}
        onSkaterUpdate={handleSkaterUpdate}
        onTrickPerformed={handleTrickPerformed}
        collectedStars={allCollectedStars}
        onStarCollected={handleStarCollected}
        skaterPosition={skaterPosition}
      />

      {/* UI Overlay */}
      <SkateUI
        skaterState={skaterState}
        trickCount={trickCount}
        comboCount={comboCount}
        lastTrick={lastTrick}
        starsCollected={allCollectedStars.length}
        totalStars={STARS.length}
        onJoystickMove={handleJoystickMove}
        onButtonPress={handleButtonPress}
        onPause={handlePause}
      />

      {/* Star collection flash */}
      {starFlash.show && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
          <div
            className="text-5xl font-black text-yellow-400 animate-bounce"
            style={{
              textShadow: '0 0 30px rgba(255,215,0,0.9), 0 4px 8px rgba(0,0,0,0.5)',
            }}
          >
            +{starFlash.points} ⭐
          </div>
        </div>
      )}

      {/* Pause overlay - inline JSX to avoid component recreation on re-render */}
      {phase === 'paused' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Paused</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleResume}
                className="px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg"
              >
                Resume
              </button>
              <button
                onClick={handleExit}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg"
              >
                Exit to Menu
              </button>
            </div>
            <div className="mt-6 text-white/60 text-sm">
              Tricks this session: {trickCount}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniSkateGame;
