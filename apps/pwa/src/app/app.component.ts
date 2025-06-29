import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter, map } from 'rxjs/operators';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'Beyond the AI Plateau - PWA';

  constructor(
    private platform: Platform,
    private swUpdate: SwUpdate
  ) {
    this.initializeApp();
  }

  ngOnInit() {
    // Check for service worker updates
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates
        .pipe(
          filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'),
          map(evt => ({
            type: 'UPDATE_AVAILABLE',
            current: evt.currentVersion,
            available: evt.latestVersion
          }))
        )
        .subscribe(evt => {
          // Prompt user to reload for updates
          if (confirm('New version available. Load new version?')) {
            window.location.reload();
          }
        });
    }
  }

  initializeApp() {
    this.platform.ready().then(() => {
      // Platform ready, initialize any native features here
      console.log('Ionic platform ready');
      
      // Check if running as installed PWA
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Running as installed PWA');
      }
    });
  }
}