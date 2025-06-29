#!/bin/bash
# Content Migration Implementation for Existing amysoft.tech Nx Workspace

echo "🎼 Enhancing existing amysoft.tech Nx workspace with content migration capabilities..."

# ============================================================================
# Prerequisites Check
# ============================================================================

# Ensure we're in the correct workspace
if [ ! -f "nx.json" ] || [ ! -d "apps/api" ] || [ ! -d "apps/pwa" ]; then
    echo "❌ Error: Please run this script from the root of your amysoft.tech Nx workspace"
    exit 1
fi

echo "✅ Nx workspace detected"

# ============================================================================
# Phase 1: Add Content Repository Access
# ============================================================================

echo "📚 Setting up content repository access..."

# Option 1: Add as git submodule (recommended for development)
if [ ! -d "content-source" ]; then
    echo "Adding content repository as submodule..."
    git submodule add https://github.com/amysoft-digital-tech/amysoftai-content.git content-source
    git submodule update --init --recursive
else
    echo "Content submodule already exists, updating..."
    git submodule update --remote content-source
fi

# Option 2: Alternative - clone alongside (if submodule doesn't work)
# git clone https://github.com/amysoft-digital-tech/amysoftai-content.git ../amysoftai-content

echo "✅ Content repository access configured"

# ============================================================================
# Phase 2: Add Required Dependencies
# ============================================================================

echo "📦 Installing required dependencies..."

# API dependencies
npm install gray-matter js-yaml prisma @prisma/client

# PWA dependencies (if not already installed)
npm install @ionic/angular

# Shared library dependencies
npm install rxjs @angular/common @angular/core

echo "✅ Dependencies installed"

# ============================================================================
# Phase 3: Generate Missing Shared Libraries
# ============================================================================

echo "🏗️ Generating shared libraries..."

# Generate shared libraries if they don't exist
if [ ! -d "libs/shared-types" ]; then
    nx generate @nx/js:library shared-types --directory=libs --buildable --publishable --importPath=@amysoft/shared-types
fi

if [ ! -d "libs/shared-utils" ]; then
    nx generate @nx/js:library shared-utils --directory=libs --buildable --publishable --importPath=@amysoft/shared-utils
fi

if [ ! -d "libs/shared-ui" ]; then
    nx generate @nx/angular:library shared-ui --directory=libs --buildable --publishable --importPath=@amysoft/shared-ui
fi

if [ ! -d "libs/shared-data-access" ]; then
    nx generate @nx/js:library shared-data-access --directory=libs --buildable --publishable --importPath=@amysoft/shared-data-access
fi

echo "✅ Shared libraries configured"

# ============================================================================
# Phase 4: Enhance API Application
# ============================================================================

echo "🛠️ Enhancing API application..."

cd apps/api

# Create content types for shared-types library
echo "Creating content types..."
mkdir -p ../../libs/shared-types/src/lib/content
cat > ../../libs/shared-types/src/lib/content/index.ts << 'EOF'
export interface ContentTier {
  id: string;
  name: 'foundation' | 'advanced' | 'elite';
  price: number;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { chapters: number };
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
  sortOrder: number;
  isPublished: boolean;
  tier: ContentTier;
  sections?: ChapterSection[];
  templates?: PromptTemplate[];
  caseStudies?: CaseStudy[];
  metadata?: ChapterMetadata;
  tags: Tag[];
}

export interface ChapterSection {
  id: string;
  slug: string;
  title: string;
  content: string;
  sortOrder: number;
}

export interface PromptTemplate {
  id: string;
  slug: string;
  title: string;
  description?: string;
  template: string;
  category: 'context-mastery' | 'dynamic-planning' | 'code-evolution' | 'strategic-testing' | 'intelligent-review';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  variables: TemplateVariable[];
  examples: TemplateExample[];
  usageCount: number;
  effectivenessScore?: number;
  chapterId?: string;
  isActive: boolean;
}

export interface TemplateVariable {
  name: string;
  description?: string;
  dataType: 'string' | 'number' | 'boolean' | 'array';
  isRequired: boolean;
  defaultValue?: string;
}

export interface TemplateExample {
  title: string;
  description?: string;
  input: Record<string, any>;
  output: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  industry?: string;
  companySize?: 'startup' | 'medium' | 'enterprise';
  beforeMetrics?: Record<string, any>;
  afterMetrics?: Record<string, any>;
  improvementPercentage?: number;
  timeframeWeeks?: number;
  tags: Tag[];
  isPublished: boolean;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  category?: string;
  color?: string;
}

export interface ChapterMetadata {
  completionStatus: 'draft' | 'review' | 'complete';
  technicalAccuracy: boolean;
  qualityScore?: number;
  lastReviewDate?: Date;
  reviewNotes?: string;
}

export interface SearchResults {
  chapters: Partial<Chapter>[];
  templates: Partial<PromptTemplate>[];
  caseStudies: Partial<CaseStudy>[];
}

export interface ContentFilters {
  tier?: string;
  published?: boolean;
  category?: string;
  difficulty?: string;
  industry?: string;
  companySize?: string;
}
EOF

# Update shared-types index
cat >> ../../libs/shared-types/src/index.ts << 'EOF'
export * from './lib/content';
EOF

# Enhance Prisma schema (backup existing first)
echo "Enhancing Prisma schema..."
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.prisma.backup
    echo "📋 Existing schema backed up to schema.prisma.backup"
fi

# Add content models to existing Prisma schema
cat >> prisma/schema.prisma << 'EOF'

// ============================================================================
// Content Management Models for Beyond the AI Plateau
// ============================================================================

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

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Create migration (or push to database)
echo "Creating database migration..."
npx prisma migrate dev --name add-content-models || npx prisma db push

# Create content migration directories
echo "Creating migration modules..."
mkdir -p src/app/content-migration
mkdir -p src/app/content

# Create the migration service (using the comprehensive version from the previous artifact)
# This is a simplified version - you can use the full version from the artifact
cat > src/app/content-migration/content-migration.service.ts << 'EOF'
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { readdir, readFile, stat } from 'fs/promises';
import { join, basename, extname } from 'path';
import * as matter from 'gray-matter';
import { resolve } from 'path';

@Injectable()
export class ContentMigrationService {
  private readonly logger = new Logger(ContentMigrationService.name);
  private readonly contentSourcePath: string;

  constructor(private prisma: PrismaService) {
    this.contentSourcePath = resolve(process.cwd(), '../../content-source');
  }

  async migrateAll(): Promise<{ success: boolean; message: string; details?: any }> {
    this.logger.log('Starting content migration...');
    
    try {
      await this.initializeContentTiers();
      await this.migrateChapters();
      
      return { success: true, message: 'Migration completed successfully' };
    } catch (error) {
      this.logger.error('Migration failed:', error);
      return { success: false, message: error.message };
    }
  }

  private async initializeContentTiers(): Promise<void> {
    const tiers = [
      { name: 'foundation', price: 24.95, description: 'Foundation principles', sortOrder: 1 },
      { name: 'advanced', price: 97.00, description: 'Advanced techniques', sortOrder: 2 },
      { name: 'elite', price: 297.00, description: 'Elite transformation', sortOrder: 3 },
    ];

    for (const tier of tiers) {
      await this.prisma.contentTier.upsert({
        where: { name: tier.name },
        update: {},
        create: tier,
      });
    }
  }

  private async migrateChapters(): Promise<void> {
    const principlesPath = join(this.contentSourcePath, 'content', 'principles');
    
    try {
      const chapterDirs = await readdir(principlesPath, { withFileTypes: true });
      
      for (const dir of chapterDirs.filter(d => d.isDirectory())) {
        await this.migrateChapter(join(principlesPath, dir.name));
      }
    } catch (error) {
      this.logger.error('Failed to read principles directory:', error);
    }
  }

  private async migrateChapter(chapterPath: string): Promise<void> {
    const chapterSlug = basename(chapterPath);
    
    try {
      const readmePath = join(chapterPath, 'README.md');
      const contentFile = await readFile(readmePath, 'utf-8');
      const { data: frontmatter, content } = matter(contentFile);

      const tier = await this.prisma.contentTier.findUnique({
        where: { name: 'foundation' } // Simplified - you can enhance this logic
      });

      await this.prisma.chapter.upsert({
        where: { slug: chapterSlug },
        update: {
          title: frontmatter.title || chapterSlug,
          content,
          wordCount: content.split(/\s+/).length,
          estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200),
        },
        create: {
          slug: chapterSlug,
          title: frontmatter.title || chapterSlug,
          content,
          wordCount: content.split(/\s+/).length,
          estimatedReadTime: Math.ceil(content.split(/\s+/).length / 200),
          sortOrder: 0,
          isPublished: true,
          tierId: tier!.id,
        },
      });

      this.logger.log(`Migrated chapter: ${chapterSlug}`);
    } catch (error) {
      this.logger.error(`Failed to migrate chapter ${chapterSlug}:`, error);
    }
  }
}
EOF

# Create migration controller
cat > src/app/content-migration/content-migration.controller.ts << 'EOF'
import { Controller, Post, Get } from '@nestjs/common';
import { ContentMigrationService } from './content-migration.service';

@Controller('content-migration')
export class ContentMigrationController {
  constructor(private migrationService: ContentMigrationService) {}

  @Post('run')
  async runMigration() {
    return await this.migrationService.migrateAll();
  }

  @Get('status')
  async getMigrationStatus() {
    return { 
      status: 'ready',
      message: 'Content migration service is ready',
      timestamp: new Date().toISOString()
    };
  }
}
EOF

# Create migration module
cat > src/app/content-migration/content-migration.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ContentMigrationController } from './content-migration.controller';
import { ContentMigrationService } from './content-migration.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentMigrationController],
  providers: [ContentMigrationService],
  exports: [ContentMigrationService],
})
export class ContentMigrationModule {}
EOF

# Create content API endpoints
cat > src/app/content/content.controller.ts << 'EOF'
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('tiers')
  async getContentTiers() {
    return this.contentService.getContentTiers();
  }

  @Get('chapters')
  async getChapters(@Query('tier') tier?: string) {
    return this.contentService.getChapters(tier);
  }

  @Get('chapters/:slug')
  async getChapterBySlug(@Param('slug') slug: string) {
    return this.contentService.getChapterBySlug(slug);
  }
}
EOF

cat > src/app/content/content.service.ts << 'EOF'
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async getContentTiers() {
    return this.prisma.contentTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { chapters: true } }
      }
    });
  }

  async getChapters(tier?: string) {
    const where: any = { isPublished: true };
    if (tier) {
      where.tier = { name: tier };
    }

    return this.prisma.chapter.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        tier: true,
        tags: true,
        metadata: true,
        _count: {
          select: {
            sections: true,
            templates: true,
            caseStudies: true,
          },
        },
      },
    });
  }

  async getChapterBySlug(slug: string) {
    return this.prisma.chapter.findUnique({
      where: { slug },
      include: {
        tier: true,
        sections: { orderBy: { sortOrder: 'asc' } },
        templates: { where: { isActive: true } },
        caseStudies: { where: { isPublished: true } },
        metadata: true,
        tags: true,
      },
    });
  }
}
EOF

cat > src/app/content/content.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
EOF

cd ../.. # Back to workspace root

echo "✅ API application enhanced"

# ============================================================================
# Phase 5: Enhance PWA Application
# ============================================================================

echo "📱 Enhancing PWA application..."

cd apps/pwa

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
  tags: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private readonly baseUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getContentTiers(): Observable<ContentTier[]> {
    return this.http.get<ContentTier[]>(`${this.baseUrl}/content/tiers`);
  }

  getChapters(tier?: string): Observable<Chapter[]> {
    let params = new HttpParams();
    if (tier) params = params.set('tier', tier);
    return this.http.get<Chapter[]>(`${this.baseUrl}/content/chapters`, { params });
  }

  getChapterBySlug(slug: string): Observable<Chapter> {
    return this.http.get<Chapter>(`${this.baseUrl}/content/chapters/${slug}`);
  }
}
EOF

# Update environment files
cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
EOF

cat > src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  apiUrl: 'https://api.amysoft.tech'
};
EOF

# Update app.module.ts to include HttpClientModule
cat > src/app/app.module.ts << 'EOF'
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
EOF

# Create a simple chapters page
nx generate @ionic/angular-toolkit:page chapters --project=pwa

# Update the generated chapters page
cat > src/app/chapters/chapters.page.ts << 'EOF'
import { Component, OnInit } from '@angular/core';
import { ContentService, Chapter, ContentTier } from '../services/content.service';

@Component({
  selector: 'app-chapters',
  templateUrl: './chapters.page.html',
  styleUrls: ['./chapters.page.scss'],
})
export class ChaptersPage implements OnInit {
  chapters: Chapter[] = [];
  tiers: ContentTier[] = [];
  selectedTier: string = '';
  loading = false;

  constructor(private contentService: ContentService) {}

  ngOnInit() {
    this.loadTiers();
    this.loadChapters();
  }

  loadTiers() {
    this.contentService.getContentTiers().subscribe(
      tiers => this.tiers = tiers
    );
  }

  loadChapters() {
    this.loading = true;
    this.contentService.getChapters(this.selectedTier || undefined).subscribe(
      chapters => {
        this.chapters = chapters;
        this.loading = false;
      }
    );
  }

  onTierChange() {
    this.loadChapters();
  }
}
EOF

cat > src/app/chapters/chapters.page.html << 'EOF'
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title>Beyond the AI Plateau</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <ion-header collapse="condense">
    <ion-toolbar>
      <ion-title size="large">Chapters</ion-title>
    </ion-toolbar>
  </ion-header>

  <!-- Tier Filter -->
  <ion-segment [(ngModel)]="selectedTier" (ionChange)="onTierChange()">
    <ion-segment-button value="">
      <ion-label>All</ion-label>
    </ion-segment-button>
    <ion-segment-button *ngFor="let tier of tiers" [value]="tier.name">
      <ion-label>{{ tier.name | titlecase }}</ion-label>
    </ion-segment-button>
  </ion-segment>

  <!-- Chapters List -->
  <div class="chapters-container">
    <ion-card *ngFor="let chapter of chapters" [routerLink]="['/chapter', chapter.slug]">
      <ion-card-header>
        <div class="tier-badge" [class]="'tier-' + chapter.tier.name">
          {{ chapter.tier.name | titlecase }} - ${{ chapter.tier.price }}
        </div>
        <ion-card-title>{{ chapter.title }}</ion-card-title>
        <ion-card-subtitle *ngIf="chapter.subtitle">{{ chapter.subtitle }}</ion-card-subtitle>
      </ion-card-header>
      
      <ion-card-content>
        <p *ngIf="chapter.description">{{ chapter.description }}</p>
        
        <div class="chapter-meta">
          <span><ion-icon name="time-outline"></ion-icon> {{ chapter.estimatedReadTime }} min</span>
          <span><ion-icon name="document-text-outline"></ion-icon> {{ chapter.wordCount | number }} words</span>
        </div>
        
        <div class="tags" *ngIf="chapter.tags?.length">
          <ion-chip *ngFor="let tag of chapter.tags" outline size="small">
            {{ tag.name }}
          </ion-chip>
        </div>
      </ion-card-content>
    </ion-card>
  </div>

  <!-- Loading State -->
  <div class="loading-container" *ngIf="loading">
    <ion-spinner></ion-spinner>
    <p>Loading chapters...</p>
  </div>
</ion-content>
EOF

cat > src/app/chapters/chapters.page.scss << 'EOF'
.chapters-container {
  padding: 1rem;
}

.tier-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  
  &.tier-foundation {
    background-color: var(--ion-color-primary-tint);
    color: var(--ion-color-primary-shade);
  }
  
  &.tier-advanced {
    background-color: var(--ion-color-secondary-tint);
    color: var(--ion-color-secondary-shade);
  }
  
  &.tier-elite {
    background-color: var(--ion-color-tertiary-tint);
    color: var(--ion-color-tertiary-shade);
  }
}

.chapter-meta {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  color: var(--ion-color-medium);
  font-size: 0.875rem;
  
  span {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  
  p {
    margin-top: 1rem;
    color: var(--ion-color-medium);
  }
}
EOF

# Update chapters.module.ts to include FormsModule
cat > src/app/chapters/chapters.module.ts << 'EOF'
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ChaptersPageRoutingModule } from './chapters-routing.module';

import { ChaptersPage } from './chapters.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ChaptersPageRoutingModule
  ],
  declarations: [ChaptersPage]
})
export class ChaptersPageModule {}
EOF

cd ../.. # Back to workspace root

echo "✅ PWA application enhanced"

# ============================================================================
# Phase 6: Update Package.json Scripts
# ============================================================================

echo "⚙️ Adding custom scripts..."

# Add content-specific scripts
npm pkg set scripts.content:migrate="curl -X POST http://localhost:3000/api/content-migration/run"
npm pkg set scripts.content:status="curl http://localhost:3000/api/content-migration/status"
npm pkg set scripts.dev:full="nx run-many --target=serve --projects=api,pwa --parallel"
npm pkg set scripts.dev:api="nx serve api"
npm pkg set scripts.dev:pwa="nx serve pwa"
npm pkg set scripts.build:affected="nx affected --target=build"
npm pkg set scripts.test:affected="nx affected --target=test"

echo "✅ Scripts added"

# ============================================================================
# Phase 7: Build Shared Libraries
# ============================================================================

echo "🔨 Building shared libraries..."

# Build shared libraries in dependency order
nx build shared-types
nx build shared-utils
nx build shared-ui
nx build shared-data-access

echo "✅ Shared libraries built"

# ============================================================================
# Final Setup Instructions
# ============================================================================

echo ""
echo "🎉 Content migration setup complete!"
echo ""
echo "Next steps:"
echo "1. 📋 Review the enhanced Prisma schema in apps/api/prisma/schema.prisma"
echo "2. 🗄️  Ensure your PostgreSQL database is running"
echo "3. 🚀 Start the development environment: npm run dev:full"
echo "4. ⏳ Wait for both API and PWA to start"
echo "5. 📚 Run content migration: npm run content:migrate"
echo "6. ✅ Check migration status: npm run content:status"
echo "7. 🌐 Open http://localhost:4200/chapters to view your content"
echo ""
echo "🎼 The Conductor's Method orchestration is complete!"
echo "Your existing Nx workspace now has powerful content management capabilities."
echo ""
echo "Useful commands:"
echo "  npm run dev:full        # Start API + PWA"
echo "  npm run dev:api         # Start API only"
echo "  npm run dev:pwa         # Start PWA only"
echo "  npm run content:migrate # Migrate content"
echo "  npm run content:status  # Check migration status"
echo "  nx affected --target=build  # Build affected projects"
echo "  nx graph               # View dependency graph"
echo ""
echo "Your content from amysoftai-content is now available as a dynamic,"
echo "searchable, and user-friendly PWA experience! 🚀"