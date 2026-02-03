/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Physics constants for arcade-style skating
// Tuned for smooth, controllable movement (not too fast!)
export const PHYSICS = {
  GRAVITY: 19,
  PUSH_ACCEL: 6,
  MAX_SPEED: 4,
  TURN_SPEED: 2.2,
  FRICTION: 0.92,
  BRAKE_FRICTION: 0.82,
  JUMP_FORCE: 5.6,
  AIR_CONTROL: 0.35,
  GRIND_SPEED: 3,
  MAX_VERTICAL_VEL: 6,
  RAMP_LAUNCH: 3,
} as const;

// Park dimensions - expanded from 20x20 to 40x40
export const PARK_SIZE = {
  width: 32,
  depth: 32,
  boundSize: 15, // Half park size minus 1 for safe boundary
} as const;

// Zone definitions for the skatepark
// Each zone has a distinct theme and difficulty
export const ZONES = {
  BEGINNER: { minX: -16, maxX: 0, minZ: 0, maxZ: 16, name: 'Beginner' },
  STREET: { minX: 0, maxX: 16, minZ: 0, maxZ: 16, name: 'Street' },
  BOWL: { minX: 0, maxX: 16, minZ: -16, maxZ: 0, name: 'Bowl' },
  ADVANCED: { minX: -16, maxX: 0, minZ: -16, maxZ: 0, name: 'Advanced' },
  HUB: { minX: -4, maxX: 4, minZ: -4, maxZ: 4, name: 'Hub' },
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
  if (x >= -4 && x <= 4 && z >= -4 && z <= 4) return 'floor-wood';
  // Bowl zone inner area gets wood floor for visual distinction
  if (x >= 4 && x <= 12 && z >= -12 && z <= -4) return 'floor-wood';
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

export const FLOOR_TILES: ParkElement[] = generateFloorGrid(PARK_SIZE.width, PARK_SIZE.depth);

// Skatepark layout - Focused 32x32 park with clear flow lines
// BEGINNER (SW): Easy rails, small obstacles for learning
// STREET (SE): Technical rails, steps, ledges
// BOWL (NE): Transitions, bowl pieces, half-pipe for air
// ADVANCED (NW): Short flow course, high rail
// HUB (Center): Compact spawn + connective rails
export const SKATEPARK_LAYOUT: ParkElement[] = [
  // ═══════════════════════════════════════════════════════════
  // ZONE 1: BEGINNER AREA (Southwest Quadrant)
  // ═══════════════════════════════════════════════════════════
  { type: 'rail-low', position: [-12, 0, 12], rotation: 0 },
  { type: 'rail-low', position: [-8, 0, 10], rotation: 90 },
  { type: 'obstacle-box', position: [-10, 0, 14], rotation: 0 },
  { type: 'obstacle-box', position: [-6, 0, 12], rotation: 0 },
  { type: 'steps', position: [-12, 0, 6], rotation: 0 },
  { type: 'obstacle-end', position: [-14, 0, 10], rotation: 0 },

  // ═══════════════════════════════════════════════════════════
  // ZONE 2: STREET SECTION (Southeast Quadrant)
  // ═══════════════════════════════════════════════════════════
  { type: 'rail-high', position: [10, 0, 12], rotation: 0 },
  { type: 'rail-slope', position: [12, 0, 8], rotation: 45 },
  { type: 'obstacle-middle', position: [8, 0, 6], rotation: 0 },
  { type: 'steps', position: [14, 0, 10], rotation: 180 },
  { type: 'structure-platform', position: [12, 0, 4], rotation: 0 },
  { type: 'rail-low', position: [6, 0, 14], rotation: 90 },

  // ═══════════════════════════════════════════════════════════
  // ZONE 3: BOWL/VERT SECTION (Northeast Quadrant)
  // ═══════════════════════════════════════════════════════════
  { type: 'half-pipe', position: [6, 0, -12], rotation: 0 },
  { type: 'bowl-corner-inner', position: [12, 0, -10], rotation: 90 },
  { type: 'bowl-side', position: [8, 0, -14], rotation: 90 },
  { type: 'rail-curve', position: [4, 0, -8], rotation: 0 },
  { type: 'obstacle-box', position: [10, 0, -14], rotation: 0 },

  // ═══════════════════════════════════════════════════════════
  // ZONE 4: ADVANCED FLOW COURSE (Northwest Quadrant)
  // ═══════════════════════════════════════════════════════════
  { type: 'half-pipe', position: [-10, 0, -12], rotation: 180 },
  { type: 'rail-high', position: [-12, 0, -8], rotation: 45 },
  { type: 'obstacle-middle', position: [-8, 0, -10], rotation: 90 },
  { type: 'rail-low', position: [-14, 0, -12], rotation: 90 },
  { type: 'steps', position: [-12, 0, -14], rotation: 270 },

  // ═══════════════════════════════════════════════════════════
  // CENTRAL HUB (Origin Area)
  // ═══════════════════════════════════════════════════════════
  { type: 'obstacle-box', position: [0, 0, 0], rotation: 45 },
  { type: 'rail-low', position: [-3, 0, -3], rotation: 45 },
  { type: 'rail-low', position: [3, 0, 3], rotation: 45 },
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
  // Bowl zone half-pipe
  { id: 'hp1', position: [6, 0, -12], size: [4, 2, 2], maxHeight: 2, direction: 'north', slopeAngle: 60 },
  // Advanced zone half-pipe
  { id: 'hp2', position: [-10, 0, -12], size: [4, 2, 2], maxHeight: 2, direction: 'south', slopeAngle: 60 },
  // Bowl pieces (gentler slopes)
  { id: 'bowl1', position: [12, 0, -10], size: [2, 1.5, 2], maxHeight: 1.5, direction: 'east', slopeAngle: 45 },
  { id: 'bowl2', position: [8, 0, -14], size: [2, 1.5, 0.5], maxHeight: 1.5, direction: 'north', slopeAngle: 45 },
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
  { id: 'r1', start: [-13, 0.5, 12], end: [-11, 0.5, 12], height: 0.5, zone: 'BEGINNER' },
  { id: 'r2', start: [-8, 0.5, 9], end: [-8, 0.5, 11], height: 0.5, zone: 'BEGINNER' },
  // Street zone rails (mixed heights)
  { id: 'r3', start: [9, 1, 12], end: [11, 1, 12], height: 1, zone: 'STREET' },
  { id: 'r4', start: [11, 0.5, 7], end: [13, 0.8, 9], height: 0.75, zone: 'STREET' },
  { id: 'r5', start: [6, 0.5, 13], end: [6, 0.5, 15], height: 0.5, zone: 'STREET' },
  // Bowl zone curved rail
  { id: 'r6', start: [3, 0.5, -8], end: [5, 0.5, -8], height: 0.5, zone: 'BOWL' },
  // Advanced zone rails (high)
  { id: 'r7', start: [-13, 1, -9], end: [-11, 1, -7], height: 1, zone: 'ADVANCED' },
  { id: 'r8', start: [-14, 0.5, -13], end: [-14, 0.5, -11], height: 0.5, zone: 'ADVANCED' },
  // Hub rails
  { id: 'r9', start: [-4, 0.5, -4], end: [-2, 0.5, -2], height: 0.5, zone: 'HUB' },
  { id: 'r10', start: [2, 0.5, 2], end: [4, 0.5, 4], height: 0.5, zone: 'HUB' },
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
  { id: 'o1', position: [-10, 0, 14], size: [1, 0.5, 1], grindable: true, zone: 'BEGINNER' },
  { id: 'o2', position: [-6, 0, 12], size: [1, 0.5, 1], grindable: true, zone: 'BEGINNER' },
  { id: 'o3', position: [-12, 0, 6], size: [2, 0.6, 2], grindable: false, zone: 'BEGINNER' },
  { id: 'o4', position: [-14, 0, 10], size: [1, 0.5, 0.5], grindable: false, zone: 'BEGINNER' },
  // Street zone obstacles
  { id: 'o5', position: [8, 0, 6], size: [2, 0.5, 1], grindable: true, zone: 'STREET' },
  { id: 'o6', position: [14, 0, 10], size: [2, 0.6, 2], grindable: false, zone: 'STREET' },
  { id: 'o7', position: [12, 0, 4], size: [2, 1, 2], grindable: false, zone: 'STREET' },
  // Bowl zone
  { id: 'o8', position: [10, 0, -14], size: [1, 0.5, 1], grindable: true, zone: 'BOWL' },
  // Advanced zone
  { id: 'o9', position: [-8, 0, -10], size: [2, 0.5, 1], grindable: true, zone: 'ADVANCED' },
  { id: 'o10', position: [-12, 0, -14], size: [2, 0.6, 2], grindable: false, zone: 'ADVANCED' },
  // Hub obstacles
  { id: 'o11', position: [0, 0, 0], size: [1, 0.5, 1], grindable: true, zone: 'HUB' },
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
  // BEGINNER ANCHORS
  { id: 1, position: [-12, 0.9, 12], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 2, position: [-11.2, 1.6, 12.8], zone: 'BEGINNER', difficulty: 'medium', points: 25 },
  { id: 3, position: [-12.6, 2.3, 11.4], zone: 'BEGINNER', difficulty: 'hard', points: 50 },

  { id: 4, position: [-10, 0.9, 14], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 5, position: [-9.2, 1.6, 14.6], zone: 'BEGINNER', difficulty: 'medium', points: 25 },
  { id: 6, position: [-10.8, 2.3, 13.4], zone: 'BEGINNER', difficulty: 'hard', points: 50 },

  { id: 7, position: [-12, 0.9, 6], zone: 'BEGINNER', difficulty: 'easy', points: 10 },
  { id: 8, position: [-11.2, 1.6, 6.8], zone: 'BEGINNER', difficulty: 'medium', points: 25 },
  { id: 9, position: [-12.8, 2.3, 5.4], zone: 'BEGINNER', difficulty: 'hard', points: 50 },

  // HUB ANCHOR
  { id: 10, position: [0, 0.9, 0], zone: 'HUB', difficulty: 'easy', points: 10 },
  { id: 11, position: [1.2, 1.6, 0.8], zone: 'HUB', difficulty: 'medium', points: 25 },
  { id: 12, position: [-1.2, 2.3, -0.8], zone: 'HUB', difficulty: 'hard', points: 100 },

  // STREET ANCHORS
  { id: 13, position: [10, 0.9, 12], zone: 'STREET', difficulty: 'easy', points: 10 },
  { id: 14, position: [10.8, 1.6, 12.6], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 15, position: [9.4, 2.3, 11.4], zone: 'STREET', difficulty: 'hard', points: 50 },

  { id: 16, position: [12, 0.9, 4], zone: 'STREET', difficulty: 'easy', points: 10 },
  { id: 17, position: [12.6, 1.6, 4.8], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 18, position: [11.4, 2.3, 3.4], zone: 'STREET', difficulty: 'hard', points: 50 },

  { id: 19, position: [14, 0.9, 10], zone: 'STREET', difficulty: 'easy', points: 10 },
  { id: 20, position: [14.6, 1.6, 10.8], zone: 'STREET', difficulty: 'medium', points: 25 },
  { id: 21, position: [13.4, 2.3, 9.2], zone: 'STREET', difficulty: 'hard', points: 50 },

  // BOWL ANCHORS
  { id: 22, position: [6, 0.9, -12], zone: 'BOWL', difficulty: 'easy', points: 10 },
  { id: 23, position: [6.8, 1.6, -11.2], zone: 'BOWL', difficulty: 'medium', points: 25 },
  { id: 24, position: [5.2, 2.6, -12.8], zone: 'BOWL', difficulty: 'hard', points: 50 },

  { id: 25, position: [12, 0.9, -10], zone: 'BOWL', difficulty: 'easy', points: 10 },
  { id: 26, position: [12.6, 1.6, -9.2], zone: 'BOWL', difficulty: 'medium', points: 25 },
  { id: 27, position: [11.2, 2.6, -10.8], zone: 'BOWL', difficulty: 'hard', points: 50 },

  // ADVANCED ANCHOR
  { id: 28, position: [-10, 0.9, -12], zone: 'ADVANCED', difficulty: 'easy', points: 10 },
  { id: 29, position: [-9.2, 1.6, -11.2], zone: 'ADVANCED', difficulty: 'medium', points: 25 },
  { id: 30, position: [-10.8, 2.6, -12.8], zone: 'ADVANCED', difficulty: 'hard', points: 50 },
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
