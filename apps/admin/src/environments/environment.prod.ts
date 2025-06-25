export const environment = {
  production: true,
  apiUrl: '/api',
  version: '1.0.0',
  features: {
    enableDevTools: false,
    enableLogging: false,
    enableAnalytics: true
  },
  security: {
    enableCSP: true,
    enableHSTS: true,
    enableAuditLogging: true,
    sessionTimeout: 15 * 60 * 1000, // 15 minutes in production
    maxLoginAttempts: 3,
    lockoutDuration: 30 * 60 * 1000 // 30 minutes in production
  }
};