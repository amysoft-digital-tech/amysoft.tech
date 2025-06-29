import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'amysoft-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      [class]="buttonClasses"
      (click)="handleClick($event)"
      [attr.aria-label]="ariaLabel"
      [attr.data-testid]="testId"
    >
      <span class="button-content" [class.opacity-0]="loading">
        <ng-content></ng-content>
      </span>
      
      @if (loading) {
        <div class="button-spinner">
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      }
    </button>
  `,
  styles: [`
    .button-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: opacity 0.2s ease;
    }
    
    .button-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    button {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.375rem;
      font-weight: 500;
      transition: all 0.2s ease;
      cursor: pointer;
      border: 1px solid transparent;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      &:focus {
        outline: none;
        ring: 2px;
        ring-offset: 2px;
      }
    }
    
    /* Size variants */
    .btn-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    
    .btn-md {
      padding: 0.625rem 1rem;
      font-size: 0.875rem;
      line-height: 1.25rem;
    }
    
    .btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      line-height: 1.5rem;
    }
    
    /* Color variants */
    .btn-primary {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
      
      &:hover:not(:disabled) {
        background-color: #2563eb;
        border-color: #2563eb;
      }
      
      &:focus {
        ring-color: #3b82f6;
      }
    }
    
    .btn-secondary {
      background-color: #6b7280;
      color: white;
      border-color: #6b7280;
      
      &:hover:not(:disabled) {
        background-color: #4b5563;
        border-color: #4b5563;
      }
      
      &:focus {
        ring-color: #6b7280;
      }
    }
    
    .btn-success {
      background-color: #10b981;
      color: white;
      border-color: #10b981;
      
      &:hover:not(:disabled) {
        background-color: #059669;
        border-color: #059669;
      }
      
      &:focus {
        ring-color: #10b981;
      }
    }
    
    .btn-warning {
      background-color: #f59e0b;
      color: white;
      border-color: #f59e0b;
      
      &:hover:not(:disabled) {
        background-color: #d97706;
        border-color: #d97706;
      }
      
      &:focus {
        ring-color: #f59e0b;
      }
    }
    
    .btn-danger {
      background-color: #ef4444;
      color: white;
      border-color: #ef4444;
      
      &:hover:not(:disabled) {
        background-color: #dc2626;
        border-color: #dc2626;
      }
      
      &:focus {
        ring-color: #ef4444;
      }
    }
    
    .btn-ghost {
      background-color: transparent;
      color: #374151;
      border-color: #d1d5db;
      
      &:hover:not(:disabled) {
        background-color: #f9fafb;
        border-color: #9ca3af;
      }
      
      &:focus {
        ring-color: #374151;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() ariaLabel?: string;
  @Input() testId?: string;
  
  @Output() buttonClick = new EventEmitter<Event>();
  
  get buttonClasses(): string {
    const classes = [
      `btn-${this.variant}`,
      `btn-${this.size}`
    ];
    
    return classes.join(' ');
  }
  
  handleClick(event: Event): void {
    if (!this.disabled && !this.loading) {
      this.buttonClick.emit(event);
    }
  }
}