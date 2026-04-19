// Route POST /api/pdf
// Génère un PDF A4 tuilé ou A0 grand format à partir des données de patron

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generatePattern } from "@/lib/patterns/tshirt"
import { generatePdfA4, generatePdfA0 } from "@/lib/pdf"

const MeasurementsSchema = z.object({
  poitrine: z.number().min(60).max(160),
  taille: z.number().min(50).max(140),
  hanches: z.number().min(70).max(170),
  epaule: z.number().min(30).max(55),
  longueurManche: z.number().min(5).max(70),
  longueurDos: z.number().min(45).max(85),
})

const RequestSchema = z.object({
  garmentType: z.enum(["tshirt"]),
  measurements: MeasurementsSchema,
  sizeName: z.string().default("Personnalisé"),
  format: z.enum(["A4", "A0", "projector"]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { garmentType, measurements, sizeName, format } = RequestSchema.parse(body)

    // Génération des pièces
    const patternResult = generatePattern(measurements)

    let pdfBytes: Uint8Array

    if (format === "A4") {
      pdfBytes = await generatePdfA4(patternResult.pieces, measurements, sizeName)
    } else if (format === "A0") {
      pdfBytes = await generatePdfA0(patternResult.pieces, measurements, sizeName)
    } else {
      // Projecteur : même que A4 mais sans marges de colle, noir sur blanc pur
      pdfBytes = await generatePdfA4(patternResult.pieces, measurements, sizeName)
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="patronai-tshirt-${sizeName}-${format}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
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

    console.error("[/api/pdf]", error)
    return NextResponse.json(
      { error: "Impossible de générer le PDF. Réessaie dans quelques instants." },
      { status: 500 }
    )
  }
}
