"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { GarmentAnalysis } from "@/lib/ai"

interface AnalysisPanelProps {
  analysis: GarmentAnalysis
  onConfirm: () => void
  onRetry: () => void
}

const TYPE_LABELS: Record<GarmentAnalysis["type"], string> = {
  tshirt: "T-shirt",
  dress: "Robe",
  skirt: "Jupe",
  pants: "Pantalon",
  shirt: "Chemise",
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Très facile",
  2: "Facile",
  3: "Intermédiaire",
  4: "Avancé",
  5: "Expert",
}

const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-green-100 text-green-700",
  2: "bg-green-100 text-green-700",
  3: "bg-amber-100 text-amber-700",
  4: "bg-orange-100 text-orange-700",
  5: "bg-red-100 text-red-700",
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-purple-100 last:border-0">
      <span className="text-sm text-purple-600 font-medium w-32 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 text-right">{value}</span>
    </div>
  )
}

export function AnalysisPanel({ analysis, onConfirm, onRetry }: AnalysisPanelProps) {
  const confidencePct = Math.round(analysis.confidence * 100)

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-purple-900" style={{ fontFamily: "Outfit, sans-serif" }}>
            Résultat de l&apos;analyse
          </h3>
          <Badge
            className={cn(
              "text-xs font-medium",
              confidencePct >= 80
                ? "bg-green-100 text-green-700 border-green-200"
                : confidencePct >= 60
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-gray-100 text-gray-600 border-gray-200"
            )}
          >
            IA confiante à {confidencePct} %
          </Badge>
        </div>

        <div className="space-y-0">
          <AnalysisRow label="Type" value={TYPE_LABELS[analysis.type]} />
          <AnalysisRow label="Encolure" value={analysis.neckline} />
          <AnalysisRow label="Manches" value={analysis.sleeves} />
          <AnalysisRow label="Coupe" value={analysis.fit} />
          <AnalysisRow label="Longueur" value={analysis.length} />
          <div className="flex items-start justify-between py-2 border-b border-purple-100">
            <span className="text-sm text-purple-600 font-medium w-32 flex-shrink-0">Difficulté</span>
            <Badge
              className={cn(
                "text-xs",
                DIFFICULTY_COLORS[analysis.difficulty]
              )}
            >
              {DIFFICULTY_LABELS[analysis.difficulty]}
            </Badge>
          </div>
          {analysis.details.length > 0 && (
            <div className="flex items-start justify-between py-2">
              <span className="text-sm text-purple-600 font-medium w-32 flex-shrink-0">Détails</span>
              <div className="flex flex-wrap gap-1 justify-end">
                {analysis.details.map((d) => (
                  <Badge key={d} className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                    {d}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onConfirm}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Ces informations me conviennent
        </button>
        <button
          onClick={onRetry}
          className="flex-1 border border-gray-300 hover:border-purple-300 text-gray-700 hover:text-purple-700 font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Reprendre une photo
        </button>
      </div>
    </div>
  )
}
