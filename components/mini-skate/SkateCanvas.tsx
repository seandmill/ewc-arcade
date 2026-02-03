/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { InputState } from './useSkateControls';
import Skater, { SkaterState } from './Skater';
import Skatepark from './Skatepark';
import Stars from './Stars';

// Module-level store for camera target - avoids React/R3F reconciler issues
// The Skater component writes to this every frame, and FollowCamera reads from it.
// This bypasses React's reconciler entirely, preventing re-render cascades.
export const cameraTarget = {
  position: new THREE.Vector3(0, 0, 0),
  rotation: 0,
};

// Follow camera that smoothly tracks the target using direct camera access
const FollowCamera: React.FC = () => {
  const { camera } = useThree();
  const initializedRef = useRef(false);
  // Reusable vectors to avoid GC pressure in hot render loop
  const desiredPositionRef = useRef(new THREE.Vector3());
  const lookTargetRef = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!initializedRef.current) {
      camera.position.set(0, 5, -8);
      initializedRef.current = true;
    }

    // Read from module-level store (updated every frame by Skater)
    const targetPosition = cameraTarget.position;
    const targetRotation = cameraTarget.rotation;

    // Camera offset: behind and above
    const offsetDistance = 6;
    const offsetHeight = 3;
    const offsetX = -Math.sin(targetRotation) * offsetDistance;
    const offsetZ = -Math.cos(targetRotation) * offsetDistance;

    // Reuse vector refs instead of allocating new objects
    desiredPositionRef.current.set(
      targetPosition.x + offsetX,
      targetPosition.y + offsetHeight,
      targetPosition.z + offsetZ
    );

    // Smooth interpolation - lower value = smoother but laggier
    // 0.05 reduces jitter from small position fluctuations
    camera.position.lerp(desiredPositionRef.current, 0.06);

    // Look at target
    lookTargetRef.current.set(
      targetPosition.x,
      targetPosition.y + 0.5,
      targetPosition.z
    );
    camera.lookAt(lookTargetRef.current);
    camera.updateProjectionMatrix();
  });

  return null;
};

interface SkateCanvasProps {
  character: 'boy' | 'girl';
  input: InputState;
  onSkaterUpdate: (state: SkaterState) => void;
  onTrickPerformed: (trickName: string) => void;
  collectedStars: number[];
  onStarCollected: (starId: number, points: number) => void;
  skaterPosition: THREE.Vector3;
}

const SkateCanvas: React.FC<SkateCanvasProps> = ({
  input,
  character,
  onSkaterUpdate,
  onTrickPerformed,
  collectedStars,
  onStarCollected,
  skaterPosition,
}) => {
  return (
    <Canvas shadows camera={{ position: [0, 5, -8], fov: 60 }}>
      {/* Camera following */}
      <FollowCamera />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* Sky */}
      <color attach="background" args={['#87CEEB']} />

      {/* NOTE: No simple floor here - Skatepark provides the floor tiles.
          Having both at Y=0 causes z-fighting (VCR static effect). */}

      {/* Skatepark obstacles and floor */}
      <Suspense fallback={null}>
        <Skatepark />
      </Suspense>

      {/* Collectible stars */}
      <Suspense fallback={null}>
        <Stars
          collectedIds={collectedStars}
          onCollect={onStarCollected}
          skaterPosition={skaterPosition}
        />
      </Suspense>

      {/* Player character with physics and animations */}
      <Suspense fallback={
        <mesh position={[0, 0.5, 0]}>
          <capsuleGeometry args={[0.25, 0.6, 8, 16]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
      }>
        <Skater
          character={character}
          input={input}
          onStateUpdate={onSkaterUpdate}
          onTrickPerformed={onTrickPerformed}
        />
      </Suspense>
    </Canvas>
  );
};

export default SkateCanvas;
