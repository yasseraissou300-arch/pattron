// Wrapper Google Gemini Vision pour l'analyse de vêtements
// Utilise gemini-2.5-flash (tier gratuit généreux, ~1500 req/jour)

import { z } from "zod"

// Schéma de validation zod pour la réponse de l'IA
export const GarmentAnalysisSchema = z.object({
  type: z.enum(["tshirt", "dress", "skirt", "pants", "shirt"]),
  neckline: z.string().min(1),
  sleeves: z.string().min(1),
  fit: z.string().min(1),
  length: z.string().min(1),
  details: z.array(z.string()),
  difficulty: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  confidence: z.number().min(0).max(1),
})

export type GarmentAnalysis = z.infer<typeof GarmentAnalysisSchema>

const SYSTEM_PROMPT = `Tu es un expert patronnier avec 20 ans d'expérience dans la haute couture et la couture amateur. Analyse les photos de vêtements avec précision et retourne UNIQUEMENT un objet JSON valide, sans aucun autre texte, sans balises markdown, sans explications.

Le JSON doit être strictement conforme à ce schéma :
{
  "type": "tshirt" | "dress" | "skirt" | "pants" | "shirt",
  "neckline": string,
  "sleeves": string,
  "fit": string,
  "length": string,
  "details": string[],
  "difficulty": 1 | 2 | 3 | 4 | 5,
  "confidence": number
}

Règles d'évaluation :
- type : classe le vêtement dans la catégorie la plus précise
- neckline : décris l'encolure en français (ex: "ras-du-cou", "col V", "col rond large")
- sleeves : décris les manches (ex: "courtes", "longues", "sans manches", "mi-longues")
- fit : décris la coupe (ex: "droit", "ajusté", "oversize", "évasé")
- length : décris la longueur (ex: "hanches", "mi-cuisse", "genoux", "mi-mollet")
- details : liste les détails notables (ex: ["poche poitrine", "boutonnage devant", "élastique taille"])
- difficulty : 1 = très facile, 5 = expert. Base-toi sur le nombre de pièces et les techniques requises
- confidence : entre 0 et 1, ta certitude sur l'analyse`

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp"

// Schéma structuré demandé à Gemini (JSON mode)
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    type: {
      type: "STRING",
      enum: ["tshirt", "dress", "skirt", "pants", "shirt"],
    },
    neckline: { type: "STRING" },
    sleeves: { type: "STRING" },
    fit: { type: "STRING" },
    length: { type: "STRING" },
    details: { type: "ARRAY", items: { type: "STRING" } },
    difficulty: { type: "INTEGER" },
    confidence: { type: "NUMBER" },
  },
  required: [
    "type",
    "neckline",
    "sleeves",
    "fit",
    "length",
    "details",
    "difficulty",
    "confidence",
  ],
}

const GEMINI_MODEL = "gemini-2.5-flash"
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export async function analyzeGarmentImage(
  imageBase64: string,
  mediaType: MediaType = "image/jpeg"
): Promise<GarmentAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY n'est pas configurée")
  }

  const body = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            inline_data: {
              mime_type: mediaType,
              data: imageBase64,
            },
          },
          {
            text: "Analyse ce vêtement et retourne l'objet JSON comme demandé.",
          },
        ],
      },
    ],
    generationConfig: {
      response_mime_type: "application/json",
      response_schema: RESPONSE_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 512,
    },
  }

  const res = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errTxt = await res.text().catch(() => "")
    throw new Error(`Gemini API ${res.status}: ${errTxt.slice(0, 300)}`)
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""
  if (!rawText) {
    throw new Error("L'IA n'a pas retourné de texte")
  }

  // Extraction robuste du JSON
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("L'IA n'a pas retourné un JSON valide")
  }

  const parsed = JSON.parse(jsonMatch[0])
  return GarmentAnalysisSchema.parse(parsed)
}
