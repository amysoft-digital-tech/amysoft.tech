import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <h1>Beyond the AI Plateau</h1>
    <p>Marketing Website - Coming Soon</p>
  `,
  styles: [`
    :host {
      display: block;
      padding: 2rem;
      text-align: center;
    }
    h1 {
      color: #2563eb;
      margin-bottom: 1rem;
    }
  `]
})
export class AppComponent {
  title = 'Beyond the AI Plateau';
}