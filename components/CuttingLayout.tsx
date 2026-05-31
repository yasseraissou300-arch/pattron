"use client"

// Plan de coupe : visualise l'imbrication des pièces sur le tissu et indique le
// métrage à acheter + le taux d'utilisation. Toutes les pièces sont posées
// droit-fil (le grain suit la longueur du tissu) → imprimés et textures
// préservés. L'utilisatrice choisit la laize de son tissu.

import { useMemo, useState } from "react"
import { Scissors, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { nestPieces, FABRIC_WIDTHS, type Placement } from "@/lib/nesting/nest"
import type { PatternPiece } from "@/lib/types/pattern"

const PIECE_COLORS = [
  "#ede9fe", "#dbeafe", "#dcfce7", "#fef3c7", "#fce7f3", "#ffedd5", "#e0e7ff", "#ccfbf1",
]
const PIECE_STROKES = [
  "#7c3aed", "#2563eb", "#16a34a", "#d97706", "#db2777", "#ea580c", "#4f46e5", "#0d9488",
]

function colorIndex(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return h % PIECE_COLORS.length
}

function GrainArrow({ p }: { p: Placement }) {
  // Flèche verticale (droit-fil) centrée, longueur ~60% de la pièce.
  const cx = p.x + p.w / 2
  const half = Math.min(p.h * 0.3, 8)
  const cy = p.y + p.h / 2
  const a = 1.1
  return (
    <g stroke="#475569" strokeWidth={0.4} fill="#475569">
      <line x1={cx} y1={cy - half} x2={cx} y2={cy + half} />
      <polygon points={`${cx},${cy - half - a} ${cx - a * 0.7},${cy - half} ${cx + a * 0.7},${cy - half}`} />
      <polygon points={`${cx},${cy + half + a} ${cx - a * 0.7},${cy + half} ${cx + a * 0.7},${cy + half}`} />
    </g>
  )
}

export function CuttingLayout({ pieces }: { pieces: PatternPiece[] }) {
  const [fabricWidthCm, setFabricWidthCm] = useState<number>(140)

  const result = useMemo(
    () => nestPieces(pieces, fabricWidthCm),
    [pieces, fabricWidthCm],
  )

  const { fabricLengthCm, utilizationPct, placements, oversized } = result
  const fabricMeters = (fabricLengthCm / 100).toFixed(2)

  // viewBox du tissu avec une petite marge.
  const pad = 3
  const vbW = fabricWidthCm + pad * 2
  const vbH = Math.max(fabricLengthCm, 10) + pad * 2

  return (
    <div className="space-y-4 rounded-xl border border-purple-100 bg-purple-50/40 p-4">
      <div className="flex items-center gap-2">
        <Scissors className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-900">Plan de coupe</h3>
      </div>

      {/* Sélecteur de laize */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Laize de ton tissu
        </div>
        <div className="flex flex-wrap gap-2">
          {FABRIC_WIDTHS.map((w) => (
            <button
              key={w}
              onClick={() => setFabricWidthCm(w)}
              className={cn(
                "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                fabricWidthCm === w
                  ? "bg-purple-600 border-purple-600 text-white"
                  : "border-gray-300 text-gray-600 hover:border-purple-300 hover:text-purple-600",
              )}
            >
              {w} cm
            </button>
          ))}
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white border border-gray-100 p-3 text-center">
          <div className="text-lg font-bold text-purple-700 tabular-nums">{fabricMeters} m</div>
          <div className="text-[11px] text-gray-500">tissu à acheter</div>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 p-3 text-center">
          <div className="text-lg font-bold text-purple-700 tabular-nums">{utilizationPct}%</div>
          <div className="text-[11px] text-gray-500">utilisé ({100 - utilizationPct}% chute)</div>
        </div>
        <div className="rounded-lg bg-white border border-gray-100 p-3 text-center">
          <div className="text-lg font-bold text-purple-700 tabular-nums">{placements.length}</div>
          <div className="text-[11px] text-gray-500">pièces à couper</div>
        </div>
      </div>

      {oversized.length > 0 && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Trop large pour cette laize : {oversized.join(", ")}. Choisis un tissu plus large.
        </p>
      )}

      {/* Schéma du tissu */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="max-h-[420px] overflow-auto p-2">
          <svg
            viewBox={`0 0 ${vbW} ${vbH}`}
            className="w-full h-auto"
            style={{ minHeight: 120 }}
            role="img"
            aria-label="Plan de coupe sur le tissu"
          >
            {/* Tissu */}
            <rect
              x={pad}
              y={pad}
              width={fabricWidthCm}
              height={Math.max(fabricLengthCm, 10)}
              fill="#fafafa"
              stroke="#cbd5e1"
              strokeWidth={0.4}
              strokeDasharray="2,1.5"
            />
            {/* Lisières (bords du tissu) */}
            <line x1={pad} y1={pad} x2={pad} y2={pad + Math.max(fabricLengthCm, 10)} stroke="#94a3b8" strokeWidth={0.6} />
            <line x1={pad + fabricWidthCm} y1={pad} x2={pad + fabricWidthCm} y2={pad + Math.max(fabricLengthCm, 10)} stroke="#94a3b8" strokeWidth={0.6} />

            {placements.map((p, i) => {
              const ci = colorIndex(p.name)
              const x = pad + p.x
              const y = pad + p.y
              const label = p.copies > 1 ? `${p.name} ${p.copy}/${p.copies}` : p.name
              const fontSize = Math.max(1.8, Math.min(3.2, p.w / Math.max(label.length, 6)))
              return (
                <g key={`${p.name}-${p.copy}-${i}`}>
                  <rect
                    x={x}
                    y={y}
                    width={p.w}
                    height={p.h}
                    rx={1}
                    fill={PIECE_COLORS[ci]}
                    stroke={PIECE_STROKES[ci]}
                    strokeWidth={0.4}
                  />
                  <GrainArrow p={{ ...p, x, y }} />
                  <text
                    x={x + p.w / 2}
                    y={y + 3.5}
                    fontSize={fontSize}
                    textAnchor="middle"
                    fill={PIECE_STROKES[ci]}
                    fontFamily="Arial"
                    fontWeight="bold"
                  >
                    {label}
                  </text>
                  <text
                    x={x + p.w / 2}
                    y={y + p.h - 1.5}
                    fontSize={1.8}
                    textAnchor="middle"
                    fill="#64748b"
                    fontFamily="Arial"
                  >
                    {Math.round(p.w)}×{Math.round(p.h)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 text-[11px] text-gray-500">
          <span>Laize {fabricWidthCm} cm · longueur ≈ {fabricLengthCm} cm</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-px bg-slate-500 relative">
              <span className="absolute -top-[3px] left-1/2 -translate-x-1/2 text-slate-500">↕</span>
            </span>
            droit-fil
          </span>
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-xs text-gray-400">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        Disposition à plat sur simple épaisseur, toutes pièces dans le sens du
        droit-fil (flèches verticales) pour préserver imprimés et textures.
        Prévois ~5 % de marge ; couper en double épaisseur peut réduire le métrage.
      </p>
    </div>
  )
}
