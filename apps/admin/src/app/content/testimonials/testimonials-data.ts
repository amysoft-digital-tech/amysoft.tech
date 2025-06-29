import { Injectable } from '@angular/core';

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar?: string;
  content: string;
  rating: number;
  metrics?: TestimonialMetrics;
  featured: boolean;
  verified: boolean;
  category: 'developer' | 'architect' | 'lead' | 'manager';
  experienceLevel: 'junior' | 'mid' | 'senior' | 'principal';
  tags: string[];
  submittedAt: Date;
  approvedAt?: Date;
  displayOrder: number;
}

export interface TestimonialMetrics {
  productivityIncrease?: number; // percentage
  timeReduction?: number; // percentage  
  codeQualityImprovement?: number; // percentage
  implementationTimeWeeks?: number;
  specificAchievement?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  subtitle: string;
  participant: {
    name: string;
    title: string;
    company: string;
    experienceYears: number;
    avatar?: string;
  };
  challenge: {
    summary: string;
    details: string;
    painPoints: string[];
    timelineBeforeIntervention: string;
  };
  intervention: {
    approach: string;
    principlesApplied: string[];
    timeframe: string;
    keyTechniques: string[];
  };
  results: {
    summary: string;
    metrics: CaseStudyMetrics;
    qualitativeChanges: string[];
    participantQuote: string;
  };
  implementation: {
    week1to4: string[];
    week5to8: string[];
    week9to12: string[];
    keyLessons: string[];
  };
  category: 'transformation' | 'specific_skill' | 'team_implementation';
  featured: boolean;
  publishedAt: Date;
  estimatedReadTime: number;
}

export interface CaseStudyMetrics {
  productivityGain: number;
  timeReduction: number;
  codeQualityScore: number;
  deliverySpeedIncrease: number;
  errorReduction: number;
  teamSatisfactionIncrease?: number;
}

@Injectable({
  providedIn: 'root'
})
export class TestimonialsDataService {
  
  // Developer-focused testimonials with specific metrics
  private readonly testimonials: Testimonial[] = [
    {
      id: 'testimonial_001',
      name: 'Sarah Chen',
      title: 'Senior Full Stack Developer',
      company: 'TechFlow Solutions',
      content: 'The Context Mastery principle completely transformed how I approach complex features. Instead of spending 3-4 hours debugging obscure issues, I now get precise, actionable solutions in minutes. My code review feedback improved from "needs major revision" to "excellent implementation" consistently.',
      rating: 5,
      metrics: {
        productivityIncrease: 85,
        timeReduction: 70,
        codeQualityImprovement: 60,
        implementationTimeWeeks: 8,
        specificAchievement: 'Reduced debugging time from 4 hours to 30 minutes per complex feature'
      },
      featured: true,
      verified: true,
      category: 'developer',
      experienceLevel: 'senior',
      tags: ['debugging', 'code-quality', 'context-mastery'],
      submittedAt: new Date('2024-01-15'),
      approvedAt: new Date('2024-01-16'),
      displayOrder: 1
    },
    {
      id: 'testimonial_002', 
      name: 'Marcus Rodriguez',
      title: 'Lead Software Engineer',
      company: 'DataCore Systems',
      content: 'Dynamic Planning saved my project. We were 6 weeks behind schedule with a critical API rewrite. Using the strategic decomposition templates, I broke down the complexity and delivered 2 weeks early. My manager asked me to train the entire team on my approach.',
      rating: 5,
      metrics: {
        productivityIncrease: 120,
        timeReduction: 65,
        implementationTimeWeeks: 4,
        specificAchievement: 'Delivered critical project 2 weeks early instead of 6 weeks late'
      },
      featured: true,
      verified: true,
      category: 'lead',
      experienceLevel: 'senior',
      tags: ['project-management', 'dynamic-planning', 'deadlines'],
      submittedAt: new Date('2024-01-20'),
      approvedAt: new Date('2024-01-21'),
      displayOrder: 2
    },
    {
      id: 'testimonial_003',
      name: 'Jennifer Park',
      title: 'Software Architect',
      company: 'CloudNative Corp',
      content: 'Code Evolution principle helped me refactor a legacy monolith into microservices without breaking anything. The incremental transformation approach meant zero downtime and the team could continue feature development throughout. We completed in 10 weeks what we estimated would take 6 months.',
      rating: 5,
      metrics: {
        productivityIncrease: 95,
        timeReduction: 80,
        implementationTimeWeeks: 10,
        specificAchievement: 'Completed 6-month refactor in 10 weeks with zero downtime'
      },
      featured: true,
      verified: true,
      category: 'architect',
      experienceLevel: 'principal',
      tags: ['refactoring', 'architecture', 'code-evolution'],
      submittedAt: new Date('2024-01-25'),
      approvedAt: new Date('2024-01-26'),
      displayOrder: 3
    },
    {
      id: 'testimonial_004',
      name: 'David Kim',
      title: 'Mid-Level Developer',
      company: 'StartupFlow',
      content: 'As someone who struggled with testing, Strategic Testing gave me confidence. I went from avoiding tests to writing comprehensive test suites that actually catch bugs before production. My code coverage went from 20% to 85% and I haven\'t had a production bug in 3 months.',
      rating: 5,
      metrics: {
        codeQualityImprovement: 90,
        timeReduction: 50,
        implementationTimeWeeks: 6,
        specificAchievement: 'Increased code coverage from 20% to 85%, zero production bugs in 3 months'
      },
      featured: false,
      verified: true,
      category: 'developer',
      experienceLevel: 'mid',
      tags: ['testing', 'quality', 'strategic-testing'],
      submittedAt: new Date('2024-02-01'),
      approvedAt: new Date('2024-02-02'),
      displayOrder: 4
    },
    {
      id: 'testimonial_005',
      name: 'Priya Patel',
      title: 'Technical Team Lead',
      company: 'FinanceFirst',
      content: 'Intelligent Review transformed our code review process. Reviews that used to take 2-3 days now happen same-day with more thorough feedback. Team velocity increased 40% and junior developers are learning faster than ever. The systematic approach eliminated review bottlenecks.',
      rating: 5,
      metrics: {
        productivityIncrease: 40,
        timeReduction: 75,
        teamSatisfactionIncrease: 65,
        implementationTimeWeeks: 3,
        specificAchievement: 'Reduced code review time from 2-3 days to same-day with better quality'
      },
      featured: false,
      verified: true,
      category: 'lead',
      experienceLevel: 'senior',
      tags: ['code-review', 'team-velocity', 'intelligent-review'],
      submittedAt: new Date('2024-02-05'),
      approvedAt: new Date('2024-02-06'),
      displayOrder: 5
    },
    {
      id: 'testimonial_006',
      name: 'Alex Thompson',
      title: 'Junior Developer',
      company: 'WebCraft Solutions',
      content: 'I was overwhelmed trying to learn modern development practices. The 12-week roadmap gave me structure and the prompt templates made me productive from week 1. My senior developer said my code quality improved faster than any junior they\'ve mentored.',
      rating: 5,
      metrics: {
        productivityIncrease: 150,
        codeQualityImprovement: 85,
        implementationTimeWeeks: 12,
        specificAchievement: 'Fastest improvement rate for junior developer according to senior mentor'
      },
      featured: false,
      verified: true,
      category: 'developer',
      experienceLevel: 'junior',
      tags: ['learning', 'mentorship', 'roadmap'],
      submittedAt: new Date('2024-02-10'),
      approvedAt: new Date('2024-02-11'),
      displayOrder: 6
    }
  ];

  // Case studies with detailed transformation stories
  private readonly caseStudies: CaseStudy[] = [
    {
      id: 'case_study_001',
      title: 'From 6-Week Delays to 2-Week Early Delivery',
      subtitle: 'How Dynamic Planning Transformed a Critical API Project',
      participant: {
        name: 'Marcus Rodriguez',
        title: 'Lead Software Engineer',
        company: 'DataCore Systems',
        experienceYears: 8,
        avatar: '/assets/testimonials/marcus-rodriguez.jpg'
      },
      challenge: {
        summary: 'Critical customer-facing API rewrite was 6 weeks behind schedule with mounting technical debt and unclear requirements.',
        details: 'DataCore Systems needed to rewrite their core customer API to handle 10x traffic growth. The existing system was a monolithic PHP application that couldn\'t scale. Initial attempts resulted in scope creep, unclear architecture decisions, and a demoralized team.',
        painPoints: [
          'Unclear technical requirements and constantly changing scope',
          'Legacy code dependencies that weren\'t properly mapped',
          'Team burnout from repeated failed attempts',
          'Customer pressure due to performance issues in production',
          'No clear decomposition strategy for the complex migration'
        ],
        timelineBeforeIntervention: '6 weeks behind schedule, estimated 12 more weeks needed'
      },
      intervention: {
        approach: 'Applied Dynamic Planning principle with systematic decomposition and iterative validation',
        principlesApplied: ['Dynamic Planning', 'Context Mastery', 'Strategic Testing'],
        timeframe: '4 weeks intensive implementation',
        keyTechniques: [
          'Strategic decomposition using the API Migration template',
          'Context-aware requirement gathering with stakeholder mapping',
          'Incremental validation with automated testing at each milestone',
          'Risk-driven development prioritizing critical path dependencies'
        ]
      },
      results: {
        summary: 'Delivered the complete API rewrite 2 weeks ahead of the revised timeline with zero production issues.',
        metrics: {
          productivityGain: 120,
          timeReduction: 65,
          codeQualityScore: 94,
          deliverySpeedIncrease: 85,
          errorReduction: 90,
          teamSatisfactionIncrease: 80
        },
        qualitativeChanges: [
          'Team confidence restored through systematic wins',
          'Clear visibility into progress for all stakeholders',
          'Reduced stress and overtime through better planning',
          'Improved code quality through incremental validation'
        ],
        participantQuote: 'Dynamic Planning didn\'t just save the project - it taught me how to approach any complex technical challenge with confidence. My manager asked me to train the entire engineering team.'
      },
      implementation: {
        week1to4: [
          'Applied Strategic Decomposition template to break API into 12 discrete modules',
          'Used Context Mastery to map all legacy dependencies and business requirements',
          'Set up automated testing pipeline for continuous validation',
          'Created incremental delivery plan with weekly stakeholder demos'
        ],
        week5to8: [
          'Implemented core authentication and routing modules',
          'Migrated 60% of endpoints with zero downtime strategy',
          'Established monitoring and performance benchmarking',
          'Validated scalability improvements with load testing'
        ],
        week9to12: [
          'Completed remaining endpoint migrations',
          'Achieved 99.9% uptime during transition period',
          'Delivered 10x performance improvement in API response times',
          'Created comprehensive documentation and team training materials'
        ],
        keyLessons: [
          'Systematic decomposition prevents overwhelming complexity',
          'Context understanding is critical before writing any code',
          'Incremental validation catches issues early when they\'re fixable',
          'Clear milestone communication builds stakeholder confidence'
        ]
      },
      category: 'transformation',
      featured: true,
      publishedAt: new Date('2024-02-15'),
      estimatedReadTime: 8
    },
    {
      id: 'case_study_002',
      title: 'Eliminating Production Bugs Through Strategic Testing',
      subtitle: 'A Junior Developer\'s Journey to Testing Excellence',
      participant: {
        name: 'David Kim',
        title: 'Mid-Level Developer (formerly Junior)',
        company: 'StartupFlow',
        experienceYears: 3,
        avatar: '/assets/testimonials/david-kim.jpg'
      },
      challenge: {
        summary: 'Junior developer struggling with testing causing frequent production bugs and impacting team velocity.',
        details: 'David was a bootcamp graduate with strong coding skills but minimal testing experience. His features consistently introduced bugs that weren\'t caught until production, creating firefighting cycles and eroding team trust.',
        painPoints: [
          'No systematic approach to testing - wrote tests as afterthought',
          'Production bugs every 2-3 releases requiring hotfixes',
          'Team losing confidence in feature assignments',
          'Spending more time debugging than developing new features',
          'Overwhelming anxiety about each deployment'
        ],
        timelineBeforeIntervention: '8 production bugs in 6 weeks, team considering reassignment'
      },
      intervention: {
        approach: 'Implemented Strategic Testing principle with focus on confidence-building and systematic test design',
        principlesApplied: ['Strategic Testing', 'Code Evolution', 'Intelligent Review'],
        timeframe: '6 weeks with weekly mentoring sessions',
        keyTechniques: [
          'Test-driven development using Strategic Testing templates',
          'Systematic coverage analysis and gap identification',
          'Incremental skill building with complexity progression',
          'Intelligent review process for test quality validation'
        ]
      },
      results: {
        summary: 'Achieved zero production bugs in 3 months with 85% code coverage and became team\'s testing advocate.',
        metrics: {
          productivityGain: 75,
          timeReduction: 60,
          codeQualityScore: 89,
          deliverySpeedIncrease: 45,
          errorReduction: 95
        },
        qualitativeChanges: [
          'Gained confidence in deploying features',
          'Became go-to person for testing questions',
          'Eliminated deployment anxiety and stress',
          'Started mentoring other junior developers'
        ],
        participantQuote: 'Strategic Testing gave me a systematic way to think about quality. I went from avoiding tests to being excited about them because I finally understood how to make them valuable.'
      },
      implementation: {
        week1to4: [
          'Learned test categorization and coverage strategy',
          'Applied unit testing templates to existing features',
          'Set up automated test runner and coverage reporting',
          'Practiced edge case identification techniques'
        ],
        week5to8: [
          'Implemented integration testing for API interactions',
          'Added end-to-end testing for critical user flows',
          'Achieved 60% code coverage with high-quality tests',
          'Started reviewing teammates\' test strategies'
        ],
        week9to12: [
          'Reached 85% code coverage with maintainable test suite',
          'Zero production bugs for 8 consecutive releases',
          'Created testing guidelines for other junior developers',
          'Became team advocate for test-driven development'
        ],
        keyLessons: [
          'Testing confidence comes from systematic approach, not intuition',
          'Quality tests prevent more time waste than they create',
          'Understanding test categories prevents over/under-testing',
          'Regular practice builds testing intuition over time'
        ]
      },
      category: 'specific_skill',
      featured: true,
      publishedAt: new Date('2024-02-20'),
      estimatedReadTime: 7
    },
    {
      id: 'case_study_003',
      title: 'Team Transformation: From Review Bottlenecks to Flow State',
      subtitle: 'How Intelligent Review Scaled a 12-Person Engineering Team',
      participant: {
        name: 'Priya Patel',
        title: 'Technical Team Lead',
        company: 'FinanceFirst',
        experienceYears: 10,
        avatar: '/assets/testimonials/priya-patel.jpg'
      },
      challenge: {
        summary: 'Code reviews became the primary bottleneck for a fast-growing fintech team, causing feature delays and developer frustration.',
        details: 'FinanceFirst\'s engineering team grew from 5 to 12 developers in 6 months. Code reviews that used to take hours now took days, creating a cascade of delays. Senior developers were overwhelmed, junior developers felt ignored, and feature velocity plummeted.',
        painPoints: [
          'Code reviews taking 2-3 days instead of same-day',
          'Inconsistent review quality across different reviewers',
          'Junior developers not learning efficiently from review feedback',
          'Senior developers spending 40%+ time on reviews',
          'Features backing up in review queue causing missed deadlines'
        ],
        timelineBeforeIntervention: '3-day average review time, 40% drop in team velocity'
      },
      intervention: {
        approach: 'Implemented Intelligent Review principle with systematic review templates and knowledge transfer protocols',
        principlesApplied: ['Intelligent Review', 'Context Mastery', 'Dynamic Planning'],
        timeframe: '3 weeks team-wide implementation',
        keyTechniques: [
          'Systematic review checklist and quality templates',
          'Context-aware review assignments based on expertise',
          'Asynchronous knowledge transfer through structured feedback',
          'Automated review routing and priority management'
        ]
      },
      results: {
        summary: 'Reduced review time to same-day with higher quality feedback and improved team learning velocity.',
        metrics: {
          productivityGain: 40,
          timeReduction: 75,
          codeQualityScore: 92,
          deliverySpeedIncrease: 65,
          errorReduction: 70,
          teamSatisfactionIncrease: 85
        },
        qualitativeChanges: [
          'Junior developers learning faster through structured feedback',
          'Senior developers focusing on architecture instead of syntax',
          'Consistent review quality across all team members',
          'Eliminated review bottlenecks and feature queue backups'
        ],
        participantQuote: 'Intelligent Review transformed reviews from a necessary evil into our best learning and knowledge-sharing tool. The team actually looks forward to reviews now.'
      },
      implementation: {
        week1to4: [
          'Established review quality templates and checklists',
          'Implemented context-aware reviewer assignment system',
          'Created structured feedback templates for common issues',
          'Set up automated review metrics and tracking'
        ],
        week5to8: [
          'Achieved same-day review turnaround for 90% of PRs',
          'Reduced senior developer review time by 60%',
          'Improved code quality scores through systematic feedback',
          'Established knowledge sharing protocols'
        ],
        week9to12: [
          'Zero review bottlenecks for 4 consecutive sprints',
          'Junior developers contributing high-quality code faster',
          'Team velocity increased 40% with better code quality',
          'Created review excellence training for other teams'
        ],
        keyLessons: [
          'Systematic review processes scale better than ad-hoc approaches',
          'Context-aware assignments improve both speed and quality',
          'Structured feedback accelerates team learning',
          'Review metrics help identify and eliminate bottlenecks'
        ]
      },
      category: 'team_implementation',
      featured: true,
      publishedAt: new Date('2024-02-25'),
      estimatedReadTime: 9
    }
  ];

  getTestimonials(filters?: {
    category?: string;
    featured?: boolean;
    experienceLevel?: string;
  }): Testimonial[] {
    let filtered = [...this.testimonials];
    
    if (filters?.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(t => t.featured === filters.featured);
    }
    
    if (filters?.experienceLevel) {
      filtered = filtered.filter(t => t.experienceLevel === filters.experienceLevel);
    }
    
    return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getCaseStudies(filters?: {
    category?: string;
    featured?: boolean;
  }): CaseStudy[] {
    let filtered = [...this.caseStudies];
    
    if (filters?.category) {
      filtered = filtered.filter(cs => cs.category === filters.category);
    }
    
    if (filters?.featured !== undefined) {
      filtered = filtered.filter(cs => cs.featured === filters.featured);
    }
    
    return filtered.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  getFeaturedTestimonials(): Testimonial[] {
    return this.getTestimonials({ featured: true });
  }

  getFeaturedCaseStudies(): CaseStudy[] {
    return this.getCaseStudies({ featured: true });
  }

  getTestimonialById(id: string): Testimonial | undefined {
    return this.testimonials.find(t => t.id === id);
  }

  getCaseStudyById(id: string): CaseStudy | undefined {
    return this.caseStudies.find(cs => cs.id === id);
  }

  getTestimonialsByPrinciple(principle: string): Testimonial[] {
    return this.testimonials.filter(t => 
      t.tags.some(tag => tag.toLowerCase().includes(principle.toLowerCase()))
    );
  }

  getMetricsAverages(): {
    avgProductivityIncrease: number;
    avgTimeReduction: number;
    avgCodeQualityImprovement: number;
    totalDevelopersHelped: number;
  } {
    const testimonialsWithMetrics = this.testimonials.filter(t => t.metrics);
    
    return {
      avgProductivityIncrease: Math.round(
        testimonialsWithMetrics.reduce((sum, t) => 
          sum + (t.metrics?.productivityIncrease || 0), 0
        ) / testimonialsWithMetrics.length
      ),
      avgTimeReduction: Math.round(
        testimonialsWithMetrics.reduce((sum, t) => 
          sum + (t.metrics?.timeReduction || 0), 0
        ) / testimonialsWithMetrics.length
      ),
      avgCodeQualityImprovement: Math.round(
        testimonialsWithMetrics.reduce((sum, t) => 
          sum + (t.metrics?.codeQualityImprovement || 0), 0
        ) / testimonialsWithMetrics.length
      ),
      totalDevelopersHelped: this.testimonials.length
    };
  }
}