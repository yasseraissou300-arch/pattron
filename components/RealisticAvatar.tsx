"use client"

// Charge un VRAI modèle humain 3D (glTF/glb) pour remplacer le mannequin
// procédural et se rapprocher du "look pro" (type Optitex/CLO).
//
// Robustesse : l'URL du modèle vient de NEXT_PUBLIC_AVATAR_URL. Si elle est
// absente OU si le chargement échoue, on REPLIE automatiquement sur le mannequin
// propre procédural (DressedMannequin) → la prod ne casse jamais, même si le
// modèle est indisponible. Le modèle est auto-cadré (bbox → hauteur cible).

import { Suspense, useMemo, Component, type ReactNode } from "react"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import type { SizeMeasurements } from "@/lib/types/pattern"
import type { GarmentType } from "@/lib/patterns/index"
import type { FabricKey } from "@/lib/3d/fabrics"
import { DressedMannequin } from "./DressedMannequin"

const AVATAR_URL = (process.env.NEXT_PUBLIC_AVATAR_URL ?? "").trim()
const TARGET_HEIGHT = 1.4 // mètres dans la scène

// Petit error boundary : si le glTF échoue (404/CORS/format), on rend le repli.
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

function AvatarModel({ url }: { url: string }) {
  const gltf = useGLTF(url, true)
  const object = useMemo(() => {
    const o = gltf.scene.clone(true)
    const box = new THREE.Box3().setFromObject(o)
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    const s = TARGET_HEIGHT / (size.y || 1)
    o.scale.setScalar(s)
    // Centre le modèle à l'origine (la caméra de la scène vise [0,0,0]).
    o.position.set(-center.x * s, -center.y * s, -center.z * s)
    o.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return o
  }, [gltf])

  return <primitive object={object} />
}

interface RealisticAvatarProps {
  measurements: SizeMeasurements
  fabric: FabricKey
  garmentType: GarmentType
  furEnabled?: boolean
  furPreset?: string
}

export function RealisticAvatar(props: RealisticAvatarProps) {
  // Repli : mannequin propre procédural (+ vêtement) si pas de modèle.
  const fallback = (
    <DressedMannequin
      measurements={props.measurements}
      fabric={props.fabric}
      garmentType={props.garmentType}
      furEnabled={props.furEnabled}
      furPreset={props.furPreset}
    />
  )

  if (!AVATAR_URL) return fallback

  return (
    <GltfBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <AvatarModel url={AVATAR_URL} />
      </Suspense>
    </GltfBoundary>
  )
}

// Préchargement (ignoré si l'URL est vide).
if (AVATAR_URL) {
  try {
    useGLTF.preload(AVATAR_URL)
  } catch {
    /* no-op */
  }
}
