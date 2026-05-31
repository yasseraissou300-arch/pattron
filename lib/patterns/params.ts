// Couche de paramètres de design pour le créateur de patrons paramétrique.
//
// Philosophie « le moins de mesures possible » : l'utilisatrice fournit ses
// mensurations corporelles, et chaque paramètre de style possède une valeur par
// défaut DÉRIVÉE de ces mensurations. Les défauts reproduisent à l'identique le
// comportement historique des moteurs — rien ne change tant qu'aucun curseur
// n'est déplacé. Les overrides sont optionnels et toujours bornés (clamp).

import type { SizeMeasurements } from "../types/pattern"
import type { GarmentType } from "./index"

// ─── Identifiants de paramètres (partagés entre vêtements) ───────────────────

export type DesignParamId =
  | "ease"          // aisance de poitrine (cm, tour complet)
  | "bodyLength"    // longueur du vêtement (cm)
  | "necklineDepth" // profondeur d'encolure devant (cm)
  | "necklineWidth" // demi-largeur d'encolure (cm)
  | "sleeveLength"  // longueur de manche (cm)
  | "sleeveWidth"   // largeur de tête de manche (cm)
  | "waistEase"     // aisance de taille (cm, tour complet)
  | "flare"         // évasure ajoutée au bas, par quart (cm)
  | "legLength"     // longueur d'entrejambe (cm)
  | "legOpening"    // ouverture de bas de jambe (cm, tour complet)
  | "riseAdjust"    // ajustement de la hauteur de fourche (cm, +/-)

// Overrides fournis par l'utilisatrice (épars).
export type DesignParams = Partial<Record<DesignParamId, number>>

// Paramètres entièrement résolus pour un vêtement (défauts comblés + bornés).
// Ne contient au runtime que les clés exposées par le vêtement concerné.
export type ResolvedParams = Record<DesignParamId, number>

export interface ParamDef {
  id: DesignParamId
  label: string
  description: string
  unit: string
  min: number
  max: number
  step: number
  /** Valeur par défaut dérivée des mensurations. */
  default: (m: SizeMeasurements) => number
}

// ─── Fabriques de définitions (factorisation des libellés communs) ───────────

const ease = (def: number): ParamDef => ({
  id: "ease",
  label: "Aisance poitrine",
  description:
    "Largeur ajoutée au tour de poitrine pour le confort et le tombé. 0 = ajusté, +12 = ample.",
  unit: "cm",
  min: 0,
  max: 20,
  step: 0.5,
  default: () => def,
})

const bodyLength = (
  def: (m: SizeMeasurements) => number,
  min: number,
  max: number,
  label = "Longueur du vêtement",
): ParamDef => ({
  id: "bodyLength",
  label,
  description: "Longueur finie mesurée de l'épaule (ou de la taille) au bas.",
  unit: "cm",
  min,
  max,
  step: 1,
  default: def,
})

const necklineDepth = (def: number): ParamDef => ({
  id: "necklineDepth",
  label: "Profondeur d'encolure",
  description: "Hauteur de l'échancrure devant. Plus la valeur est grande, plus le col est plongeant.",
  unit: "cm",
  min: 4,
  max: 22,
  step: 0.5,
  default: () => def,
})

const necklineWidth = (def: number): ParamDef => ({
  id: "necklineWidth",
  label: "Largeur d'encolure",
  description: "Demi-largeur de l'encolure (du milieu vers l'épaule).",
  unit: "cm",
  min: 3,
  max: 11,
  step: 0.5,
  default: () => def,
})

const sleeveLength = (
  def: (m: SizeMeasurements) => number,
  min: number,
  max: number,
): ParamDef => ({
  id: "sleeveLength",
  label: "Longueur de manche",
  description: "Du sommet de l'épaule au bas de la manche.",
  unit: "cm",
  min,
  max,
  step: 1,
  default: def,
})

const sleeveWidth = (def: number): ParamDef => ({
  id: "sleeveWidth",
  label: "Largeur de manche",
  description: "Largeur de la tête de manche. Plus elle est grande, plus la manche est ample.",
  unit: "cm",
  min: 14,
  max: 30,
  step: 0.5,
  default: () => def,
})

const waistEase = (def: number): ParamDef => ({
  id: "waistEase",
  label: "Aisance taille",
  description: "Largeur ajoutée au tour de taille pour le confort.",
  unit: "cm",
  min: 0,
  max: 16,
  step: 0.5,
  default: () => def,
})

const flare = (def: number): ParamDef => ({
  id: "flare",
  label: "Évasure (A-line)",
  description: "Largeur ajoutée à chaque quart en bas, au-delà des hanches. 0 = droit, +15 = très évasé.",
  unit: "cm",
  min: 0,
  max: 20,
  step: 0.5,
  default: () => def,
})

// ─── Définitions par vêtement ─────────────────────────────────────────────────

export const GARMENT_PARAMS: Record<GarmentType, ParamDef[]> = {
  tshirt: [
    ease(4),
    bodyLength((m) => m.longueurDos, 40, 95),
    necklineDepth(7),
    necklineWidth(4),
    sleeveLength((m) => m.longueurManche, 5, 70),
    sleeveWidth(18),
  ],
  dress: [
    ease(4),
    bodyLength((m) => Math.round(m.longueurDos * 2.0), 75, 145, "Longueur de robe"),
    necklineDepth(7),
    necklineWidth(4),
    sleeveLength((m) => m.longueurManche, 5, 70),
    sleeveWidth(18),
  ],
  shirt: [
    ease(6),
    bodyLength((m) => Math.round(m.longueurDos * 1.05), 50, 100),
    necklineDepth(6.5),
    necklineWidth(3.5),
    sleeveLength((m) => Math.round(m.longueurDos * 0.95), 10, 75),
    sleeveWidth(18),
  ],
  skirt: [
    bodyLength((m) => Math.round(m.longueurDos * 0.88), 30, 110, "Longueur de jupe"),
    waistEase(4),
    flare(0.5),
  ],
  pants: [
    {
      id: "legLength",
      label: "Longueur de jambe",
      description: "Longueur d'entrejambe, de la fourche au bas de jambe.",
      unit: "cm",
      min: 40,
      max: 95,
      step: 1,
      default: (m) => Math.round(m.longueurDos * 1.63),
    },
    {
      id: "legOpening",
      label: "Ouverture de bas",
      description: "Tour du bas de jambe. Petit = fuseau, grand = jambe large.",
      unit: "cm",
      min: 14,
      max: 60,
      step: 0.5,
      default: () => 21,
    },
    {
      id: "riseAdjust",
      label: "Hauteur de taille",
      description: "Ajuste la hauteur de fourche. Négatif = taille basse, positif = taille haute.",
      unit: "cm",
      min: -6,
      max: 8,
      step: 0.5,
      default: () => 0,
    },
    waistEase(2),
  ],
}

// ─── Résolution ────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/**
 * Résout les paramètres de design d'un vêtement : pour chaque paramètre exposé,
 * prend l'override fourni s'il est valide (et le borne), sinon la valeur par
 * défaut dérivée des mensurations.
 */
export function resolveParams(
  type: GarmentType,
  m: SizeMeasurements,
  overrides?: DesignParams,
): ResolvedParams {
  const out = {} as ResolvedParams
  for (const def of GARMENT_PARAMS[type]) {
    const raw = overrides?.[def.id]
    const val = typeof raw === "number" && Number.isFinite(raw) ? raw : def.default(m)
    out[def.id] = clamp(val, def.min, def.max)
  }
  return out
}

/** Valeurs par défaut résolues (utile pour initialiser l'UI). */
export function paramDefaults(type: GarmentType, m: SizeMeasurements): ResolvedParams {
  return resolveParams(type, m)
}
