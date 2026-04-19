// Tables de tailles européennes femme pour PatronAI
// Source : normes EU + ajustements pratiques pour couture amateur

import type { SizeMeasurements, EuSize } from "./types/pattern"

export const EU_SIZES: Record<EuSize, SizeMeasurements> = {
  XS: {
    poitrine: 82,
    taille: 64,
    hanches: 90,
    epaule: 37,
    longueurManche: 18,
    longueurDos: 60,
  },
  S: {
    poitrine: 86,
    taille: 68,
    hanches: 94,
    epaule: 38,
    longueurManche: 18,
    longueurDos: 61,
  },
  M: {
    poitrine: 90,
    taille: 72,
    hanches: 98,
    epaule: 39,
    longueurManche: 19,
    longueurDos: 62,
  },
  L: {
    poitrine: 96,
    taille: 78,
    hanches: 104,
    epaule: 40,
    longueurManche: 19,
    longueurDos: 63,
  },
  XL: {
    poitrine: 104,
    taille: 86,
    hanches: 112,
    epaule: 41,
    longueurManche: 20,
    longueurDos: 64,
  },
  XXL: {
    poitrine: 112,
    taille: 94,
    hanches: 120,
    epaule: 42,
    longueurManche: 20,
    longueurDos: 65,
  },
}

export const EU_SIZE_ORDER: EuSize[] = ["XS", "S", "M", "L", "XL", "XXL"]

// Règles de gradation EU : +4 cm horizontal, +0,6 cm vertical entre deux tailles
export const GRADING_HORIZONTAL = 4
export const GRADING_VERTICAL = 0.6

export function getSizeMeasurements(size: EuSize): SizeMeasurements {
  return EU_SIZES[size]
}
