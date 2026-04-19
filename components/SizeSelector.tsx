"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { EU_SIZES, EU_SIZE_ORDER } from "@/lib/sizes"
import type { EuSize, SizeMeasurements } from "@/lib/types/pattern"

interface SizeSelectorProps {
  selectedSizes: EuSize[]
  onSizesChange: (sizes: EuSize[]) => void
  useCustom: boolean
  onUseCustomChange: (value: boolean) => void
  customMeasurements: Partial<SizeMeasurements>
  onCustomMeasurementsChange: (m: Partial<SizeMeasurements>) => void
  onNext: () => void
}

const MEASUREMENT_FIELDS: {
  key: keyof SizeMeasurements
  label: string
  tooltip: string
  min: number
  max: number
}[] = [
  {
    key: "poitrine",
    label: "Tour de poitrine",
    tooltip: "Mesure la partie la plus forte de ta poitrine, en passant sous les bras.",
    min: 60,
    max: 160,
  },
  {
    key: "taille",
    label: "Tour de taille",
    tooltip: "Mesure au niveau du creux naturel de ta taille, le point le plus étroit.",
    min: 50,
    max: 140,
  },
  {
    key: "hanches",
    label: "Tour de hanches",
    tooltip: "Mesure la partie la plus forte de tes hanches, environ 20 cm sous la taille.",
    min: 70,
    max: 170,
  },
  {
    key: "epaule",
    label: "Largeur d'épaule",
    tooltip: "Mesure d'une pointe d'épaule à l'autre, dans le dos.",
    min: 30,
    max: 55,
  },
  {
    key: "longueurManche",
    label: "Longueur de manche",
    tooltip: "Mesure de la pointe d'épaule jusqu'au bas de la manche souhaitée.",
    min: 5,
    max: 70,
  },
  {
    key: "longueurDos",
    label: "Longueur du dos",
    tooltip: "Mesure de la 7e vertèbre cervicale (nuque) jusqu'à la taille.",
    min: 45,
    max: 85,
  },
]

export function SizeSelector({
  selectedSizes,
  onSizesChange,
  useCustom,
  onUseCustomChange,
  customMeasurements,
  onCustomMeasurementsChange,
  onNext,
}: SizeSelectorProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null)

  const toggleSize = (size: EuSize) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length === 1) return
      onSizesChange(selectedSizes.filter((s) => s !== size))
    } else {
      onSizesChange([...selectedSizes, size])
    }
  }

  const isCustomValid = MEASUREMENT_FIELDS.every((f) => {
    const val = customMeasurements[f.key]
    return typeof val === "number" && val >= f.min && val <= f.max
  })

  const canProceed = useCustom ? isCustomValid : selectedSizes.length > 0

  return (
    <div className="space-y-6">
      {/* Toggle EU / Custom */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit mx-auto">
        <button
          onClick={() => onUseCustomChange(false)}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
            !useCustom
              ? "bg-white text-purple-700 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          )}
        >
          Tailles EU standards
        </button>
        <button
          onClick={() => onUseCustomChange(true)}
          className={cn(
            "px-5 py-2 rounded-lg text-sm font-medium transition-colors",
            useCustom
              ? "bg-white text-purple-700 shadow-sm"
              : "text-gray-600 hover:text-gray-800"
          )}
        >
          Mes mesures
        </button>
      </div>

      {!useCustom ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            Sélectionne une ou plusieurs tailles pour générer les patrons correspondants.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {EU_SIZE_ORDER.map((size) => {
              const m = EU_SIZES[size]
              const isSelected = selectedSizes.includes(size)
              return (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={cn(
                    "rounded-xl border-2 p-3 text-center transition-all",
                    isSelected
                      ? "border-purple-400 bg-purple-50"
                      : "border-gray-200 hover:border-purple-200 hover:bg-purple-50/30"
                  )}
                >
                  <div
                    className={cn(
                      "font-bold text-lg",
                      isSelected ? "text-purple-700" : "text-gray-700"
                    )}
                  >
                    {size}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">P {m.poitrine}</div>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-center text-gray-400">
            P = tour de poitrine en cm
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 text-center">
            Saisis tes mesures en centimètres pour un patron fait sur mesure.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {MEASUREMENT_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setShowTooltip(showTooltip === field.key ? null : field.key)
                    }
                    className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors"
                  >
                    ?
                  </button>
                </div>
                {showTooltip === field.key && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    {field.tooltip}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    value={customMeasurements[field.key] ?? ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value)
                      onCustomMeasurementsChange({
                        ...customMeasurements,
                        [field.key]: isNaN(val) ? undefined : val,
                      })
                    }}
                    placeholder={`${field.min}–${field.max}`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                  />
                  <span className="text-sm text-gray-500 flex-shrink-0">cm</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors"
      >
        Générer mon patron
      </button>
    </div>
  )
}
