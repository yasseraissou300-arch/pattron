import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "PatronAI — Génère ton patron de couture en 30 secondes"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F5F3FF 0%, #FEF3F2 100%)",
          fontFamily: "sans-serif",
          padding: "60px",
        }}
      >
        {/* Logo + nom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "#7C3AED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "32px",
              fontWeight: "bold",
            }}
          >
            P
          </div>
          <span style={{ fontSize: "48px", fontWeight: "800", color: "#7C3AED" }}>
            PatronAI
          </span>
        </div>

        {/* Titre principal */}
        <h1
          style={{
            fontSize: "56px",
            fontWeight: "800",
            color: "#111827",
            textAlign: "center",
            lineHeight: 1.2,
            margin: "0 0 24px 0",
            maxWidth: "900px",
          }}
        >
          Ton patron de couture{" "}
          <span style={{ color: "#7C3AED" }}>en 30 secondes</span>
        </h1>

        {/* Sous-titre */}
        <p
          style={{
            fontSize: "28px",
            color: "#6B7280",
            textAlign: "center",
            margin: "0 0 48px 0",
            maxWidth: "700px",
          }}
        >
          Photo → Patron SVG/PDF avec tutoriel pas-à-pas en français
        </p>

        {/* Badges */}
        <div style={{ display: "flex", gap: "16px" }}>
          {["100 % en français", "Tailles XS à XXL", "PDF prêt à imprimer"].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  background: "#EDE9FE",
                  color: "#5B21B6",
                  borderRadius: "50px",
                  padding: "10px 24px",
                  fontSize: "20px",
                  fontWeight: "600",
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    size
  )
}
