"use client"

// Studio de poses IA : avatar articulé que l'on pose via des presets ou une
// description en mots-clés (envoyée à Gemini → angles d'articulation).
// L'avatar est "nu" : le vêtement ne suit pas la pose (limite du pipeline 3D).

import { useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Loader2, Sparkles, RotateCcw, ChevronLeft, Play, Pause, Plus, Trash2, Film } from "lucide-react"
import { cn } from "@/lib/utils"
import { EU_SIZES, EU_SIZE_ORDER } from "@/lib/sizes"
import { POSE_PRESETS, NEUTRAL_POSE, type Pose } from "@/lib/3d/poses"
import { HIP_PRESETS, NEUTRAL_HIPS, HIP_RANGES, type HipShape } from "@/lib/3d/hips"
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
  const [hips, setHips] = useState<HipShape>(NEUTRAL_HIPS)
  const [activeHipPreset, setActiveHipPreset] = useState<string | null>("neutre")

  // Animation par image clé
  const [frames, setFrames] = useState<Pose[]>([])
  const [playing, setPlaying] = useState(false)
  const [loop, setLoop] = useState(true)
  const [durationSec, setDurationSec] = useState(4)
  const [scrub, setScrub] = useState(0)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const measurements = EU_SIZES[size]

  const applyPreset = (id: string, p: Pose) => {
    setPose(p)
    setActivePreset(id)
    setError(null)
  }

  const applyHipPreset = (id: string, s: HipShape) => {
    setHips(s)
    setActiveHipPreset(id)
  }

  const setHipParam = (k: keyof HipShape, v: number) => {
    setHips((h) => ({ ...h, [k]: v }))
    setActiveHipPreset(null)
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
          <PoseCanvas
            pose={pose}
            measurements={measurements}
            hips={hips}
            clip={{ frames, playing, loop, durationSec, scrub }}
          />

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

          {/* Forme des hanches */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Forme des hanches
            </div>
            <div className="flex flex-wrap gap-2">
              {HIP_PRESETS.map((h) => (
                <button
                  key={h.id}
                  onClick={() => applyHipPreset(h.id, h.shape)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                    activeHipPreset === h.id
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600",
                  )}
                >
                  <span className="mr-1">{h.emoji}</span>
                  {h.label}
                </button>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {(
                [
                  { key: "width", label: "Largeur" },
                  { key: "seat", label: "Volume du bas" },
                  { key: "roundness", label: "Arrondi" },
                ] as { key: keyof HipShape; label: string }[]
              ).map((f) => {
                const r = HIP_RANGES[f.key]
                return (
                  <div key={f.key} className="space-y-1">
                    <label className="text-sm text-gray-700">{f.label}</label>
                    <input
                      type="range"
                      min={r.min}
                      max={r.max}
                      step={r.step}
                      value={hips[f.key]}
                      onChange={(e) => setHipParam(f.key, parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                )
              })}
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

          {/* Animation par image clé */}
          <div className="space-y-3 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Animation (images clés)</h3>
              </div>
              {frames.length > 0 && (
                <button
                  onClick={() => {
                    setFrames([])
                    setPlaying(false)
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Tout effacer
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Pose l'avatar (preset, IA, hanches…), capture une image clé, recommence,
              puis lance la lecture : les poses s'enchaînent en fondu.
            </p>

            <button
              onClick={() => setFrames((f) => [...f, pose])}
              className="w-full flex items-center justify-center gap-2 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Capturer cette pose comme image clé
            </button>

            {frames.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {frames.map((_, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-white border border-purple-200 rounded-full pl-2.5 pr-1 py-1 text-xs text-gray-700"
                  >
                    Image {i + 1}
                    <button
                      onClick={() => setFrames((f) => f.filter((_, idx) => idx !== i))}
                      className="w-4 h-4 rounded-full hover:bg-red-100 text-gray-400 hover:text-red-600 flex items-center justify-center"
                      aria-label={`Supprimer l'image ${i + 1}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {frames.length >= 2 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPlaying((p) => !p)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {playing ? "Pause" : "Lecture"}
                  </button>
                  <button
                    onClick={() => setLoop((l) => !l)}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-xs font-medium transition-colors",
                      loop
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "border-gray-300 text-gray-600 hover:border-purple-300",
                    )}
                  >
                    Boucle
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Durée</span>
                    <span className="font-semibold text-purple-600 tabular-nums">{durationSec}s</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={12}
                    step={0.5}
                    value={durationSec}
                    onChange={(e) => setDurationSec(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                {!playing && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-600">Position</div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={scrub}
                      onChange={(e) => setScrub(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                )}
              </div>
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
