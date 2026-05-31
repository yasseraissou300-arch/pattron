"use client"

// Mannequin articulé "nu" pour le générateur de poses IA.
//
// Contrairement à MannequinScene (corps de révolution + drapé Verlet figé en
// T-pose), ici le corps est un VRAI rig hiérarchique : des groupes imbriqués
// (torse → épaule → coude, hanche → genou) dont on pilote les rotations à
// partir d'une Pose. Les angles suivent la convention décrite dans lib/3d/poses.
//
// Limite assumée : ce mannequin n'porte pas le vêtement (le pipeline de drapé
// est cylindrique et ne suit pas les membres). C'est un aperçu d'avatar.

import { useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import type { SizeMeasurements } from "@/lib/types/pattern"
import { NEUTRAL_POSE, type Pose } from "@/lib/3d/poses"
import { bodyProfile, NEUTRAL_HIPS, type HipShape } from "@/lib/3d/hips"

const CM_TO_M = 0.01
const SKIN_COLOR = "#e8c5a0"
const DEG = Math.PI / 180

// ─── Proportions dérivées des mensurations ───────────────────────────────────

function useProportions(m: SizeMeasurements) {
  return useMemo(() => {
    const torsoLen = Math.max(0.35, m.longueurDos * CM_TO_M)
    const shoulderHalf = Math.max(0.12, (m.epaule * CM_TO_M) / 2)
    return {
      torsoLen,
      shoulderHalf,
      hipHalf: 0.09,
      neckLen: 0.07,
      headR: 0.1,
      uArm: torsoLen * 0.5,
      fArm: torsoLen * 0.46,
      thigh: torsoLen * 0.85,
      shin: torsoLen * 0.8,
      limbR: 0.042,
    }
  }, [m])
}

// ─── Segment d'os (cylindre orienté vers le bas depuis le pivot) ──────────────

function Bone({
  len,
  rTop,
  rBot,
}: {
  len: number
  rTop: number
  rBot: number
}) {
  return (
    <mesh position={[0, -len / 2, 0]} castShadow>
      <cylinderGeometry args={[rBot, rTop, len, 16]} />
      <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
    </mesh>
  )
}

function Joint({ r }: { r: number }) {
  return (
    <mesh castShadow>
      <sphereGeometry args={[r, 16, 16]} />
      <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
    </mesh>
  )
}

// ─── Le rig ───────────────────────────────────────────────────────────────────

function Rig({
  pose,
  measurements,
  hips,
}: {
  pose: Pose
  measurements: SizeMeasurements
  hips: HipShape
}) {
  const P = useProportions(measurements)

  // Corps de révolution (torse + hanches) piloté par la forme des hanches.
  const torsoGeo = useMemo(
    () =>
      new THREE.LatheGeometry(
        bodyProfile(measurements, hips).map(([r, y]) => new THREE.Vector2(r, y)),
        48,
      ),
    [measurements, hips],
  )
  useEffect(() => () => torsoGeo.dispose(), [torsoGeo])

  // Écartement des jambes sous les hanches (suit la largeur de hanches).
  const legHipX = Math.max(
    0.07,
    (measurements.hanches / (2 * Math.PI)) * 0.01 * hips.width * 0.55,
  )

  const torso = useRef<THREE.Group>(null)
  const neck = useRef<THREE.Group>(null)
  const rShoulder = useRef<THREE.Group>(null)
  const rElbow = useRef<THREE.Group>(null)
  const lShoulder = useRef<THREE.Group>(null)
  const lElbow = useRef<THREE.Group>(null)
  const rHip = useRef<THREE.Group>(null)
  const rKnee = useRef<THREE.Group>(null)
  const lHip = useRef<THREE.Group>(null)
  const lKnee = useRef<THREE.Group>(null)

  // Pose courante (mutable) lissée vers la pose cible à chaque frame.
  const current = useRef<Pose>({ ...NEUTRAL_POSE })

  useFrame((_s, delta) => {
    const cur = current.current
    const k = 1 - Math.pow(0.001, Math.min(delta, 0.05)) // lissage exponentiel
    for (const key of Object.keys(cur) as (keyof Pose)[]) {
      cur[key] += (pose[key] - cur[key]) * k
    }

    torso.current?.rotation.set(cur.torsoTilt * DEG, cur.torsoTurn * DEG, cur.torsoSide * DEG)
    neck.current?.rotation.set(cur.neckTilt * DEG, 0, 0)

    // Bras : front sur X (avant = +), raise sur Z (abduction).
    rShoulder.current?.rotation.set(-cur.rShoulderFront * DEG, 0, cur.rShoulderRaise * DEG)
    lShoulder.current?.rotation.set(-cur.lShoulderFront * DEG, 0, -cur.lShoulderRaise * DEG)
    rElbow.current?.rotation.set(-cur.rElbow * DEG, 0, 0)
    lElbow.current?.rotation.set(-cur.lElbow * DEG, 0, 0)

    // Jambes : front sur X (flexion avant), side sur Z (abduction), genou sur X.
    rHip.current?.rotation.set(-cur.rHipFront * DEG, 0, cur.rHipSide * DEG)
    lHip.current?.rotation.set(-cur.lHipFront * DEG, 0, -cur.lHipSide * DEG)
    rKnee.current?.rotation.set(cur.rKnee * DEG, 0, 0)
    lKnee.current?.rotation.set(cur.lKnee * DEG, 0, 0)
  })

  const { torsoLen, shoulderHalf, neckLen, headR, uArm, fArm, thigh, shin, limbR } = P

  return (
    // Pelvis à l'origine ; jambes vers le bas, torse vers le haut.
    <group>
      {/* ── Jambe droite ── */}
      <group ref={rHip} position={[legHipX, 0, 0]}>
        <Joint r={limbR * 1.1} />
        <Bone len={thigh} rTop={limbR * 1.15} rBot={limbR} />
        <group ref={rKnee} position={[0, -thigh, 0]}>
          <Joint r={limbR} />
          <Bone len={shin} rTop={limbR} rBot={limbR * 0.7} />
          <mesh position={[0, -shin, limbR]} castShadow>
            <boxGeometry args={[limbR * 1.6, limbR * 1.2, limbR * 3]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
          </mesh>
        </group>
      </group>

      {/* ── Jambe gauche ── */}
      <group ref={lHip} position={[-legHipX, 0, 0]}>
        <Joint r={limbR * 1.1} />
        <Bone len={thigh} rTop={limbR * 1.15} rBot={limbR} />
        <group ref={lKnee} position={[0, -thigh, 0]}>
          <Joint r={limbR} />
          <Bone len={shin} rTop={limbR} rBot={limbR * 0.7} />
          <mesh position={[0, -shin, limbR]} castShadow>
            <boxGeometry args={[limbR * 1.6, limbR * 1.2, limbR * 3]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
          </mesh>
        </group>
      </group>

      {/* ── Torse + hanches (corps de révolution, pivot au bassin) ── */}
      <group ref={torso} position={[0, 0, 0]}>
        <mesh geometry={torsoGeo} castShadow receiveShadow>
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
        </mesh>

        {/* Ligne d'épaules */}
        <group position={[0, torsoLen, 0]}>
          {/* Cou + tête */}
          <group ref={neck}>
            <mesh position={[0, neckLen * 0.5, 0]} castShadow>
              <cylinderGeometry args={[headR * 0.42, headR * 0.5, neckLen, 16]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
            </mesh>
            <mesh position={[0, neckLen + headR, 0]} castShadow>
              <sphereGeometry args={[headR, 32, 32]} />
              <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
            </mesh>
          </group>

          {/* Épaule droite */}
          <group ref={rShoulder} position={[shoulderHalf, 0, 0]}>
            <Joint r={limbR * 1.1} />
            <Bone len={uArm} rTop={limbR} rBot={limbR * 0.85} />
            <group ref={rElbow} position={[0, -uArm, 0]}>
              <Joint r={limbR * 0.85} />
              <Bone len={fArm} rTop={limbR * 0.85} rBot={limbR * 0.7} />
              <mesh position={[0, -fArm, 0]} castShadow>
                <sphereGeometry args={[limbR * 0.85, 12, 12]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
              </mesh>
            </group>
          </group>

          {/* Épaule gauche */}
          <group ref={lShoulder} position={[-shoulderHalf, 0, 0]}>
            <Joint r={limbR * 1.1} />
            <Bone len={uArm} rTop={limbR} rBot={limbR * 0.85} />
            <group ref={lElbow} position={[0, -uArm, 0]}>
              <Joint r={limbR * 0.85} />
              <Bone len={fArm} rTop={limbR * 0.85} rBot={limbR * 0.7} />
              <mesh position={[0, -fArm, 0]} castShadow>
                <sphereGeometry args={[limbR * 0.85, 12, 12]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} metalness={0.05} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

// ─── Canvas complet (importé dynamiquement, sans SSR) ─────────────────────────

interface PoseCanvasProps {
  pose: Pose
  measurements: SizeMeasurements
  hips?: HipShape
}

export function PoseCanvas({ pose, measurements, hips = NEUTRAL_HIPS }: PoseCanvasProps) {
  const groundY = -(measurements.longueurDos * CM_TO_M * 1.65 + 0.05)

  return (
    <div className="relative w-full aspect-square rounded-xl bg-gradient-to-b from-purple-50 to-gray-100 overflow-hidden border border-gray-200">
      <Canvas
        shadows
        camera={{ position: [0.9, 0.15, 2.0], fov: 40, near: 0.1, far: 50 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[2, 3, 2]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-2, 1, -1]} intensity={0.35} />

        <Rig pose={pose} measurements={measurements} hips={hips} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY, 0]} receiveShadow>
          <circleGeometry args={[1.3, 48]} />
          <meshStandardMaterial color="#f3e8ff" roughness={1} />
        </mesh>

        <OrbitControls
          enablePan={false}
          minDistance={1.0}
          maxDistance={4}
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

export default PoseCanvas
