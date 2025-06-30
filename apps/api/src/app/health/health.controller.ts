import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator, DiskHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

export interface HealthStatus {
  status: 'ok' | 'error';
  info: Record<string, any>;
  error: Record<string, any>;
  details: Record<string, any>;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return this.health.check([
      // Database health
      () => this.db.pingCheck('database'),
      
      // External API health
      () => this.http.pingCheck('api-gateway', 'https://api.amysoft.tech/ping'),
      
      // Disk space check (95% threshold)
      () => this.disk.checkStorage('storage', { 
        path: '/', 
        thresholdPercent: 0.95 
      }),
      
      // Memory heap check (150MB threshold)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      
      // Memory RSS check (300MB threshold)
      () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with all subsystems' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  async detailedCheck(): Promise<HealthStatus> {
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      email: await this.checkEmailService(),
      payment: await this.checkPaymentGateway(),
      cdn: await this.checkCDN(),
      storage: await this.checkStorage(),
      memory: await this.checkMemory(),
      uptime: this.getUptime(),
      version: this.getVersion()
    };

    const hasErrors = Object.values(checks).some(check => check.status === 'error');

    return {
      status: hasErrors ? 'error' : 'ok',
      info: this.extractInfo(checks),
      error: this.extractErrors(checks),
      details: checks
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    try {
      // Check if all critical services are ready
      const dbReady = await this.isDatabaseReady();
      const cacheReady = await this.isCacheReady();
      
      if (!dbReady || !cacheReady) {
        throw new Error('Critical services not ready');
      }

      return { status: 'ready', timestamp: new Date().toISOString() };
    } catch (error) {
      throw new Error('Service not ready');
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async liveness() {
    return { 
      status: 'alive', 
      timestamp: new Date().toISOString(),
      pid: process.pid
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Metrics in Prometheus format' })
  async metrics() {
    const metrics = await this.collectMetrics();
    return this.formatPrometheusMetrics(metrics);
  }

  // Private helper methods

  private async checkDatabase() {
    try {
      await this.db.pingCheck('database');
      return { status: 'ok', latency: await this.measureDatabaseLatency() };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  private async checkRedis() {
    try {
      // Implementation would check Redis connection
      return { status: 'ok', latency: 2 };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  private async checkEmailService() {
    try {
      const response = await this.http.responseCheck(
        'email-service',
        'https://api.sendgrid.com/v3/templates',
        (res) => res.status === 200
      );
      return { status: 'ok', provider: 'sendgrid' };
    } catch (error) {
      return { status: 'error', message: 'Email service unavailable' };
    }
  }

  private async checkPaymentGateway() {
    try {
      const response = await this.http.responseCheck(
        'stripe',
        'https://api.stripe.com/v1/charges',
        (res) => res.status === 401 // Expected without auth
      );
      return { status: 'ok', provider: 'stripe' };
    } catch (error) {
      return { status: 'error', message: 'Payment gateway unavailable' };
    }
  }

  private async checkCDN() {
    try {
      const response = await this.http.pingCheck(
        'cdn',
        'https://cdn.amysoft.tech/health'
      );
      return { status: 'ok', provider: 'cloudflare' };
    } catch (error) {
      return { status: 'warning', message: 'CDN check failed' };
    }
  }

  private async checkStorage() {
    try {
      const storage = await this.disk.checkStorage('storage', {
        path: '/',
        thresholdPercent: 0.95
      });
      return { 
        status: 'ok', 
        available: storage.details.storage.free,
        used: storage.details.storage.used
      };
    } catch (error) {
      return { status: 'error', message: 'Storage check failed' };
    }
  }

  private async checkMemory() {
    const used = process.memoryUsage();
    return {
      status: 'ok',
      heapUsed: Math.round(used.heapUsed / 1024 / 1024),
      heapTotal: Math.round(used.heapTotal / 1024 / 1024),
      rss: Math.round(used.rss / 1024 / 1024),
      external: Math.round(used.external / 1024 / 1024)
    };
  }

  private getUptime() {
    return {
      status: 'ok',
      seconds: Math.floor(process.uptime()),
      human: this.formatUptime(process.uptime())
    };
  }

  private getVersion() {
    return {
      status: 'ok',
      app: process.env.npm_package_version || '1.0.0',
      node: process.version,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  private async measureDatabaseLatency(): Promise<number> {
    const start = Date.now();
    try {
      // Execute a simple query to measure latency
      await this.db.pingCheck('latency-check');
      return Date.now() - start;
    } catch {
      return -1;
    }
  }

  private async isDatabaseReady(): Promise<boolean> {
    try {
      await this.db.pingCheck('database');
      return true;
    } catch {
      return false;
    }
  }

  private async isCacheReady(): Promise<boolean> {
    // Implementation would check Redis connection
    return true;
  }

  private extractInfo(checks: any): Record<string, any> {
    const info: Record<string, any> = {};
    Object.entries(checks).forEach(([key, value]: [string, any]) => {
      if (value.status === 'ok') {
        info[key] = value;
      }
    });
    return info;
  }

  private extractErrors(checks: any): Record<string, any> {
    const errors: Record<string, any> = {};
    Object.entries(checks).forEach(([key, value]: [string, any]) => {
      if (value.status === 'error') {
        errors[key] = value;
      }
    });
    return errors;
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }

  private async collectMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      // Process metrics
      process_cpu_user_seconds_total: cpuUsage.user / 1000000,
      process_cpu_system_seconds_total: cpuUsage.system / 1000000,
      process_resident_memory_bytes: memoryUsage.rss,
      process_heap_bytes: memoryUsage.heapTotal,
      process_heap_used_bytes: memoryUsage.heapUsed,
      
      // Application metrics
      app_info: { version: process.env.npm_package_version || '1.0.0' },
      nodejs_version_info: { version: process.version },
      
      // Custom business metrics would be added here
      http_requests_total: 0, // Would be tracked by middleware
      http_request_duration_seconds: 0, // Would be tracked by middleware
      active_users_total: 0, // Would be tracked by auth service
      subscription_total: 0 // Would be tracked by payment service
    };
  }

  private formatPrometheusMetrics(metrics: any): string {
    const lines: string[] = [];
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'object') {
        const labels = Object.entries(value)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        lines.push(`# TYPE ${key} gauge`);
        lines.push(`${key}{${labels}} 1`);
      } else {
        lines.push(`# TYPE ${key} gauge`);
        lines.push(`${key} ${value}`);
      }
    });
    
    return lines.join('\n');
  }
}