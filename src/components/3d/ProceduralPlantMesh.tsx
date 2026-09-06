import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GrowthVisualState } from '../../lib/growthVisualEngine';

interface ProceduralPlantMeshProps {
  visualState: GrowthVisualState;
  compact?: boolean;
}

export const ProceduralPlantMesh: React.FC<ProceduralPlantMeshProps> = ({ visualState, compact = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const stemRef = useRef<THREE.Group>(null);

  const {
    cropCategory,
    stageKey,
    canopy_scale,
    wilt_factor,
    leaf_color,
    stem_color,
    fruit_color,
    fruit_count,
    fruit_scale
  } = visualState;

  // Gentle wind sway animation (dampened if heavily wilted)
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const swayAmount = (1 - wilt_factor * 0.7) * 0.05;
    const swaySpeed = (1 - wilt_factor * 0.5) * 1.5;
    groupRef.current.rotation.z = Math.sin(t * swaySpeed) * swayAmount;
    groupRef.current.rotation.x = Math.cos(t * swaySpeed * 0.8) * (swayAmount * 0.5);
  });

  // Calculate stem bend from wilt factor
  const stemBendZ = useMemo(() => wilt_factor * 0.35, [wilt_factor]);
  const leafDroopAngle = useMemo(() => (wilt_factor * 0.75), [wilt_factor]);

  // Height and scale
  const baseScale = compact ? 0.85 : 1.1;
  const totalScale = canopy_scale * baseScale;

  // Number of leaf tiers based on growth stage
  const tierCount = stageKey === 'vegetative' ? 3 : stageKey === 'flowering' ? 4 : 5;

  return (
    <group ref={groupRef} scale={[totalScale, totalScale, totalScale]} position={[0, -0.9, 0]}>
      {/* ── Earthen Soil Base Disc ── */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <cylinderGeometry args={[1.2, 1.35, 0.22, 32]} />
        <meshStandardMaterial color="#2d1c13" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[1.1, 1.18, 0.04, 32]} />
        <meshStandardMaterial color="#3f271a" roughness={0.95} />
      </mesh>

      {/* ── Main Plant Body with Wilting Bend ── */}
      <group ref={stemRef} rotation={[0, 0, stemBendZ]}>
        {/* Central Stalk / Stem */}
        {cropCategory === 'tall_stalk' ? (
          // Segmented sturdy stalk (Maize / Sugarcane)
          <group>
            {[0, 1, 2, 3].map((seg) => (
              <group key={seg} position={[0, 0.25 + seg * 0.5, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.07 - seg * 0.008, 0.08 - seg * 0.008, 0.48, 12]} />
                  <meshStandardMaterial color={stem_color} roughness={0.7} />
                </mesh>
                {/* Cane Ring / Node */}
                <mesh position={[0, 0.24, 0]}>
                  <torusGeometry args={[0.085 - seg * 0.008, 0.02, 8, 16]} />
                  <meshStandardMaterial color="#4d7c0f" roughness={0.8} />
                </mesh>
              </group>
            ))}
          </group>
        ) : cropCategory === 'grain' ? (
          // Slender grain tillers (Wheat / Rice)
          <group>
            {[-0.08, 0, 0.08].map((offset, idx) => (
              <mesh key={idx} position={[offset, 0.9, (idx - 1) * 0.06]} rotation={[0, 0, offset * 1.5]} castShadow>
                <cylinderGeometry args={[0.025, 0.04, 1.8, 8]} />
                <meshStandardMaterial color={stem_color} roughness={0.8} />
              </mesh>
            ))}
          </group>
        ) : (
          // Branching bush stem (Cotton / Tomato / Chilli)
          <mesh position={[0, 0.8, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.07, 1.6, 12]} />
            <meshStandardMaterial color={stem_color} roughness={0.7} />
          </mesh>
        )}

        {/* ── Foliage Leaves with Real-Time Droop Pitch ── */}
        {Array.from({ length: tierCount }).map((_, tierIdx) => {
          const tierHeight = 0.35 + tierIdx * 0.32;
          const tierSize = 1.0 - tierIdx * 0.12;
          const angles = cropCategory === 'grain' ? [0, Math.PI * 0.6, Math.PI * 1.3] : [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

          return (
            <group key={tierIdx} position={[0, tierHeight, 0]}>
              {angles.map((ang, leafIdx) => {
                // Natural base angle + dynamic wilt drooping pitch
                const basePitch = (Math.PI / 4) + leafDroopAngle * 0.85;
                const leafLength = cropCategory === 'grain' ? 0.7 * tierSize : cropCategory === 'tall_stalk' ? 0.85 * tierSize : 0.5 * tierSize;
                const leafWidth = cropCategory === 'tall_stalk' ? 0.18 : cropCategory === 'grain' ? 0.06 : 0.22;

                return (
                  <group key={leafIdx} rotation={[0, ang + tierIdx * 0.4, 0]}>
                    <group rotation={[basePitch, 0, 0]}>
                      {/* Leaf Blade Mesh */}
                      <mesh position={[0, leafLength * 0.45, 0]} castShadow receiveShadow>
                        {cropCategory === 'grain' ? (
                          // Slender narrow grass blade
                          <boxGeometry args={[leafWidth, leafLength, 0.015]} />
                        ) : cropCategory === 'tall_stalk' ? (
                          // Arching broad leaf
                          <boxGeometry args={[leafWidth, leafLength, 0.02]} />
                        ) : (
                          // Ovate broad leaf
                          <sphereGeometry args={[leafWidth * tierSize, 8, 8]} scale={[1, 1.8, 0.15]} />
                        )}
                        <meshStandardMaterial
                          color={leaf_color}
                          roughness={0.65}
                          side={THREE.DoubleSide}
                        />
                      </mesh>
                    </group>
                  </group>
                );
              })}
            </group>
          );
        })}

        {/* ── Flowers / Fruits / Grain Spike (Stage-Bound) ── */}
        {fruit_count > 0 && (
          <group position={[0, 1.7, 0]}>
            {cropCategory === 'grain' ? (
              // Golden Wheat / Rice Spike at the top
              <group position={[0, 0.2, 0]}>
                {[-0.08, 0, 0.08].map((xOff, i) => (
                  <mesh key={i} position={[xOff, 0.15, (i - 1) * 0.05]} castShadow>
                    <cylinderGeometry args={[0.045, 0.05, 0.55, 8]} />
                    <meshStandardMaterial color={fruit_color} roughness={0.8} />
                  </mesh>
                ))}
              </group>
            ) : cropCategory === 'tall_stalk' ? (
              // Maize Cob / Sugarcane Tassel
              <group position={[0.18, -0.4, 0]}>
                <mesh rotation={[0, 0, Math.PI / 6]} castShadow>
                  <cylinderGeometry args={[0.09 * fruit_scale, 0.08 * fruit_scale, 0.45 * fruit_scale, 12]} />
                  <meshStandardMaterial color={fruit_color} roughness={0.7} />
                </mesh>
              </group>
            ) : (
              // Plump Fruits (Tomatoes / Peppers / Cotton Bolls)
              <group>
                {Array.from({ length: fruit_count }).map((_, fIdx) => {
                  const fAngle = (fIdx / fruit_count) * Math.PI * 2;
                  const fY = -0.3 - (fIdx % 2) * 0.35;
                  const dist = 0.28 + (fIdx % 2) * 0.08;

                  return (
                    <group
                      key={fIdx}
                      position={[Math.cos(fAngle) * dist, fY, Math.sin(fAngle) * dist]}
                      scale={[fruit_scale, fruit_scale, fruit_scale]}
                    >
                      <mesh castShadow>
                        <sphereGeometry args={[0.11, 14, 14]} />
                        <meshStandardMaterial
                          color={fruit_color}
                          roughness={0.3}
                          metalness={0.1}
                        />
                      </mesh>
                      {/* Stem attachment */}
                      <mesh position={[0, 0.1, 0]}>
                        <cylinderGeometry args={[0.015, 0.015, 0.08, 6]} />
                        <meshStandardMaterial color="#166534" />
                      </mesh>
                    </group>
                  );
                })}
              </group>
            )}
          </group>
        )}
      </group>
    </group>
  );
};
