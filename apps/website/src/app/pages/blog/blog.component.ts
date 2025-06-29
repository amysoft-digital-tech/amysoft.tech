import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MetaService } from '../../services/meta.service';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  tags: string[];
  slug: string;
}

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="hero-section">
      <div class="container">
        <h1>AI Insights & Tips</h1>
        <p class="hero-subtitle">
          Latest strategies, tutorials, and insights on mastering AI tools
        </p>
      </div>
    </div>

    <section class="blog">
      <div class="container">
        <div class="blog-grid">
          <article class="blog-post" *ngFor="let post of blogPosts">
            <div class="post-header">
              <div class="post-meta">
                <span class="author">{{ post.author }}</span>
                <span class="date">{{ post.date }}</span>
                <span class="read-time">{{ post.readTime }} read</span>
              </div>
              <h2>{{ post.title }}</h2>
              <p class="excerpt">{{ post.excerpt }}</p>
            </div>
            <div class="post-footer">
              <div class="tags">
                <span class="tag" *ngFor="let tag of post.tags">{{ tag }}</span>
              </div>
              <a [href]="'/blog/' + post.slug" class="read-more">Read More →</a>
            </div>
          </article>
        </div>

        <div class="newsletter">
          <h2>Stay Updated</h2>
          <p>Get the latest AI tips and insights delivered to your inbox weekly.</p>
          <form class="newsletter-form">
            <input type="email" placeholder="Enter your email" required>
            <button type="submit" class="btn btn-primary">Subscribe</button>
          </form>
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

    .blog {
      padding: 4rem 0;
    }

    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2rem;
      margin-bottom: 4rem;
    }

    .blog-post {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .blog-post:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .post-header {
      flex: 1;
    }

    .post-meta {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #666;
    }

    .post-meta span {
      position: relative;
    }

    .post-meta span:not(:last-child)::after {
      content: '•';
      position: absolute;
      right: -0.5rem;
      color: #ccc;
    }

    .blog-post h2 {
      font-size: 1.5rem;
      color: #333;
      margin-bottom: 1rem;
      line-height: 1.3;
    }

    .excerpt {
      color: #666;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }

    .post-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid #eee;
    }

    .tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tag {
      background: #f0f0f0;
      color: #666;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.8rem;
    }

    .read-more {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .read-more:hover {
      color: #5a67d8;
    }

    .newsletter {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem;
      border-radius: 1rem;
      text-align: center;
    }

    .newsletter h2 {
      margin-bottom: 1rem;
      font-size: 2rem;
    }

    .newsletter p {
      margin-bottom: 2rem;
      opacity: 0.9;
      font-size: 1.1rem;
    }

    .newsletter-form {
      display: flex;
      gap: 1rem;
      max-width: 400px;
      margin: 0 auto;
    }

    .newsletter-form input {
      flex: 1;
      padding: 0.75rem;
      border: none;
      border-radius: 0.5rem;
      font-size: 1rem;
    }

    .newsletter-form input:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      text-decoration: none;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 1rem;
      white-space: nowrap;
    }

    .btn-primary {
      background: #ff6b6b;
      color: white;
    }

    .btn-primary:hover {
      background: #ff5252;
    }

    @media (max-width: 768px) {
      h1 {
        font-size: 2.2rem;
      }
      
      .blog-grid {
        grid-template-columns: 1fr;
      }
      
      .newsletter-form {
        flex-direction: column;
      }
      
      .newsletter-form input,
      .newsletter-form button {
        width: 100%;
      }
    }
  `]
})
export class BlogComponent implements OnInit {
  constructor(private metaService: MetaService) {}

  blogPosts: BlogPost[] = [
    {
      id: 1,
      title: '10 Advanced ChatGPT Prompts That Will Transform Your Productivity',
      excerpt: 'Discover powerful prompt patterns that go beyond basic questions. Learn how to structure complex requests that deliver exceptional results.',
      author: 'Sarah Chen',
      date: 'Dec 15, 2024',
      readTime: '5 min',
      tags: ['ChatGPT', 'Prompts', 'Productivity'],
      slug: 'advanced-chatgpt-prompts-productivity'
    },
    {
      id: 2,
      title: 'The Art of Prompt Chaining: Building Complex AI Workflows',
      excerpt: 'Master the technique of connecting multiple AI interactions to solve complex problems step by step.',
      author: 'Michael Rodriguez',
      date: 'Dec 12, 2024',
      readTime: '7 min',
      tags: ['Prompt Engineering', 'Workflows', 'Advanced'],
      slug: 'prompt-chaining-ai-workflows'
    },
    {
      id: 3,
      title: 'AI Tools Comparison: Claude vs ChatGPT vs Gemini',
      excerpt: 'A comprehensive comparison of the leading AI assistants and when to use each one for maximum effectiveness.',
      author: 'Emma Watson',
      date: 'Dec 10, 2024',
      readTime: '6 min',
      tags: ['AI Tools', 'Comparison', 'Review'],
      slug: 'ai-tools-comparison-claude-chatgpt-gemini'
    },
    {
      id: 4,
      title: 'Building Your Personal AI Assistant: Custom GPTs Guide',
      excerpt: 'Step-by-step tutorial on creating specialized AI assistants tailored to your specific needs and workflows.',
      author: 'David Kim',
      date: 'Dec 8, 2024',
      readTime: '8 min',
      tags: ['Custom GPTs', 'Tutorial', 'Automation'],
      slug: 'building-personal-ai-assistant-custom-gpts'
    },
    {
      id: 5,
      title: 'The Psychology of Effective AI Communication',
      excerpt: 'Understanding how to communicate with AI systems to get better results through psychological principles.',
      author: 'Dr. Lisa Parker',
      date: 'Dec 5, 2024',
      readTime: '4 min',
      tags: ['Psychology', 'Communication', 'Tips'],
      slug: 'psychology-effective-ai-communication'
    },
    {
      id: 6,
      title: 'AI for Content Creation: From Ideas to Publication',
      excerpt: 'Complete workflow for using AI tools throughout the content creation process, from brainstorming to final edits.',
      author: 'Alex Johnson',
      date: 'Dec 3, 2024',
      readTime: '9 min',
      tags: ['Content Creation', 'Writing', 'Process'],
      slug: 'ai-content-creation-workflow'
    }
  ];

  ngOnInit(): void {
    this.metaService.setBlogPage();
  }
}