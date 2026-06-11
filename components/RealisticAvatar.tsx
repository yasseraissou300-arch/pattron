"use client"

// Avatar 3D réaliste : un vrai modèle humain glTF (par défaut /avatar.glb,
// hébergé dans l'app — aucun service externe requis), habillé d'un vêtement en
// surfaces lisses calé sur ses proportions.
//
// Robustesse : si le modèle est introuvable ou échoue à charger (404, format),
// repli automatique sur le mannequin procédural (DressedMannequin) → la prod ne
// casse jamais. Le modèle est auto-cadré (bbox → hauteur cible, centré).
//
// Note : pas de clone du glTF — c'est un mesh skinné (squelette), le clonage
// naïf casse les liaisons d'os. On transforme un <group> parent à la place.

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

// Profondeur du vêtement : le corps humain est plus large que profond. Sans cet
// écrasement de l'axe Z, le lathe circulaire donne un "tonneau" (constaté à
// l'écran). 0.62 ≈ ratio profondeur/largeur d'un buste.
const GARMENT_DEPTH = 0.62

// Vêtement en surfaces lisses ancré sur les proportions humaines standard de
// l'avatar (hauteur TARGET_HEIGHT, épaules ~81 %, hanches ~52 % de la hauteur).
// Les rayons viennent des mensurations utilisateur, remis à l'échelle de l'avatar.
function useAvatarGarment(m: SizeMeasurements, garmentType: GarmentType) {
  return useMemo(() => {
    const H = TARGET_HEIGHT
    const base = -H / 2 // pieds (modèle centré à l'origine)
    const shoulderY = base + H * 0.81
    const chestY = base + H * 0.72
    const waistY = base + H * 0.62
    const hipY = base + H * 0.52
    const kneeY = base + H * 0.28

    // Mensurations supposées prises sur ~1,65 m → remise à l'échelle avatar.
    const k = H / 1.65
    const ease = 0.02
    const rChest = radiusOf(m.poitrine) * k + ease
    const rWaist = radiusOf(m.taille) * k + ease
    const rHip = radiusOf(m.hanches) * k + ease
    const neckOpen = rChest * 0.45

    let geo: THREE.LatheGeometry
    if (garmentType === "skirt") {
      geo = latheGeo([
        [rHip * 1.18, kneeY],
        [rHip * 1.02, hipY],
        [rWaist * 1.05, waistY],
      ])
    } else if (garmentType === "pants") {
      geo = latheGeo([
        [rHip * 1.03, hipY - 0.06],
        [rHip * 1.02, hipY],
        [rWaist * 1.05, waistY],
      ])
    } else if (garmentType === "dress") {
      // Robe A-line : évasée en bas, cintrée à la taille, épaules inclinées.
      geo = latheGeo([
        [rHip * 1.2, kneeY],
        [rHip * 1.04, hipY],
        [rWaist * 1.08, waistY],
        [rChest * 1.03, chestY],
        [rChest * 0.93, shoulderY - 0.035],
        [neckOpen, shoulderY + 0.015],
      ])
    } else {
      // T-shirt / chemise : tombé droit, épaules inclinées vers l'encolure.
      const hemY = garmentType === "shirt" ? hipY - 0.05 : hipY + 0.02
      geo = latheGeo([
        [rHip * 1.06, hemY],
        [rChest * 1.05, waistY],
        [rChest * 1.04, chestY],
        [rChest * 0.93, shoulderY - 0.035],
        [neckOpen, shoulderY + 0.015],
      ])
    }

    // Manches : l'avatar est en T-pose (bras à l'horizontale) → tubes le long
    // de l'axe X, partant de l'épaule. Pas de manches pour jupe/pantalon.
    const sleeveLen =
      garmentType === "shirt" ? 0.34 : garmentType === "pants" || garmentType === "skirt" ? 0 : 0.12
    const sleeves =
      sleeveLen > 0
        ? ([1, -1] as const).map((side) => ({
            x: side * (rChest * 0.82 + sleeveLen / 2),
            y: shoulderY - 0.018,
            len: sleeveLen,
            side,
          }))
        : []

    // Jambes de pantalon (tubes), ancrées sous les hanches.
    const pantLegs =
      garmentType === "pants"
        ? ([1, -1] as const).map((side) => ({
            x: side * rHip * 0.45,
            top: hipY - 0.04,
            len: hipY - 0.04 - (base + 0.05),
          }))
        : []

    return { geo, pantLegs, sleeves }
  }, [m, garmentType])
}

function AvatarModel({ url }: { url: string }) {
  const gltf = useGLTF(url)
  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const s = TARGET_HEIGHT / (size.y || 1)
    return { s, center }
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

  const { s, center } = transform
  return (
    <group scale={[s, s, s]} position={[-center.x * s, -center.y * s, -center.z * s]}>
      <primitive object={gltf.scene} />
    </group>
  )
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
  const { geo, pantLegs, sleeves } = useAvatarGarment(measurements, garmentType)
  useEffect(() => () => geo.dispose(), [geo])
  const fab = FABRICS[fabric]
  const fabricMat = (
    <meshStandardMaterial
      color={fab.color}
      roughness={fab.roughness}
      metalness={fab.metalness}
      side={THREE.DoubleSide}
    />
  )

  return (
    <group>
      <AvatarModel url={AVATAR_URL} />
      {/* Vêtement principal : section elliptique (écrasement Z) → pas de "tonneau". */}
      <mesh geometry={geo} scale={[1, 1, GARMENT_DEPTH]} castShadow>
        {fabricMat}
      </mesh>
      {/* Manches horizontales (avatar en T-pose) */}
      {sleeves.map((s) => (
        <mesh
          key={`sleeve-${s.side}`}
          position={[s.x, s.y, 0]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
        >
          <cylinderGeometry args={[0.045, 0.055, s.len, 16, 1, true]} />
          {fabricMat}
        </mesh>
      ))}
      {pantLegs.map((leg, i) => (
        <mesh key={i} position={[leg.x, leg.top - leg.len / 2, 0]} castShadow>
          <cylinderGeometry args={[0.075, 0.095, leg.len, 18, 1, true]} />
          {fabricMat}
        </mesh>
      ))}
      {furEnabled && <FurShells geometry={geo} color={fab.color} preset={furPreset} />}
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
