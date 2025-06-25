/**
 * Enterprise Theme Service
 * Manages theme switching, accessibility preferences, and dynamic styling
 */

import { Injectable, Inject, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable, fromEvent, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { 
  ENTERPRISE_THEME_CONFIG, 
  ENTERPRISE_LIGHT_THEME, 
  ENTERPRISE_DARK_THEME,
  ENTERPRISE_ACCESSIBILITY 
} from '../themes/enterprise-theme';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ColorScheme = 'light' | 'dark';

export interface ThemePreferences {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'normal' | 'large';
  density: 'compact' | 'normal' | 'comfortable';
}

export interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService implements OnDestroy {
  private readonly STORAGE_KEY = 'admin_theme_preferences';
  private readonly CSS_VARIABLES_PREFIX = '--enterprise';
  
  private destroy$ = new Subject<void>();
  private preferencesSubject = new BehaviorSubject<ThemePreferences>(this.getDefaultPreferences());
  private systemPreferencesSubject = new BehaviorSubject<{ colorScheme: ColorScheme; reducedMotion: boolean }>(
    this.getSystemPreferences()
  );

  public preferences$ = this.preferencesSubject.asObservable();
  public systemPreferences$ = this.systemPreferencesSubject.asObservable();
  
  // Computed observables
  public currentTheme$ = combineLatest([
    this.preferences$,
    this.systemPreferences$
  ]).pipe(
    map(([prefs, system]) => this.computeCurrentTheme(prefs, system)),
    distinctUntilChanged()
  );

  public isDarkMode$ = this.currentTheme$.pipe(
    map(theme => theme.colorScheme === 'dark'),
    distinctUntilChanged()
  );

  public accessibilitySettings$ = this.preferences$.pipe(
    map(prefs => this.computeAccessibilitySettings(prefs)),
    distinctUntilChanged()
  );

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.initializeTheme();
    this.watchSystemPreferences();
    this.applyTheme();
    
    // Apply theme changes
    this.currentTheme$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(theme => {
      this.updateCSSVariables(theme);
      this.updateDocumentClasses(theme);
      this.updateMetaThemeColor(theme);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Update theme preferences
   */
  updatePreferences(preferences: Partial<ThemePreferences>): void {
    const current = this.preferencesSubject.value;
    const updated = { ...current, ...preferences };
    
    this.preferencesSubject.next(updated);
    this.savePreferences(updated);
  }

  /**
   * Toggle between light and dark mode
   */
  toggleTheme(): void {
    const current = this.preferencesSubject.value;
    const newMode: ThemeMode = current.mode === 'light' ? 'dark' : 'light';
    this.updatePreferences({ mode: newMode });
  }

  /**
   * Set specific theme mode
   */
  setThemeMode(mode: ThemeMode): void {
    this.updatePreferences({ mode });
  }

  /**
   * Toggle reduced motion
   */
  toggleReducedMotion(): void {
    const current = this.preferencesSubject.value;
    this.updatePreferences({ reducedMotion: !current.reducedMotion });
  }

  /**
   * Toggle high contrast
   */
  toggleHighContrast(): void {
    const current = this.preferencesSubject.value;
    this.updatePreferences({ highContrast: !current.highContrast });
  }

  /**
   * Set font size preference
   */
  setFontSize(fontSize: 'small' | 'normal' | 'large'): void {
    this.updatePreferences({ fontSize });
  }

  /**
   * Set density preference
   */
  setDensity(density: 'compact' | 'normal' | 'comfortable'): void {
    this.updatePreferences({ density });
  }

  /**
   * Get current theme configuration
   */
  getCurrentTheme(): Observable<any> {
    return this.currentTheme$;
  }

  /**
   * Get color value from current theme
   */
  getColorValue(colorPath: string): Observable<string> {
    return this.currentTheme$.pipe(
      map(theme => this.getNestedProperty(theme.colors, colorPath) || ''),
      distinctUntilChanged()
    );
  }

  /**
   * Generate CSS custom properties for components
   */
  getCSSVariables(): Observable<Record<string, string>> {
    return this.currentTheme$.pipe(
      map(theme => this.generateCSSVariables(theme))
    );
  }

  /**
   * Initialize theme on service creation
   */
  private initializeTheme(): void {
    const saved = this.loadPreferences();
    if (saved) {
      this.preferencesSubject.next(saved);
    }
  }

  /**
   * Watch for system preference changes
   */
  private watchSystemPreferences(): void {
    // Watch for color scheme changes
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

      fromEvent(darkModeQuery, 'change').pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.updateSystemPreferences();
      });

      fromEvent(reducedMotionQuery, 'change').pipe(
        takeUntil(this.destroy$)
      ).subscribe(() => {
        this.updateSystemPreferences();
      });
    }
  }

  /**
   * Apply initial theme
   */
  private applyTheme(): void {
    // Apply initial theme immediately to prevent flash
    const currentTheme = this.computeCurrentTheme(
      this.preferencesSubject.value,
      this.systemPreferencesSubject.value
    );
    
    this.updateCSSVariables(currentTheme);
    this.updateDocumentClasses(currentTheme);
    this.updateMetaThemeColor(currentTheme);
  }

  /**
   * Compute current theme based on preferences
   */
  private computeCurrentTheme(preferences: ThemePreferences, system: any): any {
    let colorScheme: ColorScheme;
    
    if (preferences.mode === 'auto') {
      colorScheme = system.colorScheme;
    } else {
      colorScheme = preferences.mode as ColorScheme;
    }

    const baseTheme = colorScheme === 'dark' ? ENTERPRISE_DARK_THEME : ENTERPRISE_LIGHT_THEME;
    
    return {
      ...baseTheme,
      colorScheme,
      preferences: {
        ...preferences,
        reducedMotion: preferences.reducedMotion || system.reducedMotion
      }
    };
  }

  /**
   * Compute accessibility settings
   */
  private computeAccessibilitySettings(preferences: ThemePreferences): AccessibilitySettings {
    return {
      reducedMotion: preferences.reducedMotion,
      highContrast: preferences.highContrast,
      screenReader: this.isScreenReaderActive(),
      keyboardNavigation: this.isKeyboardNavigationActive(),
      focusVisible: this.isFocusVisibleSupported()
    };
  }

  /**
   * Update CSS custom properties
   */
  private updateCSSVariables(theme: any): void {
    const root = this.document.documentElement;
    const variables = this.generateCSSVariables(theme);
    
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  /**
   * Generate CSS custom properties
   */
  private generateCSSVariables(theme: any): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // Color variables
    this.flattenObject(theme.colors, variables, `${this.CSS_VARIABLES_PREFIX}-color`);
    
    // Background variables
    Object.entries(theme.background).forEach(([key, value]) => {
      variables[`${this.CSS_VARIABLES_PREFIX}-bg-${key}`] = value as string;
    });
    
    // Text variables
    Object.entries(theme.text).forEach(([key, value]) => {
      variables[`${this.CSS_VARIABLES_PREFIX}-text-${key}`] = value as string;
    });
    
    // Border variables
    Object.entries(theme.border).forEach(([key, value]) => {
      variables[`${this.CSS_VARIABLES_PREFIX}-border-${key}`] = value as string;
    });
    
    // Action variables
    Object.entries(theme.action).forEach(([key, value]) => {
      variables[`${this.CSS_VARIABLES_PREFIX}-action-${key}`] = value as string;
    });
    
    // Theme configuration variables
    Object.entries(ENTERPRISE_THEME_CONFIG.spacing).forEach(([key, value]) => {
      variables[`${this.CSS_VARIABLES_PREFIX}-spacing-${key}`] = value;
    });
    
    Object.entries(ENTERPRISE_THEME_CONFIG.borderRadius).forEach(([key, value]) => {
      variables[`${this.CSS_VARIABLES_PREFIX}-radius-${key}`] = value;
    });
    
    Object.entries(ENTERPRISE_THEME_CONFIG.shadows).forEach(([key, value]) => {
      variables[`${this.CSS_VARIABLES_PREFIX}-shadow-${key}`] = value;
    });
    
    // Font size and density adjustments
    const fontSizeMultiplier = this.getFontSizeMultiplier(theme.preferences.fontSize);
    variables[`${this.CSS_VARIABLES_PREFIX}-font-size-multiplier`] = fontSizeMultiplier.toString();
    
    const densitySpacing = this.getDensitySpacing(theme.preferences.density);
    variables[`${this.CSS_VARIABLES_PREFIX}-density-spacing`] = densitySpacing;
    
    // Motion variables
    if (theme.preferences.reducedMotion) {
      variables[`${this.CSS_VARIABLES_PREFIX}-transition-duration`] = '0s';
      variables[`${this.CSS_VARIABLES_PREFIX}-animation-duration`] = '0s';
    } else {
      variables[`${this.CSS_VARIABLES_PREFIX}-transition-duration`] = ENTERPRISE_ACCESSIBILITY.motion.duration.normal;
      variables[`${this.CSS_VARIABLES_PREFIX}-animation-duration`] = ENTERPRISE_ACCESSIBILITY.motion.duration.normal;
    }
    
    return variables;
  }

  /**
   * Flatten nested object for CSS variables
   */
  private flattenObject(obj: any, result: Record<string, string>, prefix: string): void {
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = `${prefix}-${key}`;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.flattenObject(value, result, newKey);
      } else {
        result[newKey] = String(value);
      }
    });
  }

  /**
   * Update document classes for theme
   */
  private updateDocumentClasses(theme: any): void {
    const body = this.document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark', 'reduced-motion', 'high-contrast');
    
    // Add current theme classes
    body.classList.add(`theme-${theme.colorScheme}`);
    
    if (theme.preferences.reducedMotion) {
      body.classList.add('reduced-motion');
    }
    
    if (theme.preferences.highContrast) {
      body.classList.add('high-contrast');
    }
    
    // Add font size class
    body.classList.remove('font-small', 'font-normal', 'font-large');
    body.classList.add(`font-${theme.preferences.fontSize}`);
    
    // Add density class
    body.classList.remove('density-compact', 'density-normal', 'density-comfortable');
    body.classList.add(`density-${theme.preferences.density}`);
  }

  /**
   * Update meta theme color for mobile browsers
   */
  private updateMetaThemeColor(theme: any): void {
    let metaThemeColor = this.document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    
    if (!metaThemeColor) {
      metaThemeColor = this.document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      this.document.getElementsByTagName('head')[0].appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = theme.background.default;
  }

  /**
   * Get system preferences
   */
  private getSystemPreferences(): { colorScheme: ColorScheme; reducedMotion: boolean } {
    const colorScheme: ColorScheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
    
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    return { colorScheme, reducedMotion };
  }

  /**
   * Update system preferences
   */
  private updateSystemPreferences(): void {
    const preferences = this.getSystemPreferences();
    this.systemPreferencesSubject.next(preferences);
  }

  /**
   * Get default theme preferences
   */
  private getDefaultPreferences(): ThemePreferences {
    return {
      mode: 'auto',
      colorScheme: 'light',
      reducedMotion: false,
      highContrast: false,
      fontSize: 'normal',
      density: 'normal'
    };
  }

  /**
   * Load preferences from storage
   */
  private loadPreferences(): ThemePreferences | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...this.getDefaultPreferences(), ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
    return null;
  }

  /**
   * Save preferences to storage
   */
  private savePreferences(preferences: ThemePreferences): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }

  /**
   * Get font size multiplier
   */
  private getFontSizeMultiplier(fontSize: string): number {
    switch (fontSize) {
      case 'small': return 0.875;
      case 'large': return 1.125;
      default: return 1;
    }
  }

  /**
   * Get density spacing
   */
  private getDensitySpacing(density: string): string {
    switch (density) {
      case 'compact': return '0.75rem';
      case 'comfortable': return '1.25rem';
      default: return '1rem';
    }
  }

  /**
   * Get nested property from object
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Check if screen reader is active
   */
  private isScreenReaderActive(): boolean {
    // Simple heuristic - in a real app, you might use more sophisticated detection
    return navigator.userAgent.includes('NVDA') || 
           navigator.userAgent.includes('JAWS') || 
           window.speechSynthesis?.speaking === true;
  }

  /**
   * Check if keyboard navigation is active
   */
  private isKeyboardNavigationActive(): boolean {
    // This would typically be set based on user interaction patterns
    return false;
  }

  /**
   * Check if focus-visible is supported
   */
  private isFocusVisibleSupported(): boolean {
    return CSS.supports('selector(:focus-visible)');
  }
}