"use client"

// Aperçu 3D "propre" : mannequin habillé de SURFACES LISSES CONTINUES (lathes +
// cylindres), donc sans trou possible (contrairement à la simulation Verlet qui
// déchirait le tissu). Objectif : silhouette crédible + tombé/longueur/couleur.
//
// Choix clés pour un rendu humain (et non "vase de révolution") :
//  - section ELLIPTIQUE : on écrase la profondeur (axe Z) → plus large que profond.
//  - vraies ÉPAULES dans le profil du corps → les bras s'y rattachent.
//  - figure mise à l'échelle + centrée pour tenir entièrement dans le cadre.

import { useMemo, useEffect } from "react"
import * as THREE from "three"
import type { SizeMeasurements } from "@/lib/types/pattern"
import type { GarmentType } from "@/lib/patterns/index"
import { FABRICS, type FabricKey } from "@/lib/3d/fabrics"
import { FUR_VERTEX_SHADER, FUR_FRAGMENT_SHADER, furPresetById } from "@/lib/3d/fur"

const CM_TO_M = 0.01
const SKIN = "#e8c5a0"
const DEPTH = 0.62 // écrasement de la profondeur → silhouette elliptique humaine
const FUR_LIGHT_DIR = new THREE.Vector3(0.4, 0.7, 0.6)
const radiusOf = (c: number) => (c / (2 * Math.PI)) * CM_TO_M

function latheGeo(points: Array<[number, number]>, seg = 56): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.002), y)),
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

interface DressedMannequinProps {
  measurements: SizeMeasurements
  fabric: FabricKey
  garmentType: GarmentType
  furEnabled?: boolean
  furPreset?: string
}

export function DressedMannequin({
  measurements,
  fabric,
  garmentType,
  furEnabled = false,
  furPreset = "moyenne",
}: DressedMannequinProps) {
  const m = measurements

  // ── Mesures dérivées (mètres) ──
  const dims = useMemo(() => {
    const torsoH = Math.max(0.42, m.longueurDos * CM_TO_M)
    const rHip = radiusOf(m.hanches)
    const rWaist = radiusOf(m.taille)
    const rChest = radiusOf(m.poitrine)
    const shoulderHalf = Math.max(0.15, (m.epaule * CM_TO_M) / 2)
    const rShoulder = shoulderHalf * 0.85
    const shoulderH = torsoH * 0.98
    const neckBaseR = Math.max(0.05, rChest * 0.34)
    const headR = 0.092
    const neckLen = 0.06
    const armLen = torsoH * 0.92
    const legLen = torsoH * 1.5
    const ease = 0.022
    const kind: "top" | "skirt" | "pants" =
      garmentType === "skirt" ? "skirt" : garmentType === "pants" ? "pants" : "top"
    return { torsoH, rHip, rWaist, rChest, shoulderHalf, rShoulder, shoulderH, neckBaseR, headR, neckLen, armLen, legLen, ease, kind }
  }, [m, garmentType])

  const { torsoH, rHip, rWaist, rChest, rShoulder, shoulderH, neckBaseR, headR, neckLen, armLen, legLen, ease, kind } = dims

  // ── Géométrie du corps (avec épaules) ──
  const bodyGeo = useMemo(
    () =>
      latheGeo([
        [0, -0.02],
        [rHip * 0.72, -0.02],
        [rHip, torsoH * 0.07],
        [rWaist * 1.05, torsoH * 0.42],
        [rChest, torsoH * 0.74],
        [rShoulder, shoulderH],
        [neckBaseR, torsoH],
      ]),
    [rHip, rWaist, rChest, rShoulder, shoulderH, neckBaseR, torsoH],
  )

  // ── Géométrie du vêtement principal ──
  const garmentGeo = useMemo(() => {
    const rCol = Math.max(rChest, rHip) + ease
    if (kind === "top") {
      const hemY = garmentType === "dress" ? -0.5 : garmentType === "shirt" ? -0.16 : -0.04
      const neckOpen = Math.max(neckBaseR * 1.5, rChest * 0.72)
      return latheGeo([
        [rCol * 1.08, hemY],
        [rCol, torsoH * 0.07],
        [rCol * 0.99, torsoH * 0.5],
        [rChest + ease, torsoH * 0.74],
        [rShoulder * 0.97, shoulderH],
        [neckOpen, torsoH * 0.99],
      ])
    }
    if (kind === "skirt") {
      return latheGeo([
        [rHip + 0.06, -0.42],
        [rHip + 0.03, torsoH * 0.06],
        [rWaist + 0.02, torsoH * 0.42],
      ])
    }
    // pants : section hanches (les jambes sont des tubes séparés)
    return latheGeo([
      [rHip + 0.02, -0.05],
      [rHip + 0.02, torsoH * 0.06],
      [rWaist + 0.02, torsoH * 0.14],
    ])
  }, [kind, garmentType, rChest, rHip, rWaist, rShoulder, shoulderH, neckBaseR, torsoH, ease])

  useEffect(
    () => () => {
      bodyGeo.dispose()
      garmentGeo.dispose()
    },
    [bodyGeo, garmentGeo],
  )

  const fab = FABRICS[fabric]
  const fabricMat = (
    <meshStandardMaterial color={fab.color} roughness={fab.roughness} metalness={fab.metalness} side={THREE.DoubleSide} />
  )
  const skinMat = <meshStandardMaterial color={SKIN} roughness={0.72} metalness={0.04} />

  // ── Mise à l'échelle + centrage pour tenir dans le cadre ──
  const totalH = legLen + torsoH + neckLen + 2 * headR
  const S = 1.18 / totalH
  const centerY = (torsoH + neckLen + 2 * headR + -legLen) / 2

  const armAngle = 0.3
  const armRootX = rShoulder * 0.96
  const sleeveLen = garmentType === "shirt" ? armLen * 0.9 : armLen * 0.4
  const pantLegLen = legLen * 0.98

  return (
    <group scale={[S, S, S * DEPTH]} position={[0, -centerY * S, 0]}>
      {/* ── Corps ── */}
      <mesh geometry={bodyGeo} castShadow receiveShadow>
        {skinMat}
      </mesh>
      {/* Cou + tête */}
      <mesh position={[0, torsoH + neckLen * 0.5, 0]} castShadow>
        <cylinderGeometry args={[neckBaseR * 0.8, neckBaseR, neckLen, 16]} />
        {skinMat}
      </mesh>
      <mesh position={[0, torsoH + neckLen + headR * 0.95, 0]} castShadow>
        <sphereGeometry args={[headR, 28, 28]} />
        {skinMat}
      </mesh>

      {/* ── Bras (rattachés à l'épaule, légèrement écartés) ── */}
      {([1, -1] as const).map((side) => (
        <group key={`arm-${side}`} position={[side * armRootX, shoulderH, 0]} rotation={[0, 0, side * armAngle]}>
          <mesh position={[0, -armLen / 2, 0]} castShadow>
            <cylinderGeometry args={[0.038, 0.05, armLen, 14]} />
            {skinMat}
          </mesh>
          <mesh position={[0, -armLen, 0]} castShadow>
            <sphereGeometry args={[0.04, 12, 12]} />
            {skinMat}
          </mesh>
          {/* Manche (vêtement) sur le haut du bras */}
          {kind === "top" && (
            <mesh position={[0, -sleeveLen / 2, 0]} castShadow>
              <cylinderGeometry args={[0.052 + ease * 0.5, 0.06 + ease, sleeveLen, 16, 1, true]} />
              {fabricMat}
            </mesh>
          )}
        </group>
      ))}

      {/* ── Jambes ── */}
      {([1, -1] as const).map((side) => (
        <group key={`leg-${side}`}>
          <mesh position={[side * rHip * 0.42, -legLen / 2, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.062, legLen, 14]} />
            {skinMat}
          </mesh>
          {/* Jambe de pantalon (vêtement) */}
          {kind === "pants" && (
            <mesh position={[side * rHip * 0.42, -0.05 - pantLegLen / 2, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.095, pantLegLen, 18, 1, true]} />
              {fabricMat}
            </mesh>
          )}
        </group>
      ))}

      {/* ── Vêtement principal (surface lisse) ── */}
      <mesh geometry={garmentGeo} castShadow>
        {fabricMat}
      </mesh>

      {/* ── Fourrure sur le vêtement principal ── */}
      {furEnabled && <FurShells geometry={garmentGeo} color={fab.color} preset={furPreset} />}
    </group>
  )
}
