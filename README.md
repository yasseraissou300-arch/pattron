# PatronAI — Générateur de patrons de couture par IA

**Générez votre patron de couture en 30 secondes.** Photographiez un vêtement que vous aimez. PatronAI utilise l'IA pour générer un patron complet en toutes tailles européennes, avec un tutoriel pas-à-pas en français.

[🌐 patronai.fr](https://patronai.fr) • [📸 Générer un patron](https://patronai.fr/generate)

---

## ✨ Fonctionnalités

- **Photo → Patron en 30 secondes** — Upload une photo, l'IA analyse et génère 4 pièces SVG prêtes à couper
- **100 % en français** — Patron, mesures, tutoriel et support entièrement français
- **Tailles XS à XXL** — Gradation automatique jusqu'à XXL + support des mesures personnalisées
- **3 formats de sortie** — PDF A4 à assembler, PDF A0 pour l'imprimerie, SVG pour projecteur
- **Tutoriel pédagogique** — 9 étapes détaillées avec astuces adaptées aux débutants
- **Zéro stockage** — Les photos ne sont jamais sauvegardées, analyse en mémoire uniquement
- **Mobile-first** — Fonctionne parfaitement sur téléphone et tablette

---

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm
- Clé API Anthropic (pour l'analyse IA)

### Installation locale

```bash
# Cloner le repo
git clone https://github.com/patronai/patronai.git
cd patronai

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env.local

# Remplir ANTHROPIC_API_KEY dans .env.local
```

### Lancer en développement

```bash
npm run dev
# → http://localhost:3000
```

---

## 📁 Architecture

```
app/
├── layout.tsx              # Layout global + métadonnées
├── page.tsx                # Landing page
├── generate/page.tsx       # Stepper 6 étapes (MVP)
├── api/
│   ├── analyze/            # Claude Vision
│   ├── pattern/            # Génération SVG
│   └── pdf/                # Export PDF

components/
├── UploadZone.tsx
├── AnalysisPanel.tsx
├── SizeSelector.tsx
├── PatternViewer.tsx
├── SewingGuide.tsx
└── DownloadActions.tsx

lib/
├── ai.ts                   # Wrapper Claude Vision
├── pdf.ts                  # Génération PDF
├── sizes.ts                # Tailles EU XS-XXL
└── patterns/tshirt.ts      # Moteur SVG
```

---

## 🛠 Stack technique

- **Framework** — Next.js 16 (App Router) + TypeScript
- **UI** — Tailwind CSS 4 + shadcn/ui
- **Animations** — framer-motion
- **IA** — @anthropic-ai/sdk (Claude Sonnet 4.6)
- **Upload** — react-dropzone
- **PDF** — pdf-lib
- **Database** — Prisma v5 + SQLite
- **Validation** — zod v4

---

## 📝 Variables d'environnement

```bash
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=file:./dev.db
```

---

## 🧪 Tests & Build

```bash
npm run build    # TypeScript + produit le build optimisé
npm run lint     # ESLint
npm run dev      # Développement
```

---

## 🚀 Déploiement sur Vercel

```bash
# Ajouter la clé API
vercel env add ANTHROPIC_API_KEY sk-ant-...

# Déployer
vercel --prod
```

---

## 📊 Feuille de route

**V1 (MVP actuel)**
- ✅ T-shirt femme manches courtes
- ✅ Analyse IA photo
- ✅ Tailles EU + mesures custom
- ✅ SVG + PDF A4
- ✅ Guide de couture

**V2 (à venir)**
- [ ] Auth Clerk + paiement Stripe
- [ ] Autres types de vêtements
- [ ] Sauvegarde patron utilisateur
- [ ] Tutoriels vidéo

---

## ⚖️ RGPD

- ✅ Aucune photo stockée (analyse en mémoire)
- ✅ Pas de cookies de tracking
- ✅ Suppression de données sur demande
- ✅ Hébergement EU (Vercel)

---

**Fait avec 💜 pour les couturières francophones.**
