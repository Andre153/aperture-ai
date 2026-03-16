# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Mastra Studio at http://localhost:4111
npm run build        # Build with Mastra
npm run seed         # Seed the aperture-news-topics dataset (6 test cases)
npx tsx <file>       # Run any TypeScript file directly
```

## Environment Variables

Requires `.env` with: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `NEWS_API_KEY`, `GUARDIAN_API_KEY`. Copy from `.env.example`.

## Architecture

Multi-agent news report pipeline built with **Mastra AI**. A workflow accepts a topic and produces a polished news report through 5 steps:

1. **Gather Sources** (`gatherSourcesStep`) — Calls both news tools directly (not via agent), then passes articles to the Researcher Agent for synthesis
2. **Branch** — `articleCount >= 3` → deep analysis; otherwise → brief summary
3. **Map** — Normalizes branch output (only one branch executes, keyed by step ID)
4. **Write Report** (`writeReportStep`) — Writer Agent generates the report from research brief
5. **Edit Report** (`editReportStep`) — Editor Agent polishes for clarity, neutrality, attribution

### Agents & Models

| Agent | Model | Role |
|-------|-------|------|
| Researcher | `openai/gpt-4.1-mini` | Analyzes articles, produces research brief. Has news tools attached for standalone/Studio use |
| Writer | `anthropic/claude-sonnet-4-20250514` | Writes the news report from research findings |
| Editor | `openai/gpt-4.1-mini` | Polishes draft for quality, neutrality, attribution |

### Scorer

`reportQualityScorer` uses a 4-phase pipeline (`preprocess` → `analyze` → `generateScore` → `generateReason`) with `openai/gpt-4.1-nano` as judge. Evaluates source attribution (0.3), neutrality (0.2), completeness (0.3), structure (0.2) as weighted average.

### Key Patterns

- Tools are called directly in workflow steps (not through agent tool-calling) for reliable extraction. The agent is used separately for synthesis.
- Zod schemas define all step input/output contracts. `ArticleSchema` in `src/mastra/types/article.ts` is the shared article type.
- Workflow uses `.then()`, `.branch()`, `.map()` chaining with `.commit()` to finalize.
- Storage is local SQLite via `@mastra/libsql` at project root (`mastra.db`).
- Model strings use the `provider/model` format (e.g., `anthropic/claude-sonnet-4-20250514`).
