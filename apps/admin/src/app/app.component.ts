import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, startWith, catchError, of } from 'rxjs';
import { AdminDataService, DashboardMetrics } from './services/admin-data.service';
import { PerformanceService, PerformanceMetrics } from './services/performance.service';
import { CacheService } from './services/cache.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly adminDataService = inject(AdminDataService);
  private readonly performanceService = inject(PerformanceService);
  private readonly cacheService = inject(CacheService);

  // Component state signals
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly activeSection = signal<string>('analytics');
  readonly dashboardData = signal<DashboardMetrics | null>(null);
  readonly performanceMetrics = signal<Partial<PerformanceMetrics>>({});
  readonly cacheStats = signal<any>({});

  // Computed values
  readonly performanceScore = computed(() => {
    const metrics = this.performanceMetrics();
    if (!metrics.fcp && !metrics.lcp) return 'good';
    
    return this.calculatePerformanceScore(metrics);
  });

  readonly title = 'Beyond the AI Plateau - Admin';

  ngOnInit(): void {
    this.initializeComponent();
    this.loadInitialData();
    this.setupPerformanceMonitoring();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeComponent(): void {
    // Measure component initialization performance
    this.performanceService.measureComponent('AppComponent', () => {
      console.log('Admin Console initialized');
    }, true);

    // Preload critical data
    this.adminDataService.preloadCriticalData();
  }

  private loadInitialData(): void {
    this.refreshData();
  }

  private setupPerformanceMonitoring(): void {
    // Monitor performance metrics
    this.performanceService.metrics$
      .pipe(takeUntil(this.destroy$))
      .subscribe(metrics => {
        this.performanceMetrics.set(metrics);
      });

    // Update cache stats periodically
    setInterval(() => {
      this.cacheStats.set(this.cacheService.getStats());
    }, 30000); // Every 30 seconds
  }

  refreshData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.performanceService.measureAsync('dashboardDataLoad', async () => {
      return this.adminDataService.getDashboardMetrics().pipe(
        catchError(err => {
          this.error.set(err.message);
          return of(null);
        })
      ).toPromise();
    }).then(data => {
      if (data) {
        this.dashboardData.set(data);
      }
      this.loading.set(false);
    }).catch(err => {
      this.error.set(err.message);
      this.loading.set(false);
    });
  }

  setActiveSection(section: string): void {
    this.performanceService.measureComponent('SectionChange', () => {
      this.activeSection.set(section);
    });
  }

  clearCache(): void {
    this.performanceService.measureComponent('ClearCache', () => {
      this.cacheService.clear();
      this.cacheStats.set(this.cacheService.getStats());
    });
  }

  getMaxValue(values: number[]): number {
    return Math.max(...values);
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private calculatePerformanceScore(metrics: Partial<PerformanceMetrics>): 'good' | 'needs-improvement' | 'poor' {
    const { fcp = 0, lcp = 0, fid = 0, cls = 0 } = metrics;
    
    let score = 0;
    
    // FCP scoring (First Contentful Paint)
    if (fcp <= 1800) score += 25;
    else if (fcp <= 3000) score += 15;
    
    // LCP scoring (Largest Contentful Paint)
    if (lcp <= 2500) score += 25;
    else if (lcp <= 4000) score += 15;
    
    // FID scoring (First Input Delay)
    if (fid <= 100) score += 25;
    else if (fid <= 300) score += 15;
    
    // CLS scoring (Cumulative Layout Shift)
    if (cls <= 0.1) score += 25;
    else if (cls <= 0.25) score += 15;
    
    if (score >= 75) return 'good';
    if (score >= 50) return 'needs-improvement';
    return 'poor';
  }

  // Development helper methods
  exportPerformanceData(): void {
    const data = this.performanceService.exportPerformanceData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-performance-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Memory leak prevention
  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}