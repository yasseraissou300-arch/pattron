// Wrapper Claude Vision pour l'analyse de vêtements
// Utilise claude-sonnet-4-6 avec prompt caching pour optimiser les coûts

import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Schéma de validation zod pour la réponse de Claude
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

export async function analyzeGarmentImage(
  imageBase64: string,
  mediaType: MediaType = "image/jpeg"
): Promise<GarmentAnalysis> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        // Cache le prompt système pour réduire les coûts (TTL 5 min)
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: "Analyse ce vêtement et retourne l'objet JSON comme demandé.",
          },
        ],
      },
    ],
  })

  const rawText =
    response.content[0].type === "text" ? response.content[0].text.trim() : ""

  // Extraction robuste du JSON (au cas où Claude ajouterait du texte)
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("L'IA n'a pas retourné un JSON valide")
  }

  const parsed = JSON.parse(jsonMatch[0])
  return GarmentAnalysisSchema.parse(parsed)
}
