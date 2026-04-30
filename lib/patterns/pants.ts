// Moteur de patronage — Pantalon droit femme
// Toutes les dimensions en cm. 1 unité SVG = 1 cm.
// Pièces : Devant ×2, Dos ×2, Ceinture

import type { SizeMeasurements, PatternPiece, PatternResult, SewingStep } from "../types/pattern"
import {
  circle, notch, grainArrow, dimension, dimensionV, svgWrap,
  pieceLabel, rectPiece,
} from "./helpers"

// Hauteur de fourche (taille → entrejambe) ≈ longueurDos × 0.46
function riseHeight(m: SizeMeasurements): number {
  return Math.round(m.longueurDos * 0.46)
}

// Entrejambe (longueur intérieure jambe) ≈ longueurDos × 1.63
function inseamLength(m: SizeMeasurements): number {
  return Math.round(m.longueurDos * 1.63)
}

// ─── Pièce 1 : Devant pantalon ───────────────────────────────────────────────

function generatePantsFront(m: SizeMeasurements, sa: number): PatternPiece {
  const rise   = riseHeight(m)
  const inseam = inseamLength(m)
  const total  = rise + inseam

  const tw  = m.taille / 4 + 0.5      // demi-taille devant
  const hw  = m.hanches / 4 + 0.5     // demi-hanche devant (à la fourche)
  const crotchExt = Math.round(m.hanches * 0.06)  // extension fourche devant (~5.4 cm M)
  const legW_top  = hw + crotchExt    // largeur à l'entrejambe
  const legW_bot  = 10.5              // demi-largeur bas de jambe (21 cm ouverture)

  const mx = 2, my = 2

  // Points de couture (demi-pièce — pièce entière, pas au pli)
  // Coordonnées : x = largeur (centre pantalon à gauche), y = hauteur descendante

  // Taille
  const A = { x: mx,      y: my }           // centre taille (ourlet/braguette)
  const B = { x: mx + tw, y: my }           // côté taille

  // Hanche (au niveau de la fourche) — le côté suit la courbe de la hanche
  const C = { x: mx + hw, y: my + rise }   // côté au niveau fourche

  // Fourche devant (crotch point) — l'extension horizontale
  const D = { x: mx - crotchExt, y: my + rise } // extrémité fourche

  // Courbe de fourche : de A vers D avec une courbe concave
  const crotchCtrl = { x: mx - crotchExt * 0.3, y: my + rise * 0.6 }

  // Bas jambe
  const E = { x: mx - crotchExt - legW_bot + legW_top - legW_bot, y: my + total }  // bas intérieur
  const F = { x: mx + legW_bot, y: my + total }                                       // bas extérieur

  // Simplification : bas jambe centré entre côté et fourche
  const legCenterX = (mx + hw - mx + crotchExt) / 2 + mx - crotchExt
  const Esimp = { x: legCenterX - legW_bot, y: my + total }
  const Fsimp = { x: mx + legW_bot, y: my + total }

  // Pour un pantalon droit, le côté extérieur descend quasi droit de B→C→F
  // Le côté intérieur va de D vers Esimp
  // La jambe s'affine légèrement du haut vers le bas

  const sewPath = [
    `M ${A.x},${A.y}`,
    // Taille : légère courbure (bosse basse ventre ~1cm)
    `Q ${mx + tw * 0.5},${my + 1} ${B.x},${B.y}`,
    // Côté extérieur droit → bas
    `L ${C.x},${C.y}`,
    `L ${Fsimp.x},${Fsimp.y}`,
    // Bas de jambe
    `L ${Esimp.x},${Esimp.y}`,
    // Côté intérieur remonte vers la fourche
    `L ${D.x},${D.y}`,
    // Courbe de fourche vers le centre
    `C ${crotchCtrl.x},${crotchCtrl.y} ${mx - crotchExt * 0.5},${my + rise * 0.3} ${A.x},${A.y}`,
    `Z`,
  ].join(" ")

  // Cut (+sa)
  const A2 = { x: A.x, y: A.y - sa }
  const B2 = { x: B.x + sa, y: B.y - sa }
  const C2 = { x: C.x + sa, y: C.y }
  const D2 = { x: D.x - sa, y: D.y }
  const E2 = { x: Esimp.x - sa, y: Esimp.y + sa }
  const F2 = { x: Fsimp.x + sa, y: Fsimp.y + sa }

  const cutPath = [
    `M ${A2.x},${A2.y}`,
    `Q ${mx + tw * 0.5},${my + 1 - sa} ${B2.x},${B2.y}`,
    `L ${C2.x},${C2.y}`,
    `L ${F2.x},${F2.y}`,
    `L ${E2.x},${E2.y}`,
    `L ${D2.x},${D2.y}`,
    `C ${crotchCtrl.x - sa},${crotchCtrl.y} ${mx - crotchExt * 0.5},${my + rise * 0.3} ${A2.x},${A2.y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + hw + sa + 3
  const totalH = my + total + sa + 3

  // Ligne d'équerre (niveau hanches à ~rise/2)
  const hipLineY = my + Math.round(rise * 0.55)
  const hipLine  = `<line x1="${mx - crotchExt - sa - 0.5}" y1="${hipLineY}" x2="${mx + hw + sa + 0.5}" y2="${hipLineY}" stroke="#9ca3af" stroke-width="0.08" stroke-dasharray="0.3,0.3"/>`

  const pliX = mx + (hw - crotchExt) / 2  // ligne de pli (droit-fil de la jambe)

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    hipLine,
    grainArrow(pliX, my + rise + inseam * 0.15, my + rise + inseam * 0.7),
    circle(B.x, B.y),
    circle(C.x, C.y),
    circle(D.x, D.y),
    notch(C.x, C.y, "right"),
    dimension(mx - crotchExt, my + total + sa + 1.2, mx + hw, `${(hw + crotchExt).toFixed(1)} cm`),
    dimensionV(mx + hw + sa + 1.5, my, my + rise, `Fourche ${rise} cm`),
    pieceLabel(pliX, my + rise + inseam * 0.42, "PANTALON DEVANT", "Couper 2×", `${tw.toFixed(0)} cm taille`),
  ].join("\n")

  return {
    name: "Pantalon Devant",
    svg: svgWrap(content, totalW, totalH),
    widthCm: hw + crotchExt,
    heightCm: total,
    cutCount: 2,
    onFold: false,
  }
}

// ─── Pièce 2 : Dos pantalon ───────────────────────────────────────────────────

function generatePantsBack(m: SizeMeasurements, sa: number): PatternPiece {
  const rise   = riseHeight(m)
  const inseam = inseamLength(m)
  const total  = rise + inseam

  const tw  = m.taille / 4 + 1      // dos plus large à la taille
  const hw  = m.hanches / 4 + 1.5   // dos plus large aux hanches
  const crotchExt = Math.round(m.hanches * 0.11)  // extension fourche dos (~10 cm M)
  const legW_bot  = 11

  const mx = 2, my = 2

  // Le dos a la taille légèrement basculée : le centre dos monte de ~2cm
  const backRise = rise - 2  // le dos commence plus bas (inclinaison taille)

  const A = { x: mx,      y: my + 2 }        // centre dos taille (inclinaison)
  const B = { x: mx + tw, y: my }            // côté taille dos
  const C = { x: mx + hw, y: my + rise }    // côté hanche au niveau fourche
  const D = { x: mx - crotchExt, y: my + rise } // fourche dos (plus ample)

  // Courbe de fourche dos : plus longue et courbée que le devant
  const crotchCtrl1 = { x: mx - crotchExt * 0.6, y: my + rise * 0.65 }
  const crotchCtrl2 = { x: mx - crotchExt * 0.1, y: my + rise * 0.25 }

  const legCenterX = (mx + hw - mx + crotchExt) / 2 + mx - crotchExt
  const Esimp = { x: legCenterX - legW_bot, y: my + total }
  const Fsimp = { x: mx + legW_bot + 0.5, y: my + total }

  const sewPath = [
    `M ${A.x},${A.y}`,
    `Q ${mx + tw * 0.5},${my - 0.5} ${B.x},${B.y}`,
    `L ${C.x},${C.y}`,
    `L ${Fsimp.x},${Fsimp.y}`,
    `L ${Esimp.x},${Esimp.y}`,
    `L ${D.x},${D.y}`,
    `C ${crotchCtrl1.x},${crotchCtrl1.y} ${crotchCtrl2.x},${crotchCtrl2.y} ${A.x},${A.y}`,
    `Z`,
  ].join(" ")

  const A2 = { x: A.x, y: A.y - sa }
  const B2 = { x: B.x + sa, y: B.y - sa }
  const C2 = { x: C.x + sa, y: C.y }
  const D2 = { x: D.x - sa, y: D.y }
  const E2 = { x: Esimp.x - sa, y: Esimp.y + sa }
  const F2 = { x: Fsimp.x + sa, y: Fsimp.y + sa }

  const cutPath = [
    `M ${A2.x},${A2.y}`,
    `Q ${mx + tw * 0.5},${my - sa - 0.5} ${B2.x},${B2.y}`,
    `L ${C2.x},${C2.y}`,
    `L ${F2.x},${F2.y}`,
    `L ${E2.x},${E2.y}`,
    `L ${D2.x},${D2.y}`,
    `C ${crotchCtrl1.x - sa},${crotchCtrl1.y} ${crotchCtrl2.x},${crotchCtrl2.y} ${A2.x},${A2.y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + hw + sa + 3
  const totalH = my + total + sa + 3

  const hipLineY = my + Math.round(rise * 0.55)
  const hipLine  = `<line x1="${mx - crotchExt - sa - 0.5}" y1="${hipLineY}" x2="${mx + hw + sa + 0.5}" y2="${hipLineY}" stroke="#9ca3af" stroke-width="0.08" stroke-dasharray="0.3,0.3"/>`

  const pliX = mx + (hw - crotchExt) / 2

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    hipLine,
    grainArrow(pliX, my + rise + inseam * 0.15, my + rise + inseam * 0.7),
    circle(B.x, B.y),
    circle(C.x, C.y),
    circle(D.x, D.y),
    notch(C.x, C.y, "right"),
    dimension(mx - crotchExt, my + total + sa + 1.2, mx + hw, `${(hw + crotchExt).toFixed(1)} cm`),
    dimensionV(mx + hw + sa + 1.5, my, my + rise, `Fourche ${rise} cm`),
    pieceLabel(pliX, my + rise + inseam * 0.42, "PANTALON DOS", "Couper 2×", `${tw.toFixed(0)} cm taille`),
  ].join("\n")

  return {
    name: "Pantalon Dos",
    svg: svgWrap(content, totalW, totalH),
    widthCm: hw + crotchExt,
    heightCm: total,
    cutCount: 2,
    onFold: false,
  }
}

// ─── Pièce 3 : Ceinture ──────────────────────────────────────────────────────

function generateWaistband(m: SizeMeasurements, sa: number): PatternPiece {
  const length = Math.round(m.taille / 2 + 3)
  const width  = 4
  const mx = 2, my = 2
  const { svg, widthCm, heightCm } = rectPiece(mx, my, length, width, sa, "CEINTURE", "Couper 2× (dos à dos) + 1× entoilage", "H")
  return { name: "Ceinture", svg, widthCm, heightCm, cutCount: 2, onFold: false }
}

// ─── Croquis à plat ──────────────────────────────────────────────────────────

function generateFlatSketch(): string {
  const W = 40, H = 70, cx = W / 2

  const leftLeg = [
    `M ${cx - 10},4 L ${cx - 12},35 L ${cx - 11},65 L ${cx - 5},65 L ${cx - 3},35 L ${cx},4`,
  ].join(" ")

  const rightLeg = [
    `M ${cx},4 L ${cx + 3},35 L ${cx + 5},65 L ${cx + 11},65 L ${cx + 12},35 L ${cx + 10},4`,
  ].join(" ")

  const waistband = `M ${cx - 10},4 Q ${cx},2 ${cx + 10},4 L ${cx + 10},7 Q ${cx},5 ${cx - 10},7 Z`

  const content = [
    `<rect width="${W}" height="${H}" fill="white"/>`,
    `<path d="${leftLeg}" fill="#ede9fe" fill-opacity="0.6" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${rightLeg}" fill="#ede9fe" fill-opacity="0.6" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${waistband}" fill="#7c3aed" fill-opacity="0.4" stroke="#7c3aed" stroke-width="0.4"/>`,
    `<line x1="${cx}" y1="4" x2="${cx}" y2="35" stroke="#9ca3af" stroke-width="0.3" stroke-dasharray="0.8,0.4"/>`,
    `<text x="${cx}" y="${H - 3}" font-size="2" text-anchor="middle" fill="#7c3aed" font-family="Arial" font-weight="bold">Pantalon droit</text>`,
  ].join("\n")

  return svgWrap(content, W, H)
}

// ─── Guide de couture ─────────────────────────────────────────────────────────

function generateSewingGuide(): SewingStep[] {
  return [
    {
      step: 1,
      title: "Préparer le tissu",
      instruction: "Lave, sèche et repasse ton tissu. Trace les pièces et coupe. Surfile toutes les marges de couture.",
      tip: "Pour un pantalon, un tissu structuré est recommandé (gabardine, sergé de coton, denim léger).",
    },
    {
      step: 2,
      title: "Coudre les coutures de côté",
      instruction: "Assembler le devant et le dos de chaque jambe sur le côté extérieur (de la taille jusqu'au bas), endroit contre endroit à 1 cm. Repasse les marges ouvertes.",
    },
    {
      step: 3,
      title: "Coudre les coutures d'entrejambe",
      instruction: "Couds la couture intérieure de chaque jambe (de la fourche jusqu'au bas), endroit contre endroit. Surfile et repasse.",
    },
    {
      step: 4,
      title: "Assembler la fourche",
      instruction: "Retourne une jambe à l'endroit et glisse-la dans l'autre jambe (endroit contre endroit). Assemble la courbe de fourche en une seule couture continue du devant vers le dos. Couds cette courbe deux fois (renforcé). Surfile.",
      tip: "La courbe de fourche est la couture la plus technique. Utilise des épingles tous les 2 cm et couds lentement.",
    },
    {
      step: 5,
      title: "Poser la fermeture et la ceinture",
      instruction: "Pose une fermeture éclair au devant (braguette). Assemble la ceinture : endroit contre endroit, couds les extrémités, retourne. Monte la ceinture à la taille, couds et surpique à 2 mm.",
    },
    {
      step: 6,
      title: "Ourlet bas",
      instruction: "Ourlet de 3 cm au bas de chaque jambe. Replie 1.5 cm puis 1.5 cm encore, épingle et couds.",
      tip: "Essaie le pantalon avant l'ourlet pour ajuster la longueur exacte.",
    },
    {
      step: 7,
      title: "Finitions",
      instruction: "Repassez toutes les coutures à la vapeur avec un coussin de tailleur pour les courbes. Pose un bouton ou agrafe à la ceinture.",
    },
  ]
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function generatePattern(
  measurements: SizeMeasurements,
  seamAllowance = 1
): PatternResult {
  const sa = seamAllowance
  const rise   = riseHeight(measurements)
  const inseam = inseamLength(measurements)
  const total  = rise + inseam

  const pieces = [
    generatePantsFront(measurements, sa),
    generatePantsBack(measurements, sa),
    generateWaistband(measurements, sa),
  ]

  const fabricNeededCm = Math.ceil(total * 2 + 30)

  return {
    pieces,
    flatSketch: generateFlatSketch(),
    sewingGuide: generateSewingGuide(),
    estimatedTimeMinutes: 300,
    difficulty: 4,
    fabricNeededCm,
  }
}
