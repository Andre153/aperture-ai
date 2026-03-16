import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { ArticleSchema } from '../types/article'

export const fetchGuardianNewsTool = createTool({
  id: 'fetch-guardian-news',
  description:
    'Search for news articles from The Guardian newspaper. Returns headlines, descriptions, and URLs. Useful for getting high-quality journalism on a topic.',
  inputSchema: z.object({
    query: z.string().describe('The search query for Guardian articles'),
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
    const apiKey = process.env.GUARDIAN_API_KEY
    if (!apiKey) {
      throw new Error('GUARDIAN_API_KEY environment variable is not set')
    }

    const params = new URLSearchParams({
      q: query,
      'page-size': String(pageSize),
      'show-fields': 'trailText',
      'order-by': 'relevance',
      'api-key': apiKey,
    })

    const response = await fetch(`https://content.guardianapis.com/search?${params}`)

    if (!response.ok) {
      throw new Error(`Guardian API HTTP error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    if (data.response?.status !== 'ok') {
      throw new Error(`Guardian API error: ${data.response?.message ?? 'Unknown error'}`)
    }

    const results = data.response?.results ?? []
    const articles = results.map(
      (article: {
        webTitle?: string
        fields?: { trailText?: string }
        sectionName?: string
        webUrl?: string
        webPublicationDate?: string
      }) => ({
        title: article.webTitle ?? 'Untitled',
        description: article.fields?.trailText ?? null,
        source: `The Guardian - ${article.sectionName ?? 'News'}`,
        url: article.webUrl ?? '',
        publishedAt: article.webPublicationDate ?? '',
      }),
    )

    return {
      articles,
      totalResults: data.response?.total ?? 0,
    }
  },
})
