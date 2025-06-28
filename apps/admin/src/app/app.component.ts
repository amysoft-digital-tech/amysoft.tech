import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="admin-layout">
      <header class="header">
        <h1>Beyond the AI Plateau</h1>
        <h2>Admin Console</h2>
      </header>
      
      <nav class="sidebar">
        <div class="nav-section">
          <h3>Dashboard</h3>
          <ul>
            <li>📊 Analytics</li>
            <li>👥 Users</li>
            <li>📚 Content</li>
            <li>💳 Sales</li>
          </ul>
        </div>
        
        <div class="nav-section">
          <h3>Management</h3>
          <ul>
            <li>📝 Content Editor</li>
            <li>🎯 Campaigns</li>
            <li>⚙️ Settings</li>
            <li>🔐 Security</li>
          </ul>
        </div>
      </nav>
      
      <main class="content">
        <div class="dashboard-cards">
          <div class="card">
            <h3>Total Users</h3>
            <p class="metric">1,234</p>
            <span class="change positive">+12%</span>
          </div>
          
          <div class="card">
            <h3>Sales Today</h3>
            <p class="metric">$2,456</p>
            <span class="change positive">+8%</span>
          </div>
          
          <div class="card">
            <h3>Content Views</h3>
            <p class="metric">8,901</p>
            <span class="change positive">+15%</span>
          </div>
          
          <div class="card">
            <h3>Active Sessions</h3>
            <p class="metric">156</p>
            <span class="change neutral">±0%</span>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: grid;
      grid-template-columns: 250px 1fr;
      grid-template-rows: auto 1fr;
      height: 100vh;
      grid-template-areas: 
        "header header"
        "sidebar content";
    }
    
    .header {
      grid-area: header;
      background: #1e293b;
      color: white;
      padding: 1rem 2rem;
      border-bottom: 1px solid #334155;
    }
    
    .header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    
    .header h2 {
      margin: 0.25rem 0 0 0;
      font-size: 1rem;
      font-weight: 300;
      color: #94a3b8;
    }
    
    .sidebar {
      grid-area: sidebar;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      padding: 1.5rem;
    }
    
    .nav-section {
      margin-bottom: 2rem;
    }
    
    .nav-section h3 {
      margin: 0 0 1rem 0;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .nav-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .nav-section li {
      padding: 0.5rem 0;
      color: #475569;
      cursor: pointer;
      border-radius: 0.25rem;
      padding-left: 0.5rem;
      margin-bottom: 0.25rem;
    }
    
    .nav-section li:hover {
      background: #e2e8f0;
      color: #1e293b;
    }
    
    .content {
      grid-area: content;
      padding: 2rem;
      background: #ffffff;
    }
    
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .card h3 {
      margin: 0 0 0.5rem 0;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
    }
    
    .metric {
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
    }
    
    .change {
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    .change.positive {
      color: #059669;
    }
    
    .change.neutral {
      color: #64748b;
    }
  `]
})
export class AppComponent {
  title = 'Beyond the AI Plateau - Admin';
}