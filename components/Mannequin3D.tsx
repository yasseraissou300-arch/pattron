"use client"

// Étape 5 du parcours : aperçu 3D du t-shirt sur mannequin paramétrique
// + sliders de morphologie + presets EU/DZ + bouton de régénération du patron.

import { useState, useMemo } from "react"
import dynamic from "next/dynamic"
import { Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { MORPH_PRESETS, MEASUREMENT_BOUNDS } from "@/lib/3d/presets"
import { FABRICS, FABRIC_ORDER, type FabricKey } from "@/lib/3d/fabrics"
import type { SizeMeasurements } from "@/lib/types/pattern"

// Three.js + r3f ne s'exécutent qu'au client → dynamic import sans SSR.
const MannequinScene = dynamic(
  () => import("./MannequinScene").then((m) => m.MannequinScene),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full aspect-square rounded-xl bg-gradient-to-b from-purple-50 to-gray-100 flex items-center justify-center border border-gray-200">
        <div className="flex items-center gap-2 text-purple-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Chargement du module 3D…</span>
        </div>
      </div>
    ),
  },
)

const SLIDER_FIELDS: { key: keyof SizeMeasurements; label: string }[] = [
  { key: "poitrine",       label: "Tour de poitrine" },
  { key: "taille",         label: "Tour de taille" },
  { key: "hanches",        label: "Tour de hanches" },
  { key: "epaule",         label: "Largeur d'épaule" },
  { key: "longueurManche", label: "Longueur de manche" },
  { key: "longueurDos",    label: "Longueur du dos" },
]

interface Mannequin3DProps {
  initialMeasurements: SizeMeasurements
  onRegenerate: (m: SizeMeasurements) => Promise<void> | void
  onContinue: () => void
  isRegenerating: boolean
}

export function Mannequin3D({
  initialMeasurements,
  onRegenerate,
  onContinue,
  isRegenerating,
}: Mannequin3DProps) {
  const [preview, setPreview] = useState<SizeMeasurements>(initialMeasurements)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [fabric, setFabric] = useState<FabricKey>("jersey")
  const [lastInitial, setLastInitial] = useState<SizeMeasurements>(initialMeasurements)

  // Reset preview lorsque les mesures source changent (passage entrant ou
  // après régénération). Pattern recommandé : ajustement d'état pendant le rendu
  // plutôt que useEffect — voir react.dev/learn/you-might-not-need-an-effect.
  if (lastInitial !== initialMeasurements) {
    setLastInitial(initialMeasurements)
    setPreview(initialMeasurements)
    setActivePreset(null)
  }

  const updateField = (key: keyof SizeMeasurements, value: number) => {
    setPreview((prev) => ({ ...prev, [key]: value }))
    setActivePreset(null)
  }

  const applyPresetByLabel = (label: string) => {
    const preset = MORPH_PRESETS.find((p) => p.label === label)
    if (!preset) return
    setPreview(preset.measurements)
    setActivePreset(label)
  }

  const isDirty = useMemo(() => {
    return SLIDER_FIELDS.some(
      (f) => preview[f.key] !== initialMeasurements[f.key],
    )
  }, [preview, initialMeasurements])

  const handleRegenerate = async () => {
    await onRegenerate(preview)
  }

  return (
    <div className="space-y-6">
      {/* Visualisation 3D */}
      <MannequinScene measurements={preview} fabric={fabric} />

      {/* Sélecteur de tissu */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Tissu
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FABRIC_ORDER.map((key) => {
            const f = FABRICS[key]
            const active = fabric === key
            return (
              <button
                key={key}
                onClick={() => setFabric(key)}
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  active
                    ? "border-purple-600 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: f.color }}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-purple-700" : "text-gray-700",
                    )}
                  >
                    {f.label}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">{f.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Presets EU + DZ */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Presets de mensurations
        </div>
        <div className="flex flex-wrap gap-2">
          {MORPH_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPresetByLabel(p.label)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                activePreset === p.label
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders de morphologie */}
      <div className="space-y-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Ajuste les mensurations en temps réel
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {SLIDER_FIELDS.map((f) => {
            const bounds = MEASUREMENT_BOUNDS[f.key]
            const value = preview[f.key]
            return (
              <div key={f.key} className="space-y-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-sm text-gray-700">{f.label}</label>
                  <span className="text-sm font-semibold text-purple-600 tabular-nums">
                    {value.toFixed(1)} cm
                  </span>
                </div>
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={bounds.step}
                  value={value}
                  onChange={(e) => updateField(f.key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 tabular-nums">
                  <span>{bounds.min}</span>
                  <span>{bounds.max}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleRegenerate}
          disabled={!isDirty || isRegenerating}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl border-2 transition-colors",
            !isDirty || isRegenerating
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-purple-600 text-purple-600 hover:bg-purple-50",
          )}
        >
          {isRegenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Régénération…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Régénérer le patron 2D
            </>
          )}
        </button>
        <button
          onClick={onContinue}
          disabled={isRegenerating}
          className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          Continuer vers le guide
        </button>
      </div>

      {isDirty && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Tu as ajusté les mensurations. Clique sur «&nbsp;Régénérer le patron 2D&nbsp;»
          pour recalculer les pièces SVG avec ces nouvelles mesures.
        </p>
      )}
    </div>
  )
}
