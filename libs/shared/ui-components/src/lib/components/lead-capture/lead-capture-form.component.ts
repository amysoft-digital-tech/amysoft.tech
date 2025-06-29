import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

export interface LeadCaptureData {
  email: string;
  name?: string;
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  primaryLanguage?: string;
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  gdprConsent: boolean;
  marketingConsent?: boolean;
}

export interface LeadCaptureConfig {
  variant: 'hero' | 'pricing' | 'exit-intent' | 'blog';
  title?: string;
  subtitle?: string;
  buttonText?: string;
  showOptionalFields?: boolean;
  multiStep?: boolean;
  showPrivacyNotice?: boolean;
  enableRealTimeValidation?: boolean;
}

@Component({
  selector: 'app-lead-capture-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="lead-capture-form" [class]="'variant-' + config.variant" [attr.data-testid]="'lead-form-' + config.variant">
      <!-- Form Header -->
      <div class="form-header" *ngIf="config.title || config.subtitle">
        <h3 class="form-title" *ngIf="config.title">{{ config.title }}</h3>
        <p class="form-subtitle" *ngIf="config.subtitle">{{ config.subtitle }}</p>
      </div>

      <!-- Multi-step Progress Indicator -->
      <div class="progress-indicator" *ngIf="config.multiStep && totalSteps > 1">
        <div class="progress-steps">
          <div 
            class="progress-step" 
            *ngFor="let step of steps; let i = index"
            [class.active]="i === currentStep"
            [class.completed]="i < currentStep"
          >
            <span class="step-number">{{ i + 1 }}</span>
            <span class="step-label">{{ step.label }}</span>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="(currentStep / (totalSteps - 1)) * 100"></div>
        </div>
      </div>

      <!-- Error/Success Messages -->
      <div class="form-messages" *ngIf="submitError || submitSuccess">
        <div class="error-message" *ngIf="submitError" role="alert">
          <span class="error-icon">⚠️</span>
          {{ submitError }}
        </div>
        <div class="success-message" *ngIf="submitSuccess" role="status">
          <span class="success-icon">✅</span>
          {{ submitSuccess }}
        </div>
      </div>

      <!-- Form Content -->
      <form [formGroup]="leadForm" (ngSubmit)="onSubmit()" novalidate class="lead-form">
        <!-- Step 1: Email (Always visible) -->
        <div class="form-step" *ngIf="!config.multiStep || currentStep === 0">
          <div class="form-field">
            <label for="email-input" class="field-label">Email Address *</label>
            <div class="input-wrapper">
              <input
                id="email-input"
                type="email"
                formControlName="email"
                class="form-input"
                [class.error]="emailField?.invalid && emailField?.touched"
                [class.success]="emailField?.valid && emailField?.touched"
                placeholder="your.email@company.com"
                autocomplete="email"
                (blur)="onEmailBlur()"
                [attr.aria-describedby]="emailField?.invalid ? 'email-error' : null"
              />
              <div class="input-status" *ngIf="emailValidationStatus">
                <span class="status-icon" [ngSwitch]="emailValidationStatus">
                  <span *ngSwitchCase="'validating'">⏳</span>
                  <span *ngSwitchCase="'valid'">✅</span>
                  <span *ngSwitchCase="'invalid'">❌</span>
                </span>
              </div>
            </div>
            <div class="field-error" id="email-error" *ngIf="emailField?.invalid && emailField?.touched" role="alert">
              <span *ngIf="emailField?.errors?.['required']">Email address is required</span>
              <span *ngIf="emailField?.errors?.['email']">Please enter a valid email address</span>
              <span *ngIf="emailField?.errors?.['disposable']">Please use a permanent email address</span>
            </div>
            <div class="field-suggestion" *ngIf="emailSuggestion">
              Did you mean <button type="button" class="suggestion-link" (click)="applySuggestion()">{{ emailSuggestion }}</button>?
            </div>
          </div>

          <!-- GDPR Consent (Always required) -->
          <div class="form-field consent-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                formControlName="gdprConsent"
                class="checkbox-input"
                [class.error]="gdprField?.invalid && gdprField?.touched"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">
                I consent to processing of my personal data according to the 
                <a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a> *
              </span>
            </label>
            <div class="field-error" *ngIf="gdprField?.invalid && gdprField?.touched" role="alert">
              GDPR consent is required to continue
            </div>
          </div>

          <!-- Continue Button (Multi-step) or Submit (Single step) -->
          <button
            type="button"
            *ngIf="config.multiStep && currentStep === 0"
            class="form-button primary"
            [disabled]="!canProceedToNextStep()"
            (click)="nextStep()"
          >
            Continue
          </button>
        </div>

        <!-- Step 2: Optional Information -->
        <div class="form-step" *ngIf="(!config.multiStep && config.showOptionalFields) || (config.multiStep && currentStep === 1)">
          <div class="step-header" *ngIf="config.multiStep">
            <h4>Tell us about yourself (optional)</h4>
            <p>This helps us personalize your experience</p>
          </div>

          <div class="form-field">
            <label for="name-input" class="field-label">Full Name</label>
            <input
              id="name-input"
              type="text"
              formControlName="name"
              class="form-input"
              placeholder="John Developer"
              autocomplete="name"
            />
          </div>

          <div class="form-field">
            <label for="experience-select" class="field-label">Development Experience</label>
            <select id="experience-select" formControlName="experienceLevel" class="form-select">
              <option value="">Select your level</option>
              <option value="beginner">Beginner (0-2 years)</option>
              <option value="intermediate">Intermediate (2-5 years)</option>
              <option value="advanced">Advanced (5+ years)</option>
            </select>
          </div>

          <div class="form-field">
            <label for="language-input" class="field-label">Primary Programming Language</label>
            <input
              id="language-input"
              type="text"
              formControlName="primaryLanguage"
              class="form-input"
              placeholder="JavaScript, Python, Java, etc."
              list="language-suggestions"
            />
            <datalist id="language-suggestions">
              <option value="JavaScript">
              <option value="TypeScript">
              <option value="Python">
              <option value="Java">
              <option value="C#">
              <option value="Go">
              <option value="Rust">
              <option value="PHP">
              <option value="Ruby">
              <option value="Swift">
            </datalist>
          </div>

          <!-- Marketing Consent -->
          <div class="form-field consent-field">
            <label class="checkbox-label">
              <input
                type="checkbox"
                formControlName="marketingConsent"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">
                I'd like to receive helpful AI development tips and updates via email
              </span>
            </label>
          </div>

          <!-- Navigation Buttons (Multi-step) -->
          <div class="form-actions" *ngIf="config.multiStep">
            <button type="button" class="form-button secondary" (click)="previousStep()">
              Back
            </button>
            <button type="button" class="form-button primary" (click)="nextStep()">
              Continue
            </button>
          </div>
        </div>

        <!-- Step 3: Confirmation (Multi-step only) -->
        <div class="form-step confirmation-step" *ngIf="config.multiStep && currentStep === 2">
          <div class="step-header">
            <h4>Almost there!</h4>
            <p>Review your information and get instant access</p>
          </div>

          <div class="summary-card">
            <div class="summary-item">
              <span class="summary-label">Email:</span>
              <span class="summary-value">{{ leadForm.get('email')?.value }}</span>
            </div>
            <div class="summary-item" *ngIf="leadForm.get('name')?.value">
              <span class="summary-label">Name:</span>
              <span class="summary-value">{{ leadForm.get('name')?.value }}</span>
            </div>
            <div class="summary-item" *ngIf="leadForm.get('experienceLevel')?.value">
              <span class="summary-label">Experience:</span>
              <span class="summary-value">{{ getExperienceLevelText(leadForm.get('experienceLevel')?.value) }}</span>
            </div>
          </div>

          <!-- Final Submit -->
          <div class="form-actions">
            <button type="button" class="form-button secondary" (click)="previousStep()">
              Back
            </button>
            <button
              type="submit"
              class="form-button primary"
              [disabled]="leadForm.invalid || isSubmitting"
              [class.loading]="isSubmitting"
            >
              <span *ngIf="!isSubmitting">{{ config.buttonText || 'Get Instant Access' }}</span>
              <span *ngIf="isSubmitting">
                <span class="spinner"></span>
                Processing...
              </span>
            </button>
          </div>
        </div>

        <!-- Single Step Submit Button -->
        <button
          type="submit"
          *ngIf="!config.multiStep"
          class="form-button primary"
          [disabled]="leadForm.invalid || isSubmitting"
          [class.loading]="isSubmitting"
        >
          <span *ngIf="!isSubmitting">{{ config.buttonText || 'Get Started' }}</span>
          <span *ngIf="isSubmitting">
            <span class="spinner"></span>
            Submitting...
          </span>
        </button>
      </form>

      <!-- Privacy Notice -->
      <div class="privacy-notice" *ngIf="config.showPrivacyNotice">
        <p class="privacy-text">
          <span class="privacy-icon">🔒</span>
          Your information is secure and will never be shared with third parties.
        </p>
      </div>

      <!-- Social Proof (for certain variants) -->
      <div class="social-proof" *ngIf="config.variant === 'hero' || config.variant === 'pricing'">
        <div class="social-proof-stats">
          <div class="stat-item">
            <span class="stat-number">1,247</span>
            <span class="stat-label">Developers</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">4.8★</span>
            <span class="stat-label">Rating</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">89</span>
            <span class="stat-label">Reviews</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./lead-capture-form.component.scss']
})
export class LeadCaptureFormComponent implements OnInit, OnDestroy {
  @Input() config: LeadCaptureConfig = {
    variant: 'hero',
    showOptionalFields: true,
    multiStep: false,
    showPrivacyNotice: true,
    enableRealTimeValidation: true
  };

  @Output() formSubmit = new EventEmitter<LeadCaptureData>();
  @Output() formStep = new EventEmitter<{ step: number; data: Partial<LeadCaptureData> }>();

  leadForm: FormGroup;
  isSubmitting = false;
  submitError = '';
  submitSuccess = '';
  emailValidationStatus: 'validating' | 'valid' | 'invalid' | '' = '';
  emailSuggestion = '';

  // Multi-step form
  currentStep = 0;
  totalSteps = 3;
  steps = [
    { label: 'Email', required: true },
    { label: 'Details', required: false },
    { label: 'Confirm', required: false }
  ];

  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.leadForm = this.createForm();
  }

  ngOnInit() {
    this.setupFormValidation();
    this.trackUtmParameters();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: [''],
      experienceLevel: [''],
      primaryLanguage: [''],
      gdprConsent: [false, Validators.requiredTrue],
      marketingConsent: [false]
    });
  }

  private setupFormValidation() {
    if (this.config.enableRealTimeValidation) {
      this.leadForm.get('email')?.valueChanges
        .pipe(
          debounceTime(500),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(email => {
          if (email && this.emailField?.valid) {
            this.validateEmailAsync(email);
          }
        });
    }
  }

  private trackUtmParameters() {
    // In a real implementation, this would get UTM parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const utmData = {
      utmSource: urlParams.get('utm_source') || undefined,
      utmMedium: urlParams.get('utm_medium') || undefined,
      utmCampaign: urlParams.get('utm_campaign') || undefined
    };
    
    // Store UTM data for form submission
    Object.assign(this.leadForm.value, utmData);
  }

  private async validateEmailAsync(email: string) {
    this.emailValidationStatus = 'validating';
    
    try {
      // Mock validation - in real implementation, call the API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (this.isDisposableEmail(email)) {
        this.leadForm.get('email')?.setErrors({ disposable: true });
        this.emailValidationStatus = 'invalid';
        this.emailSuggestion = this.suggestAlternativeEmail(email);
      } else {
        this.emailValidationStatus = 'valid';
        this.emailSuggestion = '';
      }
    } catch (error) {
      this.emailValidationStatus = '';
    }
  }

  private isDisposableEmail(email: string): boolean {
    const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    const domain = email.split('@')[1];
    return disposableDomains.includes(domain);
  }

  private suggestAlternativeEmail(email: string): string {
    const [localPart] = email.split('@');
    return `${localPart}@gmail.com`;
  }

  onEmailBlur() {
    const email = this.leadForm.get('email')?.value;
    if (email && this.emailField?.valid) {
      this.validateEmailAsync(email);
    }
  }

  applySuggestion() {
    this.leadForm.patchValue({ email: this.emailSuggestion });
    this.emailSuggestion = '';
    this.emailValidationStatus = 'valid';
  }

  canProceedToNextStep(): boolean {
    if (this.currentStep === 0) {
      return this.emailField?.valid && this.gdprField?.valid;
    }
    return true;
  }

  nextStep() {
    if (this.canProceedToNextStep() && this.currentStep < this.totalSteps - 1) {
      this.currentStep++;
      this.emitStepChange();
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.emitStepChange();
    }
  }

  private emitStepChange() {
    this.formStep.emit({
      step: this.currentStep,
      data: this.leadForm.value
    });
  }

  getExperienceLevelText(level: string): string {
    const levels = {
      beginner: 'Beginner (0-2 years)',
      intermediate: 'Intermediate (2-5 years)',
      advanced: 'Advanced (5+ years)'
    };
    return levels[level as keyof typeof levels] || level;
  }

  async onSubmit() {
    if (this.leadForm.invalid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    try {
      const formData: LeadCaptureData = {
        ...this.leadForm.value,
        source: this.config.variant,
        utmSource: new URLSearchParams(window.location.search).get('utm_source') || undefined,
        utmMedium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
        utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined
      };

      this.formSubmit.emit(formData);
      
      // Mock success - in real implementation, wait for the parent component to handle the response
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.submitSuccess = 'Success! Check your email for next steps.';
      this.leadForm.reset();
      this.currentStep = 0;
      
    } catch (error) {
      this.submitError = 'Something went wrong. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  // Getters for template
  get emailField() { return this.leadForm.get('email'); }
  get gdprField() { return this.leadForm.get('gdprConsent'); }
}