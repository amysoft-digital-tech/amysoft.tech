// src/migration/migration.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import * as matter from 'gray-matter';
import * as yaml from 'yaml';

interface ChapterFrontmatter {
  title: string;
  subtitle?: string;
  description?: string;
  tier: 'foundation' | 'advanced' | 'elite';
  sortOrder: number;
  tags?: string[];
  wordCount?: number;
  estimatedReadTime?: number;
  isPublished?: boolean;
  completionStatus?: string;
}

interface PromptTemplateFrontmatter {
  title: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  usageContext?: string;
  expectedOutcome?: string;
  variables?: Array<{
    name: string;
    description?: string;
    dataType?: string;
    isRequired?: boolean;
    defaultValue?: string;
  }>;
  examples?: Array<{
    title: string;
    description?: string;
    input: Record<string, any>;
    output: string;
  }>;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private readonly repoPath: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.repoPath = this.config.get<string>('CONTENT_REPO_PATH') || './amysoftai-content';
  }

  async migrateAll(): Promise<void> {
    this.logger.log('Starting full content migration...');
    
    try {
      await this.initializeContentTiers();
      await this.migrateChapters();
      await this.migratePromptTemplates();
      await this.migrateCaseStudies();
      await this.migrateAssets();
      await this.establishRelationships();
      
      this.logger.log('Migration completed successfully');
    } catch (error) {
      this.logger.error('Migration failed', error);
      throw error;
    }
  }

  private async initializeContentTiers(): Promise<void> {
    this.logger.log('Initializing content tiers...');
    
    const tiers = [
      { name: 'foundation', price: 24.95, description: 'Foundation principles and core concepts', sortOrder: 1 },
      { name: 'advanced', price: 97.00, description: 'Advanced techniques and implementations', sortOrder: 2 },
      { name: 'elite', price: 297.00, description: 'Elite transformation and mastery', sortOrder: 3 },
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
    this.logger.log('Migrating chapters...');
    
    const principlesPath = join(this.repoPath, 'content', 'principles');
    const chapterDirs = await readdir(principlesPath, { withFileTypes: true });
    
    for (const dir of chapterDirs.filter(d => d.isDirectory())) {
      await this.migrateChapter(join(principlesPath, dir.name));
    }
  }

  private async migrateChapter(chapterPath: string): Promise<void> {
    const chapterSlug = basename(chapterPath);
    this.logger.log(`Migrating chapter: ${chapterSlug}`);

    try {
      // Read main chapter content
      const contentPath = join(chapterPath, 'README.md');
      const contentExists = await this.fileExists(contentPath);
      
      if (!contentExists) {
        this.logger.warn(`No README.md found for chapter: ${chapterSlug}`);
        return;
      }

      const contentFile = await readFile(contentPath, 'utf-8');
      const { data: frontmatter, content } = matter(contentFile) as {
        data: ChapterFrontmatter;
        content: string;
      };

      // Get or create content tier
      const tier = await this.prisma.contentTier.findUnique({
        where: { name: frontmatter.tier || 'foundation' }
      });

      if (!tier) {
        throw new Error(`Content tier not found: ${frontmatter.tier}`);
      }

      // Create chapter
      const chapter = await this.prisma.chapter.upsert({
        where: { slug: chapterSlug },
        update: {
          title: frontmatter.title,
          subtitle: frontmatter.subtitle,
          description: frontmatter.description,
          content,
          wordCount: this.countWords(content),
          estimatedReadTime: Math.ceil(this.countWords(content) / 200), // 200 words per minute
          sortOrder: frontmatter.sortOrder || 0,
          isPublished: frontmatter.isPublished || false,
        },
        create: {
          slug: chapterSlug,
          title: frontmatter.title,
          subtitle: frontmatter.subtitle,
          description: frontmatter.description,
          content,
          wordCount: this.countWords(content),
          estimatedReadTime: Math.ceil(this.countWords(content) / 200),
          sortOrder: frontmatter.sortOrder || 0,
          isPublished: frontmatter.isPublished || false,
          tierId: tier.id,
        },
      });

      // Create chapter metadata
      await this.prisma.chapterMetadata.upsert({
        where: { chapterId: chapter.id },
        update: {
          completionStatus: frontmatter.completionStatus || 'draft',
        },
        create: {
          chapterId: chapter.id,
          completionStatus: frontmatter.completionStatus || 'draft',
        },
      });

      // Process chapter sections
      await this.migrateChapterSections(chapterPath, chapter.id);

      // Process tags
      if (frontmatter.tags && frontmatter.tags.length > 0) {
        for (const tagName of frontmatter.tags) {
          const tag = await this.prisma.tag.upsert({
            where: { name: tagName },
            update: {},
            create: { name: tagName, category: 'principle' },
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

      await this.logMigration('chapter', chapterPath, chapter.id, 'success');
      
    } catch (error) {
      this.logger.error(`Failed to migrate chapter ${chapterSlug}:`, error);
      await this.logMigration('chapter', chapterPath, null, 'failed', error.message);
    }
  }

  private async migrateChapterSections(chapterPath: string, chapterId: string): Promise<void> {
    const sectionsPath = join(chapterPath, 'sections');
    const sectionsExist = await this.fileExists(sectionsPath);
    
    if (!sectionsExist) return;

    const sectionFiles = await readdir(sectionsPath);
    const mdFiles = sectionFiles.filter(f => extname(f) === '.md');

    for (const [index, file] of mdFiles.entries()) {
      const sectionPath = join(sectionsPath, file);
      const sectionContent = await readFile(sectionPath, 'utf-8');
      const { data: frontmatter, content } = matter(sectionContent);
      
      const slug = basename(file, '.md');
      
      await this.prisma.chapterSection.upsert({
        where: { chapterId_slug: { chapterId, slug } },
        update: {
          title: frontmatter.title || this.titleFromSlug(slug),
          content,
          sortOrder: frontmatter.sortOrder || index,
        },
        create: {
          chapterId,
          slug,
          title: frontmatter.title || this.titleFromSlug(slug),
          content,
          sortOrder: frontmatter.sortOrder || index,
        },
      });
    }
  }

  private async migratePromptTemplates(): Promise<void> {
    this.logger.log('Migrating prompt templates...');
    
    const templatesPath = join(this.repoPath, 'content', 'templates');
    const categoryDirs = await readdir(templatesPath, { withFileTypes: true });
    
    for (const dir of categoryDirs.filter(d => d.isDirectory())) {
      await this.migrateTemplateCategory(join(templatesPath, dir.name), dir.name);
    }
  }

  private async migrateTemplateCategory(categoryPath: string, category: string): Promise<void> {
    const templateFiles = await readdir(categoryPath);
    const mdFiles = templateFiles.filter(f => extname(f) === '.md');

    for (const file of mdFiles) {
      const templatePath = join(categoryPath, file);
      const templateContent = await readFile(templatePath, 'utf-8');
      const { data: frontmatter, content } = matter(templateContent) as {
        data: PromptTemplateFrontmatter;
        content: string;
      };

      const slug = `${category}-${basename(file, '.md')}`;

      try {
        const template = await this.prisma.promptTemplate.upsert({
          where: { slug },
          update: {
            title: frontmatter.title,
            description: frontmatter.description,
            template: content,
            category,
            difficulty: frontmatter.difficulty || 'beginner',
            usageContext: frontmatter.usageContext,
            expectedOutcome: frontmatter.expectedOutcome,
          },
          create: {
            slug,
            title: frontmatter.title,
            description: frontmatter.description,
            template: content,
            category,
            difficulty: frontmatter.difficulty || 'beginner',
            usageContext: frontmatter.usageContext,
            expectedOutcome: frontmatter.expectedOutcome,
          },
        });

        // Migrate template variables
        if (frontmatter.variables) {
          for (const variable of frontmatter.variables) {
            await this.prisma.templateVariable.upsert({
              where: { templateId_name: { templateId: template.id, name: variable.name } },
              update: {
                description: variable.description,
                dataType: variable.dataType || 'string',
                isRequired: variable.isRequired !== false,
                defaultValue: variable.defaultValue,
              },
              create: {
                templateId: template.id,
                name: variable.name,
                description: variable.description,
                dataType: variable.dataType || 'string',
                isRequired: variable.isRequired !== false,
                defaultValue: variable.defaultValue,
              },
            });
          }
        }

        // Migrate template examples
        if (frontmatter.examples) {
          // Clear existing examples
          await this.prisma.templateExample.deleteMany({
            where: { templateId: template.id },
          });

          // Create new examples
          for (const example of frontmatter.examples) {
            await this.prisma.templateExample.create({
              data: {
                templateId: template.id,
                title: example.title,
                description: example.description,
                input: example.input,
                output: example.output,
              },
            });
          }
        }

        await this.logMigration('prompt_template', templatePath, template.id, 'success');
        
      } catch (error) {
        this.logger.error(`Failed to migrate template ${slug}:`, error);
        await this.logMigration('prompt_template', templatePath, null, 'failed', error.message);
      }
    }
  }

  private async migrateCaseStudies(): Promise<void> {
    this.logger.log('Migrating case studies...');
    
    const caseStudiesPath = join(this.repoPath, 'content', 'case-studies');
    const caseStudiesExist = await this.fileExists(caseStudiesPath);
    
    if (!caseStudiesExist) {
      this.logger.warn('Case studies directory not found');
      return;
    }

    const studyFiles = await readdir(caseStudiesPath);
    const mdFiles = studyFiles.filter(f => extname(f) === '.md');

    for (const file of mdFiles) {
      const studyPath = join(caseStudiesPath, file);
      const studyContent = await readFile(studyPath, 'utf-8');
      const { data: frontmatter, content } = matter(studyContent);

      const slug = basename(file, '.md');

      try {
        await this.prisma.caseStudy.upsert({
          where: { slug },
          update: {
            title: frontmatter.title,
            description: frontmatter.description,
            content,
            industry: frontmatter.industry,
            companySize: frontmatter.companySize,
            beforeMetrics: frontmatter.beforeMetrics,
            afterMetrics: frontmatter.afterMetrics,
            improvementPercentage: frontmatter.improvementPercentage,
            timeframeWeeks: frontmatter.timeframeWeeks,
            isPublished: frontmatter.isPublished || false,
          },
          create: {
            slug,
            title: frontmatter.title,
            description: frontmatter.description,
            content,
            industry: frontmatter.industry,
            companySize: frontmatter.companySize,
            beforeMetrics: frontmatter.beforeMetrics,
            afterMetrics: frontmatter.afterMetrics,
            improvementPercentage: frontmatter.improvementPercentage,
            timeframeWeeks: frontmatter.timeframeWeeks,
            isPublished: frontmatter.isPublished || false,
          },
        });

        await this.logMigration('case_study', studyPath, slug, 'success');
        
      } catch (error) {
        this.logger.error(`Failed to migrate case study ${slug}:`, error);
        await this.logMigration('case_study', studyPath, null, 'failed', error.message);
      }
    }
  }

  private async migrateAssets(): Promise<void> {
    this.logger.log('Migrating assets...');
    
    const assetsPath = join(this.repoPath, 'assets');
    const assetsExist = await this.fileExists(assetsPath);
    
    if (!assetsExist) {
      this.logger.warn('Assets directory not found');
      return;
    }

    const assetTypes = ['diagrams', 'images', 'interactive'];
    
    for (const assetType of assetTypes) {
      const typeDir = join(assetsPath, assetType);
      const typeDirExists = await this.fileExists(typeDir);
      
      if (!typeDirExists) continue;

      const files = await readdir(typeDir);
      
      for (const file of files) {
        const filePath = join(typeDir, file);
        const stats = await stat(filePath);
        
        if (stats.isFile()) {
          try {
            const slug = `${assetType}-${basename(file, extname(file))}`;
            
            await this.prisma.asset.upsert({
              where: { filename: file },
              update: {
                path: filePath,
                size: stats.size,
                assetType: this.mapAssetType(assetType),
              },
              create: {
                filename: file,
                originalName: file,
                path: filePath,
                mimeType: this.getMimeType(extname(file)),
                size: stats.size,
                assetType: this.mapAssetType(assetType),
              },
            });

            await this.logMigration('asset', filePath, file, 'success');
            
          } catch (error) {
            this.logger.error(`Failed to migrate asset ${file}:`, error);
            await this.logMigration('asset', filePath, null, 'failed', error.message);
          }
        }
      }
    }
  }

  private async establishRelationships(): Promise<void> {
    this.logger.log('Establishing content relationships...');
    
    // Connect templates to chapters based on categories
    const chapters = await this.prisma.chapter.findMany();
    const templates = await this.prisma.promptTemplate.findMany();

    for (const template of templates) {
      // Map template categories to chapter slugs
      const chapterMappings: Record<string, string[]> = {
        'context-mastery': ['ch03-context-mastery'],
        'dynamic-planning': ['ch04-dynamic-planning'],
        'code-evolution': ['ch05-code-evolution'],
        'strategic-testing': ['ch06-strategic-testing'],
        'intelligent-review': ['ch07-intelligent-review'],
      };

      const targetChapterSlugs = chapterMappings[template.category];
      if (targetChapterSlugs) {
        for (const slug of targetChapterSlugs) {
          const chapter = chapters.find(c => c.slug === slug);
          if (chapter) {
            await this.prisma.promptTemplate.update({
              where: { id: template.id },
              data: { chapterId: chapter.id },
            });
          }
        }
      }
    }
  }

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

  private mapAssetType(assetType: string): string {
    const mapping: Record<string, string> = {
      diagrams: 'DIAGRAM',
      images: 'IMAGE',
      interactive: 'INTERACTIVE',
    };
    return mapping[assetType] || 'IMAGE';
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.html': 'text/html',
    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  private async logMigration(
    contentType: string,
    sourceFile: string,
    targetId: string | null,
    status: string,
    errorMessage?: string,
  ): Promise<void> {
    await this.prisma.migrationLog.create({
      data: {
        contentType,
        sourceFile,
        targetId,
        status,
        errorMessage,
      },
    });
  }
}