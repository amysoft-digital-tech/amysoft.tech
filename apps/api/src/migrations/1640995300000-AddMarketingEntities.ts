import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMarketingEntities1640995300000 implements MigrationInterface {
  name = 'AddMarketingEntities1640995300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create leads table
    await queryRunner.query(`
      CREATE TABLE "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "name" varchar(255),
        "experienceLevel" varchar CHECK ("experienceLevel" IN ('beginner', 'intermediate', 'advanced')),
        "primaryLanguage" varchar(100),
        "source" varchar(100) NOT NULL,
        "status" varchar CHECK ("status" IN ('new', 'contacted', 'converted', 'unsubscribed')) DEFAULT 'new',
        "gdprConsent" boolean NOT NULL DEFAULT false,
        "marketingConsent" boolean DEFAULT false,
        "newsletterSubscribed" boolean DEFAULT false,
        "utmSource" varchar(100),
        "utmMedium" varchar(100),
        "utmCampaign" varchar(100),
        "utmTerm" varchar(100),
        "utmContent" varchar(100),
        "ipAddress" varchar(45),
        "userAgent" text,
        "country" varchar(10),
        "referrer" varchar(100),
        "customProperties" jsonb,
        "firstContactedAt" timestamp,
        "convertedAt" timestamp,
        "lastEmailSentAt" timestamp,
        "emailsSent" integer DEFAULT 0,
        "emailsOpened" integer DEFAULT 0,
        "emailsClicked" integer DEFAULT 0,
        "conversionProbability" decimal(5,2),
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `);

    // Create marketing_content table
    await queryRunner.query(`
      CREATE TABLE "marketing_content" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" varchar CHECK ("type" IN ('hero', 'principles', 'testimonials', 'pricing', 'faq', 'blog', 'author')) NOT NULL,
        "slug" varchar(255) NOT NULL,
        "title" varchar(500) NOT NULL,
        "description" text,
        "content" jsonb NOT NULL,
        "status" varchar CHECK ("status" IN ('draft', 'published', 'archived')) DEFAULT 'draft',
        "language" varchar(10) DEFAULT 'en',
        "seoMetadata" jsonb,
        "abTestVariants" jsonb,
        "author" varchar(100),
        "publishedAt" timestamp,
        "scheduledAt" timestamp,
        "views" integer DEFAULT 0,
        "engagements" integer DEFAULT 0,
        "conversionRate" decimal(5,2),
        "tags" jsonb,
        "customFields" jsonb,
        "createdAt" timestamp DEFAULT now(),
        "updatedAt" timestamp DEFAULT now()
      )
    `);

    // Create analytics_events table
    await queryRunner.query(`
      CREATE TABLE "analytics_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "eventType" varchar CHECK ("eventType" IN (
          'page_view', 'form_submit', 'button_click', 'content_view', 
          'video_play', 'download', 'signup', 'conversion', 'email_open', 
          'email_click', 'search', 'error', 'custom'
        )) NOT NULL,
        "eventName" varchar(255) NOT NULL,
        "userId" uuid,
        "sessionId" varchar(255) NOT NULL,
        "pageUrl" varchar(500),
        "referrer" varchar(500),
        "eventProperties" jsonb,
        "userProperties" jsonb,
        "ipAddress" varchar(45),
        "userAgent" text,
        "country" varchar(10),
        "city" varchar(50),
        "device" varchar(100),
        "browser" varchar(100),
        "os" varchar(100),
        "source" varchar(100),
        "medium" varchar(100),
        "campaign" varchar(100),
        "value" decimal(10,2),
        "currency" varchar(10),
        "isConversion" boolean DEFAULT false,
        "clientTimestamp" timestamp,
        "createdAt" timestamp DEFAULT now()
      )
    `);

    // Create indexes for leads table
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_leads_email" ON "leads" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_source_created" ON "leads" ("source", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_status_created" ON "leads" ("status", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_leads_ip_address" ON "leads" ("ipAddress")`);

    // Create indexes for marketing_content table
    await queryRunner.query(`CREATE INDEX "IDX_marketing_content_type_status" ON "marketing_content" ("type", "status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_marketing_content_slug" ON "marketing_content" ("slug")`);

    // Create indexes for analytics_events table
    await queryRunner.query(`CREATE INDEX "IDX_analytics_events_type_created" ON "analytics_events" ("eventType", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_analytics_events_user_created" ON "analytics_events" ("userId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_analytics_events_session_created" ON "analytics_events" ("sessionId", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_analytics_events_conversion" ON "analytics_events" ("isConversion", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_analytics_events_source" ON "analytics_events" ("source")`);

    // Insert default marketing content
    await queryRunner.query(`
      INSERT INTO "marketing_content" (
        "type", "slug", "title", "description", "content", "status", "language"
      ) VALUES 
      (
        'hero',
        'hero-main',
        'Beyond the AI Plateau: Master the Elite Principles',
        'Hero section content for the main landing page',
        '${JSON.stringify({
          headline: "Beyond the AI Plateau: Master the Elite Principles of AI-Driven Development",
          subheadline: "Transform from AI novice to elite developer with proven strategies that 97% of developers miss",
          ctaText: "Get Instant Access to Elite Principles",
          ctaUrl: "/signup",
          features: [
            "5 Elite Principles of AI Development",
            "15+ Practical Templates", 
            "Direct Access to Expert Guidance"
          ],
          socialProof: {
            memberCount: 1247,
            testimonialCount: 89,
            averageRating: 4.8
          }
        })}',
        'published',
        'en'
      ),
      (
        'pricing',
        'pricing-tiers',
        'Pricing Plans',
        'Pricing tiers and feature comparison',
        '${JSON.stringify({
          tiers: [
            {
              id: "foundation",
              name: "Foundation",
              description: "Perfect for developers starting their AI journey",
              pricing: { monthly: 29, annual: 290, currency: "USD", annualDiscount: 17 },
              features: [
                { name: "5 Core Chapters", included: true, description: "Essential AI development principles" },
                { name: "Basic Template Library", included: true, description: "20+ proven prompts and templates" },
                { name: "Community Access", included: true, description: "Join our developer community" }
              ],
              ctaText: "Start Foundation",
              popular: false
            }
          ]
        })}',
        'published',
        'en'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_source"`);
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_conversion"`);
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_session_created"`);
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_user_created"`);
    await queryRunner.query(`DROP INDEX "IDX_analytics_events_type_created"`);
    await queryRunner.query(`DROP INDEX "IDX_marketing_content_slug"`);
    await queryRunner.query(`DROP INDEX "IDX_marketing_content_type_status"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_ip_address"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_status_created"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_source_created"`);
    await queryRunner.query(`DROP INDEX "IDX_leads_email"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "analytics_events"`);
    await queryRunner.query(`DROP TABLE "marketing_content"`);
    await queryRunner.query(`DROP TABLE "leads"`);
  }
}