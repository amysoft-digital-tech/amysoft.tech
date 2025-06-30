export const environment = {
  production: true,
  apiUrl: 'https://api.amysoft.tech',
  websiteUrl: 'https://www.amysoft.tech',
  cdnUrl: 'https://cdn.amysoft.tech',
  enableSSR: true,
  
  // Analytics Configuration
  googleAnalytics: {
    measurementId: 'G-XXXXXXXXXX', // Replace with actual GA4 ID
    enabled: true,
    debugMode: false
  },
  
  // Stripe Configuration
  stripe: {
    publishableKey: 'pk_live_XXXXXXXXXXXXXXXXXXXX', // Replace with actual live key
    priceIds: {
      foundation: {
        monthly: 'price_foundation_monthly',
        annual: 'price_foundation_annual'
      },
      advanced: {
        monthly: 'price_advanced_monthly',
        annual: 'price_advanced_annual'
      },
      elite: {
        monthly: 'price_elite_monthly',
        annual: 'price_elite_annual'
      }
    }
  },
  
  // Email Service Configuration
  email: {
    provider: 'sendgrid',
    apiEndpoint: 'https://api.amysoft.tech/v1/email',
    templates: {
      welcome: 'tmpl_welcome_sequence',
      purchase: 'tmpl_purchase_confirmation',
      forgotPassword: 'tmpl_forgot_password',
      newsletter: 'tmpl_newsletter'
    }
  },
  
  // Security Configuration
  security: {
    enableCSP: true,
    enableHSTS: true,
    forceSSL: true,
    apiRateLimit: 100, // requests per minute
    sessionTimeout: 1800000, // 30 minutes
    tokenRefreshInterval: 900000 // 15 minutes
  },
  
  // Performance Configuration
  performance: {
    enableCaching: true,
    cacheMaxAge: 3600, // 1 hour
    enableCompression: true,
    enableServiceWorker: true,
    enablePrefetch: true,
    imageOptimization: {
      webp: true,
      lazy: true,
      placeholder: 'blur'
    }
  },
  
  // A/B Testing Configuration
  abTesting: {
    enabled: true,
    experiments: {
      heroHeadline: {
        id: 'hero_headline_test',
        enabled: true,
        variants: ['control', 'urgency_variant']
      },
      pricingDisplay: {
        id: 'pricing_display_test',
        enabled: true,
        variants: ['monthly_first', 'annual_first']
      },
      ctaButton: {
        id: 'cta_button_test',
        enabled: true,
        variants: ['get_access', 'start_learning', 'join_elite']
      }
    }
  },
  
  // Error Monitoring
  errorMonitoring: {
    enabled: true,
    sampleRate: 1.0,
    endpoint: 'https://api.amysoft.tech/v1/errors',
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured'
    ]
  },
  
  // Feature Flags
  features: {
    darkMode: false,
    socialLogin: false,
    comments: false,
    forumIntegration: false,
    videoContent: true,
    liveChat: false,
    aiAssistant: false
  },
  
  // CDN Configuration
  cdn: {
    enabled: true,
    providers: {
      cloudflare: {
        zoneId: 'XXXXXXXXXXXX',
        purgeOnDeploy: true
      }
    },
    assets: {
      images: 'https://cdn.amysoft.tech/images',
      styles: 'https://cdn.amysoft.tech/styles',
      scripts: 'https://cdn.amysoft.tech/scripts',
      fonts: 'https://cdn.amysoft.tech/fonts'
    }
  },
  
  // Monitoring & Logging
  monitoring: {
    uptimeChecks: {
      enabled: true,
      endpoints: [
        { url: '/', interval: 60 },
        { url: '/api/health', interval: 30 },
        { url: '/pricing', interval: 300 }
      ]
    },
    logging: {
      level: 'error',
      remote: true,
      endpoint: 'https://api.amysoft.tech/v1/logs'
    }
  }
};