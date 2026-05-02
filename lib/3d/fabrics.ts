// Presets de tissu pour le rendu visuel du t-shirt 3D.
// Phase 2A : pas de physique, on joue uniquement sur la couleur et les
// propriétés PBR (rugosité, métal) pour évoquer le rendu du tissu.
// Phase 2B (à venir) : ajouterait les paramètres masse, raideur, friction
// pour la simulation Verlet.

export type FabricKey = "jersey" | "cotton" | "viscose" | "denim"

export interface Fabric {
  key: FabricKey
  label: string
  color: string
  roughness: number
  metalness: number
  description: string
  // Propriétés physiques pour la simulation Verlet (Phase 2B).
  // - stiffness ∈ [0,1] : raideur des contraintes de distance. Plus haut =
  //   le tissu garde mieux sa forme, plus bas = il s'allonge sous gravité.
  // - damping ∈ [0,0.1] : friction interne. Réduit l'oscillation.
  // - mass : poids relatif (plus lourd = tombe plus vite, contraintes plus
  //   tendues). Le denim est ~1.4× le jersey.
  stiffness: number
  damping: number
  mass: number
}

export const FABRICS: Record<FabricKey, Fabric> = {
  jersey: {
    key: "jersey",
    label: "Jersey",
    color: "#a78bfa",
    roughness: 0.85,
    metalness: 0.02,
    description: "Tissu extensible, le plus courant pour t-shirt. Souple et confortable.",
    stiffness: 0.35,
    damping: 0.020,
    mass: 1.0,
  },
  cotton: {
    key: "cotton",
    label: "Coton tissé",
    color: "#fef3c7",
    roughness: 0.92,
    metalness: 0.0,
    description: "Tissé non-extensible, mat et stable. Tombée plus rigide.",
    stiffness: 0.65,
    damping: 0.025,
    mass: 1.1,
  },
  viscose: {
    key: "viscose",
    label: "Viscose",
    color: "#fce7f3",
    roughness: 0.55,
    metalness: 0.08,
    description: "Tissu fluide et soyeux, légèrement brillant. Tombée souple.",
    stiffness: 0.40,
    damping: 0.040,
    mass: 0.85,
  },
  denim: {
    key: "denim",
    label: "Denim",
    color: "#3b6cb7",
    roughness: 0.95,
    metalness: 0.0,
    description: "Tissé épais et rigide. Pas idéal pour t-shirt mais bon pour visualiser.",
    stiffness: 0.85,
    damping: 0.030,
    mass: 1.4,
  },
}

export const FABRIC_ORDER: FabricKey[] = ["jersey", "cotton", "viscose", "denim"]
