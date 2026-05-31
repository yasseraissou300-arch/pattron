// Solver de simulation de tissu basé sur l'intégration Verlet + résolution
// de contraintes par projection (Position-Based Dynamics simplifié).
//
// Principe :
//   1. Verlet : position_next = position + (position - position_prev) * (1-damping) + accel * dt²
//      → équivalent d'une intégration vélocité implicite.
//   2. Itération sur les contraintes de distance (springs) : on projette les
//      paires de vertices sur leur longueur de repos. Plusieurs passes (5-10)
//      → comportement quasi-rigide avec stiffness élevée.
//   3. Collision avec le corps (cylindres torse + bras) : on pousse les
//      vertices à l'extérieur des surfaces de collision.
//
// Pas de dépendance externe — tout est en TypeScript pur sur des Float32Array
// pour rester rapide. ~700 vertices × 2000 contraintes × 8 itérations ≈ 50K
// opérations par frame, largement tenable à 60 FPS.

export interface ClothCollision {
  // Cylindre torse vertical : succession de couples (hauteur, rayon).
  // Le solver interpole linéairement le rayon en fonction de la hauteur.
  bodyHeights: Float32Array
  bodyRadii: Float32Array
  // Bras horizontaux (cylindres) : un par côté.
  shoulderY: number
  shoulderWidthHalf: number
  armRadius: number
  armLength: number
  // Marge inward pour éviter le z-fighting visuel
  inwardMargin: number
}

export interface ClothParams {
  stiffness: number   // [0,1]
  damping: number     // [0,0.1]
  mass: number        // 1 = jersey de référence
  gravity: number     // m/s² (9.81 typique, on peut diminuer pour calmer la sim)
  iterations: number  // 6-10 pour stabilité
}

export class Cloth {
  readonly n: number
  readonly positions: Float32Array
  private prev: Float32Array
  private readonly pinned: Uint8Array
  private readonly originalPinned: Uint8Array      // épingles structurelles (jamais retirées par le pinçage)
  private readonly pinPositions: Float32Array  // positions de référence des vertices épinglés
  private readonly pinches = new Set<number>() // pincements utilisateur actifs
  private readonly pairsI: Int32Array
  private readonly pairsJ: Int32Array
  private readonly rest: Float32Array
  private readonly collision: ClothCollision

  constructor(
    initialPositions: Float32Array,
    pinned: Uint8Array,
    pairsI: number[],
    pairsJ: number[],
    rest: number[],
    collision: ClothCollision,
  ) {
    this.n = initialPositions.length / 3
    this.positions = initialPositions.slice()
    this.prev = initialPositions.slice()
    this.pinned = pinned
    this.originalPinned = pinned.slice()
    this.pinPositions = initialPositions.slice()
    this.pairsI = new Int32Array(pairsI)
    this.pairsJ = new Int32Array(pairsJ)
    this.rest = new Float32Array(rest)
    this.collision = collision
  }

  /**
   * Pincement avancé : épingle (ou relâche) un vertex en le tirant vers
   * l'extérieur du corps, comme si on pinçait le tissu entre deux doigts. Les
   * vertices voisins suivent via les contraintes de distance → un pli/relief se
   * forme autour du point. Les épingles structurelles ne sont jamais affectées.
   * @returns true si pincé, false si relâché, null si ignoré.
   */
  togglePinch(i: number, height: number): boolean | null {
    if (i < 0 || i >= this.n || this.originalPinned[i]) return null
    const i3 = i * 3
    if (this.pinches.has(i)) {
      this.pinches.delete(i)
      this.pinned[i] = 0
      return false
    }
    const x = this.positions[i3]
    const y = this.positions[i3 + 1]
    const z = this.positions[i3 + 2]
    let dx = x
    let dz = z
    const len = Math.hypot(dx, dz)
    if (len > 1e-4) {
      dx /= len
      dz /= len
    } else {
      dx = 0
      dz = 1
    }
    const tx = x + dx * height
    const tz = z + dz * height
    this.pinned[i] = 1
    this.pinPositions[i3] = tx
    this.pinPositions[i3 + 1] = y
    this.pinPositions[i3 + 2] = tz
    this.positions[i3] = tx
    this.positions[i3 + 2] = tz
    this.prev[i3] = tx
    this.prev[i3 + 2] = tz
    this.pinches.add(i)
    return true
  }

  clearPinches(): void {
    for (const i of this.pinches) this.pinned[i] = 0
    this.pinches.clear()
  }

  get pinchCount(): number {
    return this.pinches.size
  }

  step(dt: number, p: ClothParams): void {
    const { positions, prev, pinned } = this
    const dt2 = dt * dt
    const damp = 1 - p.damping
    const gAccel = p.gravity * p.mass

    // 1. Intégration Verlet pour les vertices non épinglés.
    for (let i = 0; i < this.n; i++) {
      if (pinned[i]) continue
      const i3 = i * 3
      // X
      let cur = positions[i3]
      let prv = prev[i3]
      let next = cur + (cur - prv) * damp
      prev[i3] = cur
      positions[i3] = next
      // Y (gravité)
      cur = positions[i3 + 1]
      prv = prev[i3 + 1]
      next = cur + (cur - prv) * damp - gAccel * dt2
      prev[i3 + 1] = cur
      positions[i3 + 1] = next
      // Z
      cur = positions[i3 + 2]
      prv = prev[i3 + 2]
      next = cur + (cur - prv) * damp
      prev[i3 + 2] = cur
      positions[i3 + 2] = next
    }

    // 2. Itérations de contraintes + clamp des pins après chaque passe.
    for (let iter = 0; iter < p.iterations; iter++) {
      this.solveDistanceConstraints(p.stiffness)
      this.clampPins()
    }

    // 3. Collision (une seule fois en fin de pas — plus stable que dans la boucle).
    this.collide()
    this.clampPins()
  }

  private solveDistanceConstraints(stiffness: number): void {
    const { positions, pinned, pairsI, pairsJ, rest } = this
    const m = pairsI.length
    for (let k = 0; k < m; k++) {
      const i = pairsI[k]
      const j = pairsJ[k]
      const i3 = i * 3
      const j3 = j * 3
      const dx = positions[j3] - positions[i3]
      const dy = positions[j3 + 1] - positions[i3 + 1]
      const dz = positions[j3 + 2] - positions[i3 + 2]
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (d < 1e-9) continue
      const r = rest[k]
      const f = ((d - r) / d) * stiffness

      const aPin = pinned[i]
      const bPin = pinned[j]
      if (aPin && bPin) continue

      const wa = aPin ? 0 : 1
      const wb = bPin ? 0 : 1
      const wt = wa + wb

      if (wa) {
        const t = (f * wa) / wt
        positions[i3] += dx * t
        positions[i3 + 1] += dy * t
        positions[i3 + 2] += dz * t
      }
      if (wb) {
        const t = (f * wb) / wt
        positions[j3] -= dx * t
        positions[j3 + 1] -= dy * t
        positions[j3 + 2] -= dz * t
      }
    }
  }

  private clampPins(): void {
    const { positions, pinned, pinPositions } = this
    for (let i = 0; i < this.n; i++) {
      if (!pinned[i]) continue
      const i3 = i * 3
      positions[i3] = pinPositions[i3]
      positions[i3 + 1] = pinPositions[i3 + 1]
      positions[i3 + 2] = pinPositions[i3 + 2]
    }
  }

  private bodyRadiusAt(y: number): number {
    const { bodyHeights: h, bodyRadii: r } = this.collision
    const last = h.length - 1
    if (y <= h[0]) return r[0]
    if (y >= h[last]) return r[last]
    for (let i = 0; i < last; i++) {
      if (y >= h[i] && y <= h[i + 1]) {
        const t = (y - h[i]) / (h[i + 1] - h[i])
        return r[i] + (r[i + 1] - r[i]) * t
      }
    }
    return r[last]
  }

  private collide(): void {
    const { positions, pinned } = this
    const c = this.collision
    const torsoTop = c.bodyHeights[c.bodyHeights.length - 1]
    const torsoBottom = c.bodyHeights[0]
    const margin = c.inwardMargin

    for (let i = 0; i < this.n; i++) {
      if (pinned[i]) continue
      const i3 = i * 3
      let x = positions[i3]
      let y = positions[i3 + 1]
      let z = positions[i3 + 2]

      // Torse — cylindre vertical à rayon variable
      if (y > torsoBottom - 0.05 && y < torsoTop + 0.05) {
        const r = this.bodyRadiusAt(y) + margin
        const distXZ = Math.sqrt(x * x + z * z)
        if (distXZ < r && distXZ > 1e-6) {
          const s = r / distXZ
          x *= s
          z *= s
        }
      }

      // Bras gauche & droit — cylindres horizontaux le long de l'axe X
      for (const side of [-1, 1] as const) {
        const armStart = side * c.shoulderWidthHalf
        const armEnd = armStart + side * c.armLength
        const minX = Math.min(armStart, armEnd)
        const maxX = Math.max(armStart, armEnd)
        if (x >= minX - 0.02 && x <= maxX + 0.02) {
          const dy = y - c.shoulderY
          const dz = z
          const d = Math.sqrt(dy * dy + dz * dz)
          const ar = c.armRadius + margin
          if (d < ar && d > 1e-6) {
            const s = ar / d
            y = c.shoulderY + dy * s
            z = dz * s
          }
        }
      }

      positions[i3] = x
      positions[i3 + 1] = y
      positions[i3 + 2] = z
    }
  }

  /**
   * Reset la simulation à ses positions initiales (utile lors d'un changement
   * de mesures qui régénère la géométrie sous-jacente).
   */
  reset(positions: Float32Array): void {
    this.positions.set(positions)
    this.prev.set(positions)
    this.pinPositions.set(positions)
    for (const i of this.pinches) this.pinned[i] = 0
    this.pinches.clear()
  }
}
