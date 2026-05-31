// Imbrication des pièces de patron sur le tissu (plan de coupe).
//
// Objectif : poser toutes les pièces (avec leurs copies) sur une laize de tissu
// donnée en minimisant la longueur consommée — TOUT EN RESPECTANT LE DROIT-FIL.
// Le respect du droit-fil est la contrainte « texture-aware » : une pièce n'est
// jamais tournée hors de son grain (pas de rotation 90°), donc les imprimés,
// rayures et sens du poil restent cohérents sur le vêtement fini.
//
// Algorithme : empaquetage par étagères (First-Fit Decreasing Height) sur une
// bande de largeur fixe. Honnête et déterministe ; légèrement conservateur vs
// un placement manuel optimal (on raisonne sur les boîtes englobantes, pas sur
// les contours réels — la découpe de vraies formes imbriquées ferait gagner un
// peu plus, mais jamais au prix du droit-fil).

import type { PatternPiece } from "@/lib/types/pattern"

export type Grain = "V" | "H"

export interface Placement {
  name: string
  copy: number       // numéro de copie (pour cutCount > 1)
  copies: number     // nombre total de copies de cette pièce
  x: number          // coin haut-gauche sur le tissu (cm)
  y: number
  w: number          // largeur occupée (travers tissu, cm)
  h: number          // longueur occupée (sens du tissu, cm)
  grain: Grain
}

export interface NestingResult {
  fabricWidthCm: number
  fabricLengthCm: number
  utilizationPct: number
  placements: Placement[]
  oversized: string[]   // pièces plus larges que la laize → infaisables
  gapCm: number
}

// Pièces dont le droit-fil court dans le sens de leur LONGUEUR (bandes/ceintures
// /cols coupés dans la longueur du tissu) → boîte pivotée pour aligner le grain.
const H_GRAIN = /ceinture|bande|col|poignet|parementure|biais|patte/i

export function grainOf(piece: PatternPiece): Grain {
  return H_GRAIN.test(piece.name) ? "H" : "V"
}

interface Shelf {
  y: number
  height: number
  usedWidth: number
}

export interface NestOptions {
  gapCm?: number
}

export function nestPieces(
  pieces: PatternPiece[],
  fabricWidthCm: number,
  options?: NestOptions,
): NestingResult {
  const gap = options?.gapCm ?? 1.5

  // 1. Développe chaque pièce en autant de boîtes que de copies à couper,
  //    orientées droit-fil vertical (le grain suit toujours la longueur tissu).
  interface Box {
    name: string
    copy: number
    copies: number
    across: number // travers tissu (x)
    along: number  // sens tissu (y)
    grain: Grain
  }
  const boxes: Box[] = []
  for (const p of pieces) {
    const grain = grainOf(p)
    // "V" : grain dans la hauteur → hauteur le long du tissu.
    // "H" : grain dans la largeur → largeur le long du tissu (boîte pivotée).
    const across = grain === "V" ? p.widthCm : p.heightCm
    const along = grain === "V" ? p.heightCm : p.widthCm
    const copies = Math.max(1, Math.round(p.cutCount || 1))
    for (let i = 0; i < copies; i++) {
      boxes.push({ name: p.name, copy: i + 1, copies, across, along, grain })
    }
  }

  // 2. Tri par longueur décroissante (puis largeur) — clé du FFDH.
  boxes.sort((a, b) => b.along - a.along || b.across - a.across)

  // 3. Placement par étagères.
  const shelves: Shelf[] = []
  const placements: Placement[] = []
  const oversized: string[] = []
  let cursorY = 0

  for (const b of boxes) {
    if (b.across > fabricWidthCm) {
      if (!oversized.includes(b.name)) oversized.push(b.name)
      continue
    }
    // Première étagère où la pièce tient (hauteur + largeur restante).
    let shelf = shelves.find(
      (s) => b.along <= s.height + 1e-6 && s.usedWidth + b.across <= fabricWidthCm + 1e-6,
    )
    if (!shelf) {
      shelf = { y: cursorY, height: b.along, usedWidth: 0 }
      shelves.push(shelf)
      cursorY += b.along + gap
    }
    placements.push({
      name: b.name,
      copy: b.copy,
      copies: b.copies,
      x: shelf.usedWidth,
      y: shelf.y,
      w: b.across,
      h: b.along,
      grain: b.grain,
    })
    shelf.usedWidth += b.across + gap
  }

  const fabricLengthCm = placements.length
    ? Math.ceil(Math.max(...placements.map((p) => p.y + p.h)))
    : 0
  const usedArea = placements.reduce((s, p) => s + p.w * p.h, 0)
  const utilizationPct =
    fabricLengthCm > 0
      ? Math.round((100 * usedArea) / (fabricWidthCm * fabricLengthCm))
      : 0

  return {
    fabricWidthCm,
    fabricLengthCm,
    utilizationPct,
    placements,
    oversized,
    gapCm: gap,
  }
}

// Laizes de tissu courantes (cm).
export const FABRIC_WIDTHS = [90, 110, 140, 150] as const
