import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';

import { AuthService, LoginRequest } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuditService } from '../../core/services/audit.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card-wrapper">
        <mat-card class="login-card">
          <mat-card-header class="login-header">
            <div class="logo-section">
              <mat-icon class="app-icon">admin_panel_settings</mat-icon>
              <div class="app-title">
                <h1>Admin Console</h1>
                <p>Beyond the AI Plateau</p>
              </div>
            </div>
          </mat-card-header>

          <mat-card-content class="login-content">
            <!-- Main Login Form -->
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" *ngIf="!showMfaForm">
              <div class="form-header">
                <h2>Sign In</h2>
                <p class="form-subtitle">Access your administrative dashboard</p>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address</mat-label>
                <input matInput
                       type="email"
                       formControlName="email"
                       placeholder="admin@example.com"
                       autocomplete="email"
                       [class.mat-form-field-invalid]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                  Email address is required
                </mat-error>
                <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput
                       [type]="hidePassword ? 'password' : 'text'"
                       formControlName="password"
                       placeholder="Enter your password"
                       autocomplete="current-password"
                       [class.mat-form-field-invalid]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                <button mat-icon-button matSuffix 
                        type="button"
                        (click)="hidePassword = !hidePassword"
                        [attr.aria-label]="'Hide password'"
                        [attr.aria-pressed]="hidePassword">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
                <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                  Password must be at least 8 characters long
                </mat-error>
              </mat-form-field>

              <div class="form-options">
                <mat-checkbox formControlName="rememberMe" color="primary">
                  Remember me
                </mat-checkbox>
                <button type="button" 
                        mat-button 
                        color="primary" 
                        class="forgot-password-link"
                        (click)="showForgotPassword()">
                  Forgot password?
                </button>
              </div>

              <div class="form-actions">
                <button mat-raised-button 
                        color="primary" 
                        type="submit"
                        class="login-button"
                        [disabled]="loginForm.invalid || isLoading">
                  <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
                  <span *ngIf="!isLoading">Sign In</span>
                  <span *ngIf="isLoading">Signing In...</span>
                </button>
              </div>

              <div class="login-error" *ngIf="errorMessage">
                <mat-icon>error</mat-icon>
                <span>{{ errorMessage }}</span>
              </div>
            </form>

            <!-- MFA Verification Form -->
            <form [formGroup]="mfaForm" (ngSubmit)="onMfaSubmit()" *ngIf="showMfaForm">
              <div class="form-header">
                <h2>Two-Factor Authentication</h2>
                <p class="form-subtitle">Enter the 6-digit code from your authenticator app</p>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Authentication Code</mat-label>
                <input matInput
                       type="text"
                       formControlName="mfaCode"
                       placeholder="000000"
                       maxlength="6"
                       autocomplete="one-time-code"
                       [class.mat-form-field-invalid]="mfaForm.get('mfaCode')?.invalid && mfaForm.get('mfaCode')?.touched">
                <mat-icon matSuffix>security</mat-icon>
                <mat-error *ngIf="mfaForm.get('mfaCode')?.hasError('required')">
                  Authentication code is required
                </mat-error>
                <mat-error *ngIf="mfaForm.get('mfaCode')?.hasError('pattern')">
                  Please enter a 6-digit code
                </mat-error>
              </mat-form-field>

              <div class="form-actions">
                <button mat-button 
                        type="button"
                        (click)="backToLogin()"
                        [disabled]="isLoading">
                  Back
                </button>
                <button mat-raised-button 
                        color="primary" 
                        type="submit"
                        class="verify-button"
                        [disabled]="mfaForm.invalid || isLoading">
                  <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
                  <span *ngIf="!isLoading">Verify</span>
                  <span *ngIf="isLoading">Verifying...</span>
                </button>
              </div>

              <div class="login-error" *ngIf="errorMessage">
                <mat-icon>error</mat-icon>
                <span>{{ errorMessage }}</span>
              </div>
            </form>

            <!-- Forgot Password Form -->
            <form [formGroup]="forgotPasswordForm" (ngSubmit)="onForgotPasswordSubmit()" *ngIf="showForgotPasswordForm">
              <div class="form-header">
                <h2>Reset Password</h2>
                <p class="form-subtitle">Enter your email address to receive a password reset link</p>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email Address</mat-label>
                <input matInput
                       type="email"
                       formControlName="email"
                       placeholder="admin@example.com"
                       autocomplete="email">
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('required')">
                  Email address is required
                </mat-error>
                <mat-error *ngIf="forgotPasswordForm.get('email')?.hasError('email')">
                  Please enter a valid email address
                </mat-error>
              </mat-form-field>

              <div class="form-actions">
                <button mat-button 
                        type="button"
                        (click)="backToLogin()"
                        [disabled]="isLoading">
                  Back to Sign In
                </button>
                <button mat-raised-button 
                        color="primary" 
                        type="submit"
                        [disabled]="forgotPasswordForm.invalid || isLoading">
                  <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
                  <span *ngIf="!isLoading">Send Reset Link</span>
                  <span *ngIf="isLoading">Sending...</span>
                </button>
              </div>

              <div class="success-message" *ngIf="resetEmailSent">
                <mat-icon>check_circle</mat-icon>
                <span>Password reset instructions have been sent to your email address.</span>
              </div>
            </form>
          </mat-card-content>

          <mat-card-footer class="login-footer">
            <mat-divider></mat-divider>
            <div class="footer-content">
              <p>&copy; 2025 AmySoft Digital Tech. All rights reserved.</p>
              <div class="footer-links">
                <a href="/privacy" target="_blank">Privacy Policy</a>
                <a href="/terms" target="_blank">Terms of Service</a>
                <a href="/support" target="_blank">Support</a>
              </div>
            </div>
          </mat-card-footer>
        </mat-card>
      </div>
    </div>
  `,
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  mfaForm: FormGroup;
  forgotPasswordForm: FormGroup;

  isLoading = false;
  hidePassword = true;
  showMfaForm = false;
  showForgotPasswordForm = false;
  errorMessage = '';
  resetEmailSent = false;

  private returnUrl = '/dashboard';
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private notificationService: NotificationService,
    private auditService: AuditService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.createLoginForm();
    this.mfaForm = this.createMfaForm();
    this.forgotPasswordForm = this.createForgotPasswordForm();
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
      return;
    }

    // Get return URL from route parameters
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Pre-fill email if provided
    const email = this.route.snapshot.queryParams['email'];
    if (email) {
      this.loginForm.patchValue({ email });
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  private createMfaForm(): FormGroup {
    return this.fb.group({
      mfaCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  private createForgotPasswordForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const credentials: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
      rememberMe: this.loginForm.value.rememberMe
    };

    this.subscriptions.add(
      this.authService.login(credentials).subscribe({
        next: (response) => {
          if (response.mfaRequired) {
            this.showMfaForm = true;
            this.isLoading = false;
          } else {
            this.handleLoginSuccess();
          }
        },
        error: (error) => {
          this.handleLoginError(error);
        }
      })
    );
  }

  onMfaSubmit(): void {
    if (this.mfaForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.loginForm.value.email;
    const mfaCode = this.mfaForm.value.mfaCode;

    this.subscriptions.add(
      this.authService.verifyMfa(email, mfaCode).subscribe({
        next: () => {
          this.handleLoginSuccess();
        },
        error: (error) => {
          this.handleLoginError(error);
        }
      })
    );
  }

  onForgotPasswordSubmit(): void {
    if (this.forgotPasswordForm.invalid) return;

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.forgotPasswordForm.value.email;

    this.subscriptions.add(
      this.authService.requestPasswordReset(email).subscribe({
        next: () => {
          this.resetEmailSent = true;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = error.message;
          this.isLoading = false;
        }
      })
    );
  }

  showForgotPassword(): void {
    this.showForgotPasswordForm = true;
    this.showMfaForm = false;
    this.errorMessage = '';
    this.resetEmailSent = false;
    
    // Pre-fill email if available
    const email = this.loginForm.value.email;
    if (email) {
      this.forgotPasswordForm.patchValue({ email });
    }
  }

  backToLogin(): void {
    this.showMfaForm = false;
    this.showForgotPasswordForm = false;
    this.errorMessage = '';
    this.resetEmailSent = false;
    this.mfaForm.reset();
  }

  private handleLoginSuccess(): void {
    this.isLoading = false;
    
    // Log successful login
    this.auditService.logLogin(true).subscribe();
    
    this.notificationService.showSuccess('Welcome back! You have successfully signed in.');
    this.router.navigate([this.returnUrl]);
  }

  private handleLoginError(error: any): void {
    this.isLoading = false;
    this.errorMessage = error.message || 'Login failed. Please try again.';
    
    // Log failed login
    this.auditService.logLogin(false, this.errorMessage).subscribe();
    
    // Clear sensitive form data
    if (this.showMfaForm) {
      this.mfaForm.get('mfaCode')?.setValue('');
    } else {
      this.loginForm.get('password')?.setValue('');
    }
  }
}