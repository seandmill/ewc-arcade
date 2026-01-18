/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { GameType, useArcade } from '../../context/ArcadeContext';
import { useSound } from '../../hooks/useSound';

interface GameInfo {
  id: GameType;
  name: string;
  icon: string;
  getProgress: () => string;
}

const GameSwitcher: React.FC = () => {
  const { state, setActiveGame, getTotalStars } = useArcade();
  const { playClick } = useSound();

  const games: GameInfo[] = [
    {
      id: 'city-builder',
      name: 'City Builder',
      icon: '🏙️',
      getProgress: () => `Day ${state.cityProgress.daysPlayed || 1}`,
    },
    {
      id: 'math-adventure',
      name: 'Math Quest',
      icon: '🔢',
      getProgress: () => {
        const stars = getTotalStars();
        return stars > 0 ? `${stars} ★` : 'New!';
      },
    },
    {
      id: 'mini-skate',
      name: 'Mini Skate',
      icon: '🛹',
      getProgress: () => {
        const tricks = state.skateProgress.totalTricks;
        return tricks > 0 ? `${tricks} tricks` : 'New!';
      },
    },
  ];

  const handleGameChange = (gameId: GameType) => {
    if (gameId !== state.activeGame) {
      playClick();
      setActiveGame(gameId);
    }
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto">
      <div className="flex justify-center pt-2 px-2">
        <div className="flex bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden">
          {games.map((game) => {
            const isActive = state.activeGame === game.id;
            return (
              <button
                key={game.id}
                onClick={() => handleGameChange(game.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 transition-all duration-200
                  ${isActive
                    ? 'bg-cyan-600/30 border-b-2 border-cyan-400'
                    : 'hover:bg-white/10 border-b-2 border-transparent'
                  }
                `}
              >
                <span className="text-xl">{game.icon}</span>
                <div className="flex flex-col items-start">
                  <span className={`text-sm font-bold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                    {game.name}
                  </span>
                  <span className={`text-[10px] ${isActive ? 'text-cyan-300' : 'text-gray-500'}`}>
                    {game.getProgress()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GameSwitcher;
