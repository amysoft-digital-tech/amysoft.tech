import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export const corsConfig: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:4200',    // Angular dev server
      'http://localhost:8100',    // Ionic dev server
      'http://localhost:4201',    // Admin app dev server
      'https://amysoft.tech',     // Production website
      'https://www.amysoft.tech', // Production website with www
      'https://app.amysoft.tech', // Production PWA
      'https://admin.amysoft.tech' // Production admin
    ];

    // In development, allow additional origins
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:8100'
      );
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin ${origin} not allowed`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Requested-With',
    'Accept',
    'Origin',
    'API-Version'
  ],
  
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  
  credentials: true,
  
  optionsSuccessStatus: 204,
  
  maxAge: 86400 // 24 hours
};