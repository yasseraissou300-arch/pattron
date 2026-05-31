"use client"

// Créateur de patrons paramétrique : expose les paramètres de design du
// vêtement (aisance, longueur, encolure, manche, évasure…) avec des valeurs par
// défaut dérivées des mensurations. L'utilisatrice ajuste, puis régénère les
// pièces SVG côté serveur. Philosophie « le moins de mesures possible » : tout
// part des mensurations corporelles, les réglages ne sont que des affinages.

import { useMemo, useState } from "react"
import { Loader2, RefreshCw, RotateCcw, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  GARMENT_PARAMS,
  paramDefaults,
  type DesignParams,
  type DesignParamId,
} from "@/lib/patterns/params"
import type { GarmentType } from "@/lib/patterns/index"
import type { SizeMeasurements } from "@/lib/types/pattern"

interface PatternCustomizerProps {
  garmentType: GarmentType
  measurements: SizeMeasurements
  params: DesignParams
  onChange: (params: DesignParams) => void
  onApply: () => void
  isBusy: boolean
}

export function PatternCustomizer({
  garmentType,
  measurements,
  params,
  onChange,
  onApply,
  isBusy,
}: PatternCustomizerProps) {
  const [tooltip, setTooltip] = useState<DesignParamId | null>(null)

  const defs = GARMENT_PARAMS[garmentType]
  const defaults = useMemo(
    () => paramDefaults(garmentType, measurements),
    [garmentType, measurements],
  )

  // Valeur effective d'un paramètre : override saisi, sinon défaut dérivé.
  const valueOf = (id: DesignParamId) => params[id] ?? defaults[id]

  const isDirty = useMemo(
    () => defs.some((d) => valueOf(d.id) !== defaults[d.id]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, defaults, defs],
  )

  const setParam = (id: DesignParamId, value: number) => {
    onChange({ ...params, [id]: value })
  }

  const reset = () => onChange({})

  return (
    <div className="space-y-5 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Personnaliser le patron
          </h3>
        </div>
        {isDirty && (
          <button
            onClick={reset}
            disabled={isBusy}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-purple-600 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Affine la coupe à partir de tes mensurations. Chaque réglage part d&apos;une
        valeur calculée pour toi — déplace un curseur seulement si tu veux changer
        le style.
      </p>

      <div className="grid sm:grid-cols-2 gap-x-5 gap-y-4">
        {defs.map((def) => {
          const value = valueOf(def.id)
          const overridden = params[def.id] !== undefined && value !== defaults[def.id]
          return (
            <div key={def.id} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <label className="text-sm text-gray-700 truncate">{def.label}</label>
                  <button
                    type="button"
                    onClick={() => setTooltip(tooltip === def.id ? null : def.id)}
                    className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] leading-none flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 transition-colors flex-shrink-0"
                    aria-label={`Aide : ${def.label}`}
                  >
                    ?
                  </button>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums flex-shrink-0",
                    overridden ? "text-purple-600" : "text-gray-500",
                  )}
                >
                  {value.toFixed(value % 1 === 0 ? 0 : 1)} {def.unit}
                </span>
              </div>

              {tooltip === def.id && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2.5 py-1.5">
                  {def.description}
                </p>
              )}

              <input
                type="range"
                min={def.min}
                max={def.max}
                step={def.step}
                value={value}
                disabled={isBusy}
                onChange={(e) => setParam(def.id, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
              />
              <div className="flex justify-between text-[10px] text-gray-400 tabular-nums">
                <span>{def.min}</span>
                <span>{def.max}</span>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onApply}
        disabled={!isDirty || isBusy}
        className={cn(
          "w-full flex items-center justify-center gap-2 font-semibold py-2.5 px-6 rounded-xl border-2 transition-colors",
          !isDirty || isBusy
            ? "border-gray-200 text-gray-400 cursor-not-allowed"
            : "border-purple-600 text-purple-600 hover:bg-purple-50",
        )}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Régénération…
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Régénérer le patron
          </>
        )}
      </button>
    </div>
  )
}
