// Génération de meshs 3D triangulés à partir des pièces de patron du t-shirt.
// Le moteur 2D (lib/patterns/tshirt.ts) produit du SVG ; ici on régénère les
// outlines en tant que polygones de points (Vector2[] en cm) avec les courbes
// échantillonnées, puis on triangule via Delaunay et on drape en 3D par
// projection cylindrique sur le mannequin paramétrique.
//
// Pourquoi pas parser le SVG existant ?
//   Plus fragile (regex sur paths, gestion des arcs/béziers SVG…) et redondant :
//   les deux représentations dérivent des mêmes 6 mesures. On régénère.

import * as THREE from "three"
import Delaunator from "delaunator"
import type { SizeMeasurements } from "@/lib/types/pattern"

const CM_TO_M = 0.01

// ─── Échantillonnage des courbes ─────────────────────────────────────────────

function sampleQuarterEllipse(
  center: THREE.Vector2,
  rx: number,
  ry: number,
  startAngle: number,
  endAngle: number,
  steps: number,
): THREE.Vector2[] {
  // Échantillonne une portion d'ellipse, exclut le point de départ
  // (le caller s'en charge), inclut le point d'arrivée.
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
  // Échantillonne une cubique, exclut p0, inclut p1.
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
  name: "front" | "back" | "sleeve"
  // Points en cm dans l'espace local de la pièce. Pour les pièces "au pli"
  // (front, back), c'est la moitié droite : la jonction sur le pli est à x=0.
  // Pour la manche, c'est la pièce complète centrée sur x=0.
  outline: THREE.Vector2[]
  onFold: boolean
  widthCm: number  // largeur de la moitié pour "au pli", largeur totale sinon
  heightCm: number
}

function frontOutline(m: SizeMeasurements): PieceOutline {
  // Les valeurs viennent directement de lib/patterns/tshirt.ts::generateFront
  // mais sans la marge mx/my (on travaille en coordonnées locales 0,0).
  const pw = m.poitrine / 4 + 1
  const ph = m.longueurDos
  const nw = 4
  const nd = 7  // profondeur d'encolure devant
  const sw = m.epaule / 2
  const sd = 1.5
  const ad = Math.round(ph * 0.34)

  // Points (en cm, x horizontal du fold vers l'extérieur, y vertical du haut vers le bas)
  const A = new THREE.Vector2(0,  nd)         // base d'encolure côté pli
  const B = new THREE.Vector2(nw, 0)          // jonction encolure/épaule
  const C = new THREE.Vector2(sw, sd)         // pointe d'épaule
  const D = new THREE.Vector2(pw, ad)         // bas d'emmanchure
  const E = new THREE.Vector2(pw, ph)         // bas côté
  const F = new THREE.Vector2(0,  ph)         // bas côté pli

  // Bézier emmanchure (mêmes contrôles qu'en 2D)
  const ctrl1 = new THREE.Vector2(C.x + 2.5, C.y + 5)
  const ctrl2 = new THREE.Vector2(D.x,       D.y - 7)

  // Construction CCW dans l'espace 2D : F → E → D → ... → A → fold → F
  // L'arc d'encolure va de A vers B (centre en (B.x, A.y), r = (nw, nd), angle π → π/2)
  const outline: THREE.Vector2[] = []
  outline.push(F.clone())
  outline.push(E.clone())
  // Emmanchure E → D inversée : la bezier originale va C → D, on ajoute D directement
  // puis échantillonne D → C en inversant.
  outline.push(D.clone())
  // Bezier de D vers C : on inverse les contrôles.
  outline.push(...sampleCubicBezier(D, ctrl2, ctrl1, C, 8))
  outline.push(B.clone())
  // Arc B → A : ellipse centrée en (B.x, A.y), de l'angle π/2 (top) à π (gauche).
  // Quart d'ellipse "au-dessus" du foyer.
  const neckCenter = new THREE.Vector2(B.x, A.y)
  outline.push(...sampleQuarterEllipse(neckCenter, nw, nd, Math.PI / 2, Math.PI, 6))
  // Termine au pli, retour vers F.
  // F est déjà ajouté au début, mais Delaunay attend un polygone non fermé.

  return {
    name: "front",
    outline,
    onFold: true,
    widthCm: pw,
    heightCm: ph,
  }
}

function backOutline(m: SizeMeasurements): PieceOutline {
  // Identique au front mais avec une encolure dos moins profonde.
  const pw = m.poitrine / 4 + 1
  const ph = m.longueurDos
  const nw = 4
  const nd = 3  // dos = encolure plate
  const sw = m.epaule / 2
  const sd = 1.5
  const ad = Math.round(ph * 0.34)

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
  const neckCenter = new THREE.Vector2(B.x, A.y)
  outline.push(...sampleQuarterEllipse(neckCenter, nw, nd, Math.PI / 2, Math.PI, 6))

  return { name: "back", outline, onFold: true, widthCm: pw, heightCm: ph }
}

function sleeveOutline(m: SizeMeasurements): PieceOutline {
  // Manche : pièce complète, symétrique autour de x=0.
  const capW = 18
  const slH  = m.longueurManche
  const botW = 16
  const halfCap = capW / 2
  const halfBot = botW / 2

  // CCW depuis le bas-gauche : (-halfBot, slH) → (halfBot, slH) → (halfCap, 0)
  // → bezier "tête de manche" inversée → (-halfCap, 0) → retour
  const outline: THREE.Vector2[] = []
  outline.push(new THREE.Vector2(-halfBot, slH))
  outline.push(new THREE.Vector2(halfBot, slH))
  outline.push(new THREE.Vector2(halfCap, 0))
  // Tête de manche : on échantillonne un demi-arc de chaque côté du sommet (0, -capRise)
  // En 2D source on a une bezier complète ; pour le mesh on prend juste l'arc.
  const capRise = -2  // sommet de la tête légèrement au-dessus du plan d'épaule
  const ctrlR = new THREE.Vector2(halfCap * 0.6, -1.5)
  const top = new THREE.Vector2(0, capRise)
  const ctrlR2 = new THREE.Vector2(halfCap * 0.4, capRise + 0.2)
  outline.push(...sampleCubicBezier(new THREE.Vector2(halfCap, 0), ctrlR, ctrlR2, top, 6))
  // Et de l'autre côté (symétrique)
  const ctrlL2 = new THREE.Vector2(-halfCap * 0.4, capRise + 0.2)
  const ctrlL = new THREE.Vector2(-halfCap * 0.6, -1.5)
  outline.push(...sampleCubicBezier(top, ctrlL2, ctrlL, new THREE.Vector2(-halfCap, 0), 6))

  return { name: "sleeve", outline, onFold: false, widthCm: capW, heightCm: slH }
}

// ─── Triangulation contrainte (Delaunay + filtrage des triangles hors polygone) ─

function pointInPolygon(pt: THREE.Vector2, poly: THREE.Vector2[]): boolean {
  // Ray casting horizontal classique.
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi
    if (intersect) inside = !inside
  }
  return inside
}

interface Triangulation {
  vertices2D: THREE.Vector2[]   // points utilisés pour le maillage
  triangles: number[]            // indices, triplets
}

function triangulatePiece(outline: THREE.Vector2[]): Triangulation {
  // 1. On enrichit le polygone avec une grille de points intérieurs pour
  //    obtenir un maillage plus fin (utile pour le rendu lisse et préparer
  //    une éventuelle simulation Verlet en Phase 2B).
  const minX = Math.min(...outline.map((p) => p.x))
  const maxX = Math.max(...outline.map((p) => p.x))
  const minY = Math.min(...outline.map((p) => p.y))
  const maxY = Math.max(...outline.map((p) => p.y))

  const targetSpacing = 3  // cm — pas trop fin pour rester perf en client
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

  // 2. Delaunay non contrainte sur tous les points.
  const flat = new Float64Array(all.length * 2)
  for (let i = 0; i < all.length; i++) {
    flat[i * 2] = all[i].x
    flat[i * 2 + 1] = all[i].y
  }
  const d = new Delaunator(flat)
  const tri = d.triangles

  // 3. Filtre : on ne garde que les triangles dont le centroïde est dans le polygone
  //    (élimine les triangles qui débordent dans les concavités, ex: encolure).
  const keptTriangles: number[] = []
  for (let i = 0; i < tri.length; i += 3) {
    const a = all[tri[i]]
    const b = all[tri[i + 1]]
    const c = all[tri[i + 2]]
    const centroid = new THREE.Vector2(
      (a.x + b.x + c.x) / 3,
      (a.y + b.y + c.y) / 3,
    )
    if (pointInPolygon(centroid, outline)) {
      keptTriangles.push(tri[i], tri[i + 1], tri[i + 2])
    }
  }

  return { vertices2D: all, triangles: keptTriangles }
}

// ─── Drapé : 2D → 3D par projection cylindrique ─────────────────────────────

interface BodyAnatomy {
  // Profil radial du corps (rayon en m, hauteur en m) du bas au sommet du torse.
  radiusAtHeight: (heightM: number) => number
  torsoHM: number          // hauteur totale du torse en m
  shoulderWidthM: number
  shoulderY: number
  armRadius: number
  armLength: number
}

function makeAnatomy(m: SizeMeasurements): BodyAnatomy {
  const rChest = (m.poitrine / (2 * Math.PI)) * CM_TO_M
  const rWaist = (m.taille / (2 * Math.PI)) * CM_TO_M
  const rHip = (m.hanches / (2 * Math.PI)) * CM_TO_M
  const torsoHM = m.longueurDos * CM_TO_M
  const shoulderY = torsoHM * 0.92

  // Aisance vêtement +1 cm sur le rayon (≈ 6 cm de circonférence)
  const ease = 0.01
  const ctrl: Array<[number, number]> = [
    [0,                  rHip + ease],   // hanches
    [torsoHM * 0.45,     rWaist + ease], // taille
    [torsoHM * 0.78,     rChest + ease], // poitrine
    [shoulderY,          rChest * 0.85 + ease],
    [torsoHM,            0.05],
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
    torsoHM,
    shoulderWidthM: m.epaule * CM_TO_M,
    shoulderY,
    armRadius: 0.045,
    armLength: 0.55,
  }
}

// Projection d'un point 2D de pièce torse sur le corps. side=+1 = front, -1 = back.
// xMirror=+1 = moitié droite, -1 = moitié gauche (pour pièces "au pli").
function projectTorso(
  p2D: THREE.Vector2,
  pwCm: number,
  phCm: number,
  anatomy: BodyAnatomy,
  side: 1 | -1,
  xMirror: 1 | -1,
): THREE.Vector3 {
  // y2D=0 (haut de la pièce, épaule) → bodyY = shoulderY
  // y2D=phCm (bas de la pièce) → bodyY ≈ 0 (hanches)
  const yNorm = p2D.y / phCm
  const bodyY = anatomy.shoulderY * (1 - yNorm)

  // x2D ∈ [0, pwCm] → angle ∈ [0, π/2] (côté pli au centre, côté seam à 90°)
  const angle = (p2D.x / pwCm) * (Math.PI / 2) * xMirror
  const r = anatomy.radiusAtHeight(bodyY)

  // side=1 (front) → z positif (+sin) ; side=-1 (back) → z négatif
  const x = r * Math.sin(angle)
  const z = side * r * Math.cos(angle)
  return new THREE.Vector3(x, bodyY, z)
}

// Projection sleeve : la manche enveloppe le bras gauche (-X) ou droit (+X).
// Le bras va de l'épaule (-shoulderWidth/2 ou +shoulderWidth/2, shoulderY, 0)
// vers l'extérieur (±armLength).
function projectSleeve(
  p2D: THREE.Vector2,
  capWCm: number,
  slHCm: number,
  anatomy: BodyAnatomy,
  side: 1 | -1,  // +1 = bras droit, -1 = bras gauche
): THREE.Vector3 {
  // y2D = 0 (tête de manche) → près de l'épaule
  // y2D = slHCm (bas de manche) → bout du tube
  const yNorm = p2D.y / slHCm
  const sleeveLengthM = slHCm * CM_TO_M

  // x2D ∈ [-capW/2, capW/2] → angle ∈ [-π, π] autour du bras
  const angle = (p2D.x / (capWCm / 2)) * Math.PI

  // Le rayon de la manche (cm circonférence ≈ 18-20 cm autour du bras adulte)
  // est légèrement plus gros que le bras lui-même pour l'aisance.
  const sleeveR = anatomy.armRadius * 1.7

  // Position le long du bras : depuis épaule vers extérieur
  const baseX = side * anatomy.shoulderWidthM / 2
  const armX = baseX + side * sleeveLengthM * yNorm

  // La manche tourne autour de l'axe du bras (qui est l'axe X)
  // angle=0 → -Y (dessous du bras), angle=±π → +Y (dessus)
  // Note : on inverse pour que le sommet de la tête de manche pointe vers le haut (Y+)
  const y = anatomy.shoulderY + sleeveR * Math.cos(angle)
  const z = sleeveR * Math.sin(angle)

  return new THREE.Vector3(armX, y, z)
}

// ─── Construction de la BufferGeometry par pièce ─────────────────────────────

export interface PieceMesh {
  name: string
  geometry: THREE.BufferGeometry
}

function buildTorsoMesh(
  piece: PieceOutline,
  anatomy: BodyAnatomy,
  side: 1 | -1,
): PieceMesh {
  const { vertices2D, triangles } = triangulatePiece(piece.outline)

  // On bâtit deux versions : moitié droite (xMirror=+1) et moitié gauche (xMirror=-1).
  // Chaque version a son propre set de vertices et ses propres triangles, on les
  // fusionne en remappant les indices.
  const positionsRight = vertices2D.map((p) =>
    projectTorso(p, piece.widthCm, piece.heightCm, anatomy, side, 1),
  )
  const positionsLeft = vertices2D.map((p) =>
    projectTorso(p, piece.widthCm, piece.heightCm, anatomy, side, -1),
  )

  const positions = new Float32Array((positionsRight.length + positionsLeft.length) * 3)
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
  // Triangles moitié droite
  for (let i = 0; i < triangles.length; i++) indices.push(triangles[i])
  // Triangles moitié gauche : on inverse l'orientation pour que les normales pointent
  // toujours vers l'extérieur du corps.
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
  return { name: piece.name, geometry: geo }
}

function buildSleeveMesh(
  piece: PieceOutline,
  anatomy: BodyAnatomy,
  side: 1 | -1,
): PieceMesh {
  const { vertices2D, triangles } = triangulatePiece(piece.outline)
  const positions = new Float32Array(vertices2D.length * 3)
  for (let i = 0; i < vertices2D.length; i++) {
    const p3 = projectSleeve(vertices2D[i], piece.widthCm, piece.heightCm, anatomy, side)
    positions[i * 3] = p3.x
    positions[i * 3 + 1] = p3.y
    positions[i * 3 + 2] = p3.z
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
  // Pour la manche on indexe les triangles tels quels et on rend en double-face,
  // ce qui évite de gérer l'orientation (la pièce s'enroule sur 360°).
  geo.setIndex(triangles)
  geo.computeVertexNormals()
  return { name: `sleeve-${side > 0 ? "right" : "left"}`, geometry: geo }
}

// ─── Export principal ────────────────────────────────────────────────────────

export function buildGarmentMesh(measurements: SizeMeasurements): PieceMesh[] {
  const anatomy = makeAnatomy(measurements)
  const front = frontOutline(measurements)
  const back = backOutline(measurements)
  const sleeve = sleeveOutline(measurements)

  return [
    buildTorsoMesh(front, anatomy, 1),
    buildTorsoMesh(back, anatomy, -1),
    buildSleeveMesh(sleeve, anatomy, 1),
    buildSleeveMesh(sleeve, anatomy, -1),
  ]
}
