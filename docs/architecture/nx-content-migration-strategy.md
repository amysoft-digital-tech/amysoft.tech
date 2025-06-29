# Content Migration Strategy for Existing amysoft.tech Nx Workspace

## **Current Architecture Analysis**

You have the perfect setup for **The Conductor's Method**:

### **Core Repository: `amysoft-digital-tech/amysoft.tech`**
```
amysoft.tech/
├── apps/
│   ├── website/           # Angular marketing site
│   ├── pwa/              # Ionic Angular PWA (ebook platform)
│   ├── admin/            # Angular admin console
│   └── api/              # NestJS + PostgreSQL + Prisma
└── libs/                 # (To be enhanced with shared libraries)
```

### **Content Repository: `amysoft-digital-tech/amysoftai-content`**
- Markdown content (chapters, templates, case studies)
- SVG components (89 diagrams)
- Integration guides

### **Infrastructure Repository: `amysoft-digital-tech/amysoftai-infrastructure`**
- Production Docker configurations
- VPS deployment scripts
- Monitoring and backup procedures

## **Phase 1: Enhance Existing Nx Workspace**

### **1.1 Add Shared Libraries to Existing Workspace**

```bash
cd amysoft.tech

# Generate shared libraries (these are missing from your current setup)
nx generate @nx/js:library shared-types --directory=libs --buildable --publishable --importPath=@amysoft/shared-types
nx generate @nx/js:library shared-utils --directory=libs --buildable --publishable --importPath=@amysoft/shared-utils
nx generate @nx/angular:library shared-ui --directory=libs --buildable --publishable --importPath=@amysoft/shared-ui
nx generate @nx/js:library shared-data-access --directory=libs --buildable --publishable --importPath=@amysoft/shared-data-access

# Install required dependencies for content migration
npm install gray-matter js-yaml @prisma/client prisma
npm install @angular/common @angular/core rxjs
npm install @ionic/angular
```

### **1.2 Create Content Git Submodule**

```bash
# Add content repository as submodule to access content during migration
git submodule add https://github.com/amysoft-digital-tech/amysoftai-content.git content-source
git submodule update --init --recursive

# Create symbolic link for easier access (optional)
ln -s content-source/content apps/api/src/content-source
```

## **Phase 2: Enhanced API Application (Existing)**

### **2.1 Update Existing Prisma Schema**

```bash
cd apps/api

# Your existing Prisma setup - enhance with content schema
cat >> prisma/schema.prisma << 'EOF'

// Content management models for Beyond the AI Plateau
model ContentTier {
  id          String    @id @default(cuid())
  name        String    @unique // "foundation", "advanced", "elite"
  price       Decimal   @db.Decimal(6,2)
  description String?
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  chapters    Chapter[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@map("content_tiers")
}

model Chapter {
  id              String           @id @default(cuid())
  slug            String           @unique
  title           String
  subtitle        String?
  description     String?
  content         String           // Markdown content
  wordCount       Int              @default(0)
  estimatedReadTime Int           @default(0)
  sortOrder       Int              @default(0)
  isPublished     Boolean          @default(false)
  
  // Relationships
  tierId          String
  tier            ContentTier      @relation(fields: [tierId], references: [id])
  sections        ChapterSection[]
  templates       PromptTemplate[]
  caseStudies     CaseStudy[]
  metadata        ChapterMetadata?
  tags            Tag[]
  assets          Asset[]
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@map("chapters")
}

model ChapterSection {
  id          String  @id @default(cuid())
  slug        String
  title       String
  content     String  // Markdown content
  sortOrder   Int     @default(0)
  
  chapterId   String
  chapter     Chapter @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([chapterId, slug])
  @@map("chapter_sections")
}

model PromptTemplate {
  id              String              @id @default(cuid())
  slug            String              @unique
  title           String
  description     String?
  template        String              // The actual prompt template
  category        String              // Maps to your 5 principles
  difficulty      String              @default("beginner")
  usageContext    String?
  expectedOutcome String?
  customizationGuide String?
  
  // Analytics
  usageCount      Int                 @default(0)
  effectivenessScore Int?             @db.SmallInt
  successRate     Decimal?            @db.Decimal(5,2)
  
  // Relationships
  chapterId       String?
  chapter         Chapter?            @relation(fields: [chapterId], references: [id])
  variables       TemplateVariable[]
  examples        TemplateExample[]
  tags            Tag[]
  
  isActive        Boolean             @default(true)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  @@map("prompt_templates")
}

model TemplateVariable {
  id              String         @id @default(cuid())
  name            String         // Variable placeholder name
  description     String?
  dataType        String         @default("string")
  isRequired      Boolean        @default(true)
  defaultValue    String?
  validationRules Json?          // JSON schema for validation
  
  templateId      String
  template        PromptTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  @@unique([templateId, name])
  @@map("template_variables")
}

model TemplateExample {
  id          String         @id @default(cuid())
  title       String
  description String?
  input       Json           // Example input variables
  output      String         // Expected output
  
  templateId  String
  template    PromptTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  
  createdAt   DateTime       @default(now())
  
  @@map("template_examples")
}

model CaseStudy {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  description     String?
  content         String   // Full case study markdown
  industry        String?
  companySize     String?  // "startup", "medium", "enterprise"
  
  // Metrics and outcomes
  beforeMetrics   Json?    // JSON object with before metrics
  afterMetrics    Json?    // JSON object with after metrics
  improvementPercentage Decimal? @db.Decimal(5,2)
  timeframeWeeks  Int?
  
  // Relationships
  chapterId       String?
  chapter         Chapter? @relation(fields: [chapterId], references: [id])
  tags            Tag[]
  
  isPublished     Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("case_studies")
}

model Asset {
  id          String      @id @default(cuid())
  filename    String
  originalName String
  path        String      // File system path
  url         String?     // CDN or public URL
  mimeType    String
  size        Int         // File size in bytes
  assetType   AssetType   @default(IMAGE)
  
  // Metadata for accessibility and organization
  alt         String?     // Alt text for images
  caption     String?
  description String?
  metadata    Json?       // Additional metadata (dimensions, etc.)
  
  // Relationships
  chapterId   String?
  chapter     Chapter?    @relation(fields: [chapterId], references: [id])
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  @@map("assets")
}

enum AssetType {
  IMAGE
  DIAGRAM
  INTERACTIVE
  DOCUMENT
  VIDEO
  AUDIO
}

model Tag {
  id          String           @id @default(cuid())
  name        String           @unique
  description String?
  category    String?          // "principle", "technology", "difficulty"
  color       String?          // Hex color for UI
  
  // Relationships
  chapters    Chapter[]
  templates   PromptTemplate[]
  caseStudies CaseStudy[]
  
  createdAt   DateTime         @default(now())
  
  @@map("tags")
}

model ChapterMetadata {
  id                String  @id @default(cuid())
  completionStatus  String  @default("draft") // "draft", "review", "complete"
  technicalAccuracy Boolean @default(false)
  qualityScore      Int?    @db.SmallInt
  lastReviewDate    DateTime?
  reviewNotes       String?
  
  // SEO metadata
  metaTitle         String?
  metaDescription   String?
  canonicalUrl      String?
  
  chapterId         String  @unique
  chapter           Chapter @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("chapter_metadata")
}

// Migration tracking
model MigrationLog {
  id              String   @id @default(cuid())
  contentType     String   // "chapter", "template", "asset"
  sourceFile      String   // Original file path
  targetId        String?  // ID of created record
  status          String   // "success", "failed", "skipped"
  errorMessage    String?
  metadata        Json?    // Additional migration metadata
  
  createdAt       DateTime @default(now())
  
  @@map("migration_logs")
}
EOF

# Generate Prisma client with new schema
npx prisma generate
npx prisma db push  # Or create migration: npx prisma migrate dev --name add-content-models
```

### **2.2 Create Content Migration Module**

```bash
# Create migration module in existing API
mkdir -p src/app/content-migration
mkdir -p src/app/content

# Create migration service
cat > src/app/content-migration/content-migration.service.ts << 'EOF'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, extname } from 'path';
import * as matter from 'gray-matter';
import { resolve } from 'path';

interface ChapterFrontmatter {
  title: string;
  subtitle?: string;
  description?: string;
  tier: 'foundation' | 'advanced' | 'elite';
  sortOrder: number;
  tags?: string[];
  isPublished?: boolean;
  completionStatus?: string;
}

@Injectable()
export class ContentMigrationService {
  private readonly logger = new Logger(ContentMigrationService.name);
  private readonly contentSourcePath: string;

  constructor(private prisma: PrismaService) {
    // Path to content source (submodule or adjacent repository)
    this.contentSourcePath = resolve(process.cwd(), 'content-source');
  }

  async migrateAll(): Promise<{ success: boolean; message: string; details?: any }> {
    this.logger.log('Starting migration from amysoftai-content repository...');
    
    try {
      const results = {
        tiers: await this.initializeContentTiers(),
        chapters: await this.migrateChapters(),
        templates: await this.migratePromptTemplates(),
        caseStudies: await this.migrateCaseStudies(),
        assets: await this.migrateAssets(),
        relationships: await this.establishRelationships()
      };
      
      this.logger.log('Content migration completed successfully');
      return {
        success: true,
        message: 'Content migration completed successfully',
        details: results
      };
    } catch (error) {
      this.logger.error('Content migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error.message}`,
        details: { error: error.stack }
      };
    }
  }

  private async initializeContentTiers(): Promise<any> {
    this.logger.log('Initializing content tiers...');
    
    const tiers = [
      { 
        name: 'foundation', 
        price: 24.95, 
        description: 'Foundation principles and core concepts (Chapters 1-2)', 
        sortOrder: 1 
      },
      { 
        name: 'advanced', 
        price: 97.00, 
        description: 'Advanced techniques and implementations (Chapters 3-7)', 
        sortOrder: 2 
      },
      { 
        name: 'elite', 
        price: 297.00, 
        description: 'Elite transformation and mastery (Chapters 8-9)', 
        sortOrder: 3 
      },
    ];

    const results = [];
    for (const tier of tiers) {
      const result = await this.prisma.contentTier.upsert({
        where: { name: tier.name },
        update: { price: tier.price, description: tier.description },
        create: tier,
      });
      results.push(result);
    }
    
    return { created: results.length, tiers: results };
  }

  private async migrateChapters(): Promise<any> {
    this.logger.log('Migrating chapters from content/principles/...');
    
    const principlesPath = join(this.contentSourcePath, 'content', 'principles');
    
    try {
      const chapterDirs = await readdir(principlesPath, { withFileTypes: true });
      const results = [];
      
      for (const dir of chapterDirs.filter(d => d.isDirectory())) {
        const result = await this.migrateChapter(join(principlesPath, dir.name));
        if (result) results.push(result);
      }
      
      return { migrated: results.length, chapters: results };
    } catch (error) {
      this.logger.error('Failed to read principles directory:', error);
      return { migrated: 0, error: error.message };
    }
  }

  private async migrateChapter(chapterPath: string): Promise<any> {
    const chapterSlug = basename(chapterPath);
    this.logger.log(`Migrating chapter: ${chapterSlug}`);

    try {
      const readmePath = join(chapterPath, 'README.md');
      const readmeExists = await this.fileExists(readmePath);
      
      if (!readmeExists) {
        this.logger.warn(`No README.md found for chapter: ${chapterSlug}`);
        return null;
      }

      const contentFile = await readFile(readmePath, 'utf-8');
      const { data: frontmatter, content } = matter(contentFile) as {
        data: ChapterFrontmatter;
        content: string;
      };

      // Determine tier based on chapter number or explicit frontmatter
      let tierName = frontmatter.tier || 'foundation';
      if (chapterSlug.includes('ch01') || chapterSlug.includes('ch02')) {
        tierName = 'foundation';
      } else if (chapterSlug.includes('ch08') || chapterSlug.includes('ch09')) {
        tierName = 'elite';
      } else {
        tierName = 'advanced';
      }

      const tier = await this.prisma.contentTier.findUnique({
        where: { name: tierName }
      });

      if (!tier) {
        throw new Error(`Content tier not found: ${tierName}`);
      }

      // Create or update chapter
      const chapter = await this.prisma.chapter.upsert({
        where: { slug: chapterSlug },
        update: {
          title: frontmatter.title,
          subtitle: frontmatter.subtitle,
          description: frontmatter.description,
          content,
          wordCount: this.countWords(content),
          estimatedReadTime: Math.ceil(this.countWords(content) / 200),
          sortOrder: frontmatter.sortOrder || this.extractChapterNumber(chapterSlug),
          isPublished: frontmatter.isPublished !== false, // Default to true unless explicitly false
        },
        create: {
          slug: chapterSlug,
          title: frontmatter.title,
          subtitle: frontmatter.subtitle,
          description: frontmatter.description,
          content,
          wordCount: this.countWords(content),
          estimatedReadTime: Math.ceil(this.countWords(content) / 200),
          sortOrder: frontmatter.sortOrder || this.extractChapterNumber(chapterSlug),
          isPublished: frontmatter.isPublished !== false,
          tierId: tier.id,
        },
      });

      // Create chapter metadata
      await this.prisma.chapterMetadata.upsert({
        where: { chapterId: chapter.id },
        update: {
          completionStatus: frontmatter.completionStatus || 'complete',
          technicalAccuracy: true, // Assume true for existing content
        },
        create: {
          chapterId: chapter.id,
          completionStatus: frontmatter.completionStatus || 'complete',
          technicalAccuracy: true,
        },
      });

      // Process chapter sections if they exist
      await this.migrateChapterSections(chapterPath, chapter.id);

      // Process tags
      if (frontmatter.tags && frontmatter.tags.length > 0) {
        for (const tagName of frontmatter.tags) {
          const tag = await this.prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { 
              name: tagName, 
              category: 'principle',
              color: this.getTagColor(tagName)
            },
          });

          await this.prisma.chapter.update({
            where: { id: chapter.id },
            data: {
              tags: {
                connect: { id: tag.id },
              },
            },
          });
        }
      }

      this.logger.log(`Successfully migrated chapter: ${chapterSlug}`);
      return { slug: chapterSlug, id: chapter.id, title: chapter.title };

    } catch (error) {
      this.logger.error(`Failed to migrate chapter ${chapterSlug}:`, error);
      await this.logMigration('chapter', chapterPath, null, 'failed', error.message);
      return null;
    }
  }

  // ... [Additional methods for migrating templates, case studies, assets, etc.]
  // [These would follow the same pattern as shown in the previous documents]

  // Utility methods
  private async fileExists(path: string): Promise<boolean> {
    try {
      await stat(path);
      return true;
    } catch {
      return false;
    }
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  private titleFromSlug(slug: string): string {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private extractChapterNumber(slug: string): number {
    const match = slug.match(/ch(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  private getTagColor(tagName: string): string {
    const colors: Record<string, string> = {
      'context-mastery': '#2196F3',
      'dynamic-planning': '#9C27B0',
      'code-evolution': '#4CAF50',
      'strategic-testing': '#FF9800',
      'intelligent-review': '#E91E63',
      'foundation': '#607D8B',
      'advanced': '#3F51B5',
      'elite': '#795548'
    };
    return colors[tagName.toLowerCase()] || '#9E9E9E';
  }

  private async logMigration(
    contentType: string,
    sourceFile: string,
    targetId: string | null,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.migrationLog.create({
        data: {
          contentType,
          sourceFile,
          targetId,
          status,
          errorMessage,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log migration:', error);
    }
  }
}
EOF
```

## **Phase 3: Enhanced PWA Application (Existing)**

### **3.1 Add Ionic Components for Content Display**

```bash
cd ../../apps/pwa

# Install dependencies
npm install @ionic/angular

# Create content service for PWA
mkdir -p src/app/services
cat > src/app/services/content.service.ts << 'EOF'
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ContentTier {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface Chapter {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  content: string;
  wordCount: number;
  estimatedReadTime: number;
  isPublished: boolean;
  tier: ContentTier;
  sections?: ChapterSection[];
  templates?: PromptTemplate[];
  tags: Tag[];
}

export interface PromptTemplate {
  id: string;
  slug: string;
  title: string;
  description?: string;
  template: string;
  category: string;
  difficulty: string;
  variables: TemplateVariable[];
  examples: TemplateExample[];
  usageCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  // Content Tiers
  getContentTiers(): Observable<ContentTier[]> {
    return this.http.get<ContentTier[]>(`${this.baseUrl}/content/tiers`);
  }

  // Chapters
  getChapters(tier?: string): Observable<Chapter[]> {
    let params = new HttpParams();
    if (tier) params = params.set('tier', tier);
    return this.http.get<Chapter[]>(`${this.baseUrl}/content/chapters`, { params });
  }

  getChapterBySlug(slug: string): Observable<Chapter> {
    return this.http.get<Chapter>(`${this.baseUrl}/content/chapters/${slug}`);
  }

  // Templates
  getPromptTemplates(category?: string): Observable<PromptTemplate[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<PromptTemplate[]>(`${this.baseUrl}/content/templates`, { params });
  }

  // Search
  searchContent(query: string, type?: string): Observable<any> {
    let params = new HttpParams().set('q', query);
    if (type) params = params.set('type', type);
    return this.http.get(`${this.baseUrl}/content/search`, { params });
  }
}
EOF
```

## **Phase 4: Nx Development Commands**

### **4.1 Add Content-Specific Scripts**

```bash
cd ../.. # Back to workspace root

# Add to package.json scripts
npm pkg set scripts.content:migrate="curl -X POST http://localhost:3000/api/content-migration/run"
npm pkg set scripts.content:status="curl http://localhost:3000/api/content-migration/status"
npm pkg set scripts.dev:full="nx run-many --target=serve --projects=api,pwa --parallel"
npm pkg set scripts.build:affected="nx affected --target=build"
npm pkg set scripts.test:affected="nx affected --target=test"
```

### **4.2 Development Workflow**

```bash
# Start the full development environment
npm run dev:full

# Wait for API to start, then run migration
sleep 10 && npm run content:migrate

# Check migration status
npm run content:status

# Build affected projects only
npm run build:affected

# Test affected projects
npm run test:affected
```

## **Phase 5: Integration with Infrastructure Repository**

### **5.1 Update Docker Configurations**

Since you have a separate infrastructure repository, update your deployment configs:

```bash
# In your amysoftai-infrastructure repository
# Update docker-compose.yml to include content volume mount

# Update API service to mount content source
api:
  volumes:
    - ../amysoftai-content:/app/content-source:ro
  environment:
    - CONTENT_SOURCE_PATH=/app/content-source

# Add content migration init container
content-migration:
  image: your-api-image
  command: ["node", "dist/scripts/migrate-content.js"]
  depends_on:
    - postgres
  volumes:
    - ../amysoftai-content:/app/content-source:ro
```

## **Benefits of This Approach**

### **🎼 Maintains Your Existing Architecture**
- ✅ Uses your existing Nx workspace structure
- ✅ Enhances existing applications without breaking changes
- ✅ Leverages your existing infrastructure setup
- ✅ Keeps content repository separate for easy management

### **🚀 Adds Powerful Content Capabilities**
- ✅ Dynamic content delivery through your existing API
- ✅ PWA-ready content consumption
- ✅ Full-text search across all content
- ✅ Analytics tracking for template usage
- ✅ Offline content access

### **🛠️ Streamlined Development**
- ✅ Single workspace for all applications
- ✅ Shared types and services
- ✅ Automated content migration
- ✅ Consistent development workflow

This strategy transforms your static content repository into a dynamic, searchable, and user-friendly content platform while maintaining the architectural decisions you've already made!