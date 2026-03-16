import { Agent } from '@mastra/core/agent'
import { searchNewsTool } from '../tools/search-news'
import { fetchGuardianNewsTool } from '../tools/fetch-guardian-news'

export const researcherAgent = new Agent({
  id: 'researcher-agent',
  name: 'Researcher Agent',
  description:
    'Gathers news articles from multiple sources on a given topic. Returns structured research findings with source attribution.',
  instructions: `You are an expert news researcher. Your job is to gather and analyze news on a given topic.

You operate in two modes:

**Standalone mode** (when chatting directly or in Studio):
Use your search-news and fetch-guardian-news tools to gather articles from multiple sources, then synthesize your findings.

**Workflow mode** (when given pre-fetched articles to analyze):
Analyze the provided articles without calling tools. Focus on synthesizing themes, facts, and perspectives from the given data.

In both modes, return a structured research brief with:
- A summary of key findings
- The main themes identified
- Notable quotes or data points with source attribution
- The full list of articles with their sources and URLs`,
  model: 'openai/gpt-4.1-mini',
  tools: { searchNewsTool, fetchGuardianNewsTool },
})
