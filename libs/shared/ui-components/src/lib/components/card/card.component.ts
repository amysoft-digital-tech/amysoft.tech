import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

@Component({
  selector: 'amysoft-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClasses" [attr.data-testid]="testId">
      @if (title || hasHeaderContent) {
        <div class="card-header">
          @if (title) {
            <h3 class="card-title">{{ title }}</h3>
          }
          @if (subtitle) {
            <p class="card-subtitle">{{ subtitle }}</p>
          }
          <ng-content select="[slot=header]"></ng-content>
        </div>
      }
      
      <div class="card-content">
        <ng-content></ng-content>
      </div>
      
      @if (hasFooterContent) {
        <div class="card-footer">
          <ng-content select="[slot=footer]"></ng-content>
        </div>
      }
    </div>
  `,
  styles: [`
    .card {
      border-radius: 0.5rem;
      background-color: white;
      overflow: hidden;
      transition: all 0.2s ease;
    }
    
    .card-header {
      padding: 1.5rem 1.5rem 0 1.5rem;
    }
    
    .card-title {
      margin: 0 0 0.5rem 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
    
    .card-subtitle {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .card-content {
      padding: 1.5rem;
    }
    
    .card-footer {
      padding: 0 1.5rem 1.5rem 1.5rem;
      border-top: 1px solid #f3f4f6;
      background-color: #f9fafb;
    }
    
    /* Variant styles */
    .card-default {
      border: 1px solid #e5e7eb;
    }
    
    .card-elevated {
      border: 1px solid #e5e7eb;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      
      &:hover {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        transform: translateY(-1px);
      }
    }
    
    .card-outlined {
      border: 2px solid #e5e7eb;
      
      &:hover {
        border-color: #d1d5db;
      }
    }
    
    .card-ghost {
      border: 1px solid transparent;
      background-color: transparent;
      
      &:hover {
        background-color: #f9fafb;
        border-color: #e5e7eb;
      }
    }
    
    /* Interactive cards */
    .card-interactive {
      cursor: pointer;
      
      &:hover {
        transform: translateY(-2px);
      }
      
      &:active {
        transform: translateY(0);
      }
    }
    
    /* Loading state */
    .card-loading {
      opacity: 0.6;
      pointer-events: none;
      
      .card-content {
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20px;
          height: 20px;
          margin: -10px 0 0 -10px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      }
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() variant: CardVariant = 'default';
  @Input() interactive = false;
  @Input() loading = false;
  @Input() testId?: string;
  
  // Template properties to check for projected content
  hasHeaderContent = false;
  hasFooterContent = false;
  
  ngAfterContentInit(): void {
    // This would need to be implemented with ViewChild/ContentChild
    // to detect projected content in a real implementation
  }
  
  get cardClasses(): string {
    const classes = [
      'card',
      `card-${this.variant}`
    ];
    
    if (this.interactive) {
      classes.push('card-interactive');
    }
    
    if (this.loading) {
      classes.push('card-loading');
    }
    
    return classes.join(' ');
  }
}