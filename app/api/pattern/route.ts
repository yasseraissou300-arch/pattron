// Route POST /api/pattern
// Reçoit le type de vêtement et les mesures, retourne les pièces SVG

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generatePattern } from "@/lib/patterns/tshirt"

const MeasurementsSchema = z.object({
  poitrine: z.number().min(60).max(160),
  taille: z.number().min(50).max(140),
  hanches: z.number().min(70).max(170),
  epaule: z.number().min(30).max(55),
  longueurManche: z.number().min(5).max(70),
  longueurDos: z.number().min(45).max(85),
})

const RequestSchema = z.object({
  garmentType: z.enum(["tshirt", "dress", "skirt", "pants", "shirt"]),
  measurements: MeasurementsSchema,
  options: z
    .object({
      seamAllowance: z.number().min(0.5).max(3).default(1),
    })
    .optional()
    .default({ seamAllowance: 1 }),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garmentType, measurements, options } = RequestSchema.parse(body)

    // Pour le MVP, seul le t-shirt est disponible
    if (garmentType !== "tshirt") {
      return NextResponse.json(
        {
          error: `Le type "${garmentType}" n'est pas encore disponible. Seul le t-shirt femme est pris en charge pour le moment.`,
        },
        { status: 422 }
      )
    }

    const result = generatePattern(measurements, options.seamAllowance)

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues[0]
      const field = issue?.path?.join(".") ?? "mesure"
      return NextResponse.json(
        { error: `Mesure invalide : ${field}. ${issue?.message ?? "valeur hors limites"}` },
        { status: 400 }
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Format de requête invalide. Envoie un JSON valide." },
        { status: 400 }
      )
    }

    console.error("[/api/pattern]", error)
    return NextResponse.json(
      { error: "Impossible de générer le patron. Vérifie tes mesures et réessaie." },
      { status: 500 }
    )
  }
}
