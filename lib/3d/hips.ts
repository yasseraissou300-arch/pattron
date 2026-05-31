// Morphologie des hanches de l'avatar.
//
// Produit le profil (corps de révolution) du torse + hanches en fonction des
// mensurations ET d'un jeu de paramètres de forme de hanches. Permet de créer
// différentes silhouettes (droites, sablier, poire, rondes…) sans changer les
// mensurations de base. Les défauts (NEUTRAL_HIPS) donnent une silhouette
// neutre proche du mannequin d'origine.
//
// Le module ne dépend pas de three : il renvoie des points [rayon, hauteur] en
// mètres, que le composant transforme en Vector2 pour la LatheGeometry.

import type { SizeMeasurements } from "@/lib/types/pattern"

const CM_TO_M = 0.01
const radiusOf = (circCm: number) => (circCm / (2 * Math.PI)) * CM_TO_M

export interface HipShape {
  width: number     // facteur de largeur des hanches (1 = mesure brute)
  height: number    // position du point le plus large (0 = haut, 1 = bas)
  roundness: number // 0 = transition anguleuse (shelf), 1 = très arrondie
  seat: number      // volume du bas (fessier/cuisses), 1 = neutre
}

export const HIP_RANGES = {
  width: { min: 0.8, max: 1.45, step: 0.01 },
  height: { min: 0, max: 1, step: 0.01 },
  roundness: { min: 0, max: 1, step: 0.01 },
  seat: { min: 0.8, max: 1.5, step: 0.01 },
} as const

export const NEUTRAL_HIPS: HipShape = {
  width: 1,
  height: 0.5,
  roundness: 0.6,
  seat: 1,
}

export function clampHips(h: Partial<HipShape>): HipShape {
  const out = { ...NEUTRAL_HIPS }
  ;(Object.keys(HIP_RANGES) as (keyof HipShape)[]).forEach((k) => {
    const v = h[k]
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = Math.min(HIP_RANGES[k].max, Math.max(HIP_RANGES[k].min, v))
    }
  })
  return out
}

export interface HipPreset {
  id: string
  label: string
  emoji: string
  shape: HipShape
}

export const HIP_PRESETS: HipPreset[] = [
  { id: "neutre", label: "Neutre", emoji: "🧍", shape: NEUTRAL_HIPS },
  { id: "droites", label: "Droites", emoji: "📏", shape: clampHips({ width: 0.92, height: 0.4, roundness: 0.3, seat: 0.9 }) },
  { id: "sablier", label: "Sablier", emoji: "⏳", shape: clampHips({ width: 1.22, height: 0.5, roundness: 0.9, seat: 1.05 }) },
  { id: "poire", label: "Poire", emoji: "🍐", shape: clampHips({ width: 1.28, height: 0.78, roundness: 0.8, seat: 1.25 }) },
  { id: "rondes", label: "Rondes", emoji: "🔵", shape: clampHips({ width: 1.16, height: 0.6, roundness: 1, seat: 1.18 }) },
  { id: "athletique", label: "Athlétique", emoji: "🏃", shape: clampHips({ width: 1.0, height: 0.45, roundness: 0.45, seat: 0.95 }) },
]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * Profil du torse (hanches → épaules) pour une LatheGeometry.
 * Renvoie des points [rayon_m, hauteur_m] du bas (y=0) vers le haut.
 */
export function bodyProfile(m: SizeMeasurements, hipsRaw: Partial<HipShape>): Array<[number, number]> {
  const hips = clampHips(hipsRaw)
  const torsoH = Math.max(0.35, m.longueurDos * CM_TO_M)
  const rHip = radiusOf(m.hanches)
  const rWaist = radiusOf(m.taille)
  const rChest = radiusOf(m.poitrine)

  const hipR = rHip * hips.width
  const seatR = rHip * (0.86 + 0.28 * (hips.seat - 1)) // volume du bas
  // Hauteur du point le plus large : entre ~2 % (hautes) et ~16 % (basses) du torse.
  const widestY = torsoH * lerp(0.02, 0.16, hips.height)
  const waistY = torsoH * 0.46
  const chestY = torsoH * 0.78
  const shoulderY = torsoH * 0.92

  // Point de transition taille→hanche, dont l'amplitude dépend de la rondeur.
  const midY = (widestY + waistY) / 2
  const midR = lerp(rWaist, hipR, 0.35 + 0.45 * hips.roundness)

  const neckR = Math.max(0.045, rChest * 0.32)

  return [
    [0, 0],
    [seatR * 0.6, 0],
    [seatR, torsoH * 0.015],
    [hipR, widestY],
    [midR, midY],
    [rWaist, waistY],
    [rChest * 0.99, chestY],
    [rChest * 0.86, shoulderY],
    [neckR, torsoH],
    [0, torsoH],
  ]
}
