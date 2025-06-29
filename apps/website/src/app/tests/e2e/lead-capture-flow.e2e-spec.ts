import { test, expect, Page } from '@playwright/test';

test.describe('Lead Capture End-to-End Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Navigate to home page
    await page.goto('/');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
  });

  test('should complete full lead capture flow', async () => {
    // Test data
    const testEmail = `test-${Date.now()}@example.com`;
    const testName = 'Test User';

    // Step 1: Find and fill the hero form
    const heroForm = page.locator('[data-testid="hero-lead-form"]');
    await expect(heroForm).toBeVisible();

    // Fill email field
    await heroForm.locator('input[type="email"]').fill(testEmail);
    
    // Fill name field if present
    const nameField = heroForm.locator('input[name="name"]');
    if (await nameField.isVisible()) {
      await nameField.fill(testName);
    }

    // Check GDPR consent
    const gdprCheckbox = heroForm.locator('input[type="checkbox"][name*="gdpr"]');
    if (await gdprCheckbox.isVisible()) {
      await gdprCheckbox.check();
    }

    // Submit form
    const submitButton = heroForm.locator('button[type="submit"]');
    await submitButton.click();

    // Step 2: Verify API call is made
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/leads/capture') && response.status() === 200
    );

    // Wait for API response
    const response = await responsePromise;
    const responseData = await response.json();

    // Verify response structure
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('leadId');
    expect(responseData).toHaveProperty('message');

    // Step 3: Verify success feedback
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeVisible({ timeout: 5000 });
    
    // Verify success message content
    await expect(successMessage).toContainText(/thank you|success|welcome/i);

    // Step 4: Verify analytics tracking
    // Check that analytics events are fired
    const analyticsEvents = await page.evaluate(() => {
      return (window as any).analyticsEvents || [];
    });

    expect(analyticsEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'form_submit',
          properties: expect.objectContaining({
            form_name: expect.stringContaining('lead')
          })
        }),
        expect.objectContaining({
          type: 'conversion',
          properties: expect.objectContaining({
            conversion_type: 'lead_capture'
          })
        })
      ])
    );
  });

  test('should handle email validation', async () => {
    const heroForm = page.locator('[data-testid="hero-lead-form"]');
    
    // Test invalid email
    await heroForm.locator('input[type="email"]').fill('invalid-email');
    
    const submitButton = heroForm.locator('button[type="submit"]');
    await submitButton.click();

    // Should show validation error
    const errorMessage = page.locator('[data-testid="email-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/valid email/i);

    // Test valid email
    await heroForm.locator('input[type="email"]').fill('valid@example.com');
    
    // Error should disappear
    await expect(errorMessage).not.toBeVisible();
  });

  test('should handle API errors gracefully', async () => {
    // Mock API to return error
    await page.route('/api/leads/capture', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: 'SERVER_ERROR',
            message: 'Internal server error'
          }
        })
      });
    });

    const heroForm = page.locator('[data-testid="hero-lead-form"]');
    await heroForm.locator('input[type="email"]').fill('test@example.com');
    
    const submitButton = heroForm.locator('button[type="submit"]');
    await submitButton.click();

    // Should show error notification
    const errorNotification = page.locator('[data-testid="error-notification"]');
    await expect(errorNotification).toBeVisible({ timeout: 5000 });
    await expect(errorNotification).toContainText(/error|failed/i);
  });

  test('should respect rate limiting', async () => {
    let requestCount = 0;
    
    // Mock API to return rate limit error after 3 requests
    await page.route('/api/leads/capture', route => {
      requestCount++;
      if (requestCount > 3) {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests'
            }
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            leadId: `lead_${requestCount}`,
            message: 'Success'
          })
        });
      }
    });

    const heroForm = page.locator('[data-testid="hero-lead-form"]');
    
    // Make multiple rapid submissions
    for (let i = 1; i <= 5; i++) {
      await heroForm.locator('input[type="email"]').fill(`test${i}@example.com`);
      await heroForm.locator('button[type="submit"]').click();
      await page.waitForTimeout(100);
    }

    // Should show rate limit message
    const rateLimitMessage = page.locator('[data-testid="rate-limit-message"]');
    await expect(rateLimitMessage).toBeVisible({ timeout: 5000 });
  });

  test('should track conversion across multiple pages', async () => {
    // Start on home page and capture lead
    const heroForm = page.locator('[data-testid="hero-lead-form"]');
    await heroForm.locator('input[type="email"]').fill('test@example.com');
    await heroForm.locator('button[type="submit"]').click();

    // Wait for success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Navigate to pricing page
    await page.click('a[href="/pricing"]');
    await page.waitForLoadState('networkidle');

    // Click on a pricing tier
    const pricingButton = page.locator('[data-testid="pricing-tier-button"]').first();
    await pricingButton.click();

    // Verify conversion tracking continues
    const conversionEvents = await page.evaluate(() => {
      return (window as any).analyticsEvents?.filter((event: any) => 
        event.type === 'conversion' || event.type === 'button_click'
      ) || [];
    });

    expect(conversionEvents.length).toBeGreaterThan(1);
  });

  test('should work with A/B test variants', async () => {
    // Force a specific A/B test variant
    await page.addInitScript(() => {
      localStorage.setItem('ab_test_assignments', JSON.stringify([
        ['hero_headline_test', {
          testId: 'hero_headline_test',
          variantId: 'urgency_variant',
          sessionId: 'test_session',
          assignedAt: new Date().toISOString()
        }]
      ]));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify variant content is displayed
    const headline = page.locator('[data-testid="hero-headline"]');
    await expect(headline).toContainText(/AI Skills Gap|Left Behind/i);

    // Complete lead capture
    const heroForm = page.locator('[data-testid="hero-lead-form"]');
    await heroForm.locator('input[type="email"]').fill('abtest@example.com');
    await heroForm.locator('button[type="submit"]').click();

    // Verify A/B test events are tracked
    const abTestEvents = await page.evaluate(() => {
      return (window as any).analyticsEvents?.filter((event: any) => 
        event.type.includes('ab_test')
      ) || [];
    });

    expect(abTestEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'ab_test_conversion',
          properties: expect.objectContaining({
            test_id: 'hero_headline_test',
            variant_id: 'urgency_variant'
          })
        })
      ])
    );
  });
});

test.describe('Performance Metrics', () => {
  test('should meet Core Web Vitals thresholds', async ({ page }) => {
    // Navigate to page and wait for complete load
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit more for Core Web Vitals to be measured
    await page.waitForTimeout(3000);

    // Get performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcpEntry = entries.find(entry => entry.entryType === 'largest-contentful-paint');
          
          if (lcpEntry) {
            resolve({
              lcp: lcpEntry.startTime,
              // Add other metrics as they become available
            });
          }
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Fallback timeout
        setTimeout(() => resolve({ lcp: null }), 5000);
      });
    });

    // Verify LCP is under 2.5 seconds (good threshold)
    if ((metrics as any).lcp) {
      expect((metrics as any).lcp).toBeLessThan(2500);
    }

    // Check navigation timing
    const navigationTiming = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstByte: navigation.responseStart - navigation.navigationStart
      };
    });

    // Verify load time is under 2 seconds
    expect(navigationTiming.loadTime).toBeLessThan(2000);
    
    // Verify Time to First Byte is under 800ms
    expect(navigationTiming.firstByte).toBeLessThan(800);
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out expected/harmless errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('GTM') &&
      !error.includes('google-analytics')
    );

    expect(criticalErrors).toEqual([]);
  });

  test('should be mobile responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that mobile navigation works
    const mobileMenu = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      
      const mobileNav = page.locator('[data-testid="mobile-navigation"]');
      await expect(mobileNav).toBeVisible();
    }

    // Check that forms are usable on mobile
    const heroForm = page.locator('[data-testid="hero-lead-form"]');
    await expect(heroForm).toBeVisible();
    
    const emailInput = heroForm.locator('input[type="email"]');
    await emailInput.click();
    await emailInput.fill('mobile@test.com');
    
    // Verify input is not obscured by virtual keyboard
    const inputBoundingBox = await emailInput.boundingBox();
    expect(inputBoundingBox?.y).toBeGreaterThan(0);
  });
});