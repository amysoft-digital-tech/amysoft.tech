import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Connection, QueryRunner } from 'typeorm';

export interface QueryPerformanceMetrics {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: Date;
  parameters?: any[];
}

export interface DatabaseHealth {
  connectionCount: number;
  activeQueries: number;
  slowQueries: QueryPerformanceMetrics[];
  indexUsage: any[];
  tableStats: any[];
}

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);
  private performanceMetrics: QueryPerformanceMetrics[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  constructor(private connection: Connection) {
    this.setupQueryMonitoring();
  }

  private setupQueryMonitoring(): void {
    // Monitor query performance
    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_QUERY_MONITORING === 'true') {
      this.connection.logger = {
        logQuery: (query: string, parameters?: any[]) => {
          const start = Date.now();
          
          // Store query start time for tracking
          (global as any).queryStartTimes = (global as any).queryStartTimes || new Map();
          (global as any).queryStartTimes.set(query, start);
        },
        logQueryError: (error: string, query: string, parameters?: any[]) => {
          this.logger.error(`Query Error: ${error}`, { query, parameters });
        },
        logQuerySlow: (time: number, query: string, parameters?: any[]) => {
          this.recordSlowQuery(query, time, parameters);
        },
        logSchemaBuild: (message: string) => {
          this.logger.log(`Schema: ${message}`);
        },
        logMigration: (message: string) => {
          this.logger.log(`Migration: ${message}`);
        },
        log: (level: any, message: any) => {
          this.logger.log(message);
        }
      };
    }
  }

  async optimizeQueries(): Promise<void> {
    this.logger.log('Starting database query optimization...');
    
    try {
      await this.analyzeSlowQueries();
      await this.optimizeIndexes();
      await this.updateTableStatistics();
      await this.cleanupConnections();
      
      this.logger.log('Database optimization completed successfully');
    } catch (error) {
      this.logger.error('Database optimization failed:', error);
      throw error;
    }
  }

  async analyzeSlowQueries(): Promise<QueryPerformanceMetrics[]> {
    const slowQueries = this.performanceMetrics.filter(
      metric => metric.executionTime > this.SLOW_QUERY_THRESHOLD
    );

    if (slowQueries.length > 0) {
      this.logger.warn(`Found ${slowQueries.length} slow queries`);
      slowQueries.forEach(query => {
        this.logger.warn(`Slow query (${query.executionTime}ms): ${query.query.substring(0, 100)}...`);
      });
    }

    return slowQueries;
  }

  async getIndexUsageStats(): Promise<any[]> {
    const queryRunner = this.connection.createQueryRunner();
    
    try {
      // PostgreSQL index usage statistics
      const indexStats = await queryRunner.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as index_scans,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC;
      `);

      return indexStats;
    } catch (error) {
      this.logger.error('Failed to get index usage stats:', error);
      return [];
    } finally {
      await queryRunner.release();
    }
  }

  async getTableStatistics(): Promise<any[]> {
    const queryRunner = this.connection.createQueryRunner();
    
    try {
      const tableStats = await queryRunner.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC;
      `);

      return tableStats;
    } catch (error) {
      this.logger.error('Failed to get table statistics:', error);
      return [];
    } finally {
      await queryRunner.release();
    }
  }

  async optimizeIndexes(): Promise<void> {
    const queryRunner = this.connection.createQueryRunner();
    
    try {
      // Find missing indexes for common query patterns
      await this.createUserTableIndexes(queryRunner);
      await this.createContentTableIndexes(queryRunner);
      await this.createAnalyticsIndexes(queryRunner);
      await this.createAuditLogIndexes(queryRunner);

    } catch (error) {
      this.logger.error('Index optimization failed:', error);
    } finally {
      await queryRunner.release();
    }
  }

  private async createUserTableIndexes(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      {
        name: 'idx_users_email_active',
        table: 'users',
        columns: ['email', 'is_active'],
        condition: 'WHERE is_active = true'
      },
      {
        name: 'idx_users_role_created',
        table: 'users',
        columns: ['role', 'created_at'],
        condition: ''
      },
      {
        name: 'idx_users_subscription_tier',
        table: 'users',
        columns: ['subscription_tier', 'subscription_status'],
        condition: ''
      }
    ];

    for (const index of indexes) {
      try {
        await queryRunner.query(`
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${index.name}
          ON ${index.table} (${index.columns.join(', ')})
          ${index.condition}
        `);
        this.logger.log(`Created index: ${index.name}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          this.logger.error(`Failed to create index ${index.name}:`, error);
        }
      }
    }
  }

  private async createContentTableIndexes(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      {
        name: 'idx_chapters_published_order',
        table: 'chapters',
        columns: ['is_published', 'display_order'],
        condition: 'WHERE is_published = true'
      },
      {
        name: 'idx_templates_category_usage',
        table: 'prompt_templates',
        columns: ['category', 'usage_count'],
        condition: ''
      },
      {
        name: 'idx_content_search',
        table: 'chapters',
        columns: ['title', 'content'],
        type: 'GIN',
        condition: ''
      }
    ];

    for (const index of indexes) {
      try {
        const indexType = index.type ? `USING ${index.type}` : '';
        await queryRunner.query(`
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${index.name}
          ON ${index.table} ${indexType} (${index.columns.join(', ')})
          ${index.condition}
        `);
        this.logger.log(`Created index: ${index.name}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          this.logger.error(`Failed to create index ${index.name}:`, error);
        }
      }
    }
  }

  private async createAnalyticsIndexes(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      {
        name: 'idx_analytics_events_timestamp',
        table: 'analytics_events',
        columns: ['event_type', 'timestamp'],
        condition: ''
      },
      {
        name: 'idx_analytics_user_events',
        table: 'analytics_events',
        columns: ['user_id', 'timestamp'],
        condition: ''
      },
      {
        name: 'idx_page_views_date',
        table: 'page_views',
        columns: ['viewed_at', 'page_path'],
        condition: ''
      }
    ];

    for (const index of indexes) {
      try {
        await queryRunner.query(`
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${index.name}
          ON ${index.table} (${index.columns.join(', ')})
          ${index.condition}
        `);
        this.logger.log(`Created index: ${index.name}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          this.logger.error(`Failed to create index ${index.name}:`, error);
        }
      }
    }
  }

  private async createAuditLogIndexes(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      {
        name: 'idx_audit_logs_user_action',
        table: 'audit_logs',
        columns: ['user_id', 'action', 'timestamp'],
        condition: ''
      },
      {
        name: 'idx_audit_logs_resource',
        table: 'audit_logs',
        columns: ['resource_type', 'resource_id', 'timestamp'],
        condition: ''
      }
    ];

    for (const index of indexes) {
      try {
        await queryRunner.query(`
          CREATE INDEX CONCURRENTLY IF NOT EXISTS ${index.name}
          ON ${index.table} (${index.columns.join(', ')})
          ${index.condition}
        `);
        this.logger.log(`Created index: ${index.name}`);
      } catch (error) {
        if (!error.message.includes('already exists')) {
          this.logger.error(`Failed to create index ${index.name}:`, error);
        }
      }
    }
  }

  async updateTableStatistics(): Promise<void> {
    const queryRunner = this.connection.createQueryRunner();
    
    try {
      // Update table statistics for better query planning
      const tables = ['users', 'chapters', 'prompt_templates', 'analytics_events', 'audit_logs'];
      
      for (const table of tables) {
        await queryRunner.query(`ANALYZE ${table}`);
        this.logger.log(`Updated statistics for table: ${table}`);
      }
    } catch (error) {
      this.logger.error('Failed to update table statistics:', error);
    } finally {
      await queryRunner.release();
    }
  }

  async cleanupConnections(): Promise<void> {
    try {
      // Close idle connections
      const idleConnections = await this.connection.query(`
        SELECT COUNT(*) as idle_count
        FROM pg_stat_activity 
        WHERE state = 'idle' 
        AND state_change < NOW() - INTERVAL '30 minutes'
      `);

      if (idleConnections[0]?.idle_count > 10) {
        this.logger.warn(`Found ${idleConnections[0].idle_count} idle connections`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup connections:', error);
    }
  }

  async getDatabaseHealth(): Promise<DatabaseHealth> {
    const queryRunner = this.connection.createQueryRunner();
    
    try {
      const [connectionStats, activeQueries] = await Promise.all([
        queryRunner.query(`
          SELECT COUNT(*) as connection_count,
                 COUNT(CASE WHEN state = 'active' THEN 1 END) as active_queries
          FROM pg_stat_activity
        `),
        queryRunner.query(`
          SELECT query, state, query_start, state_change
          FROM pg_stat_activity 
          WHERE state = 'active' 
          AND query NOT LIKE '%pg_stat_activity%'
        `)
      ]);

      const slowQueries = await this.analyzeSlowQueries();
      const indexUsage = await this.getIndexUsageStats();
      const tableStats = await this.getTableStatistics();

      return {
        connectionCount: connectionStats[0]?.connection_count || 0,
        activeQueries: connectionStats[0]?.active_queries || 0,
        slowQueries,
        indexUsage,
        tableStats
      };
    } catch (error) {
      this.logger.error('Failed to get database health:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private recordSlowQuery(query: string, executionTime: number, parameters?: any[]): void {
    const metric: QueryPerformanceMetrics = {
      query: query.replace(/\s+/g, ' ').trim(),
      executionTime,
      rowsAffected: 0,
      timestamp: new Date(),
      parameters
    };

    this.performanceMetrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }

    this.logger.warn(`Slow query detected (${executionTime}ms): ${query.substring(0, 200)}...`);
  }

  getPerformanceMetrics(): QueryPerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
    this.logger.log('Performance metrics cleared');
  }
}