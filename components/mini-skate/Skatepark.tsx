/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SKATEPARK_LAYOUT, ASSET_MAP, ParkElement } from './skateConstants';

// Individual park element component
const ParkElementMesh: React.FC<ParkElement> = ({ type, position, rotation, scale = 1 }) => {
  const assetPath = ASSET_MAP[type];
  const { scene } = useGLTF(assetPath);

  // Load the shared colormap texture used by Kenney assets
  const colormap = useTexture('/assets/mini-skate/colormap.png');
  colormap.flipY = false; // GLB models typically don't flip Y
  colormap.colorSpace = THREE.SRGBColorSpace;

  // Clone scene to allow multiple instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    // Traverse and clone materials, applying the colormap texture
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
        <ParkElementMesh key={`${element.type}-${index}`} {...element} />
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
