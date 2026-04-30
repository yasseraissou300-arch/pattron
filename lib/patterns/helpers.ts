// Helpers SVG partagés entre tous les moteurs de patronage
// 1 unité SVG = 1 cm

export function circle(cx: number, cy: number, r = 0.25): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#1a1a1a"/>`
}

export function notch(x: number, y: number, dir: "top" | "right" | "bottom" | "left" = "top"): string {
  const len = 1.2
  const offsets = { top: [0, -len], right: [len, 0], bottom: [0, len], left: [-len, 0] }
  const [dx, dy] = offsets[dir]
  return `<line x1="${x}" y1="${y}" x2="${x + dx}" y2="${y + dy}" stroke="#1a1a1a" stroke-width="0.18"/>`
}

export function grainArrow(x: number, y1: number, y2: number): string {
  const mid = (y1 + y2) / 2
  return [
    `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#1a1a1a" stroke-width="0.12"/>`,
    `<polygon points="${x},${y1 - 0.6} ${x - 0.3},${y1} ${x + 0.3},${y1}" fill="#1a1a1a"/>`,
    `<polygon points="${x},${y2 + 0.6} ${x - 0.3},${y2} ${x + 0.3},${y2}" fill="#1a1a1a"/>`,
    `<text x="${x + 0.5}" y="${mid}" font-size="0.7" fill="#1a1a1a" font-family="Arial" dominant-baseline="middle">droit-fil</text>`,
  ].join("\n")
}

export function grainArrowH(x1: number, x2: number, y: number): string {
  return [
    `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#1a1a1a" stroke-width="0.12"/>`,
    `<polygon points="${x1 - 0.6},${y} ${x1},${y - 0.3} ${x1},${y + 0.3}" fill="#1a1a1a"/>`,
    `<polygon points="${x2 + 0.6},${y} ${x2},${y - 0.3} ${x2},${y + 0.3}" fill="#1a1a1a"/>`,
    `<text x="${(x1 + x2) / 2}" y="${y - 0.6}" font-size="0.7" fill="#1a1a1a" font-family="Arial" text-anchor="middle">droit-fil</text>`,
  ].join("\n")
}

export function dimension(x1: number, y: number, x2: number, label: string): string {
  const mid = (x1 + x2) / 2
  return [
    `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#6b7280" stroke-width="0.08" stroke-dasharray="0.2,0.2"/>`,
    `<line x1="${x1}" y1="${y - 0.3}" x2="${x1}" y2="${y + 0.3}" stroke="#6b7280" stroke-width="0.08"/>`,
    `<line x1="${x2}" y1="${y - 0.3}" x2="${x2}" y2="${y + 0.3}" stroke="#6b7280" stroke-width="0.08"/>`,
    `<text x="${mid}" y="${y - 0.35}" font-size="0.65" fill="#6b7280" font-family="Arial" text-anchor="middle">${label}</text>`,
  ].join("\n")
}

export function dimensionV(x: number, y1: number, y2: number, label: string): string {
  const mid = (y1 + y2) / 2
  return [
    `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#6b7280" stroke-width="0.08" stroke-dasharray="0.2,0.2"/>`,
    `<line x1="${x - 0.3}" y1="${y1}" x2="${x + 0.3}" y2="${y1}" stroke="#6b7280" stroke-width="0.08"/>`,
    `<line x1="${x - 0.3}" y1="${y2}" x2="${x + 0.3}" y2="${y2}" stroke="#6b7280" stroke-width="0.08"/>`,
    `<text x="${x - 0.4}" y="${mid}" font-size="0.65" fill="#6b7280" font-family="Arial" text-anchor="middle" transform="rotate(-90,${x - 0.4},${mid})">${label}</text>`,
  ].join("\n")
}

export function svgWrap(content: string, w: number, h: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 10}px" height="${h * 10}px">${content}</svg>`
}

export function foldIndicator(x: number, y1: number, y2: number): string {
  const mid = (y1 + y2) / 2
  return [
    `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#7c3aed" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    `<text x="${x - 0.25}" y="${mid}" font-size="0.65" fill="#7c3aed" font-family="Arial" text-anchor="middle" transform="rotate(-90,${x - 0.25},${mid})">PLIURE</text>`,
  ].join("\n")
}

export function pieceLabel(x: number, y: number, name: string, cuts: string, dims: string): string {
  return [
    `<text x="${x}" y="${y}" font-size="1.1" font-weight="bold" text-anchor="middle" fill="#1a1a1a" font-family="Arial">${name}</text>`,
    `<text x="${x}" y="${y + 1.5}" font-size="0.8" text-anchor="middle" fill="#6b7280" font-family="Arial">${cuts}</text>`,
    `<text x="${x}" y="${y + 2.7}" font-size="0.75" text-anchor="middle" fill="#9ca3af" font-family="Arial">${dims}</text>`,
  ].join("\n")
}

export function rectPiece(
  mx: number, my: number,
  w: number, h: number,
  sa: number,
  name: string, cuts: string,
  grain: "H" | "V" = "H"
): { svg: string; widthCm: number; heightCm: number } {
  const sewPath = `M ${mx},${my} L ${mx + w},${my} L ${mx + w},${my + h} L ${mx},${my + h} Z`
  const cutPath = `M ${mx - sa},${my - sa} L ${mx + w + sa},${my - sa} L ${mx + w + sa},${my + h + sa} L ${mx - sa},${my + h + sa} Z`
  const totalW = mx + w + sa + 2
  const totalH = my + h + sa + 3

  const grainEl = grain === "H"
    ? grainArrowH(mx + w * 0.15, mx + w * 0.85, my + h / 2)
    : grainArrow(mx + w / 2, my + h * 0.2, my + h * 0.8)

  const content = [
    `<path d="${cutPath}" fill="#f5f3ff" fill-opacity="0.6" stroke="#1a1a1a" stroke-width="0.15"/>`,
    `<path d="${sewPath}" fill="none" stroke="#dc2626" stroke-width="0.1" stroke-dasharray="0.4,0.25"/>`,
    grainEl,
    dimension(mx, my + h + sa + 1.2, mx + w, `${w.toFixed(1)} cm`),
    pieceLabel(mx + w / 2, my + h * 0.35, name, cuts, `${w.toFixed(0)} × ${h.toFixed(0)} cm`),
  ].join("\n")

  return { svg: svgWrap(content, totalW, totalH), widthCm: w, heightCm: h }
}
