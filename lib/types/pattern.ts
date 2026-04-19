// Types partagés pour le moteur de patronage PatronAI

export interface SizeMeasurements {
  poitrine: number       // tour de poitrine en cm
  taille: number         // tour de taille en cm
  hanches: number        // tour de hanches en cm
  epaule: number         // largeur d'épaule en cm
  longueurManche: number // longueur de manche en cm
  longueurDos: number    // longueur du dos (nuque → bassin) en cm
}

export interface CustomMeasurements extends SizeMeasurements {
  isCustom: true
}

export type EuSize = "XS" | "S" | "M" | "L" | "XL" | "XXL"

export interface PatternPiece {
  name: string        // ex: "Devant"
  svg: string         // SVG complet de la pièce
  widthCm: number     // largeur totale de la pièce déployée
  heightCm: number    // hauteur de la pièce
  cutCount: number    // nombre de fois à couper
  onFold: boolean     // si la pièce est coupée au pli
}

export interface SewingStep {
  step: number
  title: string
  instruction: string
  tip?: string
}

export interface PatternResult {
  pieces: PatternPiece[]
  flatSketch: string                  // SVG vue à plat du vêtement
  sewingGuide: SewingStep[]
  estimatedTimeMinutes: number
  difficulty: 1 | 2 | 3 | 4 | 5
  fabricNeededCm: number
}
