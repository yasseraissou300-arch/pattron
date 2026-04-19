"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { PatternResult, EuSize } from "@/lib/types/pattern"

interface PatternViewerProps {
  patternBySize: Record<string, PatternResult>
  selectedSizes: EuSize[]
  useCustom: boolean
}

export function PatternViewer({ patternBySize, selectedSizes, useCustom }: PatternViewerProps) {
  const tabs = useCustom ? ["Personnalisé"] : selectedSizes
  const [activeTab, setActiveTab] = useState<string>(tabs[0] ?? "M")

  const current = patternBySize[activeTab]
  if (!current) return null

  return (
    <div className="space-y-6">
      {/* Onglets de tailles */}
      {tabs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((size) => (
            <button
              key={size}
              onClick={() => setActiveTab(size)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-colors flex-shrink-0",
                activeTab === size
                  ? "bg-purple-600 text-white border-purple-600"
                  : "border-gray-300 text-gray-600 hover:border-purple-300"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      )}

      {/* Informations du patron */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <span className="text-green-600 font-medium">Tissu nécessaire :</span>
          <span className="text-green-700">{current.fabricNeededCm} cm</span>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          <span className="text-blue-600 font-medium">Temps estimé :</span>
          <span className="text-blue-700">{Math.round(current.estimatedTimeMinutes / 60)}h{current.estimatedTimeMinutes % 60 > 0 ? `${current.estimatedTimeMinutes % 60}min` : ""}</span>
        </div>
        <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
          <span className="text-purple-600 font-medium">Difficulté :</span>
          <span className="text-purple-700">{"★".repeat(current.difficulty)}{"☆".repeat(5 - current.difficulty)}</span>
        </div>
      </div>

      {/* Grille des pièces SVG */}
      <div className="grid sm:grid-cols-2 gap-4">
        {current.pieces.map((piece) => (
          <div
            key={piece.name}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-purple-200 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 text-sm">{piece.name}</h3>
              <div className="flex gap-1">
                <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                  × {piece.cutCount}
                </span>
                {piece.onFold && (
                  <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-2 py-0.5">
                    au pli
                  </span>
                )}
              </div>
            </div>

            {/* Rendu SVG inline */}
            <div
              className="w-full overflow-auto bg-gray-50 rounded-lg flex items-center justify-center"
              style={{ minHeight: "180px", maxHeight: "280px" }}
              dangerouslySetInnerHTML={{ __html: piece.svg }}
            />

            <p className="text-xs text-gray-400 mt-2 text-center">
              {piece.widthCm.toFixed(1)} × {piece.heightCm} cm
              {piece.onFold ? " (déployé)" : ""}
            </p>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-600 space-y-1">
        <p className="font-medium text-gray-700 mb-2">Légende du patron :</p>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-800" />
          <span>Trait de coupe (découper ici)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed border-red-500" />
          <span>Ligne de couture (1 cm, coudre ici)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-800" />
          <span>Crans de montage (points de repère)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t border-dashed border-purple-500" />
          <span>Pliure (ne pas couper)</span>
        </div>
      </div>
    </div>
  )
}
