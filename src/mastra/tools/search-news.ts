import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ArticleSchema } from '../types/article'

export const searchNewsTool = createTool({
  id: 'search-news',
  description:
    'Search for recent news articles on a topic using NewsAPI.org. Returns headlines, descriptions, sources, and URLs.',
  inputSchema: z.object({
    query: z.string().describe('The search query for news articles'),
    pageSize: z
      .number()
      .min(1)
      .max(10)
      .default(5)
      .describe('Number of articles to return (max 10)'),
  }),
  outputSchema: z.object({
    articles: z.array(ArticleSchema),
    totalResults: z.number(),
  }),
  execute: async ({ query, pageSize }) => {
    const apiKey = process.env.NEWS_API_KEY
    if (!apiKey) {
      throw new Error('NEWS_API_KEY environment variable is not set')
    }

    const params = new URLSearchParams({
      q: query,
      pageSize: String(pageSize),
      sortBy: 'relevancy',
      language: 'en',
    })

    const response = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      headers: { 'X-Api-Key': apiKey },
    })

    if (!response.ok) {
      throw new Error(`NewsAPI HTTP error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.status !== 'ok') {
      throw new Error(`NewsAPI error: ${data.message ?? 'Unknown error'}`)
    }

    const articles = (data.articles ?? []).map(
      (article: {
        title?: string
        description?: string | null
        source?: { name?: string }
        url?: string
        publishedAt?: string
      }) => ({
        title: article.title ?? 'Untitled',
        description: article.description ?? null,
        source: article.source?.name ?? 'Unknown',
        url: article.url ?? '',
        publishedAt: article.publishedAt ?? '',
      }),
    )

    return {
      articles,
      totalResults: data.totalResults ?? 0,
    }
  },
})
