import { Injectable } from '@angular/core';

export interface A11yAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  timeout?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AccessibilityService {
  private ariaLiveRegion?: HTMLElement;

  constructor() {
    this.createAriaLiveRegion();
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite', timeout = 5000): void {
    if (!this.ariaLiveRegion) {
      this.createAriaLiveRegion();
    }

    if (this.ariaLiveRegion) {
      // Clear previous message
      this.ariaLiveRegion.textContent = '';
      
      // Set new message with small delay to ensure screen readers pick it up
      setTimeout(() => {
        if (this.ariaLiveRegion) {
          this.ariaLiveRegion.setAttribute('aria-live', priority);
          this.ariaLiveRegion.textContent = message;
          
          // Clear message after timeout
          if (timeout > 0) {
            setTimeout(() => {
              if (this.ariaLiveRegion) {
                this.ariaLiveRegion.textContent = '';
              }
            }, timeout);
          }
        }
      }, 100);
    }
  }

  /**
   * Set focus to an element with optional announcement
   */
  focusElement(element: HTMLElement, announcement?: string): void {
    element.focus();
    
    if (announcement) {
      this.announce(announcement);
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if user has high contrast preference
   */
  prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Get the user's color scheme preference
   */
  getColorSchemePreference(): 'light' | 'dark' | 'no-preference' {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'no-preference';
  }

  /**
   * Trap focus within a container element
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      } else if (event.key === 'Escape') {
        // Allow escape to close modals/menus
        const escapeEvent = new CustomEvent('escape-pressed', { bubbles: true });
        container.dispatchEvent(escapeEvent);
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];
    
    return elements.filter(element => {
      return element.offsetParent !== null && // Element is visible
             !element.hasAttribute('hidden') &&
             element.getAttribute('tabindex') !== '-1';
    });
  }

  /**
   * Create ARIA live region for announcements
   */
  private createAriaLiveRegion(): void {
    if (typeof document !== 'undefined') {
      this.ariaLiveRegion = document.createElement('div');
      this.ariaLiveRegion.setAttribute('aria-live', 'polite');
      this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
      this.ariaLiveRegion.className = 'sr-only';
      this.ariaLiveRegion.id = 'accessibility-announcements';
      
      document.body.appendChild(this.ariaLiveRegion);
    }
  }

  /**
   * Validate WCAG contrast ratio
   */
  validateContrast(foreground: string, background: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  } {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7
    };
  }

  /**
   * Calculate relative luminance of a color
   */
  private getLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const sRGB = [r, g, b].map(value => {
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    });

    // Calculate luminance
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  /**
   * Check if element is visible to screen readers
   */
  isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    
    return !(
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      element.hasAttribute('hidden') ||
      element.getAttribute('aria-hidden') === 'true'
    );
  }

  /**
   * Generate unique ID for accessibility
   */
  generateId(prefix = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
}