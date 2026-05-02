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
}

export const FABRICS: Record<FabricKey, Fabric> = {
  jersey: {
    key: "jersey",
    label: "Jersey",
    color: "#a78bfa",
    roughness: 0.85,
    metalness: 0.02,
    description: "Tissu extensible, le plus courant pour t-shirt. Souple et confortable.",
  },
  cotton: {
    key: "cotton",
    label: "Coton tissé",
    color: "#fef3c7",
    roughness: 0.92,
    metalness: 0.0,
    description: "Tissé non-extensible, mat et stable. Tombée plus rigide.",
  },
  viscose: {
    key: "viscose",
    label: "Viscose",
    color: "#fce7f3",
    roughness: 0.55,
    metalness: 0.08,
    description: "Tissu fluide et soyeux, légèrement brillant. Tombée souple.",
  },
  denim: {
    key: "denim",
    label: "Denim",
    color: "#3b6cb7",
    roughness: 0.95,
    metalness: 0.0,
    description: "Tissé épais et rigide. Pas idéal pour t-shirt mais bon pour visualiser.",
  },
}

export const FABRIC_ORDER: FabricKey[] = ["jersey", "cotton", "viscose", "denim"]
