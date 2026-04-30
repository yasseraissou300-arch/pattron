// Moteur de patronage — Robe droite femme (shift dress)
// Toutes les dimensions en cm. 1 unité SVG = 1 cm.
// Pièces : Devant (pli), Dos (pli), Manche courte ×2

import type { SizeMeasurements, PatternPiece, PatternResult, SewingStep } from "../types/pattern"
import {
  circle, notch, grainArrow, grainArrowH, dimension, svgWrap,
  foldIndicator, pieceLabel, rectPiece,
} from "./helpers"

// Longueur robe = mi-genou (~longueurDos × 2.0)
function dressLength(m: SizeMeasurements): number {
  return Math.round(m.longueurDos * 2.0)
}

// ─── Pièce 1 : Devant ────────────────────────────────────────────────────────

function generateDressFront(m: SizeMeasurements, sa: number): PatternPiece {
  const ph  = dressLength(m)
  const nw  = 4              // demi-largeur encolure
  const nd  = 7              // profondeur encolure devant
  const sw  = m.epaule / 2  // demi-largeur épaule
  const sd  = 1.5            // chute d'épaule
  const ad  = Math.round(m.longueurDos * 0.34) // profondeur emmanchure

  // Largeurs à différents niveaux
  const bwBust  = m.poitrine / 4 + 1      // demi-largeur poitrine
  const bwWaist = m.taille / 4 + 0.5      // demi-largeur taille
  const bwHip   = m.hanches / 4 + 1       // demi-largeur hanches
  const bwHem   = m.hanches / 4 + 1.5     // demi-largeur bas

  const hipY  = Math.round(ph * 0.42)     // niveau hanches sur la longueur totale
  const waistY = Math.round(ph * 0.26)    // niveau taille

  const mx = 2, my = 2

  // Points de couture (taille finie)
  const Ax = mx,         Ay = my + nd          // centre encolure bas
  const Bx = mx + nw,   By = my               // fin encolure côté épaule
  const Cx = mx + sw,   Cy = my + sd           // pointe épaule
  const Dx = mx + bwBust, Dy = my + ad         // bas emmanchure
  const Ex = mx + bwWaist, Ey = my + waistY   // taille côté (cintrée)
  const Fx = mx + bwHip,  Fy = my + hipY      // hanche côté
  const Gx = mx + bwHem,  Gy = my + ph        // bas côté
  const Hx = mx,          Hy = my + ph        // bas pli

  // Courbe emmanchure
  const emC1 = { x: Cx + 2.5, y: Cy + 5 }
  const emC2 = { x: Dx, y: Dy - 7 }

  const sewPath = [
    `M ${Ax},${Ay}`,
    `A ${nw},${nd} 0 0 1 ${Bx},${By}`,
    `L ${Cx},${Cy}`,
    `C ${emC1.x},${emC1.y} ${emC2.x},${emC2.y} ${Dx},${Dy}`,
    `Q ${Dx},${Ey} ${Ex},${Ey}`,
    `Q ${Fx - 0.5},${(Ey + Fy) / 2} ${Fx},${Fy}`,
    `Q ${Gx},${(Fy + Gy) / 2} ${Gx},${Gy}`,
    `L ${Hx},${Hy}`,
    `Z`,
  ].join(" ")

  // Points de coupe (+sa)
  const A2 = { x: mx, y: Ay - sa }
  const B2 = { x: mx + nw + sa * 0.7, y: my - sa }
  const C2 = { x: mx + sw + sa * 0.5, y: my + sd - sa * 0.5 }
  const D2 = { x: mx + bwBust + sa, y: my + ad }
  const E2 = { x: mx + bwWaist + sa, y: my + waistY }
  const F2 = { x: mx + bwHip + sa,  y: my + hipY }
  const G2 = { x: mx + bwHem + sa,  y: my + ph + sa }
  const H2 = { x: mx, y: my + ph + sa }

  const emC1c = { x: C2.x + 2.5, y: C2.y + 5 }
  const emC2c = { x: D2.x, y: D2.y - 7 }

  const cutPath = [
    `M ${A2.x},${A2.y}`,
    `A ${nw + sa * 0.7},${nd + sa} 0 0 1 ${B2.x},${B2.y}`,
    `L ${C2.x},${C2.y}`,
    `C ${emC1c.x},${emC1c.y} ${emC2c.x},${emC2c.y} ${D2.x},${D2.y}`,
    `Q ${D2.x},${E2.y} ${E2.x},${E2.y}`,
    `Q ${F2.x - 0.5},${(E2.y + F2.y) / 2} ${F2.x},${F2.y}`,
    `Q ${G2.x},${(F2.y + G2.y) / 2} ${G2.x},${G2.y}`,
    `L ${H2.x},${H2.y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + bwHem + sa + 3
  const totalH = my + ph + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    foldIndicator(mx, my - sa, my + ph + sa),
    grainArrow(mx + bwHip * 0.55, my + ph * 0.2, my + ph * 0.65),
    circle(Cx, Cy),
    circle(Dx, Dy),
    circle(Ex, Ey),
    notch(Dx, Dy, "right"),
    notch(Ex, Ey, "right"),
    dimension(mx, my + ph + sa + 1.2, mx + bwHem, `${(bwHem * 2).toFixed(1)} cm`),
    pieceLabel(mx + bwHip * 0.45, my + ph * 0.42, "ROBE DEVANT", "Couper 1× au pli", `${(bwBust * 2).toFixed(0)} × ${ph} cm`),
  ].join("\n")

  return {
    name: "Robe Devant",
    svg: svgWrap(content, totalW, totalH),
    widthCm: bwHem * 2,
    heightCm: ph,
    cutCount: 1,
    onFold: true,
  }
}

// ─── Pièce 2 : Dos ───────────────────────────────────────────────────────────

function generateDressBack(m: SizeMeasurements, sa: number): PatternPiece {
  const ph  = dressLength(m)
  const nw  = 4
  const nd  = 3              // encolure dos plus plate
  const sw  = m.epaule / 2
  const sd  = 1.5
  const ad  = Math.round(m.longueurDos * 0.34)

  const bwBust  = m.poitrine / 4 + 1
  const bwWaist = m.taille / 4 + 1       // dos légèrement plus large
  const bwHip   = m.hanches / 4 + 1.5
  const bwHem   = m.hanches / 4 + 2

  const hipY   = Math.round(ph * 0.42)
  const waistY = Math.round(ph * 0.26)
  const mx = 2, my = 2

  const Ax = mx,         Ay = my + nd
  const Bx = mx + nw,   By = my
  const Cx = mx + sw,   Cy = my + sd
  const Dx = mx + bwBust, Dy = my + ad
  const Ex = mx + bwWaist, Ey = my + waistY
  const Fx = mx + bwHip,  Fy = my + hipY
  const Gx = mx + bwHem,  Gy = my + ph
  const Hx = mx,          Hy = my + ph

  const emC1 = { x: Cx + 2.5, y: Cy + 5 }
  const emC2 = { x: Dx, y: Dy - 7 }

  const sewPath = [
    `M ${Ax},${Ay}`,
    `A ${nw},${nd} 0 0 1 ${Bx},${By}`,
    `L ${Cx},${Cy}`,
    `C ${emC1.x},${emC1.y} ${emC2.x},${emC2.y} ${Dx},${Dy}`,
    `Q ${Dx},${Ey} ${Ex},${Ey}`,
    `Q ${Fx - 0.5},${(Ey + Fy) / 2} ${Fx},${Fy}`,
    `Q ${Gx},${(Fy + Gy) / 2} ${Gx},${Gy}`,
    `L ${Hx},${Hy}`,
    `Z`,
  ].join(" ")

  const A2 = { x: mx, y: Ay - sa }
  const B2 = { x: mx + nw + sa * 0.7, y: my - sa }
  const C2 = { x: mx + sw + sa * 0.5, y: my + sd - sa * 0.5 }
  const D2 = { x: mx + bwBust + sa, y: my + ad }
  const E2 = { x: mx + bwWaist + sa, y: my + waistY }
  const F2 = { x: mx + bwHip + sa,  y: my + hipY }
  const G2 = { x: mx + bwHem + sa,  y: my + ph + sa }
  const H2 = { x: mx, y: my + ph + sa }

  const emC1c = { x: C2.x + 2.5, y: C2.y + 5 }
  const emC2c = { x: D2.x, y: D2.y - 7 }

  const cutPath = [
    `M ${A2.x},${A2.y}`,
    `A ${nw + sa * 0.7},${nd + sa} 0 0 1 ${B2.x},${B2.y}`,
    `L ${C2.x},${C2.y}`,
    `C ${emC1c.x},${emC1c.y} ${emC2c.x},${emC2c.y} ${D2.x},${D2.y}`,
    `Q ${D2.x},${E2.y} ${E2.x},${E2.y}`,
    `Q ${F2.x - 0.5},${(E2.y + F2.y) / 2} ${F2.x},${F2.y}`,
    `Q ${G2.x},${(F2.y + G2.y) / 2} ${G2.x},${G2.y}`,
    `L ${H2.x},${H2.y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + bwHem + sa + 3
  const totalH = my + ph + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    foldIndicator(mx, my - sa, my + ph + sa),
    grainArrow(mx + bwHip * 0.55, my + ph * 0.2, my + ph * 0.65),
    circle(Cx, Cy),
    circle(Dx, Dy),
    circle(Ex, Ey),
    notch(Dx, Dy, "right"),
    notch(Ex, Ey, "right"),
    dimension(mx, my + ph + sa + 1.2, mx + bwHem, `${(bwHem * 2).toFixed(1)} cm`),
    pieceLabel(mx + bwHip * 0.45, my + ph * 0.42, "ROBE DOS", "Couper 1× au pli", `${(bwBust * 2).toFixed(0)} × ${ph} cm`),
  ].join("\n")

  return {
    name: "Robe Dos",
    svg: svgWrap(content, totalW, totalH),
    widthCm: bwHem * 2,
    heightCm: ph,
    cutCount: 1,
    onFold: true,
  }
}

// ─── Pièce 3 : Manche courte ─────────────────────────────────────────────────

function generateSleeve(m: SizeMeasurements, sa: number): PatternPiece {
  const capW    = 18
  const slH     = m.longueurManche
  const botW    = 16
  const halfCap = capW / 2
  const halfBot = botW / 2
  const capH    = Math.min(slH * 0.5, 8)
  const mx = 2, my = 2
  const centerX = mx + halfCap

  const TL  = { x: centerX - halfCap, y: my + capH }
  const TR  = { x: centerX + halfCap, y: my + capH }
  const BL  = { x: centerX - halfBot, y: my + slH }
  const BR  = { x: centerX + halfBot, y: my + slH }
  const cTL = { x: centerX - halfCap * 0.6, y: my - 0.5 }
  const cTR = { x: centerX + halfCap * 0.6, y: my - 0.5 }

  const sewPath = [
    `M ${centerX},${my}`,
    `C ${cTL.x},${cTL.y} ${TL.x},${TL.y - 1} ${TL.x},${TL.y}`,
    `L ${BL.x},${BL.y} L ${BR.x},${BR.y} L ${TR.x},${TR.y}`,
    `C ${TR.x},${TR.y - 1} ${cTR.x},${cTR.y} ${centerX},${my}`,
    `Z`,
  ].join(" ")

  const TLc = { x: TL.x - sa, y: TL.y + sa * 0.3 }
  const TRc = { x: TR.x + sa, y: TR.y + sa * 0.3 }
  const BLc = { x: BL.x - sa, y: BL.y + sa }
  const BRc = { x: BR.x + sa, y: BR.y + sa }

  const cutPath = [
    `M ${centerX},${my - sa}`,
    `C ${cTL.x},${my - sa - 0.5} ${TLc.x},${TLc.y - 1} ${TLc.x},${TLc.y}`,
    `L ${BLc.x},${BLc.y} L ${BRc.x},${BRc.y} L ${TRc.x},${TRc.y}`,
    `C ${TRc.x},${TRc.y - 1} ${cTR.x},${my - sa - 0.5} ${centerX},${my - sa}`,
    `Z`,
  ].join(" ")

  const totalW = mx + capW + sa + 2
  const totalH = my + slH + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    grainArrow(centerX, my + slH * 0.25, my + slH * 0.7),
    circle(centerX, my),
    circle(TL.x, TL.y),
    circle(TR.x, TR.y),
    dimension(mx, my + slH + sa + 1.2, mx + capW, `${capW} cm`),
    pieceLabel(centerX, my + slH * 0.45, "MANCHE", "Couper 2×", `${capW} × ${slH} cm`),
  ].join("\n")

  return {
    name: "Manche",
    svg: svgWrap(content, totalW, totalH),
    widthCm: capW,
    heightCm: slH,
    cutCount: 2,
    onFold: false,
  }
}

// ─── Bande d'encolure ─────────────────────────────────────────────────────────

function generateNeckband(m: SizeMeasurements, sa: number): PatternPiece {
  const length = Math.round(m.poitrine * 0.4)
  const width  = 4
  const mx = 2, my = 2
  const { svg, widthCm, heightCm } = rectPiece(mx, my, length, width, sa, "BANDE D'ENCOLURE", "Couper 1× (tissu extensible)", "H")
  return { name: "Bande d'encolure", svg, widthCm, heightCm, cutCount: 1, onFold: false }
}

// ─── Croquis à plat ──────────────────────────────────────────────────────────

function generateFlatSketch(m: SizeMeasurements): string {
  const W = 40, H = 65, cx = W / 2
  const ph = dressLength(m)
  const scaleH = 55 / ph

  const bodyH = 55
  const shoulderY = 5
  const waistY = shoulderY + Math.round(m.longueurDos * 0.26 * scaleH)
  const hipY   = shoulderY + Math.round(m.longueurDos * 0.42 * scaleH)

  const body = [
    `M ${cx - 8},${shoulderY}`,
    `L ${cx - 8},${shoulderY + 3}`,
    `L ${cx - 16},${shoulderY + 5}`,
    `L ${cx - 16},${shoulderY + 12}`,
    `L ${cx - 8},${shoulderY + 10}`,
    `Q ${cx - 7},${waistY} ${cx - 7},${waistY}`,
    `Q ${cx - 9},${hipY} ${cx - 10},${bodyH}`,
    `L ${cx + 10},${bodyH}`,
    `Q ${cx + 9},${hipY} ${cx + 7},${waistY}`,
    `Q ${cx + 7},${waistY} ${cx + 8},${shoulderY + 10}`,
    `L ${cx + 16},${shoulderY + 12}`,
    `L ${cx + 16},${shoulderY + 5}`,
    `L ${cx + 8},${shoulderY + 3}`,
    `L ${cx + 8},${shoulderY}`,
    `A 8,6 0 0 0 ${cx - 8},${shoulderY}`,
    `Z`,
  ].join(" ")

  const content = [
    `<rect width="${W}" height="${H}" fill="white"/>`,
    `<path d="${body}" fill="#ede9fe" fill-opacity="0.6" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<line x1="${cx}" y1="${shoulderY}" x2="${cx}" y2="${bodyH}" stroke="#9ca3af" stroke-width="0.25" stroke-dasharray="1,0.5"/>`,
    `<text x="${cx}" y="${H - 4}" font-size="2" text-anchor="middle" fill="#7c3aed" font-family="Arial" font-weight="bold">Robe droite</text>`,
  ].join("\n")

  return svgWrap(content, W, H)
}

// ─── Guide de couture ─────────────────────────────────────────────────────────

function generateSewingGuide(): SewingStep[] {
  return [
    {
      step: 1,
      title: "Préparer le tissu",
      instruction: "Lave et repasse ton tissu. Plie-le en deux endroit contre endroit.",
      tip: "Pour une robe droite, un tissu fluide (viscose, jersey léger, crêpe) donne de beaux résultats.",
    },
    {
      step: 2,
      title: "Couper toutes les pièces",
      instruction: "Coupe le Devant et le Dos sur le pli. Coupe 2 manches (pièce entière). Coupe 1 bande d'encolure dans un tissu extensible.",
    },
    {
      step: 3,
      title: "Assembler les épaules",
      instruction: "Endroit contre endroit, couds les coutures d'épaules à 1 cm. Surfile et repasse vers le dos.",
    },
    {
      step: 4,
      title: "Poser la bande d'encolure",
      instruction: "Plie la bande en deux (longueur), endroit extérieur. Épingle-la sur l'encolure en l'étirant légèrement. Couds à 1 cm, surfile et retourne vers l'intérieur.",
    },
    {
      step: 5,
      title: "Monter les manches",
      instruction: "Aligne le cran central de chaque manche sur la couture d'épaule. Épingle en répartissant l'embu, couds à 1 cm. Surfile.",
    },
    {
      step: 6,
      title: "Fermer côtés et manches",
      instruction: "Endroit contre endroit, couds en une seule passe continue de l'extrémité de manche jusqu'au bas de la robe. Surfile.",
      tip: "Commence par l'aisselle pour garder l'alignement côtés-manches.",
    },
    {
      step: 7,
      title: "Poser la fermeture (optionnel)",
      instruction: "Si la robe est en tissu non extensible, pose une fermeture éclair de 22 cm dans le dos ou sur le côté.",
    },
    {
      step: 8,
      title: "Ourlets manches et bas",
      instruction: "Ourlet manches : replie 1 cm puis 1 cm, couds. Ourlet bas robe : replie 2 cm puis 1 cm, couds.",
    },
    {
      step: 9,
      title: "Repassage final",
      instruction: "Repasse toutes les coutures à la vapeur. Utilise un torchon humide pour les tissus délicats.",
    },
  ]
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function generatePattern(
  measurements: SizeMeasurements,
  seamAllowance = 1
): PatternResult {
  const sa = seamAllowance
  const ph = dressLength(measurements)
  const bwHem = measurements.hanches / 4 + 2

  const pieces = [
    generateDressFront(measurements, sa),
    generateDressBack(measurements, sa),
    generateSleeve(measurements, sa),
    generateNeckband(measurements, sa),
  ]

  const fabricNeededCm = Math.ceil(ph + measurements.longueurDos * 0.4 + 20)

  return {
    pieces,
    flatSketch: generateFlatSketch(measurements),
    sewingGuide: generateSewingGuide(),
    estimatedTimeMinutes: 240,
    difficulty: 3,
    fabricNeededCm,
  }
}
