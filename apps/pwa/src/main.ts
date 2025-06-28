import { bootstrapApplication } from '@angular/platform-browser';
import { isDevMode } from '@angular/core';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    ...(isDevMode() ? [] : [ServiceWorkerModule.register('ngsw-worker.js')])
  ]
}).catch((err) => console.error(err));