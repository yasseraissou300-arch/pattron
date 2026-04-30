// Router : garmentType → moteur de patronage
// Ajouter un nouveau type de vêtement ici suffit à l'activer partout.

import type { SizeMeasurements, PatternResult } from "../types/pattern"
import { generatePattern as generateTshirt }  from "./tshirt"
import { generatePattern as generateSkirt }   from "./skirt"
import { generatePattern as generateDress }   from "./dress"
import { generatePattern as generateShirt }   from "./shirt"
import { generatePattern as generatePants }   from "./pants"

export type GarmentType = "tshirt" | "dress" | "skirt" | "pants" | "shirt"

const ENGINES: Record<GarmentType, (m: SizeMeasurements, sa: number) => PatternResult> = {
  tshirt: generateTshirt,
  skirt:  generateSkirt,
  dress:  generateDress,
  shirt:  generateShirt,
  pants:  generatePants,
}

export const GARMENT_LABELS: Record<GarmentType, string> = {
  tshirt: "T-shirt",
  skirt:  "Jupe A-line",
  dress:  "Robe droite",
  shirt:  "Chemise boutonnée",
  pants:  "Pantalon droit",
}

export function generatePattern(
  garmentType: GarmentType,
  measurements: SizeMeasurements,
  seamAllowance = 1
): PatternResult {
  const engine = ENGINES[garmentType]
  if (!engine) {
    throw new Error(`Type de vêtement non supporté : ${garmentType}`)
  }
  return engine(measurements, seamAllowance)
}

export function isValidGarmentType(type: string): type is GarmentType {
  return type in ENGINES
}
