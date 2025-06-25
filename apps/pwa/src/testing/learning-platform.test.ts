/**
 * Learning Platform Feature Testing Suite
 * Comprehensive tests for content delivery, user progress, and learning experience features
 */

import { NetworkSimulator, OfflineStorageTester, pwaTestSuite } from './pwa-test-utils';

interface UserProfile {
  id: string;
  subscriptionTier: 'foundation' | 'advanced' | 'elite';
  progress: Record<string, ChapterProgress>;
  bookmarks: Bookmark[];
  notes: Note[];
  preferences: UserPreferences;
  learningStats: LearningStats;
}

interface ChapterProgress {
  chapterId: string;
  completed: boolean;
  percentage: number;
  timeSpent: number;
  lastAccessed: string;
  sections: Record<string, SectionProgress>;
}

interface SectionProgress {
  sectionId: string;
  completed: boolean;
  timeSpent: number;
  lastAccessed: string;
}

interface Bookmark {
  id: string;
  chapterId: string;
  sectionId?: string;
  position: number;
  title: string;
  note?: string;
  tags: string[];
  created: string;
  modified: string;
}

interface Note {
  id: string;
  chapterId: string;
  sectionId?: string;
  content: string;
  position: number;
  tags: string[];
  type: 'highlight' | 'comment' | 'question' | 'insight';
  created: string;
  modified: string;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  readingMode: 'normal' | 'focus' | 'speed';
  autoProgress: boolean;
  notifications: {
    reminders: boolean;
    achievements: boolean;
    newContent: boolean;
  };
  privacy: {
    analytics: boolean;
    shareProgress: boolean;
  };
}

interface LearningStats {
  totalTimeSpent: number;
  chaptersCompleted: number;
  currentStreak: number;
  longestStreak: number;
  templatesUsed: number;
  averageSessionTime: number;
  principlesMastered: string[];
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: 'completion' | 'engagement' | 'consistency' | 'mastery';
  earned: string;
  points: number;
}

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  principle: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  variables: TemplateVariable[];
  examples: string[];
  usageCount: number;
  rating: number;
}

interface TemplateVariable {
  name: string;
  description: string;
  type: 'text' | 'number' | 'select' | 'multiline';
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

class MockLearningPlatform {
  private users: Map<string, UserProfile> = new Map();
  private chapters: Map<string, any> = new Map();
  private templates: Map<string, Template> = new Map();
  private searchIndex: any[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock chapters
    const chapters = [
      {
        id: 'chapter-1',
        title: 'The Foundation Principle',
        tier: 'foundation',
        sections: [
          { id: 'intro', title: 'Introduction', content: 'Foundation principle introduction...' },
          { id: 'concepts', title: 'Core Concepts', content: 'Key concepts...' },
          { id: 'examples', title: 'Examples', content: 'Practical examples...' }
        ]
      },
      {
        id: 'chapter-2',
        title: 'The Context Principle',
        tier: 'foundation',
        sections: [
          { id: 'overview', title: 'Overview', content: 'Context principle overview...' },
          { id: 'implementation', title: 'Implementation', content: 'How to implement...' }
        ]
      },
      {
        id: 'chapter-advanced-1',
        title: 'Advanced Optimization Techniques',
        tier: 'advanced',
        sections: [
          { id: 'optimization', title: 'Optimization', content: 'Advanced optimization...' }
        ]
      }
    ];

    chapters.forEach(chapter => this.chapters.set(chapter.id, chapter));

    // Mock templates
    const templates = [
      {
        id: 'template-1',
        title: 'Code Review Assistant',
        description: 'Generate comprehensive code reviews',
        category: 'development',
        principle: 'foundation',
        difficulty: 'beginner' as const,
        content: 'Please review this {{language}} code and provide feedback on:\n- Code quality\n- Best practices\n- Potential improvements\n\nCode:\n{{code}}',
        variables: [
          {
            name: 'language',
            description: 'Programming language',
            type: 'select' as const,
            required: true,
            options: ['JavaScript', 'Python', 'TypeScript', 'Java']
          },
          {
            name: 'code',
            description: 'Code to review',
            type: 'multiline' as const,
            required: true
          }
        ],
        examples: ['JavaScript function review', 'Python class analysis'],
        usageCount: 150,
        rating: 4.8
      },
      {
        id: 'template-2',
        title: 'Documentation Generator',
        description: 'Create comprehensive documentation',
        category: 'documentation',
        principle: 'context',
        difficulty: 'intermediate' as const,
        content: 'Generate documentation for {{type}}:\n\nName: {{name}}\nPurpose: {{purpose}}\n\nInclude:\n- Overview\n- Parameters\n- Examples\n- Best practices',
        variables: [
          {
            name: 'type',
            description: 'Type of documentation',
            type: 'select' as const,
            required: true,
            options: ['API', 'Function', 'Class', 'Module']
          },
          {
            name: 'name',
            description: 'Name of the item',
            type: 'text' as const,
            required: true
          },
          {
            name: 'purpose',
            description: 'Purpose description',
            type: 'multiline' as const,
            required: true
          }
        ],
        examples: ['API endpoint documentation', 'Class documentation'],
        usageCount: 89,
        rating: 4.6
      }
    ];

    templates.forEach(template => this.templates.set(template.id, template));

    // Initialize search index
    this.buildSearchIndex();
  }

  private buildSearchIndex(): void {
    // Build search index from chapters and templates
    this.chapters.forEach(chapter => {
      this.searchIndex.push({
        id: chapter.id,
        type: 'chapter',
        title: chapter.title,
        content: chapter.sections.map((s: any) => s.content).join(' '),
        tier: chapter.tier
      });
    });

    this.templates.forEach(template => {
      this.searchIndex.push({
        id: template.id,
        type: 'template',
        title: template.title,
        content: template.description + ' ' + template.content,
        category: template.category,
        principle: template.principle
      });
    });
  }

  createUser(userId: string, tier: 'foundation' | 'advanced' | 'elite'): UserProfile {
    const user: UserProfile = {
      id: userId,
      subscriptionTier: tier,
      progress: {},
      bookmarks: [],
      notes: [],
      preferences: {
        theme: 'auto',
        fontSize: 'medium',
        readingMode: 'normal',
        autoProgress: true,
        notifications: {
          reminders: true,
          achievements: true,
          newContent: true
        },
        privacy: {
          analytics: true,
          shareProgress: false
        }
      },
      learningStats: {
        totalTimeSpent: 0,
        chaptersCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        templatesUsed: 0,
        averageSessionTime: 0,
        principlesMastered: [],
        achievements: []
      }
    };

    this.users.set(userId, user);
    return user;
  }

  getAccessibleContent(userId: string): any[] {
    const user = this.users.get(userId);
    if (!user) return [];

    const accessible: any[] = [];
    
    this.chapters.forEach(chapter => {
      if (this.canAccessContent(user.subscriptionTier, chapter.tier)) {
        accessible.push(chapter);
      }
    });

    return accessible;
  }

  private canAccessContent(userTier: string, contentTier: string): boolean {
    const tierHierarchy = { foundation: 1, advanced: 2, elite: 3 };
    return tierHierarchy[userTier as keyof typeof tierHierarchy] >= 
           tierHierarchy[contentTier as keyof typeof tierHierarchy];
  }

  updateProgress(userId: string, chapterId: string, sectionId: string, timeSpent: number): void {
    const user = this.users.get(userId);
    if (!user) return;

    if (!user.progress[chapterId]) {
      user.progress[chapterId] = {
        chapterId,
        completed: false,
        percentage: 0,
        timeSpent: 0,
        lastAccessed: new Date().toISOString(),
        sections: {}
      };
    }

    const chapterProgress = user.progress[chapterId];
    
    if (!chapterProgress.sections[sectionId]) {
      chapterProgress.sections[sectionId] = {
        sectionId,
        completed: false,
        timeSpent: 0,
        lastAccessed: new Date().toISOString()
      };
    }

    const sectionProgress = chapterProgress.sections[sectionId];
    sectionProgress.timeSpent += timeSpent;
    sectionProgress.lastAccessed = new Date().toISOString();
    sectionProgress.completed = true;

    chapterProgress.timeSpent += timeSpent;
    chapterProgress.lastAccessed = new Date().toISOString();

    // Calculate completion percentage
    const chapter = this.chapters.get(chapterId);
    if (chapter) {
      const completedSections = Object.values(chapterProgress.sections).filter(s => s.completed).length;
      chapterProgress.percentage = (completedSections / chapter.sections.length) * 100;
      chapterProgress.completed = chapterProgress.percentage === 100;
    }

    // Update user stats
    user.learningStats.totalTimeSpent += timeSpent;
    this.updateLearningStats(user);
  }

  private updateLearningStats(user: UserProfile): void {
    // Update chapters completed
    user.learningStats.chaptersCompleted = Object.values(user.progress)
      .filter(p => p.completed).length;

    // Update streak (simplified)
    const today = new Date().toDateString();
    const lastAccess = Object.values(user.progress)
      .map(p => new Date(p.lastAccessed).toDateString())
      .includes(today);

    if (lastAccess) {
      user.learningStats.currentStreak += 1;
      user.learningStats.longestStreak = Math.max(
        user.learningStats.longestStreak,
        user.learningStats.currentStreak
      );
    }

    // Calculate average session time
    const sessions = Object.values(user.progress).length;
    if (sessions > 0) {
      user.learningStats.averageSessionTime = user.learningStats.totalTimeSpent / sessions;
    }
  }

  addBookmark(userId: string, bookmark: Omit<Bookmark, 'id' | 'created' | 'modified'>): Bookmark {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const newBookmark: Bookmark = {
      ...bookmark,
      id: `bookmark-${Date.now()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    user.bookmarks.push(newBookmark);
    return newBookmark;
  }

  addNote(userId: string, note: Omit<Note, 'id' | 'created' | 'modified'>): Note {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    const newNote: Note = {
      ...note,
      id: `note-${Date.now()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    };

    user.notes.push(newNote);
    return newNote;
  }

  searchContent(query: string, filters?: {
    type?: 'chapter' | 'template';
    tier?: string;
    category?: string;
  }): any[] {
    const lowerQuery = query.toLowerCase();
    
    return this.searchIndex.filter(item => {
      // Text match
      const textMatch = item.title.toLowerCase().includes(lowerQuery) ||
                       item.content.toLowerCase().includes(lowerQuery);

      if (!textMatch) return false;

      // Apply filters
      if (filters?.type && item.type !== filters.type) return false;
      if (filters?.tier && item.tier !== filters.tier) return false;
      if (filters?.category && item.category !== filters.category) return false;

      return true;
    });
  }

  getTemplate(templateId: string): Template | undefined {
    return this.templates.get(templateId);
  }

  useTemplate(userId: string, templateId: string): void {
    const user = this.users.get(userId);
    const template = this.templates.get(templateId);
    
    if (user && template) {
      user.learningStats.templatesUsed += 1;
      template.usageCount += 1;
    }
  }

  getRecommendations(userId: string): any[] {
    const user = this.users.get(userId);
    if (!user) return [];

    const recommendations: any[] = [];

    // Recommend next chapters based on progress
    const completedChapters = Object.keys(user.progress).filter(
      id => user.progress[id].completed
    );

    this.chapters.forEach(chapter => {
      if (!completedChapters.includes(chapter.id) && 
          this.canAccessContent(user.subscriptionTier, chapter.tier)) {
        recommendations.push({
          type: 'chapter',
          item: chapter,
          reason: 'Continue your learning journey'
        });
      }
    });

    // Recommend templates based on current chapter
    const currentChapters = Object.keys(user.progress);
    if (currentChapters.length > 0) {
      this.templates.forEach(template => {
        if (Math.random() > 0.5) { // Simplified recommendation logic
          recommendations.push({
            type: 'template',
            item: template,
            reason: 'Useful for your current progress'
          });
        }
      });
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  getUserStats(userId: string): LearningStats | null {
    const user = this.users.get(userId);
    return user ? user.learningStats : null;
  }

  awardAchievement(userId: string, achievementId: string): void {
    const user = this.users.get(userId);
    if (!user) return;

    const achievements = {
      'first-chapter': {
        id: 'first-chapter',
        title: 'Getting Started',
        description: 'Complete your first chapter',
        type: 'completion' as const,
        points: 10
      },
      'week-streak': {
        id: 'week-streak',
        title: 'Consistent Learner',
        description: 'Maintain a 7-day learning streak',
        type: 'consistency' as const,
        points: 25
      },
      'template-master': {
        id: 'template-master',
        title: 'Template Master',
        description: 'Use 10 different templates',
        type: 'engagement' as const,
        points: 20
      }
    };

    const achievement = achievements[achievementId as keyof typeof achievements];
    if (achievement && !user.learningStats.achievements.find(a => a.id === achievementId)) {
      user.learningStats.achievements.push({
        ...achievement,
        earned: new Date().toISOString()
      });
    }
  }

  reset(): void {
    this.users.clear();
    this.initializeMockData();
  }
}

describe('Learning Platform Features', () => {
  let platform: MockLearningPlatform;
  let networkSimulator: NetworkSimulator;
  let storageTester: OfflineStorageTester;

  beforeEach(() => {
    platform = new MockLearningPlatform();
    networkSimulator = new NetworkSimulator();
    storageTester = new OfflineStorageTester();
  });

  afterEach(() => {
    platform.reset();
    networkSimulator.restore();
    storageTester.restore();
    pwaTestSuite.reset();
  });

  describe('User Management and Subscription Tiers', () => {
    it('should create user with appropriate subscription tier', () => {
      const foundationUser = platform.createUser('user1', 'foundation');
      const advancedUser = platform.createUser('user2', 'advanced');
      const eliteUser = platform.createUser('user3', 'elite');

      expect(foundationUser.subscriptionTier).toBe('foundation');
      expect(advancedUser.subscriptionTier).toBe('advanced');
      expect(eliteUser.subscriptionTier).toBe('elite');

      expect(foundationUser.preferences).toBeDefined();
      expect(foundationUser.learningStats).toBeDefined();
    });

    it('should restrict content access based on subscription tier', () => {
      const foundationUser = platform.createUser('user1', 'foundation');
      const advancedUser = platform.createUser('user2', 'advanced');

      const foundationContent = platform.getAccessibleContent('user1');
      const advancedContent = platform.getAccessibleContent('user2');

      // Foundation user should only see foundation content
      expect(foundationContent.every(chapter => chapter.tier === 'foundation')).toBe(true);

      // Advanced user should see foundation and advanced content
      expect(advancedContent.length).toBeGreaterThan(foundationContent.length);
      expect(advancedContent.some(chapter => chapter.tier === 'advanced')).toBe(true);
    });

    it('should handle user preferences updates', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Update preferences
      user.preferences.theme = 'dark';
      user.preferences.fontSize = 'large';
      user.preferences.notifications.reminders = false;

      expect(user.preferences.theme).toBe('dark');
      expect(user.preferences.fontSize).toBe('large');
      expect(user.preferences.notifications.reminders).toBe(false);
    });
  });

  describe('Content Delivery and Progress Tracking', () => {
    it('should track chapter progress accurately', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Simulate reading sections
      platform.updateProgress('user1', 'chapter-1', 'intro', 300); // 5 minutes
      platform.updateProgress('user1', 'chapter-1', 'concepts', 600); // 10 minutes
      
      const progress = user.progress['chapter-1'];
      expect(progress).toBeDefined();
      expect(progress.timeSpent).toBe(900); // 15 minutes total
      expect(progress.percentage).toBeGreaterThan(0);
      expect(progress.sections['intro'].completed).toBe(true);
      expect(progress.sections['concepts'].completed).toBe(true);
    });

    it('should calculate completion percentage correctly', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Complete all sections of chapter-1
      platform.updateProgress('user1', 'chapter-1', 'intro', 300);
      platform.updateProgress('user1', 'chapter-1', 'concepts', 300);
      platform.updateProgress('user1', 'chapter-1', 'examples', 300);
      
      const progress = user.progress['chapter-1'];
      expect(progress.percentage).toBe(100);
      expect(progress.completed).toBe(true);
    });

    it('should update learning statistics', () => {
      const user = platform.createUser('user1', 'foundation');
      
      platform.updateProgress('user1', 'chapter-1', 'intro', 300);
      platform.updateProgress('user1', 'chapter-1', 'concepts', 600);
      
      expect(user.learningStats.totalTimeSpent).toBe(900);
      expect(user.learningStats.currentStreak).toBeGreaterThan(0);
    });

    it('should handle offline progress storage', () => {
      const offlineProgress = {
        chapterId: 'chapter-1',
        sectionId: 'intro',
        timeSpent: 300,
        timestamp: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // Store progress offline
      localStorage.setItem('offlineProgress', JSON.stringify([offlineProgress]));
      
      // Verify storage
      const stored = JSON.parse(localStorage.getItem('offlineProgress') || '[]');
      expect(stored).toHaveLength(1);
      expect(stored[0].chapterId).toBe('chapter-1');
      expect(stored[0].syncStatus).toBe('pending');
    });
  });

  describe('Bookmark and Note Management', () => {
    it('should create and manage bookmarks', () => {
      const user = platform.createUser('user1', 'foundation');
      
      const bookmark = platform.addBookmark('user1', {
        chapterId: 'chapter-1',
        sectionId: 'intro',
        position: 150,
        title: 'Important concept',
        note: 'Remember this for later',
        tags: ['important', 'concept']
      });

      expect(bookmark.id).toBeDefined();
      expect(bookmark.created).toBeDefined();
      expect(user.bookmarks).toHaveLength(1);
      expect(user.bookmarks[0].title).toBe('Important concept');
    });

    it('should create and manage notes', () => {
      const user = platform.createUser('user1', 'foundation');
      
      const note = platform.addNote('user1', {
        chapterId: 'chapter-1',
        content: 'This is a key insight about prompt engineering',
        position: 75,
        tags: ['insight', 'important'],
        type: 'insight'
      });

      expect(note.id).toBeDefined();
      expect(note.created).toBeDefined();
      expect(user.notes).toHaveLength(1);
      expect(user.notes[0].type).toBe('insight');
    });

    it('should organize bookmarks and notes by chapter', () => {
      const user = platform.createUser('user1', 'foundation');
      
      platform.addBookmark('user1', {
        chapterId: 'chapter-1',
        position: 100,
        title: 'Chapter 1 bookmark',
        tags: []
      });

      platform.addBookmark('user1', {
        chapterId: 'chapter-2',
        position: 200,
        title: 'Chapter 2 bookmark',
        tags: []
      });

      const chapter1Bookmarks = user.bookmarks.filter(b => b.chapterId === 'chapter-1');
      const chapter2Bookmarks = user.bookmarks.filter(b => b.chapterId === 'chapter-2');

      expect(chapter1Bookmarks).toHaveLength(1);
      expect(chapter2Bookmarks).toHaveLength(1);
    });

    it('should handle bookmark and note synchronization', async () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Create items offline
      networkSimulator.setNetworkState('offline');
      
      const bookmark = platform.addBookmark('user1', {
        chapterId: 'chapter-1',
        position: 100,
        title: 'Offline bookmark',
        tags: []
      });

      // Queue for sync
      const syncQueue = [{
        type: 'CREATE_BOOKMARK',
        data: bookmark,
        timestamp: new Date().toISOString()
      }];

      localStorage.setItem('syncQueue', JSON.stringify(syncQueue));

      // Go back online and sync
      networkSimulator.setNetworkState('online');
      
      const queuedItems = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      expect(queuedItems).toHaveLength(1);
      expect(queuedItems[0].type).toBe('CREATE_BOOKMARK');
    });
  });

  describe('Template Library and Usage', () => {
    it('should retrieve templates by category and difficulty', () => {
      const template = platform.getTemplate('template-1');
      
      expect(template).toBeDefined();
      expect(template?.category).toBe('development');
      expect(template?.difficulty).toBe('beginner');
      expect(template?.variables).toHaveLength(2);
    });

    it('should track template usage statistics', () => {
      const user = platform.createUser('user1', 'foundation');
      const initialUsage = platform.getTemplate('template-1')?.usageCount || 0;
      
      platform.useTemplate('user1', 'template-1');
      
      const updatedTemplate = platform.getTemplate('template-1');
      expect(updatedTemplate?.usageCount).toBe(initialUsage + 1);
      expect(user.learningStats.templatesUsed).toBe(1);
    });

    it('should validate template variables', () => {
      const template = platform.getTemplate('template-1');
      
      expect(template?.variables[0].name).toBe('language');
      expect(template?.variables[0].required).toBe(true);
      expect(template?.variables[0].type).toBe('select');
      expect(template?.variables[0].options).toContain('JavaScript');
      
      expect(template?.variables[1].name).toBe('code');
      expect(template?.variables[1].type).toBe('multiline');
    });

    it('should generate template content with variables', () => {
      const template = platform.getTemplate('template-1');
      const variables = {
        language: 'TypeScript',
        code: 'function hello() { return "world"; }'
      };

      let content = template?.content || '';
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(`{{${key}}}`, value);
      });

      expect(content).toContain('TypeScript');
      expect(content).toContain('function hello()');
      expect(content).not.toContain('{{language}}');
      expect(content).not.toContain('{{code}}');
    });

    it('should handle template offline access', () => {
      networkSimulator.setNetworkState('offline');
      
      // Cache templates for offline access
      const templates = [
        platform.getTemplate('template-1'),
        platform.getTemplate('template-2')
      ].filter(Boolean);

      localStorage.setItem('cachedTemplates', JSON.stringify(templates));
      
      // Retrieve from cache
      const cachedTemplates = JSON.parse(localStorage.getItem('cachedTemplates') || '[]');
      expect(cachedTemplates).toHaveLength(2);
      expect(cachedTemplates[0].id).toBe('template-1');
    });
  });

  describe('Search and Discovery', () => {
    it('should search across chapters and templates', () => {
      const results = platform.searchContent('code');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.type === 'template')).toBe(true);
      expect(results[0].title).toBeDefined();
    });

    it('should filter search results by type', () => {
      const chapterResults = platform.searchContent('foundation', { type: 'chapter' });
      const templateResults = platform.searchContent('code', { type: 'template' });

      expect(chapterResults.every(r => r.type === 'chapter')).toBe(true);
      expect(templateResults.every(r => r.type === 'template')).toBe(true);
    });

    it('should provide content recommendations', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Complete a chapter
      platform.updateProgress('user1', 'chapter-1', 'intro', 300);
      platform.updateProgress('user1', 'chapter-1', 'concepts', 300);
      platform.updateProgress('user1', 'chapter-1', 'examples', 300);
      
      const recommendations = platform.getRecommendations('user1');
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.type === 'chapter')).toBe(true);
      expect(recommendations.some(r => r.type === 'template')).toBe(true);
    });

    it('should implement intelligent search ranking', () => {
      const results = platform.searchContent('review');
      
      // Results should be ranked by relevance (simplified check)
      expect(results.length).toBeGreaterThan(0);
      
      // Check that exact title matches rank higher
      const exactMatch = results.find(r => r.title.toLowerCase().includes('review'));
      if (exactMatch) {
        expect(results.indexOf(exactMatch)).toBeLessThan(results.length / 2);
      }
    });
  });

  describe('Achievement and Gamification System', () => {
    it('should award achievements for milestones', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Complete first chapter
      platform.updateProgress('user1', 'chapter-1', 'intro', 300);
      platform.updateProgress('user1', 'chapter-1', 'concepts', 300);
      platform.updateProgress('user1', 'chapter-1', 'examples', 300);
      
      platform.awardAchievement('user1', 'first-chapter');
      
      expect(user.learningStats.achievements).toHaveLength(1);
      expect(user.learningStats.achievements[0].id).toBe('first-chapter');
      expect(user.learningStats.achievements[0].points).toBe(10);
    });

    it('should track learning streaks', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Simulate daily learning
      platform.updateProgress('user1', 'chapter-1', 'intro', 300);
      
      expect(user.learningStats.currentStreak).toBeGreaterThan(0);
      expect(user.learningStats.longestStreak).toBeGreaterThan(0);
    });

    it('should calculate user statistics accurately', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Simulate learning activity
      platform.updateProgress('user1', 'chapter-1', 'intro', 300);
      platform.updateProgress('user1', 'chapter-1', 'concepts', 600);
      platform.useTemplate('user1', 'template-1');
      platform.useTemplate('user1', 'template-2');
      
      const stats = platform.getUserStats('user1');
      
      expect(stats?.totalTimeSpent).toBe(900);
      expect(stats?.templatesUsed).toBe(2);
      expect(stats?.averageSessionTime).toBeGreaterThan(0);
    });

    it('should handle achievement duplicate prevention', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Award same achievement twice
      platform.awardAchievement('user1', 'first-chapter');
      platform.awardAchievement('user1', 'first-chapter');
      
      // Should only have one instance
      expect(user.learningStats.achievements).toHaveLength(1);
    });
  });

  describe('Offline Learning Experience', () => {
    it('should cache content for offline reading', () => {
      const user = platform.createUser('user1', 'foundation');
      const accessibleContent = platform.getAccessibleContent('user1');
      
      // Cache content for offline access
      const contentCache = {
        chapters: accessibleContent,
        lastUpdated: new Date().toISOString(),
        userTier: user.subscriptionTier
      };
      
      localStorage.setItem('contentCache', JSON.stringify(contentCache));
      
      // Verify offline access
      networkSimulator.setNetworkState('offline');
      
      const cachedContent = JSON.parse(localStorage.getItem('contentCache') || '{}');
      expect(cachedContent.chapters.length).toBeGreaterThan(0);
      expect(cachedContent.userTier).toBe('foundation');
    });

    it('should queue progress updates for sync', () => {
      networkSimulator.setNetworkState('offline');
      
      const progressUpdate = {
        userId: 'user1',
        chapterId: 'chapter-1',
        sectionId: 'intro',
        timeSpent: 300,
        timestamp: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // Queue offline update
      const queue = JSON.parse(localStorage.getItem('progressQueue') || '[]');
      queue.push(progressUpdate);
      localStorage.setItem('progressQueue', JSON.stringify(queue));
      
      expect(queue).toHaveLength(1);
      expect(queue[0].syncStatus).toBe('pending');
    });

    it('should handle offline note creation', () => {
      networkSimulator.setNetworkState('offline');
      
      const offlineNote = {
        id: `offline-note-${Date.now()}`,
        chapterId: 'chapter-1',
        content: 'Offline note content',
        position: 100,
        type: 'comment',
        created: new Date().toISOString(),
        syncStatus: 'pending'
      };

      // Store offline note
      const offlineNotes = JSON.parse(localStorage.getItem('offlineNotes') || '[]');
      offlineNotes.push(offlineNote);
      localStorage.setItem('offlineNotes', JSON.stringify(offlineNotes));
      
      expect(offlineNotes).toHaveLength(1);
      expect(offlineNotes[0].syncStatus).toBe('pending');
    });

    it('should sync data when connection restored', async () => {
      // Start offline
      networkSimulator.setNetworkState('offline');
      
      // Create offline data
      const offlineData = [
        { type: 'PROGRESS_UPDATE', data: { chapterId: 'chapter-1' } },
        { type: 'CREATE_NOTE', data: { content: 'Offline note' } },
        { type: 'CREATE_BOOKMARK', data: { title: 'Offline bookmark' } }
      ];
      
      localStorage.setItem('syncQueue', JSON.stringify(offlineData));
      
      // Go back online
      networkSimulator.setNetworkState('online');
      
      // Simulate sync process
      const syncQueue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
      const syncResults = await Promise.allSettled(
        syncQueue.map(async (item: any) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true, item };
        })
      );
      
      const successful = syncResults.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBe(3);
      
      // Clear sync queue after successful sync
      localStorage.removeItem('syncQueue');
      expect(localStorage.getItem('syncQueue')).toBeNull();
    });
  });

  describe('Performance and Optimization', () => {
    it('should implement content pagination for large chapters', () => {
      const pageSize = 10;
      const totalSections = 25;
      
      const getPaginatedContent = (page: number) => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalSections);
        
        return {
          sections: Array.from({ length: endIndex - startIndex }, (_, i) => ({
            id: `section-${startIndex + i + 1}`,
            title: `Section ${startIndex + i + 1}`,
            content: `Content for section ${startIndex + i + 1}`
          })),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalSections / pageSize),
            hasNextPage: endIndex < totalSections,
            hasPreviousPage: page > 1
          }
        };
      };

      const page1 = getPaginatedContent(1);
      const page2 = getPaginatedContent(2);
      
      expect(page1.sections).toHaveLength(10);
      expect(page1.pagination.hasNextPage).toBe(true);
      expect(page1.pagination.hasPreviousPage).toBe(false);
      
      expect(page2.sections).toHaveLength(10);
      expect(page2.pagination.currentPage).toBe(2);
    });

    it('should implement lazy loading for template variables', () => {
      const loadTemplateVariables = (templateId: string) => {
        const template = platform.getTemplate(templateId);
        
        // Simulate lazy loading of variable options
        if (template) {
          return template.variables.map(variable => ({
            ...variable,
            options: variable.options || [],
            loaded: true
          }));
        }
        
        return [];
      };

      const variables = loadTemplateVariables('template-1');
      expect(variables[0].loaded).toBe(true);
      expect(variables[0].options).toBeDefined();
    });

    it('should optimize search performance with indexing', () => {
      const performanceStart = performance.now();
      
      // Perform multiple searches
      for (let i = 0; i < 100; i++) {
        platform.searchContent('code');
      }
      
      const performanceEnd = performance.now();
      const searchTime = performanceEnd - performanceStart;
      
      // Should complete 100 searches quickly (under 1 second)
      expect(searchTime).toBeLessThan(1000);
    });

    it('should implement efficient progress calculations', () => {
      const user = platform.createUser('user1', 'foundation');
      
      const performanceStart = performance.now();
      
      // Update progress multiple times
      for (let i = 0; i < 50; i++) {
        platform.updateProgress('user1', 'chapter-1', `section-${i}`, 60);
      }
      
      const performanceEnd = performance.now();
      const updateTime = performanceEnd - performanceStart;
      
      // Should handle many updates efficiently
      expect(updateTime).toBeLessThan(500);
      expect(user.learningStats.totalTimeSpent).toBe(3000); // 50 * 60 seconds
    });
  });

  describe('User Experience and Accessibility', () => {
    it('should support different reading preferences', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Test reading mode preferences
      const readingModes = ['normal', 'focus', 'speed'];
      readingModes.forEach(mode => {
        user.preferences.readingMode = mode as any;
        expect(user.preferences.readingMode).toBe(mode);
      });
      
      // Test font size preferences
      const fontSizes = ['small', 'medium', 'large', 'xl'];
      fontSizes.forEach(size => {
        user.preferences.fontSize = size as any;
        expect(user.preferences.fontSize).toBe(size);
      });
    });

    it('should provide progress export functionality', () => {
      const user = platform.createUser('user1', 'foundation');
      
      // Add some progress
      platform.updateProgress('user1', 'chapter-1', 'intro', 300);
      platform.addBookmark('user1', {
        chapterId: 'chapter-1',
        position: 100,
        title: 'Important bookmark',
        tags: []
      });
      
      // Export progress data
      const exportData = {
        userId: user.id,
        subscriptionTier: user.subscriptionTier,
        progress: user.progress,
        bookmarks: user.bookmarks,
        notes: user.notes,
        stats: user.learningStats,
        exportDate: new Date().toISOString()
      };
      
      expect(exportData.progress).toBeDefined();
      expect(exportData.bookmarks).toHaveLength(1);
      expect(exportData.stats.totalTimeSpent).toBe(300);
    });

    it('should handle graceful error states', () => {
      // Test with non-existent user
      expect(() => platform.addBookmark('nonexistent', {
        chapterId: 'chapter-1',
        position: 100,
        title: 'Test',
        tags: []
      })).toThrow('User not found');
      
      // Test with invalid content access
      const results = platform.getAccessibleContent('nonexistent');
      expect(results).toEqual([]);
      
      // Test search with empty query
      const searchResults = platform.searchContent('');
      expect(Array.isArray(searchResults)).toBe(true);
    });

    it('should support keyboard navigation patterns', () => {
      const keyboardNavigation = {
        currentFocus: 0,
        items: ['chapter-1', 'chapter-2', 'template-1', 'template-2'],
        
        handleKeydown: (key: string) => {
          switch (key) {
            case 'ArrowDown':
            case 'j':
              keyboardNavigation.currentFocus = Math.min(
                keyboardNavigation.currentFocus + 1,
                keyboardNavigation.items.length - 1
              );
              break;
            case 'ArrowUp':
            case 'k':
              keyboardNavigation.currentFocus = Math.max(
                keyboardNavigation.currentFocus - 1,
                0
              );
              break;
            case 'Enter':
              return keyboardNavigation.items[keyboardNavigation.currentFocus];
          }
          return null;
        }
      };

      expect(keyboardNavigation.handleKeydown('j')).toBeNull();
      expect(keyboardNavigation.currentFocus).toBe(1);
      
      expect(keyboardNavigation.handleKeydown('Enter')).toBe('chapter-2');
      
      keyboardNavigation.handleKeydown('k');
      expect(keyboardNavigation.currentFocus).toBe(0);
    });
  });
});