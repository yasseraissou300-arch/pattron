// Moteur de patronage — Chemise boutonnée femme
// Toutes les dimensions en cm. 1 unité SVG = 1 cm.
// Pièces : Devant droit, Devant gauche (miroir), Dos (pli), Manche longue ×2, Col, Pied de col, Poignet ×2

import type { SizeMeasurements, PatternPiece, PatternResult, SewingStep } from "../types/pattern"
import {
  circle, notch, grainArrow, dimension, svgWrap,
  foldIndicator, pieceLabel, rectPiece,
} from "./helpers"

// Longueur chemise = hanches (~longueurDos × 1.05)
function shirtLength(m: SizeMeasurements): number {
  return Math.round(m.longueurDos * 1.05)
}

// Longueur manche longue (~59 cm pour M)
function longSleeveLength(m: SizeMeasurements): number {
  return Math.round(m.longueurDos * 0.95)
}

// ─── Pièce 1 : Devant (demi-pièce, PAS au pli — boutons au centre) ────────────

function generateShirtFront(m: SizeMeasurements, sa: number, side: "right" | "left"): PatternPiece {
  const ph  = shirtLength(m)
  const nw  = 3.5            // demi-largeur encolure
  const nd  = 6.5            // profondeur encolure devant
  const sw  = m.epaule / 2
  const sd  = 1.5
  const ad  = Math.round(m.longueurDos * 0.34)
  const bw  = m.poitrine / 4 + 1.5   // demi-largeur corps (aisance chemise)
  const bandW = 2.5                    // bande de boutonnage / boutonnières

  const mx = 2, my = 2

  // Points de couture (centre devant à droite, côté couture à gauche si right)
  // Pour simplifier : on dessine le "devant droit" avec le centre à droite
  const Ax = mx + bandW, Ay = my + nd         // centre bas encolure (sur bande)
  const Bx = mx + nw + bandW, By = my         // fin encolure vers épaule
  const Cx = mx + sw + bandW, Cy = my + sd    // pointe épaule
  const Dx = mx + bw + bandW, Dy = my + ad    // bas emmanchure
  const Ex = mx + bw + bandW, Ey = my + ph    // bas côté
  const Fx = mx,              Fy = my + ph    // bas bande boutonnage
  const Gx = mx,              Gy = my         // haut bande boutonnage

  // Bande de boutonnage (ligne de centre)
  const centerX = mx + bandW

  const emC1 = { x: Cx + 2.5, y: Cy + 5 }
  const emC2 = { x: Dx, y: Dy - 7 }

  const sewPath = [
    `M ${Ax},${Ay}`,
    `A ${nw},${nd} 0 0 1 ${Bx},${By}`,
    `L ${Cx},${Cy}`,
    `C ${emC1.x},${emC1.y} ${emC2.x},${emC2.y} ${Dx},${Dy}`,
    `L ${Ex},${Ey}`,
    `L ${Fx},${Fy}`,
    `L ${Gx},${Gy}`,
    `Z`,
  ].join(" ")

  // Ligne de centre (bande de boutonnage)
  const centerLine = `<line x1="${centerX}" y1="${my - sa}" x2="${centerX}" y2="${my + ph + sa}" stroke="#3b82f6" stroke-width="0.1" stroke-dasharray="0.6,0.3"/>`

  // Marques boutons (~tous les 7 cm, à partir de 3 cm du col)
  const buttonMarks: string[] = []
  for (let y = my + nd + 3; y < my + ph - 4; y += 7) {
    buttonMarks.push(`<circle cx="${centerX}" cy="${y}" r="0.4" fill="none" stroke="#3b82f6" stroke-width="0.1"/>`)
  }

  const A2 = { x: mx + bandW, y: Ay - sa }
  const B2 = { x: mx + nw + bandW + sa * 0.7, y: By - sa }
  const C2 = { x: mx + sw + bandW + sa * 0.5, y: Cy - sa * 0.5 }
  const D2 = { x: mx + bw + bandW + sa, y: Dy }
  const E2 = { x: mx + bw + bandW + sa, y: Ey + sa }
  const F2 = { x: mx - sa, y: Ey + sa }
  const G2 = { x: mx - sa, y: my - sa }

  const emC1c = { x: C2.x + 2.5, y: C2.y + 5 }
  const emC2c = { x: D2.x, y: D2.y - 7 }

  const cutPath = [
    `M ${A2.x},${A2.y}`,
    `A ${nw + sa * 0.7},${nd + sa} 0 0 1 ${B2.x},${B2.y}`,
    `L ${C2.x},${C2.y}`,
    `C ${emC1c.x},${emC1c.y} ${emC2c.x},${emC2c.y} ${D2.x},${D2.y}`,
    `L ${E2.x},${E2.y}`,
    `L ${F2.x},${F2.y}`,
    `L ${G2.x},${G2.y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + bw + bandW + sa + 3
  const totalH = my + ph + sa + 3
  const label  = side === "right" ? "DEVANT DROIT" : "DEVANT GAUCHE"
  const cuts   = "Couper 1×"

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    centerLine,
    ...buttonMarks,
    grainArrow(mx + (bw + bandW) * 0.55, my + ph * 0.2, my + ph * 0.65),
    circle(Cx, Cy),
    circle(Dx, Dy),
    notch(Dx, Dy, "right"),
    dimension(mx, my + ph + sa + 1.2, mx + bw + bandW, `${(bw + bandW).toFixed(1)} cm`),
    pieceLabel(mx + (bw + bandW) * 0.5, my + ph * 0.42, label, cuts, `${((bw + bandW)).toFixed(0)} × ${ph} cm`),
  ].join("\n")

  return {
    name: label,
    svg: svgWrap(content, totalW, totalH),
    widthCm: bw + bandW,
    heightCm: ph,
    cutCount: 1,
    onFold: false,
  }
}

// ─── Pièce 3 : Dos ───────────────────────────────────────────────────────────

function generateShirtBack(m: SizeMeasurements, sa: number): PatternPiece {
  const ph  = shirtLength(m)
  const nw  = 3.5
  const nd  = 2.5            // encolure dos plate
  const sw  = m.epaule / 2
  const sd  = 1.5
  const ad  = Math.round(m.longueurDos * 0.34)
  const bw  = m.poitrine / 4 + 2    // aisance chemise dos légèrement plus large
  const mx = 2, my = 2

  const Ax = mx,      Ay = my + nd
  const Bx = mx + nw, By = my
  const Cx = mx + sw, Cy = my + sd
  const Dx = mx + bw, Dy = my + ad
  const Ex = mx + bw, Ey = my + ph
  const Fx = mx,      Fy = my + ph

  const emC1 = { x: Cx + 2.5, y: Cy + 5 }
  const emC2 = { x: Dx, y: Dy - 7 }

  const sewPath = [
    `M ${Ax},${Ay}`,
    `A ${nw},${nd} 0 0 1 ${Bx},${By}`,
    `L ${Cx},${Cy}`,
    `C ${emC1.x},${emC1.y} ${emC2.x},${emC2.y} ${Dx},${Dy}`,
    `L ${Ex},${Ey}`,
    `L ${Fx},${Fy}`,
    `Z`,
  ].join(" ")

  const A2 = { x: mx, y: Ay - sa }
  const B2 = { x: mx + nw + sa * 0.7, y: By - sa }
  const C2 = { x: mx + sw + sa * 0.5, y: Cy - sa * 0.5 }
  const D2 = { x: mx + bw + sa, y: Dy }
  const E2 = { x: mx + bw + sa, y: Ey + sa }
  const F2 = { x: mx, y: Ey + sa }

  const emC1c = { x: C2.x + 2.5, y: C2.y + 5 }
  const emC2c = { x: D2.x, y: D2.y - 7 }

  const cutPath = [
    `M ${A2.x},${A2.y}`,
    `A ${nw + sa * 0.7},${nd + sa} 0 0 1 ${B2.x},${B2.y}`,
    `L ${C2.x},${C2.y}`,
    `C ${emC1c.x},${emC1c.y} ${emC2c.x},${emC2c.y} ${D2.x},${D2.y}`,
    `L ${E2.x},${E2.y}`,
    `L ${F2.x},${F2.y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + bw + sa + 3
  const totalH = my + ph + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    foldIndicator(mx, my - sa, my + ph + sa),
    grainArrow(mx + bw * 0.55, my + ph * 0.2, my + ph * 0.65),
    circle(Cx, Cy),
    circle(Dx, Dy),
    notch(Dx, Dy, "right"),
    dimension(mx, my + ph + sa + 1.2, mx + bw, `${(bw * 2).toFixed(1)} cm`),
    pieceLabel(mx + bw * 0.5, my + ph * 0.42, "DOS", "Couper 1× au pli", `${(bw * 2).toFixed(0)} × ${ph} cm`),
  ].join("\n")

  return {
    name: "Dos",
    svg: svgWrap(content, totalW, totalH),
    widthCm: bw * 2,
    heightCm: ph,
    cutCount: 1,
    onFold: true,
  }
}

// ─── Pièce 4 : Manche longue ─────────────────────────────────────────────────

function generateLongSleeve(m: SizeMeasurements, sa: number): PatternPiece {
  const slH    = longSleeveLength(m)
  const capW   = 18          // largeur tête de manche (idem t-shirt)
  const botW   = 13          // largeur bas de manche longue (avant poignet)
  const halfCap = capW / 2
  const halfBot = botW / 2
  const capH   = 7.5
  const mx = 2, my = 2
  const centerX = mx + halfCap

  const TL = { x: centerX - halfCap, y: my + capH }
  const TR = { x: centerX + halfCap, y: my + capH }
  const BL = { x: centerX - halfBot, y: my + slH }
  const BR = { x: centerX + halfBot, y: my + slH }
  const cTL = { x: centerX - halfCap * 0.6, y: my - 0.5 }
  const cTR = { x: centerX + halfCap * 0.6, y: my - 0.5 }

  // Coude : léger coude à mi-hauteur (côté coude légèrement courbé)
  const elbowY = my + slH * 0.5
  const elbowL = { x: centerX - halfBot - 0.8, y: elbowY }
  const elbowR = { x: centerX + halfBot + 0.5, y: elbowY }

  const sewPath = [
    `M ${centerX},${my}`,
    `C ${cTL.x},${cTL.y} ${TL.x},${TL.y - 1} ${TL.x},${TL.y}`,
    `Q ${elbowL.x},${elbowY} ${BL.x},${BL.y}`,
    `L ${BR.x},${BR.y}`,
    `Q ${elbowR.x},${elbowY} ${TR.x},${TR.y}`,
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
    `Q ${TLc.x},${elbowY} ${BLc.x},${BLc.y}`,
    `L ${BRc.x},${BRc.y}`,
    `Q ${TRc.x},${elbowY} ${TRc.x},${TRc.y}`,
    `C ${TRc.x},${TRc.y - 1} ${cTR.x},${my - sa - 0.5} ${centerX},${my - sa}`,
    `Z`,
  ].join(" ")

  // Cran coude
  const elbowCranX = centerX + halfBot + 0.5
  const totalW = mx + capW + sa + 2
  const totalH = my + slH + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    grainArrow(centerX, my + slH * 0.2, my + slH * 0.72),
    circle(centerX, my),
    circle(TL.x, TL.y),
    circle(TR.x, TR.y),
    notch(elbowCranX, elbowY, "right"),
    dimension(mx, my + slH + sa + 1.2, mx + capW, `${capW} cm`),
    pieceLabel(centerX, my + slH * 0.45, "MANCHE LONGUE", "Couper 2×", `${capW} × ${slH} cm`),
  ].join("\n")

  return {
    name: "Manche longue",
    svg: svgWrap(content, totalW, totalH),
    widthCm: capW,
    heightCm: slH,
    cutCount: 2,
    onFold: false,
  }
}

// ─── Pièce 5 : Col (2 pièces) ────────────────────────────────────────────────

function generateCollar(m: SizeMeasurements, sa: number): PatternPiece {
  const length = Math.round(m.poitrine * 0.36 + 2) // tour de col + boutonnage
  const height = 5    // hauteur col replié
  const mx = 2, my = 2
  const { svg, widthCm, heightCm } = rectPiece(mx, my, length, height, sa, "COL", "Couper 4× (2 tissu + 2 entoilage)", "H")
  return { name: "Col", svg, widthCm, heightCm, cutCount: 4, onFold: false }
}

function generateCollarStand(m: SizeMeasurements, sa: number): PatternPiece {
  const length = Math.round(m.poitrine * 0.36 + 2)
  const height = 3.5   // hauteur pied de col
  const mx = 2, my = 2
  const { svg, widthCm, heightCm } = rectPiece(mx, my, length, height, sa, "PIED DE COL", "Couper 4× (2 tissu + 2 entoilage)", "H")
  return { name: "Pied de col", svg, widthCm, heightCm, cutCount: 4, onFold: false }
}

// ─── Pièce 6 : Poignet ────────────────────────────────────────────────────────

function generateCuff(m: SizeMeasurements, sa: number): PatternPiece {
  const length = Math.round(m.poitrine * 0.21 + 3)  // tour de poignet ~24cm
  const height = 6
  const mx = 2, my = 2
  const { svg, widthCm, heightCm } = rectPiece(mx, my, length, height, sa, "POIGNET", "Couper 4× (2 tissu + 2 entoilage)", "H")
  return { name: "Poignet", svg, widthCm, heightCm, cutCount: 4, onFold: false }
}

// ─── Croquis à plat ──────────────────────────────────────────────────────────

function generateFlatSketch(): string {
  const W = 45, H = 65, cx = W / 2

  const body = [
    `M ${cx - 8},5`, `L ${cx - 18},8`, `L ${cx - 18},28`, `L ${cx - 8},26`,
    `L ${cx - 9},56`, `L ${cx + 9},56`, `L ${cx + 8},26`,
    `L ${cx + 18},28`, `L ${cx + 18},8`, `L ${cx + 8},5`, `Z`,
  ].join(" ")

  const collar = `M ${cx - 4},5 L ${cx},9 L ${cx + 4},5`
  const buttons = Array.from({ length: 5 }, (_, i) =>
    `<circle cx="${cx}" cy="${12 + i * 7}" r="0.6" fill="#7c3aed"/>`
  ).join("\n")
  const pocketLine = `M ${cx - 8},15 L ${cx - 5},15 L ${cx - 5},20 L ${cx - 8},20`

  const content = [
    `<rect width="${W}" height="${H}" fill="white"/>`,
    `<path d="${body}" fill="#ede9fe" fill-opacity="0.6" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${collar}" fill="none" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<line x1="${cx}" y1="5" x2="${cx}" y2="56" stroke="#7c3aed" stroke-width="0.3"/>`,
    buttons,
    `<path d="${pocketLine}" fill="none" stroke="#9ca3af" stroke-width="0.3"/>`,
    `<text x="${cx}" y="${H - 3}" font-size="2" text-anchor="middle" fill="#7c3aed" font-family="Arial" font-weight="bold">Chemise boutonnée</text>`,
  ].join("\n")

  return svgWrap(content, W, H)
}

// ─── Guide de couture ─────────────────────────────────────────────────────────

function generateSewingGuide(): SewingStep[] {
  return [
    {
      step: 1,
      title: "Entoilage",
      instruction: "Colle l'entoilage sur 2 pièces de col, 2 pièces de pied de col et 2 pièces de poignet (l'envers des pièces visibles).",
      tip: "Utilise un entoilage thermocollant léger. Repasse 10 secondes sans glisser le fer.",
    },
    {
      step: 2,
      title: "Couper et préparer",
      instruction: "Coupe toutes les pièces. Surfile toutes les marges de couture avant l'assemblage pour éviter l'effilochage.",
    },
    {
      step: 3,
      title: "Assembler les épaules",
      instruction: "Couds les coutures d'épaules Devant droit/gauche + Dos, endroit contre endroit, à 1 cm. Surfile et repasse vers le dos.",
    },
    {
      step: 4,
      title: "Monter le col",
      instruction: "Assemble les 2 pièces de col endroit contre endroit (couds le bord supérieur et les côtés). Retourne, repasse. Assemble le pied de col de même. Monte l'ensemble sur l'encolure.",
      tip: "Pour un col bien à plat : crante les coins avant de retourner.",
    },
    {
      step: 5,
      title: "Monter les manches",
      instruction: "Aligne le cran tête de manche sur la couture d'épaule. Couds à 1 cm. Surfile. Attention : le cran de coude doit être orienté vers l'arrière.",
    },
    {
      step: 6,
      title: "Fermer côtés et manches",
      instruction: "Endroit contre endroit, couds en une passe continue de l'extrémité de manche jusqu'au bas de la chemise.",
    },
    {
      step: 7,
      title: "Poser les poignets",
      instruction: "Fais des plis ou des pinces en bas de chaque manche pour ajuster à la largeur du poignet. Pose le poignet endroit contre endroit, couds, retourne et surpique à 2 mm du bord.",
    },
    {
      step: 8,
      title: "Boutonnières et boutons",
      instruction: "Fais les boutonnières au devant gauche (côté boutonnières). Pose les boutons sur le devant droit face aux marques bleues.",
    },
    {
      step: 9,
      title: "Ourlet bas",
      instruction: "Ourlet de 1 cm replié 2 fois. Couds à la machine ou à la main.",
    },
  ]
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function generatePattern(
  measurements: SizeMeasurements,
  seamAllowance = 1
): PatternResult {
  const sa = seamAllowance
  const ph = shirtLength(measurements)
  const slH = longSleeveLength(measurements)
  const bw = measurements.poitrine / 4 + 2

  const pieces = [
    generateShirtFront(measurements, sa, "right"),
    generateShirtFront(measurements, sa, "left"),
    generateShirtBack(measurements, sa),
    generateLongSleeve(measurements, sa),
    generateCollar(measurements, sa),
    generateCollarStand(measurements, sa),
    generateCuff(measurements, sa),
  ]

  const fabricNeededCm = Math.ceil(ph + slH + 30)

  return {
    pieces,
    flatSketch: generateFlatSketch(),
    sewingGuide: generateSewingGuide(),
    estimatedTimeMinutes: 360,
    difficulty: 4,
    fabricNeededCm,
  }
}
