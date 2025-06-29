import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetaService } from '../../services/meta.service';
import { StructuredDataService } from '../../services/structured-data.service';

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: Date;
  updatedAt?: Date;
  author: {
    name: string;
    avatar: string;
    bio: string;
  };
  category: string;
  tags: string[];
  slug: string;
  readTime: number;
  featured: boolean;
  image: string;
  seoMetadata: {
    title: string;
    description: string;
    keywords: string[];
  };
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- Blog Header -->
    <section class="blog-header">
      <div class="container">
        <div class="header-content">
          <h1 class="page-title">AI Development Insights</h1>
          <p class="page-subtitle">
            Expert tips, strategies, and real-world case studies to master AI-driven development
          </p>
          
          <!-- Blog Stats -->
          <div class="blog-stats">
            <div class="stat-item">
              <span class="stat-number">{{ posts.length }}+</span>
              <span class="stat-label">Articles</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">25k+</span>
              <span class="stat-label">Readers</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">4.9★</span>
              <span class="stat-label">Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Posts -->
    <section class="featured-posts" *ngIf="featuredPosts.length > 0">
      <div class="container">
        <h2 class="section-title">Featured Articles</h2>
        
        <div class="featured-grid">
          <article 
            class="featured-post" 
            *ngFor="let post of featuredPosts"
            [routerLink]="['/blog', post.slug]"
          >
            <div class="post-image">
              <img [src]="post.image" [alt]="post.title" loading="lazy">
              <div class="post-overlay">
                <span class="category-badge">{{ post.category }}</span>
              </div>
            </div>
            
            <div class="post-content">
              <div class="post-meta">
                <span class="author">{{ post.author.name }}</span>
                <span class="separator">•</span>
                <span class="read-time">{{ post.readTime }} min read</span>
                <span class="separator">•</span>
                <time [dateTime]="post.publishedAt.toISOString()">
                  {{ formatDate(post.publishedAt) }}
                </time>
              </div>
              
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-excerpt">{{ post.excerpt }}</p>
              
              <div class="post-tags">
                <span class="tag" *ngFor="let tag of post.tags.slice(0, 3)">
                  {{ tag }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Category Filter -->
    <section class="blog-categories">
      <div class="container">
        <div class="category-filter">
          <button 
            class="category-btn"
            [class.active]="selectedCategory === 'all'"
            (click)="filterByCategory('all')"
          >
            All Posts
          </button>
          <button 
            class="category-btn"
            *ngFor="let category of categories"
            [class.active]="selectedCategory === category"
            (click)="filterByCategory(category)"
          >
            {{ category }}
          </button>
        </div>
      </div>
    </section>

    <!-- Blog Posts Grid -->
    <section class="blog-posts">
      <div class="container">
        <div class="posts-grid">
          <article 
            class="blog-post" 
            *ngFor="let post of filteredPosts"
            [routerLink]="['/blog', post.slug]"
          >
            <div class="post-image">
              <img [src]="post.image" [alt]="post.title" loading="lazy">
              <div class="post-overlay">
                <span class="category-badge">{{ post.category }}</span>
              </div>
            </div>
            
            <div class="post-content">
              <div class="post-meta">
                <div class="author-info">
                  <img [src]="post.author.avatar" [alt]="post.author.name" class="author-avatar">
                  <span class="author-name">{{ post.author.name }}</span>
                </div>
                <div class="post-info">
                  <span class="read-time">{{ post.readTime }} min</span>
                  <span class="separator">•</span>
                  <time [dateTime]="post.publishedAt.toISOString()">
                    {{ formatDate(post.publishedAt) }}
                  </time>
                </div>
              </div>
              
              <h3 class="post-title">{{ post.title }}</h3>
              <p class="post-excerpt">{{ post.excerpt }}</p>
              
              <div class="post-footer">
                <div class="post-tags">
                  <span class="tag" *ngFor="let tag of post.tags.slice(0, 2)">
                    {{ tag }}
                  </span>
                </div>
                <div class="read-more">
                  <span class="read-more-text">Read more</span>
                  <span class="read-more-icon">→</span>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- Load More Button -->
        <div class="load-more-section" *ngIf="hasMorePosts">
          <button class="load-more-btn" (click)="loadMorePosts()" [disabled]="isLoading">
            <span *ngIf="!isLoading">Load More Articles</span>
            <span *ngIf="isLoading">
              <span class="spinner"></span>
              Loading...
            </span>
          </button>
        </div>
      </div>
    </section>

    <!-- Newsletter Signup -->
    <section class="newsletter-signup">
      <div class="container">
        <div class="signup-card">
          <div class="signup-content">
            <h2 class="signup-title">Never Miss an Insight</h2>
            <p class="signup-description">
              Get the latest AI development strategies delivered to your inbox weekly
            </p>
            
            <form class="signup-form" (ngSubmit)="onNewsletterSignup()" #newsletterForm="ngForm">
              <div class="form-group">
                <input 
                  type="email" 
                  class="email-input"
                  placeholder="your.email@company.com"
                  [(ngModel)]="newsletterEmail"
                  name="email"
                  required
                  email
                  #emailInput="ngModel"
                >
                <button type="submit" class="signup-btn" [disabled]="newsletterForm.invalid || isSubmittingNewsletter">
                  <span *ngIf="!isSubmittingNewsletter">Subscribe</span>
                  <span *ngIf="isSubmittingNewsletter">
                    <span class="spinner"></span>
                    Subscribing...
                  </span>
                </button>
              </div>
              
              <div class="form-error" *ngIf="emailInput.invalid && emailInput.touched">
                Please enter a valid email address
              </div>
              
              <p class="privacy-notice">
                <span class="privacy-icon">🔒</span>
                No spam. Unsubscribe anytime. Privacy guaranteed.
              </p>
            </form>
          </div>
          
          <div class="signup-stats">
            <div class="stat-item">
              <span class="stat-number">2,847</span>
              <span class="stat-label">Subscribers</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">4.9★</span>
              <span class="stat-label">Rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent implements OnInit {
  posts: BlogPost[] = [
    {
      id: '1',
      title: 'The 5 Critical Mistakes Developers Make with AI Prompts',
      excerpt: 'Learn the most common pitfalls that prevent developers from getting consistent, high-quality results from AI tools.',
      content: '',
      publishedAt: new Date('2024-01-15'),
      author: {
        name: 'Amy Rodriguez',
        avatar: '/assets/authors/amy-rodriguez.jpg',
        bio: 'AI Development Expert & Former Google Engineer'
      },
      category: 'Prompt Engineering',
      tags: ['Prompt Engineering', 'Best Practices', 'AI Tools'],
      slug: 'critical-mistakes-ai-prompts',
      readTime: 8,
      featured: true,
      image: '/assets/blog/ai-prompts-mistakes.jpg',
      seoMetadata: {
        title: 'The 5 Critical Mistakes Developers Make with AI Prompts - Beyond the AI Plateau',
        description: 'Avoid these common AI prompting mistakes that prevent 97% of developers from reaching their full potential.',
        keywords: ['AI prompts', 'prompt engineering', 'developer mistakes', 'AI tools']
      }
    },
    {
      id: '2',
      title: 'Building Production-Ready Code with AI: A Step-by-Step Guide',
      excerpt: 'Master the art of generating clean, maintainable, and scalable code using advanced AI techniques.',
      content: '',
      publishedAt: new Date('2024-01-10'),
      author: {
        name: 'Marcus Chen',
        avatar: '/assets/authors/marcus-chen.jpg',
        bio: 'Senior Software Architect & AI Consultant'
      },
      category: 'Code Generation',
      tags: ['Code Generation', 'Production Code', 'AI Development'],
      slug: 'production-ready-code-ai',
      readTime: 12,
      featured: true,
      image: '/assets/blog/production-code-ai.jpg',
      seoMetadata: {
        title: 'Building Production-Ready Code with AI: Complete Guide',
        description: 'Learn how to generate clean, maintainable, production-ready code using AI tools and advanced techniques.',
        keywords: ['AI code generation', 'production code', 'software development', 'AI tools']
      }
    },
    {
      id: '3',
      title: 'Context Management: The Secret to Long AI Conversations',
      excerpt: 'Discover advanced strategies for maintaining context across complex, multi-step development sessions.',
      content: '',
      publishedAt: new Date('2024-01-05'),
      author: {
        name: 'Sarah Johnson',
        avatar: '/assets/authors/sarah-johnson.jpg',
        bio: 'AI Researcher & Full-Stack Developer'
      },
      category: 'Advanced Techniques',
      tags: ['Context Management', 'AI Conversations', 'Advanced AI'],
      slug: 'context-management-ai-conversations',
      readTime: 10,
      featured: false,
      image: '/assets/blog/context-management.jpg',
      seoMetadata: {
        title: 'Context Management: The Secret to Long AI Conversations',
        description: 'Master context management techniques for complex AI development sessions and long conversations.',
        keywords: ['AI context management', 'AI conversations', 'advanced AI techniques']
      }
    },
    {
      id: '4',
      title: 'Debugging with AI: From Frustration to Flow',
      excerpt: 'Transform your debugging process with AI-powered analysis and systematic problem-solving approaches.',
      content: '',
      publishedAt: new Date('2023-12-28'),
      author: {
        name: 'Amy Rodriguez',
        avatar: '/assets/authors/amy-rodriguez.jpg',
        bio: 'AI Development Expert & Former Google Engineer'
      },
      category: 'Debugging',
      tags: ['Debugging', 'Problem Solving', 'AI Analysis'],
      slug: 'debugging-with-ai-frustration-to-flow',
      readTime: 9,
      featured: false,
      image: '/assets/blog/debugging-ai.jpg',
      seoMetadata: {
        title: 'Debugging with AI: From Frustration to Flow',
        description: 'Transform your debugging process with AI-powered analysis and systematic problem-solving techniques.',
        keywords: ['AI debugging', 'problem solving', 'debugging techniques', 'AI analysis']
      }
    }
  ];

  categories = ['Prompt Engineering', 'Code Generation', 'Advanced Techniques', 'Debugging'];
  selectedCategory = 'all';
  filteredPosts: BlogPost[] = [];
  featuredPosts: BlogPost[] = [];
  
  // Pagination
  currentPage = 1;
  postsPerPage = 6;
  hasMorePosts = true;
  isLoading = false;

  // Newsletter
  newsletterEmail = '';
  isSubmittingNewsletter = false;

  constructor(
    private metaService: MetaService,
    private structuredDataService: StructuredDataService
  ) {}

  ngOnInit(): void {
    this.setPageMetadata();
    this.initializePosts();
    this.trackPageView();
  }

  private setPageMetadata(): void {
    this.metaService.updateMetaTags({
      title: 'AI Development Blog - Beyond the AI Plateau',
      description: 'Expert insights, tips, and strategies for mastering AI-driven development. Learn from real-world case studies and proven techniques.',
      keywords: 'AI development blog, prompt engineering, AI tools, developer insights, AI strategies',
      ogTitle: 'AI Development Blog - Expert Insights & Strategies',
      ogDescription: 'Master AI-driven development with expert insights, real-world case studies, and proven strategies from industry leaders.',
      ogImage: '/assets/og/blog-page.jpg',
      twitterTitle: 'AI Development Blog - Expert Insights',
      twitterDescription: 'Master AI development with expert tips, strategies, and real-world case studies.',
      twitterImage: '/assets/twitter/blog-card.jpg'
    });

    this.structuredDataService.setBlogListingData(this.posts);
  }

  private initializePosts(): void {
    this.featuredPosts = this.posts.filter(post => post.featured);
    this.filteredPosts = this.posts.slice(0, this.postsPerPage);
    this.hasMorePosts = this.posts.length > this.postsPerPage;
  }

  private trackPageView(): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: 'Blog',
        page_location: window.location.href,
        page_path: '/blog'
      });
    }
  }

  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.currentPage = 1;

    if (category === 'all') {
      this.filteredPosts = this.posts.slice(0, this.postsPerPage);
    } else {
      const categoryPosts = this.posts.filter(post => post.category === category);
      this.filteredPosts = categoryPosts.slice(0, this.postsPerPage);
    }

    this.updatePagination();
    this.trackEvent('blog_category_filter', { category });
  }

  loadMorePosts(): void {
    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      const startIndex = this.currentPage * this.postsPerPage;
      const endIndex = startIndex + this.postsPerPage;
      
      let sourcePosts = this.selectedCategory === 'all' 
        ? this.posts 
        : this.posts.filter(post => post.category === this.selectedCategory);
      
      const newPosts = sourcePosts.slice(startIndex, endIndex);
      this.filteredPosts = [...this.filteredPosts, ...newPosts];
      
      this.currentPage++;
      this.updatePagination();
      this.isLoading = false;
      
      this.trackEvent('blog_load_more', { page: this.currentPage });
    }, 1000);
  }

  private updatePagination(): void {
    const totalPosts = this.selectedCategory === 'all' 
      ? this.posts.length 
      : this.posts.filter(post => post.category === this.selectedCategory).length;
    
    this.hasMorePosts = this.filteredPosts.length < totalPosts;
  }

  async onNewsletterSignup(): Promise<void> {
    if (!this.newsletterEmail) return;

    this.isSubmittingNewsletter = true;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.trackConversion('newsletter_signup', {
        source: 'blog_page',
        email: this.newsletterEmail
      });

      // Reset form
      this.newsletterEmail = '';
      
      // Show success message (in real app, show toast or modal)
      alert('Thanks for subscribing! Check your email for confirmation.');
      
    } catch (error) {
      // Show error message
      alert('Something went wrong. Please try again.');
    } finally {
      this.isSubmittingNewsletter = false;
    }
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
        event_label: 'blog'
      });
    }
  }
}