export const environment = {
  production: false,
  apiUrl: '/api',
  version: '1.0.0',
  features: {
    enableDevTools: true,
    enableLogging: true,
    enableAnalytics: false
  },
  security: {
    enableCSP: true,
    enableHSTS: false, // Not needed in development
    enableAuditLogging: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  }
};