import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export default function PricingPage() {
  return (
    <div className="min-h-screen landing-gradient flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md w-full text-center">
        <h1
          className="text-2xl font-bold text-gray-900 mb-3"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Nos tarifs
        </h1>
        <p className="text-gray-500 mb-6">
          Les offres Maker et Créateur seront disponibles prochainement.
          En attendant, profite de l&apos;accès gratuit complet.
        </p>
        <Link
          href="/generate"
          className={cn(buttonVariants(), "bg-purple-600 hover:bg-purple-700 text-white w-full justify-center mb-3")}
        >
          Générer mon patron gratuitement
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "w-full justify-center")}
        >
          Voir tous les tarifs
        </Link>
      </div>
    </div>
  )
}
