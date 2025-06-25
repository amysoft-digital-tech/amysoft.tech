/**
 * Content Management System Types
 * Comprehensive type definitions for content creation, editing, and management
 */

// Core Content Entity Types
export interface ContentEntity {
  id: string;
  type: ContentType;
  title: string;
  slug: string;
  description?: string;
  content: ContentBody;
  metadata: ContentMetadata;
  status: ContentStatus;
  workflow: WorkflowState;
  version: ContentVersion;
  relationships: ContentRelationship[];
  analytics: ContentAnalytics;
  seo: SEOMetadata;
  accessibility: AccessibilityMetadata;
  audit: AuditTrail;
  created: string;
  updated: string;
  published?: string;
  archived?: string;
}

export type ContentType = 
  | 'chapter'
  | 'section'
  | 'template'
  | 'blog-post'
  | 'landing-page'
  | 'email-template'
  | 'notification'
  | 'help-article'
  | 'tutorial'
  | 'example'
  | 'reference';

export interface ContentBody {
  format: ContentFormat;
  raw: string;
  rendered?: string;
  preview?: string;
  excerpts: ContentExcerpt[];
  media: MediaReference[];
  links: LinkReference[];
  footnotes: Footnote[];
  codeBlocks: CodeBlock[];
  interactive: InteractiveElement[];
}

export type ContentFormat = 'prosemirror' | 'markdown' | 'html' | 'plain-text' | 'rich-text';

export interface ContentExcerpt {
  type: 'summary' | 'introduction' | 'conclusion' | 'key-point';
  content: string;
  position: number;
  length: number;
}

export interface MediaReference {
  id: string;
  type: MediaType;
  url: string;
  alt?: string;
  caption?: string;
  credits?: string;
  position: number;
  dimensions?: MediaDimensions;
  metadata: MediaMetadata;
}

export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'embed' | 'interactive';

export interface MediaDimensions {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface MediaMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  optimization: OptimizationData;
  accessibility: MediaAccessibility;
}

export interface OptimizationData {
  compressed: boolean;
  formats: OptimizedFormat[];
  cdn: CDNConfiguration;
  lazyLoading: boolean;
  responsive: ResponsiveConfiguration;
}

export interface OptimizedFormat {
  format: string;
  url: string;
  size: number;
  quality: number;
  dimensions?: MediaDimensions;
}

export interface CDNConfiguration {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  cacheTtl: number;
  regions: string[];
}

export interface ResponsiveConfiguration {
  breakpoints: ResponsiveBreakpoint[];
  strategy: 'srcset' | 'picture' | 'css';
}

export interface ResponsiveBreakpoint {
  name: string;
  width: number;
  url: string;
  descriptor: string;
}

export interface MediaAccessibility {
  altText: string;
  longDescription?: string;
  captions?: string[];
  transcripts?: string[];
  audioDescription?: string;
}

export interface LinkReference {
  id: string;
  type: LinkType;
  href: string;
  title?: string;
  target?: string;
  position: number;
  validation: LinkValidation;
}

export type LinkType = 'internal' | 'external' | 'anchor' | 'download' | 'email' | 'phone';

export interface LinkValidation {
  status: 'valid' | 'invalid' | 'warning' | 'unchecked';
  lastChecked?: string;
  responseCode?: number;
  message?: string;
}

export interface Footnote {
  id: string;
  content: string;
  position: number;
  type: 'reference' | 'explanation' | 'citation' | 'note';
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  caption?: string;
  highlights: number[];
  position: number;
  executable: boolean;
  output?: string;
}

export interface InteractiveElement {
  id: string;
  type: InteractiveType;
  configuration: Record<string, any>;
  position: number;
  responsive: boolean;
}

export type InteractiveType = 'quiz' | 'poll' | 'form' | 'calculator' | 'simulator' | 'widget';

// Content Metadata and Organization
export interface ContentMetadata {
  tags: string[];
  categories: string[];
  topics: string[];
  difficulty: DifficultyLevel;
  estimatedReadTime: number;
  targetAudience: string[];
  prerequisites: string[];
  learningObjectives: string[];
  language: string;
  region?: string;
  customFields: Record<string, any>;
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ContentStatus {
  current: StatusType;
  history: StatusHistory[];
  permissions: ContentPermissions;
  visibility: VisibilitySettings;
}

export type StatusType = 
  | 'draft'
  | 'in-review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'deleted'
  | 'scheduled';

export interface StatusHistory {
  status: StatusType;
  timestamp: string;
  userId: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface ContentPermissions {
  read: string[];
  write: string[];
  publish: string[];
  delete: string[];
  admin: string[];
}

export interface VisibilitySettings {
  public: boolean;
  searchable: boolean;
  indexable: boolean;
  featured: boolean;
  premium: boolean;
  subscriptionTiers: string[];
}

// Workflow Management
export interface WorkflowState {
  stage: WorkflowStage;
  assignee?: string;
  reviewer?: string;
  approver?: string;
  dueDate?: string;
  priority: Priority;
  comments: WorkflowComment[];
  checkpoints: WorkflowCheckpoint[];
  automation: WorkflowAutomation;
}

export type WorkflowStage = 
  | 'planning'
  | 'writing'
  | 'editing'
  | 'review'
  | 'approval'
  | 'publishing'
  | 'maintenance';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkflowComment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  type: CommentType;
  resolved: boolean;
  attachments: string[];
}

export type CommentType = 'general' | 'suggestion' | 'question' | 'issue' | 'approval' | 'rejection';

export interface WorkflowCheckpoint {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  required: boolean;
  order: number;
}

export interface WorkflowAutomation {
  enabled: boolean;
  triggers: AutomationTrigger[];
  actions: AutomationAction[];
  notifications: NotificationRule[];
}

export interface AutomationTrigger {
  event: TriggerEvent;
  conditions: TriggerCondition[];
  enabled: boolean;
}

export type TriggerEvent = 
  | 'status-change'
  | 'due-date-approaching'
  | 'overdue'
  | 'comment-added'
  | 'user-assigned'
  | 'content-modified';

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than';
  value: any;
}

export interface AutomationAction {
  type: ActionType;
  configuration: Record<string, any>;
  enabled: boolean;
}

export type ActionType = 
  | 'send-notification'
  | 'assign-user'
  | 'change-status'
  | 'set-due-date'
  | 'add-comment'
  | 'update-metadata';

export interface NotificationRule {
  id: string;
  name: string;
  recipients: NotificationRecipient[];
  template: string;
  channels: NotificationChannel[];
  conditions: NotificationCondition[];
  enabled: boolean;
}

export interface NotificationRecipient {
  type: 'user' | 'role' | 'group';
  identifier: string;
}

export type NotificationChannel = 'email' | 'in-app' | 'slack' | 'webhook';

export interface NotificationCondition {
  field: string;
  operator: string;
  value: any;
}

// Version Control and History
export interface ContentVersion {
  number: string;
  major: number;
  minor: number;
  patch: number;
  timestamp: string;
  author: string;
  message: string;
  changes: ContentChange[];
  size: number;
  checksum: string;
  parent?: string;
  branches: string[];
  tags: string[];
}

export interface ContentChange {
  type: ChangeType;
  path: string;
  before?: any;
  after?: any;
  metadata?: Record<string, any>;
}

export type ChangeType = 'create' | 'update' | 'delete' | 'move' | 'copy';

export interface ContentRelationship {
  id: string;
  type: RelationshipType;
  targetId: string;
  targetType: string;
  metadata?: Record<string, any>;
  bidirectional: boolean;
  strength: number;
}

export type RelationshipType = 
  | 'parent'
  | 'child'
  | 'sibling'
  | 'reference'
  | 'prerequisite'
  | 'continuation'
  | 'alternative'
  | 'translation';

// Analytics and Performance
export interface ContentAnalytics {
  views: AnalyticsMetric;
  engagement: EngagementMetrics;
  performance: PerformanceMetrics;
  conversion: ConversionMetrics;
  feedback: FeedbackMetrics;
  social: SocialMetrics;
}

export interface AnalyticsMetric {
  total: number;
  unique: number;
  period: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  sources: Record<string, number>;
  demographics: DemographicData;
}

export interface DemographicData {
  locations: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  languages: Record<string, number>;
}

export interface EngagementMetrics {
  timeSpent: {
    average: number;
    median: number;
    distribution: number[];
  };
  scrollDepth: {
    average: number;
    distribution: number[];
  };
  interactions: InteractionMetrics;
  completion: CompletionMetrics;
}

export interface InteractionMetrics {
  clicks: number;
  shares: number;
  bookmarks: number;
  comments: number;
  likes: number;
  downloads: number;
}

export interface CompletionMetrics {
  rate: number;
  averageTime: number;
  dropoffPoints: DropoffPoint[];
}

export interface DropoffPoint {
  position: number;
  percentage: number;
  reason?: string;
}

export interface PerformanceMetrics {
  loadTime: {
    average: number;
    p95: number;
    p99: number;
  };
  renderTime: number;
  coreWebVitals: CoreWebVitals;
  errors: ErrorMetrics;
}

export interface CoreWebVitals {
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
}

export interface ErrorMetrics {
  total: number;
  types: Record<string, number>;
  severity: Record<string, number>;
}

export interface ConversionMetrics {
  goals: GoalMetric[];
  funnel: FunnelStep[];
  attribution: AttributionData;
}

export interface GoalMetric {
  name: string;
  conversions: number;
  rate: number;
  value: number;
}

export interface FunnelStep {
  name: string;
  users: number;
  rate: number;
}

export interface AttributionData {
  sources: Record<string, number>;
  campaigns: Record<string, number>;
  channels: Record<string, number>;
}

export interface FeedbackMetrics {
  rating: {
    average: number;
    distribution: number[];
    count: number;
  };
  sentiment: SentimentAnalysis;
  comments: FeedbackComment[];
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  score: number;
}

export interface FeedbackComment {
  id: string;
  content: string;
  rating: number;
  sentiment: number;
  timestamp: string;
  verified: boolean;
}

export interface SocialMetrics {
  shares: Record<string, number>;
  mentions: number;
  reach: number;
  engagement: number;
}

// SEO and Accessibility
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  openGraph: OpenGraphData;
  twitterCard: TwitterCardData;
  structuredData: StructuredData[];
  robots: RobotsDirectives;
  schema: SchemaMarkup;
}

export interface OpenGraphData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
  siteName: string;
  locale: string;
}

export interface TwitterCardData {
  card: string;
  title: string;
  description: string;
  image: string;
  creator: string;
  site: string;
}

export interface StructuredData {
  type: string;
  data: Record<string, any>;
}

export interface RobotsDirectives {
  index: boolean;
  follow: boolean;
  archive: boolean;
  snippet: boolean;
  imageIndex: boolean;
}

export interface SchemaMarkup {
  type: string;
  data: Record<string, any>;
}

export interface AccessibilityMetadata {
  level: 'A' | 'AA' | 'AAA';
  features: AccessibilityFeature[];
  alternatives: AccessibilityAlternative[];
  navigation: NavigationAids;
  testing: AccessibilityTesting;
}

export interface AccessibilityFeature {
  type: string;
  implemented: boolean;
  description: string;
}

export interface AccessibilityAlternative {
  type: 'text' | 'audio' | 'video' | 'tactile';
  url: string;
  description: string;
}

export interface NavigationAids {
  landmarks: boolean;
  headings: boolean;
  skipLinks: boolean;
  breadcrumbs: boolean;
  tableOfContents: boolean;
}

export interface AccessibilityTesting {
  automated: TestResult[];
  manual: TestResult[];
  userTesting: UserTestResult[];
}

export interface TestResult {
  tool: string;
  date: string;
  score: number;
  issues: AccessibilityIssue[];
}

export interface AccessibilityIssue {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: string;
  resolution?: string;
}

export interface UserTestResult {
  userId: string;
  assistiveDevice: string;
  date: string;
  feedback: string;
  issues: string[];
  rating: number;
}

// Audit Trail and Compliance
export interface AuditTrail {
  entries: AuditEntry[];
  retention: RetentionPolicy;
  compliance: ComplianceData;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: AuditAction;
  resource: string;
  before?: any;
  after?: any;
  metadata: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

export type AuditAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'publish'
  | 'unpublish'
  | 'approve'
  | 'reject'
  | 'assign'
  | 'comment'
  | 'view'
  | 'download'
  | 'export';

export interface RetentionPolicy {
  duration: number; // days
  archiveAfter: number; // days
  deleteAfter: number; // days
  backupInterval: number; // hours
}

export interface ComplianceData {
  gdpr: GDPRCompliance;
  ccpa: CCPACompliance;
  accessibility: AccessibilityCompliance;
  custom: Record<string, any>;
}

export interface GDPRCompliance {
  lawfulBasis: string;
  consentRequired: boolean;
  dataSubjectRights: string[];
  retentionPeriod: number;
  processingPurpose: string;
}

export interface CCPACompliance {
  personalInformation: boolean;
  saleOfData: boolean;
  optOutRights: boolean;
  deleteRights: boolean;
  disclosureRights: boolean;
}

export interface AccessibilityCompliance {
  wcagLevel: 'A' | 'AA' | 'AAA';
  section508: boolean;
  ada: boolean;
  lastAudit: string;
  nextAudit: string;
}

// Content Templates and Collections
export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  type: ContentType;
  structure: TemplateStructure;
  fields: TemplateField[];
  validation: ValidationRule[];
  defaults: Record<string, any>;
  metadata: TemplateMetadata;
  usage: TemplateUsage;
}

export interface TemplateStructure {
  sections: TemplateSection[];
  layout: LayoutConfiguration;
  styling: StylingConfiguration;
}

export interface TemplateSection {
  id: string;
  name: string;
  required: boolean;
  repeatable: boolean;
  fields: string[];
  order: number;
}

export interface LayoutConfiguration {
  type: 'single-column' | 'two-column' | 'grid' | 'custom';
  responsive: boolean;
  breakpoints: LayoutBreakpoint[];
}

export interface LayoutBreakpoint {
  name: string;
  width: number;
  columns: number;
  spacing: number;
}

export interface StylingConfiguration {
  theme: string;
  customCSS?: string;
  variables: Record<string, string>;
}

export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  validation: FieldValidation;
  configuration: FieldConfiguration;
  help?: string;
}

export type FieldType = 
  | 'text'
  | 'textarea'
  | 'rich-text'
  | 'number'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'image'
  | 'url'
  | 'email'
  | 'code'
  | 'json';

export interface FieldValidation {
  rules: ValidationRule[];
  messages: Record<string, string>;
}

export interface ValidationRule {
  type: ValidationType;
  value?: any;
  message: string;
  enabled: boolean;
}

export type ValidationType = 
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'url'
  | 'numeric'
  | 'date'
  | 'custom';

export interface FieldConfiguration {
  placeholder?: string;
  defaultValue?: any;
  options?: FieldOption[];
  multiple?: boolean;
  accept?: string; // for file inputs
  maxSize?: number; // for file inputs
  format?: string; // for date inputs
  editor?: EditorConfiguration; // for rich text
}

export interface FieldOption {
  label: string;
  value: any;
  disabled?: boolean;
  group?: string;
}

export interface EditorConfiguration {
  toolbar: string[];
  plugins: string[];
  formats: string[];
  height?: number;
  readonly?: boolean;
}

export interface TemplateMetadata {
  author: string;
  created: string;
  updated: string;
  version: string;
  tags: string[];
  category: string;
  difficulty: DifficultyLevel;
}

export interface TemplateUsage {
  totalUses: number;
  recentUses: number;
  popularFields: string[];
  averageCompletionTime: number;
  successRate: number;
}

// Content Collections and Organization
export interface ContentCollection {
  id: string;
  name: string;
  description: string;
  type: CollectionType;
  items: ContentCollectionItem[];
  organization: CollectionOrganization;
  permissions: ContentPermissions;
  metadata: CollectionMetadata;
  analytics: CollectionAnalytics;
}

export type CollectionType = 'manual' | 'dynamic' | 'mixed';

export interface ContentCollectionItem {
  contentId: string;
  order: number;
  featured: boolean;
  metadata?: Record<string, any>;
}

export interface CollectionOrganization {
  structure: OrganizationStructure;
  sorting: SortingConfiguration;
  filtering: FilterConfiguration;
  grouping: GroupingConfiguration;
}

export type OrganizationStructure = 'flat' | 'hierarchical' | 'tagged' | 'timeline';

export interface SortingConfiguration {
  field: string;
  direction: 'asc' | 'desc';
  secondary?: SortingConfiguration;
}

export interface FilterConfiguration {
  filters: ContentFilter[];
  operators: FilterOperator[];
}

export interface ContentFilter {
  field: string;
  operator: string;
  value: any;
  enabled: boolean;
}

export type FilterOperator = 'and' | 'or' | 'not';

export interface GroupingConfiguration {
  field: string;
  criteria: GroupingCriteria;
}

export interface GroupingCriteria {
  type: 'value' | 'range' | 'date' | 'custom';
  configuration: Record<string, any>;
}

export interface CollectionMetadata {
  author: string;
  created: string;
  updated: string;
  tags: string[];
  category: string;
  visibility: VisibilitySettings;
}

export interface CollectionAnalytics {
  views: number;
  interactions: number;
  completionRate: number;
  averageTime: number;
  popularItems: string[];
}