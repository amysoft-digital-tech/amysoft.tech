import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';

import { routes } from './app.routes';
import { PerformanceService } from './services/performance.service';

function initializeApp(performanceService: PerformanceService) {
  return () => {
    performanceService.initializeWebVitals();
    performanceService.preloadCriticalResources();
    performanceService.measureResourceTiming();
    performanceService.monitorLongTasks();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(BrowserModule),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [PerformanceService],
      multi: true
    }
  ]
};