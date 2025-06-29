import 'jest-preset-angular/setup-jest';

// Global test configuration
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() { return null; }
  disconnect() { return null; }
  unobserve() { return null; }
};

// Security testing utilities
export const SecurityTestUtils = {
  // SQL Injection test payloads
  sqlInjectionPayloads: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "'; SELECT * FROM admin; --",
    "' UNION SELECT * FROM sensitive_data --",
    "'; INSERT INTO users (username, password) VALUES ('hacker', 'password'); --"
  ],

  // XSS test payloads
  xssPayloads: [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>'
  ],

  // Test input sanitization
  testInputSanitization: (input: string): boolean => {
    // Should not contain dangerous HTML tags or JavaScript
    const dangerousPatterns = [
      /<script.*?>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
  },

  // Test CSRF token validation
  validateCSRFToken: (token: string): boolean => {
    return token && token.length >= 32 && /^[a-zA-Z0-9+/]+=*$/.test(token);
  },

  // Test password strength
  validatePasswordStrength: (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }
};

// Performance testing utilities
export const PerformanceTestUtils = {
  // Measure component render time
  measureRenderTime: async (renderFn: () => Promise<void>): Promise<number> => {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    return end - start;
  },

  // Test memory usage
  measureMemoryUsage: (): number => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
};