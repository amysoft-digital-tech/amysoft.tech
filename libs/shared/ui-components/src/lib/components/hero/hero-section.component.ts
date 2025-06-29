import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

export interface HeroContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaUrl?: string;
  features: string[];
  socialProof: {
    memberCount: number;
    testimonialCount: number;
    averageRating: number;
  };
  backgroundVideo?: {
    url: string;
    poster: string;
  };
  heroImage?: {
    desktop: string;
    mobile: string;
    alt: string;
  };
}

export interface HeroVariant {
  id: string;
  name: string;
  content: HeroContent;
  trafficPercentage: number;
  active: boolean;
}

export interface HeroConfig {
  enableVideo?: boolean;
  showSocialProof?: boolean;
  showFeatures?: boolean;
  enableParticles?: boolean;
  variant?: string;
  autoPlayVideo?: boolean;
  ctaStyle?: 'gradient' | 'solid' | 'outline';
  layout?: 'centered' | 'split' | 'minimal';
}

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section 
      class="hero-section" 
      [class]="'layout-' + config.layout"
      [class.has-video]="hasBackgroundVideo"
      [attr.data-variant]="currentVariant?.id"
      [attr.data-testid]="'hero-section'"
    >
      <!-- Background Video -->
      <div class="hero-background" *ngIf="hasBackgroundVideo">
        <video 
          #heroVideo
          class="background-video"
          [poster]="content.backgroundVideo?.poster"
          [muted]="true"
          [loop]="true"
          [autoplay]="config.autoPlayVideo"
          [playsinline]="true"
          (loadeddata)="onVideoLoaded()"
          (error)="onVideoError()"
        >
          <source [src]="content.backgroundVideo?.url" type="video/mp4">
          Your browser does not support the video tag.
        </video>
        <div class="video-overlay"></div>
      </div>

      <!-- Particle System -->
      <div class="particle-system" *ngIf="config.enableParticles">
        <div class="particle" *ngFor="let particle of particles" 
             [style.left.%]="particle.x"
             [style.top.%]="particle.y"
             [style.animation-delay.s]="particle.delay">
        </div>
      </div>

      <!-- Hero Content Container -->
      <div class="hero-container">
        <div class="hero-content">
          <!-- Main Content -->
          <div class="content-main">
            <div class="announcement-badge" *ngIf="announcementText">
              <span class="badge-icon">🚀</span>
              <span class="badge-text">{{ announcementText }}</span>
            </div>

            <h1 class="hero-headline" [innerHTML]="getFormattedHeadline()"></h1>
            
            <p class="hero-subheadline">{{ content.subheadline }}</p>

            <!-- Features List -->
            <div class="features-showcase" *ngIf="config.showFeatures && content.features.length > 0">
              <div class="features-grid">
                <div 
                  class="feature-item" 
                  *ngFor="let feature of content.features; let i = index"
                  [style.animation-delay.ms]="i * 150"
                >
                  <span class="feature-icon">✨</span>
                  <span class="feature-text">{{ feature }}</span>
                </div>
              </div>
            </div>

            <!-- CTA Section -->
            <div class="cta-section">
              <button 
                class="hero-cta"
                [class]="'cta-' + config.ctaStyle"
                (click)="onCtaClick()"
                [attr.aria-label]="content.ctaText + ' - Primary call to action'"
              >
                <span class="cta-text">{{ content.ctaText }}</span>
                <span class="cta-icon" [attr.aria-hidden]="true">→</span>
              </button>

              <!-- Secondary CTA -->
              <button class="secondary-cta" (click)="onSecondaryCta()">
                <span class="play-icon">▶</span>
                <span>Watch Demo</span>
              </button>
            </div>

            <!-- Social Proof -->
            <div class="social-proof" *ngIf="config.showSocialProof">
              <div class="proof-stats">
                <div class="stat-item">
                  <span class="stat-number">{{ formatNumber(content.socialProof.memberCount) }}+</span>
                  <span class="stat-label">Developers</span>
                </div>
                <div class="stat-separator">•</div>
                <div class="stat-item">
                  <span class="stat-number">{{ content.socialProof.averageRating }}★</span>
                  <span class="stat-label">Rating</span>
                </div>
                <div class="stat-separator">•</div>
                <div class="stat-item">
                  <span class="stat-number">{{ content.socialProof.testimonialCount }}</span>
                  <span class="stat-label">Reviews</span>
                </div>
              </div>

              <!-- Trust Indicators -->
              <div class="trust-indicators">
                <div class="trust-item">
                  <span class="trust-icon">🔒</span>
                  <span class="trust-text">SSL Secured</span>
                </div>
                <div class="trust-item">
                  <span class="trust-icon">💳</span>
                  <span class="trust-text">30-day Guarantee</span>
                </div>
                <div class="trust-item">
                  <span class="trust-icon">⚡</span>
                  <span class="trust-text">Instant Access</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Hero Image/Illustration -->
          <div class="content-visual" *ngIf="content.heroImage && config.layout === 'split'">
            <div class="hero-image-container">
              <img 
                [src]="getHeroImageSrc()"
                [alt]="content.heroImage.alt"
                class="hero-image"
                loading="eager"
                (load)="onImageLoad()"
                (error)="onImageError()"
              />
              
              <!-- Floating Elements -->
              <div class="floating-elements">
                <div class="floating-card testimonial-card">
                  <div class="card-content">
                    <div class="quote-mark">"</div>
                    <p>This changed everything for our development workflow!</p>
                    <div class="author">
                      <img src="/assets/testimonials/avatar-mini.jpg" alt="Developer" class="author-avatar">
                      <span class="author-name">Alex Chen</span>
                    </div>
                  </div>
                </div>

                <div class="floating-card stats-card">
                  <div class="card-content">
                    <div class="stat-line">
                      <span class="stat-label">Productivity</span>
                      <span class="stat-value">+300%</span>
                    </div>
                    <div class="stat-line">
                      <span class="stat-label">Time Saved</span>
                      <span class="stat-value">10h/week</span>
                    </div>
                  </div>
                </div>

                <div class="floating-card feature-highlight">
                  <div class="card-content">
                    <span class="highlight-icon">🎯</span>
                    <span class="highlight-text">AI-Powered Templates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll Indicator -->
        <div class="scroll-indicator" *ngIf="config.layout === 'centered'">
          <div class="scroll-arrow">
            <span>Scroll to explore</span>
            <div class="arrow-animation">↓</div>
          </div>
        </div>
      </div>

      <!-- A/B Testing Indicator (Development only) -->
      <div class="ab-test-indicator" *ngIf="isDevelopment && currentVariant">
        <span class="variant-label">Variant: {{ currentVariant.name }}</span>
      </div>
    </section>
  `,
  styleUrls: ['./hero-section.component.scss']
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  @Input() content: HeroContent = {
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

  @Input() variants: HeroVariant[] = [];
  @Input() config: HeroConfig = {
    enableVideo: false,
    showSocialProof: true,
    showFeatures: true,
    enableParticles: false,
    autoPlayVideo: true,
    ctaStyle: 'gradient',
    layout: 'centered'
  };

  @Output() ctaClicked = new EventEmitter<{ variant?: string; content: HeroContent }>();
  @Output() secondaryCtaClicked = new EventEmitter<void>();
  @Output() variantViewed = new EventEmitter<{ variant: string; timestamp: Date }>();

  currentVariant?: HeroVariant;
  particles: Array<{ x: number; y: number; delay: number }> = [];
  announcementText = '';
  isDevelopment = false;

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.isDevelopment = !this.isProduction();
    this.initializeVariant();
    this.initializeParticles();
    this.setAnnouncementText();
    this.trackVariantView();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeVariant() {
    if (this.variants.length === 0) {
      return;
    }

    // A/B testing logic
    const activeVariants = this.variants.filter(v => v.active);
    if (activeVariants.length === 0) {
      return;
    }

    // Check for URL parameter override (for testing)
    const urlParams = new URLSearchParams(window.location.search);
    const variantParam = urlParams.get('variant');
    
    if (variantParam) {
      const requestedVariant = activeVariants.find(v => v.id === variantParam);
      if (requestedVariant) {
        this.currentVariant = requestedVariant;
        this.content = { ...this.content, ...requestedVariant.content };
        return;
      }
    }

    // Random variant selection based on traffic percentage
    const random = Math.random() * 100;
    let cumulativePercentage = 0;

    for (const variant of activeVariants) {
      cumulativePercentage += variant.trafficPercentage;
      if (random <= cumulativePercentage) {
        this.currentVariant = variant;
        this.content = { ...this.content, ...variant.content };
        break;
      }
    }
  }

  private initializeParticles() {
    if (!this.config.enableParticles) {
      return;
    }

    this.particles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5
    }));
  }

  private setAnnouncementText() {
    // Dynamic announcement based on current promotions or events
    const announcements = [
      'Limited Time: 50% off first month',
      'New: Advanced AI Templates Released',
      '🔥 1000+ developers joined this month'
    ];
    
    const randomIndex = Math.floor(Math.random() * announcements.length);
    this.announcementText = announcements[randomIndex];
  }

  private trackVariantView() {
    if (this.currentVariant) {
      this.variantViewed.emit({
        variant: this.currentVariant.id,
        timestamp: new Date()
      });
    }
  }

  getFormattedHeadline(): string {
    // Add dynamic formatting for key phrases
    return this.content.headline
      .replace(/Elite Principles/g, '<span class="highlight-text">Elite Principles</span>')
      .replace(/AI-Driven Development/g, '<span class="highlight-secondary">AI-Driven Development</span>');
  }

  getHeroImageSrc(): string {
    if (!this.content.heroImage) {
      return '';
    }

    // Responsive image selection
    return window.innerWidth <= 768 
      ? this.content.heroImage.mobile 
      : this.content.heroImage.desktop;
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }

  onCtaClick() {
    this.ctaClicked.emit({
      variant: this.currentVariant?.id,
      content: this.content
    });

    // Track conversion event
    this.trackConversion('primary_cta_click');
  }

  onSecondaryCta() {
    this.secondaryCtaClicked.emit();
    this.trackConversion('secondary_cta_click');
  }

  onVideoLoaded() {
    console.log('Hero background video loaded successfully');
  }

  onVideoError() {
    console.warn('Hero background video failed to load');
    // Fallback to static background
  }

  onImageLoad() {
    console.log('Hero image loaded successfully');
  }

  onImageError() {
    console.warn('Hero image failed to load');
  }

  private trackConversion(eventType: string) {
    // Analytics tracking
    if (typeof gtag !== 'undefined') {
      gtag('event', eventType, {
        variant: this.currentVariant?.id || 'default',
        hero_layout: this.config.layout,
        cta_style: this.config.ctaStyle
      });
    }
  }

  private isProduction(): boolean {
    return window.location.hostname !== 'localhost' && 
           window.location.hostname !== '127.0.0.1';
  }

  get hasBackgroundVideo(): boolean {
    return this.config.enableVideo && !!this.content.backgroundVideo?.url;
  }
}