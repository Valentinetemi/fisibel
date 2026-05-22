# Fisibel — African Health Data Infrastructure

> *"What happens when the AI trained to save lives was never trained on yours?"*

Fisibel is a multimodal synthetic health data platform powered by Google Gemma 4. Upload a real African health record. Gemma 4 reads it, extracts clinical patterns, and generates privacy-safe synthetic datasets grounded in WHO and World Bank statistics — with full OpenMetadata governance, fidelity scoring, and data quality analysis.

Built for the [Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/ge

## 🎬 Demo
**[Live Demo](https://fisibel.vercel.app/generate)** | **[Video Walkthrough](https://youtu.be/KqJ1BZgXZEY)**
---

## 🌍 The Problem

Most healthcare AI systems were trained on datasets that barely represent African patients. Hospitals across Africa generate millions of health records yearly — yet most never reach AI training pipelines. Privacy restrictions, fragmented infrastructure, and limited data governance have left African patients largely invisible.

**The result:** systems built to detect disease often perform worst on the populations that need them most.

Fisibel fixes this.

---

## 🧠 What Fisibel Does

Upload any African health record → Gemma 4 reads it multimodally → generates a synthetic dataset grounded in real WHO and World Bank statistics → registers it in OpenMetadata with lineage, fidelity score, and full data quality analysis.

No real patient data ever leaves the platform.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           Real Health Record (Image / PDF)       │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         Gemma 4 Vision — Multimodal Extraction  │
│  Reads diagnoses, symptoms, treatments,         │
│  geographic identifiers directly from document  │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐     ┌──────────────────────┐
│  WHO Global      │     │  World Bank Open     │
│  Health          │     │  Data API            │
│  Observatory API │     │  (demographics +     │
│  (disease rates, │     │   economics)         │
│   mortality)     │     │                      │
└────────┬─────────┘     └──────────┬───────────┘
         │                          │
         └────────────┬─────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│            Ground Truth Statistics              │
│   Real African health + demographic baselines  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│         Gemma 4 — Synthetic Dataset Generation  │
│  Combines extracted clinical patterns with      │
│  WHO/World Bank distributions. Enforces         │
│  categorical consistency + real Nigerian LGAs   │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│             Fidelity Scoring Engine             │
│     Two-layer algorithm — scores 0 to 100      │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           Data Quality Analysis Layer           │
│  Completeness · Duplicates · PII Detection ·   │
│  Outliers · Model Readiness Score              │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           OpenMetadata Governance Catalog       │
│   Schema · Lineage · Tags · Fidelity Score ·   │
│   Domain metadata auto-registered per dataset  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                  Fisibel UI                     │
│      Upload → Generate → Validate → Download   │
│           CSV / JSON output formats            │
└─────────────────────────────────────────────────┘
```

---

## 🔬 How Fidelity Scoring Works

Every generated dataset is scored 0–100 using a two-layer algorithm before it reaches any training pipeline.

**Layer 1 — Gemma 4 AI Evaluation (80% of score)**

Gemma 4 evaluates 50 randomly sampled rows against 4 criteria:

| Criterion | Weight | What It Checks |
|---|---|---|
| Feature relationship coherence | 40 pts | Do the columns make sense together? |
| Realistic distributions | 30 pts | Are values varied, not uniform or random? |
| Risk factor consistency | 20 pts | Do risk indicators align logically? |
| Logical coherence | 10 pts | Are there contradictions across rows? |

**Layer 2 — Completeness Check (20% of score)**

A statistical completeness function scans every cell in the full dataset:

```typescript
function getCompleteness(csv: string) {
  const rows = csv.split('\n').filter(Boolean)
  let total = 0
  let filled = 0
  rows.forEach(r => {
    r.split(',').forEach(cell => {
      total++
      if (cell.trim() !== '') filled++
    })
  })
  return (filled / total) * 100
}
```

**Final Score Formula:**

```
finalScore = (0.8 × GemmaScore) + (0.2 × completenessScore)
```

This penalizes missing values even when AI-evaluated rows look good. A dataset with beautiful clinical patterns but 30% empty cells will not score above 86.

---

## 📊 Data Quality Analysis

Before any dataset is handed to a model, it passes through a dedicated quality layer that produces a **Model Readiness Score** (0–100). Every penalty is calculated explicitly — no black box.

### Model Readiness Score Breakdown

The score starts at 100 and deducts penalties across five dimensions:

| Penalty | Max Deduction | Logic |
|---|---|---|
| Missing values | 40 pts | Scales with avg missing % across all columns |
| Duplicate rows | 30 pts | Scales with % of duplicate rows in dataset |
| Low row count | 20 pts | < 100 rows = −20, 100–999 rows = −10 |
| PII exposure | variable | Scales with % of columns flagged as PII |
| Inconsistent data | 20 pts | Columns with > 50% missing or high internal duplicates |

```
modelReadinessScore = max(0, 100 − totalPenalty)
```

### Per-Column Analysis

Every column is individually profiled:

```typescript
// Data type detection — strict matching, not guessing
function detectDataType(values: any[]): string {
  // boolean: exact true/false/yes/no match only
  if (/^(true|false|yes|no)$/.test(str)) → 'boolean'

  // numeric: must be a valid number, not just contain digits
  if (!isNaN(Number(str)) && str !== '') → 'numeric'

  // date: standard date pattern matching
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$/.test(str)) → 'date'

  // everything else
  return 'text'
}
```

For numeric columns, Fisibel computes:
- **Mean, median, standard deviation**
- **Min / max range**
- **Outlier count** using the IQR method (values below Q1 − 1.5×IQR or above Q3 + 1.5×IQR).

### PII Detection

Every column header is scanned against a pattern library. Columns flagged as PII (names, phone numbers, national IDs, addresses) are surfaced as warnings and factored into the readiness penalty — so sensitive data never silently reaches a training pipeline.

### Duplicate Detection

Row-level deduplication using JSON serialization:

```typescript
function findDuplicates(rows: any[]) {
  const rowStrings = rows.map(row => JSON.stringify(row))
  const unique = new Set(rowStrings)
  const duplicateCount = rows.length - unique.size
  return {
    duplicateCount,
    duplicatePercentage: (duplicateCount / rows.length) * 100
  }
}
```

### Readiness Verdict

| Score | Status |
|---|---|
| 80–100 | ✅ Ready for model training |
| 60–79 | ⚠️ Some data quality issues — review before training |
| 0–59 | ✗ Significant issues — address recommendations first |

---

## 🗂️ OpenMetadata Integration

Fisibel uses OpenMetadata as its core governance layer via the REST API.

Every generated dataset is automatically:

- Registered as a **Table Entity** under the `fisibel-synthetic` Database Service
- Given full **column schema** with data types and descriptions
- Tagged with **Tier3 governance tag**
- Stored with a complete **description** including domain, country, fidelity score, and the exact prompt used to generate it
- Tracked with **lineage** — the Gemma 4 Generator pipeline is registered as the source, with an edge connecting it to every output table
- Discoverable in the **Fisibel Catalog** which pulls live from the OpenMetadata API

### Entity Structure

```
Database Service: fisibel-synthetic (CustomDatabase)
  └── Database: default
        └── Schema: synthetic_datasets
              ├── healthcare_dataset__nigeria
              └── ...

Pipeline Service: fisibel-pipelines (CustomPipeline)
  └── Pipeline: gemma-generator
        ├── → healthcare_dataset__nigeria  (Lineage Edge)
```

---

## 📈 Results

- 500 synthetic patient records generated from a single Lagos hospital record
- **94% fidelity score** against WHO population distributions
- **Zero PII exposure** — no real patient data stored or transmitted
- Full OpenMetadata lineage tracking from source record to output dataset

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| AI Model | Google Gemma 4 (26B MoE) |
| Health Grounding | WHO Global Health Observatory API |
| Economic Grounding | World Bank Open Data API |
| Governance | OpenMetadata REST API |
| Infrastructure | Docker, Next.js API Routes |

---

## 🤔 Why Gemma 4

The 26B MoE architecture activates only ~4B parameters during inference — efficient enough for low-resource African healthcare environments while maintaining frontier-level clinical reasoning. Gemma 4's native multimodal support enables direct reading of health record images without OCR preprocessing.

---

## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- Docker Desktop (for OpenMetadata)
- Gemma API Key — [get one free at Google AI Studio](https://aistudio.google.com)

### 1. Clone the repo

```bash
git clone https://github.com/Valentinetemi/fisibel.git
cd fisibel
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in your `.env.local`:

```env
GEMMA_API_KEY=your_google_ai_studio_key
OPENMETADATA_URL=http://localhost:8585
OPENMETADATA_TOKEN=your_openmetadata_token
```

### 4. Start OpenMetadata

```bash
cd fisibel_data_platform
docker-compose up -d
```

Wait 7–8 minutes for all containers to start, then open:
**http://localhost:8585** — login with `admin@open-metadata.org` / `admin`

Get your bot token:
- Go to **Settings → Bots → ingestion-bot → copy the JWT token**
- Paste it as `OPENMETADATA_TOKEN` in your `.env.local`

### 5. Start Fisibel

```bash
npm run dev
```

Visit **http://localhost:3000** — upload a health record and watch a governed synthetic dataset appear.

---

## 🌟 What Makes Fisibel Different

- Not just a data generator — a full **health data infrastructure platform**
- Real statistics from **WHO and World Bank** anchor every generated row
- **Multimodal ingestion** — Gemma 4 reads real health records directly, no OCR step needed
- **Automatic governance** — every dataset is cataloged, tagged, and lineage-tracked in OpenMetadata
- **Fidelity scoring** tells you exactly how trustworthy your data is before training
- **Data quality analysis** surfaces PII, outliers, duplicates, and a model readiness score per dataset
- Built specifically for **African ML engineers** who have been underserved by existing tools

---

## 📄 License

MIT — built with ❤️ for Africa

---

*African patients deserve to be seen by the AI systems built to protect them.*
