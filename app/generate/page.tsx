"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { EU_SIZES } from "@/lib/sizes"
import { UploadZone } from "@/components/UploadZone"
import { AnalysisPanel } from "@/components/AnalysisPanel"
import { SizeSelector } from "@/components/SizeSelector"
import { PatternViewer } from "@/components/PatternViewer"
import { SewingGuide } from "@/components/SewingGuide"
import { DownloadActions } from "@/components/DownloadActions"
import type { GarmentAnalysis } from "@/lib/ai"
import type { EuSize, SizeMeasurements, PatternResult } from "@/lib/types/pattern"

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6

const STEP_LABELS: Record<Step, string> = {
  1: "Photo",
  2: "Analyse",
  3: "Tailles",
  4: "Patron",
  5: "Guide",
  6: "Téléchargement",
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 overflow-x-auto pb-2">
      {([1, 2, 3, 4, 5, 6] as Step[]).map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors",
                step < current
                  ? "bg-green-500 border-green-500 text-white"
                  : step === current
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "bg-white border-gray-300 text-gray-400"
              )}
            >
              {step < current ? <Check className="w-4 h-4" /> : step}
            </div>
            <span
              className={cn(
                "text-xs hidden sm:block font-medium",
                step === current ? "text-purple-600" : "text-gray-400"
              )}
            >
              {STEP_LABELS[step]}
            </span>
          </div>
          {i < 5 && (
            <div
              className={cn(
                "w-8 sm:w-12 h-0.5 mx-1 mb-4 sm:mb-5",
                step < current ? "bg-green-400" : "bg-gray-200"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Animation wrapper ────────────────────────────────────────────────────────

function StepPanel({ children, stepKey }: { children: React.ReactNode; stepKey: number }) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function GeneratePage() {
  const [step, setStep] = useState<Step>(1)

  // Étape 1 — Photo
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string>("image/jpeg")

  // Étape 2 — Analyse
  const [analysis, setAnalysis] = useState<GarmentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState<string | null>(null)

  // Étape 3 — Tailles
  const [selectedSizes, setSelectedSizes] = useState<EuSize[]>(["M"])
  const [useCustom, setUseCustom] = useState(false)
  const [customMeasurements, setCustomMeasurements] = useState<Partial<SizeMeasurements>>({})

  // Étape 4 — Patron
  const [patternBySize, setPatternBySize] = useState<Record<string, PatternResult>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // ── Handlers ──

  const handleImageReady = useCallback(
    (base64: string, preview: string, type: string) => {
      setImageBase64(base64)
      setImagePreview(preview)
      setMediaType(type)
      setAnalysis(null)
      setAnalyzeError(null)
    },
    []
  )

  const handleAnalyze = async () => {
    if (!imageBase64) return
    setIsAnalyzing(true)
    setAnalyzeError(null)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64, mediaType }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur d'analyse")
      setAnalysis(data)
      setStep(2)
    } catch (err) {
      setAnalyzeError(
        err instanceof Error
          ? err.message
          : "Oups, notre IA a besoin d'une pause. Réessaie dans 10 secondes."
      )
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGeneratePatterns = async () => {
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const sizesToGenerate = useCustom ? ["Personnalisé"] : selectedSizes
      const results: Record<string, PatternResult> = {}

      for (const sizeKey of sizesToGenerate) {
        const measurements: SizeMeasurements =
          useCustom && customMeasurements.poitrine
            ? (customMeasurements as SizeMeasurements)
            : EU_SIZES[sizeKey as EuSize]

        const res = await fetch("/api/pattern", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            garmentType: "tshirt",
            measurements,
            options: { seamAllowance: 1 },
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? "Erreur de génération")
        results[sizeKey] = data
      }

      setPatternBySize(results)
      setStep(4)
    } catch (err) {
      setGenerateError(
        err instanceof Error
          ? err.message
          : "Impossible de générer le patron. Vérifie tes mesures et réessaie."
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRestart = () => {
    setStep(1)
    setImageBase64(null)
    setImagePreview(null)
    setAnalysis(null)
    setAnalyzeError(null)
    setSelectedSizes(["M"])
    setUseCustom(false)
    setCustomMeasurements({})
    setPatternBySize({})
    setGenerateError(null)
  }

  // Mesures actives pour le téléchargement
  const activeMeasurements: SizeMeasurements =
    useCustom && customMeasurements.poitrine
      ? (customMeasurements as SizeMeasurements)
      : EU_SIZES[selectedSizes[0] ?? "M"]

  const activeSizeName = useCustom ? "Personnalisé" : selectedSizes.join("-")

  // ── Rendu ──

  return (
    <div className="min-h-screen landing-gradient">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-extrabold text-lg text-purple-600"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            PatronAI
          </Link>
          {step > 1 && (
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-purple-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Stepper */}
        <Stepper current={step} />

        {/* Titre de l'étape */}
        <div className="text-center">
          <h1
            className="text-2xl font-bold text-gray-900"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            {step === 1 && "Ta photo de vêtement"}
            {step === 2 && "Ce que l'IA a détecté"}
            {step === 3 && "Choix de la taille"}
            {step === 4 && "Ton patron de couture"}
            {step === 5 && "Guide de couture pas-à-pas"}
            {step === 6 && "Télécharge ton patron"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 1 && "Étape 1 sur 6 · Uploade une photo de ton vêtement à plat"}
            {step === 2 && "Étape 2 sur 6 · Vérifie les informations détectées"}
            {step === 3 && "Étape 3 sur 6 · Sélectionne ta taille ou saisis tes mesures"}
            {step === 4 && "Étape 4 sur 6 · Voici les pièces de ton patron"}
            {step === 5 && "Étape 5 sur 6 · Suis ces étapes pour assembler ton t-shirt"}
            {step === 6 && "Étape 6 sur 6 · Télécharge les fichiers prêts à imprimer"}
          </p>
        </div>

        {/* Contenu de l'étape */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <AnimatePresence mode="wait">
            {/* ── Étape 1 : Upload ── */}
            {step === 1 && (
              <StepPanel stepKey={1}>
                <div className="space-y-5">
                  <UploadZone
                    onImageReady={handleImageReady}
                    preview={imagePreview}
                    onClear={() => {
                      setImageBase64(null)
                      setImagePreview(null)
                      setAnalysis(null)
                      setAnalyzeError(null)
                    }}
                  />
                  {analyzeError && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      {analyzeError}
                    </p>
                  )}
                  <button
                    onClick={handleAnalyze}
                    disabled={!imageBase64 || isAnalyzing}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-colors",
                      imageBase64 && !isAnalyzing
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyse en cours…
                      </>
                    ) : (
                      "Analyser ma photo"
                    )}
                  </button>
                </div>
              </StepPanel>
            )}

            {/* ── Étape 2 : Résultat analyse ── */}
            {step === 2 && analysis && (
              <StepPanel stepKey={2}>
                <AnalysisPanel
                  analysis={analysis}
                  onConfirm={() => setStep(3)}
                  onRetry={() => {
                    setStep(1)
                    setAnalysis(null)
                    setImageBase64(null)
                    setImagePreview(null)
                  }}
                />
              </StepPanel>
            )}

            {/* ── Étape 3 : Tailles ── */}
            {step === 3 && (
              <StepPanel stepKey={3}>
                <SizeSelector
                  selectedSizes={selectedSizes}
                  onSizesChange={setSelectedSizes}
                  useCustom={useCustom}
                  onUseCustomChange={setUseCustom}
                  customMeasurements={customMeasurements}
                  onCustomMeasurementsChange={setCustomMeasurements}
                  onNext={handleGeneratePatterns}
                />
                {isGenerating && (
                  <div className="mt-4 flex items-center justify-center gap-3 text-purple-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Nous dessinons ton patron…</span>
                  </div>
                )}
                {generateError && (
                  <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {generateError}
                  </p>
                )}
              </StepPanel>
            )}

            {/* ── Étape 4 : Visualiseur patron ── */}
            {step === 4 && Object.keys(patternBySize).length > 0 && (
              <StepPanel stepKey={4}>
                <div className="space-y-5">
                  <PatternViewer
                    patternBySize={patternBySize}
                    selectedSizes={selectedSizes}
                    useCustom={useCustom}
                  />
                  <button
                    onClick={() => setStep(5)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Voir le guide de couture
                  </button>
                </div>
              </StepPanel>
            )}

            {/* ── Étape 5 : Guide de couture ── */}
            {step === 5 && Object.keys(patternBySize).length > 0 && (
              <StepPanel stepKey={5}>
                <div className="space-y-5">
                  <SewingGuide
                    result={
                      patternBySize[useCustom ? "Personnalisé" : selectedSizes[0]] ??
                      Object.values(patternBySize)[0]
                    }
                  />
                  <button
                    onClick={() => setStep(6)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    Télécharger mon patron
                  </button>
                </div>
              </StepPanel>
            )}

            {/* ── Étape 6 : Téléchargement ── */}
            {step === 6 && (
              <StepPanel stepKey={6}>
                <DownloadActions
                  measurements={activeMeasurements}
                  sizeName={activeSizeName}
                  selectedSizes={selectedSizes}
                  onRestart={handleRestart}
                />
              </StepPanel>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
