/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import Skatepark from './Skatepark';
import Skater, { SkaterState } from './Skater';
import { InputState } from './useSkateControls';

// Module-level store for camera target - shared between Skater and FollowCamera
// This avoids React/R3F reconciler boundary issues with refs
export const cameraTarget = {
  position: new THREE.Vector3(0, 0, 0),
  rotation: 0,
};

// Follow camera that smoothly tracks the skater using direct camera access
const FollowCamera: React.FC = () => {
  const { camera } = useThree();
  const frameCountRef = useRef(0);
  const initializedRef = useRef(false);

  // Initialize camera position on first frame
  useFrame(() => {
    if (!initializedRef.current) {
      camera.position.set(0, 5, -8);
      initializedRef.current = true;
    }

    // Read from module-level store (updated every frame by Skater)
    const targetPosition = cameraTarget.position;
    const targetRotation = cameraTarget.rotation;

    // DEBUG: Log every 60 frames to verify camera is updating
    frameCountRef.current++;
    if (frameCountRef.current % 60 === 0) {
      console.log('[FollowCamera] Target:', targetPosition.x.toFixed(2), targetPosition.y.toFixed(2), targetPosition.z.toFixed(2),
        'Camera:', camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2));
    }

    // Camera offset: behind and above the skater
    const offsetDistance = 6;
    const offsetHeight = 3;

    // Calculate camera position based on skater rotation
    const offsetX = -Math.sin(targetRotation) * offsetDistance;
    const offsetZ = -Math.cos(targetRotation) * offsetDistance;

    const desiredPosition = new THREE.Vector3(
      targetPosition.x + offsetX,
      targetPosition.y + offsetHeight,
      targetPosition.z + offsetZ
    );

    // Smooth interpolation
    camera.position.lerp(desiredPosition, 0.08);

    // Look at skater (slightly above ground level)
    const lookTarget = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y + 0.5,
      targetPosition.z
    );
    camera.lookAt(lookTarget);

    // Ensure the camera matrix is updated
    camera.updateProjectionMatrix();
  });

  return null;  // No component needed - we manipulate the default camera directly
};

interface SkateCanvasProps {
  character: 'boy' | 'girl';
  input: InputState;
  onSkaterUpdate: (state: SkaterState) => void;
  onTrickPerformed: (trickName: string) => void;
}

const SkateCanvas: React.FC<SkateCanvasProps> = ({
  character,
  input,
  onSkaterUpdate,
  onTrickPerformed,
}) => {
  // Handler for throttled state updates (UI uses this)
  const handleStateUpdate = useCallback((state: SkaterState) => {
    onSkaterUpdate(state);
  }, [onSkaterUpdate]);

  return (
    <Canvas shadows>
      {/* Camera - reads from module-level cameraTarget updated every frame by Skater */}
      <FollowCamera />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      {/* Sky/Environment */}
      <Environment preset="sunset" />
      <color attach="background" args={['#87CEEB']} />

      {/* Ground plane for shadows */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <shadowMaterial opacity={0.3} />
      </mesh>

      {/* Skatepark */}
      <Skatepark />

      {/* Skater */}
      <Skater
        character={character}
        input={input}
        onStateUpdate={handleStateUpdate}
        onTrickPerformed={onTrickPerformed}
      />
    </Canvas>
  );
};

export default SkateCanvas;
