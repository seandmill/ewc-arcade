/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import Skatepark from './Skatepark';
import Skater, { SkaterState } from './Skater';
import { InputState } from './useSkateControls';

interface FollowCameraProps {
  targetPosition: THREE.Vector3;
  targetRotation: number;
}

// Follow camera that smoothly tracks the skater
const FollowCamera: React.FC<FollowCameraProps> = ({ targetPosition, targetRotation }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(() => {
    if (!cameraRef.current) return;

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
    cameraRef.current.position.lerp(desiredPosition, 0.08);

    // Look at skater (slightly above ground level)
    const lookTarget = new THREE.Vector3(
      targetPosition.x,
      targetPosition.y + 0.5,
      targetPosition.z
    );
    cameraRef.current.lookAt(lookTarget);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={60}
      near={0.1}
      far={1000}
      position={[0, 5, -8]}
    />
  );
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
  const skaterStateRef = useRef<SkaterState>({
    position: new THREE.Vector3(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: 0,
    verticalVelocity: 0,
    isGrounded: true,
    isGrinding: false,
    currentTrick: null,
  });

  const handleStateUpdate = (state: SkaterState) => {
    skaterStateRef.current = state;
    onSkaterUpdate(state);
  };

  return (
    <Canvas shadows>
      {/* Camera */}
      <FollowCamera
        targetPosition={skaterStateRef.current.position}
        targetRotation={skaterStateRef.current.rotation}
      />

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
