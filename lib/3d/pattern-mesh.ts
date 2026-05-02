// Génération de meshs 3D triangulés à partir des pièces de patron du t-shirt.
// Le moteur 2D (lib/patterns/tshirt.ts) produit du SVG ; ici on régénère les
// outlines en tant que polygones de points (Vector2[] en cm) avec les courbes
// échantillonnées, puis on triangule via Delaunay et on drape en 3D par
// projection cylindrique sur le mannequin paramétrique.
//
// Phase 2A : mesh statique. Phase 2B (cf. cloth.ts + cloth-pieces.ts) ajoute
// la simulation Verlet par-dessus en partant des PieceMeshData exposés ici.

import * as THREE from "three"
import Delaunator from "delaunator"
import type { SizeMeasurements } from "@/lib/types/pattern"
import type { GarmentType } from "@/lib/patterns/index"

const CM_TO_M = 0.01

// Longueurs en cm de chaque type de vêtement (utilisées pour le drapé 3D).
function garmentLengthCm(m: SizeMeasurements, type: GarmentType): number {
  switch (type) {
    case "tshirt": return m.longueurDos
    case "dress":  return Math.round(m.longueurDos * 2.0)   // mi-genou
    case "shirt":  return Math.round(m.longueurDos * 1.25)  // bassin + un peu
    case "skirt":  return Math.round(m.longueurDos * 1.0)   // jupe = de la taille au mi-genou
    case "pants":  return 0                                 // pas de mesh torse pour pants
  }
}

// ─── Anatomie du mannequin ───────────────────────────────────────────────────

export interface BodyAnatomy {
  radiusAtHeight: (heightM: number) => number
  // Échantillon brut (utile pour le solver de collision Verlet)
  bodyHeights: number[]
  bodyRadii: number[]
  torsoH: number
  shoulderWidthM: number
  shoulderY: number
  armRadius: number
  armLength: number
}

export function makeAnatomy(m: SizeMeasurements): BodyAnatomy {
  const rChest = (m.poitrine / (2 * Math.PI)) * CM_TO_M
  const rWaist = (m.taille / (2 * Math.PI)) * CM_TO_M
  const rHip = (m.hanches / (2 * Math.PI)) * CM_TO_M
  const torsoH = m.longueurDos * CM_TO_M
  const shoulderY = torsoH * 0.92

  // Aisance vêtement +1 cm sur le rayon (≈ 6 cm de circonférence)
  const ease = 0.01
  const ctrl: Array<[number, number]> = [
    [0,                  rHip + ease],
    [torsoH * 0.45,      rWaist + ease],
    [torsoH * 0.78,      rChest + ease],
    [shoulderY,          rChest * 0.85 + ease],
    [torsoH,             0.05],
  ]

  const radiusAtHeight = (h: number): number => {
    if (h <= ctrl[0][0]) return ctrl[0][1]
    if (h >= ctrl[ctrl.length - 1][0]) return ctrl[ctrl.length - 1][1]
    for (let i = 0; i < ctrl.length - 1; i++) {
      const [h0, r0] = ctrl[i]
      const [h1, r1] = ctrl[i + 1]
      if (h >= h0 && h <= h1) {
        const t = (h - h0) / (h1 - h0)
        return r0 + (r1 - r0) * t
      }
    }
    return ctrl[ctrl.length - 1][1]
  }

  return {
    radiusAtHeight,
    bodyHeights: ctrl.map(([h]) => h),
    bodyRadii: ctrl.map(([, r]) => r),
    torsoH,
    shoulderWidthM: m.epaule * CM_TO_M,
    shoulderY,
    armRadius: 0.045,
    armLength: 0.55,
  }
}

// ─── Échantillonnage des courbes ─────────────────────────────────────────────

function sampleQuarterEllipse(
  center: THREE.Vector2,
  rx: number,
  ry: number,
  startAngle: number,
  endAngle: number,
  steps: number,
): THREE.Vector2[] {
  const out: THREE.Vector2[] = []
  for (let i = 1; i <= steps; i++) {
    const t = startAngle + (endAngle - startAngle) * (i / steps)
    out.push(new THREE.Vector2(center.x + rx * Math.cos(t), center.y + ry * Math.sin(t)))
  }
  return out
}

function sampleCubicBezier(
  p0: THREE.Vector2,
  c1: THREE.Vector2,
  c2: THREE.Vector2,
  p1: THREE.Vector2,
  steps: number,
): THREE.Vector2[] {
  const out: THREE.Vector2[] = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    const x = u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p1.x
    const y = u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p1.y
    out.push(new THREE.Vector2(x, y))
  }
  return out
}

// ─── Outlines de chaque pièce ────────────────────────────────────────────────

interface PieceOutline {
  name: "front" | "back" | "sleeve" | "skirt"
  outline: THREE.Vector2[]
  onFold: boolean
  widthCm: number
  heightCm: number
}

function frontOutline(m: SizeMeasurements, ph: number): PieceOutline {
  const pw = m.poitrine / 4 + 1
  const nw = 4
  const nd = 7
  const sw = m.epaule / 2
  const sd = 1.5
  // Profondeur d'emmanchure : basée sur longueurDos (taille du buste), pas sur la
  // longueur totale de la pièce — sinon une robe aurait des emmanchures gigantesques.
  const ad = Math.round(m.longueurDos * 0.34)

  const A = new THREE.Vector2(0,  nd)
  const B = new THREE.Vector2(nw, 0)
  const C = new THREE.Vector2(sw, sd)
  const D = new THREE.Vector2(pw, ad)
  const E = new THREE.Vector2(pw, ph)
  const F = new THREE.Vector2(0,  ph)

  const ctrl1 = new THREE.Vector2(C.x + 2.5, C.y + 5)
  const ctrl2 = new THREE.Vector2(D.x,       D.y - 7)

  const outline: THREE.Vector2[] = []
  outline.push(F.clone())
  outline.push(E.clone())
  outline.push(D.clone())
  outline.push(...sampleCubicBezier(D, ctrl2, ctrl1, C, 8))
  outline.push(B.clone())
  // Arc d'encolure : de B (cx=B.x, y=B.y) vers A (cx-nw, cy=A.y), centre en
  // (B.x, A.y). En y-down : B = center + (0, -nd) → angle 3π/2. A = center + (-nw, 0) → angle π.
  // L'arc passe par le quadrant supérieur-gauche.
  const neckCenter = new THREE.Vector2(B.x, A.y)
  outline.push(...sampleQuarterEllipse(neckCenter, nw, nd, (3 * Math.PI) / 2, Math.PI, 6))

  return { name: "front", outline, onFold: true, widthCm: pw, heightCm: ph }
}

function backOutline(m: SizeMeasurements, ph: number): PieceOutline {
  const pw = m.poitrine / 4 + 1
  const nw = 4
  const nd = 3
  const sw = m.epaule / 2
  const sd = 1.5
  const ad = Math.round(m.longueurDos * 0.34)

  const A = new THREE.Vector2(0,  nd)
  const B = new THREE.Vector2(nw, 0)
  const C = new THREE.Vector2(sw, sd)
  const D = new THREE.Vector2(pw, ad)
  const E = new THREE.Vector2(pw, ph)
  const F = new THREE.Vector2(0,  ph)

  const ctrl1 = new THREE.Vector2(C.x + 2.5, C.y + 5)
  const ctrl2 = new THREE.Vector2(D.x,       D.y - 7)

  const outline: THREE.Vector2[] = []
  outline.push(F.clone())
  outline.push(E.clone())
  outline.push(D.clone())
  outline.push(...sampleCubicBezier(D, ctrl2, ctrl1, C, 8))
  outline.push(B.clone())
  // Arc d'encolure : de B (cx=B.x, y=B.y) vers A (cx-nw, cy=A.y), centre en
  // (B.x, A.y). En y-down : B = center + (0, -nd) → angle 3π/2. A = center + (-nw, 0) → angle π.
  // L'arc passe par le quadrant supérieur-gauche.
  const neckCenter = new THREE.Vector2(B.x, A.y)
  outline.push(...sampleQuarterEllipse(neckCenter, nw, nd, (3 * Math.PI) / 2, Math.PI, 6))

  return { name: "back", outline, onFold: true, widthCm: pw, heightCm: ph }
}

function skirtOutline(m: SizeMeasurements, ph: number): PieceOutline {
  // Jupe trapézoïdale "au pli" : taille étroite, hem évasé.
  const pwTop = m.taille / 4 + 0.5
  const pwBot = m.hanches / 4 + 5

  const outline: THREE.Vector2[] = [
    new THREE.Vector2(0,     ph),          // bas pli
    new THREE.Vector2(pwBot, ph),          // bas côté
    new THREE.Vector2(pwTop, 0),           // taille côté
    // (le pli x=0 ferme le polygone implicitement vers le 1er point)
  ]

  return {
    name: "skirt",
    outline,
    onFold: true,
    widthCm: Math.max(pwTop, pwBot),
    heightCm: ph,
  }
}

function sleeveOutline(m: SizeMeasurements): PieceOutline {
  const capW = 18
  const slH = m.longueurManche
  const botW = 16
  const halfCap = capW / 2
  const halfBot = botW / 2

  const outline: THREE.Vector2[] = []
  outline.push(new THREE.Vector2(-halfBot, slH))
  outline.push(new THREE.Vector2(halfBot, slH))
  outline.push(new THREE.Vector2(halfCap, 0))
  const capRise = -2
  const ctrlR = new THREE.Vector2(halfCap * 0.6, -1.5)
  const top = new THREE.Vector2(0, capRise)
  const ctrlR2 = new THREE.Vector2(halfCap * 0.4, capRise + 0.2)
  outline.push(...sampleCubicBezier(new THREE.Vector2(halfCap, 0), ctrlR, ctrlR2, top, 6))
  const ctrlL2 = new THREE.Vector2(-halfCap * 0.4, capRise + 0.2)
  const ctrlL = new THREE.Vector2(-halfCap * 0.6, -1.5)
  outline.push(...sampleCubicBezier(top, ctrlL2, ctrlL, new THREE.Vector2(-halfCap, 0), 6))

  return { name: "sleeve", outline, onFold: false, widthCm: capW, heightCm: slH }
}

// ─── Triangulation contrainte ────────────────────────────────────────────────

function pointInPolygon(pt: THREE.Vector2, poly: THREE.Vector2[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y
    const xj = poly[j].x, yj = poly[j].y
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

interface Triangulation {
  vertices2D: THREE.Vector2[]
  outlineLength: number
  triangles: number[]
}

function triangulatePiece(outline: THREE.Vector2[]): Triangulation {
  const minX = Math.min(...outline.map((p) => p.x))
  const maxX = Math.max(...outline.map((p) => p.x))
  const minY = Math.min(...outline.map((p) => p.y))
  const maxY = Math.max(...outline.map((p) => p.y))

  const targetSpacing = 3
  const cols = Math.max(2, Math.round((maxX - minX) / targetSpacing))
  const rows = Math.max(2, Math.round((maxY - minY) / targetSpacing))

  const all: THREE.Vector2[] = [...outline]
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) {
      const p = new THREE.Vector2(
        minX + ((maxX - minX) * c) / cols,
        minY + ((maxY - minY) * r) / rows,
      )
      if (pointInPolygon(p, outline)) all.push(p)
    }
  }

  const flat = new Float64Array(all.length * 2)
  for (let i = 0; i < all.length; i++) {
    flat[i * 2] = all[i].x
    flat[i * 2 + 1] = all[i].y
  }
  const d = new Delaunator(flat)
  const tri = d.triangles

  const keptTriangles: number[] = []
  for (let i = 0; i < tri.length; i += 3) {
    const a = all[tri[i]], b = all[tri[i + 1]], c = all[tri[i + 2]]
    const centroid = new THREE.Vector2((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3)
    if (pointInPolygon(centroid, outline)) {
      keptTriangles.push(tri[i], tri[i + 1], tri[i + 2])
    }
  }

  return { vertices2D: all, outlineLength: outline.length, triangles: keptTriangles }
}

// ─── Drapé : 2D → 3D par projection cylindrique ─────────────────────────────

function projectTorso(
  p2D: THREE.Vector2,
  pwCm: number,
  _phCm: number,
  anatomy: BodyAnatomy,
  side: 1 | -1,
  xMirror: 1 | -1,
): THREE.Vector3 {
  // Mapping direct cm → m : on descend depuis l'épaule de la longueur réelle
  // de la pièce. Pour une robe (ph ~120 cm), bodyY peut être négatif (en
  // dessous des hanches) — radiusAtHeight retourne alors le rayon des hanches.
  const bodyY = anatomy.shoulderY - p2D.y * CM_TO_M
  const angle = (p2D.x / pwCm) * (Math.PI / 2) * xMirror
  const r = anatomy.radiusAtHeight(bodyY)
  const x = r * Math.sin(angle)
  const z = side * r * Math.cos(angle)
  return new THREE.Vector3(x, bodyY, z)
}

// Pour la jupe : projection autour de la zone hanches/cuisses, depuis la
// taille (~ torsoH * 0.45) descendant de la longueur de la pièce.
function projectSkirt(
  p2D: THREE.Vector2,
  pwTopCm: number,
  pwBotCm: number,
  phCm: number,
  anatomy: BodyAnatomy,
  side: 1 | -1,
  xMirror: 1 | -1,
): THREE.Vector3 {
  const waistY = anatomy.torsoH * 0.45
  const bodyY = waistY - p2D.y * CM_TO_M

  // Largeur half-width interpolée linéairement → angle qui couvre toujours
  // 90° entre fold et seam, indépendamment de l'évasement.
  const yNorm = Math.max(0, Math.min(1, p2D.y / phCm))
  const pwAtY = pwTopCm + (pwBotCm - pwTopCm) * yNorm
  const angle = (p2D.x / pwAtY) * (Math.PI / 2) * xMirror

  // Le rayon utilisé : on combine rayon du corps (pour le haut snug) avec un
  // léger boost lié au flare au hem. yNorm=0 → r = bodyR (snug à la taille),
  // yNorm=1 → r ≈ bodyR * 1.15 (légère ouverture A-line).
  const bodyR = anatomy.radiusAtHeight(bodyY)
  const flareScale = 1 + 0.15 * yNorm
  const r = bodyR * flareScale

  const x = r * Math.sin(angle)
  const z = side * r * Math.cos(angle)
  return new THREE.Vector3(x, bodyY, z)
}

function projectSleeve(
  p2D: THREE.Vector2,
  capWCm: number,
  slHCm: number,
  anatomy: BodyAnatomy,
  side: 1 | -1,
): THREE.Vector3 {
  const yNorm = p2D.y / slHCm
  const sleeveLengthM = slHCm * CM_TO_M
  const angle = (p2D.x / (capWCm / 2)) * Math.PI
  const sleeveR = anatomy.armRadius * 1.7
  const baseX = (side * anatomy.shoulderWidthM) / 2
  const armX = baseX + side * sleeveLengthM * yNorm
  const y = anatomy.shoulderY + sleeveR * Math.cos(angle)
  const z = sleeveR * Math.sin(angle)
  return new THREE.Vector3(armX, y, z)
}

// ─── Build Mesh + Data ───────────────────────────────────────────────────────

export interface PieceMeshData {
  name: "front" | "back" | "sleeve-left" | "sleeve-right" | "skirt"
  geometry: THREE.BufferGeometry
  // Données nécessaires à la simulation Verlet :
  vertices2D: THREE.Vector2[]    // points 2D du polygone (boundary + interior)
  outlineLength: number           // les `outlineLength` premiers vertices2D sont sur le bord
  triangles: number[]             // indices 3D (vers le tableau 3D des positions)
  positions3D: Float32Array       // copie initiale des positions 3D
  // Métadonnées pour l'épinglage :
  isTorso: boolean
  isMirror: boolean               // mesh = 2 moitiés mirroirées ?
  pwCm: number                    // largeur (demi pour torse "au pli", pleine pour manche/2)
  phCm: number
  capWCm?: number                 // pour la manche : largeur de la tête
}

function buildTorsoMeshData(
  piece: PieceOutline,
  anatomy: BodyAnatomy,
  side: 1 | -1,
  name: "front" | "back",
): PieceMeshData {
  const tri = triangulatePiece(piece.outline)
  const { vertices2D, outlineLength, triangles } = tri

  const positionsRight = vertices2D.map((p) =>
    projectTorso(p, piece.widthCm, piece.heightCm, anatomy, side, 1),
  )
  const positionsLeft = vertices2D.map((p) =>
    projectTorso(p, piece.widthCm, piece.heightCm, anatomy, side, -1),
  )

  const totalVerts = positionsRight.length + positionsLeft.length
  const positions = new Float32Array(totalVerts * 3)
  for (let i = 0; i < positionsRight.length; i++) {
    positions[i * 3] = positionsRight[i].x
    positions[i * 3 + 1] = positionsRight[i].y
    positions[i * 3 + 2] = positionsRight[i].z
  }
  const offset = positionsRight.length
  for (let i = 0; i < positionsLeft.length; i++) {
    positions[(offset + i) * 3] = positionsLeft[i].x
    positions[(offset + i) * 3 + 1] = positionsLeft[i].y
    positions[(offset + i) * 3 + 2] = positionsLeft[i].z
  }

  const indices: number[] = []
  for (let i = 0; i < triangles.length; i++) indices.push(triangles[i])
  for (let i = 0; i < triangles.length; i += 3) {
    indices.push(
      offset + triangles[i + 2],
      offset + triangles[i + 1],
      offset + triangles[i],
    )
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return {
    name,
    geometry: geo,
    vertices2D,
    outlineLength,
    triangles: indices,
    positions3D: positions.slice(),
    isTorso: true,
    isMirror: true,
    pwCm: piece.widthCm,
    phCm: piece.heightCm,
  }
}

function buildSleeveMeshData(
  piece: PieceOutline,
  anatomy: BodyAnatomy,
  side: 1 | -1,
): PieceMeshData {
  const tri = triangulatePiece(piece.outline)
  const { vertices2D, outlineLength, triangles } = tri

  const positions = new Float32Array(vertices2D.length * 3)
  for (let i = 0; i < vertices2D.length; i++) {
    const p3 = projectSleeve(vertices2D[i], piece.widthCm, piece.heightCm, anatomy, side)
    positions[i * 3] = p3.x
    positions[i * 3 + 1] = p3.y
    positions[i * 3 + 2] = p3.z
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setIndex(triangles)
  geo.computeVertexNormals()

  return {
    name: side > 0 ? "sleeve-right" : "sleeve-left",
    geometry: geo,
    vertices2D,
    outlineLength,
    triangles,
    positions3D: positions.slice(),
    isTorso: false,
    isMirror: false,
    pwCm: piece.widthCm,
    phCm: piece.heightCm,
    capWCm: piece.widthCm,
  }
}

// Construit le mesh de la jupe : trapèze "au pli" miroitré pour former le
// tube complet autour des hanches.
function buildSkirtMeshData(
  piece: PieceOutline,
  anatomy: BodyAnatomy,
  measurements: SizeMeasurements,
): PieceMeshData {
  const tri = triangulatePiece(piece.outline)
  const { vertices2D, outlineLength, triangles } = tri

  const pwTop = measurements.taille / 4 + 0.5
  const pwBot = measurements.hanches / 4 + 5

  const positionsRight = vertices2D.map((p) =>
    projectSkirt(p, pwTop, pwBot, piece.heightCm, anatomy, 1, 1),
  )
  const positionsLeft = vertices2D.map((p) =>
    projectSkirt(p, pwTop, pwBot, piece.heightCm, anatomy, 1, -1),
  )

  // La jupe a deux faces : front (z > 0) et back (z < 0). Les deux faces sont
  // chacune mirroirées en x (right + left half). Donc 4 morceaux au total
  // partageant la triangulation 2D.
  const positionsBackRight = vertices2D.map((p) =>
    projectSkirt(p, pwTop, pwBot, piece.heightCm, anatomy, -1, 1),
  )
  const positionsBackLeft = vertices2D.map((p) =>
    projectSkirt(p, pwTop, pwBot, piece.heightCm, anatomy, -1, -1),
  )

  const N = vertices2D.length
  const total = N * 4
  const positions = new Float32Array(total * 3)
  const writeBlock = (start: number, src: THREE.Vector3[]) => {
    for (let i = 0; i < src.length; i++) {
      positions[(start + i) * 3] = src[i].x
      positions[(start + i) * 3 + 1] = src[i].y
      positions[(start + i) * 3 + 2] = src[i].z
    }
  }
  writeBlock(0,     positionsRight)
  writeBlock(N,     positionsLeft)
  writeBlock(N * 2, positionsBackRight)
  writeBlock(N * 3, positionsBackLeft)

  const indices: number[] = []
  // Front-right : ordre direct
  for (let i = 0; i < triangles.length; i++) indices.push(triangles[i])
  // Front-left : inversé pour normales sortantes
  for (let i = 0; i < triangles.length; i += 3) {
    indices.push(N + triangles[i + 2], N + triangles[i + 1], N + triangles[i])
  }
  // Back-right : inversé
  for (let i = 0; i < triangles.length; i += 3) {
    indices.push(N * 2 + triangles[i + 2], N * 2 + triangles[i + 1], N * 2 + triangles[i])
  }
  // Back-left : direct
  for (let i = 0; i < triangles.length; i++) indices.push(N * 3 + triangles[i])

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()

  return {
    name: "skirt",
    geometry: geo,
    vertices2D,
    outlineLength,
    triangles: indices,
    positions3D: positions.slice(),
    isTorso: false,    // pas de pin "side seam" : la jupe forme un tube complet
    isMirror: true,    // multi-blocks : cloth-pieces gérera les pins basés sur outline
    pwCm: piece.widthCm,
    phCm: piece.heightCm,
  }
}

// Format léger gardé pour rétrocompat.
export interface PieceMesh {
  name: string
  geometry: THREE.BufferGeometry
}

export function buildGarmentMesh(
  measurements: SizeMeasurements,
  garmentType: GarmentType = "tshirt",
): PieceMesh[] {
  return buildGarmentMeshData(measurements, garmentType).map((d) => ({
    name: d.name,
    geometry: d.geometry,
  }))
}

export function buildGarmentMeshData(
  measurements: SizeMeasurements,
  garmentType: GarmentType = "tshirt",
): PieceMeshData[] {
  const anatomy = makeAnatomy(measurements)
  const length = garmentLengthCm(measurements, garmentType)

  // Pants : pas de mesh torse possible (anatomie jambes incompatible avec ce
  // moteur). Le caller (page /generate) doit sauter l'étape 3D.
  if (garmentType === "pants") return []

  if (garmentType === "skirt") {
    const skirt = skirtOutline(measurements, length)
    return [buildSkirtMeshData(skirt, anatomy, measurements)]
  }

  // tshirt / dress / shirt : 4 pièces (front + back + 2 manches). La longueur
  // pilote la descente du torse ; la profondeur d'emmanchure et la largeur
  // au niveau de la poitrine restent ancrées sur longueurDos.
  const front = frontOutline(measurements, length)
  const back = backOutline(measurements, length)
  const sleeve = sleeveOutline(measurements)

  return [
    buildTorsoMeshData(front, anatomy, 1, "front"),
    buildTorsoMeshData(back, anatomy, -1, "back"),
    buildSleeveMeshData(sleeve, anatomy, 1),
    buildSleeveMeshData(sleeve, anatomy, -1),
  ]
}
