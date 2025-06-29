import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TemplateDemo {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: TemplateVariable[];
  examples: TemplateExample[];
  beforeAfter?: {
    before: string;
    after: string;
  };
  metrics?: {
    usageCount: number;
    rating: number;
    timeSaved: string;
    successRate: number;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  requiredTier: string;
  tags: string[];
  author: string;
  lastUpdated: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  required: boolean;
  example: string;
  type?: 'text' | 'number' | 'url' | 'email' | 'select';
  options?: string[];
}

export interface TemplateExample {
  title: string;
  description: string;
  input: Record<string, string>;
  output: string;
  resultMetrics?: {
    responseTime?: string;
    accuracy?: string;
    satisfaction?: number;
  };
}

export interface TemplateDemoConfig {
  showInteractiveDemo?: boolean;
  showBeforeAfter?: boolean;
  showMetrics?: boolean;
  showExamples?: boolean;
  enableCopyToClipboard?: boolean;
  showVariables?: boolean;
  defaultExampleIndex?: number;
}

@Component({
  selector: 'app-template-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="template-demo" 
      [class.interactive]="config.showInteractiveDemo"
      [attr.data-template]="template.id"
      [attr.data-testid]="'template-demo-' + template.id"
    >
      <!-- Demo Header -->
      <header class="demo-header">
        <div class="header-content">
          <div class="title-section">
            <h3 class="template-name">{{ template.name }}</h3>
            <p class="template-description">{{ template.description }}</p>
          </div>
          
          <div class="header-meta">
            <!-- Category Badge -->
            <span class="category-badge">{{ template.category }}</span>
            
            <!-- Difficulty Badge -->
            <span class="difficulty-badge" [class]="'difficulty-' + template.difficulty">
              {{ getDifficultyLabel(template.difficulty) }}
            </span>
            
            <!-- Tier Badge -->
            <span class="tier-badge" [class]="'tier-' + template.requiredTier">
              {{ getTierLabel(template.requiredTier) }}
            </span>
          </div>
        </div>

        <!-- Metrics Overview -->
        <div class="metrics-overview" *ngIf="config.showMetrics && template.metrics">
          <div class="metric-item">
            <span class="metric-value">{{ formatUsageCount(template.metrics.usageCount) }}</span>
            <span class="metric-label">Uses</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">{{ template.metrics.rating }}/5</span>
            <span class="metric-label">Rating</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">{{ template.metrics.timeSaved }}</span>
            <span class="metric-label">Time Saved</span>
          </div>
          <div class="metric-item">
            <span class="metric-value">{{ template.metrics.successRate }}%</span>
            <span class="metric-label">Success Rate</span>
          </div>
        </div>
      </header>

      <!-- Before/After Section -->
      <section class="before-after-section" *ngIf="config.showBeforeAfter && template.beforeAfter">
        <h4 class="section-title">See the Difference</h4>
        <div class="comparison-grid">
          <div class="comparison-item before">
            <h5 class="comparison-title">
              <span class="comparison-icon">😓</span>
              Before
            </h5>
            <div class="comparison-content">
              <pre class="code-block">{{ template.beforeAfter.before }}</pre>
            </div>
          </div>
          <div class="comparison-item after">
            <h5 class="comparison-title">
              <span class="comparison-icon">✨</span>
              After
            </h5>
            <div class="comparison-content">
              <pre class="code-block">{{ template.beforeAfter.after }}</pre>
            </div>
          </div>
        </div>
      </section>

      <!-- Interactive Demo Section -->
      <section class="interactive-demo" *ngIf="config.showInteractiveDemo">
        <h4 class="section-title">Try It Yourself</h4>
        
        <!-- Variable Inputs -->
        <div class="variables-section" *ngIf="config.showVariables">
          <div class="variables-grid">
            <div 
              class="variable-input"
              *ngFor="let variable of template.variables"
            >
              <label [for]="'var-' + variable.name" class="variable-label">
                {{ variable.name }}
                <span class="required-indicator" *ngIf="variable.required">*</span>
              </label>
              
              <input 
                [id]="'var-' + variable.name"
                [type]="variable.type || 'text'"
                [(ngModel)]="variableValues[variable.name]"
                [placeholder]="variable.example"
                [required]="variable.required"
                class="variable-field"
                (input)="onVariableChange()"
              />
              
              <select 
                *ngIf="variable.type === 'select' && variable.options"
                [id]="'var-' + variable.name"
                [(ngModel)]="variableValues[variable.name]"
                class="variable-field"
                (change)="onVariableChange()"
              >
                <option value="">Select {{ variable.name }}</option>
                <option *ngFor="let option of variable.options" [value]="option">
                  {{ option }}
                </option>
              </select>
              
              <p class="variable-description">{{ variable.description }}</p>
            </div>
          </div>
        </div>

        <!-- Generated Template -->
        <div class="template-output">
          <div class="output-header">
            <h5 class="output-title">Generated Template</h5>
            <button 
              class="copy-button"
              *ngIf="config.enableCopyToClipboard"
              (click)="copyToClipboard(generatedTemplate)"
              [class.copied]="copySuccess"
              [attr.aria-label]="'Copy template to clipboard'"
            >
              <span class="copy-icon">{{ copySuccess ? '✓' : '📋' }}</span>
              <span class="copy-text">{{ copySuccess ? 'Copied!' : 'Copy' }}</span>
            </button>
          </div>
          
          <div class="template-container">
            <pre class="template-code" [innerHTML]="getHighlightedTemplate()"></pre>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <button class="action-button primary" (click)="generateExample()">
            <span class="button-icon">🎲</span>
            <span class="button-text">Generate Example</span>
          </button>
          
          <button class="action-button secondary" (click)="resetTemplate()">
            <span class="button-icon">🔄</span>
            <span class="button-text">Reset</span>
          </button>
          
          <button class="action-button secondary" (click)="saveTemplate()">
            <span class="button-icon">💾</span>
            <span class="button-text">Save</span>
          </button>
        </div>
      </section>

      <!-- Examples Section -->
      <section class="examples-section" *ngIf="config.showExamples && template.examples.length > 0">
        <h4 class="section-title">Real Examples</h4>
        
        <!-- Example Selector -->
        <div class="example-selector">
          <button 
            class="example-tab"
            *ngFor="let example of template.examples; let i = index"
            [class.active]="i === selectedExampleIndex"
            (click)="selectExample(i)"
          >
            {{ example.title }}
          </button>
        </div>

        <!-- Selected Example -->
        <div class="example-content" *ngIf="selectedExample">
          <div class="example-header">
            <h5 class="example-title">{{ selectedExample.title }}</h5>
            <p class="example-description">{{ selectedExample.description }}</p>
          </div>

          <div class="example-demo">
            <!-- Input Variables -->
            <div class="example-input">
              <h6 class="subsection-title">Input Variables</h6>
              <div class="input-list">
                <div 
                  class="input-item"
                  *ngFor="let input of getInputArray(selectedExample.input)"
                >
                  <span class="input-name">{{ input.key }}:</span>
                  <span class="input-value">{{ input.value }}</span>
                </div>
              </div>
            </div>

            <!-- Generated Output -->
            <div class="example-output">
              <h6 class="subsection-title">Generated Output</h6>
              <div class="output-container">
                <pre class="output-code">{{ selectedExample.output }}</pre>
                <button 
                  class="copy-output-button"
                  (click)="copyToClipboard(selectedExample.output)"
                  [attr.aria-label]="'Copy output to clipboard'"
                >
                  📋
                </button>
              </div>
            </div>

            <!-- Result Metrics -->
            <div class="result-metrics" *ngIf="selectedExample.resultMetrics">
              <h6 class="subsection-title">Performance Metrics</h6>
              <div class="metrics-grid">
                <div class="metric-card" *ngIf="selectedExample.resultMetrics.responseTime">
                  <span class="metric-icon">⚡</span>
                  <span class="metric-value">{{ selectedExample.resultMetrics.responseTime }}</span>
                  <span class="metric-label">Response Time</span>
                </div>
                <div class="metric-card" *ngIf="selectedExample.resultMetrics.accuracy">
                  <span class="metric-icon">🎯</span>
                  <span class="metric-value">{{ selectedExample.resultMetrics.accuracy }}</span>
                  <span class="metric-label">Accuracy</span>
                </div>
                <div class="metric-card" *ngIf="selectedExample.resultMetrics.satisfaction">
                  <span class="metric-icon">😊</span>
                  <span class="metric-value">{{ selectedExample.resultMetrics.satisfaction }}/10</span>
                  <span class="metric-label">Satisfaction</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Tags Section -->
      <footer class="demo-footer">
        <div class="tags-section">
          <span 
            class="tag"
            *ngFor="let tag of template.tags"
          >
            {{ tag }}
          </span>
        </div>
        
        <div class="footer-meta">
          <span class="author-credit">By {{ template.author }}</span>
          <span class="last-updated">Updated {{ formatDate(template.lastUpdated) }}</span>
        </div>
      </footer>

      <!-- Access Overlay -->
      <div class="access-overlay" *ngIf="isLocked">
        <div class="overlay-content">
          <div class="lock-icon">🔓</div>
          <h4 class="overlay-title">Upgrade to Access This Template</h4>
          <p class="overlay-description">
            This template requires the {{ getTierLabel(template.requiredTier) }} tier or higher
          </p>
          <button class="upgrade-button" (click)="onUpgradeClick()">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./template-demo.component.scss']
})
export class TemplateDemoComponent implements OnInit {
  @Input() template!: TemplateDemo;
  @Input() userTier: string = 'free';
  @Input() config: TemplateDemoConfig = {
    showInteractiveDemo: true,
    showBeforeAfter: true,
    showMetrics: true,
    showExamples: true,
    enableCopyToClipboard: true,
    showVariables: true,
    defaultExampleIndex: 0
  };

  @Output() templateUsed = new EventEmitter<{ template: TemplateDemo; variables: Record<string, string> }>();
  @Output() templateSaved = new EventEmitter<TemplateDemo>();
  @Output() upgradeRequested = new EventEmitter<{ template: TemplateDemo; requiredTier: string }>();

  variableValues: Record<string, string> = {};
  generatedTemplate = '';
  selectedExampleIndex = 0;
  copySuccess = false;

  ngOnInit() {
    this.initializeVariables();
    this.selectedExampleIndex = this.config.defaultExampleIndex || 0;
    this.generateTemplate();
  }

  private initializeVariables() {
    this.template.variables.forEach(variable => {
      this.variableValues[variable.name] = variable.example;
    });
  }

  onVariableChange() {
    this.generateTemplate();
  }

  private generateTemplate() {
    let template = this.template.template;
    
    // Replace variables in template
    Object.entries(this.variableValues).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      template = template.replace(regex, value || `[${key}]`);
    });
    
    this.generatedTemplate = template;
  }

  getHighlightedTemplate(): string {
    // Simple syntax highlighting for template variables
    return this.generatedTemplate
      .replace(/\[([^\]]+)\]/g, '<span class="variable-placeholder">[$1]</span>')
      .replace(/(\w+):/g, '<span class="property-name">$1:</span>');
  }

  generateExample() {
    if (this.template.examples.length > 0) {
      const randomExample = this.template.examples[Math.floor(Math.random() * this.template.examples.length)];
      this.variableValues = { ...randomExample.input };
      this.generateTemplate();
    }
  }

  resetTemplate() {
    this.initializeVariables();
    this.generateTemplate();
  }

  saveTemplate() {
    this.templateSaved.emit(this.template);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess = true;
      setTimeout(() => {
        this.copySuccess = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  selectExample(index: number) {
    this.selectedExampleIndex = index;
  }

  getInputArray(input: Record<string, string>): Array<{ key: string; value: string }> {
    return Object.entries(input).map(([key, value]) => ({ key, value }));
  }

  onUpgradeClick() {
    this.upgradeRequested.emit({
      template: this.template,
      requiredTier: this.template.requiredTier
    });
  }

  getDifficultyLabel(difficulty: string): string {
    const labels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return labels[difficulty as keyof typeof labels] || difficulty;
  }

  getTierLabel(tier: string): string {
    const labels = {
      free: 'Free',
      foundation: 'Foundation',
      professional: 'Professional',
      elite: 'Elite'
    };
    return labels[tier as keyof typeof labels] || tier;
  }

  formatUsageCount(count: number): string {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  get selectedExample(): TemplateExample | undefined {
    return this.template.examples[this.selectedExampleIndex];
  }

  get isLocked(): boolean {
    const tierHierarchy = {
      'free': 0,
      'foundation': 1,
      'professional': 2,
      'elite': 3
    };

    const userTierLevel = tierHierarchy[this.userTier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[this.template.requiredTier as keyof typeof tierHierarchy] || 0;

    return userTierLevel < requiredTierLevel;
  }
}