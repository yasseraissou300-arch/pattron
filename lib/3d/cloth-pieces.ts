// Bridge entre les pièces du patron 3D (PieceMeshData) et le solver Verlet
// (Cloth). Identifie les vertices à épingler en fonction du type de pièce, et
// construit les contraintes de distance + contraintes de couture (rest = 0)
// entre les deux moitiés mirroirées des pièces "au pli".

import { Cloth, type ClothCollision } from "./cloth"
import type { PieceMeshData, BodyAnatomy } from "./pattern-mesh"

const PIN_TOL_CM = 0.6  // tolérance pour qu'un vertex soit considéré "sur la ligne"

function buildCollision(anatomy: BodyAnatomy): ClothCollision {
  return {
    bodyHeights: new Float32Array(anatomy.bodyHeights),
    bodyRadii: new Float32Array(anatomy.bodyRadii),
    shoulderY: anatomy.shoulderY,
    shoulderWidthHalf: anatomy.shoulderWidthM / 2,
    armRadius: anatomy.armRadius,
    armLength: anatomy.armLength,
    inwardMargin: 0.005,  // 5 mm de marge pour éviter le z-fighting
  }
}

/**
 * Identifie les indices 3D à épingler pour une pièce torse mirroirée :
 * - top edge (y2D ≈ 0 → épaule + encolure) → fixe : la pièce reste accrochée au mannequin
 * - side seam (x2D ≈ pwCm → côté du t-shirt) → fixe : les pièces front/back se rejoignent là
 *
 * Le mesh torse stocke d'abord les N vertices de la moitié droite, puis les
 * N vertices de la moitié gauche. On épingle les vertices outline correspondants
 * dans les deux moitiés.
 */
function pinIndicesForTorso(piece: PieceMeshData): Set<number> {
  const pins = new Set<number>()
  const N = piece.vertices2D.length
  for (let i = 0; i < piece.outlineLength; i++) {
    const p = piece.vertices2D[i]
    const onTop = p.y < PIN_TOL_CM
    const onSide = Math.abs(p.x - piece.pwCm) < PIN_TOL_CM
    if (onTop || onSide) {
      pins.add(i)         // moitié droite
      pins.add(N + i)     // moitié gauche (même index 2D, offset par N)
    }
  }
  return pins
}

/**
 * Pour la manche : épingle uniquement la tête (y2D ≈ 0).
 * Le bas de manche tombe sous la gravité.
 */
function pinIndicesForSleeve(piece: PieceMeshData): Set<number> {
  const pins = new Set<number>()
  for (let i = 0; i < piece.outlineLength; i++) {
    const p = piece.vertices2D[i]
    if (p.y < PIN_TOL_CM) pins.add(i)
  }
  return pins
}

/**
 * Construit les contraintes de couture entre les deux moitiés mirroirées
 * d'une pièce "au pli" : pour chaque vertex sur le pli (x2D ≈ 0), la version
 * "moitié droite" et "moitié gauche" doivent rester collées. Rest = 0 dans le
 * solver = ils convergent vers le même point.
 */
function foldStitchPairs(piece: PieceMeshData): {
  i: number[]
  j: number[]
  rest: number[]
} {
  const N = piece.vertices2D.length
  const i: number[] = []
  const j: number[] = []
  const rest: number[] = []
  for (let k = 0; k < piece.outlineLength; k++) {
    const p = piece.vertices2D[k]
    if (p.x < PIN_TOL_CM) {
      // Vertex sur le pli : ajoute couture entre moitié droite (k) et gauche (N+k)
      i.push(k)
      j.push(N + k)
      rest.push(0)
    }
  }
  return { i, j, rest }
}

/**
 * Construit les contraintes de distance (springs) à partir des arêtes des
 * triangles du mesh. Une arête peut apparaître dans deux triangles → on utilise
 * un Set pour dédupliquer.
 */
function buildDistanceConstraints(piece: PieceMeshData): {
  i: number[]
  j: number[]
  rest: number[]
} {
  const seen = new Set<string>()
  const ii: number[] = []
  const jj: number[] = []
  const rest: number[] = []

  const addEdge = (a: number, b: number) => {
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    const key = `${lo}_${hi}`
    if (seen.has(key)) return
    seen.add(key)
    const i3 = lo * 3
    const j3 = hi * 3
    const dx = piece.positions3D[j3] - piece.positions3D[i3]
    const dy = piece.positions3D[j3 + 1] - piece.positions3D[i3 + 1]
    const dz = piece.positions3D[j3 + 2] - piece.positions3D[i3 + 2]
    ii.push(lo)
    jj.push(hi)
    rest.push(Math.sqrt(dx * dx + dy * dy + dz * dz))
  }

  for (let t = 0; t < piece.triangles.length; t += 3) {
    const a = piece.triangles[t]
    const b = piece.triangles[t + 1]
    const c = piece.triangles[t + 2]
    addEdge(a, b)
    addEdge(b, c)
    addEdge(c, a)
  }

  return { i: ii, j: jj, rest }
}

export function buildClothForPiece(
  piece: PieceMeshData,
  anatomy: BodyAnatomy,
): Cloth {
  const totalVerts = piece.positions3D.length / 3
  const pinned = new Uint8Array(totalVerts)

  const pinSet = piece.isTorso
    ? pinIndicesForTorso(piece)
    : pinIndicesForSleeve(piece)
  for (const idx of pinSet) pinned[idx] = 1

  const dist = buildDistanceConstraints(piece)
  const allI = [...dist.i]
  const allJ = [...dist.j]
  const allRest = [...dist.rest]

  // Pour les pièces "au pli" (torso), ajoute les coutures entre les moitiés.
  if (piece.isMirror) {
    const stitch = foldStitchPairs(piece)
    allI.push(...stitch.i)
    allJ.push(...stitch.j)
    allRest.push(...stitch.rest)
  }

  return new Cloth(
    piece.positions3D,
    pinned,
    allI,
    allJ,
    allRest,
    buildCollision(anatomy),
  )
}
