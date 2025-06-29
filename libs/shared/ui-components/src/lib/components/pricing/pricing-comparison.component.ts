import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  pricing: {
    monthly: number;
    annual: number;
    currency: string;
    annualDiscount: number;
  };
  features: PricingFeature[];
  ctaText: string;
  popular?: boolean;
  limitations?: string[];
  badge?: string;
}

export interface PricingFeature {
  name: string;
  included: boolean;
  description?: string;
  highlight?: boolean;
  tooltip?: string;
}

export interface PricingConfig {
  showAnnualToggle?: boolean;
  showComparison?: boolean;
  highlightPopular?: boolean;
  showMoneyBackGuarantee?: boolean;
  compactMode?: boolean;
  maxTiers?: number;
}

@Component({
  selector: 'app-pricing-comparison',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pricing-comparison" [class.compact]="config.compactMode" [attr.data-testid]="'pricing-comparison'">
      <!-- Pricing Header -->
      <div class="pricing-header" *ngIf="!config.compactMode">
        <h2 class="pricing-title">Choose Your Plan</h2>
        <p class="pricing-subtitle">Start free, upgrade as you grow</p>
        
        <!-- Annual/Monthly Toggle -->
        <div class="billing-toggle" *ngIf="config.showAnnualToggle">
          <div class="toggle-container">
            <span class="toggle-label" [class.active]="!isAnnual">Monthly</span>
            <button 
              class="toggle-switch" 
              [class.annual]="isAnnual"
              (click)="toggleBilling()"
              [attr.aria-label]="'Switch to ' + (isAnnual ? 'monthly' : 'annual') + ' billing'"
            >
              <span class="toggle-slider"></span>
            </button>
            <span class="toggle-label" [class.active]="isAnnual">
              Annual
              <span class="savings-badge" *ngIf="getMaxDiscount() > 0">Save {{ getMaxDiscount() }}%</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Pricing Cards -->
      <div class="pricing-grid" [class]="'tiers-' + visibleTiers.length">
        <div 
          class="pricing-card" 
          *ngFor="let tier of visibleTiers; trackBy: trackByTierId"
          [class.popular]="tier.popular && config.highlightPopular"
          [class.recommended]="tier.popular"
          [attr.data-tier]="tier.id"
        >
          <!-- Popular Badge -->
          <div class="popular-badge" *ngIf="tier.popular && config.highlightPopular">
            <span class="badge-text">{{ tier.badge || 'Most Popular' }}</span>
          </div>

          <!-- Card Header -->
          <div class="card-header">
            <h3 class="tier-name">{{ tier.name }}</h3>
            <p class="tier-description">{{ tier.description }}</p>
            
            <!-- Pricing Display -->
            <div class="pricing-display">
              <div class="price-main">
                <span class="currency">${{ tier.pricing.currency !== 'USD' ? tier.pricing.currency + ' ' : '' }}</span>
                <span class="amount">{{ getCurrentPrice(tier) }}</span>
                <span class="period">/{{ isAnnual ? 'year' : 'month' }}</span>
              </div>
              
              <!-- Annual Savings -->
              <div class="price-savings" *ngIf="isAnnual && tier.pricing.annualDiscount > 0">
                <span class="original-price">${{ tier.pricing.monthly * 12 }}</span>
                <span class="savings-text">Save {{ tier.pricing.annualDiscount }}%</span>
              </div>
              
              <!-- Monthly equivalent for annual -->
              <div class="price-equivalent" *ngIf="isAnnual">
                ${{ (getCurrentPrice(tier) / 12).toFixed(0) }}/month billed annually
              </div>
            </div>
          </div>

          <!-- Features List -->
          <div class="features-section">
            <h4 class="features-title">What's included:</h4>
            <ul class="features-list" role="list">
              <li 
                class="feature-item" 
                *ngFor="let feature of tier.features"
                [class.included]="feature.included"
                [class.excluded]="!feature.included"
                [class.highlight]="feature.highlight"
                [attr.title]="feature.tooltip"
              >
                <span class="feature-icon" [attr.aria-hidden]="true">
                  <span *ngIf="feature.included">✓</span>
                  <span *ngIf="!feature.included">✗</span>
                </span>
                <span class="feature-text">
                  {{ feature.name }}
                  <span class="feature-description" *ngIf="feature.description">
                    {{ feature.description }}
                  </span>
                </span>
                <button 
                  class="feature-tooltip-trigger"
                  *ngIf="feature.tooltip"
                  [attr.aria-label]="'More info about ' + feature.name"
                  (click)="showTooltip(feature)"
                >
                  ℹ️
                </button>
              </li>
            </ul>

            <!-- Limitations -->
            <div class="limitations" *ngIf="tier.limitations && tier.limitations.length > 0">
              <h5 class="limitations-title">Limitations:</h5>
              <ul class="limitations-list">
                <li *ngFor="let limitation of tier.limitations" class="limitation-item">
                  {{ limitation }}
                </li>
              </ul>
            </div>
          </div>

          <!-- CTA Section -->
          <div class="cta-section">
            <button 
              class="cta-button"
              [class.primary]="tier.popular"
              [class.secondary]="!tier.popular"
              (click)="onTierSelect(tier)"
              [attr.data-tier-id]="tier.id"
            >
              {{ tier.ctaText }}
            </button>
            
            <!-- Additional CTA Info -->
            <div class="cta-info">
              <p class="guarantee-text" *ngIf="config.showMoneyBackGuarantee">
                <span class="guarantee-icon">🛡️</span>
                30-day money-back guarantee
              </p>
              <p class="upgrade-text" *ngIf="!tier.popular">
                Can upgrade anytime
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Comparison Table -->
      <div class="comparison-table" *ngIf="config.showComparison && !config.compactMode">
        <button 
          class="comparison-toggle"
          (click)="showComparison = !showComparison"
          [attr.aria-expanded]="showComparison"
        >
          <span>{{ showComparison ? 'Hide' : 'Show' }} detailed comparison</span>
          <span class="toggle-icon" [class.rotated]="showComparison">▼</span>
        </button>

        <div class="comparison-content" *ngIf="showComparison" [@slideInOut]>
          <table class="comparison-table-grid" role="table">
            <thead>
              <tr>
                <th scope="col" class="feature-header">Features</th>
                <th scope="col" *ngFor="let tier of visibleTiers" class="tier-header">
                  {{ tier.name }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let feature of getAllFeatures()" class="comparison-row">
                <td class="feature-name">
                  {{ feature.name }}
                  <span class="feature-desc" *ngIf="feature.description">
                    {{ feature.description }}
                  </span>
                </td>
                <td 
                  *ngFor="let tier of visibleTiers" 
                  class="feature-value"
                  [class.included]="isFeatureIncluded(tier, feature)"
                  [class.excluded]="!isFeatureIncluded(tier, feature)"
                >
                  <span class="value-icon">
                    {{ isFeatureIncluded(tier, feature) ? '✓' : '✗' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Social Proof -->
      <div class="social-proof" *ngIf="!config.compactMode">
        <div class="proof-stats">
          <div class="stat-item">
            <span class="stat-number">1,247+</span>
            <span class="stat-label">Happy Developers</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">4.8★</span>
            <span class="stat-label">Average Rating</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">89</span>
            <span class="stat-label">Reviews</span>
          </div>
        </div>
        
        <div class="testimonial-preview">
          <p class="testimonial-text">
            "This completely transformed how I work with AI. The templates alone saved me 10+ hours per week."
          </p>
          <div class="testimonial-author">
            <img src="/assets/testimonials/avatar-1.jpg" alt="Customer avatar" class="author-avatar" loading="lazy">
            <div class="author-info">
              <span class="author-name">Sarah Chen</span>
              <span class="author-title">Senior Developer at TechCorp</span>
            </div>
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="pricing-faq" *ngIf="!config.compactMode">
        <h3 class="faq-title">Frequently Asked Questions</h3>
        <div class="faq-items">
          <div class="faq-item" *ngFor="let faq of commonFaqs">
            <button 
              class="faq-question"
              (click)="toggleFaq(faq)"
              [attr.aria-expanded]="faq.expanded"
            >
              {{ faq.question }}
              <span class="faq-icon" [class.rotated]="faq.expanded">▼</span>
            </button>
            <div class="faq-answer" *ngIf="faq.expanded" [@slideInOut]>
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./pricing-comparison.component.scss'],
  animations: [
    // Add slide animations for smooth transitions
  ]
})
export class PricingComparisonComponent implements OnInit {
  @Input() tiers: PricingTier[] = [];
  @Input() config: PricingConfig = {
    showAnnualToggle: true,
    showComparison: true,
    highlightPopular: true,
    showMoneyBackGuarantee: true,
    compactMode: false,
    maxTiers: 3
  };
  @Input() currentUserTier?: string;

  @Output() tierSelected = new EventEmitter<{ tier: PricingTier; billing: 'monthly' | 'annual' }>();
  @Output() comparisonToggled = new EventEmitter<boolean>();

  isAnnual = false;
  showComparison = false;
  visibleTiers: PricingTier[] = [];

  commonFaqs = [
    {
      question: 'Can I upgrade or downgrade my plan anytime?',
      answer: 'Yes, you can change your plan at any time. Upgrades take effect immediately, downgrades at the next billing cycle.',
      expanded: false
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.',
      expanded: false
    },
    {
      question: 'Is there a free trial?',
      answer: 'We offer a 7-day free trial for all paid plans, no credit card required.',
      expanded: false
    }
  ];

  ngOnInit() {
    this.updateVisibleTiers();
  }

  private updateVisibleTiers() {
    this.visibleTiers = this.config.maxTiers 
      ? this.tiers.slice(0, this.config.maxTiers)
      : this.tiers;
  }

  toggleBilling() {
    this.isAnnual = !this.isAnnual;
  }

  getCurrentPrice(tier: PricingTier): number {
    return this.isAnnual ? tier.pricing.annual : tier.pricing.monthly;
  }

  getMaxDiscount(): number {
    return Math.max(...this.tiers.map(tier => tier.pricing.annualDiscount));
  }

  onTierSelect(tier: PricingTier) {
    this.tierSelected.emit({
      tier,
      billing: this.isAnnual ? 'annual' : 'monthly'
    });
  }

  trackByTierId(index: number, tier: PricingTier): string {
    return tier.id;
  }

  getAllFeatures(): PricingFeature[] {
    const allFeatures = new Map<string, PricingFeature>();
    
    this.visibleTiers.forEach(tier => {
      tier.features.forEach(feature => {
        if (!allFeatures.has(feature.name)) {
          allFeatures.set(feature.name, feature);
        }
      });
    });

    return Array.from(allFeatures.values());
  }

  isFeatureIncluded(tier: PricingTier, feature: PricingFeature): boolean {
    return tier.features.some(f => f.name === feature.name && f.included);
  }

  showTooltip(feature: PricingFeature) {
    // Implementation for showing feature tooltip
    console.log('Showing tooltip for:', feature.name, feature.tooltip);
  }

  toggleFaq(faq: any) {
    faq.expanded = !faq.expanded;
  }
}