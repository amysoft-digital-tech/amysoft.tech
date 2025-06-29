import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
  IonButtons, IonList, IonItem, IonLabel, IonToggle,
  IonButton, IonIcon, IonNote, IonItemDivider,
  IonProgressBar, IonCard, IonCardContent, IonCardHeader, IonCardTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  arrowBackOutline, 
  trashOutline, 
  refreshOutline,
  downloadOutline,
  informationCircleOutline 
} from 'ionicons/icons';
import { PwaService } from '../../services/pwa.service';
import { SwUpdate } from '@angular/service-worker';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
    IonButtons, IonList, IonItem, IonLabel, IonToggle,
    IonButton, IonIcon, IonNote, IonItemDivider,
    IonProgressBar, IonCard, IonCardContent, IonCardHeader, IonCardTitle
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- PWA Status Card -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>PWA Status</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item lines="none">
              <ion-label>App Installed</ion-label>
              <ion-note slot="end">{{ isInstalled ? 'Yes' : 'No' }}</ion-note>
            </ion-item>
            <ion-item lines="none">
              <ion-label>Online Status</ion-label>
              <ion-note slot="end" [color]="isOnline ? 'success' : 'danger'">
                {{ isOnline ? 'Online' : 'Offline' }}
              </ion-note>
            </ion-item>
            <ion-item lines="none">
              <ion-label>Service Worker</ion-label>
              <ion-note slot="end">{{ swEnabled ? 'Enabled' : 'Disabled' }}</ion-note>
            </ion-item>
            <ion-item lines="none">
              <ion-label>Platform</ion-label>
              <ion-note slot="end">{{ platform }}</ion-note>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Storage Info -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Storage</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item lines="none">
            <ion-label>
              <h3>Cache Storage</h3>
              <p>{{ storageUsed }}MB of {{ storageQuota }}MB used</p>
            </ion-label>
          </ion-item>
          <ion-progress-bar [value]="storagePercentage"></ion-progress-bar>
          
          <ion-button 
            expand="block" 
            fill="outline" 
            color="danger"
            (click)="clearCache()"
            class="ion-margin-top">
            <ion-icon slot="start" name="trash-outline"></ion-icon>
            Clear Cache
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- App Updates -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>App Updates</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-button 
            expand="block" 
            fill="outline"
            (click)="checkForUpdates()">
            <ion-icon slot="start" name="refresh-outline"></ion-icon>
            Check for Updates
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Installation -->
      <ion-card *ngIf="!isInstalled && canInstall">
        <ion-card-header>
          <ion-card-title>Install App</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Install the app for offline access and better performance.</p>
          <ion-button 
            expand="block" 
            (click)="installApp()">
            <ion-icon slot="start" name="download-outline"></ion-icon>
            Install Now
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- iOS Install Instructions -->
      <ion-card *ngIf="isIos && !isInstalled">
        <ion-card-header>
          <ion-card-title>Install on iOS</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item *ngFor="let instruction of iosInstructions; let i = index" lines="none">
              <ion-label>
                <h3>Step {{ i + 1 }}</h3>
                <p>{{ instruction }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Developer Tools -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>Developer Tools</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label>Debug Mode</ion-label>
              <ion-toggle [(ngModel)]="debugMode"></ion-toggle>
            </ion-item>
            <ion-item>
              <ion-label>Show Performance Metrics</ion-label>
              <ion-toggle [(ngModel)]="showMetrics"></ion-toggle>
            </ion-item>
            <ion-item button (click)="openDevTools()">
              <ion-label>Open Chrome DevTools</ion-label>
              <ion-icon name="information-circle-outline" slot="end"></ion-icon>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    ion-card {
      margin: 16px;
    }

    ion-progress-bar {
      height: 8px;
      margin-top: 12px;
    }

    .ion-margin-top {
      margin-top: 16px;
    }
  `]
})
export class SettingsPage implements OnInit {
  isOnline = true;
  isInstalled = false;
  canInstall = false;
  swEnabled = false;
  platform = '';
  isIos = false;
  iosInstructions: string[] = [];
  
  storageUsed = 0;
  storageQuota = 0;
  storagePercentage = 0;
  
  debugMode = false;
  showMetrics = false;

  constructor(
    private pwaService: PwaService,
    private swUpdate: SwUpdate
  ) {
    addIcons({ 
      arrowBackOutline, 
      trashOutline, 
      refreshOutline,
      downloadOutline,
      informationCircleOutline 
    });
  }

  ngOnInit() {
    // Subscribe to online status
    this.pwaService.getOnlineStatus().subscribe(isOnline => {
      this.isOnline = isOnline;
    });

    // Subscribe to install status
    this.pwaService.getInstallStatus().subscribe(isInstalled => {
      this.isInstalled = isInstalled;
    });

    // Check if can install
    this.canInstall = this.pwaService.canInstall();

    // Check service worker status
    this.swEnabled = this.swUpdate.isEnabled;

    // Get platform info
    this.platform = this.detectPlatform();
    this.isIos = this.pwaService.isIos();
    
    if (this.isIos) {
      this.iosInstructions = this.pwaService.getIosInstallInstructions();
    }

    // Get storage info
    this.updateStorageInfo();
  }

  private detectPlatform(): string {
    const userAgent = navigator.userAgent;
    if (/android/i.test(userAgent)) return 'Android';
    if (/iPad|iPhone|iPod/.test(userAgent)) return 'iOS';
    if (/Win/.test(userAgent)) return 'Windows';
    if (/Mac/.test(userAgent)) return 'macOS';
    if (/Linux/.test(userAgent)) return 'Linux';
    return 'Unknown';
  }

  async updateStorageInfo() {
    const info = await this.pwaService.getCacheStorageInfo();
    this.storageUsed = Math.round(info.used / 1024 / 1024);
    this.storageQuota = Math.round(info.quota / 1024 / 1024);
    this.storagePercentage = info.quota > 0 ? info.used / info.quota : 0;
  }

  async clearCache() {
    if (confirm('Are you sure you want to clear all cached data?')) {
      await this.pwaService.clearCache();
      await this.updateStorageInfo();
      alert('Cache cleared successfully!');
    }
  }

  async checkForUpdates() {
    if (this.swUpdate.isEnabled) {
      try {
        const updateAvailable = await this.swUpdate.checkForUpdate();
        if (updateAvailable) {
          if (confirm('A new version is available. Update now?')) {
            window.location.reload();
          }
        } else {
          alert('You are running the latest version!');
        }
      } catch (error) {
        alert('Error checking for updates');
      }
    } else {
      alert('Service Worker is not enabled');
    }
  }

  async installApp() {
    await this.pwaService.installPwa();
  }

  openDevTools() {
    alert('Press F12 or right-click and select "Inspect" to open Chrome DevTools.\n\nGo to Application tab to inspect:\n- Service Workers\n- Cache Storage\n- Manifest\n- Storage');
  }
}