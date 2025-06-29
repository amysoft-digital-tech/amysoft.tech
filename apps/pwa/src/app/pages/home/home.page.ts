import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonGrid, IonRow, IonCol,
  IonList, IonItem, IonLabel, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  bookOutline, 
  documentsOutline, 
  bookmarkOutline, 
  settingsOutline,
  cloudDownloadOutline,
  phonePortraitOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon, IonGrid, IonRow, IonCol,
    IonList, IonItem, IonLabel, IonBadge
  ],
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-title>Beyond the AI Plateau</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Beyond the AI Plateau</ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="hero-section">
        <h1>Master AI Tools & Prompts</h1>
        <p>Your mobile companion for AI mastery</p>
        
        <ion-button 
          *ngIf="showInstallButton" 
          (click)="installPWA()"
          color="primary"
          expand="block"
          class="install-button">
          <ion-icon slot="start" name="cloud-download-outline"></ion-icon>
          Install App
        </ion-button>
      </div>

      <ion-grid>
        <ion-row>
          <ion-col size="6">
            <ion-card routerLink="/chapters">
              <ion-card-header>
                <ion-icon name="book-outline" size="large"></ion-icon>
                <ion-card-title>Chapters</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                Learn AI concepts step by step
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card routerLink="/templates">
              <ion-card-header>
                <ion-icon name="documents-outline" size="large"></ion-icon>
                <ion-card-title>Templates</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                Ready-to-use AI prompts
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card routerLink="/bookmarks">
              <ion-card-header>
                <ion-icon name="bookmark-outline" size="large"></ion-icon>
                <ion-card-title>Bookmarks</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                Your saved content
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card routerLink="/settings">
              <ion-card-header>
                <ion-icon name="settings-outline" size="large"></ion-icon>
                <ion-card-title>Settings</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                Customize your experience
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-card class="features-card">
        <ion-card-header>
          <ion-card-title>App Features</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-list>
            <ion-item lines="none">
              <ion-icon name="phone-portrait-outline" slot="start"></ion-icon>
              <ion-label>
                <h3>Install on Any Device</h3>
                <p>Works on iOS, Android, and desktop</p>
              </ion-label>
            </ion-item>
            <ion-item lines="none">
              <ion-icon name="cloud-download-outline" slot="start"></ion-icon>
              <ion-label>
                <h3>Offline Access</h3>
                <p>Learn without internet connection</p>
              </ion-label>
              <ion-badge slot="end" color="success">Available</ion-badge>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [`
    .hero-section {
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin-bottom: 1rem;
    }

    .hero-section h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .hero-section p {
      opacity: 0.9;
      margin-bottom: 1.5rem;
    }

    .install-button {
      max-width: 300px;
      margin: 0 auto;
    }

    ion-card {
      cursor: pointer;
      transition: transform 0.2s;
    }

    ion-card:hover {
      transform: translateY(-2px);
    }

    ion-card-header {
      text-align: center;
      padding: 1.5rem;
    }

    ion-card-header ion-icon {
      color: var(--ion-color-primary);
      margin-bottom: 0.5rem;
    }

    ion-card-title {
      font-size: 1.1rem;
    }

    ion-card-content {
      text-align: center;
      font-size: 0.9rem;
      color: var(--ion-color-medium);
    }

    .features-card {
      margin: 1rem;
    }

    .features-card ion-item {
      --padding-start: 0;
    }

    .features-card ion-icon {
      color: var(--ion-color-primary);
      font-size: 1.5rem;
      margin-right: 1rem;
    }
  `]
})
export class HomePage implements OnInit {
  showInstallButton = false;
  private deferredPrompt: any;

  constructor() {
    addIcons({ 
      bookOutline, 
      documentsOutline, 
      bookmarkOutline, 
      settingsOutline,
      cloudDownloadOutline,
      phonePortraitOutline
    });
  }

  ngOnInit() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton = true;
    });

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.showInstallButton = false;
    }
  }

  async installPWA() {
    if (!this.deferredPrompt) return;

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      this.showInstallButton = false;
    }
    
    this.deferredPrompt = null;
  }
}