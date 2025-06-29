# Component Architecture Specification
**Issue #74: Content Index Mapping and Architecture Planning**

## Shared UI Component Library Structure

### 1. Lead Capture Components

#### `LeadCaptureFormComponent`
**Location:** `libs/shared/ui-components/src/lib/components/lead-capture/`
**Purpose:** Unified lead capture across all touch points

```typescript
interface LeadCaptureFormProps {
  variant: 'hero' | 'pricing' | 'exit-intent' | 'blog';
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showOptionalFields?: boolean;
  onSubmit: (data: LeadData) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface LeadData {
  email: string;
  name?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  primaryLanguage?: string;
  source: string; // Tracking source
}
```

**Features:**
- Real-time email validation
- GDPR compliance checkbox
- Duplicate email prevention
- A/B testing support
- Analytics event tracking
- Responsive design
- Accessibility compliance

#### `NewsletterSignupComponent`
**Location:** `libs/shared/ui-components/src/lib/components/newsletter/`
**Purpose:** Newsletter subscription with different contexts

```typescript
interface NewsletterSignupProps {
  placement: 'footer' | 'sidebar' | 'modal' | 'inline';
  showDescription?: boolean;
  ctaText?: string;
  size?: 'small' | 'medium' | 'large';
}
```

### 2. Pricing Components

#### `PricingCardComponent`
**Location:** `libs/shared/ui-components/src/lib/components/pricing/`
**Purpose:** Reusable pricing tier display

```typescript
interface PricingCardProps {
  tier: PricingTier;
  popular?: boolean;
  currentUserTier?: string;
  onSelect: (tierId: string) => void;
  showComparison?: boolean;
  annualDiscount?: boolean;
}

interface PricingTier {
  id: string;
  name: string;
  price: {
    monthly: number;
    annual: number;
  };
  features: PricingFeature[];
  ctaText: string;
  description: string;
  limitations?: string[];
}

interface PricingFeature {
  name: string;
  included: boolean;
  description?: string;
  highlight?: boolean;
}
```

#### `FeatureComparisonComponent`
**Location:** `libs/shared/ui-components/src/lib/components/pricing/`
**Purpose:** Side-by-side feature comparison

```typescript
interface FeatureComparisonProps {
  tiers: PricingTier[];
  features: ComparisonFeature[];
  highlightDifferences?: boolean;
}

interface ComparisonFeature {
  category: string;
  features: {
    name: string;
    description: string;
    tiers: { [tierId: string]: boolean | string };
  }[];
}
```

### 3. Content Components

#### `ContentPreviewComponent`
**Location:** `libs/shared/ui-components/src/lib/components/content/`
**Purpose:** Chapter/template previews with tier gating

```typescript
interface ContentPreviewProps {
  content: ContentPreview;
  userTier?: string;
  requiredTier: string;
  onUpgrade?: () => void;
  onBookmark?: (contentId: string) => void;
  showProgress?: boolean;
}

interface ContentPreview {
  id: string;
  title: string;
  description: string;
  previewText: string;
  estimatedReadTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  author: string;
  publishedDate: Date;
  lastUpdated: Date;
}
```

#### `ChapterNavigationComponent`
**Location:** `libs/shared/ui-components/src/lib/components/content/`
**Purpose:** Chapter navigation with tier restrictions

```typescript
interface ChapterNavigationProps {
  chapters: Chapter[];
  currentChapter?: string;
  userTier: string;
  onChapterSelect: (chapterId: string) => void;
  showProgress?: boolean;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  requiredTier: string;
  completed?: boolean;
  locked?: boolean;
  estimatedTime: number;
}
```

### 4. Marketing Components

#### `TestimonialComponent`
**Location:** `libs/shared/ui-components/src/lib/components/testimonial/`
**Purpose:** Developer testimonials display

```typescript
interface TestimonialProps {
  testimonials: Testimonial[];
  layout: 'carousel' | 'grid' | 'single';
  autoRotate?: boolean;
  showRating?: boolean;
  showPhoto?: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  title: string;
  company?: string;
  avatar?: string;
  rating: number;
  quote: string;
  tags: string[]; // e.g., ['React', 'Senior Developer']
  linkedinUrl?: string;
  verified: boolean;
}
```

#### `CTABannerComponent`
**Location:** `libs/shared/ui-components/src/lib/components/cta/`
**Purpose:** Call-to-action banners

```typescript
interface CTABannerProps {
  variant: 'primary' | 'secondary' | 'urgent';
  title: string;
  subtitle?: string;
  buttonText: string;
  buttonAction: () => void;
  dismissible?: boolean;
  showCountdown?: boolean;
  backgroundImage?: string;
}
```

### 5. Analytics & Tracking Components

#### `AnalyticsProviderComponent`
**Location:** `libs/shared/ui-components/src/lib/components/analytics/`
**Purpose:** Unified analytics tracking

```typescript
interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customProperties?: Record<string, any>;
}

interface AnalyticsProviderProps {
  trackingId: string;
  userId?: string;
  userTier?: string;
  debugMode?: boolean;
}
```

## Website-Specific Components

### Marketing Website (`apps/website/`)

#### `HeroSectionComponent`
**Location:** `apps/website/src/app/components/hero/`
**Purpose:** Landing page hero with lead capture

```typescript
interface HeroSectionProps {
  headline: string;
  subheadline: string;
  ctaText: string;
  backgroundVideo?: string;
  socialProofCount?: number;
  features: string[];
}
```

**Content Integration:**
- API: `GET /api/content/marketing/hero`
- Lead Capture: Uses `LeadCaptureFormComponent`
- A/B Testing: Headlines, CTA text, form placement

#### `PrinciplesOverviewComponent`
**Location:** `apps/website/src/app/components/principles/`
**Purpose:** Five Elite Principles showcase

```typescript
interface PrinciplesOverviewProps {
  principles: Principle[];
  expandable?: boolean;
  showPreviews?: boolean;
}

interface Principle {
  id: string;
  title: string;
  description: string;
  previewContent: string;
  icon: string;
  chapterReference: string;
}
```

#### `BlogListComponent`
**Location:** `apps/website/src/app/components/blog/`
**Purpose:** SEO-optimized blog listing

```typescript
interface BlogListProps {
  posts: BlogPost[];
  categories: string[];
  pagination: PaginationConfig;
  searchEnabled?: boolean;
  featuredPosts?: string[];
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedDate: Date;
  lastModified: Date;
  categories: string[];
  tags: string[];
  featuredImage?: string;
  seoTitle: string;
  seoDescription: string;
  readingTime: number;
}
```

### PWA-Specific Components (`apps/pwa/`)

#### `LearningDashboardComponent`
**Location:** `apps/pwa/src/app/components/dashboard/`
**Purpose:** User progress and learning dashboard

```typescript
interface LearningDashboardProps {
  userProgress: UserProgress;
  recentActivity: Activity[];
  recommendations: Recommendation[];
  goals: LearningGoal[];
}

interface UserProgress {
  currentTier: string;
  chaptersCompleted: number;
  totalChapters: number;
  timeSpent: number;
  streak: number;
  achievements: Achievement[];
}
```

#### `BookmarkManagerComponent`
**Location:** `apps/pwa/src/app/components/bookmarks/`
**Purpose:** Bookmark and favorite content management

```typescript
interface BookmarkManagerProps {
  bookmarks: Bookmark[];
  categories: string[];
  onRemove: (bookmarkId: string) => void;
  onCategorize: (bookmarkId: string, category: string) => void;
  searchEnabled?: boolean;
}

interface Bookmark {
  id: string;
  contentId: string;
  contentType: 'chapter' | 'template' | 'note';
  title: string;
  category?: string;
  notes?: string;
  createdAt: Date;
  lastAccessed?: Date;
}
```

## Component Integration Architecture

### State Management Strategy

#### Global State (NgRx/Akita)
```typescript
interface AppState {
  user: UserState;
  content: ContentState;
  ui: UIState;
  analytics: AnalyticsState;
}

interface UserState {
  profile: UserProfile | null;
  subscription: SubscriptionInfo | null;
  preferences: UserPreferences;
  progress: UserProgress;
}

interface ContentState {
  chapters: Chapter[];
  templates: Template[];
  bookmarks: Bookmark[];
  recentActivity: Activity[];
}
```

#### Component Communication Patterns
1. **Parent-Child:** Props and events
2. **Sibling Components:** Shared services
3. **Cross-App:** Shared state management
4. **External APIs:** HTTP interceptors with caching

### Styling Architecture

#### Design System Integration
```scss
// Theme variables
$primary-color: #007acc;
$secondary-color: #17a2b8;
$success-color: #28a745;
$warning-color: #ffc107;
$error-color: #dc3545;

// Component-specific mixins
@mixin card-shadow {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

@mixin responsive-text($mobile, $tablet, $desktop) {
  font-size: $mobile;
  
  @media (min-width: 768px) {
    font-size: $tablet;
  }
  
  @media (min-width: 1024px) {
    font-size: $desktop;
  }
}
```

#### Component Theming Strategy
- CSS Custom Properties for dynamic theming
- Angular Material integration
- Dark/light mode support
- Accessibility compliance (WCAG 2.1 AA)

### Performance Optimization

#### Lazy Loading Strategy
```typescript
// Route-based lazy loading
const routes: Routes = [
  {
    path: 'pricing',
    loadComponent: () => import('./components/pricing/pricing.component')
  },
  {
    path: 'blog',
    loadChildren: () => import('./modules/blog/blog.module')
  }
];

// Component-level lazy loading
@Component({
  template: `
    <ng-container *ngIf="shouldLoadComponent">
      <heavy-component></heavy-component>
    </ng-container>
  `
})
```

#### Caching Strategy
- HTTP response caching
- Component state caching
- Asset caching with service workers
- CDN integration for static content

### Testing Strategy

#### Component Testing Patterns
```typescript
describe('LeadCaptureFormComponent', () => {
  let component: LeadCaptureFormComponent;
  let fixture: ComponentFixture<LeadCaptureFormComponent>;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, HttpClientTestingModule],
      declarations: [LeadCaptureFormComponent],
      providers: [
        { provide: AnalyticsService, useClass: MockAnalyticsService }
      ]
    });
  });
  
  it('should validate email format', () => {
    // Test implementation
  });
  
  it('should track form submission', () => {
    // Analytics tracking test
  });
});
```

#### Integration Testing
- Cross-component communication
- API integration testing
- User journey testing
- Performance testing

## Implementation Priority

### Phase 1: Foundation Components (High Priority)
1. `LeadCaptureFormComponent` - Critical for marketing
2. `PricingCardComponent` - Essential for conversions
3. `ContentPreviewComponent` - Core PWA functionality
4. `AnalyticsProviderComponent` - Tracking setup

### Phase 2: Marketing Components (Medium Priority)
1. `HeroSectionComponent` - Landing page
2. `TestimonialComponent` - Social proof
3. `PrinciplesOverviewComponent` - Content showcase
4. `CTABannerComponent` - Conversion optimization

### Phase 3: PWA Components (Medium Priority)
1. `LearningDashboardComponent` - User experience
2. `ChapterNavigationComponent` - Content navigation
3. `BookmarkManagerComponent` - User engagement
4. `ProgressTrackingComponent` - Gamification

### Phase 4: Advanced Components (Low Priority)
1. `BlogListComponent` - SEO and content marketing
2. `FeatureComparisonComponent` - Detailed pricing
3. `NewsletterSignupComponent` - Email marketing
4. `NotificationComponent` - User engagement

## Success Criteria

### Performance Metrics
- Component load time: <100ms
- First paint: <1.5s
- Interaction ready: <2.5s
- Bundle size impact: <50KB per component

### User Experience Metrics
- Form conversion rate: >15%
- Component engagement rate: >60%
- User task completion: >85%
- Accessibility score: >95

### Development Metrics
- Component reusability: >80%
- Test coverage: >90%
- Documentation coverage: 100%
- Type safety: 100%

---

**Document Status:** ✅ Complete
**Ready for Implementation:** Backend APIs (Issue #75) and Component Development (Issue #76)
**Architecture Review:** ✅ Approved for development phase