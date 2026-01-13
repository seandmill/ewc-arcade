/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { PLAYER_CHARACTERS } from '../../constants';

interface CharacterModelProps {
  characterId: string;
  autoRotate?: boolean;
  scale?: number;
  yOffset?: number;
}

export const CharacterModel: React.FC<CharacterModelProps> = ({
  characterId,
  autoRotate = false,
  scale = 1,
  yOffset = 0,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(`/assets/characters-3d/${characterId}.glb`);

  // Clone scene for independent instances
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useFrame((state) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.8;
    }
  });

  return (
    <group ref={groupRef} scale={scale} position={[0, yOffset, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
};

// Preload all character models for instant switching
PLAYER_CHARACTERS.forEach((char) => {
  useGLTF.preload(`/assets/characters-3d/${char.id}.glb`);
});

export default CharacterModel;
