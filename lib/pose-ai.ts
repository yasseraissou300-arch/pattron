// Génération de pose à partir de mots-clés via Google Gemini.
// Renvoie un jeu d'angles d'articulation (degrés) appliqué au mannequin articulé.
// Mêmes garde-fous que lib/ai.ts : JSON mode, retry/backoff, parsing robuste.

import { JOINT_IDS, JOINT_RANGES, clampPose, type Pose } from "@/lib/3d/poses"

// Chaîne de repli : quotas gratuits séparés par modèle (cf. lib/ai.ts).
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]
const endpointFor = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

// Description des bornes injectée dans le prompt (source unique : JOINT_RANGES).
const RANGES_DOC = JOINT_IDS.map(
  (id) => `  - ${id} : ${JOINT_RANGES[id].min}° à ${JOINT_RANGES[id].max}°`,
).join("\n")

const SYSTEM_PROMPT = `Tu es un directeur artistique qui pose des mannequins 3D. À partir d'une description en langage naturel (français), tu produis les angles d'articulation d'un avatar humanoïde.

Retourne UNIQUEMENT un objet JSON valide, sans texte ni markdown. Toutes les valeurs sont des nombres en DEGRÉS. Omets les articulations qui restent au repos (elles valent 0 par défaut).

Convention des angles (très important) :
- Bras au repos = le long du corps, pointant vers le bas.
- shoulderRaise (épaule, abduction) : écarte le bras du corps. 0 = baissé, 90 = bras à l'horizontale, 170 = bras levé au-dessus de la tête.
- shoulderFront (épaule, flexion) : positif = bras vers l'AVANT, négatif = vers l'arrière.
- elbow (coude) : 0 = tendu, 90 = plié à angle droit, 150 = très plié.
- hipFront (hanche, flexion) : positif = cuisse levée vers l'avant (s'asseoir, marcher).
- hipSide (hanche, abduction) : positif = jambe écartée vers l'extérieur.
- knee (genou) : 0 = tendu, 90 = plié à angle droit.
- torsoTilt : positif = penché vers l'avant. torsoTurn : rotation du buste. torsoSide : inclinaison latérale.
- neckTilt : inclinaison de la tête (positif = vers l'avant).
- Préfixes l = gauche, r = droite (du point de vue de l'avatar).

Articulations disponibles et bornes :
${RANGES_DOC}

Exemples :
- "bras croisés" → coudes pliés ~120, épaules légèrement en avant et abduction ~30.
- "il salue de la main droite" → rShoulderRaise ~150, rElbow ~35.
- "position de yoga, une jambe levée" → une hanche fléchie, genou plié.
Sois cohérent et plausible anatomiquement.`

// Schéma structuré (toutes les articulations en NUMBER, aucune requise).
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: Object.fromEntries(JOINT_IDS.map((id) => [id, { type: "NUMBER" }])),
}

export async function generatePoseFromText(prompt: string): Promise<Pose> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY n'est pas configurée")
  }

  const makeBody = (model: string) => ({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [
      {
        role: "user",
        parts: [{ text: `Décris cette pose en angles JSON : « ${prompt} »` }],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: RESPONSE_SCHEMA,
      temperature: 0.4,
      // Option "thinking" propre aux modèles 2.5 (cf. lib/ai.ts).
      ...(model.startsWith("gemini-2.5")
        ? { thinkingConfig: { thinkingBudget: 0 } }
        : {}),
      maxOutputTokens: 1024,
    },
  })

  const RETRY_DELAYS_MS = [800, 2400]
  let lastErr: { status: number; body: string } | null = null

  for (const model of GEMINI_MODELS) {
    const body = makeBody(model)

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      const res = await fetch(endpointFor(model), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        return await parsePoseResponse(res)
      }

      const errTxt = await res.text().catch(() => "")
      lastErr = { status: res.status, body: errTxt.slice(0, 300) }

      const retriable =
        res.status === 503 || res.status === 502 || res.status === 500 || res.status === 429
      if (!retriable) {
        throw new Error(`Gemini API ${lastErr.status}: ${lastErr.body}`)
      }
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]))
      }
    }
    console.warn(`[pose-ai] ${model} saturé (${lastErr?.status}), repli sur le modèle suivant`)
  }

  throw new Error(`Gemini API ${lastErr?.status}: ${lastErr?.body}`)
}

async function parsePoseResponse(res: Response): Promise<Pose> {
  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
      finishReason?: string
    }>
  }

  const candidate = data.candidates?.[0]
  const rawText = (candidate?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim()

  if (!rawText) {
    throw new Error(
      `L'IA n'a pas retourné de texte (finishReason=${candidate?.finishReason ?? "?"})`,
    )
  }

  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error(
      `L'IA n'a pas retourné un JSON valide (début="${rawText.slice(0, 80)}")`,
    )
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>
  // clampPose ne lit que les clés d'articulation numériques connues et borne
  // chaque valeur — il ignore tout champ parasite renvoyé par le modèle.
  return clampPose(parsed as Partial<Pose>)
}
