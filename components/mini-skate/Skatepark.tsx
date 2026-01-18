/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo } from 'react';
import { useGLTF, useTexture, Clone } from '@react-three/drei';
import * as THREE from 'three';
import { SKATEPARK_LAYOUT, ASSET_MAP, ParkElement } from './skateConstants';

// Individual park element component - uses drei's Clone for safe instancing
const ParkElementMesh: React.FC<ParkElement> = ({ type, position, rotation, scale = 1 }) => {
  const assetPath = ASSET_MAP[type];
  const { scene } = useGLTF(assetPath);

  // Load the shared colormap texture
  const colormap = useTexture('/assets/mini-skate/colormap.png');
  colormap.flipY = false;
  colormap.colorSpace = THREE.SRGBColorSpace;

  // Apply texture to original scene materials (drei's Clone will handle the rest)
  useMemo(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat && !mat.map) {
          mat.map = colormap;
          mat.needsUpdate = true;
        }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, colormap]);

  return (
    <Clone
      object={scene}
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
