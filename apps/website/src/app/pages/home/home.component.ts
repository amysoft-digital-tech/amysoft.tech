import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';
import { StructuredDataService } from '../../services/structured-data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="hero-section">
      <div class="container">
        <h1>Beyond the AI Plateau</h1>
        <p class="hero-subtitle">
          Master AI Tools & Prompts to Breakthrough Productivity Barriers
        </p>
        <p class="hero-description">
          Discover advanced AI prompting techniques, productivity frameworks, and expert-guided 
          learning to unlock your full potential with artificial intelligence.
        </p>
        <div class="cta-buttons">
          <a routerLink="/pricing" class="btn btn-primary">Get Started</a>
          <a routerLink="/about" class="btn btn-secondary">Learn More</a>
        </div>
      </div>
    </div>

    <section class="features">
      <div class="container">
        <h2>Why Choose Beyond the AI Plateau?</h2>
        <div class="features-grid">
          <div class="feature">
            <h3>Expert-Guided Learning</h3>
            <p>Learn from AI specialists with proven track records in prompt engineering and productivity optimization.</p>
          </div>
          <div class="feature">
            <h3>Practical Frameworks</h3>
            <p>Get actionable prompts, templates, and frameworks you can implement immediately in your workflow.</p>
          </div>
          <div class="feature">
            <h3>Continuous Updates</h3>
            <p>Stay ahead with regular content updates covering the latest AI tools and techniques.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="testimonials">
      <div class="container">
        <h2>What Our Users Say</h2>
        <div class="testimonials-grid">
          <blockquote>
            "This platform transformed how I work with AI. My productivity increased by 300%."
            <cite>- Sarah Johnson, Marketing Director</cite>
          </blockquote>
          <blockquote>
            "The prompt engineering techniques are game-changing. Highly recommended!"
            <cite>- Michael Chen, Software Engineer</cite>
          </blockquote>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <h2>Ready to Break Through Your AI Plateau?</h2>
        <p>Join thousands of professionals who've already transformed their productivity.</p>
        <a routerLink="/pricing" class="btn btn-primary">Start Your Journey</a>
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
      font-size: 3.5rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .hero-subtitle {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    }

    .hero-description {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.8;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.75rem 2rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .btn-primary {
      background: #ff6b6b;
      color: white;
    }

    .btn-primary:hover {
      background: #ff5252;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: transparent;
      color: white;
      border: 2px solid white;
    }

    .btn-secondary:hover {
      background: white;
      color: #667eea;
    }

    .features, .testimonials, .cta-section {
      padding: 4rem 0;
    }

    .features {
      background: #f8f9fa;
    }

    .features h2, .testimonials h2, .cta-section h2 {
      text-align: center;
      margin-bottom: 3rem;
      font-size: 2.5rem;
      color: #333;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }

    .feature {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .feature h3 {
      color: #667eea;
      margin-bottom: 1rem;
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 2rem;
    }

    blockquote {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
    }

    cite {
      display: block;
      margin-top: 1rem;
      font-style: normal;
      color: #666;
    }

    .cta-section {
      background: #667eea;
      color: white;
      text-align: center;
    }

    .cta-section .btn-primary {
      background: #ff6b6b;
      margin-top: 1rem;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 2.5rem;
      }
      
      .hero-subtitle {
        font-size: 1.2rem;
      }
      
      .cta-buttons {
        flex-direction: column;
        align-items: center;
      }
      
      .btn {
        width: 200px;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  constructor(
    private metaService: MetaService,
    private structuredDataService: StructuredDataService
  ) {}

  ngOnInit(): void {
    this.metaService.setHomePage();
    this.structuredDataService.setHomePageData();
  }
}