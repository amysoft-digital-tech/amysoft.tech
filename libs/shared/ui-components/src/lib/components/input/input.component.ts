import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
export type InputSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'amysoft-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="input-wrapper" [class]="wrapperClasses">
      @if (label) {
        <label [for]="inputId" class="input-label">
          {{ label }}
          @if (required) {
            <span class="text-red-500 ml-1">*</span>
          }
        </label>
      }
      
      <div class="input-container">
        @if (prefixIcon) {
          <div class="input-prefix">
            <span class="input-icon" [innerHTML]="prefixIcon"></span>
          </div>
        }
        
        <input
          [id]="inputId"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [readonly]="readonly"
          [required]="required"
          [min]="min"
          [max]="max"
          [minlength]="minlength"
          [maxlength]="maxlength"
          [pattern]="pattern"
          [autocomplete]="autocomplete"
          [class]="inputClasses"
          [value]="value"
          [attr.aria-label]="ariaLabel || label"
          [attr.aria-describedby]="helpText ? inputId + '-help' : null"
          [attr.aria-invalid]="hasError"
          [attr.data-testid]="testId"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
          (keyup.enter)="onEnterKey($event)"
        />
        
        @if (suffixIcon) {
          <div class="input-suffix">
            <span class="input-icon" [innerHTML]="suffixIcon"></span>
          </div>
        }
        
        @if (type === 'password' && showPasswordToggle) {
          <button
            type="button"
            class="input-suffix password-toggle"
            (click)="togglePasswordVisibility()"
            [attr.aria-label]="passwordVisible ? 'Hide password' : 'Show password'"
          >
            @if (passwordVisible) {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.758 7.758M12 12l2.122-2.122m-2.122 2.122L7.758 7.758m4.242 4.242L15.12 14.12m-2.878-2.878L9.12 8.12"></path>
              </svg>
            } @else {
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            }
          </button>
        }
      </div>
      
      @if (helpText && !hasError) {
        <p [id]="inputId + '-help'" class="input-help">{{ helpText }}</p>
      }
      
      @if (errorMessage && hasError) {
        <p [id]="inputId + '-error'" class="input-error">{{ errorMessage }}</p>
      }
    </div>
  `,
  styles: [`
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .input-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      display: flex;
      align-items: center;
    }
    
    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    .input-field {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      transition: all 0.2s ease;
      background-color: white;
      
      &:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      
      &:disabled {
        background-color: #f9fafb;
        color: #6b7280;
        cursor: not-allowed;
      }
      
      &:readonly {
        background-color: #f9fafb;
      }
      
      &::placeholder {
        color: #9ca3af;
      }
    }
    
    /* Size variants */
    .input-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
    }
    
    .input-md {
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
    }
    
    .input-lg {
      padding: 0.75rem 1rem;
      font-size: 1rem;
    }
    
    /* State variants */
    .input-error {
      border-color: #ef4444;
      
      &:focus {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }
    
    .input-success {
      border-color: #10b981;
      
      &:focus {
        border-color: #10b981;
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
      }
    }
    
    /* Prefix/Suffix */
    .input-prefix,
    .input-suffix {
      position: absolute;
      display: flex;
      align-items: center;
      pointer-events: none;
      z-index: 1;
    }
    
    .input-prefix {
      left: 0.75rem;
    }
    
    .input-suffix {
      right: 0.75rem;
    }
    
    .password-toggle {
      pointer-events: auto;
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: color 0.2s ease;
      
      &:hover {
        color: #374151;
      }
      
      &:focus {
        outline: none;
        color: #3b82f6;
      }
    }
    
    .input-icon {
      color: #6b7280;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    /* Adjust padding when icons are present */
    .has-prefix-icon {
      padding-left: 2.5rem;
    }
    
    .has-suffix-icon {
      padding-right: 2.5rem;
    }
    
    /* Help and error text */
    .input-help {
      font-size: 0.75rem;
      color: #6b7280;
      margin: 0;
    }
    
    .input-error {
      font-size: 0.75rem;
      color: #ef4444;
      margin: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() type: InputType = 'text';
  @Input() size: InputSize = 'md';
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() required = false;
  @Input() prefixIcon?: string;
  @Input() suffixIcon?: string;
  @Input() helpText?: string;
  @Input() errorMessage?: string;
  @Input() showPasswordToggle = true;
  @Input() ariaLabel?: string;
  @Input() testId?: string;
  @Input() autocomplete?: string;
  @Input() min?: number;
  @Input() max?: number;
  @Input() minlength?: number;
  @Input() maxlength?: number;
  @Input() pattern?: string;
  
  @Output() inputChange = new EventEmitter<string>();
  @Output() inputFocus = new EventEmitter<void>();
  @Output() inputBlur = new EventEmitter<void>();
  @Output() enterKey = new EventEmitter<Event>();
  
  value = '';
  passwordVisible = false;
  inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
  
  private onChange = (value: string) => {};
  private onTouched = () => {};
  
  get hasError(): boolean {
    return !!this.errorMessage;
  }
  
  get actualType(): string {
    if (this.type === 'password' && this.passwordVisible) {
      return 'text';
    }
    return this.type;
  }
  
  get wrapperClasses(): string {
    const classes = [`input-size-${this.size}`];
    
    if (this.hasError) {
      classes.push('input-wrapper-error');
    }
    
    return classes.join(' ');
  }
  
  get inputClasses(): string {
    const classes = [
      'input-field',
      `input-${this.size}`
    ];
    
    if (this.hasError) {
      classes.push('input-error');
    }
    
    if (this.prefixIcon) {
      classes.push('has-prefix-icon');
    }
    
    if (this.suffixIcon || (this.type === 'password' && this.showPasswordToggle)) {
      classes.push('has-suffix-icon');
    }
    
    return classes.join(' ');
  }
  
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.inputChange.emit(this.value);
  }
  
  onFocus(): void {
    this.inputFocus.emit();
  }
  
  onBlur(): void {
    this.onTouched();
    this.inputBlur.emit();
  }
  
  onEnterKey(event: Event): void {
    this.enterKey.emit(event);
  }
  
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
  
  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
  }
  
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}