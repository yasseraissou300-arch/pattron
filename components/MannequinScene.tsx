"use client"

// Scène 3D du mannequin paramétrique + drapé t-shirt issu d'un mesh triangulé
// reconstruit à partir des pièces réelles du patron (Devant, Dos, Manches).
// Le maillage est calculé via Delaunay puis projeté en 3D par projection
// cylindrique sur le corps (cf. lib/3d/pattern-mesh.ts).

import { useMemo, useRef, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import type { SizeMeasurements } from "@/lib/types/pattern"
import { buildGarmentMesh, type PieceMesh } from "@/lib/3d/pattern-mesh"
import { FABRICS, type FabricKey } from "@/lib/3d/fabrics"

const CM_TO_M = 0.01
const SKIN_COLOR = "#e8c5a0"

const circToRadius = (circCm: number): number => (circCm / (2 * Math.PI)) * CM_TO_M

interface MannequinProps {
  measurements: SizeMeasurements
  fabric: FabricKey
}

function Mannequin({ measurements, fabric }: MannequinProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
  })

  // Géométries du corps (lathe + primitives) — recalculées si les mesures changent.
  const body = useMemo(() => {
    const m = measurements
    const rChest = circToRadius(m.poitrine)
    const rWaist = circToRadius(m.taille)
    const rHip = circToRadius(m.hanches)
    const torsoH = m.longueurDos * CM_TO_M

    const bodyProfile: THREE.Vector2[] = [
      new THREE.Vector2(0,                    -torsoH * 0.05),
      new THREE.Vector2(rHip * 0.95,          -torsoH * 0.05),
      new THREE.Vector2(rHip,                  0),
      new THREE.Vector2(rWaist,                torsoH * 0.45),
      new THREE.Vector2(rChest * 0.98,         torsoH * 0.78),
      new THREE.Vector2(rChest * 0.85,         torsoH * 0.92),
      new THREE.Vector2(0.045,                 torsoH * 1.0),
      new THREE.Vector2(0,                     torsoH * 1.0),
    ]

    return {
      bodyGeometry: new THREE.LatheGeometry(bodyProfile, 48),
      torsoH,
      shoulderWidthM: m.epaule * CM_TO_M,
      shoulderY: torsoH * 0.92,
      armRadius: 0.045,
      headRadius: 0.10,
      neckRadius: 0.045,
    }
  }, [measurements])

  // Meshs triangulés du vêtement issus des pièces réelles du patron.
  const garmentPieces = useMemo<PieceMesh[]>(
    () => buildGarmentMesh(measurements),
    [measurements],
  )

  // Cleanup des géométries quand on en remplace (évite les fuites GPU).
  useEffect(() => {
    return () => {
      garmentPieces.forEach((p) => p.geometry.dispose())
      body.bodyGeometry.dispose()
    }
  }, [garmentPieces, body.bodyGeometry])

  const fabricProps = FABRICS[fabric]

  return (
    <group ref={groupRef} position={[0, -body.torsoH / 2, 0]}>
      {/* ── Corps ── */}
      <mesh geometry={body.bodyGeometry} castShadow receiveShadow>
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      <mesh position={[0, body.torsoH * 1.02, 0]} castShadow>
        <cylinderGeometry args={[body.neckRadius, body.neckRadius * 1.1, 0.08, 16]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      <mesh position={[0, body.torsoH * 1.02 + 0.04 + body.headRadius, 0]} castShadow>
        <sphereGeometry args={[body.headRadius, 32, 32]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Bras (peau) */}
      {([-1, 1] as const).map((side) => {
        const armLength = 0.55
        const cx = side * (body.shoulderWidthM / 2 + armLength / 2)
        return (
          <mesh
            key={`arm-${side}`}
            position={[cx, body.shoulderY, 0]}
            rotation={[0, 0, Math.PI / 2]}
            castShadow
          >
            <cylinderGeometry args={[body.armRadius * 0.85, body.armRadius, armLength, 20]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
          </mesh>
        )
      })}

      {/* Jambes */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={`leg-${side}`}
          position={[side * 0.10, -body.torsoH * 0.05 - 0.42, 0]}
          castShadow
        >
          <cylinderGeometry args={[0.06, 0.05, 0.85, 16]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
        </mesh>
      ))}

      {/* ── Vêtement : meshs triangulés depuis le patron 2D réel ── */}
      {garmentPieces.map((piece) => (
        <mesh key={piece.name} geometry={piece.geometry} castShadow>
          <meshStandardMaterial
            color={fabricProps.color}
            side={THREE.DoubleSide}
            roughness={fabricProps.roughness}
            metalness={fabricProps.metalness}
            flatShading={false}
          />
        </mesh>
      ))}
    </group>
  )
}

interface MannequinSceneProps {
  measurements: SizeMeasurements
  fabric: FabricKey
}

export function MannequinScene({ measurements, fabric }: MannequinSceneProps) {
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

        <Mannequin measurements={measurements} fabric={fabric} />

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
