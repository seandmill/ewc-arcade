/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { ArcadeProvider, useArcade } from './context/ArcadeContext';
import GameSwitcher from './components/shared/GameSwitcher';
import ProfileDisplay from './components/shared/ProfileDisplay';
import ProfileEditorModal from './components/shared/ProfileEditorModal';
import CityBuilderGame from './components/city-builder/CityBuilderGame';
import MathAdventureGame from './components/math-adventure/MathAdventureGame';
import MiniSkateGame from './components/mini-skate/MiniSkateGame';

// Inner component that uses arcade context
const ArcadeShell: React.FC = () => {
  const { state } = useArcade();
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-900 touch-none">
      {/* Profile Display - top-left, always visible */}
      <ProfileDisplay onOpenEditor={() => setIsProfileEditorOpen(true)} />

      {/* Game Switcher - always visible at top */}
      <GameSwitcher />

      {/* Game Container - offset for switcher */}
      <div className="absolute inset-0 pt-14">
        {state.activeGame === 'city-builder' && <CityBuilderGame />}
        {state.activeGame === 'math-adventure' && <MathAdventureGame />}
        {state.activeGame === 'mini-skate' && <MiniSkateGame />}
      </div>

      {/* Profile Editor Modal */}
      {isProfileEditorOpen && (
        <ProfileEditorModal onClose={() => setIsProfileEditorOpen(false)} />
      )}

      {/* Global CSS for animations */}
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .mask-image-b { -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%); mask-image: linear-gradient(to bottom, transparent 0%, black 15%); }
        .writing-mode-vertical { writing-mode: vertical-rl; text-orientation: mixed; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
};

// Main App with Provider wrapper
function App() {
  return (
    <ArcadeProvider>
      <ArcadeShell />
    </ArcadeProvider>
  );
}

export default App;
