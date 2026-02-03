/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ASSETS, PHYSICS, TRICKS, PARK_SIZE, RAMP_DATA, OBSTACLE_DATA } from './skateConstants';
import { InputState } from './useSkateControls';
import { cameraTarget } from './SkateCanvas';

declare global {
  interface Window {
    advanceTime?: (ms: number) => void;
  }
}

export interface SkaterState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  verticalVelocity: number;
  isGrounded: boolean;
  isGrinding: boolean;
  currentTrick: string | null;
  airborneTime: number;
}

interface SkaterProps {
  character: 'boy' | 'girl';
  input: InputState;
  onStateUpdate: (state: SkaterState) => void;
  onTrickPerformed: (trickName: string) => void;
}

const Skater: React.FC<SkaterProps> = ({
  character,
  input,
  onStateUpdate,
  onTrickPerformed,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef<SkaterState>({
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: 0,
    verticalVelocity: 0,
    isGrounded: true,
    isGrinding: false,
    currentTrick: null,
    airborneTime: 0,
  });

  // CRITICAL: Use a ref to track input so useFrame always sees latest values
  // React state updates don't trigger re-renders inside useFrame's closure
  const inputRef = useRef<InputState>(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Track animation state
  const currentAnimRef = useRef<string>('idle');
  const lastTrickRef = useRef<number>(-1);

  // Track previous input state for edge detection (prevents auto-jumping when holding)
  const prevJumpRef = useRef(false);
  const rampContactRef = useRef(false);

  const FIXED_DT = 1 / 60;
  const MAX_ACCUM = 0.1;
  const accumulatorRef = useRef(0);
  const advanceMsRef = useRef(0);
  const tempVecRef = useRef(new THREE.Vector3());

  // Throttle state updates to reduce React re-renders (update at ~20fps instead of 60fps)
  const lastUpdateTimeRef = useRef(0);
  const UPDATE_INTERVAL = 50; // ms between React state updates
  const frameCountRef = useRef(0); // For debug logging

  // Load character model
  const characterPath = character === 'boy' ? ASSETS.characters.boy : ASSETS.characters.girl;
  const { scene, animations } = useGLTF(characterPath);
  const { actions, names } = useAnimations(animations, groupRef);

  // Load the shared colormap texture used by Kenney assets
  const colormap = useTexture('/assets/mini-skate/colormap.png');
  colormap.flipY = false;
  colormap.colorSpace = THREE.SRGBColorSpace;

  // Apply texture directly to scene materials (no cloning!)
  // CRITICAL: scene.clone(true) breaks R3F's object tracking - the cloned
  // objects are not properly registered in the reconciler, causing the mesh
  // to appear frozen while physics continue updating the group position.
  useMemo(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.map = colormap;
          mat.needsUpdate = true;
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, colormap]);


  // Find best matching animation name
  const findAnimation = (searchTerms: string[]): string | null => {
    for (const term of searchTerms) {
      const match = names.find(
        (name) => name.toLowerCase().includes(term.toLowerCase())
      );
      if (match) return match;
    }
    return null;
  };

  // Animation name mapping (will use actual names from GLB)
  const animationMap = useMemo(() => {
    return {
      idle: findAnimation(['idle', 'stand']) || names[0],
      push: findAnimation(['push', 'skate']) || names[0],
      coast: findAnimation(['coast', 'ride', 'idle']) || names[0],
      turnLeft: findAnimation(['left', 'turn']) || names[0],
      turnRight: findAnimation(['right', 'turn']) || names[0],
      ollie: findAnimation(['ollie', 'jump']) || names[0],
      kickflip: findAnimation(['kickflip', 'kick', 'flip']) || names[0],
      heelflip: findAnimation(['heelflip', 'heel']) || names[0],
      flip360: findAnimation(['360', 'spin']) || names[0],
      grab: findAnimation(['grab', 'indy', 'nose', 'tail']) || names[0],
      grind: findAnimation(['grind', 'rail']) || names[0],
      fall: findAnimation(['fall', 'crash']) || names[0],
    };
  }, [names]);

  // Play animation with crossfade
  const playAnimation = (animName: string, loop = true) => {
    const mappedName = animationMap[animName as keyof typeof animationMap] || animName;
    if (!mappedName || !actions[mappedName]) return;
    if (currentAnimRef.current === mappedName) return;

    // Fade out current
    const currentAction = actions[currentAnimRef.current];
    if (currentAction) {
      currentAction.fadeOut(0.2);
    }

    // Fade in new
    const newAction = actions[mappedName];
    if (newAction) {
      newAction.reset();
      newAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
      newAction.clampWhenFinished = !loop;
      newAction.fadeIn(0.2);
      newAction.play();
      currentAnimRef.current = mappedName;
    }
  };

  // Store actions in a ref to avoid stale closure issues without causing re-renders
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    window.advanceTime = (ms: number) => {
      advanceMsRef.current += ms;
    };
    return () => {
      if (window.advanceTime) {
        delete window.advanceTime;
      }
    };
  }, []);

  // Start idle animation on mount - use ref to avoid infinite loop from actions changing
  useEffect(() => {
    const idleAnim = animationMap.idle;
    const currentActions = actionsRef.current;
    if (idleAnim && currentActions[idleAnim]) {
      currentActions[idleAnim]?.reset().play();
      currentAnimRef.current = idleAnim;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationMap.idle]);

  const stepPhysics = (dt: number) => {
    const currentInput = inputRef.current;
    const state = stateRef.current;
    const tempVec = tempVecRef.current;
    const wasGrounded = state.isGrounded;

    // Gravity
    if (!state.isGrounded) {
      state.verticalVelocity -= PHYSICS.GRAVITY * dt;
    } else {
      state.verticalVelocity = 0;
    }
    state.verticalVelocity = THREE.MathUtils.clamp(
      state.verticalVelocity,
      -PHYSICS.MAX_VERTICAL_VEL,
      PHYSICS.MAX_VERTICAL_VEL
    );

    if (state.isGrounded) {
      if (currentInput.forward) {
        tempVec.set(Math.sin(state.rotation), 0, Math.cos(state.rotation));
        state.velocity.addScaledVector(tempVec, PHYSICS.PUSH_ACCEL * dt);
      }

      if (currentInput.backward) {
        state.velocity.multiplyScalar(PHYSICS.BRAKE_FRICTION);
      }

      if (currentInput.turnLeft) {
        state.rotation += PHYSICS.TURN_SPEED * dt;
      }
      if (currentInput.turnRight) {
        state.rotation -= PHYSICS.TURN_SPEED * dt;
      }

      const jumpPressed = currentInput.jump && !prevJumpRef.current;
      if (jumpPressed) {
        state.verticalVelocity = rampContactRef.current
          ? PHYSICS.RAMP_LAUNCH
          : PHYSICS.JUMP_FORCE;
        state.isGrounded = false;
        playAnimation('ollie', false);
      }

      if (!currentInput.backward) {
        state.velocity.multiplyScalar(PHYSICS.FRICTION);
      }
    } else {
      if (currentInput.turnLeft) {
        state.rotation += PHYSICS.TURN_SPEED * PHYSICS.AIR_CONTROL * dt;
      }
      if (currentInput.turnRight) {
        state.rotation -= PHYSICS.TURN_SPEED * PHYSICS.AIR_CONTROL * dt;
      }

      const trickIndex = currentInput.trick1 ? 0 : currentInput.trick2 ? 1 : currentInput.trick3 ? 2 : currentInput.trick4 ? 3 : -1;
      if (trickIndex >= 0 && trickIndex < TRICKS.length && trickIndex !== lastTrickRef.current) {
        const trick = TRICKS[trickIndex as 0 | 1 | 2 | 3];
        state.currentTrick = trick.name;
        lastTrickRef.current = trickIndex;
        playAnimation(trick.id, false);
        onTrickPerformed(trick.name);
      }
    }

    if (state.velocity.length() > PHYSICS.MAX_SPEED) {
      state.velocity.setLength(PHYSICS.MAX_SPEED);
    }
    if (state.velocity.lengthSq() < 0.0004) {
      state.velocity.set(0, 0, 0);
    }

    state.position.addScaledVector(state.velocity, dt);
    state.position.y += state.verticalVelocity * dt;

    // Ramp collision detection
    let onRamp = false;
    for (const ramp of RAMP_DATA) {
      const [rx, , rz] = ramp.position;
      const [sx, , sz] = ramp.size;
      const halfX = sx / 2;
      const halfZ = sz / 2;

      if (
        state.position.x >= rx - halfX && state.position.x <= rx + halfX &&
        state.position.z >= rz - halfZ && state.position.z <= rz + halfZ
      ) {
        let progress = 0;
        switch (ramp.direction) {
          case 'north':
            progress = (state.position.z - (rz - halfZ)) / sz;
            break;
          case 'south':
            progress = 1 - (state.position.z - (rz - halfZ)) / sz;
            break;
          case 'east':
            progress = (state.position.x - (rx - halfX)) / sx;
            break;
          case 'west':
            progress = 1 - (state.position.x - (rx - halfX)) / sx;
            break;
        }

        const rampHeight = Math.sin(progress * Math.PI / 2) * ramp.maxHeight;
        const nearSurface = state.position.y <= rampHeight + 0.05 && state.verticalVelocity <= 0.2;
        if (nearSurface) {
          state.position.y = rampHeight;
          state.verticalVelocity = 0;
          state.isGrounded = true;
          onRamp = true;
        }
      }
    }

    // Obstacle collision detection - simple AABB for boxes
    let onSurface = onRamp;
    for (const obstacle of OBSTACLE_DATA) {
      const [ox, , oz] = obstacle.position;
      const [sx, sy, sz] = obstacle.size;
      const halfX = sx / 2;
      const halfZ = sz / 2;

      if (
        state.position.x >= ox - halfX - 0.3 && state.position.x <= ox + halfX + 0.3 &&
        state.position.z >= oz - halfZ - 0.3 && state.position.z <= oz + halfZ + 0.3
      ) {
        if (state.position.y <= sy + 0.1 && state.position.y >= sy - 0.2) {
          state.position.y = sy;
          state.verticalVelocity = 0;
          state.isGrounded = true;
          state.currentTrick = null;
          onSurface = true;
        } else if (state.position.y < sy) {
          const dx = state.position.x - ox;
          const dz = state.position.z - oz;

          if (Math.abs(dx) > Math.abs(dz)) {
            state.position.x = ox + Math.sign(dx) * (halfX + 0.3);
            state.velocity.x *= -0.3;
          } else {
            state.position.z = oz + Math.sign(dz) * (halfZ + 0.3);
            state.velocity.z *= -0.3;
          }
        }
      }
    }

    if (!onSurface && state.position.y <= 0 && state.verticalVelocity < 0) {
      state.position.y = 0;
      state.verticalVelocity = 0;
      if (!state.isGrounded) {
        state.isGrounded = true;
      }
    }

    if (state.isGrounded && !wasGrounded) {
      state.currentTrick = null;
      lastTrickRef.current = -1;
    }

    const boundSize = PARK_SIZE.boundSize;
    state.position.x = THREE.MathUtils.clamp(state.position.x, -boundSize, boundSize);
    state.position.z = THREE.MathUtils.clamp(state.position.z, -boundSize, boundSize);

    const speed = state.velocity.length();
    if (state.isGrounded && !state.isGrinding) {
      if (speed > 0.4) {
        if (currentInput.forward) {
          playAnimation('push');
        } else if (currentInput.turnLeft) {
          playAnimation('turnLeft');
        } else if (currentInput.turnRight) {
          playAnimation('turnRight');
        } else {
          playAnimation('coast');
        }
      } else {
        playAnimation('idle');
      }
    }

    if (state.isGrounded) {
      state.airborneTime = 0;
    } else {
      state.airborneTime += dt;
    }

    rampContactRef.current = onRamp;
  };

  // Physics update
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const stepDelta = advanceMsRef.current > 0 ? advanceMsRef.current / 1000 : delta;
    if (advanceMsRef.current > 0) {
      advanceMsRef.current = 0;
    }

    accumulatorRef.current = Math.min(accumulatorRef.current + stepDelta, MAX_ACCUM);
    while (accumulatorRef.current >= FIXED_DT) {
      stepPhysics(FIXED_DT);
      accumulatorRef.current -= FIXED_DT;
    }

    const state = stateRef.current;

    groupRef.current.position.copy(state.position);
    groupRef.current.rotation.y = state.rotation;

    if (import.meta.env.DEV && frameCountRef.current % 300 === 0) {
      console.log('[Skater] Position:', state.position.x.toFixed(1), state.position.y.toFixed(1), state.position.z.toFixed(1));
    }
    frameCountRef.current++;

    prevJumpRef.current = inputRef.current.jump;

    cameraTarget.position.copy(state.position);
    cameraTarget.rotation = state.rotation;

    const now = performance.now();
    if (now - lastUpdateTimeRef.current >= UPDATE_INTERVAL) {
      lastUpdateTimeRef.current = now;
      onStateUpdate({
        ...state,
        position: state.position.clone(),
        velocity: state.velocity.clone(),
      });
    }
  });

  return (
    <group ref={groupRef}>
      {/* Rotate model 90° so character faces sideways (skating stance, not running) */}
      <primitive object={scene} scale={1} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
};

// Preload character assets
export function preloadCharacterAssets() {
  useGLTF.preload(ASSETS.characters.boy);
  useGLTF.preload(ASSETS.characters.girl);
}

export default Skater;
