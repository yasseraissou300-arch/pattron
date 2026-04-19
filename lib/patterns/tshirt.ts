// Moteur de patronage t-shirt femme manches courtes
// Toutes les dimensions sont en cm. 1 unité SVG = 1 cm.
// Les patrons incluent les marges de couture (configurable, défaut 1 cm).

import type { SizeMeasurements, PatternPiece, PatternResult, SewingStep } from "../types/pattern"

// ─── Helpers SVG ─────────────────────────────────────────────────────────────

function circle(cx: number, cy: number, r = 0.25): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1a1a1a"/>`
}

function grainArrow(x: number, y1: number, y2: number): string {
  const mid = (y1 + y2) / 2
  return [
    `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#1a1a1a" stroke-width="0.12"/>`,
    `<polygon points="${x},${y1 - 0.6} ${x - 0.3},${y1} ${x + 0.3},${y1}" fill="#1a1a1a"/>`,
    `<polygon points="${x},${y2 + 0.6} ${x - 0.3},${y2} ${x + 0.3},${y2}" fill="#1a1a1a"/>`,
    `<text x="${x + 0.4}" y="${mid}" font-size="0.7" fill="#1a1a1a" font-family="Arial" dominant-baseline="middle">droit-fil</text>`,
  ].join("\n")
}

function grainArrowH(x1: number, x2: number, y: number): string {
  return [
    `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#1a1a1a" stroke-width="0.12"/>`,
    `<polygon points="${x1 - 0.6},${y} ${x1},${y - 0.3} ${x1},${y + 0.3}" fill="#1a1a1a"/>`,
    `<polygon points="${x2 + 0.6},${y} ${x2},${y - 0.3} ${x2},${y + 0.3}" fill="#1a1a1a"/>`,
    `<text x="${(x1 + x2) / 2}" y="${y - 0.6}" font-size="0.7" fill="#1a1a1a" font-family="Arial" text-anchor="middle">droit-fil</text>`,
  ].join("\n")
}

function dimension(x1: number, y: number, x2: number, label: string): string {
  const mid = (x1 + x2) / 2
  return [
    `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#6b7280" stroke-width="0.08" stroke-dasharray="0.2,0.2"/>`,
    `<line x1="${x1}" y1="${y - 0.3}" x2="${x1}" y2="${y + 0.3}" stroke="#6b7280" stroke-width="0.08"/>`,
    `<line x1="${x2}" y1="${y - 0.3}" x2="${x2}" y2="${y + 0.3}" stroke="#6b7280" stroke-width="0.08"/>`,
    `<text x="${mid}" y="${y - 0.35}" font-size="0.65" fill="#6b7280" font-family="Arial" text-anchor="middle">${label}</text>`,
  ].join("\n")
}

function svgWrap(content: string, w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 10}px" height="${h * 10}px">${content}</svg>`
}

function foldIndicator(x: number, y1: number, y2: number): string {
  return [
    `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#7c3aed" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    `<text x="${x - 0.25}" y="${(y1 + y2) / 2}" font-size="0.65" fill="#7c3aed" font-family="Arial" text-anchor="middle" transform="rotate(-90,${x - 0.25},${(y1 + y2) / 2})">PLIURE</text>`,
  ].join("\n")
}

function pieceLabel(x: number, y: number, name: string, cuts: string, dims: string): string {
  return [
    `<text x="${x}" y="${y}" font-size="1.1" font-weight="bold" text-anchor="middle" fill="#1a1a1a" font-family="Arial">${name}</text>`,
    `<text x="${x}" y="${y + 1.5}" font-size="0.8" text-anchor="middle" fill="#6b7280" font-family="Arial">${cuts}</text>`,
    `<text x="${x}" y="${y + 2.7}" font-size="0.75" text-anchor="middle" fill="#9ca3af" font-family="Arial">${dims}</text>`,
  ].join("\n")
}

// ─── Pièce 1 : Devant ────────────────────────────────────────────────────────

function generateFront(m: SizeMeasurements, sa: number): PatternPiece {
  const pw = m.poitrine / 4 + 1  // largeur demi-pièce finie (aisance incluse)
  const ph = m.longueurDos        // hauteur finie
  const nw = 4                    // demi-largeur encolure
  const nd = 7                    // profondeur encolure devant
  const sw = m.epaule / 2        // demi-largeur épaule
  const sd = 1.5                  // chute d'épaule
  const ad = Math.round(ph * 0.34) // profondeur emmanchure

  // Marge visuelle autour de la pièce
  const mx = 2  // marge gauche (côté pli)
  const my = 2  // marge haute

  // Points de la ligne de couture (taille finie)
  const A = { x: mx,       y: my + nd }        // centre encolure bas
  const B = { x: mx + nw,  y: my }             // fin encolure côté épaule
  const C = { x: mx + sw,  y: my + sd }         // pointe d'épaule
  const D = { x: mx + pw,  y: my + ad }         // bas emmanchure (côté couture)
  const E = { x: mx + pw,  y: my + ph }         // bas côté droit
  const F = { x: mx,       y: my + ph }         // bas pli milieu

  // Points de la ligne de coupe (+ marge de couture)
  const A2 = { x: mx,          y: my + nd - sa }
  const B2 = { x: mx + nw + sa * 0.7, y: my - sa }
  const C2 = { x: mx + sw + sa * 0.5, y: my + sd - sa * 0.5 }
  const D2 = { x: mx + pw + sa, y: my + ad }
  const E2 = { x: mx + pw + sa, y: my + ph + sa }
  const F2 = { x: mx,           y: my + ph + sa }

  // Contrôle Bézier emmanchure (ligne de couture)
  const emCtrl1 = { x: C.x + 2.5, y: C.y + 5 }
  const emCtrl2 = { x: D.x,       y: D.y - 7 }

  // Contrôle Bézier emmanchure (ligne de coupe)
  const emCtrl1c = { x: C2.x + 2.5, y: C2.y + 5 }
  const emCtrl2c = { x: D2.x,       y: D2.y - 7 }

  // Chemin ligne de couture (pointillés rouges)
  const sewPath = [
    `M ${A.x},${A.y}`,
    `A ${nw},${nd} 0 0 1 ${B.x},${B.y}`,
    `L ${C.x},${C.y}`,
    `C ${emCtrl1.x},${emCtrl1.y} ${emCtrl2.x},${emCtrl2.y} ${D.x},${D.y}`,
    `L ${E.x},${E.y}`,
    `L ${F.x},${F.y}`,
    `Z`,
  ].join(" ")

  // Chemin ligne de coupe (trait plein noir)
  const cutPath = [
    `M ${A2.x},${A2.y}`,
    `A ${nw + sa * 0.7},${nd + sa} 0 0 1 ${B2.x},${B2.y}`,
    `L ${C2.x},${C2.y}`,
    `C ${emCtrl1c.x},${emCtrl1c.y} ${emCtrl2c.x},${emCtrl2c.y} ${D2.x},${D2.y}`,
    `L ${E2.x},${E2.y}`,
    `L ${F2.x},${F2.y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + pw + sa + 2
  const totalH = my + ph + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    foldIndicator(mx, my - sa, my + ph + sa),
    grainArrow(mx + pw * 0.6, my + ph * 0.25, my + ph * 0.7),
    circle(C.x, C.y),
    circle(D.x, D.y),
    circle((D.x + C.x) / 2 + 1, (D.y + C.y) / 2 + 3),
    dimension(mx, my + ph + sa + 1.2, mx + pw, `${(pw * 2).toFixed(1)} cm`),
    pieceLabel(
      mx + pw * 0.5,
      my + ph * 0.48,
      "DEVANT",
      "Couper 1× au pli",
      `${(pw * 2).toFixed(1)} × ${ph} cm`
    ),
  ].join("\n")

  return {
    name: "Devant",
    svg: svgWrap(content, totalW, totalH),
    widthCm: pw * 2,
    heightCm: ph,
    cutCount: 1,
    onFold: true,
  }
}

// ─── Pièce 2 : Dos ───────────────────────────────────────────────────────────

function generateBack(m: SizeMeasurements, sa: number): PatternPiece {
  const pw = m.poitrine / 4 + 1
  const ph = m.longueurDos
  const nw = 4
  const nd = 3   // encolure dos = 3 cm (moins profonde que devant)
  const sw = m.epaule / 2
  const sd = 1.5
  const ad = Math.round(ph * 0.34)

  const mx = 2
  const my = 2

  const A = { x: mx,       y: my + nd }
  const B = { x: mx + nw,  y: my }
  const C = { x: mx + sw,  y: my + sd }
  const D = { x: mx + pw,  y: my + ad }
  const E = { x: mx + pw,  y: my + ph }
  const F = { x: mx,       y: my + ph }

  const A2 = { x: mx,              y: my + nd - sa }
  const B2 = { x: mx + nw + sa * 0.7, y: my - sa }
  const C2 = { x: mx + sw + sa * 0.5, y: my + sd - sa * 0.5 }
  const D2 = { x: mx + pw + sa,    y: my + ad }
  const E2 = { x: mx + pw + sa,    y: my + ph + sa }
  const F2 = { x: mx,              y: my + ph + sa }

  const emCtrl1  = { x: C.x + 2.5,  y: C.y + 5 }
  const emCtrl2  = { x: D.x,        y: D.y - 7 }
  const emCtrl1c = { x: C2.x + 2.5, y: C2.y + 5 }
  const emCtrl2c = { x: D2.x,       y: D2.y - 7 }

  const sewPath = [
    `M ${A.x},${A.y}`,
    `A ${nw},${nd} 0 0 1 ${B.x},${B.y}`,
    `L ${C.x},${C.y}`,
    `C ${emCtrl1.x},${emCtrl1.y} ${emCtrl2.x},${emCtrl2.y} ${D.x},${D.y}`,
    `L ${E.x},${E.y}`,
    `L ${F.x},${F.y}`,
    `Z`,
  ].join(" ")

  const cutPath = [
    `M ${A2.x},${A2.y}`,
    `A ${nw + sa * 0.7},${nd + sa} 0 0 1 ${B2.x},${B2.y}`,
    `L ${C2.x},${C2.y}`,
    `C ${emCtrl1c.x},${emCtrl1c.y} ${emCtrl2c.x},${emCtrl2c.y} ${D2.x},${D2.y}`,
    `L ${E2.x},${E2.y}`,
    `L ${F2.x},${F2.y}`,
    `Z`,
  ].join(" ")

  const totalW = mx + pw + sa + 2
  const totalH = my + ph + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    foldIndicator(mx, my - sa, my + ph + sa),
    grainArrow(mx + pw * 0.6, my + ph * 0.25, my + ph * 0.7),
    circle(C.x, C.y),
    circle(D.x, D.y),
    circle((D.x + C.x) / 2 + 1, (D.y + C.y) / 2 + 3),
    dimension(mx, my + ph + sa + 1.2, mx + pw, `${(pw * 2).toFixed(1)} cm`),
    pieceLabel(
      mx + pw * 0.5,
      my + ph * 0.48,
      "DOS",
      "Couper 1× au pli",
      `${(pw * 2).toFixed(1)} × ${ph} cm`
    ),
  ].join("\n")

  return {
    name: "Dos",
    svg: svgWrap(content, totalW, totalH),
    widthCm: pw * 2,
    heightCm: ph,
    cutCount: 1,
    onFold: true,
  }
}

// ─── Pièce 3 : Manche ────────────────────────────────────────────────────────

function generateSleeve(m: SizeMeasurements, sa: number): PatternPiece {
  const capW  = 18  // largeur tête de manche
  const slH   = m.longueurManche  // hauteur totale
  const botW  = 16  // largeur bas de manche

  const mx = 2
  const my = 2

  // Demi-valeurs pour travailler en symétrie (pièce entière, pas au pli)
  const halfCapW  = capW / 2
  const halfBotW  = botW / 2
  const capHeight = Math.min(slH * 0.5, 8)  // hauteur de la tête (dôme)

  // Points de couture (taille finie)
  // La pièce est posée avec le centre de la tête en haut au milieu
  const centerX = mx + halfCapW
  const topY    = my

  // Tête de manche : demi-arc aplati (Bézier)
  // Point gauche, point droit, sommet au centre
  const TL = { x: centerX - halfCapW, y: topY + capHeight }  // pied gauche tête
  const TR = { x: centerX + halfCapW, y: topY + capHeight }  // pied droit tête

  // Bézier pour tête de manche : contrôles légèrement au-dessus de la mi-hauteur
  const ctrlTopL = { x: centerX - halfCapW * 0.6, y: topY - 0.5 }
  const ctrlTopR = { x: centerX + halfCapW * 0.6, y: topY - 0.5 }

  // Bas de manche
  const BL = { x: centerX - halfBotW, y: my + slH }
  const BR = { x: centerX + halfBotW, y: my + slH }

  // Ligne de couture
  const sewPath = [
    `M ${centerX},${topY}`,
    `C ${ctrlTopL.x},${ctrlTopL.y} ${TL.x},${TL.y - 1} ${TL.x},${TL.y}`,
    `L ${BL.x},${BL.y}`,
    `L ${BR.x},${BR.y}`,
    `L ${TR.x},${TR.y}`,
    `C ${TR.x},${TR.y - 1} ${ctrlTopR.x},${ctrlTopR.y} ${centerX},${topY}`,
    `Z`,
  ].join(" ")

  // Ligne de coupe (+sa)
  const TLc = { x: TL.x - sa, y: TL.y + sa * 0.3 }
  const TRc = { x: TR.x + sa, y: TR.y + sa * 0.3 }
  const BLc = { x: BL.x - sa, y: BL.y + sa }
  const BRc = { x: BR.x + sa, y: BR.y + sa }
  const topYc = topY - sa

  const cutPath = [
    `M ${centerX},${topYc}`,
    `C ${ctrlTopL.x},${topYc - 0.5} ${TLc.x},${TLc.y - 1} ${TLc.x},${TLc.y}`,
    `L ${BLc.x},${BLc.y}`,
    `L ${BRc.x},${BRc.y}`,
    `L ${TRc.x},${TRc.y}`,
    `C ${TRc.x},${TRc.y - 1} ${ctrlTopR.x},${topYc - 0.5} ${centerX},${topYc}`,
    `Z`,
  ].join(" ")

  const totalW = mx + capW + sa + 2
  const totalH = my + slH + sa + 3

  // Cran milieu tête (point de repère pour montage)
  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    grainArrow(centerX, my + slH * 0.25, my + slH * 0.7),
    circle(centerX, topY),
    circle(TL.x, TL.y),
    circle(TR.x, TR.y),
    dimension(mx, my + slH + sa + 1.2, mx + capW, `${capW} cm`),
    pieceLabel(
      centerX,
      my + slH * 0.48,
      "MANCHE",
      "Couper 2×",
      `${capW} × ${slH} cm`
    ),
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

// ─── Pièce 4 : Bande d'encolure ──────────────────────────────────────────────

function generateNeckband(m: SizeMeasurements, sa: number): PatternPiece {
  const length = Math.round(m.poitrine * 0.4)  // ≈ 36 cm en M
  const width  = 4                               // cm
  const mx = 2
  const my = 2

  // Ligne de couture
  const sewPath = `M ${mx},${my} L ${mx + length},${my} L ${mx + length},${my + width} L ${mx},${my + width} Z`

  // Ligne de coupe (+sa partout)
  const cutPath = [
    `M ${mx - sa},${my - sa}`,
    `L ${mx + length + sa},${my - sa}`,
    `L ${mx + length + sa},${my + width + sa}`,
    `L ${mx - sa},${my + width + sa}`,
    `Z`,
  ].join(" ")

  const totalW = mx + length + sa + 2
  const totalH = my + width + sa + 3

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    grainArrowH(mx + length * 0.15, mx + length * 0.85, my + width / 2),
    circle(mx, my + width / 2),
    circle(mx + length, my + width / 2),
    dimension(mx, my + width + sa + 1.2, mx + length, `${length} cm`),
    pieceLabel(
      mx + length / 2,
      my + width * 0.3,
      "BANDE D'ENCOLURE",
      "Couper 1× (tissu extensible)",
      `${length} × ${width} cm`
    ),
  ].join("\n")

  return {
    name: "Bande d'encolure",
    svg: svgWrap(content, totalW, totalH),
    widthCm: length,
    heightCm: width,
    cutCount: 1,
    onFold: false,
  }
}

// ─── Croquis à plat ──────────────────────────────────────────────────────────

function generateFlatSketch(m: SizeMeasurements): string {
  const W = 40   // largeur totale du croquis
  const H = 55   // hauteur totale
  const cx = W / 2

  // Contour du t-shirt (simplifié, non à l'échelle)
  const body = [
    `M ${cx - 8},4`,
    `C ${cx - 9},4 ${cx - 10},5 ${cx - 10},6`,
    `L ${cx - 10},40`,
    `L ${cx + 10},40`,
    `L ${cx + 10},6`,
    `C ${cx + 10},5 ${cx + 9},4 ${cx + 8},4`,
    `Z`,
  ].join(" ")

  const neckFront = `M ${cx - 4},4 A 4,5 0 0 0 ${cx + 4},4`
  const leftShoulder = `M ${cx - 10},6 L ${cx - 8},4`
  const rightShoulder = `M ${cx + 8},4 L ${cx + 10},6`

  const leftSleeve = [
    `M ${cx - 10},6`,
    `L ${cx - 18},8`,
    `L ${cx - 18},18`,
    `L ${cx - 10},18`,
  ].join(" ")

  const rightSleeve = [
    `M ${cx + 10},6`,
    `L ${cx + 18},8`,
    `L ${cx + 18},18`,
    `L ${cx + 10},18`,
  ].join(" ")

  const seamLines = [
    `<line x1="${cx}" y1="4" x2="${cx}" y2="40" stroke="#9ca3af" stroke-width="0.3" stroke-dasharray="1,0.5"/>`,
    `<line x1="${cx - 10}" y1="18" x2="${cx + 10}" y2="18" stroke="#9ca3af" stroke-width="0.3" stroke-dasharray="1,0.5"/>`,
  ].join("\n")

  const content = [
    `<rect width="${W}" height="${H}" fill="white"/>`,
    `<path d="${body}" fill="#ede9fe" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${leftSleeve}" fill="#ede9fe" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${rightSleeve}" fill="#ede9fe" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${neckFront}" fill="none" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${leftShoulder}" fill="none" stroke="#7c3aed" stroke-width="0.5"/>`,
    `<path d="${rightShoulder}" fill="none" stroke="#7c3aed" stroke-width="0.5"/>`,
    seamLines,
    `<text x="${cx}" y="${H - 4}" font-size="2" text-anchor="middle" fill="#7c3aed" font-family="Arial" font-weight="bold">T-shirt femme</text>`,
  ].join("\n")

  return svgWrap(content, W, H)
}

// ─── Guide de couture ─────────────────────────────────────────────────────────

function generateSewingGuide(): SewingStep[] {
  return [
    {
      step: 1,
      title: "Préparer le tissu",
      instruction:
        "Lave et repasse ton tissu avant de couper pour éviter le rétrécissement après lavage. Plie-le en deux endroit contre endroit, les lisières alignées.",
      tip: "Pour un jersey, repasse avec de la vapeur sans tirer le tissu pour ne pas le déformer.",
    },
    {
      step: 2,
      title: "Tracer et couper les pièces",
      instruction:
        "Place les patrons sur le tissu en respectant le sens du droit-fil (flèche parallèle à la lisière). Épingle chaque pièce et coupe en suivant le trait de coupe extérieur (trait plein noir).",
      tip: "Les pièces 'au pli' (Devant et Dos) se coupent avec le bord fléché 'PLIURE' exactement sur le pli du tissu.",
    },
    {
      step: 3,
      title: "Assembler les épaules",
      instruction:
        "Place le devant et le dos endroit contre endroit, bords épaules alignés. Épingle puis couds à 1 cm des bords (ligne de couture en pointillés rouges). Surfile les marges ensemble et repassez-les vers le dos.",
    },
    {
      step: 4,
      title: "Poser la bande d'encolure",
      instruction:
        "Plie la bande d'encolure en deux dans le sens de la longueur, endroit à l'extérieur. Étire-la légèrement pour lui faire faire le tour du col. Épingle-la endroit contre endroit sur l'encolure en faisant correspondre les crans, puis couds.",
      tip: "Couds avec le tissu extensible côté machine (sous le pied) pour que le point suive l'élasticité.",
    },
    {
      step: 5,
      title: "Monter les manches",
      instruction:
        "Fais correspondre le cran central de la tête de manche (cercle plein) avec la couture d'épaule. Épingle en étalant régulièrement la manche sur l'emmanchure. Couds à 1 cm en commençant et terminant aux crans de base.",
    },
    {
      step: 6,
      title: "Fermer les côtés et les manches",
      instruction:
        "Replie l'ensemble envers contre envers en alignant les coutures de côté du bas de manche jusqu'au bas du t-shirt. Couds en une seule passe continue. Surfile les marges.",
      tip: "Commence par l'aisselle et couds vers le bas du t-shirt pour garder les manches bien alignées.",
    },
    {
      step: 7,
      title: "Ourlet des manches",
      instruction:
        "Replie le bas de chaque manche de 1 cm vers l'envers, puis de 1 cm à nouveau. Épingle et couds près du bord replié avec un point droit ou un point triple pour conserver l'élasticité.",
    },
    {
      step: 8,
      title: "Ourlet du bas du t-shirt",
      instruction:
        "Replie le bas du t-shirt de 1 cm vers l'envers, puis de 1 cm encore. Épingle en faisant le tour et couds avec un point élastique.",
      tip: "Un point zigzag ou un point jersey maintient l'élasticité du tissu et évite que la couture craque.",
    },
    {
      step: 9,
      title: "Repassage final",
      instruction:
        "Retourne le t-shirt à l'endroit et repasse toutes les coutures à la vapeur en utilisant un torchon humide si le tissu est fragile. L'encolure se repasse de l'intérieur vers l'extérieur.",
    },
  ]
}

// ─── Export principal ─────────────────────────────────────────────────────────

export function generatePattern(
  measurements: SizeMeasurements,
  seamAllowance = 1
): PatternResult {
  const sa = seamAllowance

  const pieces = [
    generateFront(measurements, sa),
    generateBack(measurements, sa),
    generateSleeve(measurements, sa),
    generateNeckband(measurements, sa),
  ]

  return {
    pieces,
    flatSketch: generateFlatSketch(measurements),
    sewingGuide: generateSewingGuide(),
    estimatedTimeMinutes: 180,
    difficulty: 2,
    fabricNeededCm: Math.ceil(measurements.longueurDos * 2 + 20),
  }
}
