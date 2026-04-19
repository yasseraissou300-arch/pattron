"use client"

import { useCallback, useState } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import { Upload, ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UploadZoneProps {
  onImageReady: (base64: string, preview: string, mediaType: string) => void
  preview: string | null
  onClear: () => void
}

const ACCEPTED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
}

const MAX_SIZE_MB = 10

export function UploadZone({ onImageReady, preview, onClear }: UploadZoneProps) {
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      setError(null)

      if (rejections.length > 0) {
        const code = rejections[0]?.errors?.[0]?.message ?? ""
        if (code.toLowerCase().includes("size")) {
          setError(`Le fichier dépasse ${MAX_SIZE_MB} Mo. Essaie avec une image plus petite.`)
        } else {
          setError("Format non supporté. Utilise une image JPEG, PNG ou WebP.")
        }
        return
      }

      const file = acceptedFiles[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const base64 = dataUrl.split(",")[1]
        const mediaType = file.type || "image/jpeg"
        onImageReady(base64, dataUrl, mediaType)
      }
      reader.readAsDataURL(file)
    },
    [onImageReady]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
    multiple: false,
  })

  if (preview) {
    return (
      <div className="relative">
        <div className="rounded-xl overflow-hidden border-2 border-purple-200 bg-purple-50 aspect-[4/3] max-w-sm mx-auto flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Aperçu de ton vêtement"
            className="max-h-full max-w-full object-contain p-2"
          />
        </div>
        <button
          onClick={onClear}
          className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-red-50 hover:border-red-200 transition-colors"
          aria-label="Supprimer la photo"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
        <p className="text-center text-sm text-green-600 font-medium mt-3">
          Photo prête pour l&apos;analyse
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors text-center",
          isDragActive
            ? "border-purple-400 bg-purple-50"
            : "border-gray-300 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
            {isDragActive ? (
              <ImageIcon className="w-7 h-7 text-purple-500" />
            ) : (
              <Upload className="w-7 h-7 text-purple-400" />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-700">
              {isDragActive
                ? "Dépose ta photo ici"
                : "Glisse une photo ou clique pour choisir"}
            </p>
            <p className="text-sm text-gray-500 mt-1">JPEG, PNG ou WebP · Maximum 10 Mo</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Pour un meilleur résultat :</p>
        <ul className="space-y-1 list-disc list-inside text-amber-700">
          <li>Pose le vêtement à plat sur un fond uni</li>
          <li>Bonne luminosité naturelle ou artificielle</li>
          <li>Vue de dessus, sans plis importants</li>
        </ul>
      </div>
    </div>
  )
}
