// Presets de mensurations pour le mannequin 3D — EU + équivalents DZ.
// Les codes DZ (36-46) correspondent aux tailles européennes XS-XXL avec
// une légère correction du tour de poitrine (+1 cm) pour les morphologies
// méditerranéennes/maghrébines (approximation, pas de norme officielle).

import { EU_SIZES } from "@/lib/sizes"
import type { SizeMeasurements } from "@/lib/types/pattern"

export type PresetSystem = "EU" | "DZ"

export interface MorphPreset {
  system: PresetSystem
  code: string
  label: string
  measurements: SizeMeasurements
}

const dzAdjust = (m: SizeMeasurements): SizeMeasurements => ({
  ...m,
  poitrine: m.poitrine + 1,
})

export const MORPH_PRESETS: MorphPreset[] = [
  { system: "EU", code: "XS",  label: "EU XS",  measurements: EU_SIZES.XS },
  { system: "EU", code: "S",   label: "EU S",   measurements: EU_SIZES.S },
  { system: "EU", code: "M",   label: "EU M",   measurements: EU_SIZES.M },
  { system: "EU", code: "L",   label: "EU L",   measurements: EU_SIZES.L },
  { system: "EU", code: "XL",  label: "EU XL",  measurements: EU_SIZES.XL },
  { system: "EU", code: "XXL", label: "EU XXL", measurements: EU_SIZES.XXL },
  { system: "DZ", code: "36",  label: "DZ 36",  measurements: dzAdjust(EU_SIZES.XS) },
  { system: "DZ", code: "38",  label: "DZ 38",  measurements: dzAdjust(EU_SIZES.S) },
  { system: "DZ", code: "40",  label: "DZ 40",  measurements: dzAdjust(EU_SIZES.M) },
  { system: "DZ", code: "42",  label: "DZ 42",  measurements: dzAdjust(EU_SIZES.L) },
  { system: "DZ", code: "44",  label: "DZ 44",  measurements: dzAdjust(EU_SIZES.XL) },
  { system: "DZ", code: "46",  label: "DZ 46",  measurements: dzAdjust(EU_SIZES.XXL) },
]

// Bornes utilisées par les sliders de morphologie
export const MEASUREMENT_BOUNDS: Record<keyof SizeMeasurements, { min: number; max: number; step: number }> = {
  poitrine:       { min: 60,  max: 160, step: 0.5 },
  taille:         { min: 50,  max: 140, step: 0.5 },
  hanches:        { min: 70,  max: 170, step: 0.5 },
  epaule:         { min: 30,  max: 55,  step: 0.5 },
  longueurManche: { min: 5,   max: 70,  step: 0.5 },
  longueurDos:    { min: 45,  max: 85,  step: 0.5 },
}
