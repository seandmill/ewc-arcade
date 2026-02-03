/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useGLTF, useTexture, Clone } from '@react-three/drei';
import * as THREE from 'three';
import { SKATEPARK_LAYOUT, ASSET_MAP, ParkElement, FLOOR_TILES } from './skateConstants';

const applyColormapToScene = (scene: THREE.Group, colormap: THREE.Texture) => {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[];
      const material = Array.isArray(mat) ? mat[0] : mat;
      if (material && !material.map) {
        material.map = colormap;
        material.needsUpdate = true;
      }
      child.castShadow = false;
      child.receiveShadow = true;
    }
  });
};

const extractMeshInfo = (scene: THREE.Group) => {
  let mesh: THREE.Mesh | null = null;
  scene.traverse((child) => {
    if (!mesh && child instanceof THREE.Mesh) {
      mesh = child;
    }
  });
  if (!mesh) return null;
  const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  return {
    geometry: mesh.geometry,
    material,
  };
};

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
    applyColormapToScene(scene, colormap);
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

const FloorInstances: React.FC = () => {
  const concreteScene = useGLTF(ASSET_MAP['floor-concrete']).scene;
  const woodScene = useGLTF(ASSET_MAP['floor-wood']).scene;
  const colormap = useTexture('/assets/mini-skate/colormap.png');
  colormap.flipY = false;
  colormap.colorSpace = THREE.SRGBColorSpace;

  useMemo(() => {
    applyColormapToScene(concreteScene, colormap);
    applyColormapToScene(woodScene, colormap);
  }, [concreteScene, woodScene, colormap]);

  const concreteMeshInfo = useMemo(() => extractMeshInfo(concreteScene), [concreteScene]);
  const woodMeshInfo = useMemo(() => extractMeshInfo(woodScene), [woodScene]);

  const { concreteMatrices, woodMatrices } = useMemo(() => {
    const concrete: THREE.Matrix4[] = [];
    const wood: THREE.Matrix4[] = [];
    const temp = new THREE.Object3D();

    FLOOR_TILES.forEach((tile) => {
      temp.position.set(tile.position[0], tile.position[1], tile.position[2]);
      temp.rotation.set(0, THREE.MathUtils.degToRad(tile.rotation), 0);
      const scale = tile.scale ?? 1;
      temp.scale.set(scale, scale, scale);
      temp.updateMatrix();
      if (tile.type === 'floor-wood') {
        wood.push(temp.matrix.clone());
      } else {
        concrete.push(temp.matrix.clone());
      }
    });

    return { concreteMatrices: concrete, woodMatrices: wood };
  }, []);

  const concreteRef = useRef<THREE.InstancedMesh>(null);
  const woodRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (concreteRef.current) {
      concreteMatrices.forEach((matrix, index) => {
        concreteRef.current?.setMatrixAt(index, matrix);
      });
      concreteRef.current.instanceMatrix.needsUpdate = true;
    }
    if (woodRef.current) {
      woodMatrices.forEach((matrix, index) => {
        woodRef.current?.setMatrixAt(index, matrix);
      });
      woodRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [concreteMatrices, woodMatrices]);

  if (!concreteMeshInfo || !woodMeshInfo) return null;

  return (
    <group>
      <instancedMesh
        ref={concreteRef}
        args={[concreteMeshInfo.geometry, concreteMeshInfo.material, concreteMatrices.length]}
        castShadow={false}
        receiveShadow
      />
      <instancedMesh
        ref={woodRef}
        args={[woodMeshInfo.geometry, woodMeshInfo.material, woodMatrices.length]}
        castShadow={false}
        receiveShadow
      />
    </group>
  );
};

// Main skatepark component
const Skatepark: React.FC = () => {
  return (
    <group>
      <FloorInstances />
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
