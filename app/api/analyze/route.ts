// Route POST /api/analyze
// Reçoit une image base64, appelle Claude Vision, retourne l'analyse JSON

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { analyzeGarmentImage } from "@/lib/ai"

const RequestSchema = z.object({
  image: z.string().min(1, "L'image est requise"),
  mediaType: z
    .enum(["image/jpeg", "image/png", "image/gif", "image/webp"])
    .optional()
    .default("image/jpeg"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, mediaType } = RequestSchema.parse(body)

    // Vérification basique : s'assurer que c'est du base64
    if (!image.match(/^[A-Za-z0-9+/=]+$/)) {
      return NextResponse.json(
        { error: "L'image doit être encodée en base64." },
        { status: 400 }
      )
    }

    // Vérification taille : max ~10 Mo en base64
    if (image.length > 13_500_000) {
      return NextResponse.json(
        { error: "L'image est trop volumineuse. Limite : 10 Mo." },
        { status: 413 }
      )
    }

    const analysis = await analyzeGarmentImage(image, mediaType)

    return NextResponse.json(analysis)
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

    // Erreur réseau Anthropic
    const message = error instanceof Error ? error.message : "Erreur inconnue"
    if (message.includes("rate") || message.includes("429")) {
      return NextResponse.json(
        {
          error:
            "Oups, notre IA a besoin d'une pause. Réessaie dans 10 secondes.",
        },
        { status: 429 }
      )
    }

    console.error("[/api/analyze]", error)
    return NextResponse.json(
      {
        error:
          "Une erreur est survenue lors de l'analyse. Réessaie avec une autre photo.",
      },
      { status: 500 }
    )
  }
}
