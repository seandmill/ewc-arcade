/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STARS, StarData, STAR_COLLECT_RADIUS } from './skateConstants';

interface StarProps {
  star: StarData;
  onCollect: (starId: number, points: number) => void;
  skaterPosition: THREE.Vector3;
}

// Individual star with rotation and bobbing animation
const Star: React.FC<StarProps> = ({ star, onCollect, skaterPosition }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const collectedRef = useRef(false);
  const initialY = useRef(star.position[1]);
  const timeOffset = useRef(Math.random() * Math.PI * 2);
  // Reusable vector for collision checks - avoids GC pressure
  const starPosRef = useRef(new THREE.Vector3(...star.position));

  // Color based on difficulty
  const color = useMemo(() => {
    switch (star.difficulty) {
      case 'easy':
        return '#FFD700'; // Gold
      case 'medium':
        return '#FFA500'; // Orange
      case 'hard':
        return '#FF4500'; // Red-orange
      default:
        return '#FFD700';
    }
  }, [star.difficulty]);

  // Size based on difficulty
  const scale = useMemo(() => {
    switch (star.difficulty) {
      case 'easy':
        return 0.4;
      case 'medium':
        return 0.5;
      case 'hard':
        return 0.6;
      default:
        return 0.4;
    }
  }, [star.difficulty]);

  useFrame((state) => {
    if (!meshRef.current || collectedRef.current) return;

    // Rotation animation
    meshRef.current.rotation.y += 0.02;

    // Bobbing animation
    const time = state.clock.elapsedTime + timeOffset.current;
    meshRef.current.position.y = initialY.current + Math.sin(time * 2) * 0.15;

    // Collection check - reuse starPosRef to avoid allocations
    starPosRef.current.y = meshRef.current.position.y;
    const dist = skaterPosition.distanceTo(starPosRef.current);

    if (dist < STAR_COLLECT_RADIUS) {
      collectedRef.current = true;
      onCollect(star.id, star.points);
    }
  });

  if (collectedRef.current) return null;

  return (
    <mesh ref={meshRef} position={star.position}>
      {/* Star shape using octahedron geometry */}
      <octahedronGeometry args={[scale, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
      {/* Lightweight glow halo */}
      <mesh scale={1.6}>
        <octahedronGeometry args={[scale, 0]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.25}
          toneMapped={false}
        />
      </mesh>
    </mesh>
  );
};

interface StarsProps {
  collectedIds: number[];
  onCollect: (starId: number, points: number) => void;
  skaterPosition: THREE.Vector3;
}

// Stars collection component - renders all uncollected stars
const Stars: React.FC<StarsProps> = ({ collectedIds, onCollect, skaterPosition }) => {
  // Filter out already collected stars
  const visibleStars = useMemo(
    () => STARS.filter((star) => !collectedIds.includes(star.id)),
    [collectedIds]
  );

  return (
    <group>
      {visibleStars.map((star) => (
        <Star
          key={star.id}
          star={star}
          onCollect={onCollect}
          skaterPosition={skaterPosition}
        />
      ))}
    </group>
  );
};

export default Stars;
