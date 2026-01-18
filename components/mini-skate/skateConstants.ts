/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Physics constants for arcade-style skating
export const PHYSICS = {
  GRAVITY: 15,
  PUSH_ACCEL: 12,
  MAX_SPEED: 8,
  TURN_SPEED: 3.5,
  FRICTION: 0.98,
  BRAKE_FRICTION: 0.92,
  JUMP_FORCE: 6,
  AIR_CONTROL: 0.3,
  GRIND_SPEED: 5,
  RAMP_BOOST: 1.3,
} as const;

// Asset paths
export const ASSETS = {
  characters: {
    boy: '/assets/mini-skate/character-skate-boy.glb',
    girl: '/assets/mini-skate/character-skate-girl.glb',
  },
  skateboard: '/assets/mini-skate/skateboard.glb',
  ramps: {
    halfPipe: '/assets/mini-skate/half-pipe.glb',
    bowlCornerInner: '/assets/mini-skate/bowl-corner-inner.glb',
    bowlCornerOuter: '/assets/mini-skate/bowl-corner-outer.glb',
    bowlSide: '/assets/mini-skate/bowl-side.glb',
  },
  rails: {
    curve: '/assets/mini-skate/rail-curve.glb',
    high: '/assets/mini-skate/rail-high.glb',
    low: '/assets/mini-skate/rail-low.glb',
    slope: '/assets/mini-skate/rail-slope.glb',
  },
  obstacles: {
    box: '/assets/mini-skate/obstacle-box.glb',
    middle: '/assets/mini-skate/obstacle-middle.glb',
    end: '/assets/mini-skate/obstacle-end.glb',
    steps: '/assets/mini-skate/steps.glb',
  },
  structures: {
    platform: '/assets/mini-skate/structure-platform.glb',
    wood: '/assets/mini-skate/structure-wood.glb',
  },
  floors: {
    concrete: '/assets/mini-skate/floor-concrete.glb',
    wood: '/assets/mini-skate/floor-wood.glb',
  },
} as const;

// Park element type
export interface ParkElement {
  type: keyof typeof ASSET_MAP;
  position: [number, number, number];
  rotation: number; // Y-axis degrees
  scale?: number;
}

// Map element types to asset paths
export const ASSET_MAP: Record<string, string> = {
  'floor-concrete': ASSETS.floors.concrete,
  'floor-wood': ASSETS.floors.wood,
  'half-pipe': ASSETS.ramps.halfPipe,
  'bowl-corner-inner': ASSETS.ramps.bowlCornerInner,
  'bowl-corner-outer': ASSETS.ramps.bowlCornerOuter,
  'bowl-side': ASSETS.ramps.bowlSide,
  'rail-curve': ASSETS.rails.curve,
  'rail-high': ASSETS.rails.high,
  'rail-low': ASSETS.rails.low,
  'rail-slope': ASSETS.rails.slope,
  'obstacle-box': ASSETS.obstacles.box,
  'obstacle-middle': ASSETS.obstacles.middle,
  'obstacle-end': ASSETS.obstacles.end,
  'steps': ASSETS.obstacles.steps,
  'structure-platform': ASSETS.structures.platform,
  'structure-wood': ASSETS.structures.wood,
};

// Generate floor grid
function generateFloorGrid(width: number, depth: number): ParkElement[] {
  const elements: ParkElement[] = [];
  const floorSize = 2; // Each floor tile is 2 units
  const offsetX = (width * floorSize) / 2 - floorSize / 2;
  const offsetZ = (depth * floorSize) / 2 - floorSize / 2;

  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      elements.push({
        type: 'floor-concrete',
        position: [x * floorSize - offsetX, 0, z * floorSize - offsetZ],
        rotation: 0,
      });
    }
  }
  return elements;
}

// Skatepark layout
export const SKATEPARK_LAYOUT: ParkElement[] = [
  // Floor grid (10x10)
  ...generateFloorGrid(10, 10),

  // Half-pipes at north and south
  { type: 'half-pipe', position: [0, 0, -8], rotation: 0 },
  { type: 'half-pipe', position: [0, 0, 8], rotation: 180 },

  // Rails
  { type: 'rail-low', position: [-5, 0, 0], rotation: 90 },
  { type: 'rail-high', position: [5, 0, 3], rotation: 0 },
  { type: 'rail-slope', position: [3, 0, -3], rotation: 45 },

  // Obstacles
  { type: 'obstacle-box', position: [-3, 0, 4], rotation: 0 },
  { type: 'obstacle-middle', position: [0, 0, 0], rotation: 0 },
  { type: 'steps', position: [6, 0, -5], rotation: -90 },

  // Platform
  { type: 'structure-platform', position: [-6, 0, -6], rotation: 0 },
];

// Animation names (from Kenney assets)
export const ANIMATIONS = {
  // Movement
  idle: 'Idle',
  push: 'Skateboard_Push',
  coast: 'Skateboard_Idle',
  turnLeft: 'Skateboard_Turn_Left',
  turnRight: 'Skateboard_Turn_Right',
  brake: 'Skateboard_Brake',

  // Air tricks
  ollie: 'Skateboard_Ollie',
  kickflip: 'Skateboard_Kickflip',
  heelflip: 'Skateboard_Heelflip',
  flip360: 'Skateboard_360Flip',
  grabNose: 'Skateboard_Grab_Nose',
  grabTail: 'Skateboard_Grab_Tail',
  grabIndy: 'Skateboard_Grab_Indy',

  // Rail tricks
  grind: 'Skateboard_Grind',
  grindNose: 'Skateboard_Grind_Noseslide',
  grindTail: 'Skateboard_Grind_Tailslide',

  // Other
  fall: 'Fall',
  getUp: 'Get_Up',
  victory: 'Victory',
} as const;

// Trick definitions for the 4 main trick buttons
export const TRICKS = [
  { id: 'kickflip', name: 'Kickflip', animation: ANIMATIONS.kickflip, key: '1' },
  { id: 'heelflip', name: 'Heelflip', animation: ANIMATIONS.heelflip, key: '2' },
  { id: 'grab', name: 'Grab', animation: ANIMATIONS.grabIndy, key: '3' },
  { id: 'flip360', name: '360 Flip', animation: ANIMATIONS.flip360, key: '4' },
] as const;

// Ramp collision data (simplified bounding boxes)
export interface RampData {
  position: [number, number, number];
  size: [number, number, number];
  maxHeight: number;
  direction: 'north' | 'south' | 'east' | 'west';
}

export const RAMP_DATA: RampData[] = [
  { position: [0, 0, -8], size: [4, 2, 2], maxHeight: 2, direction: 'north' },
  { position: [0, 0, 8], size: [4, 2, 2], maxHeight: 2, direction: 'south' },
];

// Rail collision data (line segments)
export interface RailData {
  start: [number, number, number];
  end: [number, number, number];
  height: number;
}

export const RAIL_DATA: RailData[] = [
  { start: [-6, 0.5, 0], end: [-4, 0.5, 0], height: 0.5 },
  { start: [5, 1, 1], end: [5, 1, 5], height: 1 },
  { start: [2, 0.5, -4], end: [4, 1, -2], height: 0.75 },
];
