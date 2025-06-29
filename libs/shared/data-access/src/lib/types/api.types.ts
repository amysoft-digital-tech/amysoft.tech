export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  statusCode?: number;
  timestamp?: string;
  path?: string;
  validation?: ValidationError[];
}

export interface ValidationError {
  field: string;
  value: any;
  constraints: string[];
}

export interface QueryParams {
  [key: string]: string | number | boolean | string[] | number[] | boolean[] | null | undefined;
}

export interface SortParams {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface FilterParams {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';
  value: any;
}

export interface SearchParams {
  query: string;
  fields?: string[];
  fuzzy?: boolean;
}

// Lead Capture API Types
export interface LeadCaptureRequest {
  email: string;
  name?: string;
  experienceLevel?: string;
  primaryLanguage?: string;
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  gdprConsent: boolean;
  marketingConsent?: boolean;
}

export interface LeadCaptureResponse {
  success: boolean;
  leadId: string;
  message: string;
  nextSteps: {
    emailSent: boolean;
    welcomeSequence: string;
    redirectUrl?: string;
  };
}

export interface EmailValidationRequest {
  email: string;
}

export interface EmailValidationResponse {
  valid: boolean;
  suggestion?: string;
  riskScore: number;
  deliverable: boolean;
  disposable: boolean;
}

// Content API Types
export interface ContentItem {
  id: string;
  type: 'chapter' | 'template' | 'article' | 'video';
  title: string;
  slug: string;
  description?: string;
  tier: 'freemium' | 'foundation' | 'advanced' | 'elite';
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter extends ContentItem {
  type: 'chapter';
  chapterNumber: number;
  content: {
    sections: ChapterSection[];
  };
  templates?: Template[];
  exercises?: Exercise[];
  estimatedReadTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites?: string[];
  nextChapter?: string;
  previousChapter?: string;
}

export interface ChapterSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'code' | 'image' | 'video';
  language?: string;
  order: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: TemplateVariable[];
  examples?: TemplateExample[];
  usageCount: number;
  rating: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array';
  example?: string;
  defaultValue?: any;
}

export interface TemplateExample {
  title: string;
  description?: string;
  input: Record<string, any>;
  output: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  instructions: string;
  solution?: string;
  hints?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

// Analytics API Types
export interface AnalyticsEvent {
  type: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: string;
}

export interface AnalyticsRequest {
  events: AnalyticsEvent[];
}

// User API Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  tier: string;
  preferences: UserPreferences;
  progress: UserProgress;
  subscription?: UserSubscription;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

export interface UserProgress {
  chaptersCompleted: string[];
  templatesUsed: string[];
  totalReadTime: number;
  streak: number;
  lastActivity: string;
  completionPercentage: number;
}

export interface UserSubscription {
  tier: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    type: string;
    last4?: string;
    brand?: string;
  };
}

// Pricing API Types
export interface PricingTier {
  id: string;
  name: string;
  description: string;
  pricing: {
    monthly: number;
    annual: number;
    currency: string;
    annualDiscount: number;
  };
  features: PricingFeature[];
  popular: boolean;
  limitations?: string[];
}

export interface PricingFeature {
  name: string;
  description: string;
  included: boolean;
  highlight?: boolean;
  limit?: number;
}

// Generic list response
export interface ListResponse<T> {
  items: T[];
  pagination: PaginationInfo;
  filters?: FilterParams[];
  sort?: SortParams;
}

// Upload types
export interface UploadResponse {
  fileId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

// Webhook types
export interface WebhookPayload {
  id: string;
  event: string;
  data: any;
  timestamp: string;
  signature: string;
}