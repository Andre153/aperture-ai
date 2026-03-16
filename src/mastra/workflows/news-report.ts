import { createWorkflow, createStep } from '@mastra/core/workflows'
import { z } from 'zod'
import { ArticleSchema, type Article } from '../types/article'
import { searchNewsTool } from '../tools/search-news'
import { fetchGuardianNewsTool } from '../tools/fetch-guardian-news'

const SourceSchema = z.object({ title: z.string(), url: z.string(), source: z.string() })

// ---------- Step 1: Gather sources from both news APIs + researcher analysis ----------

const gatherSourcesStep = createStep({
  id: 'gather-sources',
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    articles: z.array(ArticleSchema),
    articleCount: z.number(),
    researchBrief: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const { topic } = inputData

    // Call both news tools directly for reliable article extraction.
    // Empty context is safe here — these tools only use their inputData, not execution context.
    const toolContext = {} as Parameters<NonNullable<typeof searchNewsTool.execute>>[1]
    const [newsApiResult, guardianResult] = await Promise.allSettled([
      searchNewsTool.execute!({ query: topic, pageSize: 5 }, toolContext),
      fetchGuardianNewsTool.execute!({ query: topic, pageSize: 5 }, toolContext),
    ])

    const articles: Article[] = []

    if (newsApiResult.status === 'fulfilled') {
      articles.push(...newsApiResult.value.articles)
    }
    if (guardianResult.status === 'fulfilled') {
      articles.push(...guardianResult.value.articles)
    }

    // Use the researcher agent to analyze and synthesize the gathered articles
    const researcher = mastra.getAgent('researcherAgent')

    const articleSummary = articles
      .map((a) => `- "${a.title}" (${a.source}, ${a.publishedAt}): ${a.description ?? 'No description'}`)
      .join('\n')

    const response = await researcher.generate(
      `Analyze these news articles about "${topic}" and produce a research brief highlighting key themes, facts, and perspectives.\n\nArticles found:\n${articleSummary}`,
    )

    return {
      topic,
      articles,
      articleCount: articles.length,
      researchBrief: response.text,
    }
  },
})

// ---------- Step 2a: Deep analysis (when we have enough articles) ----------

const deepAnalysisStep = createStep({
  id: 'deep-analysis',
  inputSchema: z.object({
    topic: z.string(),
    articles: z.array(ArticleSchema),
    articleCount: z.number(),
    researchBrief: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    researchBrief: z.string(),
    articles: z.array(ArticleSchema),
    articleCount: z.number(),
    analysisDepth: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      topic: inputData.topic,
      researchBrief: inputData.researchBrief,
      articles: inputData.articles,
      articleCount: inputData.articleCount,
      analysisDepth: 'comprehensive',
    }
  },
})

// ---------- Step 2b: Brief summary (when few articles found) ----------

const briefSummaryStep = createStep({
  id: 'brief-summary',
  inputSchema: z.object({
    topic: z.string(),
    articles: z.array(ArticleSchema),
    articleCount: z.number(),
    researchBrief: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    researchBrief: z.string(),
    articles: z.array(ArticleSchema),
    articleCount: z.number(),
    analysisDepth: z.string(),
  }),
  execute: async ({ inputData }) => {
    return {
      topic: inputData.topic,
      researchBrief: `LIMITED SOURCES AVAILABLE. ${inputData.researchBrief}`,
      articles: inputData.articles,
      articleCount: inputData.articleCount,
      analysisDepth: 'brief',
    }
  },
})

// ---------- Step 3: Write the report using the Writer Agent ----------

const writeReportStep = createStep({
  id: 'write-report',
  inputSchema: z.object({
    topic: z.string(),
    researchBrief: z.string(),
    articles: z.array(ArticleSchema),
    articleCount: z.number(),
    analysisDepth: z.string(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    draft: z.string(),
    sources: z.array(SourceSchema),
    articleCount: z.number(),
    analysisDepth: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const writer = mastra.getAgent('writerAgent')

    const sourceList = inputData.articles
      .map((a) => `- "${a.title}" (${a.source}) — ${a.url}`)
      .join('\n')

    const depthInstruction =
      inputData.analysisDepth === 'comprehensive'
        ? 'Write a comprehensive, in-depth news report covering multiple angles and themes.'
        : 'Write a concise news brief. Note that limited sources were available, so keep the scope focused.'

    const response = await writer.generate(
      `${depthInstruction}

Topic: ${inputData.topic}

Research findings:
${inputData.researchBrief}

Available sources:
${sourceList}

Write the news report now.`,
    )

    const sources = inputData.articles.map((a) => ({
      title: a.title,
      url: a.url,
      source: a.source,
    }))

    return {
      topic: inputData.topic,
      draft: response.text,
      sources,
      articleCount: inputData.articleCount,
      analysisDepth: inputData.analysisDepth,
    }
  },
})

// ---------- Step 4: Edit and polish using the Editor Agent ----------

const editReportStep = createStep({
  id: 'edit-report',
  inputSchema: z.object({
    topic: z.string(),
    draft: z.string(),
    sources: z.array(SourceSchema),
    articleCount: z.number(),
    analysisDepth: z.string(),
  }),
  outputSchema: z.object({
    report: z.string(),
    topic: z.string(),
    sources: z.array(SourceSchema),
    articleCount: z.number(),
    analysisDepth: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    const editor = mastra.getAgent('editorAgent')

    const response = await editor.generate(
      `Review and polish the following news report draft. Improve clarity, neutrality, and source attribution.

Topic: ${inputData.topic}
Analysis depth: ${inputData.analysisDepth}

Draft:
${inputData.draft}

Return the polished report.`,
    )

    return {
      report: response.text,
      topic: inputData.topic,
      sources: inputData.sources,
      articleCount: inputData.articleCount,
      analysisDepth: inputData.analysisDepth,
    }
  },
})

// ---------- Compose the workflow ----------

export const newsReportWorkflow = createWorkflow({
  id: 'news-report-workflow',
  description:
    'Accepts a news topic and produces a polished news report. Gathers articles from multiple sources, branches on coverage depth, then writes and edits the report.',
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    report: z.string(),
    topic: z.string(),
    sources: z.array(SourceSchema),
    articleCount: z.number(),
    analysisDepth: z.string(),
  }),
})
  .then(gatherSourcesStep)
  .branch([
    [async ({ inputData }) => inputData.articleCount >= 3, deepAnalysisStep],
    [async () => true, briefSummaryStep],
  ])
  .map(async ({ inputData }) => {
    // Normalize branch output — only one branch executes
    const result = inputData['deep-analysis'] ?? inputData['brief-summary']
    if (!result) {
      throw new Error('No branch result: neither deep-analysis nor brief-summary produced output')
    }
    return result
  })
  .then(writeReportStep)
  .then(editReportStep)
  .commit()
