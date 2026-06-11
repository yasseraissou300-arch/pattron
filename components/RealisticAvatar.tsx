"use client"

// Avatar 3D réaliste : un vrai modèle humain glTF (par défaut /avatar.glb,
// hébergé dans l'app — aucun service externe requis), habillé d'un vêtement en
// surfaces lisses calé sur ses proportions.
//
// Anti-transpercement : au chargement, on MESURE le corps de l'avatar (demi-
// largeur X et demi-profondeur Z réelles aux niveaux hanches/taille/poitrine/
// épaules, bras exclus). Le vêtement prend à chaque niveau
// max(rayon issu des mensurations, corps mesuré + marge) → le corps ne peut
// pas traverser le tissu, quel que soit le modèle utilisé.
//
// Robustesse : si le modèle échoue à charger (404, format), repli automatique
// sur le mannequin procédural (DressedMannequin). Pas de clone du glTF (mesh
// skinné — le clonage naïf casse les liaisons d'os) : on transforme un parent.

import { Suspense, useMemo, useEffect, Component, type ReactNode } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import type { SizeMeasurements } from "@/lib/types/pattern"
import type { GarmentType } from "@/lib/patterns/index"
import { FABRICS, type FabricKey } from "@/lib/3d/fabrics"
import { DressedMannequin, FurShells } from "./DressedMannequin"

const AVATAR_URL = (process.env.NEXT_PUBLIC_AVATAR_URL ?? "/avatar.glb").trim()
const TARGET_HEIGHT = 1.4 // hauteur de l'avatar dans la scène (m)
const CM_TO_M = 0.01
const CLEAR = 0.016 // marge tissu↔corps (m)
const radiusOf = (c: number) => (c / (2 * Math.PI)) * CM_TO_M

// Petit error boundary : si le glTF échoue (404/format), on rend le repli.
class GltfBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() {
    return { err: true }
  }
  componentDidCatch(error: unknown) {
    console.warn("[RealisticAvatar] échec du chargement du modèle, repli procédural :", error)
  }
  render() {
    return this.state.err ? this.props.fallback : this.props.children
  }
}

function latheGeo(points: Array<[number, number]>, seg = 56): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.002), y)),
    seg,
  )
}

// Niveaux anatomiques (fraction de la hauteur depuis les pieds).
const BANDS = { hip: 0.52, waist: 0.62, chest: 0.72, shoulder: 0.81 } as const
type BandName = keyof typeof BANDS

interface BodyBands {
  x: Record<BandName, number> // demi-largeur du torse (m, échelle scène)
  z: Record<BandName, number> // demi-profondeur du torse (m, échelle scène)
}

// Mesure le corps du modèle par tranches horizontales. Les bras (T-pose) sont
// exclus de la largeur via un seuil |x| < 0.18 × hauteur (torse ≈ 0.13 × H).
function measureBody(scene: THREE.Object3D, scale: number): BodyBands {
  scene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(scene)
  const minY = box.min.y
  const H = Math.max(box.max.y - minY, 1e-6)
  const torsoCut = 0.18 * H
  const tol = 0.035

  const x: Record<BandName, number> = { hip: 0, waist: 0, chest: 0, shoulder: 0 }
  const z: Record<BandName, number> = { hip: 0, waist: 0, chest: 0, shoulder: 0 }
  const v = new THREE.Vector3()

  scene.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry?.attributes?.position) return
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld)
      const f = (v.y - minY) / H
      for (const name of Object.keys(BANDS) as BandName[]) {
        if (Math.abs(f - BANDS[name]) < tol) {
          const ax = Math.abs(v.x)
          if (ax < torsoCut && ax > x[name]) x[name] = ax
          const az = Math.abs(v.z)
          if (az > z[name]) z[name] = az
        }
      }
    }
  })

  const s = (TARGET_HEIGHT / H) * scale
  for (const name of Object.keys(BANDS) as BandName[]) {
    x[name] *= s
    z[name] *= s
  }
  return { x, z }
}

interface RealisticAvatarProps {
  measurements: SizeMeasurements
  fabric: FabricKey
  garmentType: GarmentType
  furEnabled?: boolean
  furPreset?: string
}

function DressedAvatar({
  measurements,
  fabric,
  garmentType,
  furEnabled = false,
  furPreset = "moyenne",
}: RealisticAvatarProps) {
  const gltf = useGLTF(AVATAR_URL)

  // Cadrage + mesure du corps (une seule fois par modèle).
  const fit = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const s = TARGET_HEIGHT / (size.y || 1)
    const bands = measureBody(gltf.scene, 1) // déjà normalisé par s en interne
    return { s, center, bands }
  }, [gltf])

  useEffect(() => {
    gltf.scene.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
  }, [gltf])

  // Vêtement : rayon X par niveau = max(mensurations, corps mesuré + marge) ;
  // l'écrasement Z est déduit des profondeurs mesurées (jamais inférieur au corps).
  const garment = useMemo(() => {
    const m = measurements
    const { bands } = fit
    const H = TARGET_HEIGHT
    const base = -H / 2
    const yOf = (f: number) => base + H * f
    const k = H / 1.65 // mensurations supposées prises sur ~1,65 m

    const rx = (band: BandName, circCm: number, mult: number) =>
      Math.max(radiusOf(circCm) * k * mult, bands.x[band] + CLEAR)

    const hipR = rx("hip", m.hanches, 1.04)
    const waistR = rx("waist", m.taille, 1.08)
    const chestR = rx("chest", m.poitrine, 1.04)
    const shoulderR = Math.max(chestR * 0.93, bands.x.shoulder * 0.72 + CLEAR)
    const neckOpen = chestR * 0.45

    // Profondeur : le ratio nécessaire pour couvrir la profondeur du corps
    // à chaque niveau, borné à [0.55, 1] (1 = section ronde).
    let depth = 0.62
    const bandsR: Record<BandName, number> = { hip: hipR, waist: waistR, chest: chestR, shoulder: shoulderR }
    for (const name of Object.keys(BANDS) as BandName[]) {
      const need = (bands.z[name] + CLEAR) / Math.max(bandsR[name], 1e-6)
      if (need > depth) depth = Math.min(need, 1)
    }

    const hipY = yOf(BANDS.hip)
    const waistY = yOf(BANDS.waist)
    const chestY = yOf(BANDS.chest)
    const shoulderY = yOf(BANDS.shoulder)
    const kneeY = yOf(0.28)

    let geo: THREE.LatheGeometry
    if (garmentType === "skirt") {
      geo = latheGeo([
        [hipR * 1.14, kneeY],
        [hipR, hipY],
        [waistR * 0.98, waistY],
      ])
    } else if (garmentType === "pants") {
      geo = latheGeo([
        [hipR, hipY - 0.06],
        [hipR, hipY],
        [waistR * 0.98, waistY],
      ])
    } else if (garmentType === "dress") {
      geo = latheGeo([
        [hipR * 1.16, kneeY],
        [hipR, hipY],
        [waistR, waistY],
        [chestR, chestY],
        [shoulderR, shoulderY - 0.035],
        [neckOpen, shoulderY + 0.015],
      ])
    } else {
      const hemY = garmentType === "shirt" ? hipY - 0.05 : hipY + 0.02
      geo = latheGeo([
        [hipR * 1.02, hemY],
        [chestR * 1.01, waistY],
        [chestR, chestY],
        [shoulderR, shoulderY - 0.035],
        [neckOpen, shoulderY + 0.015],
      ])
    }

    // Manches (T-pose → tubes horizontaux). Rayon ≥ bras mesuré indirectement
    // via l'épaule ; constantes sûres pour ce modèle.
    const sleeveLen =
      garmentType === "shirt" ? 0.34 : garmentType === "pants" || garmentType === "skirt" ? 0 : 0.12
    const sleeves =
      sleeveLen > 0
        ? ([1, -1] as const).map((side) => ({
            x: side * (bands.x.shoulder + sleeveLen / 2 - 0.015),
            y: shoulderY - 0.012,
            len: sleeveLen,
            side,
          }))
        : []

    const pantLegs =
      garmentType === "pants"
        ? ([1, -1] as const).map((side) => ({
            x: side * hipR * 0.48,
            top: hipY - 0.04,
            len: hipY - 0.04 - (base + 0.05),
          }))
        : []

    return { geo, depth, sleeves, pantLegs }
  }, [measurements, garmentType, fit])

  useEffect(() => () => garment.geo.dispose(), [garment.geo])

  const fab = FABRICS[fabric]
  const fabricMat = (
    <meshStandardMaterial
      color={fab.color}
      roughness={fab.roughness}
      metalness={fab.metalness}
      side={THREE.DoubleSide}
    />
  )
  const { s, center } = fit

  return (
    <group>
      <group scale={[s, s, s]} position={[-center.x * s, -center.y * s, -center.z * s]}>
        <primitive object={gltf.scene} />
      </group>

      {/* Vêtement principal : section elliptique adaptée au corps mesuré. */}
      <mesh geometry={garment.geo} scale={[1, 1, garment.depth]} castShadow>
        {fabricMat}
      </mesh>

      {/* Manches horizontales (avatar en T-pose) */}
      {garment.sleeves.map((sl) => (
        <mesh
          key={`sleeve-${sl.side}`}
          position={[sl.x, sl.y, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.05, 0.06, sl.len, 16, 1, true]} />
          {fabricMat}
        </mesh>
      ))}

      {garment.pantLegs.map((leg, i) => (
        <mesh key={i} position={[leg.x, leg.top - leg.len / 2, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.095, leg.len, 18, 1, true]} />
          {fabricMat}
        </mesh>
      ))}

      {furEnabled && <FurShells geometry={garment.geo} color={fab.color} preset={furPreset} />}
    </group>
  )
}

export function RealisticAvatar(props: RealisticAvatarProps) {
  // Repli : mannequin propre procédural (+ vêtement) si le modèle échoue.
  const fallback = (
    <DressedMannequin
      measurements={props.measurements}
      fabric={props.fabric}
      garmentType={props.garmentType}
      furEnabled={props.furEnabled}
      furPreset={props.furPreset}
    />
  )

  return (
    <GltfBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <DressedAvatar {...props} />
      </Suspense>
    </GltfBoundary>
  )
}

useGLTF.preload(AVATAR_URL)
