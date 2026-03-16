# LLM Model Selection — The AI Newsroom

## The Newsroom Analogy

A traditional newsroom producing a single story staffs four roles:

```
┌─────────────────────────────────────────────────────────┐
│                    THE NEWSROOM                         │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │  Desk        │    │  Staff       │                  │
│  │  Researcher  │───>│  Reporter    │                  │
│  │              │    │              │                  │
│  │  Gathers     │    │  Writes the  │                  │
│  │  sources,    │    │  story from  │                  │
│  │  reads wire  │    │  the brief   │                  │
│  │  services,   │    │              │                  │
│  │  produces a  │    │              │                  │
│  │  brief       │    │              │                  │
│  └──────────────┘    └──────┬───────┘                  │
│                             │                           │
│                             v                           │
│                      ┌──────────────┐                  │
│                      │  Senior      │                  │
│                      │  Editor      │                  │
│                      │              │                  │
│                      │  Reviews for │                  │
│                      │  accuracy,   │                  │
│                      │  neutrality, │                  │
│                      │  clarity     │                  │
│                      └──────┬───────┘                  │
│                             │                           │
│                             v                           │
│                      ┌──────────────┐                  │
│                      │  Quality     │                  │
│                      │  Reviewer    │                  │
│                      │              │                  │
│                      │  Scores the  │                  │
│                      │  final piece │                  │
│                      │  against a   │                  │
│                      │  rubric      │                  │
│                      └──────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

Aperture replaces each of these humans with an AI agent. The key insight is that **not every role in a newsroom demands the same skill level** — and the same applies to models.

## From Humans to Agents

### Desk Researcher → Researcher Agent

In a newsroom, the desk researcher is a junior role. They scan wire services (AP, Reuters), clip relevant articles, and compile a brief for the reporter. The work is structured and procedural — read, extract, summarize. You don't need your Pulitzer-winning journalist doing this.

**Agent:** `researcher-agent`
**Model:** `openai/gpt-4.1-mini` ($1.60/M output tokens)

The Researcher Agent does exactly what a desk researcher would: it queries two news APIs (NewsAPI.org and The Guardian), collects ~10 articles, and synthesizes them into a structured brief with key themes, facts, and source attribution. This is extraction and summarization — no creativity or nuance required. GPT-4.1 mini handles structured input/output well and costs ~9x less than Sonnet.

### Staff Reporter → Writer Agent

The reporter is the star of the newsroom. They take the research brief and turn it into prose that readers actually want to read. Tone, flow, source weaving, knowing what to lead with — this is where craft matters. A newsroom pays its best reporters significantly more than its desk researchers, and for good reason.

**Agent:** `writer-agent`
**Model:** `anthropic/claude-sonnet-4` ($15.00/M output tokens)

The Writer Agent produces the only user-facing deliverable: the polished news report. Journalistic prose quality is the primary differentiator of the entire pipeline. Sonnet consistently produces the best creative writing in this price tier. This is the one place where spending on a premium model directly impacts output quality — just as a newsroom invests most in its reporters.

### Senior Editor → Editor Agent

The senior editor doesn't write — they refine. They work from a checklist: Is every claim sourced? Is the tone neutral? Does the lead grab attention? Is it accessible to a general audience? This is experienced but systematic work. A good editor follows explicit criteria against an already-strong draft.

**Agent:** `editor-agent`
**Model:** `openai/gpt-4.1-mini` ($1.60/M output tokens)

The Editor Agent follows six explicit review criteria (accuracy, neutrality, completeness, structure, attribution, clarity) against an already-strong Sonnet draft. This is rule-based refinement, not creation. GPT-4.1 mini is reliable at following explicit instructions and costs ~9x less than Sonnet.

### Quality Reviewer → Scorer

Some newsrooms have a standards desk or ombudsman who evaluates published pieces against a quality rubric. This role is the most mechanical of all — score each criterion on a scale, compute a weighted average, write a brief summary. It's a form you fill out, not prose you compose.

**Agent:** `reportQualityScorer`
**Model:** `openai/gpt-4.1-nano` ($0.40/M output tokens)

The most constrained task in the pipeline. The scorer evaluates against a fixed rubric, outputs structured JSON with numeric scores (0-1), and generates a 2-3 sentence summary. GPT-4.1 nano is sufficient for this and costs ~37x less than Sonnet.

## The Staffing Budget

Just as a newsroom allocates salary budget based on impact, Aperture allocates model cost based on how much each role affects the final output:

| Newsroom Role | Agent | Model | Cost / 1M tokens | Budget Share |
|---------------|-------|-------|-------------------|--------------|
| Desk Researcher | `researcher-agent` | `openai/gpt-4.1-mini` | $1.60 | Low |
| Staff Reporter | `writer-agent` | `anthropic/claude-sonnet-4` | $15.00 | High |
| Senior Editor | `editor-agent` | `openai/gpt-4.1-mini` | $1.60 | Low |
| Quality Reviewer | `reportQualityScorer` | `openai/gpt-4.1-nano` | $0.40 | Minimal |

The reporter (Writer) gets ~75% of the per-token budget because their output **is** the product. Everyone else is support staff.

## Why Multi-Provider

Mastra has built-in support for 100+ model providers — switching models is just changing the model string and setting the corresponding API key. No additional dependencies or gateway services are needed.

Using a single provider (all-Anthropic or all-OpenAI) would be like hiring all your newsroom staff from the same talent agency. You'd either overpay for desk researchers or compromise on your lead reporter. The multi-provider approach lets us use each provider's strengths where they matter.

## Why Not OpenRouter

Mastra already acts as its own model router. OpenRouter would add a middleman margin on top of provider pricing plus extra latency from the proxy hop, with no benefit. It would be like hiring a staffing agency to manage a four-person team — overhead without value.

## Environment Variables

| Variable | Used by |
|----------|---------|
| `ANTHROPIC_API_KEY` | Writer agent |
| `OPENAI_API_KEY` | Researcher, Editor, Scorer |

## Fallback Strategy

If testing reveals quality issues with budget models — the equivalent of a hire not meeting expectations:

1. **Editor**: Upgrade from GPT-4.1 mini → Claude Haiku 4.5 ($4/M output, still ~4x cheaper than Sonnet)
2. **Scorer**: Upgrade from GPT-4.1 nano → GPT-4.1 mini ($1.60/M) if scores are unreliable
3. **Researcher**: Upgrade from GPT-4.1 mini → Claude Haiku 4.5 if extraction quality drops

The Writer stays on Sonnet regardless — output quality is non-negotiable for the user-facing deliverable. You don't downgrade your lead reporter.
