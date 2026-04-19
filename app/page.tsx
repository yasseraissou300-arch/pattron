import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Check } from "lucide-react"

// Navigation principale
function Nav() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-extrabold text-xl text-purple-600"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          PatronAI
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link href="#comment-ca-marche" className="hover:text-purple-600 transition-colors">
            Comment ça marche
          </Link>
          <Link href="#tarifs" className="hover:text-purple-600 transition-colors">
            Tarifs
          </Link>
        </div>
        <Link
          href="/generate"
          className={cn(buttonVariants(), "bg-purple-600 hover:bg-purple-700 text-white")}
        >
          Générer un patron
        </Link>
      </div>
    </nav>
  )
}

// Section Hero
function Hero() {
  return (
    <section className="landing-gradient py-20 px-4 md:px-8">
      <div className="max-w-4xl mx-auto text-center">
        <Badge className="mb-6 bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100">
          Maintenant en accès anticipé gratuit
        </Badge>
        <h1
          className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Ton patron de couture
          <span className="text-purple-600"> en 30 secondes</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Prends en photo un vêtement que tu possèdes. PatronAI génère son patron
          dans toutes les tailles européennes avec un tutoriel pas-à-pas.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/generate"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-6"
            )}
          >
            Générer mon patron gratuitement
          </Link>
          <Link
            href="#comment-ca-marche"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "text-lg px-8 py-6 border-purple-200 text-purple-700 hover:bg-purple-50"
            )}
          >
            Voir comment ça marche
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Aucune inscription requise pour essayer · Résultat en PDF et SVG
        </p>

        {/* Aperçu visuel illustratif */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-2 text-xs text-gray-400 font-mono">patronai.fr/generate</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 bg-purple-50 rounded-xl p-4 flex flex-col items-center gap-2">
                <div className="w-12 h-16 bg-purple-200 rounded-lg" />
                <span className="text-xs text-purple-600 font-medium">Ta photo</span>
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <div className="text-2xl text-purple-400">→</div>
              </div>
              <div className="col-span-1 bg-green-50 rounded-xl p-4 flex flex-col items-center gap-2">
                <div className="w-16 h-12 border-2 border-dashed border-green-400 rounded" />
                <span className="text-xs text-green-600 font-medium">Ton patron</span>
              </div>
            </div>
            <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full" />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Analyse en cours… T-shirt femme · Taille M · Manches courtes
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Section "Comment ça marche"
function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Photographie ton vêtement",
      description:
        "Pose ton vêtement à plat sur un fond uni, bien éclairé. Prends la photo avec ton téléphone ou appareil photo.",
    },
    {
      number: "2",
      title: "L'IA analyse et identifie",
      description:
        "Notre intelligence artificielle reconnaît le type de vêtement, l'encolure, les manches et la coupe en quelques secondes.",
    },
    {
      number: "3",
      title: "Reçois ton patron prêt à imprimer",
      description:
        "Télécharge le patron en PDF A4 à assembler, A0 pour l'imprimerie, ou SVG pour projecteur. Le tutoriel est inclus.",
    },
  ]

  return (
    <section id="comment-ca-marche" className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Comment ça marche ?
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Du vêtement fini au patron de couture en trois étapes simples.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-bold mb-5 shadow-lg shadow-purple-200">
                {step.number}
              </div>
              <h3
                className="text-xl font-semibold text-gray-900 mb-3"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {step.title}
              </h3>
              <p className="text-gray-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 bg-amber-50 border border-amber-200 rounded-2xl p-6 max-w-2xl mx-auto">
          <p className="text-amber-800 text-center font-medium">
            Astuce : une photo à la lumière naturelle sur un fond blanc donne les meilleurs résultats.
          </p>
        </div>
      </div>
    </section>
  )
}

// Section différenciateurs
function Differentiators() {
  const items = [
    {
      title: "100 % en français",
      description: "Patron, tutoriel et support entièrement en français. Aucun concurrent ne le propose.",
    },
    {
      title: "Tailles XS à XXL et plus",
      description: "Gradation automatique jusqu'à XXL et support des morphologies atypiques.",
    },
    {
      title: "Tutoriel pédagogique inclus",
      description: "Guide pas-à-pas adapté aux débutants, avec astuces et illustrations.",
    },
    {
      title: "Mobile-first",
      description: "Fonctionne parfaitement depuis ton téléphone. Prends la photo et génère directement.",
    },
    {
      title: "3 formats de sortie",
      description: "PDF A4 à assembler chez toi, PDF A0 pour l'imprimerie, SVG pour projecteur.",
    },
    {
      title: "Données protégées",
      description: "Tes photos ne sont jamais stockées. Analyse instantanée, suppression immédiate.",
    },
  ]

  return (
    <section className="py-20 px-4 md:px-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Pourquoi PatronAI ?
          </h2>
          <p className="text-lg text-gray-500">
            Conçu par des couturières, pour les couturières francophones.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Card key={item.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// Section tarifs
function Pricing() {
  const plans = [
    {
      name: "Gratuit",
      price: "0 €",
      period: "pour toujours",
      description: "Pour découvrir PatronAI",
      features: [
        "3 patrons par mois",
        "T-shirt uniquement (MVP)",
        "PDF A4 téléchargeable",
        "Tutoriel inclus",
      ],
      cta: "Commencer gratuitement",
      href: "/generate",
      highlight: false,
    },
    {
      name: "Maker",
      price: "9,99 €",
      period: "par mois",
      description: "Pour les couturières régulières",
      features: [
        "30 patrons par mois",
        "Tous les types de vêtements",
        "PDF A4, A0 et SVG projecteur",
        "Mesures personnalisées",
        "Partage de patrons",
        "Support par e-mail",
      ],
      cta: "Choisir Maker",
      href: "/pricing",
      highlight: true,
    },
    {
      name: "Créateur",
      price: "24,99 €",
      period: "par mois",
      description: "Pour les passionnées et créatrices",
      features: [
        "Patrons illimités",
        "Tous les types de vêtements",
        "Tous les formats de sortie",
        "Gradation XXL et morphologies",
        "Accès prioritaire aux nouveautés",
        "Support prioritaire",
      ],
      cta: "Choisir Créateur",
      href: "/pricing",
      highlight: false,
    },
  ]

  return (
    <section id="tarifs" className="py-20 px-4 md:px-8 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Tarifs simples
          </h2>
          <p className="text-lg text-gray-500">
            Commence gratuitement, passe à la vitesse supérieure quand tu es prête.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 items-start">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border ${
                plan.highlight
                  ? "border-purple-400 shadow-xl shadow-purple-100 md:-mt-4"
                  : "border-gray-200"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-1">Le plus populaire</Badge>
                </div>
              )}
              <CardHeader className="pb-2 pt-8 px-6">
                <p className="text-sm font-medium text-gray-500">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-400 text-sm">/ {plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <Separator className="mb-6" />
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={cn(
                    buttonVariants(),
                    "w-full justify-center",
                    plan.highlight
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-0"
                  )}
                >
                  {plan.cta}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// Section témoignages (contenu illustratif)
function Testimonials() {
  const testimonials = [
    {
      quote:
        "J'ai enfin réussi à reproduire mon t-shirt préféré ! Le patron était parfaitement à ma taille dès le premier essai.",
      author: "Marie L.",
      role: "Couturière amateur depuis 2 ans",
    },
    {
      quote:
        "Le tutoriel pas-à-pas m'a guidée étape par étape. Même ma fille de 16 ans a pu coudre son premier t-shirt.",
      author: "Sophie D.",
      role: "Maman et couturière du dimanche",
    },
    {
      quote:
        "Impressionnant. En 30 secondes j'avais un patron précis. J'aurais dû utiliser ça avant de gâcher 3 mètres de tissu.",
      author: "Isabelle M.",
      role: "Créatrice textile indépendante",
    },
  ]

  return (
    <section className="py-20 px-4 md:px-8 landing-gradient">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Elles nous font confiance
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <Card key={t.author} className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                <p className="text-gray-600 leading-relaxed mb-4 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

// Appel à l'action final
function FinalCTA() {
  return (
    <section className="py-20 px-4 md:px-8 bg-purple-600">
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl font-bold text-white mb-4"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Prête à coudre ton premier patron ?
        </h2>
        <p className="text-purple-200 text-lg mb-8">
          Génère ton premier patron gratuitement en 30 secondes. Aucune inscription requise.
        </p>
        <Link
          href="/generate"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-white text-purple-700 hover:bg-purple-50 text-lg px-8 py-6 font-semibold"
          )}
        >
          Générer mon patron maintenant
        </Link>
      </div>
    </section>
  )
}

// Pied de page
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <h3
              className="text-white font-bold text-xl mb-3"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              PatronAI
            </h3>
            <p className="text-sm leading-relaxed max-w-xs">
              Le premier générateur de patrons de couture en français, propulsé par
              l&apos;intelligence artificielle.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/generate" className="hover:text-white transition-colors">
                  Générer un patron
                </Link>
              </li>
              <li>
                <Link href="#tarifs" className="hover:text-white transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="#comment-ca-marche" className="hover:text-white transition-colors">
                  Comment ça marche
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-medium mb-3 text-sm">Légal et RGPD</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/confidentialite" className="hover:text-white transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/mentions" className="hover:text-white transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/legal/cgu" className="hover:text-white transition-colors">
                  Conditions d&apos;utilisation
                </Link>
              </li>
              <li>
                <a href="mailto:contact@patronai.fr" className="hover:text-white transition-colors">
                  Supprimer mes données
                </a>
              </li>
            </ul>
          </div>
        </div>
        <Separator className="bg-gray-800 mb-6" />
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 PatronAI — Tous droits réservés</p>
          <p>
            Tes photos ne sont jamais stockées · Aucun tracker publicitaire ·{" "}
            <span className="text-purple-400">Conforme RGPD</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

// Page d'accueil
export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <HowItWorks />
      <Differentiators />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </main>
  )
}
