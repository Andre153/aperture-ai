/**
 * Seed script for the Aperture news topics dataset.
 *
 * Run with: npm run seed
 */
import { mastra } from '../src/mastra/index'

async function seed() {
  const datasets = mastra.datasets

  // Create the dataset
  const dataset = await datasets.create({
    name: 'aperture-news-topics',
    description: 'Test cases for evaluating news report generation across diverse topics',
  })

  console.log(`Created dataset: ${dataset.id}`)

  // Seed with 6 diverse news topics
  await dataset.addItems({
    items: [
      {
        input: { topic: 'AI regulation in the European Union' },
        groundTruth: {
          expectedMinSources: 2,
          expectedTone: 'neutral',
          expectedFocus: 'policy and legislation',
          description:
            'Should cover EU AI Act, key provisions, industry impact, and multiple stakeholder perspectives',
        },
      },
      {
        input: { topic: 'Climate tech investment trends' },
        groundTruth: {
          expectedMinSources: 2,
          expectedTone: 'neutral',
          expectedFocus: 'investment and market data',
          description:
            'Should include funding figures, notable startups or deals, sector breakdown, and market outlook',
        },
      },
      {
        input: { topic: 'Quantum computing breakthroughs' },
        groundTruth: {
          expectedMinSources: 1,
          expectedTone: 'neutral',
          expectedFocus: 'scientific and technical developments',
          description:
            'Should cover recent milestones, key players (Google, IBM, etc.), practical applications, and timeline expectations',
        },
      },
      {
        input: { topic: 'Global supply chain disruptions' },
        groundTruth: {
          expectedMinSources: 2,
          expectedTone: 'neutral',
          expectedFocus: 'business and economic impact',
          description:
            'Should address causes, affected industries, economic data, and mitigation strategies',
        },
      },
      {
        input: { topic: 'Space exploration milestones 2025' },
        groundTruth: {
          expectedMinSources: 1,
          expectedTone: 'neutral',
          expectedFocus: 'scientific achievements and missions',
          description:
            'Should cover recent missions, key space agencies, commercial spaceflight developments, and upcoming milestones',
        },
      },
      {
        input: { topic: 'Cybersecurity threats in healthcare' },
        groundTruth: {
          expectedMinSources: 2,
          expectedTone: 'neutral',
          expectedFocus: 'security incidents and healthcare sector impact',
          description:
            'Should address recent attacks, vulnerabilities, patient data risks, and defensive measures',
        },
      },
    ],
  })

  console.log('Seeded 6 items into the dataset')

  // Verify
  const result = await dataset.listItems({})
  const items = Array.isArray(result) ? result : result.items
  console.log(`Verified: ${items.length} items in dataset`)

  for (const item of items) {
    console.log(`  - ${(item.input as { topic: string }).topic}`)
  }

  console.log('\nDone! You can now run experiments in Mastra Studio.')
}

seed().catch(console.error)
