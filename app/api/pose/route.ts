// Route POST /api/pose
// Reçoit une description en mots-clés, renvoie un jeu d'angles d'articulation.

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generatePoseFromText } from "@/lib/pose-ai"

const RequestSchema = z.object({
  prompt: z
    .string()
    .min(2, "Décris la pose en quelques mots.")
    .max(300, "Description trop longue (300 caractères max)."),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt } = RequestSchema.parse(body)

    const pose = await generatePoseFromText(prompt)

    return NextResponse.json({ pose })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides : " + (error.issues[0]?.message ?? "champ manquant") },
        { status: 400 }
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Format de requête invalide. Envoie un JSON valide." },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : "Erreur inconnue"
    if (message.includes("rate") || message.includes("429")) {
      return NextResponse.json(
        { error: "Oups, l'IA a besoin d'une pause. Réessaie dans 10 secondes." },
        { status: 429 }
      )
    }
    if (message.includes("503") || message.includes("UNAVAILABLE") || message.includes("502")) {
      return NextResponse.json(
        { error: "Le service d'IA est saturé. Réessaie dans 1-2 minutes." },
        { status: 503 }
      )
    }

    console.error("[/api/pose]", error)
    return NextResponse.json(
      {
        error: "Impossible de générer la pose. Réessaie avec une autre description.",
        debug: {
          message: error instanceof Error ? error.message : String(error),
          hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
        },
      },
      { status: 500 }
    )
  }
}
