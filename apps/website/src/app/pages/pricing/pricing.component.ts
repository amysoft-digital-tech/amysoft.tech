import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';
import { StructuredDataService } from '../../services/structured-data.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="hero-section">
      <div class="container">
        <h1>Choose Your Plan</h1>
        <p class="hero-subtitle">
          Flexible pricing options to master AI tools at your own pace
        </p>
      </div>
    </div>

    <section class="pricing">
      <div class="container">
        <div class="pricing-grid">
          <!-- Starter Plan -->
          <div class="plan">
            <div class="plan-header">
              <h3>Starter</h3>
              <div class="price">$29<span>/month</span></div>
            </div>
            <ul class="features">
              <li>Access to basic AI prompts library</li>
              <li>5 productivity frameworks</li>
              <li>Email support</li>
              <li>Monthly group Q&A session</li>
              <li>Community forum access</li>
            </ul>
            <button class="btn btn-outline">Get Started</button>
          </div>

          <!-- Professional Plan -->
          <div class="plan featured">
            <div class="badge">Most Popular</div>
            <div class="plan-header">
              <h3>Professional</h3>
              <div class="price">$79<span>/month</span></div>
            </div>
            <ul class="features">
              <li>Everything in Starter</li>
              <li>Advanced prompt engineering course</li>
              <li>15+ productivity frameworks</li>
              <li>Weekly 1-on-1 coaching session</li>
              <li>Custom prompt development</li>
              <li>Priority support</li>
              <li>Early access to new content</li>
            </ul>
            <button class="btn btn-primary">Get Started</button>
          </div>

          <!-- Enterprise Plan -->
          <div class="plan">
            <div class="plan-header">
              <h3>Enterprise</h3>
              <div class="price">$199<span>/month</span></div>
            </div>
            <ul class="features">
              <li>Everything in Professional</li>
              <li>Team training sessions</li>
              <li>Custom AI workflow development</li>
              <li>Dedicated account manager</li>
              <li>White-label solutions</li>
              <li>API access to prompt library</li>
              <li>24/7 priority support</li>
            </ul>
            <button class="btn btn-outline">Contact Sales</button>
          </div>
        </div>

        <div class="guarantee">
          <h3>30-Day Money-Back Guarantee</h3>
          <p>
            Not satisfied? Get a full refund within 30 days, no questions asked.
          </p>
        </div>
      </div>
    </section>

    <section class="faq">
      <div class="container">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-grid">
          <div class="faq-item">
            <h4>Can I switch plans anytime?</h4>
            <p>Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          <div class="faq-item">
            <h4>Is there a free trial?</h4>
            <p>We offer a 7-day free trial for the Professional plan. No credit card required.</p>
          </div>
          <div class="faq-item">
            <h4>What payment methods do you accept?</h4>
            <p>We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
          </div>
          <div class="faq-item">
            <h4>Do you offer discounts for teams?</h4>
            <p>Yes, we offer volume discounts for teams of 5 or more. Contact sales for details.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4rem 0;
      text-align: center;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .hero-subtitle {
      font-size: 1.3rem;
      opacity: 0.9;
    }

    .pricing {
      padding: 4rem 0;
    }

    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .plan {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      position: relative;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .plan:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .plan.featured {
      border-color: #667eea;
      transform: scale(1.05);
    }

    .badge {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: #667eea;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 1rem;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .plan-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .plan-header h3 {
      font-size: 1.5rem;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .price {
      font-size: 3rem;
      font-weight: 700;
      color: #667eea;
    }

    .price span {
      font-size: 1rem;
      color: #666;
    }

    .features {
      list-style: none;
      padding: 0;
      margin-bottom: 2rem;
    }

    .features li {
      padding: 0.5rem 0;
      color: #666;
      position: relative;
      padding-left: 1.5rem;
    }

    .features li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #4caf50;
      font-weight: bold;
    }

    .btn {
      width: 100%;
      padding: 1rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      text-align: center;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
    }

    .btn-outline {
      background: transparent;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .btn-outline:hover {
      background: #667eea;
      color: white;
    }

    .guarantee {
      text-align: center;
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 1rem;
    }

    .guarantee h3 {
      color: #333;
      margin-bottom: 1rem;
    }

    .faq {
      padding: 4rem 0;
      background: #f8f9fa;
    }

    .faq h2 {
      text-align: center;
      margin-bottom: 3rem;
      font-size: 2.5rem;
      color: #333;
    }

    .faq-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .faq-item {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .faq-item h4 {
      color: #333;
      margin-bottom: 1rem;
    }

    .faq-item p {
      color: #666;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 2.2rem;
      }
      
      .pricing-grid {
        grid-template-columns: 1fr;
      }
      
      .plan.featured {
        transform: none;
      }
    }
  `]
})
export class PricingComponent implements OnInit {
  constructor(
    private metaService: MetaService,
    private structuredDataService: StructuredDataService
  ) {}

  ngOnInit(): void {
    this.metaService.setPricingPage();
    this.structuredDataService.setPricingPageData();
  }
}