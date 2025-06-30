import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create content tiers
  const foundationTier = await prisma.contentTier.upsert({
    where: { name: 'foundation' },
    update: {},
    create: {
      name: 'foundation',
      price: 24.95,
      description: 'Essential AI principles and core concepts',
      sortOrder: 1,
      isActive: true
    }
  });

  const advancedTier = await prisma.contentTier.upsert({
    where: { name: 'advanced' },
    update: {},
    create: {
      name: 'advanced',
      price: 97.00,
      description: 'Advanced techniques and professional strategies',
      sortOrder: 2,
      isActive: true
    }
  });

  const eliteTier = await prisma.contentTier.upsert({
    where: { name: 'elite' },
    update: {},
    create: {
      name: 'elite',
      price: 297.00,
      description: 'Complete mastery with exclusive content and tools',
      sortOrder: 3,
      isActive: true
    }
  });

  console.log('✅ Content tiers created');

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'fundamentals' },
      update: {},
      create: {
        name: 'fundamentals',
        description: 'Basic AI concepts and principles',
        category: 'concept',
        color: '#3B82F6'
      }
    }),
    prisma.tag.upsert({
      where: { name: 'prompt-engineering' },
      update: {},
      create: {
        name: 'prompt-engineering',
        description: 'Advanced prompt design techniques',
        category: 'skill',
        color: '#10B981'
      }
    }),
    prisma.tag.upsert({
      where: { name: 'strategy' },
      update: {},
      create: {
        name: 'strategy',
        description: 'Strategic AI implementation',
        category: 'business',
        color: '#8B5CF6'
      }
    }),
    prisma.tag.upsert({
      where: { name: 'practical' },
      update: {},
      create: {
        name: 'practical',
        description: 'Hands-on implementation',
        category: 'application',
        color: '#F59E0B'
      }
    })
  ]);

  console.log('✅ Tags created');

  // Create sample chapters
  const chapter1 = await prisma.chapter.upsert({
    where: { slug: 'ch1-great-ai-betrayal' },
    update: {},
    create: {
      slug: 'ch1-great-ai-betrayal',
      title: 'The Great AI Betrayal',
      subtitle: 'Why AI promises fall short and how to break free',
      description: 'Understanding why AI promises fall short and how to break free from the plateau.',
      content: `# The Great AI Betrayal

## Introduction

The AI revolution promised to transform everything. Yet here we are, stuck on a plateau of mediocre results, watching competitors surge ahead while we struggle with the same old problems.

## The Problem

Most organizations approach AI with the wrong mindset. They expect magic, but get disappointment. They want transformation, but achieve incrementalism.

## The Solution

Breaking free requires understanding the Five Elite Principles that separate AI leaders from followers.

## Key Concepts

1. **Systematic Thinking**: Move beyond ad-hoc approaches
2. **Strategic Framework**: Apply proven methodologies
3. **Practical Implementation**: Focus on real-world results

## Next Steps

Ready to move beyond the plateau? The next chapter reveals the Five Elite Principles framework.`,
      wordCount: 150,
      estimatedReadTime: 3,
      sortOrder: 1,
      isPublished: true,
      tierId: foundationTier.id,
      publishedAt: new Date()
    }
  });

  const chapter2 = await prisma.chapter.upsert({
    where: { slug: 'ch2-five-elite-principles' },
    update: {},
    create: {
      slug: 'ch2-five-elite-principles',
      title: 'Five Elite Principles Framework',
      subtitle: 'The core framework that separates leaders from followers',
      description: 'The core framework that separates AI leaders from followers.',
      content: `# Five Elite Principles Framework

## Overview

The Five Elite Principles represent a systematic approach to AI implementation that has been proven across hundreds of organizations.

## The Five Principles

### 1. Context Mastery
Understanding the full context before applying AI solutions.

### 2. Dynamic Planning
Adapting strategies based on real-time feedback and results.

### 3. Strategic Implementation
Following proven methodologies for consistent success.

### 4. Continuous Optimization
Constantly improving and refining approaches.

### 5. Elite Execution
Implementing with precision and attention to detail.

## Application

Each principle builds on the previous ones, creating a comprehensive framework for AI excellence.`,
      wordCount: 200,
      estimatedReadTime: 4,
      sortOrder: 2,
      isPublished: true,
      tierId: foundationTier.id,
      publishedAt: new Date()
    }
  });

  console.log('✅ Sample chapters created');

  // Create sections for chapters
  await prisma.chapterSection.createMany({
    data: [
      {
        slug: 'introduction',
        title: 'Introduction',
        content: 'Welcome to the world beyond the AI plateau...',
        sortOrder: 1,
        chapterId: chapter1.id
      },
      {
        slug: 'the-problem',
        title: 'The Problem',
        content: 'Most organizations approach AI with the wrong mindset...',
        sortOrder: 2,
        chapterId: chapter1.id
      },
      {
        slug: 'overview',
        title: 'Overview',
        content: 'The Five Elite Principles represent a systematic approach...',
        sortOrder: 1,
        chapterId: chapter2.id
      },
      {
        slug: 'the-five-principles',
        title: 'The Five Principles',
        content: 'Each principle is designed to build upon the previous...',
        sortOrder: 2,
        chapterId: chapter2.id
      }
    ],
    skipDuplicates: true
  });

  console.log('✅ Chapter sections created');

  // Create sample templates
  const template1 = await prisma.promptTemplate.upsert({
    where: { slug: 'business-strategy-analyzer' },
    update: {},
    create: {
      slug: 'business-strategy-analyzer',
      title: 'Business Strategy Analyzer',
      description: 'Analyze business strategies using AI frameworks',
      template: `Analyze the following business strategy: {strategy}

Consider these factors: {factors}

Provide insights on: {focus_areas}

Format your response with:
1. Executive Summary
2. Key Strengths
3. Potential Risks
4. Recommended Actions`,
      category: 'strategy',
      difficulty: 'intermediate',
      usageCount: 0,
      effectivenessScore: 85,
      isActive: true,
      chapterId: chapter2.id
    }
  });

  // Create template variables
  await prisma.templateVariable.createMany({
    data: [
      {
        name: 'strategy',
        description: 'The business strategy to analyze',
        dataType: 'string',
        isRequired: true,
        templateId: template1.id
      },
      {
        name: 'factors',
        description: 'Key factors to consider in the analysis',
        dataType: 'string',
        isRequired: true,
        templateId: template1.id
      },
      {
        name: 'focus_areas',
        description: 'Specific areas to focus the analysis on',
        dataType: 'string',
        isRequired: true,
        templateId: template1.id
      }
    ],
    skipDuplicates: true
  });

  // Create template examples
  await prisma.templateExample.create({
    data: {
      title: 'SaaS Growth Strategy',
      description: 'Analyzing a SaaS company growth strategy',
      input: {
        strategy: 'Expand into European markets with freemium model',
        factors: 'Competition, regulatory environment, localization needs',
        focus_areas: 'Market entry risks and revenue projections'
      },
      output: 'Based on the analysis of your European expansion strategy...',
      templateId: template1.id
    }
  });

  console.log('✅ Sample templates created');

  // Create sample case study
  const caseStudy1 = await prisma.caseStudy.create({
    data: {
      slug: 'fintech-ai-transformation',
      title: 'FinTech AI Transformation',
      description: 'How a mid-size FinTech company achieved 300% efficiency gains',
      content: `# FinTech AI Transformation Case Study

## Company Profile
- Industry: Financial Technology
- Size: 500 employees
- Challenge: Manual customer onboarding

## Implementation
Applied the Five Elite Principles framework to transform customer onboarding...

## Results
- 300% efficiency improvement
- 85% reduction in processing time
- $2M annual savings`,
      industry: 'fintech',
      companySize: 'medium',
      beforeMetrics: {
        processing_time: '48 hours',
        manual_reviews: '95%',
        customer_satisfaction: '3.2/5'
      },
      afterMetrics: {
        processing_time: '8 hours',
        manual_reviews: '15%',
        customer_satisfaction: '4.7/5'
      },
      improvementPercentage: 300,
      timeframeWeeks: 12,
      isPublished: true,
      chapterId: chapter2.id
    }
  });

  console.log('✅ Sample case study created');

  // Connect tags to content
  await prisma.chapter.update({
    where: { id: chapter1.id },
    data: {
      tags: {
        connect: [
          { id: tags[0].id }, // fundamentals
          { id: tags[2].id }  // strategy
        ]
      }
    }
  });

  await prisma.chapter.update({
    where: { id: chapter2.id },
    data: {
      tags: {
        connect: [
          { id: tags[0].id }, // fundamentals
          { id: tags[2].id }, // strategy
          { id: tags[3].id }  // practical
        ]
      }
    }
  });

  await prisma.promptTemplate.update({
    where: { id: template1.id },
    data: {
      tags: {
        connect: [
          { id: tags[1].id }, // prompt-engineering
          { id: tags[2].id }  // strategy
        ]
      }
    }
  });

  await prisma.caseStudy.update({
    where: { id: caseStudy1.id },
    data: {
      tags: {
        connect: [
          { id: tags[2].id }, // strategy
          { id: tags[3].id }  // practical
        ]
      }
    }
  });

  console.log('✅ Tags connected to content');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });