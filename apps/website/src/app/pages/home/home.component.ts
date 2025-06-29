import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';
import { StructuredDataService } from '../../services/structured-data.service';

// Import our sophisticated component library
import { 
  HeroSectionComponent, 
  HeroContent, 
  HeroConfig,
  PricingComparisonComponent,
  PricingTier,
  PricingConfig,
  TestimonialCarouselComponent,
  Testimonial,
  TestimonialConfig,
  LeadCaptureFormComponent,
  LeadCaptureConfig,
  LeadCaptureData
} from '@amysoft/shared-ui-components';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    HeroSectionComponent,
    PricingComparisonComponent,
    TestimonialCarouselComponent,
    LeadCaptureFormComponent
  ],
  template: `
    <!-- Hero Section with Lead Capture -->
    <app-hero-section
      [content]="heroContent"
      [config]="heroConfig"
      (ctaClicked)="onHeroCtaClick($event)"
      (secondaryCtaClicked)="onDemoClick()"
      (variantViewed)="onVariantViewed($event)"
    ></app-hero-section>

    <!-- Problem/Solution Section -->
    <section class="problem-solution-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Are You Stuck at the AI Plateau?</h2>
          <p class="section-subtitle">Most developers hit a wall with AI tools. Here's why you're different.</p>
        </div>

        <div class="problem-solution-grid">
          <!-- Problem Side -->
          <div class="problem-side">
            <div class="problem-card">
              <div class="card-icon">😤</div>
              <h3 class="card-title">The Problem</h3>
              <ul class="problem-list">
                <li>You've tried ChatGPT but results are inconsistent</li>
                <li>Your prompts lack structure and strategy</li>
                <li>You're overwhelmed by new AI tools</li>
                <li>You're not seeing the productivity gains others claim</li>
                <li>You feel like you're missing something crucial</li>
              </ul>
              <div class="impact-stat">
                <span class="stat-number">97%</span>
                <span class="stat-text">of developers never reach AI mastery</span>
              </div>
            </div>
          </div>

          <!-- Solution Side -->
          <div class="solution-side">
            <div class="solution-card">
              <div class="card-icon">✨</div>
              <h3 class="card-title">The Solution</h3>
              <ul class="solution-list">
                <li>Master the 5 Elite Principles of AI Development</li>
                <li>Use battle-tested prompts and templates</li>
                <li>Follow a proven methodology</li>
                <li>Get direct guidance from experts</li>
                <li>Join an elite community of AI-driven developers</li>
              </ul>
              <div class="impact-stat success">
                <span class="stat-number">300%</span>
                <span class="stat-text">average productivity increase</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Transition CTA -->
        <div class="transition-cta">
          <h3 class="transition-title">Ready to Break Through?</h3>
          <p class="transition-text">Join 1,247+ developers who've mastered the elite principles</p>
          <button class="transition-button" (click)="scrollToPrinciples()">
            <span class="button-text">Show Me the Principles</span>
            <span class="button-icon">↓</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Five Elite Principles Overview -->
    <section class="principles-section" id="principles">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">The 5 Elite Principles of AI-Driven Development</h2>
          <p class="section-subtitle">
            These principles separate the elite 3% from everyone else
          </p>
        </div>

        <div class="principles-grid">
          <div 
            class="principle-card"
            *ngFor="let principle of principles; let i = index"
            [attr.data-principle]="i + 1"
          >
            <div class="principle-number">{{ i + 1 }}</div>
            <div class="principle-content">
              <div class="principle-icon">{{ principle.icon }}</div>
              <h3 class="principle-title">{{ principle.title }}</h3>
              <p class="principle-description">{{ principle.description }}</p>
              <div class="principle-preview">
                <h4 class="preview-title">Preview:</h4>
                <p class="preview-text">{{ principle.previewContent }}</p>
                <div class="preview-meta">
                  <span class="meta-item">
                    <span class="meta-icon">📖</span>
                    <span class="meta-text">{{ principle.chapterReference }}</span>
                  </span>
                  <span class="meta-item">
                    <span class="meta-icon">⏱️</span>
                    <span class="meta-text">{{ principle.estimatedReadTime }} min</span>
                  </span>
                  <span class="meta-item difficulty" [attr.data-difficulty]="principle.difficultyLevel">
                    {{ principle.difficultyLevel }}
                  </span>
                </div>
              </div>
              <button class="principle-cta" (click)="onPrincipleClick(principle)">
                <span class="cta-text">Learn This Principle</span>
                <span class="cta-icon">→</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Principles Summary -->
        <div class="principles-summary">
          <div class="summary-content">
            <h3 class="summary-title">Master All 5 Principles</h3>
            <p class="summary-text">
              Get access to all 15 chapters, 50+ templates, and direct expert guidance
            </p>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-number">15</span>
                <span class="stat-label">Chapters</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">50+</span>
                <span class="stat-label">Templates</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">24/7</span>
                <span class="stat-label">Access</span>
              </div>
            </div>
            <button class="summary-cta" (click)="scrollToPricing()">
              <span class="cta-text">See All Plans</span>
              <span class="cta-icon">↓</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Social Proof Section -->
    <section class="social-proof-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Trusted by Elite Developers Worldwide</h2>
          <p class="section-subtitle">
            Join the community that's already transformed their AI workflow
          </p>
        </div>

        <!-- Testimonial Carousel -->
        <app-testimonial-carousel
          [testimonials]="testimonials"
          [config]="testimonialConfig"
          (testimonialClicked)="onTestimonialClick($event)"
          (slideChanged)="onTestimonialSlideChange($event)"
        ></app-testimonial-carousel>

        <!-- Trust Indicators -->
        <div class="trust-indicators">
          <div class="trust-grid">
            <div class="trust-item">
              <div class="trust-icon">🛡️</div>
              <h4 class="trust-title">30-Day Guarantee</h4>
              <p class="trust-text">Full refund, no questions asked</p>
            </div>
            <div class="trust-item">
              <div class="trust-icon">🔒</div>
              <h4 class="trust-title">Secure Payment</h4>
              <p class="trust-text">SSL encryption & safe checkout</p>
            </div>
            <div class="trust-item">
              <div class="trust-icon">⚡</div>
              <h4 class="trust-title">Instant Access</h4>
              <p class="trust-text">Start learning immediately</p>
            </div>
            <div class="trust-item">
              <div class="trust-icon">🏆</div>
              <h4 class="trust-title">Expert Guidance</h4>
              <p class="trust-text">Direct access to AI specialists</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="pricing-section" id="pricing">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Choose Your Path to AI Mastery</h2>
          <p class="section-subtitle">
            Start free, upgrade as you grow. All plans include our satisfaction guarantee.
          </p>
        </div>

        <app-pricing-comparison
          [tiers]="pricingTiers"
          [config]="pricingConfig"
          (tierSelected)="onTierSelected($event)"
          (comparisonToggled)="onComparisonToggled($event)"
        ></app-pricing-comparison>
      </div>
    </section>

    <!-- Risk Reversal Section -->
    <section class="risk-reversal-section">
      <div class="container">
        <div class="risk-reversal-card">
          <div class="guarantee-badge">
            <span class="badge-icon">🛡️</span>
            <span class="badge-text">Risk-Free Guarantee</span>
          </div>
          
          <h2 class="guarantee-title">Your Success is Guaranteed</h2>
          <p class="guarantee-description">
            We're so confident in the Elite Principles that we offer an unconditional 30-day guarantee. 
            If you don't see a dramatic improvement in your AI workflow, get a full refund.
          </p>

          <div class="guarantee-features">
            <div class="feature-item">
              <span class="feature-icon">✅</span>
              <span class="feature-text">30 days to try everything</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">✅</span>
              <span class="feature-text">No questions asked refund</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">✅</span>
              <span class="feature-text">Keep access to downloaded content</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">✅</span>
              <span class="feature-text">Cancel anytime</span>
            </div>
          </div>

          <div class="guarantee-testimonial">
            <p class="testimonial-quote">
              "I was skeptical at first, but the 30-day guarantee gave me confidence to try. 
              Best decision I made for my development career."
            </p>
            <div class="testimonial-author">
              <img src="/assets/testimonials/guarantee-testimonial.jpg" alt="Customer testimonial" class="author-avatar">
              <div class="author-info">
                <span class="author-name">David Rodriguez</span>
                <span class="author-title">Senior Software Engineer</span>
              </div>
            </div>
          </div>

          <button class="guarantee-cta" (click)="scrollToPricing()">
            <span class="cta-text">Start Risk-Free Today</span>
            <span class="cta-icon">🚀</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="final-cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Don't Stay Stuck at the AI Plateau</h2>
          <p class="cta-description">
            Every day you wait is another day of lost productivity. Join the elite 3% who've mastered AI.
          </p>
          
          <div class="urgency-indicators">
            <div class="urgency-item">
              <span class="urgency-number">1,247</span>
              <span class="urgency-text">developers already transformed</span>
            </div>
            <div class="urgency-item">
              <span class="urgency-number">4.8★</span>
              <span class="urgency-text">average rating</span>
            </div>
            <div class="urgency-item">
              <span class="urgency-number">89</span>
              <span class="urgency-text">success stories</span>
            </div>
          </div>

          <!-- Final Lead Capture -->
          <div class="final-lead-capture">
            <app-lead-capture-form
              [config]="finalLeadCaptureConfig"
              (formSubmit)="onFinalLeadCapture($event)"
            ></app-lead-capture-form>
          </div>

          <div class="final-trust-line">
            <span class="trust-icon">🔒</span>
            <span class="trust-text">Secure signup • 30-day guarantee • Instant access</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  // Hero Configuration
  heroContent: HeroContent = {
    headline: 'Beyond the AI Plateau: Master the Elite Principles of AI-Driven Development',
    subheadline: 'Transform from AI novice to elite developer with proven strategies that 97% of developers miss',
    ctaText: 'Get Instant Access to Elite Principles',
    features: [
      '5 Elite Principles of AI Development',
      '15+ Practical Templates',
      'Direct Access to Expert Guidance'
    ],
    socialProof: {
      memberCount: 1247,
      testimonialCount: 89,
      averageRating: 4.8
    }
  };

  heroConfig: HeroConfig = {
    enableVideo: false,
    showSocialProof: true,
    showFeatures: true,
    enableParticles: true,
    autoPlayVideo: false,
    ctaStyle: 'gradient',
    layout: 'centered'
  };

  // Five Elite Principles Data
  principles = [
    {
      id: 'strategic-prompting',
      title: 'Strategic Prompting Mastery',
      description: 'Advanced prompt engineering techniques that separate elite developers from the masses',
      previewContent: 'Most developers use AI like a search engine. Elite developers use it like a specialized team member with deep context and clear objectives.',
      icon: '🎯',
      chapterReference: 'Chapter 2',
      estimatedReadTime: 12,
      difficultyLevel: 'intermediate'
    },
    {
      id: 'code-generation-optimization',
      title: 'Code Generation Optimization',
      description: 'Maximizing AI code generation effectiveness while maintaining quality standards',
      previewContent: 'The difference between getting working code and getting production-ready code lies in how you frame the problem and guide the AI.',
      icon: '⚡',
      chapterReference: 'Chapter 4',
      estimatedReadTime: 15,
      difficultyLevel: 'advanced'
    },
    {
      id: 'context-management',
      title: 'Context Management Excellence',
      description: 'Managing conversation context for complex, multi-step development projects',
      previewContent: 'Elite developers maintain perfect context across long conversations, ensuring consistency and building on previous interactions.',
      icon: '🧠',
      chapterReference: 'Chapter 6',
      estimatedReadTime: 10,
      difficultyLevel: 'intermediate'
    },
    {
      id: 'debugging-refinement',
      title: 'Debugging & Refinement Strategies',
      description: 'Advanced debugging techniques using AI assistance for faster problem resolution',
      previewContent: 'Transform debugging from frustrating guesswork into systematic problem-solving with AI-powered analysis and solutions.',
      icon: '🔧',
      chapterReference: 'Chapter 8',
      estimatedReadTime: 14,
      difficultyLevel: 'advanced'
    },
    {
      id: 'integration-deployment',
      title: 'Integration & Deployment Mastery',
      description: 'Production-ready AI-assisted development workflows and deployment strategies',
      previewContent: 'Bridge the gap from AI-generated code to production systems with proven integration patterns and deployment strategies.',
      icon: '🚀',
      chapterReference: 'Chapter 10',
      estimatedReadTime: 18,
      difficultyLevel: 'advanced'
    }
  ];

  // Testimonials Data
  testimonials: Testimonial[] = [
    {
      id: 'testimonial-1',
      name: 'Sarah Chen',
      title: 'Senior Full Stack Developer',
      company: 'TechCorp',
      avatar: '/assets/testimonials/sarah-chen.jpg',
      rating: 5,
      quote: 'This completely transformed how I work with AI. I went from struggling with basic prompts to generating production-ready code in minutes. My productivity increased by 300%.',
      tags: ['React', 'Senior Developer', 'Full Stack'],
      verified: true,
      featured: true,
      metrics: {
        timeSaved: '10h/week',
        productivityGain: '+300%',
        satisfaction: 10
      }
    },
    {
      id: 'testimonial-2',
      name: 'Michael Rodriguez',
      title: 'Software Architect',
      company: 'StartupCo',
      avatar: '/assets/testimonials/michael-rodriguez.jpg',
      rating: 5,
      quote: 'The Elite Principles aren\'t just tips - they\'re a complete methodology. I now approach every development task with AI-first thinking.',
      tags: ['Architecture', 'Team Lead', 'Python'],
      verified: true,
      featured: true,
      metrics: {
        timeSaved: '15h/week',
        productivityGain: '+250%',
        satisfaction: 9
      }
    },
    {
      id: 'testimonial-3',
      name: 'Emily Johnson',
      title: 'Frontend Engineer',
      company: 'DesignStudio',
      avatar: '/assets/testimonials/emily-johnson.jpg',
      rating: 5,
      quote: 'I was skeptical about AI for development, but these techniques changed everything. The templates alone saved me hundreds of hours.',
      tags: ['Frontend', 'React', 'TypeScript'],
      verified: true,
      featured: false,
      metrics: {
        timeSaved: '8h/week',
        productivityGain: '+200%',
        satisfaction: 9
      }
    }
  ];

  testimonialConfig: TestimonialConfig = {
    autoRotate: true,
    rotationInterval: 6000,
    showRating: true,
    showPhoto: true,
    showMetrics: true,
    showTags: true,
    layout: 'carousel',
    slidesToShow: 1,
    enableSwipe: true,
    showNavigation: true,
    showDots: true,
    pauseOnHover: true
  };

  // Pricing Tiers
  pricingTiers: PricingTier[] = [
    {
      id: 'foundation',
      name: 'Foundation',
      description: 'Perfect for developers starting their AI journey',
      pricing: {
        monthly: 29,
        annual: 290,
        currency: 'USD',
        annualDiscount: 17
      },
      features: [
        { name: '5 Core Chapters', included: true, description: 'Essential AI development principles' },
        { name: 'Basic Template Library', included: true, description: '20+ proven prompts and templates' },
        { name: 'Community Access', included: true, description: 'Join our developer community' },
        { name: '1-on-1 Coaching', included: false, description: 'Direct mentorship sessions' }
      ],
      ctaText: 'Start Foundation',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For experienced developers ready to master AI',
      pricing: {
        monthly: 49,
        annual: 490,
        currency: 'USD',
        annualDiscount: 17
      },
      features: [
        { name: 'All 15 Chapters', included: true, description: 'Complete AI development mastery', highlight: true },
        { name: 'Advanced Template Library', included: true, description: '50+ specialized templates', highlight: true },
        { name: 'Priority Community Access', included: true, description: 'Priority support and responses' },
        { name: 'Monthly Group Coaching', included: true, description: 'Monthly group coaching sessions', highlight: true }
      ],
      ctaText: 'Go Professional',
      popular: true
    },
    {
      id: 'elite',
      name: 'Elite',
      description: 'Maximum access for serious professionals',
      pricing: {
        monthly: 99,
        annual: 990,
        currency: 'USD',
        annualDiscount: 17
      },
      features: [
        { name: 'Everything in Professional', included: true, description: 'All Professional tier benefits' },
        { name: 'Custom Template Creation', included: true, description: 'Personalized templates for your stack', highlight: true },
        { name: 'Direct Messaging Access', included: true, description: 'Direct access to instructor', highlight: true },
        { name: 'Advanced Analytics', included: true, description: 'Detailed learning progress analytics', highlight: true }
      ],
      ctaText: 'Join Elite',
      popular: false
    }
  ];

  pricingConfig: PricingConfig = {
    showAnnualToggle: true,
    showComparison: true,
    highlightPopular: true,
    showMoneyBackGuarantee: true,
    compactMode: false,
    maxTiers: 3
  };

  // Final Lead Capture Configuration
  finalLeadCaptureConfig: LeadCaptureConfig = {
    variant: 'hero',
    title: 'Join 1,247+ Elite Developers',
    subtitle: 'Get instant access to all 5 Elite Principles',
    buttonText: 'Get Instant Access Now',
    showOptionalFields: false,
    multiStep: false,
    showPrivacyNotice: true,
    enableRealTimeValidation: true
  };

  constructor(
    private metaService: MetaService,
    private structuredDataService: StructuredDataService
  ) {}

  ngOnInit(): void {
    this.setPageMetadata();
    this.trackPageView();
  }

  private setPageMetadata(): void {
    this.metaService.setHomePage();
    this.structuredDataService.setHomePageData();
    
    // Additional SEO optimizations
    this.metaService.updateMetaTags({
      title: 'Beyond the AI Plateau - Master Elite AI Development Principles',
      description: 'Transform from AI novice to elite developer with proven strategies. Join 1,247+ developers who\'ve mastered the 5 Elite Principles of AI-Driven Development.',
      keywords: 'AI development, prompt engineering, AI productivity, developer tools, AI mastery, programming AI',
      ogTitle: 'Master Elite AI Development Principles - Beyond the AI Plateau',
      ogDescription: 'Join 1,247+ developers who\'ve transformed their productivity with the 5 Elite Principles of AI-Driven Development.',
      ogImage: '/assets/og/homepage-hero.jpg',
      twitterTitle: 'Master Elite AI Development Principles',
      twitterDescription: 'Transform your development workflow with proven AI strategies that 97% of developers miss.',
      twitterImage: '/assets/twitter/homepage-card.jpg'
    });
  }

  private trackPageView(): void {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: 'Homepage',
        page_location: window.location.href,
        page_path: '/'
      });
    }
  }

  // Event Handlers
  onHeroCtaClick(event: { variant?: string; content: HeroContent }): void {
    this.trackConversion('hero_cta_click', {
      variant: event.variant,
      cta_text: event.content.ctaText
    });
    this.scrollToPricing();
  }

  onDemoClick(): void {
    this.trackConversion('demo_cta_click');
    // Open demo modal or navigate to demo page
  }

  onVariantViewed(event: { variant: string; timestamp: Date }): void {
    this.trackEvent('variant_viewed', {
      variant: event.variant,
      timestamp: event.timestamp.toISOString()
    });
  }

  onPrincipleClick(principle: any): void {
    this.trackConversion('principle_click', {
      principle_id: principle.id,
      principle_title: principle.title
    });
    this.scrollToPricing();
  }

  onTestimonialClick(testimonial: Testimonial): void {
    this.trackEvent('testimonial_click', {
      testimonial_id: testimonial.id,
      testimonial_name: testimonial.name
    });
  }

  onTestimonialSlideChange(event: { index: number; testimonial: Testimonial }): void {
    this.trackEvent('testimonial_slide_change', {
      slide_index: event.index,
      testimonial_id: event.testimonial.id
    });
  }

  onTierSelected(event: { tier: PricingTier; billing: 'monthly' | 'annual' }): void {
    this.trackConversion('tier_selected', {
      tier_id: event.tier.id,
      tier_name: event.tier.name,
      billing_cycle: event.billing,
      price: event.billing === 'annual' ? event.tier.pricing.annual : event.tier.pricing.monthly
    });
    
    // Navigate to checkout or signup
    window.location.href = `/signup?tier=${event.tier.id}&billing=${event.billing}`;
  }

  onComparisonToggled(showComparison: boolean): void {
    this.trackEvent('pricing_comparison_toggled', {
      show_comparison: showComparison
    });
  }

  onFinalLeadCapture(leadData: LeadCaptureData): void {
    this.trackConversion('final_lead_capture', {
      source: leadData.source,
      email: leadData.email,
      consent: leadData.gdprConsent
    });
    
    // Handle lead capture API call
    // This would integrate with the backend API from issue #75
  }

  // Utility Methods
  scrollToPrinciples(): void {
    document.getElementById('principles')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }

  scrollToPricing(): void {
    document.getElementById('pricing')?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }

  private trackEvent(eventName: string, properties?: any): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, properties);
    }
  }

  private trackConversion(eventName: string, properties?: any): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        ...properties,
        event_category: 'conversion',
        event_label: 'homepage'
      });
    }
  }
}