/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds } from '@react-three/drei';
import { useArcade } from '../../context/ArcadeContext';
import { useSound } from '../../hooks/useSound';
import CharacterModel from './CharacterModel';

interface ProfileDisplayProps {
  onOpenEditor: () => void;
}

const ProfileDisplay: React.FC<ProfileDisplayProps> = ({ onOpenEditor }) => {
  const { state } = useArcade();
  const { playerProfile } = state;
  const { playClick } = useSound();

  const handleClick = () => {
    playClick();
    onOpenEditor();
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-2 right-2 z-[60] flex items-center gap-2 px-2 py-1.5
                 bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700/50
                 hover:bg-gray-800/90 hover:border-cyan-500/50 hover:scale-105
                 active:scale-95 transition-all duration-200
                 pointer-events-auto cursor-pointer"
      aria-label="Edit profile"
    >
      {/* 3D Character Preview */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-cyan-900/50 to-purple-900/50">
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ width: '100%', height: '100%' }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[2, 3, 2]} intensity={1.2} />
          <Suspense fallback={null}>
            <Bounds fit clip observe margin={1.2}>
              <CharacterModel
                characterId={playerProfile.characterId}
                autoRotate={false}
                scale={1}
              />
            </Bounds>
          </Suspense>
        </Canvas>
      </div>

      {/* Player Name */}
      <span className="text-white font-medium text-sm pr-1 max-w-[80px] truncate">
        {playerProfile.playerName}
      </span>
    </button>
  );
};

export default ProfileDisplay;
