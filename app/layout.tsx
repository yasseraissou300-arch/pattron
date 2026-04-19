import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "PatronAI — Génère ton patron de couture en 30 secondes",
  description:
    "Prends en photo un vêtement que tu possèdes. L'IA génère son patron de couture dans toutes les tailles européennes avec un tutoriel pas-à-pas.",
  keywords: ["patron couture", "couture", "t-shirt", "patron gratuit", "tailles européennes"],
  authors: [{ name: "PatronAI" }],
  openGraph: {
    title: "PatronAI — Patron de couture en 30 secondes",
    description: "Photo → Patron SVG/PDF. Pour les couturières francophones.",
    locale: "fr_FR",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Polices Google chargées au runtime pour éviter l'erreur réseau au build */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background antialiased">
        {children}
      </body>
    </html>
  )
}
