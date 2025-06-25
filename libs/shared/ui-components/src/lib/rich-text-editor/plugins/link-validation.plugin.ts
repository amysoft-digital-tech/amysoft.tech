/**
 * Link Validation Plugin for ProseMirror
 * Validates and enhances links with security checking and metadata enrichment
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface LinkValidationConfig {
  enabled: boolean;
  validateOnPaste: boolean;
  validateOnType: boolean;
  checkSecurity: boolean;
  fetchMetadata: boolean;
  timeout: number;
  cache: boolean;
  allowedDomains: string[];
  blockedDomains: string[];
}

interface LinkInfo {
  url: string;
  valid: boolean;
  status?: number;
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  security: SecurityInfo;
  metadata: LinkMetadata;
  lastChecked: string;
  error?: string;
}

interface SecurityInfo {
  safe: boolean;
  phishing: boolean;
  malware: boolean;
  reputation: 'good' | 'neutral' | 'suspicious' | 'bad';
  certificates: CertificateInfo[];
}

interface CertificateInfo {
  valid: boolean;
  issuer: string;
  expires: string;
  trusted: boolean;
}

interface LinkMetadata {
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  type?: string;
  author?: string;
  publishedDate?: string;
  keywords?: string[];
}

interface ValidationResult {
  url: string;
  valid: boolean;
  info?: LinkInfo;
  error?: string;
  suggestions?: string[];
}

class LinkValidator {
  private config: LinkValidationConfig;
  private cache = new Map<string, LinkInfo>();
  private pendingValidations = new Map<string, Promise<ValidationResult>>();

  constructor(config: LinkValidationConfig) {
    this.config = config;
  }

  async validateLink(url: string): Promise<ValidationResult> {
    if (!this.config.enabled) {
      return { url, valid: true };
    }

    // Check cache first
    if (this.config.cache && this.cache.has(url)) {
      const cached = this.cache.get(url)!;
      const cacheAge = Date.now() - new Date(cached.lastChecked).getTime();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge < maxAge) {
        return { url, valid: cached.valid, info: cached };
      }
    }

    // Check if validation is already in progress
    const existing = this.pendingValidations.get(url);
    if (existing) {
      return existing;
    }

    // Start new validation
    const validation = this.performValidation(url);
    this.pendingValidations.set(url, validation);

    try {
      const result = await validation;
      this.pendingValidations.delete(url);
      
      if (result.info && this.config.cache) {
        this.cache.set(url, result.info);
      }

      return result;
    } catch (error) {
      this.pendingValidations.delete(url);
      throw error;
    }
  }

  private async performValidation(url: string): Promise<ValidationResult> {
    try {
      // Basic URL validation
      const basicValidation = this.validateUrlFormat(url);
      if (!basicValidation.valid) {
        return basicValidation;
      }

      // Domain validation
      const domainValidation = this.validateDomain(url);
      if (!domainValidation.valid) {
        return domainValidation;
      }

      // Fetch link information
      const linkInfo = await this.fetchLinkInfo(url);
      
      return {
        url,
        valid: linkInfo.valid,
        info: linkInfo
      };
    } catch (error) {
      return {
        url,
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private validateUrlFormat(url: string): ValidationResult {
    try {
      const parsed = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return {
          url,
          valid: false,
          error: 'Only HTTP and HTTPS protocols are allowed',
          suggestions: [`https://${url.replace(/^[^:]+:\/\//, '')}`]
        };
      }

      // Check for suspicious patterns
      const suspicious = [
        /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
        /[а-я]/, // Cyrillic characters (potential IDN homograph attack)
        /[А-Я]/, // Cyrillic uppercase
        /xn--/, // Punycode
        /[^\x00-\x7F]/ // Non-ASCII characters
      ];

      const suspiciousPattern = suspicious.find(pattern => pattern.test(parsed.hostname));
      if (suspiciousPattern) {
        console.warn(`Potentially suspicious URL pattern detected: ${url}`);
      }

      return { url, valid: true };
    } catch (error) {
      const suggestions = [];
      
      // Common fixes
      if (!url.includes('://')) {
        suggestions.push(`https://${url}`);
      }
      
      if (url.includes(' ')) {
        suggestions.push(url.replace(/\s+/g, ''));
      }

      return {
        url,
        valid: false,
        error: 'Invalid URL format',
        suggestions
      };
    }
  }

  private validateDomain(url: string): ValidationResult {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.toLowerCase();

      // Check blocked domains
      if (this.config.blockedDomains.length > 0) {
        const blocked = this.config.blockedDomains.some(blockedDomain => 
          domain === blockedDomain || domain.endsWith(`.${blockedDomain}`)
        );

        if (blocked) {
          return {
            url,
            valid: false,
            error: 'Domain is blocked'
          };
        }
      }

      // Check allowed domains (if whitelist is configured)
      if (this.config.allowedDomains.length > 0) {
        const allowed = this.config.allowedDomains.some(allowedDomain => 
          domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
        );

        if (!allowed) {
          return {
            url,
            valid: false,
            error: 'Domain is not in the allowed list'
          };
        }
      }

      return { url, valid: true };
    } catch (error) {
      return {
        url,
        valid: false,
        error: 'Invalid domain'
      };
    }
  }

  private async fetchLinkInfo(url: string): Promise<LinkInfo> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      // Use a proxy endpoint to avoid CORS issues
      const proxyUrl = `/api/link-info?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        url,
        valid: response.status < 400,
        status: response.status,
        title: data.title,
        description: data.description,
        image: data.image,
        type: data.type,
        security: data.security || this.getDefaultSecurity(),
        metadata: data.metadata || {},
        lastChecked: new Date().toISOString()
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  private getDefaultSecurity(): SecurityInfo {
    return {
      safe: true,
      phishing: false,
      malware: false,
      reputation: 'neutral',
      certificates: []
    };
  }

  async validateMultipleLinks(urls: string[]): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();
    
    // Validate in parallel with concurrency limit
    const concurrency = 5;
    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchPromises = batch.map(url => this.validateLink(url));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const url = batch[index];
        if (result.status === 'fulfilled') {
          results.set(url, result.value);
        } else {
          results.set(url, {
            url,
            valid: false,
            error: result.reason?.message || 'Validation failed'
          });
        }
      });
    }
    
    return results;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

const linkValidationKey = new PluginKey('linkValidation');

export function linkValidation(config: LinkValidationConfig): Plugin {
  const validator = new LinkValidator(config);
  
  return new Plugin({
    key: linkValidationKey,
    state: {
      init() {
        return {
          validator,
          validatedLinks: new Map<string, ValidationResult>(),
          decorations: DecorationSet.empty
        };
      },
      apply(tr, state) {
        let decorations = state.decorations.map(tr.mapping, tr.doc);
        const validatedLinks = new Map(state.validatedLinks);

        if (tr.docChanged) {
          // Find all links in the document
          const links = findLinksInDoc(tr.doc);
          
          // Validate new or changed links
          links.forEach(async (link) => {
            if (!validatedLinks.has(link.href) || shouldRevalidate(validatedLinks.get(link.href)!)) {
              try {
                const result = await validator.validateLink(link.href);
                validatedLinks.set(link.href, result);
                
                // Update decorations
                const view = (this as any).editorView as EditorView;
                if (view) {
                  const newDecorations = updateLinkDecorations(tr.doc, validatedLinks);
                  view.dispatch(view.state.tr.setMeta(linkValidationKey, { decorations: newDecorations }));
                }
              } catch (error) {
                console.error('Link validation failed:', error);
              }
            }
          });

          // Update decorations immediately with current validation state
          decorations = updateLinkDecorations(tr.doc, validatedLinks);
        }

        // Handle plugin meta updates
        const meta = tr.getMeta(linkValidationKey);
        if (meta?.decorations) {
          decorations = meta.decorations;
        }

        return {
          validator,
          validatedLinks,
          decorations
        };
      }
    },
    props: {
      decorations(state) {
        return this.getState(state).decorations;
      },
      handlePaste(view, event, slice) {
        if (!config.validateOnPaste) return false;

        // Extract URLs from pasted content
        const text = event.clipboardData?.getData('text/plain') || '';
        const urls = extractUrls(text);
        
        if (urls.length > 0) {
          // Validate URLs asynchronously
          urls.forEach(async (url) => {
            try {
              await validator.validateLink(url);
              // Trigger decoration update
              const tr = view.state.tr.setMeta(linkValidationKey, { revalidate: true });
              view.dispatch(tr);
            } catch (error) {
              console.error('Paste link validation failed:', error);
            }
          });
        }

        return false;
      }
    },
    view(editorView) {
      // Create link validation UI
      const validationUI = createLinkValidationUI(validator, editorView);
      
      // Store reference for meta updates
      (this as any).editorView = editorView;

      return {
        destroy() {
          validationUI.remove();
        }
      };
    }
  });
}

function findLinksInDoc(doc: any): Array<{ href: string; from: number; to: number }> {
  const links: Array<{ href: string; from: number; to: number }> = [];
  
  doc.descendants((node: any, pos: number) => {
    if (node.isText && node.marks) {
      node.marks.forEach((mark: any) => {
        if (mark.type.name === 'link') {
          links.push({
            href: mark.attrs.href,
            from: pos,
            to: pos + node.nodeSize
          });
        }
      });
    }
  });
  
  return links;
}

function updateLinkDecorations(doc: any, validatedLinks: Map<string, ValidationResult>): DecorationSet {
  const decorations: Decoration[] = [];
  const links = findLinksInDoc(doc);
  
  links.forEach(link => {
    const validation = validatedLinks.get(link.href);
    if (!validation) return;

    let className = 'link-validation';
    let title = link.href;
    
    if (validation.valid) {
      if (validation.info?.security.safe === false) {
        className += ' link-unsafe';
        title += ' (Security Warning)';
      } else {
        className += ' link-valid';
        title += ' (Validated)';
      }
    } else {
      className += ' link-invalid';
      title += ` (${validation.error || 'Invalid'})`;
    }

    const decoration = Decoration.inline(link.from, link.to, {
      class: className,
      title: title
    });

    decorations.push(decoration);

    // Add validation indicator
    const indicator = Decoration.widget(link.to, () => {
      const span = document.createElement('span');
      span.className = 'link-validation-indicator';
      
      if (validation.valid) {
        if (validation.info?.security.safe === false) {
          span.innerHTML = '⚠️';
          span.title = 'Security warning';
          span.style.color = '#f59e0b';
        } else {
          span.innerHTML = '✓';
          span.title = 'Link validated';
          span.style.color = '#16a34a';
        }
      } else {
        span.innerHTML = '✗';
        span.title = validation.error || 'Invalid link';
        span.style.color = '#dc2626';
      }
      
      span.style.cssText += `
        font-size: 12px;
        margin-left: 2px;
        cursor: help;
      `;
      
      return span;
    });

    decorations.push(indicator);
  });
  
  return DecorationSet.create(doc, decorations);
}

function shouldRevalidate(result: ValidationResult): boolean {
  if (!result.info) return true;
  
  const lastChecked = new Date(result.info.lastChecked);
  const now = new Date();
  const hoursSinceCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);
  
  // Revalidate after 24 hours, or sooner for invalid links
  const revalidateAfter = result.valid ? 24 : 1;
  return hoursSinceCheck > revalidateAfter;
}

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

function createLinkValidationUI(validator: LinkValidator, editorView: EditorView): HTMLElement {
  const container = document.createElement('div');
  container.className = 'link-validation-ui';
  container.style.cssText = `
    position: absolute;
    top: 8px;
    right: 120px;
    z-index: 15;
  `;

  const statusButton = document.createElement('button');
  statusButton.className = 'link-validation-status';
  statusButton.textContent = '🔗';
  statusButton.title = 'Link validation status';
  statusButton.style.cssText = `
    width: 28px;
    height: 28px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  statusButton.addEventListener('click', () => {
    showLinkValidationPanel(validator, editorView);
  });

  container.appendChild(statusButton);
  editorView.dom.parentElement?.appendChild(container);

  return container;
}

function showLinkValidationPanel(validator: LinkValidator, editorView: EditorView): void {
  const panel = document.createElement('div');
  panel.className = 'link-validation-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    padding: 24px;
    max-width: 500px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
  `;

  const links = findLinksInDoc(editorView.state.doc);
  const uniqueUrls = [...new Set(links.map(link => link.href))];

  panel.innerHTML = `
    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
      Link Validation Report
    </h3>
    <div class="validation-summary" style="margin-bottom: 16px;">
      <p style="margin: 0; color: #6b7280;">
        Found ${uniqueUrls.length} unique links in document
      </p>
    </div>
    <div class="validation-actions" style="margin-bottom: 16px;">
      <button class="validate-all" style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: #0066cc; color: white; cursor: pointer;">
        Validate All Links
      </button>
      <button class="clear-cache" style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer; margin-left: 8px;">
        Clear Cache
      </button>
    </div>
    <div class="validation-results" id="validation-results">
      ${uniqueUrls.map(url => `
        <div class="link-item" style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
          <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${url}</div>
          <div class="validation-status" style="font-size: 12px; color: #6b7280;">Pending validation...</div>
        </div>
      `).join('')}
    </div>
  `;

  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  `;

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  // Handle actions
  panel.querySelector('.validate-all')?.addEventListener('click', async () => {
    const results = await validator.validateMultipleLinks(uniqueUrls);
    updateValidationResults(panel, results);
  });

  panel.querySelector('.clear-cache')?.addEventListener('click', () => {
    validator.clearCache();
    showNotification('Cache cleared', 'success');
  });

  function closePanel() {
    backdrop.remove();
    panel.remove();
  }

  backdrop.addEventListener('click', closePanel);
}

function updateValidationResults(panel: HTMLElement, results: Map<string, ValidationResult>): void {
  const resultsContainer = panel.querySelector('#validation-results');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = '';

  results.forEach((result, url) => {
    const item = document.createElement('div');
    item.className = 'link-item';
    item.style.cssText = 'padding: 8px 0; border-bottom: 1px solid #f3f4f6;';

    const statusColor = result.valid 
      ? (result.info?.security.safe === false ? '#f59e0b' : '#16a34a')
      : '#dc2626';

    const statusIcon = result.valid 
      ? (result.info?.security.safe === false ? '⚠️' : '✓')
      : '✗';

    item.innerHTML = `
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">${url}</div>
      <div style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
        <span style="color: ${statusColor};">${statusIcon}</span>
        <span style="color: ${statusColor};">
          ${result.valid 
            ? (result.info?.security.safe === false ? 'Security Warning' : 'Valid')
            : (result.error || 'Invalid')
          }
        </span>
      </div>
      ${result.info?.title ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${result.info.title}</div>` : ''}
    `;

    resultsContainer.appendChild(item);
  });
}

function showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
  const notification = document.createElement('div');
  notification.textContent = message;
  
  const colors = {
    success: '#16a34a',
    error: '#dc2626',
    warning: '#f59e0b'
  };

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type]};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1001;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}