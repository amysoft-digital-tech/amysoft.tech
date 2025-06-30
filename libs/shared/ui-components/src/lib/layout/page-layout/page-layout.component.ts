import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

export interface PageMeta {
  title?: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
  active?: boolean;
}

@Component({
  selector: 'amysoft-page-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <!-- Skip to main content link for accessibility -->
      <a href="#main-content" 
         class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-brand-600 text-white px-4 py-2 rounded-md z-50 transition-all duration-200">
        Skip to main content
      </a>
      
      <!-- Header -->
      <amysoft-header></amysoft-header>
      
      <!-- Main content area -->
      <main id="main-content" 
            class="flex-1"
            [class]="mainClasses"
            role="main">
        
        <!-- Breadcrumbs -->
        <nav *ngIf="breadcrumbs && breadcrumbs.length > 0" 
             class="bg-neutral-50 border-b border-neutral-200"
             aria-label="Breadcrumb">
          <div class="mx-auto max-w-7xl container-padding py-4">
            <ol class="flex items-center space-x-2 text-sm">
              <li *ngFor="let crumb of breadcrumbs; let last = last" class="flex items-center">
                <a *ngIf="crumb.route && !crumb.active" 
                   [routerLink]="crumb.route"
                   class="text-neutral-600 hover:text-brand-600 transition-colors duration-200">
                  {{ crumb.label }}
                </a>
                <span *ngIf="!crumb.route || crumb.active" 
                      class="text-neutral-900 font-medium"
                      [attr.aria-current]="crumb.active ? 'page' : null">
                  {{ crumb.label }}
                </span>
                <svg *ngIf="!last" class="w-4 h-4 text-neutral-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </li>
            </ol>
          </div>
        </nav>
        
        <!-- Page content -->
        <div [class]="contentClasses">
          <ng-content></ng-content>
        </div>
        
        <!-- Back to top button -->
        <button *ngIf="showBackToTop" 
                (click)="scrollToTop()"
                class="fixed bottom-6 right-6 w-12 h-12 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                aria-label="Back to top"
                [@fadeInOut]>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"></path>
          </svg>
        </button>
      </main>
      
      <!-- Footer -->
      <amysoft-footer *ngIf="!hideFooter"></amysoft-footer>
    </div>
  `,
  styles: [`
    @keyframes fadeInOut {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    [data-fade-in-out] {
      animation: fadeInOut 0.3s ease-in-out;
    }
  `]
})
export class PageLayoutComponent {
  @Input() breadcrumbs?: BreadcrumbItem[];
  @Input() hideFooter = false;
  @Input() fullWidth = false;
  @Input() noPadding = false;
  @Input() paddingTop = true;
  @Input() backgroundColor: 'default' | 'white' | 'neutral' | 'dark' = 'default';
  @Input() showBackToTop = true;

  get mainClasses(): string {
    const classes = ['pt-16 lg:pt-20']; // Account for fixed header
    
    if (!this.paddingTop) {
      classes[0] = ''; // Remove top padding if specified
    }
    
    if (this.backgroundColor === 'white') {
      classes.push('bg-white');
    } else if (this.backgroundColor === 'neutral') {
      classes.push('bg-neutral-50');
    } else if (this.backgroundColor === 'dark') {
      classes.push('bg-neutral-900 text-white');
    }
    
    return classes.filter(Boolean).join(' ');
  }

  get contentClasses(): string {
    if (this.noPadding) {
      return '';
    }
    
    if (this.fullWidth) {
      return 'container-padding';
    }
    
    return 'mx-auto max-w-7xl container-padding';
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}