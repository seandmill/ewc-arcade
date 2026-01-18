/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF, useAnimations, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ASSETS, PHYSICS, TRICKS } from './skateConstants';
import { InputState } from './useSkateControls';
import { cameraTarget } from './SkateCanvas';

export interface SkaterState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: number;
  verticalVelocity: number;
  isGrounded: boolean;
  isGrinding: boolean;
  currentTrick: string | null;
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

  // Clone scene for this instance
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = (child.material as THREE.MeshStandardMaterial).clone();
        material.map = colormap;
        material.needsUpdate = true;
        child.material = material;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
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

  // Physics update
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Read input from ref to get latest values (avoids stale closure)
    const currentInput = inputRef.current;
    const state = stateRef.current;
    const speed = state.velocity.length();

    // Gravity
    if (!state.isGrounded) {
      state.verticalVelocity -= PHYSICS.GRAVITY * delta;
    }

    // Movement input
    if (state.isGrounded) {
      // Forward/backward
      if (currentInput.forward) {
        const forward = new THREE.Vector3(
          Math.sin(state.rotation),
          0,
          Math.cos(state.rotation)
        );
        state.velocity.add(forward.multiplyScalar(PHYSICS.PUSH_ACCEL * delta));
      }

      if (currentInput.backward) {
        state.velocity.multiplyScalar(PHYSICS.BRAKE_FRICTION);
      }

      // Turning
      if (currentInput.turnLeft) {
        state.rotation += PHYSICS.TURN_SPEED * delta;
      }
      if (currentInput.turnRight) {
        state.rotation -= PHYSICS.TURN_SPEED * delta;
      }

      // Jump - use edge detection to prevent auto-jumping when holding button
      const jumpPressed = currentInput.jump && !prevJumpRef.current;
      if (jumpPressed && state.isGrounded) {
        state.verticalVelocity = PHYSICS.JUMP_FORCE;
        state.isGrounded = false;
        playAnimation('ollie', false);
      }

      // Apply friction
      state.velocity.multiplyScalar(PHYSICS.FRICTION);
    } else {
      // Air control (reduced)
      if (currentInput.turnLeft) {
        state.rotation += PHYSICS.TURN_SPEED * PHYSICS.AIR_CONTROL * delta;
      }
      if (currentInput.turnRight) {
        state.rotation -= PHYSICS.TURN_SPEED * PHYSICS.AIR_CONTROL * delta;
      }

      // Check for trick input while airborne
      const trickIndex = currentInput.trick1 ? 0 : currentInput.trick2 ? 1 : currentInput.trick3 ? 2 : currentInput.trick4 ? 3 : -1;
      if (trickIndex >= 0 && trickIndex < TRICKS.length && trickIndex !== lastTrickRef.current) {
        const trick = TRICKS[trickIndex as 0 | 1 | 2 | 3];
        state.currentTrick = trick.name;
        lastTrickRef.current = trickIndex;
        playAnimation(trick.id, false);
        onTrickPerformed(trick.name);
      }
    }

    // Clamp speed
    if (state.velocity.length() > PHYSICS.MAX_SPEED) {
      state.velocity.normalize().multiplyScalar(PHYSICS.MAX_SPEED);
    }

    // Update position
    state.position.add(state.velocity.clone().multiplyScalar(delta * 60));
    state.position.y += state.verticalVelocity * delta;

    // Ground collision
    if (state.position.y <= 0 && state.verticalVelocity < 0) {
      state.position.y = 0;
      state.verticalVelocity = 0;
      if (!state.isGrounded) {
        state.isGrounded = true;
        state.currentTrick = null;
        lastTrickRef.current = -1;
      }
    }

    // Park bounds (keep within ~10 unit radius)
    const boundSize = 9;
    state.position.x = THREE.MathUtils.clamp(state.position.x, -boundSize, boundSize);
    state.position.z = THREE.MathUtils.clamp(state.position.z, -boundSize, boundSize);

    // Update animation based on state
    if (state.isGrounded && !state.isGrinding) {
      if (speed > 0.5) {
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

    // Apply to mesh
    groupRef.current.position.copy(state.position);
    groupRef.current.rotation.y = state.rotation;

    // DEBUG: Log every 60 frames to verify mesh position is updating
    if (frameCountRef.current % 60 === 0) {
      console.log('[Skater] State position:', state.position.x.toFixed(2), state.position.y.toFixed(2), state.position.z.toFixed(2),
        'Mesh position:', groupRef.current.position.x.toFixed(2), groupRef.current.position.y.toFixed(2), groupRef.current.position.z.toFixed(2));
    }
    frameCountRef.current++;

    // Update previous input state for edge detection
    prevJumpRef.current = currentInput.jump;

    // Always update camera target every frame (no throttle) for smooth following
    cameraTarget.position.copy(state.position);
    cameraTarget.rotation = state.rotation;

    // Throttle React state updates to reduce re-renders (~20fps instead of 60fps)
    const now = performance.now();
    if (now - lastUpdateTimeRef.current >= UPDATE_INTERVAL) {
      lastUpdateTimeRef.current = now;
      // Notify parent of state - clone Vector3 objects to avoid reference issues
      onStateUpdate({
        ...state,
        position: state.position.clone(),
        velocity: state.velocity.clone(),
      });
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={1} />
    </group>
  );
};

// Preload character assets
export function preloadCharacterAssets() {
  useGLTF.preload(ASSETS.characters.boy);
  useGLTF.preload(ASSETS.characters.girl);
}

export default Skater;
