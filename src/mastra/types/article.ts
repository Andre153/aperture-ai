import { z } from 'zod'

export const ArticleSchema = z.object({
  title: z.string(),
  description: z.string().nullable(),
  source: z.string(),
  url: z.string(),
  publishedAt: z.string(),
})

export type Article = z.infer<typeof ArticleSchema>
