/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Physics constants for arcade-style skating
// Tuned for smooth, controllable movement (not too fast!)
export const PHYSICS = {
  GRAVITY: 15,
  PUSH_ACCEL: 0.5,      // Reduced from 12 - much more controllable
  MAX_SPEED: 0.2,       // Reduced from 8 - prevents zooming off screen
  TURN_SPEED: 1,        // Slightly reduced from 3.5
  FRICTION: 0.95,       // More friction for quicker stops
  BRAKE_FRICTION: 0.85, // Stronger braking
  JUMP_FORCE: 5,        // Slightly reduced
  AIR_CONTROL: 0.3,
  GRIND_SPEED: 0.3,     // Match the new slower speed
  RAMP_BOOST: 1.3,
} as const;

// Park dimensions - expanded from 20x20 to 40x40
export const PARK_SIZE = {
  width: 40,
  depth: 40,
  boundSize: 19, // Half park size minus 1 for safe boundary
} as const;

// Zone definitions for the skatepark
// Each zone has a distinct theme and difficulty
export const ZONES = {
  BEGINNER: { minX: -20, maxX: 0, minZ: 0, maxZ: 20, name: 'Beginner' },
  STREET: { minX: 0, maxX: 20, minZ: 0, maxZ: 20, name: 'Street' },
  BOWL: { minX: 0, maxX: 20, minZ: -20, maxZ: 0, name: 'Bowl' },
  ADVANCED: { minX: -20, maxX: 0, minZ: -20, maxZ: 0, name: 'Advanced' },
  HUB: { minX: -5, maxX: 5, minZ: -5, maxZ: 5, name: 'Hub' },
} as const;

export type ZoneName = keyof typeof ZONES;

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

// Determine floor type based on position (zone-based visual differentiation)
function getFloorTypeForPosition(x: number, z: number): 'floor-concrete' | 'floor-wood' {
  // Hub area gets wood floor (central plaza)
  if (x >= -5 && x <= 5 && z >= -5 && z <= 5) return 'floor-wood';
  // Bowl zone inner area gets wood floor for visual distinction
  if (x >= 6 && x <= 16 && z >= -16 && z <= -6) return 'floor-wood';
  // Everything else is concrete
  return 'floor-concrete';
}

// Generate floor grid with zone-based floor types
function generateFloorGrid(width: number, depth: number): ParkElement[] {
  const elements: ParkElement[] = [];
  // Kenney floor tiles are 1 unit in size
  const floorSize = 1;
  const offsetX = (width * floorSize) / 2 - floorSize / 2;
  const offsetZ = (depth * floorSize) / 2 - floorSize / 2;

  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      const worldX = x * floorSize - offsetX;
      const worldZ = z * floorSize - offsetZ;
      const floorType = getFloorTypeForPosition(worldX, worldZ);

      elements.push({
        type: floorType,
        position: [worldX, 0, worldZ],
        rotation: 0,
      });
    }
  }
  return elements;
}

// Skatepark layout - Expanded 40x40 park with 4 themed zones
// BEGINNER (SW): Easy rails, small obstacles for learning
// STREET (SE): Technical rails, steps, ledges
// BOWL (NE): Transitions, bowl pieces, half-pipes for air
// ADVANCED (NW): Complex lines, high rails, flow course
// HUB (Center): Central meeting point with directional markers
export const SKATEPARK_LAYOUT: ParkElement[] = [
  // Floor grid (40x40 tiles at 1 unit each covers ±19 unit area)
  ...generateFloorGrid(PARK_SIZE.width, PARK_SIZE.depth),

  // ═══════════════════════════════════════════════════════════
  // ZONE 1: BEGINNER AREA (Southwest Quadrant)
  // Purpose: Safe learning environment with low obstacles
  // ═══════════════════════════════════════════════════════════
  // Low rails for practicing grinds
  { type: 'rail-low', position: [-14, 0, 14], rotation: 0 },
  { type: 'rail-low', position: [-14, 0, 10], rotation: 0 },
  { type: 'rail-low', position: [-10, 0, 12], rotation: 90 },
  // Small obstacle boxes for learning
  { type: 'obstacle-box', position: [-10, 0, 16], rotation: 0 },
  { type: 'obstacle-box', position: [-8, 0, 16], rotation: 0 },
  { type: 'obstacle-box', position: [-12, 0, 8], rotation: 0 },
  // End caps for practice lines
  { type: 'obstacle-end', position: [-16, 0, 10], rotation: 0 },
  { type: 'obstacle-end', position: [-6, 0, 14], rotation: 90 },
  // Wood structure for elevated practice
  { type: 'structure-wood', position: [-16, 0, 6], rotation: 0 },
  // Small steps for ollie practice
  { type: 'steps', position: [-8, 0, 8], rotation: 0 },

  // ═══════════════════════════════════════════════════════════
  // ZONE 2: STREET SECTION (Southeast Quadrant)
  // Purpose: Technical tricks - rails, ledges, stairs
  // ═══════════════════════════════════════════════════════════
  // Mixed rail heights for variety
  { type: 'rail-slope', position: [10, 0, 14], rotation: 45 },
  { type: 'rail-high', position: [14, 0, 12], rotation: 0 },
  { type: 'rail-high', position: [14, 0, 8], rotation: 0 },
  { type: 'rail-curve', position: [12, 0, 6], rotation: 90 },
  { type: 'rail-low', position: [8, 0, 16], rotation: 90 },
  // Multiple step sets for stair tricks
  { type: 'steps', position: [8, 0, 10], rotation: 0 },
  { type: 'steps', position: [16, 0, 16], rotation: 180 },
  // Ledges for manuals and grinds
  { type: 'obstacle-middle', position: [10, 0, 4], rotation: 0 },
  { type: 'obstacle-box', position: [14, 0, 4], rotation: 45 },
  { type: 'obstacle-end', position: [16, 0, 10], rotation: 90 },
  // Elevated platform section
  { type: 'structure-platform', position: [16, 0, 4], rotation: 0 },
  { type: 'structure-wood', position: [6, 0, 6], rotation: 0 },

  // ═══════════════════════════════════════════════════════════
  // ZONE 3: BOWL/VERT SECTION (Northeast Quadrant)
  // Purpose: Transitions, air tricks, flow
  // ═══════════════════════════════════════════════════════════
  // Bowl pieces forming a skating bowl
  { type: 'bowl-corner-inner', position: [14, 0, -14], rotation: 0 },
  { type: 'bowl-corner-inner', position: [10, 0, -10], rotation: 180 },
  { type: 'bowl-side', position: [12, 0, -16], rotation: 90 },
  { type: 'bowl-side', position: [16, 0, -12], rotation: 0 },
  { type: 'bowl-corner-outer', position: [8, 0, -8], rotation: 180 },
  // Half-pipes for vert tricks
  { type: 'half-pipe', position: [8, 0, -14], rotation: 0 },
  { type: 'half-pipe', position: [14, 0, -6], rotation: 90 },
  // Box for lip tricks
  { type: 'obstacle-box', position: [10, 0, -16], rotation: 0 },
  // Additional flow element
  { type: 'rail-curve', position: [6, 0, -6], rotation: 0 },

  // ═══════════════════════════════════════════════════════════
  // ZONE 4: ADVANCED FLOW COURSE (Northwest Quadrant)
  // Purpose: Complex lines, combos, high-skill obstacles
  // ═══════════════════════════════════════════════════════════
  // Half-pipes for vert transitions
  { type: 'half-pipe', position: [-10, 0, -14], rotation: 180 },
  { type: 'half-pipe', position: [-16, 0, -8], rotation: 90 },
  // High rails requiring precision
  { type: 'rail-high', position: [-14, 0, -10], rotation: 45 },
  { type: 'rail-high', position: [-8, 0, -8], rotation: 0 },
  { type: 'rail-slope', position: [-8, 0, -4], rotation: 0 },
  // Curved rail for style points
  { type: 'rail-curve', position: [-12, 0, -16], rotation: 0 },
  { type: 'rail-low', position: [-16, 0, -12], rotation: 90 },
  // Complex obstacle arrangement
  { type: 'obstacle-middle', position: [-12, 0, -12], rotation: 90 },
  { type: 'obstacle-box', position: [-8, 0, -16], rotation: 45 },
  { type: 'obstacle-end', position: [-14, 0, -6], rotation: 0 },
  // Steps for gap tricks
  { type: 'steps', position: [-16, 0, -16], rotation: 270 },
  // Elevated platforms for drops
  { type: 'structure-platform', position: [-16, 0, -14], rotation: 0 },
  { type: 'structure-wood', position: [-10, 0, -10], rotation: 270 },

  // ═══════════════════════════════════════════════════════════
  // CENTRAL HUB (Origin Area)
  // Purpose: Spawn point, connects all zones
  // ═══════════════════════════════════════════════════════════
  // Central feature
  { type: 'obstacle-box', position: [0, 0, 0], rotation: 45 },
  // Directional markers
  { type: 'obstacle-middle', position: [-3, 0, 3], rotation: 0 },
  { type: 'obstacle-middle', position: [3, 0, -3], rotation: 0 },
  // Connective rails
  { type: 'rail-low', position: [-3, 0, -3], rotation: 45 },
  { type: 'rail-low', position: [3, 0, 3], rotation: 45 },
  // Flow paths to each zone
  { type: 'obstacle-end', position: [0, 0, 4], rotation: 0 },
  { type: 'obstacle-end', position: [0, 0, -4], rotation: 180 },
  { type: 'obstacle-end', position: [4, 0, 0], rotation: 90 },
  { type: 'obstacle-end', position: [-4, 0, 0], rotation: 270 },
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

// ═══════════════════════════════════════════════════════════
// COLLISION SYSTEM DATA
// ═══════════════════════════════════════════════════════════

// Collision type for each asset (used to generate collision shapes)
export const COLLISION_METADATA: Record<string, {
  type: 'box' | 'rail' | 'ramp' | 'bowl';
  bounds: [number, number, number]; // local size [width, height, depth]
  railHeight?: number; // Y position of grind surface
  slopeAngle?: number; // degrees for ramps
}> = {
  'rail-low': { type: 'rail', bounds: [2, 0.5, 0.1], railHeight: 0.5 },
  'rail-high': { type: 'rail', bounds: [2, 1, 0.1], railHeight: 1 },
  'rail-slope': { type: 'rail', bounds: [2.5, 0.8, 0.1], railHeight: 0.65 },
  'rail-curve': { type: 'rail', bounds: [2, 0.5, 2], railHeight: 0.5 },
  'obstacle-box': { type: 'box', bounds: [1, 0.5, 1] },
  'obstacle-middle': { type: 'box', bounds: [2, 0.5, 1] },
  'obstacle-end': { type: 'box', bounds: [1, 0.5, 0.5] },
  'steps': { type: 'box', bounds: [2, 0.6, 2] },
  'half-pipe': { type: 'ramp', bounds: [4, 2, 2], slopeAngle: 60 },
  'bowl-side': { type: 'bowl', bounds: [2, 1.5, 0.5], slopeAngle: 45 },
  'bowl-corner-inner': { type: 'bowl', bounds: [2, 1.5, 2], slopeAngle: 45 },
  'bowl-corner-outer': { type: 'bowl', bounds: [2, 1, 2], slopeAngle: 30 },
  'structure-platform': { type: 'box', bounds: [2, 1, 2] },
  'structure-wood': { type: 'box', bounds: [2, 0.8, 2] },
  'floor-concrete': { type: 'box', bounds: [1, 0.1, 1] },
  'floor-wood': { type: 'box', bounds: [1, 0.1, 1] },
};

// Ramp collision data (simplified bounding boxes)
export interface RampData {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  maxHeight: number;
  direction: 'north' | 'south' | 'east' | 'west';
  slopeAngle: number;
}

// Generate ramp data from layout
export const RAMP_DATA: RampData[] = [
  // Bowl zone half-pipes
  { id: 'hp1', position: [8, 0, -14], size: [4, 2, 2], maxHeight: 2, direction: 'north', slopeAngle: 60 },
  { id: 'hp2', position: [14, 0, -6], size: [2, 2, 4], maxHeight: 2, direction: 'east', slopeAngle: 60 },
  // Advanced zone half-pipes
  { id: 'hp3', position: [-10, 0, -14], size: [4, 2, 2], maxHeight: 2, direction: 'south', slopeAngle: 60 },
  { id: 'hp4', position: [-16, 0, -8], size: [2, 2, 4], maxHeight: 2, direction: 'west', slopeAngle: 60 },
  // Bowl pieces (gentler slopes)
  { id: 'bowl1', position: [14, 0, -14], size: [2, 1.5, 2], maxHeight: 1.5, direction: 'south', slopeAngle: 45 },
  { id: 'bowl2', position: [12, 0, -16], size: [2, 1.5, 0.5], maxHeight: 1.5, direction: 'north', slopeAngle: 45 },
  { id: 'bowl3', position: [16, 0, -12], size: [0.5, 1.5, 2], maxHeight: 1.5, direction: 'west', slopeAngle: 45 },
];

// Rail collision data (line segments)
export interface RailData {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  height: number;
  zone: ZoneName;
}

// Generate rail data from layout positions
export const RAIL_DATA: RailData[] = [
  // Beginner zone rails (low)
  { id: 'r1', start: [-15, 0.5, 14], end: [-13, 0.5, 14], height: 0.5, zone: 'BEGINNER' },
  { id: 'r2', start: [-15, 0.5, 10], end: [-13, 0.5, 10], height: 0.5, zone: 'BEGINNER' },
  { id: 'r3', start: [-10, 0.5, 11], end: [-10, 0.5, 13], height: 0.5, zone: 'BEGINNER' },
  // Street zone rails (mixed heights)
  { id: 'r4', start: [9, 0.5, 13], end: [11, 1, 15], height: 0.75, zone: 'STREET' },
  { id: 'r5', start: [14, 1, 11], end: [14, 1, 13], height: 1, zone: 'STREET' },
  { id: 'r6', start: [14, 1, 7], end: [14, 1, 9], height: 1, zone: 'STREET' },
  { id: 'r7', start: [11, 0.5, 6], end: [13, 0.5, 6], height: 0.5, zone: 'STREET' },
  { id: 'r8', start: [7, 0.5, 16], end: [9, 0.5, 16], height: 0.5, zone: 'STREET' },
  // Bowl zone curved rail
  { id: 'r9', start: [5, 0.5, -6], end: [7, 0.5, -6], height: 0.5, zone: 'BOWL' },
  // Advanced zone rails (high)
  { id: 'r10', start: [-15, 1, -11], end: [-13, 1, -9], height: 1, zone: 'ADVANCED' },
  { id: 'r11', start: [-9, 1, -8], end: [-7, 1, -8], height: 1, zone: 'ADVANCED' },
  { id: 'r12', start: [-9, 0.5, -4], end: [-7, 0.8, -4], height: 0.65, zone: 'ADVANCED' },
  { id: 'r13', start: [-13, 0.5, -16], end: [-11, 0.5, -16], height: 0.5, zone: 'ADVANCED' },
  { id: 'r14', start: [-16, 0.5, -13], end: [-16, 0.5, -11], height: 0.5, zone: 'ADVANCED' },
  // Hub rails
  { id: 'r15', start: [-4, 0.5, -4], end: [-2, 0.5, -2], height: 0.5, zone: 'HUB' },
  { id: 'r16', start: [2, 0.5, 2], end: [4, 0.5, 4], height: 0.5, zone: 'HUB' },
];

// Obstacle/box collision data
export interface ObstacleData {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  grindable: boolean;
  zone: ZoneName;
}

export const OBSTACLE_DATA: ObstacleData[] = [
  // Beginner zone boxes
  { id: 'o1', position: [-10, 0, 16], size: [1, 0.5, 1], grindable: true, zone: 'BEGINNER' },
  { id: 'o2', position: [-8, 0, 16], size: [1, 0.5, 1], grindable: true, zone: 'BEGINNER' },
  { id: 'o3', position: [-12, 0, 8], size: [1, 0.5, 1], grindable: true, zone: 'BEGINNER' },
  // Street zone obstacles
  { id: 'o4', position: [10, 0, 4], size: [2, 0.5, 1], grindable: true, zone: 'STREET' },
  { id: 'o5', position: [14, 0, 4], size: [1, 0.5, 1], grindable: true, zone: 'STREET' },
  { id: 'o6', position: [8, 0, 10], size: [2, 0.6, 2], grindable: false, zone: 'STREET' },
  { id: 'o7', position: [16, 0, 16], size: [2, 0.6, 2], grindable: false, zone: 'STREET' },
  // Bowl zone
  { id: 'o8', position: [10, 0, -16], size: [1, 0.5, 1], grindable: true, zone: 'BOWL' },
  // Advanced zone
  { id: 'o9', position: [-12, 0, -12], size: [2, 0.5, 1], grindable: true, zone: 'ADVANCED' },
  { id: 'o10', position: [-8, 0, -16], size: [1, 0.5, 1], grindable: true, zone: 'ADVANCED' },
  { id: 'o11', position: [-16, 0, -16], size: [2, 0.6, 2], grindable: false, zone: 'ADVANCED' },
  // Hub obstacles
  { id: 'o12', position: [0, 0, 0], size: [1, 0.5, 1], grindable: true, zone: 'HUB' },
  { id: 'o13', position: [-3, 0, 3], size: [2, 0.5, 1], grindable: true, zone: 'HUB' },
  { id: 'o14', position: [3, 0, -3], size: [2, 0.5, 1], grindable: true, zone: 'HUB' },
];

// ═══════════════════════════════════════════════════════════
// STAR COLLECTION SYSTEM
// ═══════════════════════════════════════════════════════════

export interface StarData {
  id: number;
  position: [number, number, number];
  zone: ZoneName;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

// 30 stars distributed across zones with varying difficulty
export const STARS: StarData[] = [
  // BEGINNER ZONE (10 easy stars - ground level, easy access)
  { id: 1, position: [-14, 0.8, 14], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 2, position: [-10, 0.8, 16], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 3, position: [-8, 0.8, 12], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 4, position: [-16, 0.8, 8], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 5, position: [-12, 0.8, 10], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 6, position: [-6, 0.8, 16], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 7, position: [-14, 1.2, 12], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 8, position: [-10, 0.8, 8], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 9, position: [-8, 0.8, 6], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 10, position: [-16, 1.0, 14], zone: 'BEGINNER', difficulty: 'easy', points: 10 },

  // STREET ZONE (8 medium stars - on/near rails and ledges)
  { id: 11, position: [10, 1.5, 14], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 12, position: [14, 1.8, 10], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 13, position: [8, 1.2, 16], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 14, position: [12, 1.0, 6], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 15, position: [16, 1.5, 8], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 16, position: [6, 1.2, 4], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 17, position: [10, 1.0, 10], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 18, position: [14, 1.2, 4], zone: 'STREET', difficulty: 'medium', points: 25 },

  // BOWL ZONE (6 medium/hard stars - require air/jumps)
  { id: 19, position: [12, 2.0, -12], zone: 'BOWL', difficulty: 'medium', points: 25 },
  { id: 20, position: [8, 2.5, -14], zone: 'BOWL', difficulty: 'hard', points: 50 },
  { id: 21, position: [14, 2.5, -8], zone: 'BOWL', difficulty: 'hard', points: 50 },
  { id: 22, position: [10, 1.5, -10], zone: 'BOWL', difficulty: 'medium', points: 25 },
  { id: 23, position: [16, 2.0, -14], zone: 'BOWL', difficulty: 'hard', points: 50 },
  { id: 24, position: [6, 1.2, -6], zone: 'BOWL', difficulty: 'medium', points: 25 },

  // ADVANCED ZONE (4 hard stars - high skill required)
  { id: 25, position: [-10, 3.0, -14], zone: 'ADVANCED', difficulty: 'hard', points: 50 },
  { id: 26, position: [-14, 2.5, -10], zone: 'ADVANCED', difficulty: 'hard', points: 50 },
  { id: 27, position: [-8, 2.0, -8], zone: 'ADVANCED', difficulty: 'hard', points: 50 },
  { id: 28, position: [-16, 2.5, -16], zone: 'ADVANCED', difficulty: 'hard', points: 50 },

  // HUB (2 bonus stars - central area rewards)
  { id: 29, position: [0, 1.5, 0], zone: 'HUB', difficulty: 'easy', points: 10 },
  { id: 30, position: [0, 3.0, 0], zone: 'HUB', difficulty: 'hard', points: 100 },
];

// Star collection radius (how close skater needs to be)
export const STAR_COLLECT_RADIUS = 1.2;

// ═══════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════

export interface SkateAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number; // Coin reward
}

export const SKATE_ACHIEVEMENTS: SkateAchievement[] = [
  // Star collection achievements
  { id: 'first_star', name: 'First Star!', description: 'Collect your first star', icon: '⭐', reward: 50 },
  { id: 'star_10', name: 'Star Seeker', description: 'Collect 10 stars', icon: '🌟', reward: 100 },
  { id: 'star_20', name: 'Star Hunter', description: 'Collect 20 stars', icon: '✨', reward: 200 },
  { id: 'all_stars', name: 'Completionist', description: 'Collect all 30 stars', icon: '🏆', reward: 500 },

  // Zone completion achievements
  { id: 'zone_beginner', name: 'Beginner Complete', description: 'All stars in Beginner zone', icon: '🟢', reward: 150 },
  { id: 'zone_street', name: 'Street Complete', description: 'All stars in Street zone', icon: '🟡', reward: 200 },
  { id: 'zone_bowl', name: 'Bowl Complete', description: 'All stars in Bowl zone', icon: '🟠', reward: 250 },
  { id: 'zone_advanced', name: 'Advanced Complete', description: 'All stars in Advanced zone', icon: '🔴', reward: 300 },

  // Trick achievements
  { id: 'combo_5', name: 'Combo Starter', description: '5-trick combo', icon: '🔥', reward: 100 },
  { id: 'combo_10', name: 'Combo Master', description: '10-trick combo', icon: '💥', reward: 200 },
  { id: 'combo_20', name: 'Combo Legend', description: '20-trick combo', icon: '⚡', reward: 500 },
  { id: 'tricks_100', name: 'Trick Pro', description: 'Perform 100 tricks total', icon: '🛹', reward: 150 },
  { id: 'tricks_500', name: 'Trick Master', description: 'Perform 500 tricks total', icon: '🎯', reward: 300 },

  // Session achievements
  { id: 'sessions_5', name: 'Regular Skater', description: 'Play 5 sessions', icon: '📅', reward: 50 },
  { id: 'sessions_20', name: 'Dedicated Skater', description: 'Play 20 sessions', icon: '💪', reward: 200 },
];
