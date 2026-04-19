"use client"

import type { PatternResult } from "@/lib/types/pattern"

interface SewingGuideProps {
  result: PatternResult
}

export function SewingGuide({ result }: SewingGuideProps) {
  const { sewingGuide, fabricNeededCm, estimatedTimeMinutes, difficulty } = result

  const hours = Math.floor(estimatedTimeMinutes / 60)
  const minutes = estimatedTimeMinutes % 60

  const materials = [
    `${fabricNeededCm} cm de jersey ou tissu extensible (140 cm de laize)`,
    "Fil à coudre assorti",
    "Aiguille jersey pour machine à coudre",
    "Épingles ou clips de couture",
    "Fer à repasser + planche à repasser",
    "Ciseaux à tissu",
    "Craie ou marqueur soluble pour tissu",
  ]

  return (
    <div className="space-y-6">
      {/* En-tête récapitulatif */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">
            {hours > 0 ? `${hours}h${minutes > 0 ? minutes : ""}` : `${minutes}min`}
          </p>
          <p className="text-xs text-purple-500 mt-1">Temps estimé</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">
            {"★".repeat(difficulty)}{"☆".repeat(5 - difficulty)}
          </p>
          <p className="text-xs text-purple-500 mt-1">Difficulté</p>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
          <p className="text-2xl font-bold text-purple-700">{result.pieces.length}</p>
          <p className="text-xs text-purple-500 mt-1">Pièces à couper</p>
        </div>
      </div>

      {/* Matériel nécessaire */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3
          className="font-semibold text-gray-900 mb-3"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Matériel nécessaire
        </h3>
        <ul className="space-y-2">
          {materials.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
              <span className="text-purple-400 mt-0.5 flex-shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Étapes de couture */}
      <div className="space-y-4">
        <h3
          className="font-semibold text-gray-900"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Guide pas-à-pas
        </h3>
        {sewingGuide.map((step) => (
          <div
            key={step.step}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <div className="flex items-start gap-4 p-4">
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                {step.step}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{step.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{step.instruction}</p>
              </div>
            </div>
            {step.tip && (
              <div className="bg-amber-50 border-t border-amber-100 px-4 py-3 flex items-start gap-2">
                <span className="text-amber-500 text-xs font-bold flex-shrink-0 mt-0.5">Astuce</span>
                <p className="text-xs text-amber-700 leading-relaxed">{step.tip}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
