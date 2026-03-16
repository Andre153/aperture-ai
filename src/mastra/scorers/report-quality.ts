import { createScorer } from '@mastra/core/evals'
import { z } from 'zod'

interface SubScore {
  score: number
  details: string
}

interface AnalysisResult {
  sourceAttribution: SubScore
  neutrality: SubScore
  completeness: SubScore
  structure: SubScore
}

const REPORT_QUALITY_INSTRUCTIONS = `You are a senior news editor evaluating the quality of AI-generated news reports. You assess reports on four criteria: source attribution, neutrality, completeness, and structure. Be rigorous but fair in your evaluation.`

export const reportQualityScorer = createScorer({
  id: 'report-quality',
  description:
    'Evaluates the quality of a news report based on source attribution, neutrality, completeness, and structure.',
  judge: {
    model: 'openai/gpt-4.1-nano',
    instructions: REPORT_QUALITY_INSTRUCTIONS,
  },
})
  .preprocess(({ run }) => {
    // Extract the report text — handle both string output and workflow JSON object
    const raw = run.output
    const text =
      typeof raw === 'string'
        ? raw
        : typeof (raw as { report?: string })?.report === 'string'
          ? (raw as { report: string }).report
          : raw != null
            ? JSON.stringify(raw)
            : ''

    const wordCount = text.split(/\s+/).length
    const paragraphCount = text.split(/\n\n+/).filter((p: string) => p.trim().length > 0).length
    const hasHeadline = /^#\s|^[A-Z][^.!?]*\n/m.test(text)
    const sourcesMentioned = (text.match(/according to|reported by|source:|as per/gi) ?? []).length
    const urlCount = (text.match(/https?:\/\/[^\s)]+/g) ?? []).length

    const groundTruth = run.groundTruth as {
      expectedMinSources?: number
      expectedTone?: string
      expectedFocus?: string
      description?: string
    } | undefined

    return {
      text,
      wordCount,
      paragraphCount,
      hasHeadline,
      sourcesMentioned,
      urlCount,
      groundTruth: groundTruth ?? null,
    }
  })
  .analyze({
    description:
      'Analyze the news report for source attribution, neutrality, completeness, and structure',
    outputSchema: z.object({
      sourceAttribution: z.object({
        score: z.number().min(0).max(1),
        details: z.string(),
      }),
      neutrality: z.object({
        score: z.number().min(0).max(1),
        details: z.string(),
      }),
      completeness: z.object({
        score: z.number().min(0).max(1),
        details: z.string(),
      }),
      structure: z.object({
        score: z.number().min(0).max(1),
        details: z.string(),
      }),
    }),
    createPrompt: ({ run, results }) => {
      const stats = results.preprocessStepResult
      const gt = stats.groundTruth

      const groundTruthSection = gt
        ? `
**Ground truth expectations:**
- Expected minimum sources: ${gt.expectedMinSources ?? 'not specified'}
- Expected tone: ${gt.expectedTone ?? 'not specified'}
- Expected focus: ${gt.expectedFocus ?? 'not specified'}
- Description: ${gt.description ?? 'not specified'}

Factor these expectations into your scores:
- Source Attribution: penalize if fewer inline attributions than expectedMinSources
- Neutrality: verify the tone matches expectedTone
- Completeness: verify the report covers the expectedFocus area and satisfies the description
`
        : ''

      return `Evaluate this news report on four criteria. Score each from 0.0 to 1.0.

**Report text:**
${stats.text}

**Metadata:**
- Word count: ${stats.wordCount}
- Paragraph count: ${stats.paragraphCount}
- Has headline: ${stats.hasHeadline}
- Source attributions found: ${stats.sourcesMentioned}
- URLs found: ${stats.urlCount}

**User's original input/topic:**
${typeof run.input === 'string' ? run.input : JSON.stringify(run.input)}
${groundTruthSection}
**Evaluation criteria:**

1. **Source Attribution** (0.0-1.0): Are claims supported by named sources? Are sources diverse? Are URLs or references provided?
2. **Neutrality** (0.0-1.0): Is the tone objective and balanced? Are multiple perspectives presented? Is there editorializing or bias?
3. **Completeness** (0.0-1.0): Does the report cover the key aspects of the topic? Are important angles missing?
4. **Structure** (0.0-1.0): Does the report have a clear headline, lead, body, and sources section? Is the flow logical?

Return your evaluation as JSON.`
    },
  })
  .generateScore(({ results }) => {
    const analysis = results.analyzeStepResult as AnalysisResult

    // Weighted average: attribution and completeness weighted higher
    const weighted =
      analysis.sourceAttribution.score * 0.3 +
      analysis.neutrality.score * 0.2 +
      analysis.completeness.score * 0.3 +
      analysis.structure.score * 0.2

    if (isNaN(weighted)) {
      throw new Error(`Scorer produced NaN. analyzeStepResult: ${JSON.stringify(analysis)}`)
    }

    return Math.round(weighted * 100) / 100
  })
  .generateReason({
    description: 'Generate a human-readable explanation of the report quality score',
    createPrompt: ({ results, score }) => {
      const analysis = results.analyzeStepResult as AnalysisResult
      const gt = results.preprocessStepResult.groundTruth

      const groundTruthNote = gt
        ? `\nGround truth expectations: focus on "${gt.expectedFocus ?? 'N/A'}", tone "${gt.expectedTone ?? 'N/A'}", min sources ${gt.expectedMinSources ?? 'N/A'}. Note whether these were met.`
        : ''

      return `Summarize the evaluation of this news report in 2-3 sentences.

Overall score: ${score}

Sub-scores:
- Source Attribution: ${analysis.sourceAttribution.score} — ${analysis.sourceAttribution.details}
- Neutrality: ${analysis.neutrality.score} — ${analysis.neutrality.details}
- Completeness: ${analysis.completeness.score} — ${analysis.completeness.details}
- Structure: ${analysis.structure.score} — ${analysis.structure.details}
${groundTruthNote}
Provide a concise summary focusing on strengths and areas for improvement.`
    },
  })
