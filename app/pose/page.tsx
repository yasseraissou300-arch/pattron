"use client"

// Studio de poses IA : avatar articulé que l'on pose via des presets ou une
// description en mots-clés (envoyée à Gemini → angles d'articulation).
// L'avatar est "nu" : le vêtement ne suit pas la pose (limite du pipeline 3D).

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Loader2, Sparkles, RotateCcw, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { EU_SIZES, EU_SIZE_ORDER } from "@/lib/sizes"
import { POSE_PRESETS, NEUTRAL_POSE, type Pose } from "@/lib/3d/poses"
import type { EuSize } from "@/lib/types/pattern"

const PoseCanvas = dynamic(
  () => import("@/components/PosableMannequin").then((m) => m.PoseCanvas),
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

const EXAMPLES = [
  "bras croisés, l'air confiant",
  "une main qui salue",
  "en train de courir",
  "assise sur une chaise",
  "penchée en avant, mains sur les genoux",
]

export default function PosePage() {
  const [size, setSize] = useState<EuSize>("M")
  const [pose, setPose] = useState<Pose>(NEUTRAL_POSE)
  const [activePreset, setActivePreset] = useState<string | null>("neutre")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const measurements = EU_SIZES[size]

  const applyPreset = (id: string, p: Pose) => {
    setPose(p)
    setActivePreset(id)
    setError(null)
  }

  const generate = async () => {
    const q = prompt.trim()
    if (q.length < 2 || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/pose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur de génération")
      setPose(data.pose as Pose)
      setActivePreset(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de générer la pose. Réessaie dans quelques secondes.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen landing-gradient">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-extrabold text-lg text-purple-600"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            PatronAI
          </Link>
          <Link
            href="/generate"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Générer un patron
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center">
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Générateur de poses IA
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Pose ton avatar avec un preset ou décris la pose en quelques mots.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Avatar 3D */}
          <PoseCanvas pose={pose} measurements={measurements} />

          {/* Morphologie */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Morphologie de l'avatar
            </div>
            <div className="grid grid-cols-6 gap-2">
              {EU_SIZE_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "rounded-lg border-2 py-2 text-sm font-bold transition-colors",
                    size === s
                      ? "border-purple-400 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-600 hover:border-purple-200",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Presets */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Poses préréglées
            </div>
            <div className="flex flex-wrap gap-2">
              {POSE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id, p.pose)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                    activePreset === p.id
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600",
                  )}
                >
                  <span className="mr-1">{p.emoji}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Génération IA par mots-clés */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Décris une pose (IA)
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                maxLength={300}
                placeholder="ex : bras croisés, l'air confiant"
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") generate()
                }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              />
              <button
                onClick={generate}
                disabled={loading || prompt.trim().length < 2}
                className={cn(
                  "flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-lg transition-colors flex-shrink-0",
                  loading || prompt.trim().length < 2
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white",
                )}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Générer
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setPrompt(ex)}
                  className="text-[11px] text-gray-500 bg-gray-100 hover:bg-purple-50 hover:text-purple-600 rounded-full px-2.5 py-1 transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </p>
            )}
          </div>

          {/* Réinitialiser */}
          <button
            onClick={() => applyPreset("neutre", NEUTRAL_POSE)}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:border-purple-300 text-gray-600 hover:text-purple-700 font-medium py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Pose neutre
          </button>

          <p className="text-xs text-gray-400 text-center">
            L'avatar est affiché sans vêtement : le drapé 3D ne suit pas encore les
            poses. Cette vue sert à composer des poses pour tes mannequins.
          </p>
        </div>
      </div>
    </div>
  )
}
