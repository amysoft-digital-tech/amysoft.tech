import { Injectable } from '@angular/core';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  tier: 'freemium' | 'foundation' | 'advanced' | 'elite';
  pricing: PricingDetails;
  features: PricingFeature[];
  limitations?: string[];
  targetAudience: string[];
  popular: boolean;
  recommended: boolean;
  ctaText: string;
  valueProposition: string;
  riskReversal?: string[];
  socialProof?: string;
  urgency?: string;
  bonusContent?: string[];
  displayOrder: number;
}

export interface PricingDetails {
  monthly: number;
  annual: number;
  currency: string;
  annualDiscount: number;
  annualSavings: number;
  freeTrialDays?: number;
  moneyBackGuarantee?: number; // days
  paymentOptions: string[];
  subscriptionType: 'one-time' | 'recurring' | 'hybrid';
}

export interface PricingFeature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  included: boolean;
  highlight?: boolean;
  comingSoon?: boolean;
  limit?: number | string;
  upgrade?: {
    fromTier: string;
    toTier: string;
    benefit: string;
  };
}

export type FeatureCategory = 
  | 'content_access' 
  | 'templates' 
  | 'community' 
  | 'support' 
  | 'tools' 
  | 'bonuses';

export interface FeatureMatrix {
  categories: FeatureCategoryDetails[];
  comparisonTable: ComparisonRow[];
}

export interface FeatureCategoryDetails {
  id: FeatureCategory;
  name: string;
  description: string;
  icon: string;
  priority: number;
}

export interface ComparisonRow {
  feature: string;
  description: string;
  category: FeatureCategory;
  freemium: string | boolean | number;
  foundation: string | boolean | number;
  advanced: string | boolean | number;
  elite: string | boolean | number;
  highlight?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PricingDataService {
  
  private readonly pricingTiers: PricingTier[] = [
    {
      id: 'freemium',
      name: 'Freemium',
      description: 'Perfect for getting started with AI-driven development basics',
      shortDescription: 'Essential AI development foundations',
      tier: 'freemium',
      pricing: {
        monthly: 0,
        annual: 0,
        currency: 'USD',
        annualDiscount: 0,
        annualSavings: 0,
        subscriptionType: 'recurring',
        paymentOptions: ['Free Account']
      },
      features: [
        {
          id: 'intro_content',
          name: 'Introduction Chapter',
          description: 'Complete "AI Betrayal" introduction chapter',
          category: 'content_access',
          included: true,
          highlight: true
        },
        {
          id: 'basic_templates',
          name: '20 Basic Templates',
          description: 'Essential prompt templates for common development tasks',
          category: 'templates',
          included: true,
          limit: 20
        },
        {
          id: 'community_access',
          name: 'Community Forum Access',
          description: 'Access to developer community discussions',
          category: 'community',
          included: true
        },
        {
          id: 'email_support',
          name: 'Email Support',
          description: 'Basic email support within 48 hours',
          category: 'support',
          included: true
        }
      ],
      limitations: [
        'Limited to first chapter and basic content',
        'No access to advanced principles and implementation guides',
        'Basic templates only - no specialized scenarios',
        'Community support only'
      ],
      targetAudience: [
        'Developers new to AI-assisted development',
        'Those wanting to sample the content quality',
        'Students and early-career developers'
      ],
      popular: false,
      recommended: false,
      ctaText: 'Start Free',
      valueProposition: 'Try the elite development approach risk-free',
      displayOrder: 1
    },
    {
      id: 'foundation',
      name: 'Foundation',
      description: 'Complete framework with all 5 elite principles and 100+ templates',
      shortDescription: 'Full framework + implementation roadmap',
      tier: 'foundation',
      pricing: {
        monthly: 47,
        annual: 497,
        currency: 'USD',
        annualDiscount: 12,
        annualSavings: 67,
        freeTrialDays: 14,
        moneyBackGuarantee: 30,
        subscriptionType: 'one-time',
        paymentOptions: ['Credit Card', 'PayPal', 'Apple Pay', 'Google Pay']
      },
      features: [
        {
          id: 'complete_ebook',
          name: 'Complete 9-Chapter Ebook',
          description: 'Full "Beyond the AI Plateau" content including all 5 principles',
          category: 'content_access',
          included: true,
          highlight: true
        },
        {
          id: 'all_templates',
          name: '100+ Premium Templates',
          description: 'Complete template library covering all development scenarios',
          category: 'templates',
          included: true,
          limit: '100+'
        },
        {
          id: 'implementation_roadmap',
          name: '12-Week Implementation Roadmap',
          description: 'Step-by-step transformation guide with weekly milestones',
          category: 'content_access',
          included: true,
          highlight: true
        },
        {
          id: 'case_studies',
          name: 'Detailed Case Studies',
          description: 'Real transformation stories with metrics and timelines',
          category: 'content_access',
          included: true
        },
        {
          id: 'priority_support',
          name: 'Priority Email Support',
          description: 'Priority email support within 24 hours',
          category: 'support',
          included: true
        },
        {
          id: 'updates_lifetime',
          name: 'Lifetime Updates',
          description: 'All future content updates and template additions',
          category: 'bonuses',
          included: true
        }
      ],
      targetAudience: [
        'Developers ready to transform their AI approach',
        'Teams wanting proven implementation frameworks',
        'Professionals seeking systematic skill development'
      ],
      popular: true,
      recommended: true,
      ctaText: 'Get Foundation Access',
      valueProposition: 'Complete transformation framework - everything you need to master elite AI development',
      riskReversal: [
        '30-day money-back guarantee',
        '14-day free trial to explore content',
        'Lifetime access - learn at your own pace'
      ],
      socialProof: 'Chosen by 2,847 developers worldwide',
      bonusContent: [
        'Bonus: Template customization workshop',
        'Bonus: Progress tracking spreadsheets',
        'Bonus: Implementation checklist library'
      ],
      displayOrder: 2
    },
    {
      id: 'advanced',
      name: 'Advanced',
      description: 'Foundation tier plus advanced team implementation and leadership content',
      shortDescription: 'Team leadership + advanced strategies',
      tier: 'advanced',
      pricing: {
        monthly: 97,
        annual: 997,
        currency: 'USD',
        annualDiscount: 15,
        annualSavings: 167,
        freeTrialDays: 14,
        moneyBackGuarantee: 30,
        subscriptionType: 'one-time',
        paymentOptions: ['Credit Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer']
      },
      features: [
        {
          id: 'everything_foundation',
          name: 'Everything in Foundation',
          description: 'Complete Foundation tier content and features',
          category: 'content_access',
          included: true
        },
        {
          id: 'team_implementation',
          name: 'Team Implementation Guide',
          description: 'How to roll out elite principles across development teams',
          category: 'content_access',
          included: true,
          highlight: true
        },
        {
          id: 'leadership_templates',
          name: '50+ Leadership Templates',
          description: 'Advanced templates for technical leadership and team coordination',
          category: 'templates',
          included: true,
          limit: '50+'
        },
        {
          id: 'advanced_case_studies',
          name: 'Advanced Team Case Studies',
          description: 'Enterprise transformation stories and team implementation strategies',
          category: 'content_access',
          included: true
        },
        {
          id: 'monthly_calls',
          name: 'Monthly Implementation Calls',
          description: 'Live group coaching calls for implementation questions',
          category: 'support',
          included: true,
          highlight: true
        },
        {
          id: 'slack_access',
          name: 'Private Slack Community',
          description: 'Exclusive access to advanced practitioners community',
          category: 'community',
          included: true
        },
        {
          id: 'consultation_discount',
          name: '50% Off Personal Consultation',
          description: 'Discounted 1-on-1 consultation for complex implementations',
          category: 'support',
          included: true
        }
      ],
      targetAudience: [
        'Technical leads and engineering managers',
        'Teams implementing AI development practices',
        'Organizations wanting systematic transformation'
      ],
      popular: false,
      recommended: false,
      ctaText: 'Get Advanced Access',
      valueProposition: 'Lead your team\'s AI transformation with proven enterprise strategies',
      riskReversal: [
        '30-day money-back guarantee',
        '14-day free trial with full access',
        'Cancel monthly calls anytime'
      ],
      socialProof: 'Trusted by 847 technical leaders',
      bonusContent: [
        'Bonus: Team assessment framework',
        'Bonus: Implementation project templates',
        'Bonus: Change management playbook'
      ],
      displayOrder: 3
    },
    {
      id: 'elite',
      name: 'Elite',
      description: 'Everything plus direct access, custom implementations, and done-with-you support',
      shortDescription: 'Done-with-you implementation + direct access',
      tier: 'elite',
      pricing: {
        monthly: 297,
        annual: 2997,
        currency: 'USD',
        annualDiscount: 17,
        annualSavings: 567,
        freeTrialDays: 14,
        moneyBackGuarantee: 60,
        subscriptionType: 'recurring',
        paymentOptions: ['Credit Card', 'PayPal', 'Bank Transfer', 'Corporate Invoicing']
      },
      features: [
        {
          id: 'everything_advanced',
          name: 'Everything in Advanced',
          description: 'Complete Advanced tier content and all features',
          category: 'content_access',
          included: true
        },
        {
          id: 'direct_access',
          name: 'Direct Access to Creator',
          description: 'Monthly 1-on-1 calls with the framework creator',
          category: 'support',
          included: true,
          highlight: true
        },
        {
          id: 'custom_templates',
          name: 'Custom Template Development',
          description: 'Personalized templates created for your specific use cases',
          category: 'templates',
          included: true,
          limit: '5/month'
        },
        {
          id: 'implementation_support',
          name: 'Done-With-You Implementation',
          description: 'Guided implementation with personal coaching and accountability',
          category: 'support',
          included: true,
          highlight: true
        },
        {
          id: 'early_access',
          name: 'Early Access to New Content',
          description: 'First access to new principles, templates, and case studies',
          category: 'bonuses',
          included: true
        },
        {
          id: 'annual_strategy',
          name: 'Annual Strategy Session',
          description: 'Yearly planning session for your AI development transformation',
          category: 'support',
          included: true
        },
        {
          id: 'enterprise_resources',
          name: 'Enterprise Implementation Kit',
          description: 'Resources for rolling out across large organizations',
          category: 'tools',
          included: true
        }
      ],
      limitations: [
        'Limited to 50 members for personalized attention',
        'Requires application and brief qualification call'
      ],
      targetAudience: [
        'Senior architects and principal engineers',
        'CTOs and VP Engineering roles',
        'Consultants implementing for client organizations'
      ],
      popular: false,
      recommended: false,
      ctaText: 'Apply for Elite',
      valueProposition: 'Become an elite AI development practitioner with personalized guidance',
      riskReversal: [
        '60-day money-back guarantee',
        'Cancel anytime - no long-term commitment',
        'Application ensures good fit before payment'
      ],
      socialProof: 'Exclusive community of 47 elite practitioners',
      urgency: 'Limited to 50 members - 3 spots remaining',
      bonusContent: [
        'Bonus: Annual mastermind retreat invitation',
        'Bonus: Co-creation opportunities for new content',
        'Bonus: Speaking opportunities at industry events'
      ],
      displayOrder: 4
    }
  ];

  private readonly featureMatrix: FeatureMatrix = {
    categories: [
      {
        id: 'content_access',
        name: 'Content Access',
        description: 'Core educational content and implementation resources',
        icon: 'book-open',
        priority: 1
      },
      {
        id: 'templates',
        name: 'Template Library',
        description: 'Ready-to-use prompt templates for every development scenario',
        icon: 'document-duplicate',
        priority: 2
      },
      {
        id: 'community',
        name: 'Community Access',
        description: 'Peer learning and networking opportunities',
        icon: 'users',
        priority: 3
      },
      {
        id: 'support',
        name: 'Support & Guidance',
        description: 'Personal assistance and implementation coaching',
        icon: 'support',
        priority: 4
      },
      {
        id: 'tools',
        name: 'Tools & Resources',
        description: 'Additional tools and frameworks for implementation',
        icon: 'cog',
        priority: 5
      },
      {
        id: 'bonuses',
        name: 'Bonus Content',
        description: 'Additional value and exclusive access',
        icon: 'gift',
        priority: 6
      }
    ],
    comparisonTable: [
      {
        feature: 'Core Ebook Content',
        description: 'Access to the main "Beyond the AI Plateau" content',
        category: 'content_access',
        freemium: 'Chapter 1 Only',
        foundation: 'Complete 9 Chapters',
        advanced: 'Complete 9 Chapters',
        elite: 'Complete 9 Chapters',
        highlight: true
      },
      {
        feature: 'Implementation Roadmap',
        description: '12-week step-by-step transformation guide',
        category: 'content_access',
        freemium: false,
        foundation: true,
        advanced: true,
        elite: true,
        highlight: true
      },
      {
        feature: 'Prompt Templates',
        description: 'Ready-to-use templates for development scenarios',
        category: 'templates',
        freemium: '20 Basic',
        foundation: '100+ Complete',
        advanced: '150+ (includes leadership)',
        elite: '200+ (includes custom)',
        highlight: true
      },
      {
        feature: 'Case Studies',
        description: 'Real-world transformation examples with metrics',
        category: 'content_access',
        freemium: false,
        foundation: '3 Detailed Studies',
        advanced: '8 Studies (includes team)',
        elite: '15+ Studies (includes enterprise)'
      },
      {
        feature: 'Community Forum',
        description: 'General community discussion and peer support',
        category: 'community',
        freemium: true,
        foundation: true,
        advanced: 'Plus Private Slack',
        elite: 'Plus Private Slack + Elite Circle'
      },
      {
        feature: 'Email Support',
        description: 'Direct email assistance for questions',
        category: 'support',
        freemium: '48hr Response',
        foundation: '24hr Priority',
        advanced: '24hr Priority',
        elite: '12hr Priority'
      },
      {
        feature: 'Live Group Calls',
        description: 'Monthly implementation and Q&A sessions',
        category: 'support',
        freemium: false,
        foundation: false,
        advanced: 'Monthly Calls',
        elite: 'Monthly Calls + 1-on-1'
      },
      {
        feature: 'Personal Consultation',
        description: 'One-on-one implementation guidance',
        category: 'support',
        freemium: false,
        foundation: false,
        advanced: '50% Discount',
        elite: 'Monthly Included',
        highlight: true
      },
      {
        feature: 'Custom Templates',
        description: 'Personalized templates for your specific needs',
        category: 'templates',
        freemium: false,
        foundation: false,
        advanced: false,
        elite: '5 per month'
      },
      {
        feature: 'Team Implementation Guide',
        description: 'Framework for rolling out across development teams',
        category: 'content_access',
        freemium: false,
        foundation: false,
        advanced: true,
        elite: true
      },
      {
        feature: 'Progress Tracking Tools',
        description: 'Spreadsheets and frameworks for measuring improvement',
        category: 'tools',
        freemium: false,
        foundation: true,
        advanced: true,
        elite: 'Plus custom dashboards'
      },
      {
        feature: 'Lifetime Updates',
        description: 'All future content additions and improvements',
        category: 'bonuses',
        freemium: false,
        foundation: true,
        advanced: true,
        elite: 'Plus early access'
      },
      {
        feature: 'Money-Back Guarantee',
        description: 'Risk-free trial period',
        category: 'bonuses',
        freemium: 'N/A',
        foundation: '30 days',
        advanced: '30 days',
        elite: '60 days'
      }
    ]
  };

  getPricingTiers(): PricingTier[] {
    return this.pricingTiers.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getPricingTierById(id: string): PricingTier | undefined {
    return this.pricingTiers.find(tier => tier.id === id);
  }

  getFeatureMatrix(): FeatureMatrix {
    return this.featureMatrix;
  }

  getPopularTier(): PricingTier | undefined {
    return this.pricingTiers.find(tier => tier.popular);
  }

  getRecommendedTier(): PricingTier | undefined {
    return this.pricingTiers.find(tier => tier.recommended);
  }

  calculateAnnualSavings(tier: PricingTier): number {
    return (tier.pricing.monthly * 12) - tier.pricing.annual;
  }

  getComparisonFeatures(category?: FeatureCategory): ComparisonRow[] {
    if (category) {
      return this.featureMatrix.comparisonTable.filter(row => row.category === category);
    }
    return this.featureMatrix.comparisonTable;
  }

  getHighlightFeatures(): ComparisonRow[] {
    return this.featureMatrix.comparisonTable.filter(row => row.highlight);
  }

  getPricingCopy(): {
    headline: string;
    subheadline: string;
    socialProof: string;
    urgency?: string;
    guarantee: string;
  } {
    return {
      headline: 'Choose Your Path to Elite AI Development',
      subheadline: 'Join 3,000+ developers who\'ve transformed their careers with proven frameworks',
      socialProof: '⭐⭐⭐⭐⭐ 4.9/5 average rating from 847 reviews',
      urgency: 'Elite tier limited to 50 members - 3 spots remaining',
      guarantee: '30-60 day money-back guarantee • Instant access • Lifetime updates'
    };
  }

  getValuePropositions(): string[] {
    return [
      'Stop wasting time on trial-and-error AI experimentation',
      'Get proven frameworks used by elite developers at top companies',
      'Transform from AI novice to expert in 12 weeks or less',
      'Join the 3% who truly master AI-driven development',
      'Increase productivity by 85% with systematic approaches'
    ];
  }

  getRiskReversals(): string[] {
    return [
      '30-60 day money-back guarantee',
      'Try everything risk-free for 14 days',
      'Lifetime access - learn at your own pace',
      'No recurring fees for Foundation & Advanced',
      'Cancel Elite membership anytime'
    ];
  }

  getFrequentlyAskedQuestions(): Array<{question: string; answer: string; category: string}> {
    return [
      {
        question: 'How is this different from free AI tutorials online?',
        answer: 'While free tutorials teach basic AI usage, this framework teaches elite-level systematic approaches used by top 3% of developers. You get proven templates, implementation roadmaps, and real case studies with metrics.',
        category: 'value'
      },
      {
        question: 'What if I\'m already experienced with AI development?',
        answer: 'This framework is specifically designed to break through the "AI plateau" that experienced developers hit. It provides systematic approaches to complex scenarios that basic tutorials never cover.',
        category: 'experience'
      },
      {
        question: 'How long does implementation take?',
        answer: 'The 12-week roadmap provides structured progression, but you can implement individual principles immediately. Most developers see significant improvements within the first 2-3 weeks.',
        category: 'timeline'
      },
      {
        question: 'Is this suitable for teams or just individuals?',
        answer: 'Foundation tier works great for individuals. Advanced and Elite tiers include team implementation guides, leadership templates, and frameworks for rolling out across organizations.',
        category: 'teams'
      },
      {
        question: 'What programming languages does this cover?',
        answer: 'The principles and templates are language-agnostic and work with any programming language. Examples include Python, JavaScript, Java, C#, Go, and more.',
        category: 'technical'
      },
      {
        question: 'Do I need specific AI tools or subscriptions?',
        answer: 'The framework works with any AI coding assistant (GitHub Copilot, ChatGPT, Claude, etc.). You don\'t need specific tools - the principles enhance whatever you\'re already using.',
        category: 'technical'
      }
    ];
  }
}