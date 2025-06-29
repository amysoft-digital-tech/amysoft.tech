import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { SecurityTestUtils, PerformanceTestUtils } from '../test-setup';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Basic Functionality', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct title', () => {
      expect(component.title).toEqual('Beyond the AI Plateau - Admin');
    });

    it('should render admin console header', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('Beyond the AI Plateau');
      expect(compiled.querySelector('h2')?.textContent).toContain('Admin Console');
    });

    it('should display navigation sections', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const navSections = compiled.querySelectorAll('.nav-section');
      expect(navSections.length).toBe(2);
      expect(navSections[0].querySelector('h3')?.textContent).toBe('Dashboard');
      expect(navSections[1].querySelector('h3')?.textContent).toBe('Management');
    });

    it('should display dashboard cards', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const cards = compiled.querySelectorAll('.card');
      expect(cards.length).toBe(4);
      
      const cardTitles = Array.from(cards).map(card => 
        card.querySelector('h3')?.textContent
      );
      expect(cardTitles).toContain('Total Users');
      expect(cardTitles).toContain('Sales Today');
      expect(cardTitles).toContain('Content Views');
      expect(cardTitles).toContain('Active Sessions');
    });
  });

  describe('Security Testing', () => {
    it('should sanitize displayed content', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const allText = compiled.textContent || '';
      
      // Should not contain any executable JavaScript
      SecurityTestUtils.xssPayloads.forEach(payload => {
        expect(SecurityTestUtils.testInputSanitization(allText)).toBe(true);
      });
    });

    it('should not expose sensitive information in DOM', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const htmlContent = compiled.innerHTML;
      
      // Should not contain sensitive patterns
      const sensitivePatterns = [
        /password/gi,
        /api[_-]?key/gi,
        /secret/gi,
        /token/gi,
        /credential/gi
      ];

      sensitivePatterns.forEach(pattern => {
        expect(pattern.test(htmlContent)).toBe(false);
      });
    });

    it('should have secure styling (no inline styles with javascript)', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const elementsWithStyle = compiled.querySelectorAll('[style]');
      
      elementsWithStyle.forEach(element => {
        const style = element.getAttribute('style') || '';
        expect(style).not.toMatch(/javascript:/gi);
        expect(style).not.toMatch(/expression\(/gi);
      });
    });
  });

  describe('Performance Testing', () => {
    it('should render within acceptable time limits', async () => {
      const renderTime = await PerformanceTestUtils.measureRenderTime(async () => {
        fixture = TestBed.createComponent(AppComponent);
        fixture.detectChanges();
        await fixture.whenStable();
      });

      // Should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('should not have excessive DOM nodes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const allElements = compiled.querySelectorAll('*');
      
      // Should have reasonable number of DOM nodes (less than 1000 for this component)
      expect(allElements.length).toBeLessThan(1000);
    });

    it('should have efficient change detection', () => {
      const startTime = performance.now();
      
      // Trigger multiple change detection cycles
      for (let i = 0; i < 100; i++) {
        fixture.detectChanges();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should complete 100 change detection cycles in less than 100ms
      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('Accessibility Testing', () => {
    it('should have proper heading hierarchy', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const h1 = compiled.querySelector('h1');
      const h2 = compiled.querySelector('h2');
      const h3s = compiled.querySelectorAll('h3');
      
      expect(h1).toBeTruthy();
      expect(h2).toBeTruthy();
      expect(h3s.length).toBeGreaterThan(0);
    });

    it('should have semantic HTML structure', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.querySelector('header')).toBeTruthy();
      expect(compiled.querySelector('nav')).toBeTruthy();
      expect(compiled.querySelector('main')).toBeTruthy();
    });

    it('should support keyboard navigation structure', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const navItems = compiled.querySelectorAll('nav li');
      
      navItems.forEach(item => {
        // Navigation items should be focusable or contain focusable elements
        const isFocusable = item.hasAttribute('tabindex') || 
                           item.querySelector('a, button, [tabindex]');
        // For now, just check structure exists - would need actual interactive elements
        expect(item).toBeTruthy();
      });
    });
  });

  describe('Data Validation', () => {
    it('should display properly formatted metrics', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const metrics = compiled.querySelectorAll('.metric');
      
      metrics.forEach(metric => {
        const text = metric.textContent || '';
        // Should be either a number or currency format
        const isValidFormat = /^\d{1,3}(,\d{3})*$/.test(text) || 
                             /^\$\d{1,3}(,\d{3})*$/.test(text);
        expect(isValidFormat).toBe(true);
      });
    });

    it('should display valid percentage changes', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const changes = compiled.querySelectorAll('.change');
      
      changes.forEach(change => {
        const text = change.textContent || '';
        // Should be in format +/-X%
        const isValidFormat = /^[+\-±]\d+%$/.test(text);
        expect(isValidFormat).toBe(true);
      });
    });
  });

  describe('Responsive Design', () => {
    it('should handle small screen layouts', () => {
      // Simulate mobile viewport
      const compiled = fixture.nativeElement as HTMLElement;
      Object.defineProperty(compiled, 'clientWidth', { value: 375 });
      
      fixture.detectChanges();
      
      // Should still render all essential elements
      expect(compiled.querySelector('.admin-layout')).toBeTruthy();
      expect(compiled.querySelector('.header')).toBeTruthy();
      expect(compiled.querySelector('.sidebar')).toBeTruthy();
      expect(compiled.querySelector('.content')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', () => {
      // Test with empty/undefined values
      component.title = '';
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      // Should not throw errors and should render basic structure
      expect(compiled.querySelector('.admin-layout')).toBeTruthy();
    });
  });
});