# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EWC Arcade is a multi-game arcade for kids featuring educational games. Currently includes:
- **City Builder (SkyMetropolis)**: Isometric 3D city-building with drag-and-drop placement
- **Math Quest**: JumpStart-inspired math adventure game with levels, stars, and achievements

Built with React Three Fiber for 3D rendering. Uses Kenney Game Assets for UI and audio.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build for production
npm run preview   # Preview production build
```

## Architecture

### Multi-Game Structure
```
App.tsx (Arcade Shell)
├── ArcadeProvider (context/ArcadeContext.tsx)
├── GameSwitcher (components/shared/)
├── CityBuilderGame (components/city-builder/)
└── MathAdventureGame (components/math-adventure/)
```

### Core Systems

**ArcadeContext** (`context/ArcadeContext.tsx`): Global state management with localStorage persistence. Tracks active game, per-game progress, achievements, and coins.

**GameSwitcher** (`components/shared/GameSwitcher.tsx`): Tab-based navigation with progress badges. City builder is default game.

**Sound System** (`hooks/useSound.ts`): Preloads and plays Kenney audio assets (click, correct, wrong, celebration).

### City Builder (`components/city-builder/`)
- `CityBuilderGame.tsx` - Game state, drag-and-drop, game loop (2s tick rate)
- Uses `IsoMap.tsx` for R3F canvas and `UIOverlay.tsx` for HUD
- Instanced meshes for traffic (30 cars) and population (300 pedestrians)

### Math Adventure (`components/math-adventure/`)
- `MathAdventureGame.tsx` - Self-contained math game with phases:
  - `level-intro`: Story prompt, "Let's Go!" button
  - `playing`: Problem display, 4 answer choices
  - `correct/wrong`: Feedback with sounds
  - `level-complete`: Stars, coins, next level
- Problem types by level: 1-10 addition, 11-20 subtraction, 21-30 mixed, 31-40 multiplication

### Assets (`public/assets/`)
- `ui/` - Kenney button images (green, red, blue, yellow)
- `audio/` - Sound effects (click.ogg, correct.ogg, wrong.ogg, celebration.ogg)
- `emotes/` - Expression images (happy, sad, star, exclamation)

## Key Patterns

**Drag-and-Drop (City Builder)**: Global pointer listeners with refs shared between React state and R3F render loop. `DragManager` performs per-frame raycasting.

**Procedural Buildings**: Deterministic hash function based on grid coordinates generates 2-3 visual variants per building type.

**Game Progress Persistence**: `ArcadeContext` auto-syncs to localStorage on every state change. Merges with initial state on load for forward compatibility.

## Tech Stack
- React 19 + TypeScript
- React Three Fiber + drei for 3D
- Tailwind CSS (via CDN)
- Vite for bundling
- Kenney Game Assets for UI/audio

## Adding New Games

1. Create game component in `components/<game-name>/`
2. Add game type to `GameType` union in `ArcadeContext.tsx`
3. Add progress interface and initial state to context
4. Register in `GameSwitcher.tsx` games array
5. Add conditional render in `App.tsx` ArcadeShell
