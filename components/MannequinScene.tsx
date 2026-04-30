"use client"

// Scène 3D du mannequin paramétrique + drapé t-shirt statique.
// Toutes les mesures du domaine sont en cm. Three.js travaille en mètres
// (1 unité = 1 m). On convertit avec CM_TO_M.

import { useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import type { SizeMeasurements } from "@/lib/types/pattern"

const CM_TO_M = 0.01
const SKIN_COLOR = "#e8c5a0"
const GARMENT_COLOR = "#a78bfa"

// Convertit une circonférence en cm vers un rayon en mètres.
const circToRadius = (circCm: number): number => (circCm / (2 * Math.PI)) * CM_TO_M

interface MannequinProps {
  measurements: SizeMeasurements
}

function Mannequin({ measurements }: MannequinProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Rotation lente automatique pour que l'utilisateur voit que c'est un volume 3D.
  // Désactivée pendant qu'OrbitControls est utilisé — drei gère ça via damping.
  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
  })

  const params = useMemo(() => {
    const m = measurements

    const rChest = circToRadius(m.poitrine)
    const rWaist = circToRadius(m.taille)
    const rHip   = circToRadius(m.hanches)

    const torsoH = m.longueurDos * CM_TO_M

    // Profil du torse pour LatheGeometry, de bas en haut.
    // Y=0 correspond aux hanches, Y=torsoH au sommet des épaules.
    const bodyProfile: THREE.Vector2[] = [
      new THREE.Vector2(0,                     -torsoH * 0.05),
      new THREE.Vector2(rHip * 0.95,           -torsoH * 0.05),
      new THREE.Vector2(rHip,                   0),
      new THREE.Vector2(rWaist,                 torsoH * 0.45),
      new THREE.Vector2(rChest * 0.98,          torsoH * 0.78),
      new THREE.Vector2(rChest * 0.85,          torsoH * 0.92),
      new THREE.Vector2(0.045,                  torsoH * 1.00),
      new THREE.Vector2(0,                      torsoH * 1.00),
    ]

    // Aisance vêtement : +6 cm sur la circonférence ≈ +0.95 cm sur le rayon.
    const ease = 0.0095
    const garmentProfile: THREE.Vector2[] = [
      new THREE.Vector2(rHip + ease,           -torsoH * 0.04),
      new THREE.Vector2(rHip + ease,            0),
      new THREE.Vector2(rWaist + ease,          torsoH * 0.45),
      new THREE.Vector2(rChest + ease,          torsoH * 0.78),
      new THREE.Vector2(rChest * 0.85 + ease,   torsoH * 0.92),
    ]

    const shoulderWidthM = m.epaule * CM_TO_M
    const sleeveLengthM  = m.longueurManche * CM_TO_M

    return {
      bodyProfile,
      garmentProfile,
      torsoH,
      shoulderWidthM,
      sleeveLengthM,
      armRadius: 0.045,
      shoulderY: torsoH * 0.92,
      headRadius: 0.10,
      neckRadius: 0.045,
    }
  }, [measurements])

  // Géométries Three.js (recréées seulement quand les mesures changent).
  const bodyGeometry = useMemo(
    () => new THREE.LatheGeometry(params.bodyProfile, 48),
    [params.bodyProfile],
  )
  const garmentGeometry = useMemo(
    () => new THREE.LatheGeometry(params.garmentProfile, 48),
    [params.garmentProfile],
  )

  return (
    <group ref={groupRef} position={[0, -params.torsoH / 2, 0]}>
      {/* Torse paramétrique (peau) */}
      <mesh geometry={bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Cou */}
      <mesh position={[0, params.torsoH * 1.02, 0]} castShadow>
        <cylinderGeometry args={[params.neckRadius, params.neckRadius * 1.1, 0.08, 16]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Tête */}
      <mesh position={[0, params.torsoH * 1.02 + 0.04 + params.headRadius, 0]} castShadow>
        <sphereGeometry args={[params.headRadius, 32, 32]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Bras (peau) — gauche & droit, longueur fixe ~55 cm depuis l'épaule */}
      {([-1, 1] as const).map((side) => {
        const armLength = 0.55
        const cx = side * (params.shoulderWidthM / 2 + armLength / 2)
        return (
          <mesh
            key={`arm-${side}`}
            position={[cx, params.shoulderY, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[params.armRadius * 0.85, params.armRadius, armLength, 20]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
          </mesh>
        )
      })}

      {/* Jambes — longueur fixe (le t-shirt s'arrête aux hanches, donc peu critique) */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`leg-${side}`}
          position={[side * 0.10, -params.torsoH * 0.05 - 0.42, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.06, 0.05, 0.85, 16]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}

      {/* T-shirt — torse drapé statique */}
      <mesh geometry={garmentGeometry} castShadow>
        <meshStandardMaterial
          color={GARMENT_COLOR}
          side={THREE.DoubleSide}
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>

      {/* Manches du t-shirt — cylindres ouverts plaqués sur les bras */}
      {([-1, 1] as const).map((side) => {
        const cx = side * (params.shoulderWidthM / 2 + params.sleeveLengthM / 2)
        return (
          <mesh
            key={`sleeve-${side}`}
            position={[cx, params.shoulderY, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry
              args={[
                params.armRadius * 1.6,
                params.armRadius * 1.9,
                params.sleeveLengthM,
                24,
                1,
                true, // open-ended : pas de tampons aux extrémités
              ]}
            />
            <meshStandardMaterial
              color={GARMENT_COLOR}
              side={THREE.DoubleSide}
              roughness={0.85}
              metalness={0.02}
            />
          </mesh>
        )
      })}
    </group>
  )
}

interface MannequinSceneProps {
  measurements: SizeMeasurements
}

export function MannequinScene({ measurements }: MannequinSceneProps) {
  return (
    <div className="relative w-full aspect-square rounded-xl bg-gradient-to-b from-purple-50 to-gray-100 overflow-hidden border border-gray-200">
      <Canvas
        shadows
        camera={{ position: [0.6, 0.3, 1.6], fov: 38, near: 0.1, far: 50 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[2, 3, 2]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-2, 1, -1]} intensity={0.35} />

        <Mannequin measurements={measurements} />

        {/* Sol subtil pour ancrer la silhouette */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
          <circleGeometry args={[1.2, 48]} />
          <meshStandardMaterial color="#f3e8ff" roughness={1} />
        </mesh>

        <OrbitControls
          enablePan={false}
          minDistance={0.8}
          maxDistance={3}
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
      <div className="absolute bottom-3 left-3 text-[11px] text-gray-500 bg-white/70 backdrop-blur-sm rounded-md px-2 py-1">
        Glisse pour tourner · molette pour zoomer
      </div>
    </div>
  )
}

export default MannequinScene
