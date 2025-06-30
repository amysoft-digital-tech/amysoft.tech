import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app/app.module';
import { PrismaService } from './services/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:4200', // website
      'http://localhost:8100', // pwa  
      'http://localhost:4201', // admin
      'http://localhost:4202', // website dev
      'http://localhost:8101', // pwa dev
      'http://localhost:4203'  // admin dev
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true
    }
  }));

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Beyond the AI Plateau - Content API')
    .setDescription('RESTful API for content management, serving chapters, templates, and case studies with tier-based access control')
    .setVersion('1.0')
    .addTag('Content', 'Content management endpoints')
    .addTag('Tiers', 'Content tier management')
    .addTag('Search', 'Content search functionality')
    .addTag('Analytics', 'Content analytics and usage tracking')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Content API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true
    }
  });

  // Initialize Prisma shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  logger.log(`🚀 API running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health Check: http://localhost:${port}/api/content/health`);
}

bootstrap().catch(error => {
  console.error('Failed to start the application:', error);
  process.exit(1);
});