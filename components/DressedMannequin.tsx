"use client"

// Aperçu 3D "propre" : un mannequin (corps de révolution) habillé d'un vêtement
// représenté par des SURFACES LISSES CONTINUES (lathes + cylindres). Contrairement
// à la simulation Verlet (panneaux triangulés qui se déchirent et laissent des
// trous), ces surfaces sont fermées par construction → jamais de trou. Le but est
// de donner une idée fiable du tombé, de la longueur et de la couleur du tissu.

import { useMemo, useEffect } from "react"
import * as THREE from "three"
import type { SizeMeasurements } from "@/lib/types/pattern"
import type { GarmentType } from "@/lib/patterns/index"
import { bodyProfile, NEUTRAL_HIPS, type HipShape } from "@/lib/3d/hips"
import { FABRICS, type FabricKey } from "@/lib/3d/fabrics"
import { FUR_VERTEX_SHADER, FUR_FRAGMENT_SHADER, furPresetById } from "@/lib/3d/fur"

const CM_TO_M = 0.01
const SKIN = "#e8c5a0"
const FUR_LIGHT_DIR = new THREE.Vector3(0.4, 0.7, 0.6)
const radiusOf = (c: number) => (c / (2 * Math.PI)) * CM_TO_M

function latheGeo(points: Array<[number, number]>, seg = 64): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y)),
    seg,
  )
}

// Coques de fourrure empilées sur une géométrie (réutilisé aussi par la sim).
export function FurShells({
  geometry,
  color,
  preset,
}: {
  geometry: THREE.BufferGeometry
  color: string
  preset: string
}) {
  const p = furPresetById(preset)
  const materials = useMemo(() => {
    return Array.from({ length: p.shells }, (_, i) => {
      const layer = (i + 1) / p.shells
      return new THREE.ShaderMaterial({
        uniforms: {
          uOffset: { value: layer * p.lengthM },
          uColor: { value: new THREE.Color(color) },
          uLayer: { value: layer },
          uDensity: { value: p.density },
          uLightDir: { value: FUR_LIGHT_DIR },
        },
        vertexShader: FUR_VERTEX_SHADER,
        fragmentShader: FUR_FRAGMENT_SHADER,
        side: THREE.DoubleSide,
      })
    })
  }, [color, p.shells, p.lengthM, p.density])
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials])
  return (
    <>
      {materials.map((m, k) => (
        <mesh key={k} geometry={geometry} material={m} />
      ))}
    </>
  )
}

interface BuiltGarment {
  // Surface principale en révolution (corps du vêtement / jupe / hanches pantalon)
  main: THREE.BufferGeometry | null
  // Tubes additionnels (manches, jambes) : géométrie + transform
  tubes: Array<{ geo: THREE.BufferGeometry; pos: [number, number, number]; rotZ: number }>
}

function buildGarment(m: SizeMeasurements, type: GarmentType): BuiltGarment {
  const torsoH = Math.max(0.35, m.longueurDos * CM_TO_M)
  const rChest = radiusOf(m.poitrine)
  const rWaist = radiusOf(m.taille)
  const rHip = radiusOf(m.hanches)
  const shoulderHalf = Math.max(0.12, (m.epaule * CM_TO_M) / 2)
  const ease = 0.025
  const rNeck = Math.max(0.05, rChest * 0.34)
  const rCol = Math.max(rChest, rHip) + ease

  const armAngle = 0.34 // A-pose
  // Direction du bras (depuis l'épaule, vers le bas et l'extérieur).
  const shoulderY = torsoH
  const sleeveTube = (len: number, r: number, side: 1 | -1) => {
    const geo = new THREE.CylinderGeometry(r * 0.85, r, len, 20, 1, true)
    // Pivot épaule ; le tube part vers le bas (-Y) puis le groupe est incliné.
    return {
      geo,
      pos: [side * shoulderHalf, shoulderY, 0] as [number, number, number],
      rotZ: side * armAngle,
      len,
    }
  }

  const topProfile = (hemY: number, flare: number): Array<[number, number]> => [
    [rCol * (1 + flare), hemY],
    [rCol, 0],
    [rCol * 0.99, torsoH * 0.55],
    [rChest + ease * 0.7, torsoH * 0.82],
    [rNeck, torsoH * 0.99],
  ]

  if (type === "tshirt" || type === "dress" || type === "shirt") {
    const hemY = type === "dress" ? -0.5 : type === "shirt" ? -0.16 : -0.06
    const flare = type === "dress" ? 0.12 : 0.04
    const sleeveLen = type === "shirt" ? 0.42 : 0.16
    const main = latheGeo(topProfile(hemY, flare))
    const tubes: BuiltGarment["tubes"] = []
    for (const side of [1, -1] as const) {
      const s = sleeveTube(sleeveLen, 0.055 + ease, side)
      // Place le tube le long de l'axe du bras (descend de la moitié de sa longueur).
      tubes.push({
        geo: s.geo,
        pos: [
          side * shoulderHalf - Math.sin(side * armAngle) * (sleeveLen / 2),
          shoulderY - Math.cos(armAngle) * (sleeveLen / 2),
          0,
        ],
        rotZ: side * armAngle,
      })
    }
    return { main, tubes }
  }

  if (type === "skirt") {
    const waistY = torsoH * 0.45
    const main = latheGeo([
      [rHip + 0.07, -0.45],
      [rHip + 0.03, -0.05],
      [rWaist + 0.02, waistY],
    ])
    return { main, tubes: [] }
  }

  // pants : section hanches + 2 jambes
  const legLen = torsoH * 1.55
  const rLeg = 0.085 + ease
  const main = latheGeo([
    [rHip + 0.02, -0.06],
    [rHip + 0.02, 0],
    [rWaist + 0.02, torsoH * 0.12],
  ])
  const tubes: BuiltGarment["tubes"] = []
  for (const side of [1, -1] as const) {
    const geo = new THREE.CylinderGeometry(rLeg * 0.7, rLeg, legLen, 20, 1, true)
    tubes.push({
      geo,
      pos: [side * (rHip * 0.45), -0.06 - legLen / 2, 0],
      rotZ: 0,
    })
  }
  return { main, tubes }
}

interface DressedMannequinProps {
  measurements: SizeMeasurements
  fabric: FabricKey
  garmentType: GarmentType
  hips?: HipShape
  furEnabled?: boolean
  furPreset?: string
}

export function DressedMannequin({
  measurements,
  fabric,
  garmentType,
  hips = NEUTRAL_HIPS,
  furEnabled = false,
  furPreset = "moyenne",
}: DressedMannequinProps) {
  const m = measurements
  const torsoH = Math.max(0.35, m.longueurDos * CM_TO_M)
  const shoulderHalf = Math.max(0.12, (m.epaule * CM_TO_M) / 2)
  const headR = 0.1
  const neckLen = 0.07
  const armLen = 0.5
  const legLen = torsoH * 1.6
  const armAngle = 0.34

  const bodyGeo = useMemo(() => latheGeo(bodyProfile(m, hips)), [m, hips])
  const garment = useMemo(() => buildGarment(m, garmentType), [m, garmentType])

  useEffect(
    () => () => {
      bodyGeo.dispose()
      garment.main?.dispose()
      garment.tubes.forEach((t) => t.geo.dispose())
    },
    [bodyGeo, garment],
  )

  const fab = FABRICS[fabric]
  const skinMat = (
    <meshStandardMaterial color={SKIN} roughness={0.7} metalness={0.05} />
  )

  // Centre la figure autour de l'origine.
  const groupY = (legLen - (torsoH + neckLen + headR)) / 2

  return (
    <group position={[0, groupY, 0]}>
      {/* ── Corps ── */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        {skinMat}
      </mesh>
      {/* Cou + tête */}
      <mesh position={[0, torsoH + neckLen * 0.5, 0]} castShadow>
        <cylinderGeometry args={[headR * 0.42, headR * 0.5, neckLen, 16]} />
        {skinMat}
      </mesh>
      <mesh position={[0, torsoH + neckLen + headR, 0]} castShadow>
        <sphereGeometry args={[headR, 32, 32]} />
        {skinMat}
      </mesh>
      {/* Bras (A-pose) */}
      {([1, -1] as const).map((side) => (
        <group key={`arm-${side}`} position={[side * shoulderHalf, torsoH, 0]} rotation={[0, 0, side * armAngle]}>
          <mesh position={[0, -armLen / 2, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, armLen, 16]} />
            {skinMat}
          </mesh>
          <mesh position={[0, -armLen, 0]} castShadow>
            <sphereGeometry args={[0.04, 12, 12]} />
            {skinMat}
          </mesh>
        </group>
      ))}
      {/* Jambes (sauf si pantalon — couvertes par le vêtement, mais on les garde fines) */}
      {([1, -1] as const).map((side) => (
        <mesh key={`leg-${side}`} position={[side * 0.075, -legLen / 2, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.06, legLen, 16]} />
          {skinMat}
        </mesh>
      ))}

      {/* ── Vêtement (surfaces lisses) ── */}
      {garment.main && (
        <mesh geometry={garment.main} castShadow>
          <meshStandardMaterial
            color={fab.color}
            roughness={fab.roughness}
            metalness={fab.metalness}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      {garment.tubes.map((t, i) => (
        <mesh key={`tube-${i}`} geometry={t.geo} position={t.pos} rotation={[0, 0, t.rotZ]} castShadow>
          <meshStandardMaterial
            color={fab.color}
            roughness={fab.roughness}
            metalness={fab.metalness}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* ── Fourrure sur le vêtement principal ── */}
      {furEnabled && garment.main && (
        <FurShells geometry={garment.main} color={fab.color} preset={furPreset} />
      )}
    </group>
  )
}
