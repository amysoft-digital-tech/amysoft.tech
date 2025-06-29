import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, interval, takeUntil, startWith, switchMap } from 'rxjs';

export interface Testimonial {
  id: string;
  name: string;
  title: string;
  company?: string;
  avatar?: string;
  rating: number;
  quote: string;
  tags: string[];
  linkedinUrl?: string;
  verified: boolean;
  featured?: boolean;
  metrics?: {
    timeSaved?: string;
    productivityGain?: string;
    satisfaction?: number;
  };
  beforeAfter?: {
    before: string;
    after: string;
  };
}

export interface TestimonialConfig {
  autoRotate?: boolean;
  rotationInterval?: number; // in milliseconds
  showRating?: boolean;
  showPhoto?: boolean;
  showMetrics?: boolean;
  showTags?: boolean;
  layout?: 'carousel' | 'grid' | 'single' | 'masonry';
  slidesToShow?: number;
  enableSwipe?: boolean;
  showNavigation?: boolean;
  showDots?: boolean;
  pauseOnHover?: boolean;
}

@Component({
  selector: 'app-testimonial-carousel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="testimonial-carousel" 
      [class]="'layout-' + config.layout"
      [class.auto-rotating]="config.autoRotate"
      [attr.data-testid]="'testimonial-carousel'"
      (mouseenter)="onMouseEnter()"
      (mouseleave)="onMouseLeave()"
    >
      <!-- Carousel Header -->
      <div class="carousel-header" *ngIf="config.layout === 'carousel'">
        <h2 class="carousel-title">What Developers Are Saying</h2>
        <p class="carousel-subtitle">Join thousands of developers who've transformed their AI workflow</p>
        
        <!-- Trust Indicators -->
        <div class="trust-stats">
          <div class="trust-item">
            <span class="trust-number">{{ getAverageRating() }}</span>
            <div class="star-rating">
              <span class="stars">★★★★★</span>
            </div>
            <span class="trust-label">Average Rating</span>
          </div>
          <div class="trust-item">
            <span class="trust-number">{{ getVerifiedCount() }}</span>
            <span class="trust-label">Verified Reviews</span>
          </div>
          <div class="trust-item">
            <span class="trust-number">{{ testimonials.length }}</span>
            <span class="trust-label">Total Reviews</span>
          </div>
        </div>
      </div>

      <!-- Carousel Container -->
      <div class="carousel-container" #carouselContainer>
        <div 
          class="testimonial-track"
          [style.transform]="'translateX(' + translateX + 'px)'"
          [style.transition]="isTransitioning ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'"
          #testimonialTrack
        >
          <div 
            class="testimonial-slide"
            *ngFor="let testimonial of visibleTestimonials; let i = index; trackBy: trackByTestimonialId"
            [class.active]="i === currentIndex"
            [class.featured]="testimonial.featured"
            [style.width.%]="slideWidth"
          >
            <div class="testimonial-card">
              <!-- Card Header -->
              <div class="card-header">
                <!-- Rating -->
                <div class="rating-section" *ngIf="config.showRating">
                  <div class="star-rating">
                    <div class="stars-container">
                      <div class="stars-background">★★★★★</div>
                      <div class="stars-filled" [style.width.%]="(testimonial.rating / 5) * 100">★★★★★</div>
                    </div>
                  </div>
                  <span class="rating-text">({{ testimonial.rating }}/5)</span>
                </div>

                <!-- Verified Badge -->
                <div class="verified-badge" *ngIf="testimonial.verified">
                  <span class="badge-icon">✓</span>
                  <span class="badge-text">Verified</span>
                </div>
              </div>

              <!-- Quote -->
              <div class="quote-section">
                <div class="quote-mark">"</div>
                <blockquote class="testimonial-quote">
                  {{ testimonial.quote }}
                </blockquote>
              </div>

              <!-- Metrics (if available) -->
              <div class="metrics-section" *ngIf="config.showMetrics && testimonial.metrics">
                <div class="metrics-grid">
                  <div class="metric-item" *ngIf="testimonial.metrics.timeSaved">
                    <span class="metric-value">{{ testimonial.metrics.timeSaved }}</span>
                    <span class="metric-label">Time Saved</span>
                  </div>
                  <div class="metric-item" *ngIf="testimonial.metrics.productivityGain">
                    <span class="metric-value">{{ testimonial.metrics.productivityGain }}</span>
                    <span class="metric-label">Productivity</span>
                  </div>
                  <div class="metric-item" *ngIf="testimonial.metrics.satisfaction">
                    <span class="metric-value">{{ testimonial.metrics.satisfaction }}/10</span>
                    <span class="metric-label">Satisfaction</span>
                  </div>
                </div>
              </div>

              <!-- Before/After (if available) -->
              <div class="before-after-section" *ngIf="testimonial.beforeAfter">
                <div class="before-after-grid">
                  <div class="before-item">
                    <h4 class="section-title">Before</h4>
                    <p class="section-text">{{ testimonial.beforeAfter.before }}</p>
                  </div>
                  <div class="after-item">
                    <h4 class="section-title">After</h4>
                    <p class="section-text">{{ testimonial.beforeAfter.after }}</p>
                  </div>
                </div>
              </div>

              <!-- Author Info -->
              <div class="author-section">
                <div class="author-info">
                  <div class="author-avatar-container" *ngIf="config.showPhoto && testimonial.avatar">
                    <img 
                      [src]="testimonial.avatar" 
                      [alt]="testimonial.name + ' avatar'"
                      class="author-avatar"
                      loading="lazy"
                      (error)="onAvatarError($event)"
                    />
                  </div>
                  <div class="author-details">
                    <h3 class="author-name">{{ testimonial.name }}</h3>
                    <p class="author-title">{{ testimonial.title }}</p>
                    <p class="author-company" *ngIf="testimonial.company">{{ testimonial.company }}</p>
                  </div>
                  <a 
                    *ngIf="testimonial.linkedinUrl"
                    [href]="testimonial.linkedinUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="linkedin-link"
                    [attr.aria-label]="'View ' + testimonial.name + ' on LinkedIn'"
                  >
                    <span class="linkedin-icon">in</span>
                  </a>
                </div>

                <!-- Tags -->
                <div class="tags-section" *ngIf="config.showTags && testimonial.tags.length > 0">
                  <span 
                    class="tag"
                    *ngFor="let tag of testimonial.tags"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Controls -->
      <div class="carousel-controls" *ngIf="config.showNavigation && config.layout === 'carousel'">
        <button 
          class="nav-button prev"
          (click)="previousSlide()"
          [disabled]="currentIndex === 0 && !isInfinite"
          [attr.aria-label]="'Previous testimonial'"
        >
          <span class="nav-icon">←</span>
        </button>
        
        <button 
          class="nav-button next"
          (click)="nextSlide()"
          [disabled]="currentIndex === maxIndex && !isInfinite"
          [attr.aria-label]="'Next testimonial'"
        >
          <span class="nav-icon">→</span>
        </button>
      </div>

      <!-- Dot Indicators -->
      <div class="dot-indicators" *ngIf="config.showDots && config.layout === 'carousel'">
        <button
          class="dot"
          *ngFor="let testimonial of visibleTestimonials; let i = index"
          [class.active]="i === currentIndex"
          (click)="goToSlide(i)"
          [attr.aria-label]="'Go to testimonial ' + (i + 1)"
        ></button>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar" *ngIf="config.autoRotate && config.layout === 'carousel'">
        <div 
          class="progress-fill"
          [style.animation-duration.ms]="config.rotationInterval"
          [style.animation-play-state]="isPaused ? 'paused' : 'running'"
        ></div>
      </div>

      <!-- Grid Layout (Alternative) -->
      <div class="testimonial-grid" *ngIf="config.layout === 'grid'">
        <div 
          class="testimonial-card grid-card"
          *ngFor="let testimonial of visibleTestimonials; trackBy: trackByTestimonialId"
          [class.featured]="testimonial.featured"
        >
          <!-- Simplified card content for grid layout -->
          <div class="grid-quote">
            <div class="quote-mark">"</div>
            <p>{{ getShortQuote(testimonial.quote) }}</p>
          </div>
          <div class="grid-author">
            <img 
              *ngIf="testimonial.avatar"
              [src]="testimonial.avatar" 
              [alt]="testimonial.name"
              class="grid-avatar"
              loading="lazy"
            />
            <div class="grid-info">
              <span class="grid-name">{{ testimonial.name }}</span>
              <span class="grid-title">{{ testimonial.title }}</span>
            </div>
            <div class="grid-rating">
              <span class="rating-value">{{ testimonial.rating }}</span>
              <span class="rating-star">★</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner"></div>
        <p>Loading testimonials...</p>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && testimonials.length === 0">
        <p>No testimonials available at the moment.</p>
      </div>
    </div>
  `,
  styleUrls: ['./testimonial-carousel.component.scss']
})
export class TestimonialCarouselComponent implements OnInit, OnDestroy {
  @Input() testimonials: Testimonial[] = [];
  @Input() config: TestimonialConfig = {
    autoRotate: true,
    rotationInterval: 5000,
    showRating: true,
    showPhoto: true,
    showMetrics: false,
    showTags: true,
    layout: 'carousel',
    slidesToShow: 1,
    enableSwipe: true,
    showNavigation: true,
    showDots: true,
    pauseOnHover: true
  };

  @Output() testimonialClicked = new EventEmitter<Testimonial>();
  @Output() slideChanged = new EventEmitter<{ index: number; testimonial: Testimonial }>();

  @ViewChild('carouselContainer') carouselContainer!: ElementRef;
  @ViewChild('testimonialTrack') testimonialTrack!: ElementRef;

  currentIndex = 0;
  translateX = 0;
  isTransitioning = false;
  isPaused = false;
  isLoading = false;
  visibleTestimonials: Testimonial[] = [];
  slideWidth = 100;

  private destroy$ = new Subject<void>();
  private rotationSubscription?: any;

  ngOnInit() {
    this.initializeCarousel();
    this.setupAutoRotation();
    this.setupSwipeGestures();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCarousel() {
    // Filter and sort testimonials
    this.visibleTestimonials = this.testimonials
      .filter(t => t.verified) // Only show verified testimonials
      .sort((a, b) => {
        // Prioritize featured testimonials
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        // Then sort by rating
        return b.rating - a.rating;
      });

    // Calculate slide width based on slides to show
    this.slideWidth = 100 / (this.config.slidesToShow || 1);
  }

  private setupAutoRotation() {
    if (!this.config.autoRotate) {
      return;
    }

    this.rotationSubscription = interval(this.config.rotationInterval || 5000)
      .pipe(
        startWith(0),
        switchMap(() => this.isPaused ? [] : [0]),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (!this.isPaused) {
          this.nextSlide();
        }
      });
  }

  private setupSwipeGestures() {
    if (!this.config.enableSwipe) {
      return;
    }

    // Implement touch/swipe gestures for mobile
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleStart = (e: TouchEvent | MouseEvent) => {
      startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      isDragging = true;
      this.isTransitioning = false;
    };

    const handleMove = (e: TouchEvent | MouseEvent) => {
      if (!isDragging) return;
      
      currentX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = currentX - startX;
      
      // Update transform during drag
      if (this.carouselContainer) {
        const containerWidth = this.carouselContainer.nativeElement.offsetWidth;
        const dragPercentage = (deltaX / containerWidth) * 100;
        this.translateX = -(this.currentIndex * this.slideWidth) + dragPercentage;
      }
    };

    const handleEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      this.isTransitioning = true;

      const deltaX = currentX - startX;
      const threshold = 50; // Minimum swipe distance

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          this.previousSlide();
        } else {
          this.nextSlide();
        }
      } else {
        // Snap back to current slide
        this.updateTransform();
      }
    };

    // Add event listeners
    if (this.carouselContainer) {
      const element = this.carouselContainer.nativeElement;
      
      element.addEventListener('touchstart', handleStart, { passive: true });
      element.addEventListener('touchmove', handleMove, { passive: true });
      element.addEventListener('touchend', handleEnd);
      
      element.addEventListener('mousedown', handleStart);
      element.addEventListener('mousemove', handleMove);
      element.addEventListener('mouseup', handleEnd);
    }
  }

  nextSlide() {
    if (this.currentIndex < this.maxIndex) {
      this.currentIndex++;
    } else if (this.isInfinite) {
      this.currentIndex = 0;
    }
    
    this.updateTransform();
    this.emitSlideChange();
  }

  previousSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.isInfinite) {
      this.currentIndex = this.maxIndex;
    }
    
    this.updateTransform();
    this.emitSlideChange();
  }

  goToSlide(index: number) {
    this.currentIndex = Math.max(0, Math.min(index, this.maxIndex));
    this.updateTransform();
    this.emitSlideChange();
  }

  private updateTransform() {
    this.isTransitioning = true;
    this.translateX = -(this.currentIndex * this.slideWidth);
  }

  private emitSlideChange() {
    const currentTestimonial = this.visibleTestimonials[this.currentIndex];
    if (currentTestimonial) {
      this.slideChanged.emit({
        index: this.currentIndex,
        testimonial: currentTestimonial
      });
    }
  }

  onMouseEnter() {
    if (this.config.pauseOnHover) {
      this.isPaused = true;
    }
  }

  onMouseLeave() {
    if (this.config.pauseOnHover) {
      this.isPaused = false;
    }
  }

  onAvatarError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = '/assets/testimonials/default-avatar.svg';
  }

  getShortQuote(quote: string): string {
    return quote.length > 120 ? quote.substring(0, 120) + '...' : quote;
  }

  getAverageRating(): string {
    const average = this.testimonials.reduce((sum, t) => sum + t.rating, 0) / this.testimonials.length;
    return average.toFixed(1);
  }

  getVerifiedCount(): number {
    return this.testimonials.filter(t => t.verified).length;
  }

  trackByTestimonialId(index: number, testimonial: Testimonial): string {
    return testimonial.id;
  }

  get maxIndex(): number {
    return Math.max(0, this.visibleTestimonials.length - (this.config.slidesToShow || 1));
  }

  get isInfinite(): boolean {
    return this.visibleTestimonials.length > (this.config.slidesToShow || 1);
  }
}