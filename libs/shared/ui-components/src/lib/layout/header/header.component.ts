import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface NavigationItem {
  label: string;
  route?: string;
  href?: string;
  children?: NavigationItem[];
  highlight?: boolean;
}

@Component({
  selector: 'amysoft-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
            [class]="headerClasses()">
      <nav class="mx-auto max-w-7xl container-padding" role="navigation" aria-label="Main navigation">
        <div class="flex items-center justify-between h-16 lg:h-20">
          
          <!-- Logo -->
          <div class="flex items-center">
            <a routerLink="/" 
               class="flex items-center space-x-3 text-xl font-bold text-neutral-900 hover:text-brand-600 transition-colors duration-200"
               aria-label="Beyond the AI Plateau - Home">
              <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl shadow-lg">
                <span class="text-white font-bold text-lg">AI</span>
              </div>
              <span class="hidden sm:block gradient-text">Beyond the AI Plateau</span>
            </a>
          </div>

          <!-- Desktop Navigation -->
          <div class="hidden lg:flex lg:items-center lg:space-x-8">
            <div class="flex items-center space-x-6">
              <ng-container *ngFor="let item of navigationItems">
                <div class="relative" *ngIf="!item.children">
                  <a [routerLink]="item.route" 
                     [href]="item.href"
                     [target]="item.href ? '_blank' : '_self'"
                     [rel]="item.href ? 'noopener noreferrer' : ''"
                     class="nav-link"
                     [class.nav-link-highlight]="item.highlight"
                     routerLinkActive="nav-link-active"
                     [routerLinkActiveOptions]="{ exact: item.route === '/' }">
                    {{ item.label }}
                  </a>
                </div>
                
                <!-- Dropdown for items with children -->
                <div class="relative" *ngIf="item.children" 
                     (mouseenter)="showDropdown(item.label)" 
                     (mouseleave)="hideDropdown(item.label)">
                  <button class="nav-link flex items-center space-x-1"
                          [attr.aria-expanded]="isDropdownOpen(item.label)"
                          [attr.aria-controls]="item.label + '-dropdown'">
                    <span>{{ item.label }}</span>
                    <svg class="w-4 h-4 transition-transform duration-200"
                         [class.rotate-180]="isDropdownOpen(item.label)"
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  <!-- Dropdown menu -->
                  <div *ngIf="isDropdownOpen(item.label)"
                       [id]="item.label + '-dropdown'"
                       class="absolute top-full left-0 w-64 mt-2 bg-white rounded-xl shadow-hard border border-neutral-200 py-2 animate-fade-in">
                    <a *ngFor="let child of item.children"
                       [routerLink]="child.route"
                       [href]="child.href"
                       [target]="child.href ? '_blank' : '_self'"
                       class="block px-4 py-3 text-sm text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 transition-colors duration-200">
                      {{ child.label }}
                    </a>
                  </div>
                </div>
              </ng-container>
            </div>
            
            <!-- CTA Button -->
            <div class="flex items-center space-x-4">
              <a routerLink="/pricing" class="btn-primary">
                Get Started
              </a>
            </div>
          </div>

          <!-- Mobile menu button -->
          <div class="lg:hidden">
            <button (click)="toggleMobileMenu()"
                    class="inline-flex items-center justify-center p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all duration-200"
                    [attr.aria-expanded]="mobileMenuOpen()"
                    aria-controls="mobile-menu"
                    aria-label="Toggle navigation menu">
              <span class="sr-only">Open main menu</span>
              <!-- Hamburger icon -->
              <svg *ngIf="!mobileMenuOpen()" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
              <!-- Close icon -->
              <svg *ngIf="mobileMenuOpen()" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Mobile Navigation Menu -->
        <div *ngIf="mobileMenuOpen()" 
             id="mobile-menu"
             class="lg:hidden mt-4 pb-4 animate-slide-in-down">
          <div class="flex flex-col space-y-2">
            <ng-container *ngFor="let item of navigationItems">
              <a *ngIf="!item.children"
                 [routerLink]="item.route"
                 [href]="item.href"
                 [target]="item.href ? '_blank' : '_self'"
                 class="mobile-nav-link"
                 [class.mobile-nav-link-highlight]="item.highlight"
                 routerLinkActive="mobile-nav-link-active"
                 [routerLinkActiveOptions]="{ exact: item.route === '/' }"
                 (click)="closeMobileMenu()">
                {{ item.label }}
              </a>
              
              <!-- Mobile dropdown -->
              <div *ngIf="item.children" class="space-y-1">
                <button (click)="toggleMobileDropdown(item.label)"
                        class="mobile-nav-link flex items-center justify-between w-full"
                        [attr.aria-expanded]="isMobileDropdownOpen(item.label)">
                  <span>{{ item.label }}</span>
                  <svg class="w-4 h-4 transition-transform duration-200"
                       [class.rotate-180]="isMobileDropdownOpen(item.label)"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                <div *ngIf="isMobileDropdownOpen(item.label)" class="pl-4 space-y-1">
                  <a *ngFor="let child of item.children"
                     [routerLink]="child.route"
                     [href]="child.href"
                     [target]="child.href ? '_blank' : '_self'"
                     class="mobile-nav-sublink"
                     (click)="closeMobileMenu()">
                    {{ child.label }}
                  </a>
                </div>
              </div>
            </ng-container>
            
            <!-- Mobile CTA -->
            <div class="pt-4 mt-4 border-t border-neutral-200">
              <a routerLink="/pricing" 
                 class="btn-primary w-full text-center"
                 (click)="closeMobileMenu()">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>
    </header>
  `,
  styles: [`
    .nav-link {
      @apply text-neutral-700 hover:text-brand-600 font-medium transition-colors duration-200 py-2;
    }
    
    .nav-link-active {
      @apply text-brand-600;
    }
    
    .nav-link-highlight {
      @apply text-accent-600 hover:text-accent-700 font-semibold;
    }
    
    .mobile-nav-link {
      @apply block px-4 py-3 text-base font-medium text-neutral-700 hover:text-brand-600 hover:bg-neutral-50 rounded-xl transition-all duration-200;
    }
    
    .mobile-nav-link-active {
      @apply text-brand-600 bg-brand-50;
    }
    
    .mobile-nav-link-highlight {
      @apply text-accent-600 hover:text-accent-700 font-semibold;
    }
    
    .mobile-nav-sublink {
      @apply block px-4 py-2 text-sm text-neutral-600 hover:text-brand-600 hover:bg-neutral-50 rounded-lg transition-all duration-200;
    }
  `]
})
export class HeaderComponent {
  private scrolled = signal(false);
  private mobileMenuOpen = signal(false);
  private openDropdowns = signal<Set<string>>(new Set());
  private openMobileDropdowns = signal<Set<string>>(new Set());

  navigationItems: NavigationItem[] = [
    {
      label: 'Framework',
      children: [
        { label: 'Five Elite Principles', route: '/framework' },
        { label: 'Implementation Roadmap', route: '/roadmap' },
        { label: 'Template Library', route: '/templates' },
        { label: 'Case Studies', route: '/case-studies' }
      ]
    },
    {
      label: 'Learn',
      children: [
        { label: 'Blog', route: '/blog' },
        { label: 'AI Development Guide', route: '/guide' },
        { label: 'Video Tutorials', route: '/tutorials' },
        { label: 'Community', href: 'https://community.amysoft.tech' }
      ]
    },
    {
      label: 'Pricing',
      route: '/pricing'
    },
    {
      label: 'About',
      route: '/about'
    }
  ];

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled.set(window.pageYOffset > 10);
  }

  @HostListener('window:resize', [])
  onWindowResize() {
    if (window.innerWidth >= 1024) {
      this.mobileMenuOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.openDropdowns.set(new Set());
    }
  }

  headerClasses(): string {
    const baseClasses = 'blur-backdrop';
    const scrolledClasses = this.scrolled() ? 'shadow-soft' : '';
    return `${baseClasses} ${scrolledClasses}`.trim();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(current => !current);
    
    // Close all mobile dropdowns when closing menu
    if (!this.mobileMenuOpen()) {
      this.openMobileDropdowns.set(new Set());
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.openMobileDropdowns.set(new Set());
  }

  showDropdown(label: string): void {
    this.openDropdowns.update(current => new Set([...current, label]));
  }

  hideDropdown(label: string): void {
    this.openDropdowns.update(current => {
      const newSet = new Set(current);
      newSet.delete(label);
      return newSet;
    });
  }

  isDropdownOpen(label: string): boolean {
    return this.openDropdowns().has(label);
  }

  toggleMobileDropdown(label: string): void {
    this.openMobileDropdowns.update(current => {
      const newSet = new Set(current);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }

  isMobileDropdownOpen(label: string): boolean {
    return this.openMobileDropdowns().has(label);
  }
}