// Modèle de pose pour le mannequin articulé + bibliothèque de poses préréglées.
//
// Une pose est un jeu d'angles d'articulation EN DEGRÉS, dans une convention
// stable partagée par les presets, l'UI et le générateur IA :
//   - Bras au repos = le long du corps (pointant vers le bas).
//   - shoulderRaise : abduction, écarte le bras du corps vers l'extérieur
//       (0 = bras baissé, 90 = bras à l'horizontale "T", 170 = bras levé).
//   - shoulderFront : flexion, lève le bras vers l'avant (+) ou l'arrière (−).
//   - elbow : flexion du coude (0 = tendu, 150 = très plié).
//   - hipFront : flexion de hanche, lève la cuisse vers l'avant (+).
//   - hipSide : abduction de hanche, écarte la jambe vers l'extérieur (+).
//   - knee : flexion du genou (0 = tendu, 150 = très plié).
//   - torsoTilt/Turn/Side : inclinaison avant, rotation, inclinaison latérale.
//   - neckTilt : inclinaison de la tête avant/arrière.

export interface Pose {
  torsoTilt: number
  torsoTurn: number
  torsoSide: number
  neckTilt: number
  lShoulderRaise: number
  lShoulderFront: number
  lElbow: number
  rShoulderRaise: number
  rShoulderFront: number
  rElbow: number
  lHipFront: number
  lHipSide: number
  lKnee: number
  rHipFront: number
  rHipSide: number
  rKnee: number
}

export type JointId = keyof Pose

// Bornes (en degrés) — l'IA et l'UI clampent à ces valeurs.
export const JOINT_RANGES: Record<JointId, { min: number; max: number }> = {
  torsoTilt: { min: -30, max: 45 },
  torsoTurn: { min: -60, max: 60 },
  torsoSide: { min: -30, max: 30 },
  neckTilt: { min: -40, max: 40 },
  lShoulderRaise: { min: -10, max: 170 },
  lShoulderFront: { min: -70, max: 170 },
  lElbow: { min: 0, max: 150 },
  rShoulderRaise: { min: -10, max: 170 },
  rShoulderFront: { min: -70, max: 170 },
  rElbow: { min: 0, max: 150 },
  lHipFront: { min: -30, max: 120 },
  lHipSide: { min: -10, max: 45 },
  lKnee: { min: 0, max: 150 },
  rHipFront: { min: -30, max: 120 },
  rHipSide: { min: -10, max: 45 },
  rKnee: { min: 0, max: 150 },
}

export const JOINT_IDS = Object.keys(JOINT_RANGES) as JointId[]

// Pose neutre détendue (A-pose) : bras légèrement écartés et coudes à peine pliés.
export const NEUTRAL_POSE: Pose = {
  torsoTilt: 0,
  torsoTurn: 0,
  torsoSide: 0,
  neckTilt: 0,
  lShoulderRaise: 9,
  lShoulderFront: 0,
  lElbow: 6,
  rShoulderRaise: 9,
  rShoulderFront: 0,
  rElbow: 6,
  lHipFront: 0,
  lHipSide: 3,
  lKnee: 0,
  rHipFront: 0,
  rHipSide: 3,
  rKnee: 0,
}

export function clampPose(p: Partial<Pose>): Pose {
  const out = { ...NEUTRAL_POSE }
  for (const id of JOINT_IDS) {
    const v = p[id]
    if (typeof v === "number" && Number.isFinite(v)) {
      const { min, max } = JOINT_RANGES[id]
      out[id] = Math.min(max, Math.max(min, v))
    }
  }
  return out
}

function pose(partial: Partial<Pose>): Pose {
  return clampPose(partial)
}

export interface PosePreset {
  id: string
  label: string
  emoji: string
  pose: Pose
}

// Bibliothèque de poses préréglées.
export const POSE_PRESETS: PosePreset[] = [
  {
    id: "neutre",
    label: "Neutre",
    emoji: "🧍",
    pose: NEUTRAL_POSE,
  },
  {
    id: "tpose",
    label: "T-pose",
    emoji: "🧎",
    pose: pose({ lShoulderRaise: 90, rShoulderRaise: 90, lElbow: 0, rElbow: 0 }),
  },
  {
    id: "bras-leves",
    label: "Bras levés",
    emoji: "🙌",
    pose: pose({ lShoulderRaise: 165, rShoulderRaise: 165, lElbow: 6, rElbow: 6 }),
  },
  {
    id: "mains-hanches",
    label: "Mains sur les hanches",
    emoji: "🤷",
    pose: pose({
      lShoulderRaise: 42,
      rShoulderRaise: 42,
      lShoulderFront: 18,
      rShoulderFront: 18,
      lElbow: 115,
      rElbow: 115,
    }),
  },
  {
    id: "salut",
    label: "Salut",
    emoji: "👋",
    pose: pose({
      rShoulderRaise: 150,
      rShoulderFront: 10,
      rElbow: 35,
      lShoulderRaise: 10,
    }),
  },
  {
    id: "contrapposto",
    label: "Contrapposto",
    emoji: "💃",
    pose: pose({
      torsoSide: 8,
      torsoTurn: 12,
      rHipSide: 6,
      rKnee: 16,
      lHipFront: -6,
      lShoulderRaise: 12,
      rShoulderRaise: 14,
    }),
  },
  {
    id: "marche",
    label: "Marche",
    emoji: "🚶",
    pose: pose({
      rHipFront: 26,
      rKnee: 12,
      lHipFront: -18,
      lKnee: 28,
      rShoulderFront: -22,
      rElbow: 22,
      lShoulderFront: 26,
      lElbow: 24,
    }),
  },
  {
    id: "course",
    label: "Course",
    emoji: "🏃",
    pose: pose({
      torsoTilt: 14,
      rHipFront: 48,
      rKnee: 70,
      lHipFront: -28,
      lKnee: 40,
      rShoulderFront: -40,
      rElbow: 70,
      lShoulderFront: 55,
      lElbow: 75,
    }),
  },
  {
    id: "assise",
    label: "Assise",
    emoji: "🪑",
    pose: pose({
      lHipFront: 90,
      rHipFront: 90,
      lKnee: 90,
      rKnee: 90,
      lShoulderFront: 12,
      rShoulderFront: 12,
      lShoulderRaise: 6,
      rShoulderRaise: 6,
    }),
  },
]

export function presetById(id: string): PosePreset | undefined {
  return POSE_PRESETS.find((p) => p.id === id)
}
