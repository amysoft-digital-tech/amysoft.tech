/**
 * Enterprise Material Design Theme
 * Comprehensive theming system for admin console with accessibility and brand compliance
 */

import { Theme } from '@angular/material/core';

// Color Palette Configuration
export const ENTERPRISE_COLORS = {
  // Primary Brand Colors
  primary: {
    50: '#e8f4fd',
    100: '#c5e4fa',
    200: '#9fd2f7',
    300: '#78c0f3',
    400: '#5bb2f0',
    500: '#3da4ed', // Main brand color
    600: '#379ce6',
    700: '#2f91dd',
    800: '#2787d4',
    900: '#1a75c5',
    A100: '#ffffff',
    A200: '#d6ebff',
    A400: '#a3d1ff',
    A700: '#8ac6ff'
  },

  // Secondary Colors
  secondary: {
    50: '#f3f4f6',
    100: '#e1e5e9',
    200: '#cdd4da',
    300: '#b9c3cb',
    400: '#aab6c0',
    500: '#9ba9b4', // Sophisticated gray-blue
    600: '#93a2ad',
    700: '#8998a4',
    800: '#7f8f9c',
    900: '#6d7e8c',
    A100: '#ffffff',
    A200: '#f5f7f9',
    A400: '#dde3e8',
    A700: '#c4cdd4'
  },

  // Status Colors
  success: {
    50: '#f0f9f4',
    100: '#dcf2e3',
    200: '#c6e9d0',
    300: '#a7d9bd',
    400: '#84c9a1',
    500: '#22c55e', // Success green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  },

  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Warning amber
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f'
  },

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Error red
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },

  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Info blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },

  // Neutral Colors
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
  }
};

// Typography Configuration
export const ENTERPRISE_TYPOGRAPHY = {
  fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem'   // 60px
  },
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  }
};

// Spacing Configuration
export const ENTERPRISE_SPACING = {
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  40: '10rem',   // 160px
  48: '12rem',   // 192px
  56: '14rem',   // 224px
  64: '16rem'    // 256px
};

// Border Radius Configuration
export const ENTERPRISE_BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  default: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
};

// Shadow Configuration
export const ENTERPRISE_SHADOWS = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  default: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  '2xl': '0 50px 100px -20px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  outline: '0 0 0 3px rgba(59, 130, 246, 0.5)',
  none: 'none'
};

// Theme Configuration
export const ENTERPRISE_LIGHT_THEME = {
  colors: {
    primary: ENTERPRISE_COLORS.primary,
    secondary: ENTERPRISE_COLORS.secondary,
    success: ENTERPRISE_COLORS.success,
    warning: ENTERPRISE_COLORS.warning,
    error: ENTERPRISE_COLORS.error,
    info: ENTERPRISE_COLORS.info,
    neutral: ENTERPRISE_COLORS.neutral
  },
  
  background: {
    default: '#ffffff',
    paper: '#ffffff',
    level1: '#f8fafc',    // Slight elevation
    level2: '#f1f5f9',    // Cards, panels
    level3: '#e2e8f0',    // Borders, dividers
    level4: '#cbd5e1'     // Disabled states
  },

  text: {
    primary: ENTERPRISE_COLORS.neutral[900],
    secondary: ENTERPRISE_COLORS.neutral[600],
    disabled: ENTERPRISE_COLORS.neutral[400],
    hint: ENTERPRISE_COLORS.neutral[500],
    inverse: '#ffffff'
  },

  border: {
    light: ENTERPRISE_COLORS.neutral[200],
    default: ENTERPRISE_COLORS.neutral[300],
    dark: ENTERPRISE_COLORS.neutral[400],
    focus: ENTERPRISE_COLORS.primary[500]
  },

  action: {
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    focus: 'rgba(0, 0, 0, 0.12)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)'
  }
};

export const ENTERPRISE_DARK_THEME = {
  colors: {
    primary: ENTERPRISE_COLORS.primary,
    secondary: ENTERPRISE_COLORS.secondary,
    success: ENTERPRISE_COLORS.success,
    warning: ENTERPRISE_COLORS.warning,
    error: ENTERPRISE_COLORS.error,
    info: ENTERPRISE_COLORS.info,
    neutral: ENTERPRISE_COLORS.neutral
  },

  background: {
    default: '#0f172a',    // Dark slate
    paper: '#1e293b',      // Lighter slate
    level1: '#334155',     // Card backgrounds
    level2: '#475569',     // Elevated elements
    level3: '#64748b',     // Borders, dividers
    level4: '#94a3b8'      // Disabled states
  },

  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    disabled: '#64748b',
    hint: '#94a3b8',
    inverse: ENTERPRISE_COLORS.neutral[900]
  },

  border: {
    light: '#334155',
    default: '#475569',
    dark: '#64748b',
    focus: ENTERPRISE_COLORS.primary[400]
  },

  action: {
    hover: 'rgba(255, 255, 255, 0.08)',
    selected: 'rgba(255, 255, 255, 0.12)',
    focus: 'rgba(255, 255, 255, 0.16)',
    disabled: 'rgba(255, 255, 255, 0.3)',
    disabledBackground: 'rgba(255, 255, 255, 0.12)'
  }
};

// Component-specific theme configurations
export const ENTERPRISE_COMPONENT_THEMES = {
  // Button variants
  button: {
    primary: {
      background: ENTERPRISE_COLORS.primary[500],
      color: '#ffffff',
      hover: ENTERPRISE_COLORS.primary[600],
      active: ENTERPRISE_COLORS.primary[700],
      disabled: ENTERPRISE_COLORS.neutral[300]
    },
    secondary: {
      background: 'transparent',
      color: ENTERPRISE_COLORS.primary[500],
      border: ENTERPRISE_COLORS.primary[500],
      hover: ENTERPRISE_COLORS.primary[50],
      active: ENTERPRISE_COLORS.primary[100]
    },
    success: {
      background: ENTERPRISE_COLORS.success[500],
      color: '#ffffff',
      hover: ENTERPRISE_COLORS.success[600],
      active: ENTERPRISE_COLORS.success[700]
    },
    warning: {
      background: ENTERPRISE_COLORS.warning[500],
      color: '#ffffff',
      hover: ENTERPRISE_COLORS.warning[600],
      active: ENTERPRISE_COLORS.warning[700]
    },
    error: {
      background: ENTERPRISE_COLORS.error[500],
      color: '#ffffff',
      hover: ENTERPRISE_COLORS.error[600],
      active: ENTERPRISE_COLORS.error[700]
    }
  },

  // Card variants
  card: {
    default: {
      background: '#ffffff',
      border: ENTERPRISE_COLORS.neutral[200],
      shadow: ENTERPRISE_SHADOWS.sm
    },
    elevated: {
      background: '#ffffff',
      border: 'none',
      shadow: ENTERPRISE_SHADOWS.md
    },
    interactive: {
      background: '#ffffff',
      border: ENTERPRISE_COLORS.neutral[200],
      shadow: ENTERPRISE_SHADOWS.sm,
      hover: {
        shadow: ENTERPRISE_SHADOWS.md,
        transform: 'translateY(-2px)'
      }
    }
  },

  // Table variants
  table: {
    header: {
      background: ENTERPRISE_COLORS.neutral[50],
      border: ENTERPRISE_COLORS.neutral[200],
      text: ENTERPRISE_COLORS.neutral[700]
    },
    row: {
      background: '#ffffff',
      alternate: ENTERPRISE_COLORS.neutral[25],
      hover: ENTERPRISE_COLORS.primary[25],
      selected: ENTERPRISE_COLORS.primary[50]
    }
  },

  // Form variants
  form: {
    input: {
      background: '#ffffff',
      border: ENTERPRISE_COLORS.neutral[300],
      focus: ENTERPRISE_COLORS.primary[500],
      error: ENTERPRISE_COLORS.error[500],
      disabled: ENTERPRISE_COLORS.neutral[100]
    },
    label: {
      color: ENTERPRISE_COLORS.neutral[700],
      required: ENTERPRISE_COLORS.error[500]
    }
  },

  // Navigation variants
  navigation: {
    sidebar: {
      background: ENTERPRISE_COLORS.neutral[900],
      text: ENTERPRISE_COLORS.neutral[300],
      active: ENTERPRISE_COLORS.primary[500],
      hover: ENTERPRISE_COLORS.neutral[800]
    },
    topbar: {
      background: '#ffffff',
      text: ENTERPRISE_COLORS.neutral[700],
      border: ENTERPRISE_COLORS.neutral[200]
    }
  },

  // Status indicators
  status: {
    online: ENTERPRISE_COLORS.success[500],
    offline: ENTERPRISE_COLORS.neutral[400],
    busy: ENTERPRISE_COLORS.warning[500],
    away: ENTERPRISE_COLORS.info[500],
    error: ENTERPRISE_COLORS.error[500]
  }
};

// Accessibility Configuration
export const ENTERPRISE_ACCESSIBILITY = {
  focusRing: {
    width: '3px',
    style: 'solid',
    color: ENTERPRISE_COLORS.primary[500],
    offset: '2px'
  },
  
  contrast: {
    minimum: 4.5,    // WCAG AA for normal text
    enhanced: 7,     // WCAG AAA for normal text
    large: 3         // WCAG AA for large text (18pt+)
  },

  motion: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms'
    },
    easing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    }
  },

  reducedMotion: {
    duration: '0s',
    transform: 'none'
  }
};

// Breakpoint Configuration
export const ENTERPRISE_BREAKPOINTS = {
  xs: '0px',
  sm: '576px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '992px',   // Large devices (desktops)
  xl: '1200px',  // Extra large devices (large desktops)
  xxl: '1400px'  // Extra extra large devices
};

// Z-Index Scale
export const ENTERPRISE_Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1100,
  banner: 1200,
  overlay: 1300,
  modal: 1400,
  popover: 1500,
  skipLink: 1600,
  toast: 1700,
  tooltip: 1800
};

// Animation Configuration
export const ENTERPRISE_ANIMATIONS = {
  slideIn: {
    duration: '250ms',
    easing: 'ease-out',
    transform: 'translateX(0)',
    from: 'translateX(-100%)'
  },
  slideOut: {
    duration: '200ms',
    easing: 'ease-in',
    transform: 'translateX(-100%)',
    from: 'translateX(0)'
  },
  fadeIn: {
    duration: '200ms',
    easing: 'ease-out',
    opacity: '1',
    from: '0'
  },
  fadeOut: {
    duration: '150ms',
    easing: 'ease-in',
    opacity: '0',
    from: '1'
  },
  scaleIn: {
    duration: '200ms',
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    transform: 'scale(1)',
    from: 'scale(0.95)'
  },
  scaleOut: {
    duration: '150ms',
    easing: 'ease-in',
    transform: 'scale(0.95)',
    from: 'scale(1)'
  }
};

// Export complete theme configuration
export const ENTERPRISE_THEME_CONFIG = {
  light: ENTERPRISE_LIGHT_THEME,
  dark: ENTERPRISE_DARK_THEME,
  colors: ENTERPRISE_COLORS,
  typography: ENTERPRISE_TYPOGRAPHY,
  spacing: ENTERPRISE_SPACING,
  borderRadius: ENTERPRISE_BORDER_RADIUS,
  shadows: ENTERPRISE_SHADOWS,
  components: ENTERPRISE_COMPONENT_THEMES,
  accessibility: ENTERPRISE_ACCESSIBILITY,
  breakpoints: ENTERPRISE_BREAKPOINTS,
  zIndex: ENTERPRISE_Z_INDEX,
  animations: ENTERPRISE_ANIMATIONS
};