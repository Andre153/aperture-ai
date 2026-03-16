import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Mastra } from '@mastra/core'
import { LibSQLStore } from '@mastra/libsql'
import { Observability, DefaultExporter, SamplingStrategyType } from '@mastra/observability'

import { researcherAgent } from './agents/researcher'
import { writerAgent } from './agents/writer'
import { editorAgent } from './agents/editor'
import { newsReportWorkflow } from './workflows/news-report'
import { reportQualityScorer } from './scorers/report-quality'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = resolve(__dirname, '../../mastra.db')

export const mastra = new Mastra({
  agents: {
    researcherAgent,
    writerAgent,
    editorAgent,
  },
  workflows: {
    newsReportWorkflow,
  },
  scorers: {
    reportQuality: reportQualityScorer,
  },
  storage: new LibSQLStore({
    id: 'aperture-storage',
    url: `file:${dbPath}`,
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: 'aperture',
        sampling: { type: SamplingStrategyType.ALWAYS },
        exporters: [new DefaultExporter()],
      },
    },
  }),
})
