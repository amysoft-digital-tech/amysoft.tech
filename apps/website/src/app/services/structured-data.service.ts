import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export interface Organization {
  '@type': 'Organization';
  name: string;
  url: string;
  logo: {
    '@type': 'ImageObject';
    url: string;
  };
  sameAs?: string[];
  address?: {
    '@type': 'PostalAddress';
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone?: string;
    contactType: string;
    email?: string;
  };
}

export interface WebSite {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  publisher: Organization;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

export interface Article {
  '@type': 'Article';
  headline: string;
  description: string;
  author: {
    '@type': 'Person';
    name: string;
  };
  publisher: Organization;
  datePublished: string;
  dateModified?: string;
  image?: {
    '@type': 'ImageObject';
    url: string;
    width?: number;
    height?: number;
  };
  articleSection?: string;
  keywords?: string[];
  wordCount?: number;
  url: string;
}

export interface Product {
  '@type': 'Product';
  name: string;
  description: string;
  brand: Organization;
  category: string;
  image?: string;
  offers: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
    validFrom?: string;
    validThrough?: string;
    url: string;
  }[];
}

export interface Course {
  '@type': 'Course';
  name: string;
  description: string;
  provider: Organization;
  courseCode?: string;
  educationalLevel?: string;
  teaches?: string[];
  audience?: {
    '@type': 'EducationalAudience';
    educationalRole: string;
  };
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability: string;
    url: string;
  };
}

export interface FAQPage {
  '@type': 'FAQPage';
  mainEntity: {
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class StructuredDataService {
  private readonly baseOrganization: Organization = {
    '@type': 'Organization',
    name: 'Amy Soft Digital Tech',
    url: 'https://www.amysoft.tech',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.amysoft.tech/assets/images/logo.png'
    },
    sameAs: [
      'https://twitter.com/amysofttech',
      'https://linkedin.com/company/amysoft-digital-tech'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'hello@amysoft.tech'
    }
  };

  constructor(@Inject(DOCUMENT) private document: Document) {}

  private addStructuredData(data: any): void {
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      ...data
    });
    this.document.head.appendChild(script);
  }

  private removeExistingStructuredData(): void {
    const existingScripts = this.document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
  }

  setWebSiteData(): void {
    this.removeExistingStructuredData();
    
    const webSite: WebSite = {
      '@type': 'WebSite',
      name: 'Beyond the AI Plateau',
      url: 'https://www.amysoft.tech',
      description: 'Master AI Tools & Prompts to Breakthrough Productivity Barriers',
      publisher: this.baseOrganization,
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://www.amysoft.tech/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    };

    this.addStructuredData(webSite);
    this.addStructuredData(this.baseOrganization);
  }

  setArticleData(article: Partial<Article>): void {
    this.removeExistingStructuredData();
    
    const fullArticle: Article = {
      '@type': 'Article',
      headline: article.headline || '',
      description: article.description || '',
      author: article.author || { '@type': 'Person', name: 'Amy Soft Digital Tech' },
      publisher: this.baseOrganization,
      datePublished: article.datePublished || new Date().toISOString(),
      dateModified: article.dateModified || new Date().toISOString(),
      url: article.url || '',
      ...article
    };

    this.addStructuredData(fullArticle);
  }

  setProductData(products: Partial<Product>[]): void {
    this.removeExistingStructuredData();
    
    products.forEach(product => {
      const fullProduct: Product = {
        '@type': 'Product',
        name: product.name || '',
        description: product.description || '',
        brand: this.baseOrganization,
        category: product.category || 'Education',
        offers: product.offers || [],
        ...product
      };
      
      this.addStructuredData(fullProduct);
    });
  }

  setCourseData(courses: Partial<Course>[]): void {
    this.removeExistingStructuredData();
    
    courses.forEach(course => {
      const fullCourse: Course = {
        '@type': 'Course',
        name: course.name || '',
        description: course.description || '',
        provider: this.baseOrganization,
        audience: {
          '@type': 'EducationalAudience',
          educationalRole: 'professional'
        },
        ...course
      };
      
      this.addStructuredData(fullCourse);
    });
  }

  setFAQData(faqs: { question: string; answer: string }[]): void {
    const faqPage: FAQPage = {
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };

    this.addStructuredData(faqPage);
  }

  // Predefined structured data for common pages
  setHomePageData(): void {
    this.setWebSiteData();
    
    // Add course offerings
    this.setCourseData([
      {
        name: 'Beyond the AI Plateau - Professional',
        description: 'Advanced AI prompting techniques and productivity frameworks',
        courseCode: 'BTAIP-PRO',
        educationalLevel: 'Intermediate to Advanced',
        teaches: [
          'Advanced prompt engineering',
          'AI workflow optimization',
          'Productivity frameworks',
          'Custom AI assistant development'
        ],
        offers: {
          '@type': 'Offer',
          price: '79.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: 'https://www.amysoft.tech/pricing'
        }
      }
    ]);
  }

  setPricingPageData(): void {
    this.setProductData([
      {
        name: 'Beyond the AI Plateau - Starter',
        description: 'Basic AI prompts library and productivity frameworks',
        category: 'Online Course',
        offers: [{
          '@type': 'Offer',
          price: '29.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: 'https://www.amysoft.tech/pricing'
        }]
      },
      {
        name: 'Beyond the AI Plateau - Professional',
        description: 'Advanced prompt engineering course with 1-on-1 coaching',
        category: 'Online Course',
        offers: [{
          '@type': 'Offer',
          price: '79.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: 'https://www.amysoft.tech/pricing'
        }]
      },
      {
        name: 'Beyond the AI Plateau - Enterprise',
        description: 'Team training and custom AI workflow development',
        category: 'Online Course',
        offers: [{
          '@type': 'Offer',
          price: '199.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: 'https://www.amysoft.tech/pricing'
        }]
      }
    ]);

    // Add FAQ data for pricing page
    this.setFAQData([
      {
        question: 'Can I switch plans anytime?',
        answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.'
      },
      {
        question: 'Is there a free trial?',
        answer: 'We offer a 7-day free trial for the Professional plan. No credit card required.'
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.'
      },
      {
        question: 'Do you offer discounts for teams?',
        answer: 'Yes, we offer volume discounts for teams of 5 or more. Contact sales for details.'
      }
    ]);
  }

  setContactPageData(): void {
    this.removeExistingStructuredData();
    this.addStructuredData(this.baseOrganization);
  }

  setBlogPageData(): void {
    this.removeExistingStructuredData();
    this.addStructuredData({
      '@type': 'Blog',
      name: 'Beyond the AI Plateau Blog',
      description: 'Latest insights, tips, and tutorials on AI prompting and productivity',
      url: 'https://www.amysoft.tech/blog',
      publisher: this.baseOrganization
    });
  }
}