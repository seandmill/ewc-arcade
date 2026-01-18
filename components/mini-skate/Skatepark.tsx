/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SKATEPARK_LAYOUT, ASSET_MAP, ParkElement } from './skateConstants';

// Individual park element component
const ParkElement: React.FC<ParkElement> = ({ type, position, rotation, scale = 1 }) => {
  const assetPath = ASSET_MAP[type];
  const { scene } = useGLTF(assetPath);

  // Clone scene to allow multiple instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Traverse and clone materials to prevent sharing issues
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = (child.material as THREE.Material).clone();
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={[0, THREE.MathUtils.degToRad(rotation), 0]}
      scale={scale}
    />
  );
};

// Main skatepark component
const Skatepark: React.FC = () => {
  return (
    <group>
      {SKATEPARK_LAYOUT.map((element, index) => (
        <ParkElement key={`${element.type}-${index}`} {...element} />
      ))}
    </group>
  );
};

// Preload all park assets
export function preloadParkAssets() {
  const uniquePaths = new Set(Object.values(ASSET_MAP));
  uniquePaths.forEach((path) => {
    useGLTF.preload(path);
  });
}

export default Skatepark;
