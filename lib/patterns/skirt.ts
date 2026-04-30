// Moteur de patronage — Jupe A-line femme
// Toutes les dimensions en cm. 1 unité SVG = 1 cm.
// Pièces : Devant (pli), Dos (pli), Ceinture

import type { SizeMeasurements, PatternPiece, PatternResult, SewingStep } from "../types/pattern"
import {
  circle, notch, grainArrow, dimension, svgWrap,
  foldIndicator, pieceLabel, rectPiece,
} from "./helpers"

function skirtLength(m: SizeMeasurements): number {
  return Math.round(m.longueurDos * 0.88) // ~53 cm en taille M (mi-cuisse)
}

// ─── Pièce 1 : Devant ────────────────────────────────────────────────────────

function generateSkirtFront(m: SizeMeasurements, sa: number): PatternPiece {
  const ph  = skirtLength(m)
  const tw  = m.taille / 4 + 1     // demi-taille finie
  const bw  = m.hanches / 4 + 2    // demi-bas finie (légère évasure A-line)
  const hipY = Math.round(ph * 0.38) // profondeur hanche (≈20 cm)
  const hw  = m.hanches / 4 + 1.5  // demi-hanche finie
  const mx = 2, my = 2

  // Sew points (taille finie)
  // A : centre pli, bas de la courbure taille (bosse ventre devant → 1.2 cm)
  const Ax = mx,        Ay = my + 1.2
  // B : côté couture, haut taille
  const Bx = mx + tw,   By = my
  // C : côté hanche
  const Cx = mx + hw,   Cy = my + hipY
  // D : bas côté
  const Dx = mx + bw,   Dy = my + ph
  // E : bas pli
  const Ex = mx,        Ey = my + ph

  // Bezier contrôles côté (taille → hanche → bas)
  const sC1x = mx + hw * 0.5, sC1y = my + hipY * 0.3  // taille→hanche ctrl1
  const sC2x = mx + hw,       sC2y = my + hipY * 0.6  // taille→hanche ctrl2
  const sC3x = mx + bw,       sC3y = my + ph * 0.65   // hanche→bas ctrl

  // Sew path
  const sewPath = [
    `M ${Ax},${Ay}`,
    `Q ${mx + tw * 0.45},${my - 0.8} ${Bx},${By}`,
    `C ${sC1x},${sC1y} ${sC2x},${sC2y} ${Cx},${Cy}`,
    `Q ${sC3x},${sC3y} ${Dx},${Dy}`,
    `L ${Ex},${Ey}`,
    `Q ${mx},${my + ph * 0.55} ${Ax},${Ay}`,
  ].join(" ")

  // Cut points (+sa)
  const A2x = mx,             A2y = Ay - sa
  const B2x = mx + tw + sa,  B2y = By - sa
  const C2x = mx + hw + sa,  C2y = Cy
  const D2x = mx + bw + sa,  D2y = Dy + sa
  const E2x = mx,             E2y = Dy + sa

  const cutPath = [
    `M ${A2x},${A2y}`,
    `Q ${mx + tw * 0.45},${my - sa - 1} ${B2x},${B2y}`,
    `C ${sC1x + sa},${sC1y} ${sC2x + sa},${sC2y} ${C2x},${C2y}`,
    `Q ${sC3x + sa},${sC3y} ${D2x},${D2y}`,
    `L ${E2x},${E2y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + bw + sa + 3
  const totalH = my + ph + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    foldIndicator(mx, my - sa, my + ph + sa),
    grainArrow(mx + bw * 0.55, my + ph * 0.22, my + ph * 0.72),
    circle(Bx, By),
    circle(Cx, Cy),
    notch(Cx, Cy, "right"),
    dimension(mx, my + ph + sa + 1.2, mx + bw, `${(bw * 2).toFixed(1)} cm`),
    pieceLabel(mx + bw * 0.45, my + ph * 0.45, "JUPE DEVANT", "Couper 1× au pli", `${(tw * 2).toFixed(0)}→${(bw * 2).toFixed(0)} × ${ph} cm`),
  ].join("\n")

  return {
    name: "Jupe Devant",
    svg: svgWrap(content, totalW, totalH),
    widthCm: bw * 2,
    heightCm: ph,
    cutCount: 1,
    onFold: true,
  }
}

// ─── Pièce 2 : Dos ───────────────────────────────────────────────────────────

function generateSkirtBack(m: SizeMeasurements, sa: number): PatternPiece {
  const ph  = skirtLength(m)
  const tw  = m.taille / 4 + 1.5   // dos légèrement plus large à la taille
  const bw  = m.hanches / 4 + 2.5  // plus de volume aux hanches dos
  const hipY = Math.round(ph * 0.38)
  const hw  = m.hanches / 4 + 2
  const mx = 2, my = 2

  // Dos : courbure taille plus plate (0.5 cm) vs devant (1.2 cm)
  const Ax = mx,       Ay = my + 0.5
  const Bx = mx + tw,  By = my
  const Cx = mx + hw,  Cy = my + hipY
  const Dx = mx + bw,  Dy = my + ph
  const Ex = mx,       Ey = my + ph

  const sC1x = mx + hw * 0.5, sC1y = my + hipY * 0.3
  const sC2x = mx + hw,       sC2y = my + hipY * 0.6
  const sC3x = mx + bw,       sC3y = my + ph * 0.65

  const sewPath = [
    `M ${Ax},${Ay}`,
    `Q ${mx + tw * 0.5},${my - 0.5} ${Bx},${By}`,
    `C ${sC1x},${sC1y} ${sC2x},${sC2y} ${Cx},${Cy}`,
    `Q ${sC3x},${sC3y} ${Dx},${Dy}`,
    `L ${Ex},${Ey}`,
    `Q ${mx},${my + ph * 0.55} ${Ax},${Ay}`,
  ].join(" ")

  const A2x = mx,             A2y = Ay - sa
  const B2x = mx + tw + sa,  B2y = By - sa
  const C2x = mx + hw + sa,  C2y = Cy
  const D2x = mx + bw + sa,  D2y = Dy + sa
  const E2x = mx,             E2y = Dy + sa

  const cutPath = [
    `M ${A2x},${A2y}`,
    `Q ${mx + tw * 0.5},${my - sa - 0.8} ${B2x},${B2y}`,
    `C ${sC1x + sa},${sC1y} ${sC2x + sa},${sC2y} ${C2x},${C2y}`,
    `Q ${sC3x + sa},${sC3y} ${D2x},${D2y}`,
    `L ${E2x},${E2y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + bw + sa + 3
  const totalH = my + ph + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    foldIndicator(mx, my - sa, my + ph + sa),
    grainArrow(mx + bw * 0.55, my + ph * 0.22, my + ph * 0.72),
    circle(Bx, By),
    circle(Cx, Cy),
    notch(Cx, Cy, "right"),
    dimension(mx, my + ph + sa + 1.2, mx + bw, `${(bw * 2).toFixed(1)} cm`),
    pieceLabel(mx + bw * 0.45, my + ph * 0.45, "JUPE DOS", "Couper 1× au pli", `${(tw * 2).toFixed(0)}→${(bw * 2).toFixed(0)} × ${ph} cm`),
  ].join("\n")

  return {
    name: "Jupe Dos",
    svg: svgWrap(content, totalW, totalH),
    widthCm: bw * 2,
    heightCm: ph,
    cutCount: 1,
    onFold: true,
  }
}

// ─── Pièce 3 : Ceinture ──────────────────────────────────────────────────────

function generateWaistband(m: SizeMeasurements, sa: number): PatternPiece {
  const length = Math.round(m.taille / 2 + 3) // demi-ceinture + underlap
  const width  = 4
  const mx = 2, my = 2
  const { svg, widthCm, heightCm } = rectPiece(mx, my, length, width, sa, "CEINTURE", "Couper 2× (dos à dos)", "H")
  return { name: "Ceinture", svg, widthCm, heightCm, cutCount: 2, onFold: false }
}

// ─── Croquis à plat ──────────────────────────────────────────────────────────

function generateFlatSketch(): string {
  const W = 35, H = 50, cx = W / 2
  const waistW = 7, hemW = 13, hipY = 18, hemY = 44

  const frontL = `M ${cx - waistW},4 Q ${cx - waistW - 1},${hipY} ${cx - hemW},${hemY} L ${cx},${hemY}`
  const frontR = `M ${cx + waistW},4 Q ${cx + waistW + 1},${hipY} ${cx + hemW},${hemY} L ${cx},${hemY}`
  const waist  = `M ${cx - waistW},4 Q ${cx},2 ${cx + waistW},4`
  const hem    = `M ${cx - hemW},${hemY} L ${cx + hemW},${hemY}`

  const content = [
    `<rect width="${W}" height="${H}" fill="white"/>`,
    `<path d="${frontL}" fill="none" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${frontR}" fill="none" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${waist}" fill="#ede9fe" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${hem}" fill="none" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="M ${cx - waistW},4 Q ${cx},2 ${cx + waistW},4 Q ${cx + waistW + 1},${hipY} ${cx + hemW},${hemY} L ${cx - hemW},${hemY} Q ${cx - waistW - 1},${hipY} ${cx - waistW},4 Z" fill="#ede9fe" fill-opacity="0.5" stroke="none"/>`,
    `<text x="${cx}" y="${H - 3}" font-size="2" text-anchor="middle" fill="#7c3aed" font-family="Arial" font-weight="bold">Jupe A-line</text>`,
  ].join("\n")

  return svgWrap(content, W, H)
}

// ─── Guide de couture ─────────────────────────────────────────────────────────

function generateSewingGuide(): SewingStep[] {
  return [
    {
      step: 1,
      title: "Préparer le tissu",
      instruction: "Lave et repasse ton tissu. Plie-le en deux endroit contre endroit, lisières alignées.",
      tip: "Pour une jupe A-line, un tissu mi-lourd (popeline, crêpe) donne le meilleur tombé.",
    },
    {
      step: 2,
      title: "Tracer et couper",
      instruction: "Place le Devant et le Dos sur le pli du tissu (bord 'PLIURE' sur le pli). Épingle et coupe en suivant le trait de coupe extérieur.",
    },
    {
      step: 3,
      title: "Coudre les coutures de côté",
      instruction: "Endroit contre endroit, assembler le côté droit du devant avec le côté droit du dos. Coudre à 1 cm. Surfile et repasse vers le dos. Répéter pour le côté gauche.",
      tip: "Laisse une ouverture de 20 cm en haut du côté gauche pour poser la fermeture éclair.",
    },
    {
      step: 4,
      title: "Poser la fermeture éclair",
      instruction: "Pose une fermeture éclair invisible ou à glissière dans l'ouverture laissée au côté gauche. Utilise un pied spécial fermeture éclair pour un résultat net.",
    },
    {
      step: 5,
      title: "Assembler la ceinture",
      instruction: "Plie la ceinture en deux dans la longueur, endroit contre endroit. Couds les extrémités. Retourne et repasse. Assemble-la à la taille de la jupe, endroit contre endroit, en faisant correspondre les milieux et les côtés.",
      tip: "Tu peux glisser un élastique souple dans la ceinture avant de la fermer pour plus de confort.",
    },
    {
      step: 6,
      title: "Ourlet",
      instruction: "Fais un ourlet de 2 cm au bas de la jupe. Replie 1 cm, puis 1 cm encore. Couds à la machine près du bord replié.",
      tip: "Pour un ourlet invisible, utilise un point invisible à la machine ou couds à la main avec un point de chausson.",
    },
    {
      step: 7,
      title: "Repassage final",
      instruction: "Repasse toutes les coutures à la vapeur. La ceinture et les coutures de côté se repassent bien étalées.",
    },
  ]
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function generatePattern(
  measurements: SizeMeasurements,
  seamAllowance = 1
): PatternResult {
  const sa = seamAllowance
  const ph = skirtLength(measurements)

  const pieces = [
    generateSkirtFront(measurements, sa),
    generateSkirtBack(measurements, sa),
    generateWaistband(measurements, sa),
  ]

  const fabricNeededCm = Math.ceil(ph * 2 + 20)

  return {
    pieces,
    flatSketch: generateFlatSketch(),
    sewingGuide: generateSewingGuide(),
    estimatedTimeMinutes: 120,
    difficulty: 2,
    fabricNeededCm,
  }
}
