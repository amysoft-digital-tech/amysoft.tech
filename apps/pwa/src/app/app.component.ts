import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="container">
      <h1>Beyond the AI Plateau</h1>
      <h2>Interactive Learning Platform</h2>
      <p>Progressive Web App - Coming Soon</p>
      
      <div class="features">
        <div class="feature-card">
          <h3>📱 Mobile Ready</h3>
          <p>Install on any device</p>
        </div>
        <div class="feature-card">
          <h3>🔄 Offline Access</h3>
          <p>Learn without internet</p>
        </div>
        <div class="feature-card">
          <h3>⚡ Fast Loading</h3>
          <p>Instant content delivery</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    
    h1 {
      color: #2563eb;
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    
    h2 {
      color: #64748b;
      font-weight: 300;
      margin-bottom: 2rem;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 3rem;
    }
    
    .feature-card {
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;
    }
    
    .feature-card h3 {
      margin: 0 0 0.5rem 0;
      color: #1e293b;
    }
    
    .feature-card p {
      margin: 0;
      color: #64748b;
    }
  `]
})
export class AppComponent {
  title = 'Beyond the AI Plateau - PWA';
}