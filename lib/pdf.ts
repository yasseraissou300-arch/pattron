// Génération PDF avec pdf-lib
// Format A4 : tuilage 1:1 avec repères d'assemblage
// Format A0 : page unique grande
// Format projecteur : pages individuelles à l'échelle 1:1

import { PDFDocument, rgb, StandardFonts, type PDFPage } from "pdf-lib"
import type { PatternPiece, SizeMeasurements } from "./types/pattern"

// Conversion : 1 cm = 28.3465 points PDF
const CM = 28.3465

// Dimensions A4 en points
const A4_W = 595.28
const A4_H = 841.89

// Marges et zone utile
const MARGIN = 20
const USABLE_W = A4_W - MARGIN * 2  // ~555pt ≈ 19.6 cm
const USABLE_H = A4_H - MARGIN * 2  // ~802pt ≈ 28.3 cm

// ─── Dessin d'une pièce sur une page PDF ────────────────────────────────────

function drawPieceOnPage(
  page: PDFPage,
  piece: PatternPiece,
  measurements: SizeMeasurements,
  offsetX: number,
  offsetY: number,
  scale: number,
  font: ReturnType<PDFDocument["embedStandardFont"]> extends Promise<infer R> ? R : never
): void {
  // Les pièces sont définies par leurs dimensions en cm
  // On les dessine sous forme rectangulaire avec les cotes pour le MVP PDF
  const w = piece.widthCm * CM * scale
  const h = piece.heightCm * CM * scale

  // Contour de la pièce (simplifié rectangulaire pour le PDF)
  page.drawRectangle({
    x: offsetX,
    y: offsetY,
    width: w,
    height: h,
    borderColor: rgb(0.1, 0.1, 0.1),
    borderWidth: 1,
    color: rgb(0.97, 0.95, 1),
  })

  // Ligne de couture (1 cm intérieur)
  const sa = 1 * CM * scale
  page.drawRectangle({
    x: offsetX + sa,
    y: offsetY + sa,
    width: w - sa * 2,
    height: h - sa * 2,
    borderColor: rgb(0.86, 0.15, 0.15),
    borderWidth: 0.75,
    borderDashArray: [3, 2],
    color: undefined,
  })

  // Flèche droit-fil (vertical, centre de la pièce)
  const glX = offsetX + w / 2
  const gl1Y = offsetY + h * 0.3
  const gl2Y = offsetY + h * 0.7
  page.drawLine({
    start: { x: glX, y: gl1Y },
    end: { x: glX, y: gl2Y },
    color: rgb(0.1, 0.1, 0.1),
    thickness: 0.8,
  })

  // Étiquette de pièce
  const labelY = offsetY + h / 2 + 8
  page.drawText(piece.name.toUpperCase(), {
    x: offsetX + w / 2 - piece.name.length * 3,
    y: labelY,
    size: 10,
    color: rgb(0.1, 0.1, 0.1),
  })
  page.drawText(`Couper ${piece.cutCount}× ${piece.onFold ? "au pli" : ""}`, {
    x: offsetX + w / 2 - 25,
    y: labelY - 14,
    size: 7,
    color: rgb(0.42, 0.45, 0.5),
  })
  page.drawText(`${piece.widthCm.toFixed(1)} × ${piece.heightCm} cm`, {
    x: offsetX + w / 2 - 20,
    y: labelY - 24,
    size: 6.5,
    color: rgb(0.6, 0.6, 0.6),
  })
}

// ─── Génération PDF A4 ───────────────────────────────────────────────────────

export async function generatePdfA4(
  pieces: PatternPiece[],
  measurements: SizeMeasurements,
  sizeName: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // ── Page de couverture ──
  const cover = pdfDoc.addPage([A4_W, A4_H])

  cover.drawRectangle({
    x: 0,
    y: A4_H - 120,
    width: A4_W,
    height: 120,
    color: rgb(0.49, 0.23, 0.93),
  })

  cover.drawText("PatronAI", {
    x: MARGIN,
    y: A4_H - 45,
    size: 28,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  cover.drawText("Patron de couture — T-shirt femme manches courtes", {
    x: MARGIN,
    y: A4_H - 72,
    size: 12,
    font,
    color: rgb(0.9, 0.85, 1),
  })
  cover.drawText(`Taille ${sizeName} · Marge de couture 1 cm incluse`, {
    x: MARGIN,
    y: A4_H - 90,
    size: 10,
    font,
    color: rgb(0.8, 0.75, 0.95),
  })

  // Mesures sur la page de couverture
  cover.drawText("Mesures utilisées :", {
    x: MARGIN,
    y: A4_H - 150,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  })

  const mesuresList = [
    `Poitrine : ${measurements.poitrine} cm`,
    `Taille : ${measurements.taille} cm`,
    `Hanches : ${measurements.hanches} cm`,
    `Épaule : ${measurements.epaule} cm`,
    `Longueur manche : ${measurements.longueurManche} cm`,
    `Longueur dos : ${measurements.longueurDos} cm`,
  ]
  mesuresList.forEach((line, i) => {
    cover.drawText(line, {
      x: MARGIN + 10,
      y: A4_H - 172 - i * 16,
      size: 10,
      font,
      color: rgb(0.2, 0.2, 0.2),
    })
  })

  // Liste des pièces
  cover.drawText("Pièces du patron :", {
    x: MARGIN,
    y: A4_H - 282,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  })
  pieces.forEach((piece, i) => {
    cover.drawText(
      `${i + 1}. ${piece.name} — couper ${piece.cutCount}×${piece.onFold ? " au pli" : ""} (${piece.widthCm.toFixed(1)} × ${piece.heightCm} cm)`,
      {
        x: MARGIN + 10,
        y: A4_H - 304 - i * 16,
        size: 10,
        font,
        color: rgb(0.2, 0.2, 0.2),
      }
    )
  })

  // Instructions d'assemblage A4
  cover.drawText("Instructions d'impression :", {
    x: MARGIN,
    y: A4_H - 380,
    size: 11,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  })
  const instructions = [
    "1. Imprime toutes les pages en taille réelle (100 %, pas de mise à l'échelle).",
    "2. Vérifie l'échelle : le carré de test page 2 doit mesurer exactement 5 × 5 cm.",
    "3. Assemble les tuiles en suivant les lettres et chiffres aux coins.",
    "4. Colle avec du ruban adhésif repositionnable, puis coupe le patron.",
    "5. Repère de couture : trait rouge pointillé à l'intérieur = ligne de couture.",
  ]
  instructions.forEach((line, i) => {
    cover.drawText(line, {
      x: MARGIN,
      y: A4_H - 402 - i * 16,
      size: 9,
      font,
      color: rgb(0.3, 0.3, 0.3),
    })
  })

  // Footer
  cover.drawLine({
    start: { x: MARGIN, y: 40 },
    end: { x: A4_W - MARGIN, y: 40 },
    color: rgb(0.8, 0.8, 0.8),
    thickness: 0.5,
  })
  cover.drawText("patronai.fr · Généré avec PatronAI · Tes données ne sont jamais stockées", {
    x: MARGIN,
    y: 25,
    size: 7,
    font,
    color: rgb(0.6, 0.6, 0.6),
  })

  // ── Page de test d'échelle ──
  const testPage = pdfDoc.addPage([A4_W, A4_H])
  testPage.drawText("Carré de vérification d'échelle : doit mesurer exactement 5 × 5 cm une fois imprimé", {
    x: MARGIN,
    y: A4_H - MARGIN - 15,
    size: 9,
    font,
    color: rgb(0.3, 0.3, 0.3),
  })
  const testX = MARGIN + 30
  const testY = A4_H - MARGIN - 30 - 5 * CM
  testPage.drawRectangle({
    x: testX,
    y: testY,
    width: 5 * CM,
    height: 5 * CM,
    borderColor: rgb(0, 0, 0),
    borderWidth: 1,
    color: undefined,
  })
  testPage.drawText("5 cm", {
    x: testX + 5 * CM / 2 - 10,
    y: testY - 15,
    size: 8,
    font,
    color: rgb(0, 0, 0),
  })

  // ── Pages des pièces (tuilage A4 1:1) ──
  for (const piece of pieces) {
    const pieceCmW = piece.widthCm + 2  // +2 pour marges
    const pieceCmH = piece.heightCm + 4

    const tilesX = Math.ceil((pieceCmW * CM) / USABLE_W)
    const tilesY = Math.ceil((pieceCmH * CM) / USABLE_H)

    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const page = pdfDoc.addPage([A4_W, A4_H])

        // En-tête de tuile
        page.drawText(
          `${piece.name} · Tuile ${String.fromCharCode(65 + tx)}${ty + 1} / ${String.fromCharCode(65 + tilesX - 1)}${tilesY}`,
          {
            x: MARGIN,
            y: A4_H - MARGIN - 10,
            size: 8,
            font: fontBold,
            color: rgb(0.49, 0.23, 0.93),
          }
        )
        page.drawText(`Taille ${sizeName} · ${piece.widthCm.toFixed(1)} × ${piece.heightCm} cm · 1:1`, {
          x: MARGIN,
          y: A4_H - MARGIN - 22,
          size: 7,
          font,
          color: rgb(0.5, 0.5, 0.5),
        })

        // Calcul de l'offset de dessin pour cette tuile
        const drawOffsetX = MARGIN - tx * USABLE_W
        const drawOffsetY = MARGIN - ty * USABLE_H + MARGIN + 30

        // Zone de découpe de la tuile (clip area)
        page.drawRectangle({
          x: MARGIN,
          y: MARGIN + 30,
          width: USABLE_W,
          height: USABLE_H - 30,
          borderColor: rgb(0.85, 0.85, 0.85),
          borderWidth: 0.5,
          color: undefined,
        })

        // Dessin simplifié de la pièce
        drawPieceOnPage(page, piece, measurements, drawOffsetX, drawOffsetY, 1, font as never)

        // Repères de coins pour l'assemblage
        const corners = [
          { x: MARGIN, y: MARGIN + 30 },
          { x: A4_W - MARGIN, y: MARGIN + 30 },
          { x: MARGIN, y: A4_H - MARGIN },
          { x: A4_W - MARGIN, y: A4_H - MARGIN },
        ]
        corners.forEach(({ x, y }) => {
          page.drawCircle({
            x,
            y,
            size: 2,
            color: rgb(0.49, 0.23, 0.93),
          })
        })

        // Pied de page tuile
        page.drawText("patronai.fr", {
          x: A4_W - MARGIN - 45,
          y: 15,
          size: 7,
          font,
          color: rgb(0.7, 0.7, 0.7),
        })
      }
    }
  }

  return pdfDoc.save()
}

// ─── Génération PDF A0 ───────────────────────────────────────────────────────

export async function generatePdfA0(
  pieces: PatternPiece[],
  measurements: SizeMeasurements,
  sizeName: string
): Promise<Uint8Array> {
  // A0 = 841mm × 1189mm = 2383.94pt × 3370.39pt
  const A0_W = 2383.94
  const A0_H = 3370.39

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const page = pdfDoc.addPage([A0_W, A0_H])
  const pageMargin = 40

  // En-tête
  page.drawRectangle({
    x: 0,
    y: A0_H - 120,
    width: A0_W,
    height: 120,
    color: rgb(0.49, 0.23, 0.93),
  })
  page.drawText("PatronAI — T-shirt femme", {
    x: pageMargin,
    y: A0_H - 55,
    size: 36,
    font: fontBold,
    color: rgb(1, 1, 1),
  })
  page.drawText(`Taille ${sizeName} · Impression A0 1:1 · Marge de couture 1 cm incluse`, {
    x: pageMargin,
    y: A0_H - 95,
    size: 16,
    font,
    color: rgb(0.9, 0.85, 1),
  })

  // Disposition des pièces sur la page A0
  let currentX = pageMargin
  let currentY = A0_H - 140
  let rowMaxH = 0

  for (const piece of pieces) {
    const pieceW = piece.widthCm * CM + 20
    const pieceH = piece.heightCm * CM + 20

    // Passer à la ligne si dépassement
    if (currentX + pieceW > A0_W - pageMargin) {
      currentX = pageMargin
      currentY -= rowMaxH + 30
      rowMaxH = 0
    }

    // Pièce positionnée
    const pieceY = currentY - pieceH
    drawPieceOnPage(page, piece, measurements, currentX, pieceY, 1, font as never)

    currentX += pieceW + 30
    rowMaxH = Math.max(rowMaxH, pieceH)
  }

  // Footer A0
  page.drawText(`patronai.fr · Patron généré automatiquement · Vérifie les mesures avant de couper`, {
    x: pageMargin,
    y: 25,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  return pdfDoc.save()
}
