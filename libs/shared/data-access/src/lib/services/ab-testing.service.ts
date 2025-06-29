import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AnalyticsService } from './analytics.service';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABVariant[];
  trafficAllocation: number; // Percentage of users to include in test
  startDate?: Date;
  endDate?: Date;
  targetMetric: string;
  confidenceLevel: number;
  minimumSampleSize: number;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of test traffic
  config: Record<string, any>;
  isControl: boolean;
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  assignedAt: Date;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  metric: string;
  value: number;
  conversionRate?: number;
  sampleSize: number;
  confidence?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ABTestingService {
  private analyticsService = inject(AnalyticsService);
  
  private assignments = new Map<string, ABTestAssignment>();
  private tests$ = new BehaviorSubject<ABTest[]>([]);
  
  // Default tests configuration
  private readonly defaultTests: ABTest[] = [
    {
      id: 'hero_headline_test',
      name: 'Hero Headline Variation',
      description: 'Test different headline variations on the home page',
      status: 'running',
      variants: [
        {
          id: 'control',
          name: 'Control - Original',
          description: 'Beyond the AI Plateau: Master the Elite Principles',
          weight: 50,
          config: {
            headline: 'Beyond the AI Plateau: Master the Elite Principles of AI-Driven Development',
            subheadline: 'Transform from AI novice to elite developer with proven strategies that 97% of developers miss'
          },
          isControl: true
        },
        {
          id: 'urgency_variant',
          name: 'Urgency Focused',
          description: 'Emphasis on urgency and missing out',
          weight: 50,
          config: {
            headline: 'The AI Skills Gap is Widening Fast. Don\'t Get Left Behind.',
            subheadline: 'Join the Elite 3% of developers who\'ve mastered AI-driven development before your competition does'
          },
          isControl: false
        }
      ],
      trafficAllocation: 100,
      targetMetric: 'lead_conversion',
      confidenceLevel: 95,
      minimumSampleSize: 1000
    },
    {
      id: 'pricing_display_test',
      name: 'Pricing Display Format',
      description: 'Test different ways to display pricing',
      status: 'running',
      variants: [
        {
          id: 'monthly_first',
          name: 'Monthly Price First',
          description: 'Show monthly price prominently',
          weight: 50,
          config: {
            displayFormat: 'monthly_primary',
            showAnnualSavings: true
          },
          isControl: true
        },
        {
          id: 'annual_first',
          name: 'Annual Price First',
          description: 'Show annual price prominently with savings',
          weight: 50,
          config: {
            displayFormat: 'annual_primary',
            showAnnualSavings: true,
            highlightSavings: true
          },
          isControl: false
        }
      ],
      trafficAllocation: 80,
      targetMetric: 'subscription_conversion',
      confidenceLevel: 95,
      minimumSampleSize: 500
    },
    {
      id: 'cta_button_test',
      name: 'CTA Button Optimization',
      description: 'Test different call-to-action button variations',
      status: 'running',
      variants: [
        {
          id: 'get_access',
          name: 'Get Access',
          description: 'Standard access-focused CTA',
          weight: 33,
          config: {
            text: 'Get Instant Access',
            style: 'primary',
            size: 'large'
          },
          isControl: true
        },
        {
          id: 'start_learning',
          name: 'Start Learning',
          description: 'Learning-focused CTA',
          weight: 33,
          config: {
            text: 'Start Learning Now',
            style: 'primary',
            size: 'large'
          },
          isControl: false
        },
        {
          id: 'join_elite',
          name: 'Join Elite',
          description: 'Exclusivity-focused CTA',
          weight: 34,
          config: {
            text: 'Join the Elite 3%',
            style: 'gradient',
            size: 'large'
          },
          isControl: false
        }
      ],
      trafficAllocation: 90,
      targetMetric: 'button_click_rate',
      confidenceLevel: 90,
      minimumSampleSize: 2000
    }
  ];

  constructor() {
    this.tests$.next(this.defaultTests);
    this.loadStoredAssignments();
  }

  /**
   * Get all active tests
   */
  getActiveTests(): Observable<ABTest[]> {
    return this.tests$.asObservable();
  }

  /**
   * Get variant for a specific test
   */
  getVariant(testId: string, userId?: string): ABVariant | null {
    const test = this.getTestById(testId);
    if (!test || test.status !== 'running') {
      return null;
    }

    // Check if user should be included in test
    if (!this.shouldIncludeInTest(test, userId)) {
      return null;
    }

    // Check existing assignment
    const existingAssignment = this.assignments.get(testId);
    if (existingAssignment) {
      return this.getVariantById(test, existingAssignment.variantId);
    }

    // Create new assignment
    const variant = this.assignVariant(test, userId);
    if (variant) {
      this.trackAssignment(test, variant, userId);
    }

    return variant;
  }

  /**
   * Get configuration for a test variant
   */
  getVariantConfig(testId: string, userId?: string): Record<string, any> {
    const variant = this.getVariant(testId, userId);
    return variant?.config || {};
  }

  /**
   * Check if user is in a specific variant
   */
  isInVariant(testId: string, variantId: string, userId?: string): boolean {
    const variant = this.getVariant(testId, userId);
    return variant?.id === variantId;
  }

  /**
   * Track conversion event for A/B test
   */
  trackConversion(testId: string, metric: string, value: number = 1, userId?: string): void {
    const assignment = this.assignments.get(testId);
    if (!assignment) {
      return;
    }

    this.analyticsService.trackEvent('ab_test_conversion', {
      test_id: testId,
      variant_id: assignment.variantId,
      metric,
      value,
      user_id: userId,
      session_id: assignment.sessionId
    });
  }

  /**
   * Track interaction event for A/B test
   */
  trackInteraction(testId: string, interaction: string, properties: Record<string, any> = {}, userId?: string): void {
    const assignment = this.assignments.get(testId);
    if (!assignment) {
      return;
    }

    this.analyticsService.trackEvent('ab_test_interaction', {
      test_id: testId,
      variant_id: assignment.variantId,
      interaction,
      user_id: userId,
      session_id: assignment.sessionId,
      ...properties
    });
  }

  /**
   * Force assignment to specific variant (for testing)
   */
  forceVariant(testId: string, variantId: string, userId?: string): void {
    const test = this.getTestById(testId);
    const variant = this.getVariantById(test, variantId);
    
    if (test && variant) {
      const assignment: ABTestAssignment = {
        testId,
        variantId,
        userId,
        sessionId: this.getSessionId(),
        assignedAt: new Date()
      };

      this.assignments.set(testId, assignment);
      this.saveAssignments();
      
      this.analyticsService.trackEvent('ab_test_forced_assignment', {
        test_id: testId,
        variant_id: variantId,
        user_id: userId
      });
    }
  }

  /**
   * Clear all test assignments (for testing)
   */
  clearAssignments(): void {
    this.assignments.clear();
    localStorage.removeItem('ab_test_assignments');
  }

  /**
   * Get test results summary
   */
  getTestResults(testId: string): ABTestResult[] {
    // This would typically fetch from analytics API
    // For now, return mock data structure
    const test = this.getTestById(testId);
    if (!test) return [];

    return test.variants.map(variant => ({
      testId,
      variantId: variant.id,
      metric: test.targetMetric,
      value: 0,
      sampleSize: 0
    }));
  }

  /**
   * Get test by ID
   */
  private getTestById(testId: string): ABTest | null {
    return this.tests$.value.find(test => test.id === testId) || null;
  }

  /**
   * Get variant by ID within a test
   */
  private getVariantById(test: ABTest | null, variantId: string): ABVariant | null {
    if (!test) return null;
    return test.variants.find(variant => variant.id === variantId) || null;
  }

  /**
   * Check if user should be included in test
   */
  private shouldIncludeInTest(test: ABTest, userId?: string): boolean {
    // Check traffic allocation
    const hash = this.hashString(userId || this.getSessionId());
    const bucket = hash % 100;
    
    return bucket < test.trafficAllocation;
  }

  /**
   * Assign user to a variant based on weights
   */
  private assignVariant(test: ABTest, userId?: string): ABVariant | null {
    const seed = userId || this.getSessionId();
    const hash = this.hashString(seed + test.id);
    const bucket = hash % 100;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (bucket < cumulativeWeight) {
        const assignment: ABTestAssignment = {
          testId: test.id,
          variantId: variant.id,
          userId,
          sessionId: this.getSessionId(),
          assignedAt: new Date()
        };

        this.assignments.set(test.id, assignment);
        this.saveAssignments();
        
        return variant;
      }
    }

    return null;
  }

  /**
   * Track assignment event
   */
  private trackAssignment(test: ABTest, variant: ABVariant, userId?: string): void {
    this.analyticsService.trackEvent('ab_test_assignment', {
      test_id: test.id,
      test_name: test.name,
      variant_id: variant.id,
      variant_name: variant.name,
      is_control: variant.isControl,
      user_id: userId,
      session_id: this.getSessionId()
    });
  }

  /**
   * Generate hash from string
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get or generate session ID
   */
  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('ab_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ab_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Save assignments to localStorage
   */
  private saveAssignments(): void {
    const assignmentsData = Array.from(this.assignments.entries());
    localStorage.setItem('ab_test_assignments', JSON.stringify(assignmentsData));
  }

  /**
   * Load assignments from localStorage
   */
  private loadStoredAssignments(): void {
    try {
      const stored = localStorage.getItem('ab_test_assignments');
      if (stored) {
        const assignmentsData = JSON.parse(stored);
        this.assignments = new Map(assignmentsData);
      }
    } catch (error) {
      console.warn('Failed to load A/B test assignments:', error);
    }
  }
}