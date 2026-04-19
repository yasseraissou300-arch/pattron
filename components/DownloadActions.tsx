"use client"

import { useState } from "react"
import { FileDown, Share2, RotateCcw, Loader2 } from "lucide-react"
import type { SizeMeasurements, EuSize } from "@/lib/types/pattern"

interface DownloadActionsProps {
  measurements: SizeMeasurements
  sizeName: string
  selectedSizes: EuSize[]
  onRestart: () => void
}

type Format = "A4" | "A0" | "projector"

const FORMAT_INFO: Record<Format, { label: string; desc: string }> = {
  A4: {
    label: "PDF A4 à assembler",
    desc: "Pages A4 avec repères de collage — imprimable chez toi",
  },
  A0: {
    label: "PDF A0 grand format",
    desc: "Une seule page — à envoyer à une imprimerie",
  },
  projector: {
    label: "SVG pour projecteur",
    desc: "Fichier vectoriel — pour projeter le patron à l'échelle 1:1",
  },
}

export function DownloadActions({
  measurements,
  sizeName,
  onRestart,
}: DownloadActionsProps) {
  const [loading, setLoading] = useState<Format | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function downloadPdf(format: Format) {
    setLoading(format)
    setError(null)

    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          garmentType: "tshirt",
          measurements,
          sizeName,
          format,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Erreur inconnue" }))
        throw new Error(data.error ?? "Erreur lors de la génération du PDF")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `patronai-tshirt-${sizeName}-${format}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de générer le fichier. Réessaie dans quelques instants."
      )
    } finally {
      setLoading(null)
    }
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Impossible de copier le lien. Copie l'URL manuellement.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Boutons de téléchargement */}
      <div className="space-y-3">
        {(["A4", "A0", "projector"] as Format[]).map((fmt) => {
          const info = FORMAT_INFO[fmt]
          const isLoading = loading === fmt

          return (
            <button
              key={fmt}
              onClick={() => downloadPdf(fmt)}
              disabled={loading !== null}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <FileDown className="w-5 h-5 text-purple-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{info.label}</p>
                <p className="text-xs text-gray-500">{info.desc}</p>
              </div>
              {isLoading && (
                <span className="text-xs text-purple-600 font-medium">Génération…</span>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Actions secondaires */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
        <button
          onClick={copyShareLink}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-300 hover:border-purple-300 text-gray-700 hover:text-purple-700 font-medium py-3 px-5 rounded-lg transition-colors text-sm"
        >
          <Share2 className="w-4 h-4" />
          {copied ? "Lien copié !" : "Partager ce patron"}
        </button>
        <button
          onClick={onRestart}
          className="flex-1 flex items-center justify-center gap-2 border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 font-medium py-3 px-5 rounded-lg transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Recommencer avec une autre photo
        </button>
      </div>

      {/* Notice RGPD */}
      <p className="text-xs text-gray-400 text-center pt-2">
        Ta photo n&apos;a pas été stockée. Les données de mesures restent dans ton navigateur uniquement.
      </p>
    </div>
  )
}
