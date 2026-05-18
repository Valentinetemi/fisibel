# Fisibel — African Health Data Infrastructure

> *"What happens when the AI trained to save lives was never trained on yours?"*

Fisibel is a multimodal synthetic health data platform powered by Google Gemma 4. Upload a real African health record. Gemma 4 reads it, extracts clinical patterns, and generates privacy-safe synthetic datasets grounded in WHO and World Bank statistics — with full OpenMetadata governance and fidelity scoring.

Built for the [Gemma 4 Good Hackathon](https://www.kaggle.com/competitions/gemma-4-good-hackathon).

---

## The Problem

Most healthcare AI systems were trained on datasets that barely represent African patients. Hospitals across Africa generate millions of health records yearly — yet most never reach AI training pipelines. Privacy restrictions, fragmented infrastructure, and limited data governance have left African patients largely invisible.

**The result:** systems built to detect disease often perform worst on the populations that need them most.

---

## What Fisibel Does

Upload any health record → Gemma 4 reads it multimodally → generates synthetic dataset grounded in WHO/World Bank data → registered in OpenMetadata with lineage and fidelity score.

No real patient data ever leaves the platform.

---

## Architecture
Real Health Record (Image/PDF)
↓
Gemma 4 Vision (Multimodal Extraction)
↓
WHO API + World Bank API (Statistical Grounding)
↓
Synthetic Dataset Generation
↓
Fidelity Scoring (94% achieved)
↓
OpenMetadata (Lineage + Governance)
↓
Data Quality Analysis
↓
Download as CSV/JSON

## Four-Layer Pipeline

**Layer 1 — Multimodal Ingestion**
Health record image compressed client-side, converted to base64, sent to Gemma 4 which reads diagnoses, symptoms, treatments, and geographic identifiers directly from the document.

**Layer 2 — Statistical Grounding**
Live fetch from WHO Global Health Observatory API and World Bank Open Data API. Real African health statistics become the ground truth for every generated dataset.

**Layer 3 — Synthetic Generation**
Gemma 4 combines extracted clinical patterns with WHO/World Bank distributions. Strict categorical consistency enforced. Real Nigerian LGAs, hospitals, and clinical patterns used throughout.

**Layer 4 — Governance**
Every dataset auto-registered in OpenMetadata with full schema, lineage, fidelity score, and domain metadata. Live catalog with download and quality analysis.

---

## Results

- 500 synthetic patient records generated from a single Lagos hospital record
- **94% fidelity score** against WHO population distributions
- Zero PII exposure
- Full OpenMetadata lineage tracking

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| AI Model | Google Gemma 4 (26B MoE) |
| Health Grounding | WHO Global Health Observatory API |
| Economic Grounding | World Bank Open Data API |
| Governance | OpenMetadata REST API |
| Infrastructure | Docker, Next.js API Routes |

---

## Why Gemma 4

The 26B MoE architecture activates only ~4B parameters during inference — efficient enough for low-resource African healthcare environments while maintaining frontier-level clinical reasoning. Gemma 4's native multimodal support enables direct reading of health record images without OCR preprocessing.

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/Valentinetemi/fisibel.git
cd fisibel

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your GEMMA_API_KEY and OPENMETADATA_TOKEN

# Start OpenMetadata
cd fisibel_data_platform
docker-compose up -d

# Start Fisibel
npm run dev
```

Visit `http://localhost:3000`

---

## Environment Variables

```env
GEMMA_API_KEY=your_google_ai_studio_key
OPENMETADATA_URL=https://sandbox.open-metadata.org
OPENMETADATA_TOKEN=your_openmetadata_token
```

---

## Demo

[Live Demo](your_demo_url) | [Video](your_youtube_url) | [Kaggle Writeup](your_kaggle_url)

---

## License

MIT

---

*African patients deserve to be seen by the AI systems built to protect them.*
