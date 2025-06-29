import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="hero-section">
      <div class="container">
        <h1>About Beyond the AI Plateau</h1>
        <p class="hero-subtitle">
          Our Mission: Empowering Professionals to Master AI Tools
        </p>
      </div>
    </div>

    <section class="content">
      <div class="container">
        <div class="story">
          <h2>Our Story</h2>
          <p>
            Beyond the AI Plateau was born from a simple observation: most professionals 
            hit a productivity wall when working with AI tools. They know the basics, 
            but struggle to unlock the true potential of artificial intelligence.
          </p>
          <p>
            We created this platform to bridge that gap, providing expert-guided learning 
            that transforms how you work with AI, helping you break through barriers and 
            achieve unprecedented productivity levels.
          </p>
        </div>

        <div class="mission">
          <h2>Our Mission</h2>
          <p>
            To democratize advanced AI knowledge and empower professionals with the 
            skills, frameworks, and confidence needed to harness artificial intelligence 
            for maximum impact.
          </p>
        </div>

        <div class="values">
          <h2>Our Values</h2>
          <div class="values-grid">
            <div class="value">
              <h3>Expert Knowledge</h3>
              <p>All content is created by AI specialists with real-world experience.</p>
            </div>
            <div class="value">
              <h3>Practical Focus</h3>
              <p>Every lesson includes actionable takeaways you can implement immediately.</p>
            </div>
            <div class="value">
              <h3>Continuous Innovation</h3>
              <p>We stay ahead of AI trends to keep your skills cutting-edge.</p>
            </div>
            <div class="value">
              <h3>Community-Driven</h3>
              <p>Learn alongside other professionals in our supportive community.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="cta-section">
      <div class="container">
        <h2>Ready to Start Your Journey?</h2>
        <p>Join thousands of professionals mastering AI tools and techniques.</p>
        <a routerLink="/pricing" class="btn btn-primary">Get Started Today</a>
      </div>
    </section>
  `,
  styles: [`
    .hero-section {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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

    .content {
      padding: 4rem 0;
    }

    .story, .mission, .values {
      margin-bottom: 4rem;
    }

    h2 {
      font-size: 2.5rem;
      color: #333;
      margin-bottom: 2rem;
      text-align: center;
    }

    p {
      font-size: 1.1rem;
      line-height: 1.7;
      color: #666;
      margin-bottom: 1.5rem;
    }

    .values-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .value {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 0.5rem;
      text-align: center;
    }

    .value h3 {
      color: #4facfe;
      margin-bottom: 1rem;
      font-size: 1.3rem;
    }

    .value p {
      margin-bottom: 0;
      font-size: 1rem;
    }

    .cta-section {
      background: #4facfe;
      color: white;
      padding: 4rem 0;
      text-align: center;
    }

    .cta-section h2 {
      color: white;
      margin-bottom: 1rem;
    }

    .cta-section p {
      color: white;
      opacity: 0.9;
      margin-bottom: 2rem;
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

    @media (max-width: 768px) {
      h1 {
        font-size: 2.2rem;
      }
      
      h2 {
        font-size: 2rem;
      }
      
      .values-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AboutComponent implements OnInit {
  constructor(private metaService: MetaService) {}

  ngOnInit(): void {
    this.metaService.setAboutPage();
  }
}