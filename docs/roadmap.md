# Aperture Roadmap

A phased plan for evolving Aperture from a linear news-report pipeline into a robust, intelligent, and scalable multi-agent system — leveraging Mastra AI's full feature set.

## Current State

Aperture today is a **5-step linear workflow** that takes a topic and produces an edited news report:

- **3 agents**: Researcher, Writer, Editor — each specialized for a single stage
- **2 news sources**: NewsAPI.org and The Guardian
- **1 workflow**: Linear pipeline with branching based on source availability
- **1 quality scorer**: Evaluates reports on attribution, neutrality, completeness, and structure
- **Local storage**: SQLite database for persistence

What's missing: there are no safety guardrails on inputs or outputs, no memory across sessions, no human review step, and no way for the system to learn and improve over time.

---

## Phase 1: Safety & Quality

> Protect the pipeline from misuse and catch quality issues before they reach users.

### Content Moderation

**What it adds:** Every agent gets an input filter that screens topics for hate speech, harassment, and violent content before processing begins.

**Why it matters:** Aperture is a tool that produces public-facing content. Without moderation, a bad-faith topic submission could produce a report that amplifies harmful narratives. Input moderation ensures the pipeline only processes appropriate requests, protecting both the brand and end users.

### Prompt Injection Protection

**What it adds:** The Researcher agent — the first to process raw user input — gets a dedicated detector that identifies and blocks prompt injection attempts.

**Why it matters:** Since the Researcher directly handles user-provided topics and passes them to LLMs, it's the most vulnerable entry point. An attacker could craft a topic string that hijacks the agent's instructions to extract system prompts, ignore safety guidelines, or produce misleading content. This protection closes that vector.

### PII Redaction

**What it adds:** The Writer and Editor agents get output filters that automatically detect and redact personally identifiable information (emails, phone numbers, addresses) before the report is finalized.

**Why it matters:** News articles scraped from external APIs may contain personal details of private individuals. Publishing these in a generated report creates privacy and liability risks. Automatic PII redaction ensures the final output is clean regardless of what the source material contains.

### Expanded Quality Evaluation

**What it adds:** Four additional quality scorers alongside the existing custom scorer:

| Evaluation | What It Catches | Impact |
|-----------|----------------|--------|
| **Hallucination detection** | Claims not supported by any source article | Prevents the report from stating fabricated "facts" |
| **Faithfulness verification** | Output that diverges from the research brief | Ensures the Writer doesn't embellish or reinterpret findings |
| **Bias detection** | Gender, political, racial, or geographical bias | Maintains the neutral, journalistic tone the pipeline promises |
| **Tone consistency** | Shifts in voice or register across sections | Produces a polished, uniform reading experience |

**Why it matters:** The current scorer evaluates the report holistically, but doesn't catch specific failure modes. A report could score well on structure while containing a hallucinated statistic or subtle political bias. These targeted evaluations create a comprehensive safety net that catches issues the general scorer misses.

### Real-Time Quality Monitoring

**What it adds:** Quality scorers run automatically on every agent interaction in Mastra Studio, not just during batch experiments.

**Why it matters:** Currently, quality is only measured when explicitly running an experiment against the dataset. With live scoring, every report generated through Studio or the API is automatically evaluated, making quality visible at all times and enabling faster iteration on agent instructions.

---

## Phase 2: Memory & Context

> Give agents the ability to remember, learn, and build on previous work.

### Working Memory

**What it adds:** The Researcher agent maintains conversational context across messages within a session. A user can say "now search for a related angle" or "dig deeper into the EU regulation aspect" and the agent understands what came before.

**Why it matters:** Today, every interaction with the Researcher starts from scratch. In Studio, this means users have to repeat context with every message. Working memory transforms the Researcher from a stateless tool into a conversational partner that supports iterative exploration of a topic.

### Observational Memory

**What it adds:** Agents automatically build long-term knowledge from their interactions over time:

- The **Researcher** learns which sources are most reliable for certain topic categories
- The **Editor** learns recurring quality issues to watch for (e.g., "reports on AI regulation tend to lack opposing viewpoints")
- The system **improves with use** without manual retraining or instruction updates

**Why it matters:** This is the difference between a tool that runs the same way every time and one that gets smarter the more it's used. Observational memory means the 100th report Aperture produces will be meaningfully better than the first — the agents accumulate institutional knowledge about news topics, source reliability, and quality patterns.

### Semantic Recall

**What it adds:** When covering a topic, agents can automatically recall relevant findings from previous research sessions. If Aperture previously covered "AI regulation in the EU," the Researcher can pull in those prior findings when a related topic comes up again.

**Why it matters:** News stories build on each other. A report on "EU AI Act enforcement" is far richer if it can reference Aperture's previous coverage of the Act's passage. Semantic recall gives the pipeline editorial continuity — the kind of institutional knowledge that makes established newsrooms valuable.

---

## Phase 3: Supervisor Agent & Human-in-the-Loop

> Replace the rigid linear pipeline with intelligent orchestration and human oversight.

### Supervisor Agent

**What it adds:** A supervisor agent replaces the fixed step-by-step workflow. Instead of always running gather → write → edit in sequence, the supervisor dynamically decides what to do next based on the current state of the report.

**Why it matters:** The current pipeline is rigid — it always follows the same path regardless of what happens at each step. If the Editor finds that sources are thin, there's no way to loop back to the Researcher. A supervisor can:

- **Re-delegate dynamically** — send the report back to the Researcher if the Editor flags insufficient sourcing
- **Adapt to complexity** — spend more iterations on a nuanced geopolitical topic vs. a straightforward tech announcement
- **Self-correct** — if the Writer produces a biased draft, the supervisor can request a rewrite before it ever reaches the Editor

This transforms Aperture from a pipeline that runs once and hopes for the best into a system that iterates toward quality.

### Delegation Hooks

**What it adds:** Configurable checkpoints at every handoff between agents. Before the supervisor passes a task to a subagent, and after the subagent returns its result, custom logic can inspect, modify, or reject the delegation.

**Why it matters:** This provides fine-grained control over agent coordination without changing agent instructions. For example:

- Automatically inject "focus on diverse, reputable sources" when delegating to the Researcher
- Validate that the Writer's output meets a minimum word count before passing to the Editor
- Log every delegation for audit trails and debugging

### Automated Quality Gates

**What it adds:** The supervisor automatically evaluates whether the report is "done" after each iteration using the quality scorers. If the report doesn't meet thresholds, the supervisor keeps working — requesting more research, another draft, or further editing.

**Why it matters:** Currently, the pipeline produces exactly one draft and one edit, regardless of quality. With automated quality gates, Aperture guarantees a minimum quality standard. A report that scores poorly on source attribution gets sent back for more research. One that scores poorly on neutrality gets another editing pass. The output quality becomes a target, not a hope.

### Human Review

**What it adds:** The pipeline can pause at any step — typically after editing — to wait for a human reviewer to approve or provide feedback. The system saves its full state, and the human can resume it hours or days later with their feedback incorporated.

**Why it matters:** For high-stakes topics (breaking news, sensitive political coverage, health-related reporting), fully automated output isn't appropriate. Human-in-the-loop gives editorial teams a review gate where they can:

- Approve the report for publication
- Request specific changes ("add more context on the economic impact")
- Reject and restart with different parameters

The pipeline doesn't lose its work — it pauses cleanly and picks up exactly where it left off.

### Tool Approval for Sensitive Topics

**What it adds:** News API calls can be configured to require explicit approval before executing, surfacing the request to the user interface for a human decision.

**Why it matters:** For certain sensitive topics, a human may want to control which sources are queried. Tool approval lets an editor review and approve each API call before it happens — useful for topics where sourcing decisions carry editorial weight.

---

## Phase 4: Knowledge & Scalability

> Build institutional knowledge, broaden sourcing, and prepare for production scale.

### Knowledge Base of Past Reports

**What it adds:** Every completed report is automatically chunked, embedded, and stored in a searchable vector database. The Researcher agent gains the ability to search this knowledge base alongside live news APIs.

**Why it matters:** This gives Aperture an editorial archive — an ever-growing body of its own prior work. Benefits include:

- **Continuity**: Reports can reference prior coverage ("as we reported in January...")
- **Depth**: Background context from past reports enriches new ones
- **Efficiency**: The Researcher doesn't start from zero on topics it has covered before
- **Consistency**: Past editorial decisions inform future ones

Over time, this transforms Aperture from a stateless report generator into a publication with institutional memory.

### Additional News Sources

**What it adds:** New source integrations beyond NewsAPI.org and The Guardian:

- **RSS feed parser** — configurable for any publication, enabling niche and specialized sources
- **AP News** — one of the world's largest news agencies, strong on breaking news
- **Reuters** — global wire service with deep coverage of business and international affairs

**Why it matters:** Source diversity directly impacts report quality. The current two-source setup means reports may miss important perspectives or over-index on certain editorial viewpoints. More sources lead to higher scores on source attribution and completeness, and produce reports that better represent the full picture.

### Streaming Report Delivery

**What it adds:** Reports are delivered progressively to the user interface as they're generated, rather than waiting for the entire pipeline to complete before showing anything.

**Why it matters:** The current pipeline can take 30-60 seconds to produce a report, during which the user sees nothing. Streaming shows the report taking shape in real time — research findings appearing, the draft forming paragraph by paragraph, edits being applied. This dramatically improves perceived performance and gives users confidence the system is working.

### Context Management

**What it adds:** Intelligent filtering of conversation history passed between agents, ensuring each agent receives only the context it needs rather than the entire conversation.

**Why it matters:** As sessions grow longer (especially with memory and multi-turn conversations), the amount of context passed between agents can balloon, increasing costs and degrading quality. Context management keeps agent interactions focused and token-efficient, which matters both for response quality and for cost at scale.

---

## Summary

| Phase | Focus | Outcome |
|-------|-------|---------|
| **1** | Safety & Quality | Reports are protected from misuse, free of hallucinations and bias, and continuously monitored for quality |
| **2** | Memory & Context | The system learns from experience, maintains conversational context, and builds on previous coverage |
| **3** | Orchestration & Review | Agents collaborate dynamically, self-correct toward quality targets, and humans can review before publication |
| **4** | Knowledge & Scale | An ever-growing knowledge base, broader sourcing, real-time delivery, and efficient resource usage |
