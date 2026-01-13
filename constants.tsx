/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { BuildingConfig, BuildingType } from './types';

// Map Settings
export const GRID_SIZE = 30;

// Game Settings
export const TICK_RATE_MS = 2000; // Game loop updates every 2 seconds
export const INITIAL_MONEY = 100000;

export const BUILDINGS: Record<BuildingType, BuildingConfig> = {
  [BuildingType.None]: {
    type: BuildingType.None,
    cost: 0,
    name: 'Bulldoze',
    description: 'Clear a tile',
    color: '#ef4444', // Used for UI
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Road]: {
    type: BuildingType.Road,
    cost: 10,
    name: 'Road',
    description: 'Connects buildings.',
    color: '#374151', // gray-700
    popGen: 0,
    incomeGen: 0,
  },
  [BuildingType.Residential]: {
    type: BuildingType.Residential,
    cost: 100,
    name: 'House',
    description: '+5 Pop/day',
    color: '#f87171', // red-400
    popGen: 5,
    incomeGen: 0,
  },
  [BuildingType.Commercial]: {
    type: BuildingType.Commercial,
    cost: 200,
    name: 'Shop',
    description: '+$15/day',
    color: '#60a5fa', // blue-400
    popGen: 0,
    incomeGen: 15,
  },
  [BuildingType.Industrial]: {
    type: BuildingType.Industrial,
    cost: 400,
    name: 'Factory',
    description: '+$40/day',
    color: '#facc15', // yellow-400
    popGen: 0,
    incomeGen: 40,
  },
  [BuildingType.Park]: {
    type: BuildingType.Park,
    cost: 50,
    name: 'Park',
    description: 'Looks nice.',
    color: '#4ade80', // green-400
    popGen: 1,
    incomeGen: 0,
  },
};

// Player Profile Settings
export const MAX_NAME_LENGTH = 12;
export const DEFAULT_PLAYER_NAME = 'Player';
export const DEFAULT_CHARACTER_ID = 'character-male-a';

// Available player characters (Kenney Mini Characters)
export const PLAYER_CHARACTERS = [
  { id: 'character-male-a', label: 'Alex' },
  { id: 'character-male-b', label: 'Ben' },
  { id: 'character-male-c', label: 'Charlie' },
  { id: 'character-male-d', label: 'David' },
  { id: 'character-male-e', label: 'Ethan' },
  { id: 'character-male-f', label: 'Finn' },
  { id: 'character-female-a', label: 'Ava' },
  { id: 'character-female-b', label: 'Bella' },
  { id: 'character-female-c', label: 'Chloe' },
  { id: 'character-female-d', label: 'Diana' },
  { id: 'character-female-e', label: 'Emma' },
  { id: 'character-female-f', label: 'Fiona' },
] as const;

export type CharacterId = typeof PLAYER_CHARACTERS[number]['id'];