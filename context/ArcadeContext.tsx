/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { DEFAULT_CHARACTER_ID, DEFAULT_PLAYER_NAME, MAX_NAME_LENGTH } from '../constants';

// Game types
export type GameType = 'city-builder' | 'math-adventure' | 'mini-skate';

// Player profile
export interface PlayerProfile {
  characterId: string;
  playerName: string;
}

// Math Adventure progress
export interface MathProgress {
  currentLevel: number;
  levelStars: Record<number, number>; // level -> stars (0-3)
  totalCoins: number;
  problemsSolved: number;
  bestStreak: number;
  achievements: string[];
}

// City Builder progress (lightweight - the actual grid is managed separately)
export interface CityProgress {
  highestPopulation: number;
  highestMoney: number;
  daysPlayed: number;
}

// Mini Skate progress
export interface SkateProgress {
  totalTricks: number;
  bestCombo: number;
  sessionsPlayed: number;
  favoriteCharacter: 'boy' | 'girl' | null;
  collectedStars: number[]; // Array of collected star IDs
  totalStarPoints: number; // Total points from stars
  achievements: string[]; // Unlocked achievement IDs
}

// Full arcade state
export interface ArcadeState {
  version: number;
  activeGame: GameType;
  playerProfile: PlayerProfile;
  mathProgress: MathProgress;
  cityProgress: CityProgress;
  skateProgress: SkateProgress;
}

// Initial state
const initialPlayerProfile: PlayerProfile = {
  characterId: DEFAULT_CHARACTER_ID,
  playerName: DEFAULT_PLAYER_NAME,
};

const initialMathProgress: MathProgress = {
  currentLevel: 1,
  levelStars: {},
  totalCoins: 0,
  problemsSolved: 0,
  bestStreak: 0,
  achievements: [],
};

const initialCityProgress: CityProgress = {
  highestPopulation: 0,
  highestMoney: 0,
  daysPlayed: 0,
};

const initialSkateProgress: SkateProgress = {
  totalTricks: 0,
  bestCombo: 0,
  sessionsPlayed: 0,
  favoriteCharacter: null,
  collectedStars: [],
  totalStarPoints: 0,
  achievements: [],
};

const initialState: ArcadeState = {
  version: 1,
  activeGame: 'city-builder',
  playerProfile: initialPlayerProfile,
  mathProgress: initialMathProgress,
  cityProgress: initialCityProgress,
  skateProgress: initialSkateProgress,
};

// Actions
type ArcadeAction =
  | { type: 'SET_ACTIVE_GAME'; payload: GameType }
  | { type: 'UPDATE_PLAYER_PROFILE'; payload: Partial<PlayerProfile> }
  | { type: 'UPDATE_MATH_PROGRESS'; payload: Partial<MathProgress> }
  | { type: 'UPDATE_CITY_PROGRESS'; payload: Partial<CityProgress> }
  | { type: 'UPDATE_SKATE_PROGRESS'; payload: Partial<SkateProgress> }
  | { type: 'COMPLETE_MATH_LEVEL'; payload: { level: number; stars: number; coins: number } }
  | { type: 'ADD_ACHIEVEMENT'; payload: string }
  | { type: 'LOAD_STATE'; payload: ArcadeState };

// Reducer
function arcadeReducer(state: ArcadeState, action: ArcadeAction): ArcadeState {
  switch (action.type) {
    case 'SET_ACTIVE_GAME':
      return { ...state, activeGame: action.payload };

    case 'UPDATE_PLAYER_PROFILE': {
      const newName = action.payload.playerName !== undefined
        ? action.payload.playerName.slice(0, MAX_NAME_LENGTH)
        : state.playerProfile.playerName;
      return {
        ...state,
        playerProfile: {
          ...state.playerProfile,
          ...action.payload,
          playerName: newName,
        },
      };
    }

    case 'UPDATE_MATH_PROGRESS':
      return {
        ...state,
        mathProgress: { ...state.mathProgress, ...action.payload },
      };

    case 'UPDATE_CITY_PROGRESS':
      return {
        ...state,
        cityProgress: { ...state.cityProgress, ...action.payload },
      };

    case 'UPDATE_SKATE_PROGRESS':
      return {
        ...state,
        skateProgress: { ...state.skateProgress, ...action.payload },
      };

    case 'COMPLETE_MATH_LEVEL': {
      const { level, stars, coins } = action.payload;
      const currentStars = state.mathProgress.levelStars[level] || 0;
      const newStars = Math.max(currentStars, stars);

      return {
        ...state,
        mathProgress: {
          ...state.mathProgress,
          levelStars: { ...state.mathProgress.levelStars, [level]: newStars },
          currentLevel: Math.max(state.mathProgress.currentLevel, level + 1),
          totalCoins: state.mathProgress.totalCoins + coins,
        },
      };
    }

    case 'ADD_ACHIEVEMENT': {
      if (state.mathProgress.achievements.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        mathProgress: {
          ...state.mathProgress,
          achievements: [...state.mathProgress.achievements, action.payload],
        },
      };
    }

    case 'LOAD_STATE':
      return action.payload;

    default:
      return state;
  }
}

// Context
interface ArcadeContextValue {
  state: ArcadeState;
  dispatch: React.Dispatch<ArcadeAction>;
  setActiveGame: (game: GameType) => void;
  updatePlayerProfile: (profile: Partial<PlayerProfile>) => void;
  completeMathLevel: (level: number, stars: number, coins: number) => void;
  updateMathProgress: (progress: Partial<MathProgress>) => void;
  updateCityProgress: (progress: Partial<CityProgress>) => void;
  updateSkateProgress: (progress: Partial<SkateProgress>) => void;
  addAchievement: (achievement: string) => void;
  getTotalStars: () => number;
}

const ArcadeContext = createContext<ArcadeContextValue | null>(null);

// Storage key
const STORAGE_KEY = 'ewc-arcade-state';

// Provider component
export function ArcadeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(arcadeReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ArcadeState;
        // Merge with initial state to handle new fields
        dispatch({
          type: 'LOAD_STATE',
          payload: {
            ...initialState,
            ...parsed,
            playerProfile: { ...initialPlayerProfile, ...parsed.playerProfile },
            mathProgress: { ...initialMathProgress, ...parsed.mathProgress },
            cityProgress: { ...initialCityProgress, ...parsed.cityProgress },
            skateProgress: { ...initialSkateProgress, ...parsed.skateProgress },
          },
        });
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore write errors
    }
  }, [state]);

  // Helper functions - memoized to prevent re-render cascades
  const setActiveGame = useCallback((game: GameType) => {
    dispatch({ type: 'SET_ACTIVE_GAME', payload: game });
  }, []);

  const updatePlayerProfile = useCallback((profile: Partial<PlayerProfile>) => {
    dispatch({ type: 'UPDATE_PLAYER_PROFILE', payload: profile });
  }, []);

  const completeMathLevel = useCallback((level: number, stars: number, coins: number) => {
    dispatch({ type: 'COMPLETE_MATH_LEVEL', payload: { level, stars, coins } });
  }, []);

  const updateMathProgress = useCallback((progress: Partial<MathProgress>) => {
    dispatch({ type: 'UPDATE_MATH_PROGRESS', payload: progress });
  }, []);

  const updateCityProgress = useCallback((progress: Partial<CityProgress>) => {
    dispatch({ type: 'UPDATE_CITY_PROGRESS', payload: progress });
  }, []);

  const updateSkateProgress = useCallback((progress: Partial<SkateProgress>) => {
    dispatch({ type: 'UPDATE_SKATE_PROGRESS', payload: progress });
  }, []);

  const addAchievement = useCallback((achievement: string) => {
    dispatch({ type: 'ADD_ACHIEVEMENT', payload: achievement });
  }, []);

  const getTotalStars = useCallback(() => {
    return Object.values(state.mathProgress.levelStars).reduce((sum, s) => sum + s, 0);
  }, [state.mathProgress.levelStars]);

  // Memoize context value to prevent unnecessary consumer re-renders
  const contextValue = React.useMemo(
    () => ({
      state,
      dispatch,
      setActiveGame,
      updatePlayerProfile,
      completeMathLevel,
      updateMathProgress,
      updateCityProgress,
      updateSkateProgress,
      addAchievement,
      getTotalStars,
    }),
    [
      state,
      setActiveGame,
      updatePlayerProfile,
      completeMathLevel,
      updateMathProgress,
      updateCityProgress,
      updateSkateProgress,
      addAchievement,
      getTotalStars,
    ]
  );

  return (
    <ArcadeContext.Provider value={contextValue}>
      {children}
    </ArcadeContext.Provider>
  );
}

// Hook to use arcade context
export function useArcade() {
  const context = useContext(ArcadeContext);
  if (!context) {
    throw new Error('useArcade must be used within an ArcadeProvider');
  }
  return context;
}

export default ArcadeContext;
