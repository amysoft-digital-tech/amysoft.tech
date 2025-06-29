import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';
import { StructuredDataService } from '../../services/structured-data.service';

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  credentials: string[];
  experience: string;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

export interface CaseStudy {
  id: string;
  title: string;
  client: string;
  industry: string;
  challenge: string;
  solution: string;
  results: {
    metric: string;
    improvement: string;
    timeline: string;
  }[];
  testimonial: {
    quote: string;
    author: string;
    title: string;
    company: string;
    avatar: string;
  };
  featured: boolean;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero Section -->
    <section class="about-hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">Beyond the AI Plateau</h1>
          <p class="hero-subtitle">
            Empowering developers to master AI-driven development through proven methodologies and expert guidance
          </p>
          
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">1,247+</span>
              <span class="stat-label">Developers Trained</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">300%</span>
              <span class="stat-label">Avg. Productivity Increase</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">97%</span>
              <span class="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Our Story Section -->
    <section class="our-story">
      <div class="container">
        <div class="story-grid">
          <div class="story-content">
            <h2 class="section-title">Our Story</h2>
            <p class="story-text">
              Beyond the AI Plateau was born from a critical observation: while 97% of developers 
              have experimented with AI tools, less than 3% have mastered them to achieve 
              transformational productivity gains.
            </p>
            <p class="story-text">
              Founded by former Google AI engineers who witnessed this gap firsthand, our platform 
              bridges the chasm between basic AI usage and elite-level mastery through systematic, 
              battle-tested methodologies.
            </p>
            
            <div class="founding-principles">
              <h3 class="principles-title">Our Founding Principles</h3>
              <div class="principles-list">
                <div class="principle-item">
                  <span class="principle-icon">🎯</span>
                  <span class="principle-text">Results-driven learning with measurable outcomes</span>
                </div>
                <div class="principle-item">
                  <span class="principle-icon">⚡</span>
                  <span class="principle-text">Practical techniques you can implement immediately</span>
                </div>
                <div class="principle-item">
                  <span class="principle-icon">🧠</span>
                  <span class="principle-text">Deep understanding, not surface-level tricks</span>
                </div>
                <div class="principle-item">
                  <span class="principle-icon">🏆</span>
                  <span class="principle-text">Elite-level strategies from industry leaders</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="story-visual">
            <div class="growth-chart">
              <h4 class="chart-title">Developer Success Trajectory</h4>
              <div class="chart-content">
                <div class="chart-line">
                  <div class="milestone" data-stage="1">
                    <span class="milestone-number">1</span>
                    <span class="milestone-label">AI Basics</span>
                    <span class="milestone-percentage">97% of developers</span>
                  </div>
                  <div class="milestone" data-stage="2">
                    <span class="milestone-number">2</span>
                    <span class="milestone-label">Structured Learning</span>
                    <span class="milestone-percentage">25% reach here</span>
                  </div>
                  <div class="milestone elite" data-stage="3">
                    <span class="milestone-number">3</span>
                    <span class="milestone-label">Elite Mastery</span>
                    <span class="milestone-percentage">3% achieve this</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="team-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Meet Our Expert Team</h2>
          <p class="section-subtitle">
            Industry veterans with decades of combined experience in AI and software development
          </p>
        </div>
        
        <div class="team-grid">
          <div class="team-member" *ngFor="let member of teamMembers">
            <div class="member-image">
              <img [src]="member.avatar" [alt]="member.name" loading="lazy">
              <div class="member-overlay">
                <div class="social-links">
                  <a [href]="member.socialLinks.linkedin" *ngIf="member.socialLinks.linkedin" target="_blank" rel="noopener">
                    <span class="social-icon">💼</span>
                  </a>
                  <a [href]="member.socialLinks.twitter" *ngIf="member.socialLinks.twitter" target="_blank" rel="noopener">
                    <span class="social-icon">🐦</span>
                  </a>
                  <a [href]="member.socialLinks.github" *ngIf="member.socialLinks.github" target="_blank" rel="noopener">
                    <span class="social-icon">⚡</span>
                  </a>
                </div>
              </div>
            </div>
            
            <div class="member-content">
              <h3 class="member-name">{{ member.name }}</h3>
              <p class="member-title">{{ member.title }}</p>
              <p class="member-experience">{{ member.experience }}</p>
              <p class="member-bio">{{ member.bio }}</p>
              
              <div class="member-credentials">
                <span class="credential" *ngFor="let credential of member.credentials">
                  {{ credential }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Case Studies Section -->
    <section class="case-studies">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Proven Results</h2>
          <p class="section-subtitle">
            Real transformations from developers who've mastered our methodologies
          </p>
        </div>
        
        <div class="case-studies-grid">
          <div class="case-study" *ngFor="let study of caseStudies" [class.featured]="study.featured">
            <div class="case-header">
              <div class="case-meta">
                <span class="industry-tag">{{ study.industry }}</span>
                <span class="client-name">{{ study.client }}</span>
              </div>
              <h3 class="case-title">{{ study.title }}</h3>
            </div>
            
            <div class="case-content">
              <div class="case-section">
                <h4 class="section-label">Challenge</h4>
                <p class="section-text">{{ study.challenge }}</p>
              </div>
              
              <div class="case-section">
                <h4 class="section-label">Solution</h4>
                <p class="section-text">{{ study.solution }}</p>
              </div>
              
              <div class="case-results">
                <h4 class="section-label">Results</h4>
                <div class="results-grid">
                  <div class="result-item" *ngFor="let result of study.results">
                    <span class="result-metric">{{ result.metric }}</span>
                    <span class="result-improvement">{{ result.improvement }}</span>
                    <span class="result-timeline">{{ result.timeline }}</span>
                  </div>
                </div>
              </div>
              
              <div class="case-testimonial">
                <blockquote class="testimonial-quote">
                  "{{ study.testimonial.quote }}"
                </blockquote>
                <div class="testimonial-author">
                  <img [src]="study.testimonial.avatar" [alt]="study.testimonial.author" class="author-avatar">
                  <div class="author-info">
                    <span class="author-name">{{ study.testimonial.author }}</span>
                    <span class="author-title">{{ study.testimonial.title }}</span>
                    <span class="author-company">{{ study.testimonial.company }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission & Values -->
    <section class="mission-values">
      <div class="container">
        <div class="mission-content">
          <div class="mission-section">
            <h2 class="section-title">Our Mission</h2>
            <p class="mission-text">
              To bridge the AI mastery gap by providing systematic, proven methodologies that transform 
              developers from AI novices to elite practitioners who can harness artificial intelligence 
              for unprecedented productivity and innovation.
            </p>
          </div>
          
          <div class="values-section">
            <h2 class="section-title">Core Values</h2>
            <div class="values-grid">
              <div class="value-card">
                <div class="value-icon">🎯</div>
                <h3 class="value-title">Excellence</h3>
                <p class="value-description">
                  We deliver only the highest quality content, vetted by industry experts and proven in real-world applications.
                </p>
              </div>
              
              <div class="value-card">
                <div class="value-icon">🔬</div>
                <h3 class="value-title">Evidence-Based</h3>
                <p class="value-description">
                  Every technique is backed by data, case studies, and measurable outcomes from successful implementations.
                </p>
              </div>
              
              <div class="value-card">
                <div class="value-icon">⚡</div>
                <h3 class="value-title">Practical Impact</h3>
                <p class="value-description">
                  We focus on strategies that deliver immediate, tangible improvements to your development workflow.
                </p>
              </div>
              
              <div class="value-card">
                <div class="value-icon">🤝</div>
                <h3 class="value-title">Community</h3>
                <p class="value-description">
                  Learning is amplified through collaboration with like-minded professionals pursuing AI mastery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="about-cta">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">Ready to Join the Elite 3%?</h2>
          <p class="cta-description">
            Don't remain stuck at the AI plateau. Transform your development workflow with proven methodologies.
          </p>
          
          <div class="cta-actions">
            <a routerLink="/" class="cta-button primary">
              <span class="button-text">Start Your Journey</span>
              <span class="button-icon">🚀</span>
            </a>
            <a routerLink="/blog" class="cta-button secondary">
              <span class="button-text">Read Our Insights</span>
              <span class="button-icon">📖</span>
            </a>
          </div>
          
          <div class="cta-guarantee">
            <span class="guarantee-icon">🛡️</span>
            <span class="guarantee-text">30-day money-back guarantee • Join 1,247+ successful developers</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  teamMembers: TeamMember[] = [
    {
      id: 'amy-rodriguez',
      name: 'Amy Rodriguez',
      title: 'Founder & Lead AI Strategist',
      bio: 'Former Google AI engineer with 8+ years developing production AI systems. Specialized in prompt engineering and AI workflow optimization.',
      avatar: '/assets/team/amy-rodriguez.jpg',
      credentials: ['Former Google AI', 'Stanford CS', 'AI Research'],
      experience: '8+ years in AI development',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/amy-rodriguez-ai',
        twitter: 'https://twitter.com/amy_ai_dev',
        github: 'https://github.com/amy-rodriguez'
      }
    },
    {
      id: 'marcus-chen',
      name: 'Marcus Chen',
      title: 'Senior AI Development Consultant',
      bio: 'Software architect who has led AI integration projects for Fortune 500 companies. Expert in production-ready AI implementations.',
      avatar: '/assets/team/marcus-chen.jpg',
      credentials: ['Microsoft AI', 'MIT EECS', 'Enterprise AI'],
      experience: '10+ years in software architecture',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/marcus-chen-ai',
        github: 'https://github.com/marcus-chen'
      }
    },
    {
      id: 'sarah-johnson',
      name: 'Dr. Sarah Johnson',
      title: 'AI Research Director',
      bio: 'PhD in Machine Learning with published research on AI-human collaboration. Focuses on optimizing developer-AI interactions.',
      avatar: '/assets/team/sarah-johnson.jpg',
      credentials: ['PhD ML', 'Published Researcher', 'AI Ethics'],
      experience: '12+ years in AI research',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/dr-sarah-johnson',
        twitter: 'https://twitter.com/sarahj_ai'
      }
    }
  ];

  caseStudies: CaseStudy[] = [
    {
      id: 'fintech-transformation',
      title: 'FinTech Startup Scales Development 5x',
      client: 'PayFlow Technologies',
      industry: 'FinTech',
      challenge: 'Small development team struggling to keep up with feature demands while maintaining code quality and security standards.',
      solution: 'Implemented our Advanced Code Generation and Context Management methodologies, with custom AI workflows for financial compliance.',
      results: [
        {
          metric: 'Development Speed',
          improvement: '5x faster',
          timeline: '3 months'
        },
        {
          metric: 'Code Quality',
          improvement: '40% fewer bugs',
          timeline: '2 months'
        },
        {
          metric: 'Team Productivity',
          improvement: '300% increase',
          timeline: '4 months'
        }
      ],
      testimonial: {
        quote: 'The Elite Principles didn\'t just improve our coding speed—they transformed our entire development culture. We went from struggling to meet deadlines to exceeding them consistently.',
        author: 'David Park',
        title: 'CTO',
        company: 'PayFlow Technologies',
        avatar: '/assets/testimonials/david-park.jpg'
      },
      featured: true
    },
    {
      id: 'enterprise-migration',
      title: 'Enterprise Modernizes Legacy Systems',
      client: 'MegaCorp Industries',
      industry: 'Manufacturing',
      challenge: 'Legacy codebase modernization with tight timelines and zero tolerance for system downtime.',
      solution: 'Applied Strategic Prompting and Debugging methodologies for safe, incremental migration with AI-powered analysis.',
      results: [
        {
          metric: 'Migration Time',
          improvement: '60% reduction',
          timeline: '6 months'
        },
        {
          metric: 'System Downtime',
          improvement: '0 incidents',
          timeline: 'ongoing'
        },
        {
          metric: 'Developer Confidence',
          improvement: '95% satisfaction',
          timeline: '1 month'
        }
      ],
      testimonial: {
        quote: 'What seemed impossible became manageable. The systematic approach to AI-assisted development gave us confidence to tackle our most complex legacy challenges.',
        author: 'Jennifer Liu',
        title: 'Engineering Director',
        company: 'MegaCorp Industries',
        avatar: '/assets/testimonials/jennifer-liu.jpg'
      },
      featured: false
    }
  ];

  constructor(
    private metaService: MetaService,
    private structuredDataService: StructuredDataService
  ) {}

  ngOnInit(): void {
    this.setPageMetadata();
    this.trackPageView();
  }

  private setPageMetadata(): void {
    this.metaService.updateMetaTags({
      title: 'About Beyond the AI Plateau - Expert AI Development Training',
      description: 'Learn about our mission to help developers master AI-driven development. Meet our expert team and see proven results from our methodologies.',
      keywords: 'AI development experts, AI training team, AI development case studies, expert AI guidance',
      ogTitle: 'About Beyond the AI Plateau - Expert AI Development Training',
      ogDescription: 'Meet the expert team behind Beyond the AI Plateau and discover proven results from developers who\'ve mastered AI-driven development.',
      ogImage: '/assets/og/about-page.jpg',
      twitterTitle: 'About Beyond the AI Plateau - Expert Team',
      twitterDescription: 'Expert AI development training with proven results. Meet our team of former Google AI engineers.',
      twitterImage: '/assets/twitter/about-card.jpg'
    });

    this.structuredDataService.setAboutPageData(this.teamMembers);
  }

  private trackPageView(): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: 'About',
        page_location: window.location.href,
        page_path: '/about'
      });
    }
  }
}