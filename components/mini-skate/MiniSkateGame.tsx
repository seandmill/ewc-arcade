/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useArcade } from '../../context/ArcadeContext';
import { useSound } from '../../hooks/useSound';
import SkateCanvas from './SkateCanvas';
import SkateUI from './SkateUI';
import { useSkateControls, InputState } from './useSkateControls';
import { SkaterState } from './Skater';

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

  // Controls
  const { input, updateJoystick, setTouchButton } = useSkateControls();

  // Handle trick performed
  const handleTrickPerformed = useCallback((trickName: string) => {
    playCorrect();
    setTrickCount((prev) => prev + 1);
    setComboCount((prev) => prev + 1);
    setLastTrick(trickName);

    // Update global progress
    updateSkateProgress({
      totalTricks: state.skateProgress.totalTricks + 1,
      bestCombo: Math.max(state.skateProgress.bestCombo, comboCount + 1),
    });
  }, [playCorrect, updateSkateProgress, state.skateProgress, comboCount]);

  // Handle skater state update
  const handleSkaterUpdate = useCallback((newState: SkaterState) => {
    setSkaterState(newState);

    // Reset combo when landing (grounded and was airborne)
    if (newState.isGrounded && skaterState && !skaterState.isGrounded) {
      // Small delay to allow combo to register
      setTimeout(() => {
        setComboCount(0);
      }, 100);
    }
  }, [skaterState]);

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
          {state.skateProgress.totalTricks > 0 && (
            <div className="mt-8 text-white/60 text-sm">
              Total tricks: {state.skateProgress.totalTricks} | Best combo: {state.skateProgress.bestCombo}x
            </div>
          )}
        </div>
      </div>
    );
  }

  // Paused screen overlay
  const PauseOverlay = () => (
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
  );

  // Playing phase
  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <SkateCanvas
        character={character}
        input={input}
        onSkaterUpdate={handleSkaterUpdate}
        onTrickPerformed={handleTrickPerformed}
      />

      {/* UI Overlay */}
      <SkateUI
        skaterState={skaterState}
        trickCount={trickCount}
        comboCount={comboCount}
        lastTrick={lastTrick}
        onJoystickMove={handleJoystickMove}
        onButtonPress={handleButtonPress}
        onPause={handlePause}
      />

      {/* Pause overlay */}
      {phase === 'paused' && <PauseOverlay />}
    </div>
  );
};

export default MiniSkateGame;
