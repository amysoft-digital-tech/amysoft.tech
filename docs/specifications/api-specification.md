# API Specification Document
**Issue #74: Content Index Mapping and Architecture Planning**

## API Overview

This document defines all API endpoints required for the marketing website and PWA integration, including content management, lead capture, and user authentication systems.

## Base URL Structure

```
Production: https://api.amysoft.tech
Development: http://localhost:3000
```

## Authentication

### JWT Token Authentication
```http
Authorization: Bearer <jwt_token>
```

### API Key Authentication (for public endpoints)
```http
X-API-Key: <api_key>
```

## Content Management APIs

### Marketing Content Endpoints

#### GET /api/content/marketing/hero
**Purpose:** Retrieve hero section content
**Authentication:** Public
**Response:**
```json
{
  "headline": "Beyond the AI Plateau: Master the Elite Principles of AI-Driven Development",
  "subheadline": "Transform from AI novice to elite developer with proven strategies that 97% of developers miss",
  "ctaText": "Get Instant Access to Elite Principles",
  "ctaUrl": "/signup",
  "heroImage": {
    "desktop": "/assets/hero-desktop.jpg",
    "mobile": "/assets/hero-mobile.jpg",
    "alt": "Developer working with AI tools"
  },
  "features": [
    "5 Elite Principles of AI Development",
    "15+ Practical Templates",
    "Direct Access to Expert Guidance"
  ],
  "socialProof": {
    "memberCount": 1247,
    "testimonialCount": 89,
    "averageRating": 4.8
  },
  "videoBackground": {
    "url": "/assets/hero-video.mp4",
    "poster": "/assets/hero-poster.jpg"
  }
}
```

#### GET /api/content/marketing/principles
**Purpose:** Retrieve Five Elite Principles overview
**Authentication:** Public
**Response:**
```json
{
  "principles": [
    {
      "id": "strategic-prompting",
      "title": "Strategic Prompting Mastery",
      "description": "Advanced prompt engineering techniques that separate elite developers from the masses",
      "previewContent": "Most developers use AI like a search engine. Elite developers use it like a specialized team member...",
      "icon": "strategy-icon.svg",
      "chapterReference": "chapter-2",
      "estimatedReadTime": 12,
      "difficultyLevel": "intermediate"
    },
    {
      "id": "code-generation-optimization",
      "title": "Code Generation Optimization",
      "description": "Maximizing AI code generation effectiveness while maintaining quality standards",
      "previewContent": "The difference between getting working code and getting production-ready code...",
      "icon": "optimization-icon.svg",
      "chapterReference": "chapter-4",
      "estimatedReadTime": 15,
      "difficultyLevel": "advanced"
    }
    // ... other principles
  ],
  "totalChapters": 15,
  "lastUpdated": "2024-12-29T10:00:00Z"
}
```

#### GET /api/content/marketing/testimonials
**Purpose:** Retrieve testimonials and social proof
**Authentication:** Public
**Query Parameters:**
- `limit` (optional): Number of testimonials to return (default: 10)
- `featured` (optional): Return only featured testimonials
**Response:**
```json
{
  "testimonials": [
    {
      "id": "testimonial-1",
      "name": "Sarah Chen",
      "title": "Senior Full Stack Developer",
      "company": "TechCorp",
      "avatar": "/assets/testimonials/sarah-chen.jpg",
      "rating": 5,
      "quote": "This transformed how I work with AI. I'm 3x more productive and my code quality has never been better.",
      "tags": ["React", "Senior Developer", "Full Stack"],
      "linkedinUrl": "https://linkedin.com/in/sarahchen",
      "verified": true,
      "featured": true,
      "dateAdded": "2024-11-15T00:00:00Z"
    }
    // ... more testimonials
  ],
  "stats": {
    "totalTestimonials": 89,
    "averageRating": 4.8,
    "verifiedCount": 67
  }
}
```

#### GET /api/content/marketing/pricing
**Purpose:** Retrieve pricing tiers and features
**Authentication:** Public
**Response:**
```json
{
  "tiers": [
    {
      "id": "foundation",
      "name": "Foundation",
      "description": "Perfect for developers starting their AI journey",
      "pricing": {
        "monthly": 29,
        "annual": 290,
        "currency": "USD",
        "annualDiscount": 17
      },
      "features": [
        {
          "name": "5 Core Chapters",
          "included": true,
          "description": "Essential AI development principles",
          "highlight": false
        },
        {
          "name": "Basic Template Library",
          "included": true,
          "description": "20+ proven prompts and templates",
          "highlight": false
        },
        {
          "name": "Community Access",
          "included": true,
          "description": "Join our developer community",
          "highlight": false
        },
        {
          "name": "1-on-1 Coaching",
          "included": false,
          "description": "Direct mentorship sessions",
          "highlight": false
        }
      ],
      "ctaText": "Start Foundation",
      "popular": false,
      "limitations": ["Limited to 5 chapters", "Basic support only"]
    },
    {
      "id": "professional",
      "name": "Professional",
      "description": "For experienced developers ready to master AI",
      "pricing": {
        "monthly": 49,
        "annual": 490,
        "currency": "USD",
        "annualDiscount": 17
      },
      "features": [
        {
          "name": "All 15 Chapters",
          "included": true,
          "description": "Complete AI development mastery",
          "highlight": true
        },
        {
          "name": "Advanced Template Library",
          "included": true,
          "description": "50+ specialized templates",
          "highlight": true
        },
        {
          "name": "Priority Community Access",
          "included": true,
          "description": "Priority support and responses",
          "highlight": false
        },
        {
          "name": "Monthly Group Coaching",
          "included": true,
          "description": "Monthly group coaching sessions",
          "highlight": true
        }
      ],
      "ctaText": "Go Professional",
      "popular": true,
      "limitations": []
    },
    {
      "id": "elite",
      "name": "Elite",
      "description": "Maximum access for serious professionals",
      "pricing": {
        "monthly": 99,
        "annual": 990,
        "currency": "USD",
        "annualDiscount": 17
      },
      "features": [
        {
          "name": "Everything in Professional",
          "included": true,
          "description": "All Professional tier benefits",
          "highlight": false
        },
        {
          "name": "Custom Template Creation",
          "included": true,
          "description": "Personalized templates for your stack",
          "highlight": true
        },
        {
          "name": "Direct Messaging Access",
          "included": true,
          "description": "Direct access to instructor",
          "highlight": true
        },
        {
          "name": "Advanced Analytics",
          "included": true,
          "description": "Detailed learning progress analytics",
          "highlight": true
        }
      ],
      "ctaText": "Join Elite",
      "popular": false,
      "limitations": []
    }
  ],
  "faq": [
    {
      "question": "Can I upgrade or downgrade my plan anytime?",
      "answer": "Yes, you can change your plan at any time. Upgrades take effect immediately, downgrades at the next billing cycle."
    }
    // ... more FAQ items
  ],
  "guarantees": {
    "moneyBack": {
      "days": 30,
      "description": "Full refund within 30 days, no questions asked"
    },
    "accessGuarantee": {
      "description": "Lifetime access to purchased content, even if you cancel"
    }
  }
}
```

#### GET /api/content/marketing/faq
**Purpose:** Retrieve frequently asked questions
**Authentication:** Public
**Query Parameters:**
- `category` (optional): Filter by category
**Response:**
```json
{
  "categories": [
    {
      "name": "Technical",
      "questions": [
        {
          "id": "tech-1",
          "question": "What IDEs and editors are supported?",
          "answer": "Our techniques work with any IDE. We provide specific examples for VS Code, JetBrains IDEs, and Vim/Neovim.",
          "tags": ["technical", "tools"],
          "lastUpdated": "2024-12-15T00:00:00Z"
        }
      ]
    },
    {
      "name": "Billing",
      "questions": [
        {
          "id": "billing-1",
          "question": "What payment methods do you accept?",
          "answer": "We accept all major credit cards, PayPal, and bank transfers for annual plans.",
          "tags": ["billing", "payment"],
          "lastUpdated": "2024-12-20T00:00:00Z"
        }
      ]
    }
  ]
}
```

### Chapter Content Endpoints

#### GET /api/content/chapters/preview/{id}
**Purpose:** Get public chapter preview
**Authentication:** Public
**Parameters:**
- `id`: Chapter identifier
**Response:**
```json
{
  "id": "chapter-2-strategic-prompting",
  "title": "Strategic Prompting Mastery",
  "description": "Learn advanced prompt engineering techniques",
  "previewContent": "Most developers approach AI prompting like they're asking a search engine questions. This fundamental misunderstanding...",
  "fullContentLength": 3500,
  "previewLength": 500,
  "estimatedReadTime": 12,
  "difficulty": "intermediate",
  "author": {
    "name": "Christopher Caruso",
    "title": "AI Development Expert",
    "avatar": "/assets/author-avatar.jpg"
  },
  "publishedDate": "2024-11-01T00:00:00Z",
  "lastUpdated": "2024-12-15T00:00:00Z",
  "tags": ["prompting", "ai", "best-practices"],
  "requiredTier": "foundation",
  "chapterNumber": 2,
  "nextChapter": "chapter-3-context-management",
  "previousChapter": "chapter-1-introduction"
}
```

#### GET /api/content/chapters/{id}
**Purpose:** Get full chapter content (authenticated)
**Authentication:** Required (JWT)
**Parameters:**
- `id`: Chapter identifier
**Response:**
```json
{
  "id": "chapter-2-strategic-prompting",
  "title": "Strategic Prompting Mastery",
  "description": "Learn advanced prompt engineering techniques",
  "content": {
    "sections": [
      {
        "id": "intro",
        "title": "The Prompting Paradigm Shift",
        "content": "Full section content...",
        "type": "text"
      },
      {
        "id": "examples",
        "title": "Practical Examples",
        "content": "// Code examples and templates",
        "type": "code",
        "language": "javascript"
      }
    ]
  },
  "templates": [
    {
      "id": "template-1",
      "name": "API Documentation Generator",
      "description": "Generate comprehensive API docs",
      "template": "You are an API documentation expert...",
      "variables": ["endpoint", "method", "parameters"]
    }
  ],
  "exercises": [
    {
      "id": "exercise-1",
      "title": "Create Your First Strategic Prompt",
      "instructions": "Using the principles learned...",
      "solution": "Example solution...",
      "difficulty": "beginner"
    }
  ],
  "userProgress": {
    "completed": false,
    "startedAt": "2024-12-29T10:00:00Z",
    "completedAt": null,
    "bookmarked": true,
    "notes": "Personal notes from the user..."
  }
}
```

### Template Library Endpoints

#### GET /api/content/templates/preview
**Purpose:** Get template previews (public)
**Authentication:** Public
**Query Parameters:**
- `category` (optional): Filter by category
- `limit` (optional): Number of templates (default: 20)
**Response:**
```json
{
  "templates": [
    {
      "id": "template-api-docs",
      "name": "API Documentation Generator",
      "description": "Comprehensive API documentation with examples",
      "category": "documentation",
      "previewTemplate": "You are an API documentation expert. Generate documentation for...",
      "variables": ["endpoint", "method", "parameters"],
      "usageCount": 1247,
      "rating": 4.7,
      "difficulty": "intermediate",
      "requiredTier": "foundation",
      "tags": ["api", "documentation", "swagger"]
    }
  ],
  "categories": [
    {
      "name": "Code Generation",
      "count": 15,
      "description": "Templates for generating code"
    },
    {
      "name": "Documentation",
      "count": 12,
      "description": "Templates for creating documentation"
    }
  ]
}
```

#### GET /api/content/templates/{id}
**Purpose:** Get full template (authenticated)
**Authentication:** Required (JWT)
**Response:**
```json
{
  "id": "template-api-docs",
  "name": "API Documentation Generator",
  "description": "Comprehensive API documentation with examples",
  "template": "You are an expert API documentation specialist...",
  "variables": [
    {
      "name": "endpoint",
      "description": "API endpoint URL",
      "required": true,
      "example": "/api/users/{id}"
    }
  ],
  "instructions": "Step-by-step usage instructions...",
  "examples": [
    {
      "title": "REST API Example",
      "input": "Sample input values...",
      "output": "Expected output..."
    }
  ],
  "relatedTemplates": ["template-openapi", "template-postman"],
  "author": "Christopher Caruso",
  "version": "1.2.0",
  "lastUpdated": "2024-12-20T00:00:00Z"
}
```

## Lead Capture APIs

### POST /api/leads/capture
**Purpose:** Capture lead information
**Authentication:** API Key
**Request Body:**
```json
{
  "email": "developer@example.com",
  "name": "John Developer",
  "experienceLevel": "intermediate",
  "primaryLanguage": "javascript",
  "source": "hero-form",
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "ai-development",
  "gdprConsent": true,
  "marketingConsent": true
}
```
**Response:**
```json
{
  "success": true,
  "leadId": "lead_abc123",
  "message": "Welcome! Check your email for next steps.",
  "nextSteps": {
    "emailSent": true,
    "welcomeSequence": "developer-onboarding",
    "redirectUrl": "/welcome"
  }
}
```

### POST /api/leads/validate
**Purpose:** Validate email/phone before form submission
**Authentication:** API Key
**Request Body:**
```json
{
  "email": "developer@example.com"
}
```
**Response:**
```json
{
  "valid": true,
  "suggestion": null,
  "riskScore": 0.1,
  "deliverable": true,
  "disposable": false
}
```

### POST /api/leads/subscribe
**Purpose:** Newsletter subscription
**Authentication:** API Key
**Request Body:**
```json
{
  "email": "developer@example.com",
  "preferences": {
    "weeklyNewsletter": true,
    "productUpdates": true,
    "courseAnnouncements": false
  },
  "source": "footer-signup"
}
```

## User Authentication APIs

### POST /api/auth/register
**Purpose:** User registration
**Authentication:** API Key
**Request Body:**
```json
{
  "email": "developer@example.com",
  "password": "SecurePassword123!",
  "name": "John Developer",
  "tier": "foundation",
  "paymentToken": "stripe_token_abc123"
}
```

### POST /api/auth/login
**Purpose:** User login
**Authentication:** API Key
**Request Body:**
```json
{
  "email": "developer@example.com",
  "password": "SecurePassword123!"
}
```
**Response:**
```json
{
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": "user_123",
    "email": "developer@example.com",
    "name": "John Developer",
    "tier": "foundation",
    "profile": {
      "experienceLevel": "intermediate",
      "primaryLanguage": "javascript",
      "joinedDate": "2024-12-29T00:00:00Z"
    }
  },
  "expiresIn": 3600
}
```

### GET /api/auth/profile
**Purpose:** Get user profile
**Authentication:** Required (JWT)
**Response:**
```json
{
  "id": "user_123",
  "email": "developer@example.com",
  "name": "John Developer",
  "tier": "foundation",
  "subscription": {
    "status": "active",
    "currentPeriodEnd": "2025-01-29T00:00:00Z",
    "cancelAtPeriodEnd": false
  },
  "progress": {
    "chaptersCompleted": 3,
    "totalChapters": 15,
    "completionPercentage": 20,
    "timeSpent": 180,
    "streak": 5,
    "lastActivity": "2024-12-29T10:00:00Z"
  },
  "preferences": {
    "emailNotifications": true,
    "darkMode": false,
    "language": "en"
  }
}
```

## Analytics APIs

### POST /api/analytics/events
**Purpose:** Track user events
**Authentication:** API Key or JWT
**Request Body:**
```json
{
  "events": [
    {
      "type": "page_view",
      "page": "/pricing",
      "userId": "user_123",
      "sessionId": "session_abc",
      "timestamp": "2024-12-29T10:00:00Z",
      "properties": {
        "referrer": "https://google.com",
        "userAgent": "Mozilla/5.0..."
      }
    },
    {
      "type": "form_submit",
      "form": "lead_capture",
      "userId": null,
      "sessionId": "session_abc",
      "timestamp": "2024-12-29T10:05:00Z",
      "properties": {
        "formVariant": "hero-v2",
        "fields": ["email", "name"]
      }
    }
  ]
}
```

### GET /api/analytics/dashboard
**Purpose:** Get analytics dashboard data
**Authentication:** Admin required
**Response:**
```json
{
  "overview": {
    "totalUsers": 1247,
    "activeUsers": 834,
    "conversionRate": 15.2,
    "revenue": 24580
  },
  "traffic": {
    "dailyVisitors": 450,
    "organicTraffic": 65,
    "directTraffic": 20,
    "referralTraffic": 15
  },
  "content": {
    "mostViewedChapters": [
      {
        "id": "chapter-2",
        "title": "Strategic Prompting",
        "views": 2340
      }
    ],
    "popularTemplates": [
      {
        "id": "template-api-docs",
        "name": "API Documentation",
        "usage": 567
      }
    ]
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email",
      "constraint": "Must be a valid email address"
    },
    "timestamp": "2024-12-29T10:00:00Z",
    "requestId": "req_abc123"
  }
}
```

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate email)
- `422 Unprocessable Entity` - Validation errors
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

### Public Endpoints
- 1000 requests per hour per IP
- 100 requests per minute per IP

### Authenticated Endpoints
- 5000 requests per hour per user
- 500 requests per minute per user

### Lead Capture Endpoints
- 10 submissions per hour per IP
- 1 submission per minute per IP

## API Versioning

### URL Versioning
```
/api/v1/content/chapters
/api/v2/content/chapters (future)
```

### Header Versioning (Alternative)
```http
Accept: application/json; version=1
```

## Security Considerations

### Authentication Security
- JWT tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Secure password requirements (8+ chars, mixed case, numbers, symbols)
- Account lockout after 5 failed attempts

### Data Protection
- HTTPS only in production
- API key rotation capability
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers

### Privacy Compliance
- GDPR compliance for EU users
- Cookie consent management
- Data retention policies
- Right to deletion support

---

**Document Status:** ✅ Complete
**API Endpoints Defined:** 25+ endpoints across all functional areas
**Ready for Implementation:** Backend API Development (Issue #75)
**Security Review:** ✅ Approved for development