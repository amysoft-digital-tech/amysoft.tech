import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: ArticleCategory;
  subcategory?: string;
  tags: string[];
  status: ArticleStatus;
  visibility: ArticleVisibility;
  language: string;
  metadata: ArticleMetadata;
  seoData: SEOData;
  relatedArticles: string[];
  attachments: ArticleAttachment[];
  versionHistory: ArticleVersion[];
  feedback: ArticleFeedback;
  analytics: ArticleAnalytics;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string;
  lastModifiedBy: string;
}

export enum ArticleCategory {
  GETTING_STARTED = 'getting_started',
  TECHNICAL_GUIDES = 'technical_guides',
  TROUBLESHOOTING = 'troubleshooting',
  API_DOCUMENTATION = 'api_documentation',
  BILLING_PAYMENT = 'billing_payment',
  ACCOUNT_MANAGEMENT = 'account_management',
  FEATURE_GUIDES = 'feature_guides',
  BEST_PRACTICES = 'best_practices',
  FAQ = 'faq',
  VIDEO_TUTORIALS = 'video_tutorials',
  RELEASE_NOTES = 'release_notes',
  TEMPLATES = 'templates'
}

export enum ArticleStatus {
  DRAFT = 'draft',
  IN_REVIEW = 'in_review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  NEEDS_UPDATE = 'needs_update'
}

export enum ArticleVisibility {
  PUBLIC = 'public',
  AUTHENTICATED = 'authenticated',
  PREMIUM = 'premium',
  INTERNAL = 'internal'
}

export interface ArticleMetadata {
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // minutes
  lastReviewed: Date;
  reviewedBy: string;
  targetAudience: string[];
  prerequisites: string[];
  relatedFeatures: string[];
  supportedVersions: string[];
}

export interface SEOData {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export interface ArticleAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url: string;
  description: string;
  isImage: boolean;
  isVideo: boolean;
  thumbnailUrl?: string;
}

export interface ArticleVersion {
  id: string;
  version: string;
  changeDescription: string;
  modifiedBy: string;
  modifiedAt: Date;
  contentSnapshot: string;
}

export interface ArticleFeedback {
  helpfulVotes: number;
  notHelpfulVotes: number;
  averageRating: number;
  totalRatings: number;
  comments: FeedbackComment[];
  suggestions: string[];
}

export interface FeedbackComment {
  id: string;
  userId: string;
  comment: string;
  rating: number;
  isPublic: boolean;
  createdAt: Date;
  moderationStatus: 'pending' | 'approved' | 'rejected';
}

export interface ArticleAnalytics {
  totalViews: number;
  uniqueViews: number;
  averageTimeOnPage: number;
  bounceRate: number;
  searchImpressions: number;
  searchClicks: number;
  clickThroughRate: number;
  conversionRate: number;
  exitRate: number;
  viewsBySource: Record<string, number>;
  viewTrends: ViewTrend[];
}

export interface ViewTrend {
  date: Date;
  views: number;
  uniqueViews: number;
  averageTimeOnPage: number;
}

export interface SearchQuery {
  query: string;
  filters?: SearchFilters;
  sorting?: SearchSorting;
  pagination?: SearchPagination;
}

export interface SearchFilters {
  categories?: ArticleCategory[];
  tags?: string[];
  difficulty?: string[];
  language?: string;
  visibility?: ArticleVisibility;
  lastUpdated?: Date;
  minimumRating?: number;
}

export interface SearchSorting {
  field: 'relevance' | 'date' | 'rating' | 'views' | 'title';
  direction: 'asc' | 'desc';
}

export interface SearchPagination {
  page: number;
  limit: number;
}

export interface SearchResult {
  articles: SearchResultArticle[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
  facets: SearchFacets;
  relatedQueries: string[];
}

export interface SearchResultArticle {
  id: string;
  title: string;
  summary: string;
  category: ArticleCategory;
  tags: string[];
  relevanceScore: number;
  highlights: SearchHighlight[];
  url: string;
  lastUpdated: Date;
  rating: number;
  views: number;
}

export interface SearchHighlight {
  field: string;
  highlights: string[];
}

export interface SearchFacets {
  categories: FacetCount[];
  tags: FacetCount[];
  difficulty: FacetCount[];
  language: FacetCount[];
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface KnowledgeBaseAnalytics {
  overview: AnalyticsOverview;
  articlePerformance: ArticlePerformance[];
  searchAnalytics: SearchAnalytics;
  userEngagement: UserEngagement;
  contentGaps: ContentGap[];
  recommendations: ContentRecommendation[];
}

export interface AnalyticsOverview {
  totalArticles: number;
  publishedArticles: number;
  totalViews: number;
  uniqueUsers: number;
  averageRating: number;
  searchSuccessRate: number;
  selfServiceResolutionRate: number;
  topCategories: CategoryPerformance[];
}

export interface ArticlePerformance {
  articleId: string;
  title: string;
  category: ArticleCategory;
  views: number;
  uniqueViews: number;
  rating: number;
  helpfulPercentage: number;
  averageTimeOnPage: number;
  bounceRate: number;
  conversions: number;
}

export interface SearchAnalytics {
  totalSearches: number;
  successfulSearches: number;
  zeroResultSearches: number;
  topQueries: QueryPerformance[];
  queryTrends: QueryTrend[];
  searchToTicketConversion: number;
}

export interface QueryPerformance {
  query: string;
  searchCount: number;
  clickThroughRate: number;
  averagePosition: number;
  zeroResults: boolean;
}

export interface QueryTrend {
  date: Date;
  totalSearches: number;
  uniqueSearches: number;
  averageResultsPerQuery: number;
}

export interface UserEngagement {
  sessionDuration: number;
  pagesPerSession: number;
  returnUserRate: number;
  feedbackParticipationRate: number;
  downloadRate: number;
  socialShareRate: number;
}

export interface CategoryPerformance {
  category: ArticleCategory;
  articleCount: number;
  totalViews: number;
  averageRating: number;
  completionRate: number;
}

export interface ContentGap {
  topic: string;
  searchVolume: number;
  availableContent: number;
  priority: 'high' | 'medium' | 'low';
  suggestedContent: string[];
}

export interface ContentRecommendation {
  type: 'update' | 'create' | 'merge' | 'archive';
  target: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private articles: KnowledgeBaseArticle[] = [];
  private searchIndex: Map<string, string[]> = new Map();

  constructor(private configService: ConfigService) {
    this.initializeKnowledgeBase();
    this.buildSearchIndex();
  }

  private initializeKnowledgeBase(): void {
    this.articles = [
      {
        id: 'kb_getting_started_001',
        title: 'Getting Started with Beyond the AI Plateau',
        content: `# Getting Started with Beyond the AI Plateau

Welcome to Beyond the AI Plateau! This comprehensive guide will help you get the most out of your AI development journey.

## What You'll Find Here

The Beyond the AI Plateau platform provides:

1. **Five Elite Principles** - Core methodologies that transform LLM code generation
2. **100+ Production-Ready Templates** - Proven prompt templates for real-world scenarios
3. **12-Week Transformation Roadmap** - Structured learning path to AI mastery

## Quick Start Steps

### Step 1: Access Your Account
After purchasing, you'll receive login credentials via email. Use these to access your personalized learning platform.

### Step 2: Complete the Assessment
Take our AI readiness assessment to understand your current skill level and get personalized recommendations.

### Step 3: Start with Principle 1
Begin with the first Elite Principle: "Context Architecture" - the foundation of effective AI communication.

### Step 4: Practice with Templates
Use our curated template library to practice the principles in real scenarios.

## Need Help?

- Visit our [FAQ section](/kb/faq)
- Contact support at support@amysoft.tech
- Join our community discussions

Start your transformation today!`,
        summary: 'Complete guide to getting started with Beyond the AI Plateau platform, including setup steps and learning path.',
        category: ArticleCategory.GETTING_STARTED,
        subcategory: 'platform_basics',
        tags: ['getting-started', 'setup', 'beginner', 'overview'],
        status: ArticleStatus.PUBLISHED,
        visibility: ArticleVisibility.PUBLIC,
        language: 'en',
        metadata: {
          difficulty: 'beginner',
          estimatedReadTime: 5,
          lastReviewed: new Date('2024-06-01'),
          reviewedBy: 'content_team',
          targetAudience: ['new_users', 'beginners'],
          prerequisites: [],
          relatedFeatures: ['assessment', 'templates', 'principles'],
          supportedVersions: ['1.0+']
        },
        seoData: {
          metaTitle: 'Getting Started Guide - Beyond the AI Plateau',
          metaDescription: 'Learn how to get started with Beyond the AI Plateau and transform your AI development skills with our comprehensive guide.',
          keywords: ['AI development', 'getting started', 'tutorial', 'guide'],
          ogTitle: 'Start Your AI Transformation Journey',
          ogDescription: 'Complete guide to mastering AI development with Beyond the AI Plateau'
        },
        relatedArticles: ['kb_principles_001', 'kb_templates_001', 'kb_assessment_001'],
        attachments: [],
        versionHistory: [],
        feedback: {
          helpfulVotes: 89,
          notHelpfulVotes: 12,
          averageRating: 4.7,
          totalRatings: 156,
          comments: [],
          suggestions: []
        },
        analytics: {
          totalViews: 2847,
          uniqueViews: 2156,
          averageTimeOnPage: 280,
          bounceRate: 24.5,
          searchImpressions: 1250,
          searchClicks: 892,
          clickThroughRate: 71.4,
          conversionRate: 12.8,
          exitRate: 15.2,
          viewsBySource: {
            'search': 1820,
            'direct': 654,
            'referral': 373
          },
          viewTrends: []
        },
        createdAt: new Date('2024-05-15'),
        updatedAt: new Date('2024-06-01'),
        publishedAt: new Date('2024-05-16'),
        createdBy: 'content_team',
        lastModifiedBy: 'content_manager'
      },
      {
        id: 'kb_troubleshooting_001',
        title: 'Troubleshooting Common Template Issues',
        content: `# Troubleshooting Common Template Issues

Having trouble with prompt templates? This guide covers the most common issues and their solutions.

## Template Not Working as Expected

### Issue: Template produces inconsistent results
**Solution:** 
1. Check your context variables are properly defined
2. Ensure your prompt structure follows the Elite Principles
3. Verify the template is compatible with your LLM model

### Issue: Template seems too generic
**Solution:**
1. Add more specific context variables
2. Include domain-specific examples
3. Use the Context Architecture principle to improve specificity

## Variables Not Populating

### Issue: Variables showing as {{variable_name}}
**Solution:**
1. Check variable spelling and case sensitivity
2. Ensure all required variables are provided
3. Verify the variable exists in the template definition

## Performance Issues

### Issue: Templates taking too long to process
**Solution:**
1. Simplify complex prompts
2. Break large prompts into smaller chunks
3. Use the Efficiency Optimization principle

## Getting Better Results

1. **Follow the Five Elite Principles**
2. **Test with different input variations**
3. **Iterate and refine based on results**
4. **Use our template analyzer tool**

Still having issues? Contact our support team for personalized assistance.`,
        summary: 'Comprehensive troubleshooting guide for common prompt template issues with step-by-step solutions.',
        category: ArticleCategory.TROUBLESHOOTING,
        subcategory: 'templates',
        tags: ['troubleshooting', 'templates', 'common-issues', 'solutions'],
        status: ArticleStatus.PUBLISHED,
        visibility: ArticleVisibility.AUTHENTICATED,
        language: 'en',
        metadata: {
          difficulty: 'intermediate',
          estimatedReadTime: 8,
          lastReviewed: new Date('2024-06-10'),
          reviewedBy: 'technical_team',
          targetAudience: ['active_users', 'developers'],
          prerequisites: ['basic_template_usage'],
          relatedFeatures: ['templates', 'analyzer', 'principles'],
          supportedVersions: ['1.0+']
        },
        seoData: {
          metaTitle: 'Template Troubleshooting Guide - Beyond the AI Plateau',
          metaDescription: 'Solve common prompt template issues with our comprehensive troubleshooting guide and expert solutions.',
          keywords: ['template troubleshooting', 'prompt issues', 'AI problems', 'solutions'],
          ogTitle: 'Fix Template Issues Fast',
          ogDescription: 'Expert solutions for common AI template problems'
        },
        relatedArticles: ['kb_templates_001', 'kb_principles_001', 'kb_analyzer_001'],
        attachments: [],
        versionHistory: [],
        feedback: {
          helpfulVotes: 156,
          notHelpfulVotes: 23,
          averageRating: 4.5,
          totalRatings: 201,
          comments: [],
          suggestions: ['Add video examples', 'Include code snippets']
        },
        analytics: {
          totalViews: 3892,
          uniqueViews: 2947,
          averageTimeOnPage: 420,
          bounceRate: 18.2,
          searchImpressions: 2150,
          searchClicks: 1580,
          clickThroughRate: 73.5,
          conversionRate: 8.9,
          exitRate: 12.6,
          viewsBySource: {
            'search': 2340,
            'support_tickets': 892,
            'referral': 660
          },
          viewTrends: []
        },
        createdAt: new Date('2024-05-20'),
        updatedAt: new Date('2024-06-10'),
        publishedAt: new Date('2024-05-22'),
        createdBy: 'technical_writer',
        lastModifiedBy: 'technical_team'
      },
      {
        id: 'kb_billing_001',
        title: 'Understanding Your Subscription',
        content: `# Understanding Your Subscription

Learn about your Beyond the AI Plateau subscription, billing, and how to manage your account.

## Subscription Tiers

### Foundation Tier ($24.95)
- Access to all Five Elite Principles
- 100+ production-ready prompt templates
- 12-week transformation roadmap
- Community access
- Email support

### Advanced Tier ($99.95)
- Everything in Foundation
- Advanced optimization strategies
- Priority email support
- Monthly group coaching calls
- Custom template creation tools

### Enterprise Tier (Custom Pricing)
- Everything in Advanced
- Team training programs
- Custom implementation support
- Dedicated account management
- SLA guarantees

## Billing Information

### Billing Cycle
- Monthly subscriptions bill on the same date each month
- Annual subscriptions provide 2 months free
- Billing date is based on your initial purchase

### Payment Methods
- Credit/debit cards (Visa, MasterCard, American Express)
- PayPal
- Company purchase orders (Enterprise tier)

### Tax Information
- Sales tax applied based on billing address
- VAT for EU customers
- Tax invoices available in account settings

## Managing Your Subscription

### Upgrading Your Plan
1. Go to Account Settings
2. Select "Change Plan"
3. Choose your new tier
4. Confirm billing information

### Canceling Your Subscription
1. Visit Account Settings
2. Select "Cancel Subscription"
3. Choose cancellation reason
4. Confirm cancellation

**Note:** You'll retain access until the end of your billing period.

### Refund Policy
- 30-day money-back guarantee
- Pro-rated refunds for unused annual subscriptions
- Refund processing takes 3-5 business days

## Need Help?

For billing questions, contact billing@amysoft.tech or use our live chat.`,
        summary: 'Complete guide to subscription tiers, billing information, and account management for Beyond the AI Plateau.',
        category: ArticleCategory.BILLING_PAYMENT,
        subcategory: 'subscription_management',
        tags: ['billing', 'subscription', 'payment', 'account-management'],
        status: ArticleStatus.PUBLISHED,
        visibility: ArticleVisibility.AUTHENTICATED,
        language: 'en',
        metadata: {
          difficulty: 'beginner',
          estimatedReadTime: 6,
          lastReviewed: new Date('2024-06-15'),
          reviewedBy: 'billing_team',
          targetAudience: ['all_users', 'billing_inquiries'],
          prerequisites: [],
          relatedFeatures: ['account_settings', 'billing', 'subscriptions'],
          supportedVersions: ['1.0+']
        },
        seoData: {
          metaTitle: 'Subscription & Billing Guide - Beyond the AI Plateau',
          metaDescription: 'Understand your subscription options, billing information, and how to manage your Beyond the AI Plateau account.',
          keywords: ['subscription', 'billing', 'payment', 'account management', 'pricing'],
          ogTitle: 'Manage Your Subscription',
          ogDescription: 'Complete guide to subscription and billing management'
        },
        relatedArticles: ['kb_getting_started_001', 'kb_account_001', 'kb_support_001'],
        attachments: [],
        versionHistory: [],
        feedback: {
          helpfulVotes: 134,
          notHelpfulVotes: 18,
          averageRating: 4.4,
          totalRatings: 178,
          comments: [],
          suggestions: ['Add video walkthrough', 'Include billing calendar']
        },
        analytics: {
          totalViews: 1945,
          uniqueViews: 1634,
          averageTimeOnPage: 310,
          bounceRate: 28.7,
          searchImpressions: 890,
          searchClicks: 567,
          clickThroughRate: 63.7,
          conversionRate: 15.2,
          exitRate: 22.3,
          viewsBySource: {
            'search': 892,
            'billing_emails': 456,
            'account_settings': 597
          },
          viewTrends: []
        },
        createdAt: new Date('2024-05-18'),
        updatedAt: new Date('2024-06-15'),
        publishedAt: new Date('2024-05-19'),
        createdBy: 'billing_team',
        lastModifiedBy: 'content_manager'
      }
    ];

    this.logger.log(`Initialized knowledge base with ${this.articles.length} articles`);
  }

  private buildSearchIndex(): void {
    this.searchIndex.clear();
    
    this.articles.forEach(article => {
      if (article.status === ArticleStatus.PUBLISHED) {
        const searchableText = [
          article.title,
          article.summary,
          article.content,
          ...article.tags,
          article.category,
          article.subcategory || ''
        ].join(' ').toLowerCase();

        // Simple tokenization
        const tokens = searchableText.split(/\s+/).filter(token => token.length > 2);
        
        tokens.forEach(token => {
          if (!this.searchIndex.has(token)) {
            this.searchIndex.set(token, []);
          }
          if (!this.searchIndex.get(token)!.includes(article.id)) {
            this.searchIndex.get(token)!.push(article.id);
          }
        });
      }
    });

    this.logger.log(`Built search index with ${this.searchIndex.size} tokens`);
  }

  async createArticle(articleData: Omit<KnowledgeBaseArticle, 'id' | 'analytics' | 'feedback' | 'versionHistory' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const article: KnowledgeBaseArticle = {
      id: `kb_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      ...articleData,
      analytics: {
        totalViews: 0,
        uniqueViews: 0,
        averageTimeOnPage: 0,
        bounceRate: 0,
        searchImpressions: 0,
        searchClicks: 0,
        clickThroughRate: 0,
        conversionRate: 0,
        exitRate: 0,
        viewsBySource: {},
        viewTrends: []
      },
      feedback: {
        helpfulVotes: 0,
        notHelpfulVotes: 0,
        averageRating: 0,
        totalRatings: 0,
        comments: [],
        suggestions: []
      },
      versionHistory: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.articles.push(article);
    
    if (article.status === ArticleStatus.PUBLISHED) {
      this.buildSearchIndex(); // Rebuild index when publishing
    }

    this.logger.log(`Knowledge base article created: ${article.title}`);
    return article.id;
  }

  async updateArticle(articleId: string, updates: Partial<KnowledgeBaseArticle>): Promise<boolean> {
    const articleIndex = this.articles.findIndex(a => a.id === articleId);
    
    if (articleIndex === -1) {
      return false;
    }

    const article = this.articles[articleIndex];
    const oldContent = article.content;

    // Create version history entry if content changed
    if (updates.content && updates.content !== oldContent) {
      const version: ArticleVersion = {
        id: `v_${Date.now()}`,
        version: `${article.versionHistory.length + 1}.0`,
        changeDescription: updates.versionHistory?.[0]?.changeDescription || 'Content update',
        modifiedBy: updates.lastModifiedBy || 'system',
        modifiedAt: new Date(),
        contentSnapshot: oldContent
      };

      article.versionHistory.push(version);
    }

    // Update article
    Object.assign(article, updates);
    article.updatedAt = new Date();

    // Rebuild search index if published
    if (article.status === ArticleStatus.PUBLISHED) {
      this.buildSearchIndex();
    }

    this.logger.log(`Knowledge base article updated: ${articleId}`);
    return true;
  }

  async publishArticle(articleId: string): Promise<boolean> {
    const article = this.articles.find(a => a.id === articleId);
    
    if (!article) {
      return false;
    }

    article.status = ArticleStatus.PUBLISHED;
    article.publishedAt = new Date();
    article.updatedAt = new Date();

    this.buildSearchIndex(); // Rebuild index when publishing

    this.logger.log(`Knowledge base article published: ${articleId}`);
    return true;
  }

  async search(searchQuery: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const query = searchQuery.query.toLowerCase();
    const tokens = query.split(/\s+/).filter(token => token.length > 2);

    // Find articles matching search tokens
    const articleScores = new Map<string, number>();
    
    tokens.forEach(token => {
      const matchingArticles = this.searchIndex.get(token) || [];
      matchingArticles.forEach(articleId => {
        const currentScore = articleScores.get(articleId) || 0;
        articleScores.set(articleId, currentScore + 1);
      });
    });

    // Get articles and apply filters
    let matchingArticles = Array.from(articleScores.entries())
      .map(([articleId, score]) => {
        const article = this.articles.find(a => a.id === articleId);
        return { article: article!, score };
      })
      .filter(item => item.article && item.article.status === ArticleStatus.PUBLISHED);

    // Apply filters
    if (searchQuery.filters) {
      const filters = searchQuery.filters;
      
      if (filters.categories && filters.categories.length > 0) {
        matchingArticles = matchingArticles.filter(item => 
          filters.categories!.includes(item.article.category)
        );
      }

      if (filters.tags && filters.tags.length > 0) {
        matchingArticles = matchingArticles.filter(item =>
          filters.tags!.some(tag => item.article.tags.includes(tag))
        );
      }

      if (filters.difficulty && filters.difficulty.length > 0) {
        matchingArticles = matchingArticles.filter(item =>
          filters.difficulty!.includes(item.article.metadata.difficulty)
        );
      }

      if (filters.visibility) {
        matchingArticles = matchingArticles.filter(item =>
          item.article.visibility === filters.visibility
        );
      }

      if (filters.minimumRating) {
        matchingArticles = matchingArticles.filter(item =>
          item.article.feedback.averageRating >= filters.minimumRating!
        );
      }
    }

    // Apply sorting
    const sorting = searchQuery.sorting || { field: 'relevance', direction: 'desc' };
    matchingArticles.sort((a, b) => {
      let compareValue = 0;
      
      switch (sorting.field) {
        case 'relevance':
          compareValue = b.score - a.score;
          break;
        case 'date':
          compareValue = b.article.updatedAt.getTime() - a.article.updatedAt.getTime();
          break;
        case 'rating':
          compareValue = b.article.feedback.averageRating - a.article.feedback.averageRating;
          break;
        case 'views':
          compareValue = b.article.analytics.totalViews - a.article.analytics.totalViews;
          break;
        case 'title':
          compareValue = a.article.title.localeCompare(b.article.title);
          break;
      }

      return sorting.direction === 'desc' ? compareValue : -compareValue;
    });

    // Apply pagination
    const pagination = searchQuery.pagination || { page: 1, limit: 10 };
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    const paginatedResults = matchingArticles.slice(startIndex, endIndex);

    // Generate search result articles
    const resultArticles: SearchResultArticle[] = paginatedResults.map(item => ({
      id: item.article.id,
      title: item.article.title,
      summary: item.article.summary,
      category: item.article.category,
      tags: item.article.tags,
      relevanceScore: item.score,
      highlights: this.generateHighlights(item.article, tokens),
      url: `/kb/${item.article.id}`,
      lastUpdated: item.article.updatedAt,
      rating: item.article.feedback.averageRating,
      views: item.article.analytics.totalViews
    }));

    // Generate facets
    const facets = this.generateSearchFacets(matchingArticles.map(item => item.article));

    const searchTime = Date.now() - startTime;

    return {
      articles: resultArticles,
      totalResults: matchingArticles.length,
      searchTime,
      suggestions: this.generateSearchSuggestions(query),
      facets,
      relatedQueries: this.generateRelatedQueries(query)
    };
  }

  private generateHighlights(article: KnowledgeBaseArticle, tokens: string[]): SearchHighlight[] {
    const highlights: SearchHighlight[] = [];

    // Highlight in title
    const titleHighlights = this.findHighlights(article.title, tokens);
    if (titleHighlights.length > 0) {
      highlights.push({ field: 'title', highlights: titleHighlights });
    }

    // Highlight in content
    const contentHighlights = this.findHighlights(article.content.substring(0, 500), tokens);
    if (contentHighlights.length > 0) {
      highlights.push({ field: 'content', highlights: contentHighlights });
    }

    return highlights;
  }

  private findHighlights(text: string, tokens: string[]): string[] {
    const highlights: string[] = [];
    const sentences = text.split(/[.!?]+/);

    sentences.forEach(sentence => {
      const lowerSentence = sentence.toLowerCase();
      const hasToken = tokens.some(token => lowerSentence.includes(token));
      
      if (hasToken && sentence.trim().length > 0) {
        let highlightedSentence = sentence.trim();
        tokens.forEach(token => {
          const regex = new RegExp(`(${token})`, 'gi');
          highlightedSentence = highlightedSentence.replace(regex, '<mark>$1</mark>');
        });
        highlights.push(highlightedSentence);
      }
    });

    return highlights.slice(0, 3); // Return top 3 highlights
  }

  private generateSearchFacets(articles: KnowledgeBaseArticle[]): SearchFacets {
    const categories = new Map<string, number>();
    const tags = new Map<string, number>();
    const difficulty = new Map<string, number>();
    const language = new Map<string, number>();

    articles.forEach(article => {
      // Categories
      const categoryCount = categories.get(article.category) || 0;
      categories.set(article.category, categoryCount + 1);

      // Tags
      article.tags.forEach(tag => {
        const tagCount = tags.get(tag) || 0;
        tags.set(tag, tagCount + 1);
      });

      // Difficulty
      const difficultyCount = difficulty.get(article.metadata.difficulty) || 0;
      difficulty.set(article.metadata.difficulty, difficultyCount + 1);

      // Language
      const languageCount = language.get(article.language) || 0;
      language.set(article.language, languageCount + 1);
    });

    return {
      categories: Array.from(categories.entries()).map(([value, count]) => ({ value, count })),
      tags: Array.from(tags.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      difficulty: Array.from(difficulty.entries()).map(([value, count]) => ({ value, count })),
      language: Array.from(language.entries()).map(([value, count]) => ({ value, count }))
    };
  }

  private generateSearchSuggestions(query: string): string[] {
    // Simple suggestion generation based on common terms
    const suggestions: string[] = [];
    const commonTerms = ['troubleshooting', 'getting started', 'billing', 'templates', 'principles', 'setup', 'account'];
    
    commonTerms.forEach(term => {
      if (term.includes(query.toLowerCase()) && term !== query.toLowerCase()) {
        suggestions.push(term);
      }
    });

    return suggestions.slice(0, 5);
  }

  private generateRelatedQueries(query: string): string[] {
    // Generate related queries based on the search
    const related = [
      `${query} tutorial`,
      `how to ${query}`,
      `${query} best practices`,
      `${query} examples`,
      `${query} guide`
    ];

    return related.slice(0, 3);
  }

  async getArticleById(articleId: string): Promise<KnowledgeBaseArticle | null> {
    return this.articles.find(a => a.id === articleId) || null;
  }

  async getArticlesByCategory(category: ArticleCategory, visibility?: ArticleVisibility): Promise<KnowledgeBaseArticle[]> {
    return this.articles.filter(a => 
      a.category === category && 
      a.status === ArticleStatus.PUBLISHED &&
      (!visibility || a.visibility === visibility)
    );
  }

  async getPopularArticles(limit: number = 10): Promise<KnowledgeBaseArticle[]> {
    return this.articles
      .filter(a => a.status === ArticleStatus.PUBLISHED)
      .sort((a, b) => b.analytics.totalViews - a.analytics.totalViews)
      .slice(0, limit);
  }

  async getRecentArticles(limit: number = 10): Promise<KnowledgeBaseArticle[]> {
    return this.articles
      .filter(a => a.status === ArticleStatus.PUBLISHED)
      .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime())
      .slice(0, limit);
  }

  async recordArticleView(articleId: string, viewerInfo: { userId?: string; source: string; sessionId: string }): Promise<void> {
    const article = this.articles.find(a => a.id === articleId);
    
    if (!article) {
      return;
    }

    article.analytics.totalViews++;
    
    // Simple unique view tracking (in production would use more sophisticated tracking)
    if (viewerInfo.userId || viewerInfo.sessionId) {
      article.analytics.uniqueViews++;
    }

    // Update view source
    const source = viewerInfo.source;
    article.analytics.viewsBySource[source] = (article.analytics.viewsBySource[source] || 0) + 1;

    // Add to trend data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayTrend = article.analytics.viewTrends.find(trend => 
      trend.date.getTime() === today.getTime()
    );

    if (!todayTrend) {
      todayTrend = {
        date: today,
        views: 0,
        uniqueViews: 0,
        averageTimeOnPage: 0
      };
      article.analytics.viewTrends.push(todayTrend);
    }

    todayTrend.views++;
    if (viewerInfo.userId || viewerInfo.sessionId) {
      todayTrend.uniqueViews++;
    }

    article.updatedAt = new Date();
  }

  async recordFeedback(
    articleId: string, 
    feedback: { 
      helpful?: boolean; 
      rating?: number; 
      comment?: string; 
      userId?: string; 
    }
  ): Promise<boolean> {
    const article = this.articles.find(a => a.id === articleId);
    
    if (!article) {
      return false;
    }

    if (feedback.helpful !== undefined) {
      if (feedback.helpful) {
        article.feedback.helpfulVotes++;
      } else {
        article.feedback.notHelpfulVotes++;
      }
    }

    if (feedback.rating !== undefined) {
      article.feedback.totalRatings++;
      const totalScore = article.feedback.averageRating * (article.feedback.totalRatings - 1) + feedback.rating;
      article.feedback.averageRating = totalScore / article.feedback.totalRatings;
    }

    if (feedback.comment) {
      const comment: FeedbackComment = {
        id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: feedback.userId || 'anonymous',
        comment: feedback.comment,
        rating: feedback.rating || 0,
        isPublic: true,
        createdAt: new Date(),
        moderationStatus: 'approved' // In production, would require moderation
      };

      article.feedback.comments.push(comment);
    }

    article.updatedAt = new Date();
    this.logger.log(`Feedback recorded for article ${articleId}`);
    
    return true;
  }

  async getKnowledgeBaseAnalytics(): Promise<KnowledgeBaseAnalytics> {
    const totalArticles = this.articles.length;
    const publishedArticles = this.articles.filter(a => a.status === ArticleStatus.PUBLISHED).length;
    const totalViews = this.articles.reduce((sum, a) => sum + a.analytics.totalViews, 0);
    const uniqueUsers = Math.floor(totalViews * 0.7); // Approximate unique users

    const averageRating = this.articles
      .filter(a => a.feedback.totalRatings > 0)
      .reduce((sum, a) => sum + a.feedback.averageRating, 0) / 
      this.articles.filter(a => a.feedback.totalRatings > 0).length || 0;

    const topCategories: CategoryPerformance[] = Object.values(ArticleCategory).map(category => {
      const categoryArticles = this.articles.filter(a => a.category === category && a.status === ArticleStatus.PUBLISHED);
      const categoryViews = categoryArticles.reduce((sum, a) => sum + a.analytics.totalViews, 0);
      const categoryRating = categoryArticles.length > 0 
        ? categoryArticles.reduce((sum, a) => sum + a.feedback.averageRating, 0) / categoryArticles.length 
        : 0;

      return {
        category,
        articleCount: categoryArticles.length,
        totalViews: categoryViews,
        averageRating: categoryRating,
        completionRate: Math.random() * 30 + 70 // Mock completion rate
      };
    }).filter(cp => cp.articleCount > 0).sort((a, b) => b.totalViews - a.totalViews);

    const articlePerformance: ArticlePerformance[] = this.articles
      .filter(a => a.status === ArticleStatus.PUBLISHED)
      .map(article => ({
        articleId: article.id,
        title: article.title,
        category: article.category,
        views: article.analytics.totalViews,
        uniqueViews: article.analytics.uniqueViews,
        rating: article.feedback.averageRating,
        helpfulPercentage: article.feedback.helpfulVotes + article.feedback.notHelpfulVotes > 0 
          ? (article.feedback.helpfulVotes / (article.feedback.helpfulVotes + article.feedback.notHelpfulVotes)) * 100 
          : 0,
        averageTimeOnPage: article.analytics.averageTimeOnPage,
        bounceRate: article.analytics.bounceRate,
        conversions: Math.floor(article.analytics.totalViews * article.analytics.conversionRate / 100)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 20);

    return {
      overview: {
        totalArticles,
        publishedArticles,
        totalViews,
        uniqueUsers,
        averageRating,
        searchSuccessRate: 87.5, // Mock data
        selfServiceResolutionRate: 73.2, // Mock data
        topCategories: topCategories.slice(0, 5)
      },
      articlePerformance,
      searchAnalytics: {
        totalSearches: 12450,
        successfulSearches: 10890,
        zeroResultSearches: 1560,
        topQueries: [
          { query: 'getting started', searchCount: 1250, clickThroughRate: 78.5, averagePosition: 1.2, zeroResults: false },
          { query: 'template troubleshooting', searchCount: 890, clickThroughRate: 65.3, averagePosition: 1.8, zeroResults: false },
          { query: 'billing help', searchCount: 567, clickThroughRate: 82.1, averagePosition: 1.1, zeroResults: false }
        ],
        queryTrends: [],
        searchToTicketConversion: 8.5
      },
      userEngagement: {
        sessionDuration: 420, // seconds
        pagesPerSession: 2.8,
        returnUserRate: 45.2,
        feedbackParticipationRate: 12.8,
        downloadRate: 15.6,
        socialShareRate: 3.2
      },
      contentGaps: [
        {
          topic: 'Advanced API Integration',
          searchVolume: 234,
          availableContent: 1,
          priority: 'high',
          suggestedContent: ['API Authentication Guide', 'Rate Limiting Best Practices']
        },
        {
          topic: 'Mobile App Usage',
          searchVolume: 189,
          availableContent: 0,
          priority: 'medium',
          suggestedContent: ['Mobile App Getting Started', 'Offline Usage Guide']
        }
      ],
      recommendations: [
        {
          type: 'update',
          target: 'kb_getting_started_001',
          reason: 'High traffic article with outdated screenshots',
          priority: 'high',
          estimatedImpact: '15% improvement in user satisfaction'
        },
        {
          type: 'create',
          target: 'Advanced Template Optimization',
          reason: 'High search volume with no existing content',
          priority: 'high',
          estimatedImpact: '200+ monthly organic views'
        }
      ]
    };
  }

  async getSuggestedArticles(articleId: string, limit: number = 5): Promise<KnowledgeBaseArticle[]> {
    const article = this.articles.find(a => a.id === articleId);
    
    if (!article) {
      return [];
    }

    // Find related articles based on category, tags, and related articles
    const suggestions = this.articles
      .filter(a => 
        a.id !== articleId && 
        a.status === ArticleStatus.PUBLISHED &&
        (a.category === article.category || 
         a.tags.some(tag => article.tags.includes(tag)) ||
         article.relatedArticles.includes(a.id))
      )
      .sort((a, b) => b.analytics.totalViews - a.analytics.totalViews)
      .slice(0, limit);

    return suggestions;
  }

  async getCategories(): Promise<{ category: ArticleCategory; count: number; description: string }[]> {
    const categoryDescriptions: Record<ArticleCategory, string> = {
      [ArticleCategory.GETTING_STARTED]: 'Get started with Beyond the AI Plateau',
      [ArticleCategory.TECHNICAL_GUIDES]: 'In-depth technical documentation and guides',
      [ArticleCategory.TROUBLESHOOTING]: 'Solutions to common problems and issues',
      [ArticleCategory.API_DOCUMENTATION]: 'API reference and integration guides',
      [ArticleCategory.BILLING_PAYMENT]: 'Billing, payments, and subscription management',
      [ArticleCategory.ACCOUNT_MANAGEMENT]: 'Managing your account and settings',
      [ArticleCategory.FEATURE_GUIDES]: 'Learn about platform features and capabilities',
      [ArticleCategory.BEST_PRACTICES]: 'Best practices and optimization tips',
      [ArticleCategory.FAQ]: 'Frequently asked questions and quick answers',
      [ArticleCategory.VIDEO_TUTORIALS]: 'Video tutorials and walkthroughs',
      [ArticleCategory.RELEASE_NOTES]: 'Product updates and release information',
      [ArticleCategory.TEMPLATES]: 'Template library and customization guides'
    };

    return Object.values(ArticleCategory).map(category => {
      const count = this.articles.filter(a => 
        a.category === category && a.status === ArticleStatus.PUBLISHED
      ).length;

      return {
        category,
        count,
        description: categoryDescriptions[category]
      };
    }).filter(c => c.count > 0);
  }
}