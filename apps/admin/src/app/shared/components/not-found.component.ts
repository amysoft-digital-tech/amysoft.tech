import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="not-found-container">
      <mat-card class="not-found-card">
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <h1>Page Not Found</h1>
            <p>The page you're looking for doesn't exist or you don't have permission to access it.</p>
            <div class="actions">
              <button mat-raised-button color="primary" routerLink="/dashboard">
                <mat-icon>home</mat-icon>
                Go to Dashboard
              </button>
              <button mat-button (click)="goBack()">
                <mat-icon>arrow_back</mat-icon>
                Go Back
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      padding: 24px;
      background-color: #f5f5f5;
    }

    .not-found-card {
      max-width: 500px;
      width: 100%;
    }

    .error-content {
      text-align: center;
      padding: 48px 24px;

      .error-icon {
        font-size: 72px;
        width: 72px;
        height: 72px;
        color: #f57c00;
        margin-bottom: 24px;
      }

      h1 {
        margin: 0 0 16px 0;
        font-size: 2rem;
        font-weight: 600;
        color: #333;
      }

      p {
        margin: 0 0 32px 0;
        color: #666;
        font-size: 1.125rem;
        line-height: 1.5;
      }

      .actions {
        display: flex;
        gap: 16px;
        justify-content: center;
        flex-wrap: wrap;

        button {
          .mat-icon {
            margin-right: 8px;
          }
        }
      }
    }

    @media (max-width: 576px) {
      .error-content {
        padding: 32px 16px;

        .error-icon {
          font-size: 56px;
          width: 56px;
          height: 56px;
        }

        h1 {
          font-size: 1.5rem;
        }

        p {
          font-size: 1rem;
        }

        .actions {
          flex-direction: column;
          align-items: stretch;

          button {
            width: 100%;
          }
        }
      }
    }
  `]
})
export class NotFoundComponent {
  goBack(): void {
    window.history.back();
  }
}