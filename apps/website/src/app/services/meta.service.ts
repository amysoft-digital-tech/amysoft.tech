import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  siteName?: string;
  locale?: string;
  alternateLocales?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;
  jsonLd?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MetaService {
  private readonly defaultConfig: SEOConfig = {
    siteName: 'Beyond the AI Plateau',
    type: 'website',
    locale: 'en_US',
    twitterCard: 'summary_large_image',
    twitterSite: '@amysofttech',
    author: 'Amy Soft Digital Tech'
  };

  constructor(
    private meta: Meta,
    private title: Title,
    @Inject(DOCUMENT) private document: Document
  ) {}

  updateSEO(config: SEOConfig): void {
    const fullConfig = { ...this.defaultConfig, ...config };
    
    // Update title
    if (fullConfig.title) {
      this.title.setTitle(fullConfig.title);
      this.updateMetaTag('og:title', fullConfig.title);
      this.updateMetaTag('twitter:title', fullConfig.title);
    }

    // Update description
    if (fullConfig.description) {
      this.updateMetaTag('description', fullConfig.description);
      this.updateMetaTag('og:description', fullConfig.description);
      this.updateMetaTag('twitter:description', fullConfig.description);
    }

    // Update keywords
    if (fullConfig.keywords) {
      this.updateMetaTag('keywords', fullConfig.keywords);
    }

    // Update image
    if (fullConfig.image) {
      this.updateMetaTag('og:image', fullConfig.image);
      this.updateMetaTag('twitter:image', fullConfig.image);
    }

    // Update URL
    if (fullConfig.url) {
      this.updateMetaTag('og:url', fullConfig.url);
      this.updateLinkTag('canonical', fullConfig.url);
    }

    // Update Open Graph meta tags
    this.updateMetaTag('og:type', fullConfig.type || 'website');
    this.updateMetaTag('og:site_name', fullConfig.siteName!);
    this.updateMetaTag('og:locale', fullConfig.locale!);

    // Update article-specific meta tags
    if (fullConfig.publishedTime) {
      this.updateMetaTag('article:published_time', fullConfig.publishedTime);
    }
    if (fullConfig.modifiedTime) {
      this.updateMetaTag('article:modified_time', fullConfig.modifiedTime);
    }
    if (fullConfig.section) {
      this.updateMetaTag('article:section', fullConfig.section);
    }
    if (fullConfig.tags) {
      fullConfig.tags.forEach(tag => {
        this.meta.addTag({ property: 'article:tag', content: tag });
      });
    }

    // Update Twitter Card meta tags
    this.updateMetaTag('twitter:card', fullConfig.twitterCard!);
    if (fullConfig.twitterSite) {
      this.updateMetaTag('twitter:site', fullConfig.twitterSite);
    }
    if (fullConfig.twitterCreator) {
      this.updateMetaTag('twitter:creator', fullConfig.twitterCreator);
    }

    // Update author
    if (fullConfig.author) {
      this.updateMetaTag('author', fullConfig.author);
    }

    // Update alternate locales
    if (fullConfig.alternateLocales) {
      fullConfig.alternateLocales.forEach(locale => {
        this.updateMetaTag('og:locale:alternate', locale);
      });
    }

    // Add JSON-LD structured data
    if (fullConfig.jsonLd) {
      this.updateJsonLd(fullConfig.jsonLd);
    }
  }

  private updateMetaTag(name: string, content: string): void {
    const isProperty = name.startsWith('og:') || name.startsWith('article:');
    const attribute = isProperty ? 'property' : 'name';
    
    if (this.meta.getTag(`${attribute}="${name}"`)) {
      this.meta.updateTag({ [attribute]: name, content });
    } else {
      this.meta.addTag({ [attribute]: name, content });
    }
  }

  private updateLinkTag(rel: string, href: string): void {
    // Remove existing canonical link
    const existingLink = this.document.querySelector(`link[rel="${rel}"]`);
    if (existingLink) {
      existingLink.remove();
    }

    // Add new canonical link
    const link = this.document.createElement('link');
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    this.document.head.appendChild(link);
  }

  private updateJsonLd(data: any): void {
    // Remove existing JSON-LD
    const existingScript = this.document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new JSON-LD
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  // Predefined SEO configurations for common pages
  setHomePage(): void {
    this.updateSEO({
      title: 'Beyond the AI Plateau - Master AI Tools & Prompts',
      description: 'Discover advanced AI prompting techniques and tools to breakthrough productivity plateaus. Expert-guided learning platform for AI mastery.',
      keywords: 'AI prompts, artificial intelligence, productivity, AI tools, prompt engineering, machine learning, ChatGPT prompts',
      url: 'https://www.amysoft.tech',
      type: 'website',
      image: 'https://www.amysoft.tech/assets/images/og-home.jpg',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Beyond the AI Plateau',
        'description': 'Master AI Tools & Prompts',
        'url': 'https://www.amysoft.tech',
        'publisher': {
          '@type': 'Organization',
          'name': 'Amy Soft Digital Tech',
          'logo': {
            '@type': 'ImageObject',
            'url': 'https://www.amysoft.tech/assets/images/logo.png'
          }
        }
      }
    });
  }

  setAboutPage(): void {
    this.updateSEO({
      title: 'About - Beyond the AI Plateau',
      description: 'Learn about our mission to help professionals master AI tools and break through productivity barriers with expert guidance.',
      keywords: 'about, AI education, prompt engineering training, productivity coaching',
      url: 'https://www.amysoft.tech/about',
      type: 'article'
    });
  }

  setPricingPage(): void {
    this.updateSEO({
      title: 'Pricing - Beyond the AI Plateau',
      description: 'Choose the perfect plan to master AI prompts and tools. Flexible pricing options for individuals and teams.',
      keywords: 'pricing, AI training cost, prompt engineering course price, subscription plans',
      url: 'https://www.amysoft.tech/pricing',
      type: 'article'
    });
  }

  setContactPage(): void {
    this.updateSEO({
      title: 'Contact Us - Beyond the AI Plateau',
      description: 'Get in touch with our team for questions about AI training, custom solutions, or partnership opportunities.',
      keywords: 'contact, support, AI consulting, customer service',
      url: 'https://www.amysoft.tech/contact',
      type: 'article'
    });
  }

  setBlogPage(): void {
    this.updateSEO({
      title: 'Blog - Beyond the AI Plateau',
      description: 'Latest insights, tips, and tutorials on AI prompting, productivity tools, and breakthrough techniques.',
      keywords: 'AI blog, prompt engineering tips, productivity articles, AI tutorials',
      url: 'https://www.amysoft.tech/blog',
      type: 'blog'
    });
  }
}