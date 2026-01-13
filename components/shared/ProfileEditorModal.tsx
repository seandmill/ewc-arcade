/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds } from '@react-three/drei';
import { useArcade } from '../../context/ArcadeContext';
import { useSound } from '../../hooks/useSound';
import { PLAYER_CHARACTERS, MAX_NAME_LENGTH } from '../../constants';
import CharacterModel from './CharacterModel';

interface ProfileEditorModalProps {
  onClose: () => void;
}

const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({ onClose }) => {
  const { state, updatePlayerProfile } = useArcade();
  const { playClick, playCorrect } = useSound();

  // Local state for editing
  const [selectedCharacter, setSelectedCharacter] = useState(state.playerProfile.characterId);
  const [playerName, setPlayerName] = useState(state.playerProfile.playerName);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCharacterSelect = (characterId: string) => {
    playClick();
    setSelectedCharacter(characterId);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_NAME_LENGTH);
    setPlayerName(value);
  };

  const handleSave = () => {
    const trimmedName = playerName.trim() || 'Player';
    updatePlayerProfile({
      characterId: selectedCharacter,
      playerName: trimmedName,
    });
    playCorrect();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-[90vw] max-w-md bg-gray-900/95 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
          <h2 className="text-lg font-bold text-white">Edit Profile</h2>
          <button
            onClick={() => { playClick(); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-red-600 transition-colors"
            aria-label="Close"
          >
            <span className="text-white text-lg leading-none">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Large Character Preview */}
          <div className="mx-auto w-40 h-40 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-gray-700/50">
            <Canvas
              camera={{ position: [0, 0, 3], fov: 50 }}
              gl={{ antialias: true, alpha: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.8} />
              <directionalLight position={[3, 4, 3]} intensity={1.5} />
              <Suspense fallback={null}>
                <Bounds fit clip observe margin={1.2}>
                  <CharacterModel
                    characterId={selectedCharacter}
                    autoRotate={true}
                    scale={1}
                  />
                </Bounds>
              </Suspense>
            </Canvas>
          </div>

          {/* Character Grid */}
          <div className="grid grid-cols-4 gap-2">
            {PLAYER_CHARACTERS.map((char) => (
              <button
                key={char.id}
                onClick={() => handleCharacterSelect(char.id)}
                className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-150
                  ${selectedCharacter === char.id
                    ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-gray-900 scale-105'
                    : 'hover:scale-105 hover:ring-1 hover:ring-gray-500'
                  }
                  bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/50`}
                aria-label={`Select ${char.label}`}
              >
                <Canvas
                  camera={{ position: [0, 0, 3], fov: 50 }}
                  gl={{ antialias: true, alpha: true }}
                  frameloop="demand"
                  style={{ width: '100%', height: '100%' }}
                >
                  <ambientLight intensity={0.8} />
                  <directionalLight position={[2, 3, 2]} intensity={1.2} />
                  <Suspense fallback={null}>
                    <Bounds fit clip observe margin={1.2}>
                      <CharacterModel
                        characterId={char.id}
                        autoRotate={false}
                        scale={1}
                      />
                    </Bounds>
                  </Suspense>
                </Canvas>
                {/* Character label tooltip on hover would go here */}
              </button>
            ))}
          </div>

          {/* Name Input */}
          <div className="space-y-1">
            <label htmlFor="player-name" className="block text-sm font-medium text-gray-300">
              Your Name
            </label>
            <div className="relative">
              <input
                id="player-name"
                type="text"
                value={playerName}
                onChange={handleNameChange}
                maxLength={MAX_NAME_LENGTH}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:ring-2
                         focus:ring-cyan-500 focus:border-transparent transition-all"
                autoComplete="off"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {playerName.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
                     text-white font-bold rounded-lg transition-all duration-200
                     hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-cyan-900/30"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditorModal;
