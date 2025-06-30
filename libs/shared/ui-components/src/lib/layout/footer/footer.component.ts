import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterLink {
  label: string;
  route?: string;
  href?: string;
  external?: boolean;
}

export interface SocialLink {
  name: string;
  href: string;
  icon: string;
  ariaLabel: string;
}

@Component({
  selector: 'amysoft-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="bg-neutral-900 text-neutral-300">
      <div class="mx-auto max-w-7xl container-padding section-spacing">
        
        <!-- Main footer content -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          
          <!-- Brand section -->
          <div class="lg:col-span-2">
            <div class="flex items-center space-x-3 mb-6">
              <div class="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-brand-500 to-accent-500 rounded-xl shadow-lg">
                <span class="text-white font-bold text-lg">AI</span>
              </div>
              <span class="text-xl font-bold text-white">Beyond the AI Plateau</span>
            </div>
            
            <p class="text-neutral-400 mb-6 max-w-md leading-relaxed">
              Transform from AI novice to elite developer with proven frameworks that 97% of developers miss. 
              Join 3,000+ developers who've mastered AI-driven development.
            </p>
            
            <!-- Social proof -->
            <div class="flex flex-wrap items-center gap-6 mb-6">
              <div class="flex items-center space-x-2">
                <div class="flex -space-x-2">
                  <div class="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full border-2 border-neutral-900"></div>
                  <div class="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full border-2 border-neutral-900"></div>
                  <div class="w-8 h-8 bg-gradient-to-br from-success-400 to-success-600 rounded-full border-2 border-neutral-900"></div>
                </div>
                <span class="text-sm text-neutral-400">3,000+ developers</span>
              </div>
              
              <div class="flex items-center space-x-1">
                <div class="flex space-x-1">
                  <svg *ngFor="let star of stars" class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.163c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.98 9.384c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.951-.69l1.286-3.957z"/>
                  </svg>
                </div>
                <span class="text-sm text-neutral-400">4.9/5 (847 reviews)</span>
              </div>
            </div>
            
            <!-- Newsletter signup -->
            <div class="max-w-md">
              <h3 class="text-white font-semibold mb-3">Stay Updated</h3>
              <p class="text-sm text-neutral-400 mb-4">Get the latest AI development insights and framework updates.</p>
              <form class="flex space-x-2" (ngSubmit)="subscribeNewsletter($event)">
                <input 
                  type="email" 
                  placeholder="Enter your email"
                  class="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                  #emailInput>
                <button 
                  type="submit"
                  class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          
          <!-- Footer sections -->
          <div *ngFor="let section of footerSections" class="space-y-4">
            <h3 class="text-white font-semibold text-sm uppercase tracking-wide">
              {{ section.title }}
            </h3>
            <ul class="space-y-3">
              <li *ngFor="let link of section.links">
                <a [routerLink]="link.route"
                   [href]="link.href"
                   [target]="link.external ? '_blank' : '_self'"
                   [rel]="link.external ? 'noopener noreferrer' : ''"
                   class="text-neutral-400 hover:text-white transition-colors duration-200 text-sm">
                  {{ link.label }}
                  <svg *ngIf="link.external" class="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Bottom section -->
        <div class="mt-12 pt-8 border-t border-neutral-800">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            
            <!-- Social links -->
            <div class="flex items-center space-x-6">
              <span class="text-sm text-neutral-500">Follow us:</span>
              <div class="flex space-x-4">
                <a *ngFor="let social of socialLinks"
                   [href]="social.href"
                   [attr.aria-label]="social.ariaLabel"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="text-neutral-400 hover:text-white transition-colors duration-200">
                  <span class="sr-only">{{ social.name }}</span>
                  <div [innerHTML]="social.icon" class="w-5 h-5"></div>
                </a>
              </div>
            </div>
            
            <!-- Legal links -->
            <div class="flex flex-wrap items-center space-x-6 text-sm">
              <span class="text-neutral-500">© 2024 Beyond the AI Plateau. All rights reserved.</span>
              <a routerLink="/privacy" class="text-neutral-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <a routerLink="/terms" class="text-neutral-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </a>
              <a routerLink="/cookies" class="text-neutral-400 hover:text-white transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
          
          <!-- Trust indicators -->
          <div class="mt-8 pt-6 border-t border-neutral-800">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div class="flex flex-wrap items-center gap-6 text-xs text-neutral-500">
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span>SSL Secured</span>
                </div>
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  <span>30-Day Money Back Guarantee</span>
                </div>
                <div class="flex items-center space-x-2">
                  <svg class="w-4 h-4 text-success-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span>Trusted by 3,000+ Developers</span>
                </div>
              </div>
              
              <div class="text-xs text-neutral-500">
                Made with ❤️ for the developer community
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  stars = Array(5).fill(0);

  footerSections: FooterSection[] = [
    {
      title: 'Framework',
      links: [
        { label: 'Five Elite Principles', route: '/framework' },
        { label: 'Implementation Roadmap', route: '/roadmap' },
        { label: 'Template Library', route: '/templates' },
        { label: 'Case Studies', route: '/case-studies' },
        { label: 'Success Stories', route: '/testimonials' }
      ]
    },
    {
      title: 'Learn',
      links: [
        { label: 'Blog', route: '/blog' },
        { label: 'AI Development Guide', route: '/guide' },
        { label: 'Video Tutorials', route: '/tutorials' },
        { label: 'Free Resources', route: '/resources' },
        { label: 'Community Forum', href: 'https://community.amysoft.tech', external: true }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', route: '/about' },
        { label: 'Pricing', route: '/pricing' },
        { label: 'Contact', route: '/contact' },
        { label: 'Careers', route: '/careers' },
        { label: 'Press Kit', route: '/press' }
      ]
    }
  ];

  socialLinks: SocialLink[] = [
    {
      name: 'Twitter',
      href: 'https://twitter.com/amysoft_tech',
      ariaLabel: 'Follow us on Twitter',
      icon: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/></svg>`
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/amysoft-tech',
      ariaLabel: 'Follow us on LinkedIn',
      icon: `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clip-rule="evenodd"/></svg>`
    },
    {
      name: 'GitHub',
      href: 'https://github.com/amysoft-tech',
      ariaLabel: 'Follow us on GitHub',
      icon: `<svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clip-rule="evenodd"/></svg>`
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@amysoft-tech',
      ariaLabel: 'Follow us on YouTube',
      icon: `<svg fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/></svg>`
    }
  ];

  subscribeNewsletter(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    const email = emailInput.value;
    
    if (email) {
      // Here you would typically call your newsletter service
      console.log('Newsletter subscription for:', email);
      
      // Reset form
      emailInput.value = '';
      
      // Show success message (you could use a toast service here)
      alert('Thank you for subscribing! Check your email for confirmation.');
    }
  }
}