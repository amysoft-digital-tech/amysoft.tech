import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable, fromEvent, merge, of } from 'rxjs';
import { map, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private readonly isOnline$ = new BehaviorSubject<boolean>(true);
  private promptEvent: any;
  private readonly isInstalled$ = new BehaviorSubject<boolean>(false);

  constructor(
    private swUpdate: SwUpdate,
    private platform: Platform
  ) {
    this.initializeNetworkStatus();
    this.checkIfInstalled();
    this.handleInstallPrompt();
    this.checkForUpdates();
  }

  private initializeNetworkStatus(): void {
    this.isOnline$.next(navigator.onLine);
    
    const online$ = fromEvent(window, 'online').pipe(map(() => true));
    const offline$ = fromEvent(window, 'offline').pipe(map(() => false));
    
    merge(online$, offline$).subscribe(isOnline => {
      this.isOnline$.next(isOnline);
    });
  }

  private checkIfInstalled(): void {
    // Check if running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    
    this.isInstalled$.next(isStandalone || isIosStandalone);
  }

  private handleInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.promptEvent = e;
    });

    window.addEventListener('appinstalled', () => {
      this.isInstalled$.next(true);
      this.promptEvent = null;
    });
  }

  private checkForUpdates(): void {
    if (!this.swUpdate.isEnabled) return;

    // Check for updates on startup
    this.swUpdate.checkForUpdate();

    // Check for updates every 30 minutes
    setInterval(() => {
      this.swUpdate.checkForUpdate();
    }, 30 * 60 * 1000);

    // Handle version updates
    this.swUpdate.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe(evt => {
        this.promptUpdateReload();
      });
  }

  private promptUpdateReload(): void {
    const message = 'A new version of the app is available. Would you like to update?';
    if (confirm(message)) {
      window.location.reload();
    }
  }

  getOnlineStatus(): Observable<boolean> {
    return this.isOnline$.asObservable();
  }

  getInstallStatus(): Observable<boolean> {
    return this.isInstalled$.asObservable();
  }

  canInstall(): boolean {
    return !!this.promptEvent && !this.isInstalled$.value;
  }

  async installPwa(): Promise<void> {
    if (!this.promptEvent) return;

    this.promptEvent.prompt();
    const { outcome } = await this.promptEvent.userChoice;
    
    if (outcome === 'accepted') {
      console.log('PWA installation accepted');
    } else {
      console.log('PWA installation dismissed');
    }
    
    this.promptEvent = null;
  }

  // Check if running on iOS
  isIos(): boolean {
    return this.platform.is('ios');
  }

  // Check if running in Safari
  isSafari(): boolean {
    const ua = window.navigator.userAgent;
    const iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
    const webkit = !!ua.match(/WebKit/i);
    const isSafari = iOS && webkit && !ua.match(/CriOS/i);
    return isSafari;
  }

  // Get iOS install instructions
  getIosInstallInstructions(): string[] {
    return [
      'Tap the Share button',
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" in the top right corner'
    ];
  }

  // Cache management
  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
  }

  // Get cache storage info
  async getCacheStorageInfo(): Promise<{used: number; quota: number}> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        used: estimate.usage || 0,
        quota: estimate.quota || 0
      };
    }
    return { used: 0, quota: 0 };
  }
}