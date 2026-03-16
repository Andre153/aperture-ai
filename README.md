<p align="center">
  <img src="assets/logo.png" alt="Aperture" width="400" />
</p>

# Aperture

A multi-agent news reporter built with [Mastra AI](https://mastra.ai). Give it a topic — it researches, writes, and edits a polished news report using multiple agents, tools, and a structured workflow.

```
Topic ──▶ Gather Sources ──▶ Branch (depth) ──▶ Write Report ──▶ Edit & Polish ──▶ Report
              │                  │                   │                 │
         NewsAPI.org        ≥3 articles?        Writer Agent     Editor Agent
         Guardian API       deep / brief       (Claude Sonnet)   (GPT-4.1 mini)
         Researcher Agent
```

### Mastra Primitives Used

| Primitive | Implementation |
|-----------|---------------|
| **Agents** | Researcher (with tools), Writer, Editor |
| **Tools** | `searchNewsTool` (NewsAPI.org), `fetchGuardianNewsTool` (Guardian API) |
| **Workflow** | 5-step pipeline with `.then()`, `.branch()`, `.map()` |
| **Custom Scorer** | `reportQualityScorer` — 4-phase evaluation pipeline |
| **Dataset** | 6 news topic test cases for running experiments |
| **Studio** | Full local dev setup via `mastra dev` |

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env` with your API keys:

```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
NEWS_API_KEY=your-newsapi-key
GUARDIAN_API_KEY=your-guardian-key
```

**Key sources:**
- [Anthropic](https://console.anthropic.com/) — Writer agent
- [OpenAI](https://platform.openai.com/) — Researcher, Editor, Scorer
- [NewsAPI.org](https://newsapi.org/register) — free tier, 100 req/day
- [The Guardian](https://open-platform.theguardian.com/access/) — free developer key

## Running

### Start Studio

```bash
npm run dev
```

Open [http://localhost:4111](http://localhost:4111) to access Mastra Studio. From there you can chat with agents, run workflows, test tools, and view scorer results.

### Seed the Dataset

```bash
npm run seed
```

Creates the `aperture-news-topics` dataset with 6 test cases (AI regulation, climate tech, quantum computing, supply chains, space exploration, cybersecurity in healthcare).

### Run an Experiment

In Studio → Datasets → `aperture-news-topics` → Run Experiment:

- **Target**: Workflow → `news-report-workflow`
- **Scorer**: `reportQuality`

## Project Structure

```
src/mastra/
├── index.ts                        # Mastra instance — registers all primitives
├── agents/                         # Researcher, Writer, Editor
├── tools/                          # NewsAPI.org + Guardian API integrations
├── workflows/                      # Multi-step news report workflow
└── scorers/                        # Custom report quality scorer
scripts/
└── seed-dataset.ts                 # Seeds test cases into the dataset
docs/
├── workflow.md                     # Detailed workflow documentation with diagrams
└── llm-models.md                   # Model selection strategy and rationale
```

## Documentation

- **[Workflow deep-dive](docs/workflow.md)** — Step-by-step breakdown of the pipeline, agent roles, tool integrations, data flow schemas, and the scorer evaluation pipeline
- **[Model selection](docs/llm-models.md)** — Why each agent uses a different model, the newsroom analogy, cost breakdown, and fallback strategy
- **[Product roadmap](docs/roadmap.md)** — Phased plan for guardrails, memory, supervisor agents, human-in-the-loop, and RAG
