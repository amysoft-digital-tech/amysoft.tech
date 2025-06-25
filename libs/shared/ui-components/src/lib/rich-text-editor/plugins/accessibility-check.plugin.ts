/**
 * Accessibility Check Plugin for ProseMirror
 * Validates content accessibility and provides improvement suggestions
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface AccessibilityConfig {
  enabled: boolean;
  rules: AccessibilityRule[];
  autoFix: boolean;
  showInlineIssues: boolean;
  reportLevel: 'error' | 'warning' | 'info';
  wcagLevel: 'A' | 'AA' | 'AAA';
}

interface AccessibilityRule {
  id: string;
  name: string;
  description: string;
  wcagCriterion: string;
  level: 'error' | 'warning' | 'info';
  autoFixable: boolean;
  selector?: string;
  check: (node: any, context: ValidationContext) => AccessibilityIssue[];
}

interface ValidationContext {
  doc: any;
  pos: number;
  depth: number;
  ancestors: any[];
  textContent: string;
}

interface AccessibilityIssue {
  ruleId: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  autoFix?: AutoFix;
  position: { from: number; to: number };
  wcagCriterion: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

interface AutoFix {
  description: string;
  apply: (view: EditorView, issue: AccessibilityIssue) => void;
}

interface AccessibilityReport {
  totalIssues: number;
  errors: number;
  warnings: number;
  infos: number;
  issues: AccessibilityIssue[];
  score: number;
  wcagCompliance: {
    A: boolean;
    AA: boolean;
    AAA: boolean;
  };
}

class AccessibilityChecker {
  private config: AccessibilityConfig;
  private defaultRules: AccessibilityRule[];

  constructor(config: AccessibilityConfig) {
    this.config = config;
    this.defaultRules = this.createDefaultRules();
  }

  checkDocument(doc: any): AccessibilityReport {
    const issues: AccessibilityIssue[] = [];
    
    this.traverseDocument(doc, (node, pos, context) => {
      const applicableRules = this.getApplicableRules(node);
      
      applicableRules.forEach(rule => {
        const ruleIssues = rule.check(node, context);
        issues.push(...ruleIssues);
      });
    });

    return this.generateReport(issues);
  }

  private traverseDocument(
    doc: any, 
    callback: (node: any, pos: number, context: ValidationContext) => void
  ): void {
    const traverse = (node: any, pos: number, ancestors: any[] = [], depth = 0) => {
      const context: ValidationContext = {
        doc,
        pos,
        depth,
        ancestors: [...ancestors],
        textContent: node.textContent || ''
      };

      callback(node, pos, context);

      if (node.content) {
        let childPos = pos + 1;
        node.content.forEach((child: any) => {
          traverse(child, childPos, [...ancestors, node], depth + 1);
          childPos += child.nodeSize;
        });
      }
    };

    traverse(doc, 0);
  }

  private getApplicableRules(node: any): AccessibilityRule[] {
    const rules = [...this.defaultRules, ...this.config.rules];
    
    return rules.filter(rule => {
      if (!rule.selector) return true;
      
      // Simple selector matching - could be enhanced
      if (rule.selector === node.type.name) return true;
      if (rule.selector.startsWith('.') && node.attrs?.class?.includes(rule.selector.slice(1))) return true;
      if (rule.selector.startsWith('#') && node.attrs?.id === rule.selector.slice(1)) return true;
      
      return false;
    });
  }

  private generateReport(issues: AccessibilityIssue[]): AccessibilityReport {
    const errors = issues.filter(i => i.level === 'error').length;
    const warnings = issues.filter(i => i.level === 'warning').length;
    const infos = issues.filter(i => i.level === 'info').length;

    // Calculate accessibility score (0-100)
    const criticalIssues = issues.filter(i => i.impact === 'critical').length;
    const seriousIssues = issues.filter(i => i.impact === 'serious').length;
    const moderateIssues = issues.filter(i => i.impact === 'moderate').length;
    const minorIssues = issues.filter(i => i.impact === 'minor').length;

    const score = Math.max(0, 100 - (
      criticalIssues * 25 +
      seriousIssues * 15 +
      moderateIssues * 10 +
      minorIssues * 5
    ));

    // WCAG compliance check
    const wcagCompliance = {
      A: !issues.some(i => i.wcagCriterion.includes('A') && i.level === 'error'),
      AA: !issues.some(i => i.wcagCriterion.includes('AA') && i.level === 'error'),
      AAA: !issues.some(i => i.wcagCriterion.includes('AAA') && i.level === 'error')
    };

    return {
      totalIssues: issues.length,
      errors,
      warnings,
      infos,
      issues,
      score,
      wcagCompliance
    };
  }

  private createDefaultRules(): AccessibilityRule[] {
    return [
      // Images without alt text
      {
        id: 'img-alt',
        name: 'Images must have alt text',
        description: 'All images must have alternative text for screen readers',
        wcagCriterion: '1.1.1 Non-text Content (A)',
        level: 'error',
        autoFixable: true,
        selector: 'image',
        check: (node, context) => {
          if (node.type.name === 'image' && !node.attrs.alt) {
            return [{
              ruleId: 'img-alt',
              level: 'error',
              message: 'Image is missing alt text',
              suggestion: 'Add descriptive alt text to help screen reader users understand the image content',
              position: { from: context.pos, to: context.pos + node.nodeSize },
              wcagCriterion: '1.1.1 Non-text Content (A)',
              impact: 'critical',
              autoFix: {
                description: 'Add placeholder alt text',
                apply: (view, issue) => {
                  const tr = view.state.tr.setNodeMarkup(issue.position.from, undefined, {
                    ...node.attrs,
                    alt: 'Image description needed'
                  });
                  view.dispatch(tr);
                }
              }
            }];
          }
          return [];
        }
      },

      // Headings hierarchy
      {
        id: 'heading-hierarchy',
        name: 'Proper heading hierarchy',
        description: 'Headings should follow a logical hierarchy (h1 > h2 > h3, etc.)',
        wcagCriterion: '1.3.1 Info and Relationships (A)',
        level: 'warning',
        autoFixable: false,
        check: (node, context) => {
          if (node.type.name === 'heading') {
            const currentLevel = node.attrs.level;
            const previousHeading = this.findPreviousHeading(context.doc, context.pos);
            
            if (previousHeading && currentLevel > previousHeading.level + 1) {
              return [{
                ruleId: 'heading-hierarchy',
                level: 'warning',
                message: `Heading level ${currentLevel} follows h${previousHeading.level}, skipping levels`,
                suggestion: `Use h${previousHeading.level + 1} instead to maintain proper hierarchy`,
                position: { from: context.pos, to: context.pos + node.nodeSize },
                wcagCriterion: '1.3.1 Info and Relationships (A)',
                impact: 'moderate'
              }];
            }
          }
          return [];
        }
      },

      // Color contrast (simplified check)
      {
        id: 'color-contrast',
        name: 'Sufficient color contrast',
        description: 'Text must have sufficient contrast against its background',
        wcagCriterion: '1.4.3 Contrast (AA)',
        level: 'warning',
        autoFixable: false,
        check: (node, context) => {
          if (node.marks) {
            const colorMark = node.marks.find((mark: any) => mark.type.name === 'textStyle' && mark.attrs.color);
            if (colorMark) {
              // Simplified contrast check - would need more sophisticated implementation
              const color = colorMark.attrs.color;
              if (this.isLowContrast(color)) {
                return [{
                  ruleId: 'color-contrast',
                  level: 'warning',
                  message: 'Text color may not have sufficient contrast',
                  suggestion: 'Ensure text has a contrast ratio of at least 4.5:1 for normal text',
                  position: { from: context.pos, to: context.pos + node.nodeSize },
                  wcagCriterion: '1.4.3 Contrast (AA)',
                  impact: 'serious'
                }];
              }
            }
          }
          return [];
        }
      },

      // Link text
      {
        id: 'link-text',
        name: 'Descriptive link text',
        description: 'Links should have descriptive text that makes sense out of context',
        wcagCriterion: '2.4.4 Link Purpose (A)',
        level: 'warning',
        autoFixable: false,
        check: (node, context) => {
          if (node.marks) {
            const linkMark = node.marks.find((mark: any) => mark.type.name === 'link');
            if (linkMark && node.textContent) {
              const text = node.textContent.toLowerCase().trim();
              const genericTexts = ['click here', 'read more', 'here', 'link', 'more', 'continue'];
              
              if (genericTexts.includes(text) || text.length < 3) {
                return [{
                  ruleId: 'link-text',
                  level: 'warning',
                  message: 'Link text is not descriptive',
                  suggestion: 'Use descriptive text that indicates where the link leads',
                  position: { from: context.pos, to: context.pos + node.nodeSize },
                  wcagCriterion: '2.4.4 Link Purpose (A)',
                  impact: 'moderate'
                }];
              }
            }
          }
          return [];
        }
      },

      // Empty headings
      {
        id: 'empty-heading',
        name: 'Headings must not be empty',
        description: 'Headings should contain descriptive text',
        wcagCriterion: '1.3.1 Info and Relationships (A)',
        level: 'error',
        autoFixable: true,
        selector: 'heading',
        check: (node, context) => {
          if (node.type.name === 'heading' && !node.textContent.trim()) {
            return [{
              ruleId: 'empty-heading',
              level: 'error',
              message: 'Heading is empty',
              suggestion: 'Add descriptive text to the heading',
              position: { from: context.pos, to: context.pos + node.nodeSize },
              wcagCriterion: '1.3.1 Info and Relationships (A)',
              impact: 'serious',
              autoFix: {
                description: 'Add placeholder heading text',
                apply: (view, issue) => {
                  const tr = view.state.tr.insertText('Heading text needed', issue.position.from + 1);
                  view.dispatch(tr);
                }
              }
            }];
          }
          return [];
        }
      },

      // Table accessibility
      {
        id: 'table-headers',
        name: 'Tables must have headers',
        description: 'Data tables should have proper header cells',
        wcagCriterion: '1.3.1 Info and Relationships (A)',
        level: 'warning',
        autoFixable: false,
        selector: 'table',
        check: (node, context) => {
          if (node.type.name === 'table') {
            const hasHeaders = this.tableHasHeaders(node);
            if (!hasHeaders) {
              return [{
                ruleId: 'table-headers',
                level: 'warning',
                message: 'Table appears to lack proper headers',
                suggestion: 'Use table header cells (th) to identify row and column headers',
                position: { from: context.pos, to: context.pos + node.nodeSize },
                wcagCriterion: '1.3.1 Info and Relationships (A)',
                impact: 'serious'
              }];
            }
          }
          return [];
        }
      },

      // Text spacing
      {
        id: 'text-spacing',
        name: 'Adequate text spacing',
        description: 'Text should have adequate line height and spacing',
        wcagCriterion: '1.4.12 Text Spacing (AA)',
        level: 'info',
        autoFixable: false,
        check: (node, context) => {
          if (node.type.name === 'paragraph' && node.textContent.length > 200) {
            // Check for very long paragraphs that might need better spacing
            return [{
              ruleId: 'text-spacing',
              level: 'info',
              message: 'Long paragraph may benefit from better spacing',
              suggestion: 'Consider breaking into smaller paragraphs or adding line spacing',
              position: { from: context.pos, to: context.pos + node.nodeSize },
              wcagCriterion: '1.4.12 Text Spacing (AA)',
              impact: 'minor'
            }];
          }
          return [];
        }
      }
    ];
  }

  private findPreviousHeading(doc: any, currentPos: number): { level: number } | null {
    let previousHeading: { level: number } | null = null;
    
    doc.descendants((node: any, pos: number) => {
      if (pos >= currentPos) return false; // Stop traversing
      
      if (node.type.name === 'heading') {
        previousHeading = { level: node.attrs.level };
      }
    });
    
    return previousHeading;
  }

  private isLowContrast(color: string): boolean {
    // Simplified contrast check - in production, use a proper color contrast library
    const lightColors = ['#ffffff', '#ffff00', '#00ffff', '#ff00ff', 'white', 'yellow', 'cyan', 'magenta'];
    return lightColors.some(light => color.toLowerCase().includes(light.toLowerCase()));
  }

  private tableHasHeaders(tableNode: any): boolean {
    // Simplified check - look for th elements or header attributes
    let hasHeaders = false;
    
    tableNode.content?.forEach((row: any) => {
      row.content?.forEach((cell: any) => {
        if (cell.type.name === 'table_header' || cell.attrs?.header) {
          hasHeaders = true;
        }
      });
    });
    
    return hasHeaders;
  }

  autoFixIssue(view: EditorView, issue: AccessibilityIssue): boolean {
    if (!issue.autoFix || !this.config.autoFix) {
      return false;
    }

    try {
      issue.autoFix.apply(view, issue);
      return true;
    } catch (error) {
      console.error('Auto-fix failed:', error);
      return false;
    }
  }

  autoFixAllIssues(view: EditorView, issues: AccessibilityIssue[]): number {
    let fixed = 0;
    
    // Sort issues by position (from end to start to avoid position conflicts)
    const sortedIssues = issues
      .filter(issue => issue.autoFix && this.config.autoFix)
      .sort((a, b) => b.position.from - a.position.from);

    sortedIssues.forEach(issue => {
      if (this.autoFixIssue(view, issue)) {
        fixed++;
      }
    });

    return fixed;
  }
}

const accessibilityCheckKey = new PluginKey('accessibilityCheck');

export function accessibilityCheck(config: AccessibilityConfig): Plugin {
  const checker = new AccessibilityChecker(config);
  
  return new Plugin({
    key: accessibilityCheckKey,
    state: {
      init() {
        return {
          checker,
          report: null,
          decorations: DecorationSet.empty
        };
      },
      apply(tr, state) {
        let decorations = state.decorations.map(tr.mapping, tr.doc);
        let report = state.report;

        if (tr.docChanged || !report) {
          // Re-check accessibility
          report = checker.checkDocument(tr.doc);
          
          // Update decorations
          if (config.showInlineIssues) {
            decorations = createAccessibilityDecorations(report.issues, tr.doc);
          }
        }

        return {
          checker,
          report,
          decorations
        };
      }
    },
    props: {
      decorations(state) {
        return config.showInlineIssues ? this.getState(state).decorations : DecorationSet.empty;
      }
    },
    view(editorView) {
      // Create accessibility UI
      const accessibilityUI = createAccessibilityUI(checker, editorView);
      
      return {
        destroy() {
          accessibilityUI.remove();
        }
      };
    }
  });
}

function createAccessibilityDecorations(issues: AccessibilityIssue[], doc: any): DecorationSet {
  const decorations: Decoration[] = [];
  
  issues.forEach(issue => {
    if (issue.level === 'error' || issue.level === 'warning') {
      const className = `accessibility-issue accessibility-${issue.level}`;
      
      const decoration = Decoration.inline(issue.position.from, issue.position.to, {
        class: className,
        title: `${issue.message} (${issue.wcagCriterion})`
      });
      
      decorations.push(decoration);

      // Add indicator widget
      const indicator = Decoration.widget(issue.position.to, () => {
        const span = document.createElement('span');
        span.className = 'accessibility-indicator';
        span.textContent = issue.level === 'error' ? '⚠' : '!';
        span.title = issue.message;
        span.style.cssText = `
          color: ${issue.level === 'error' ? '#dc2626' : '#f59e0b'};
          font-size: 12px;
          margin-left: 2px;
          cursor: help;
        `;
        return span;
      });
      
      decorations.push(indicator);
    }
  });
  
  return DecorationSet.create(doc, decorations);
}

function createAccessibilityUI(checker: AccessibilityChecker, editorView: EditorView): HTMLElement {
  const container = document.createElement('div');
  container.className = 'accessibility-ui';
  container.style.cssText = `
    position: absolute;
    top: 8px;
    right: 160px;
    z-index: 15;
  `;

  const statusButton = document.createElement('button');
  statusButton.className = 'accessibility-status';
  statusButton.textContent = '♿';
  statusButton.title = 'Accessibility check';
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
    showAccessibilityPanel(checker, editorView);
  });

  container.appendChild(statusButton);
  editorView.dom.parentElement?.appendChild(container);

  return container;
}

function showAccessibilityPanel(checker: AccessibilityChecker, editorView: EditorView): void {
  const report = checker.checkDocument(editorView.state.doc);
  
  const panel = document.createElement('div');
  panel.className = 'accessibility-panel';
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
    max-width: 600px;
    max-height: 500px;
    overflow-y: auto;
    z-index: 1000;
  `;

  const scoreColor = report.score >= 80 ? '#16a34a' : report.score >= 60 ? '#f59e0b' : '#dc2626';

  panel.innerHTML = `
    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
      Accessibility Report
    </h3>
    
    <div class="accessibility-summary" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
      <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 600; color: ${scoreColor};">${report.score}</div>
        <div style="font-size: 12px; color: #6b7280;">Accessibility Score</div>
      </div>
      <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 600; color: #dc2626;">${report.errors}</div>
        <div style="font-size: 12px; color: #6b7280;">Errors</div>
      </div>
      <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 600; color: #f59e0b;">${report.warnings}</div>
        <div style="font-size: 12px; color: #6b7280;">Warnings</div>
      </div>
    </div>

    <div class="wcag-compliance" style="margin-bottom: 24px;">
      <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">WCAG Compliance</h4>
      <div style="display: flex; gap: 8px;">
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: ${report.wcagCompliance.A ? '#dcfce7' : '#fee2e2'}; color: ${report.wcagCompliance.A ? '#16a34a' : '#dc2626'};">
          Level A ${report.wcagCompliance.A ? '✓' : '✗'}
        </span>
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: ${report.wcagCompliance.AA ? '#dcfce7' : '#fee2e2'}; color: ${report.wcagCompliance.AA ? '#16a34a' : '#dc2626'};">
          Level AA ${report.wcagCompliance.AA ? '✓' : '✗'}
        </span>
        <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: ${report.wcagCompliance.AAA ? '#dcfce7' : '#fee2e2'}; color: ${report.wcagCompliance.AAA ? '#16a34a' : '#dc2626'};">
          Level AAA ${report.wcagCompliance.AAA ? '✓' : '✗'}
        </span>
      </div>
    </div>

    <div class="accessibility-actions" style="margin-bottom: 16px;">
      <button class="auto-fix-all" style="padding: 8px 16px; border: none; border-radius: 4px; background: #0066cc; color: white; cursor: pointer; margin-right: 8px;">
        Auto-fix Issues
      </button>
      <button class="recheck" style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer;">
        Re-check
      </button>
    </div>

    <div class="accessibility-issues">
      <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Issues (${report.totalIssues})</h4>
      ${report.issues.map(issue => `
        <div class="issue-item" style="padding: 12px; border: 1px solid #e2e8f0; border-radius: 4px; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="color: ${issue.level === 'error' ? '#dc2626' : issue.level === 'warning' ? '#f59e0b' : '#6b7280'}; font-weight: 600; text-transform: uppercase; font-size: 12px;">
              ${issue.level}
            </span>
            <span style="font-weight: 500; font-size: 14px;">${issue.message}</span>
          </div>
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            ${issue.wcagCriterion} • Impact: ${issue.impact}
          </div>
          ${issue.suggestion ? `<div style="font-size: 12px; color: #059669; font-style: italic;">${issue.suggestion}</div>` : ''}
          ${issue.autoFix ? `
            <button class="auto-fix-single" data-issue="${report.issues.indexOf(issue)}" style="margin-top: 8px; padding: 4px 8px; border: 1px solid #0066cc; border-radius: 4px; background: white; color: #0066cc; cursor: pointer; font-size: 12px;">
              ${issue.autoFix.description}
            </button>
          ` : ''}
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
  panel.querySelector('.auto-fix-all')?.addEventListener('click', () => {
    const fixedCount = checker.autoFixAllIssues(editorView, report.issues);
    showNotification(`Fixed ${fixedCount} issues`, 'success');
    closePanel();
  });

  panel.querySelector('.recheck')?.addEventListener('click', () => {
    closePanel();
    setTimeout(() => showAccessibilityPanel(checker, editorView), 100);
  });

  // Handle single issue fixes
  panel.querySelectorAll('.auto-fix-single').forEach(button => {
    button.addEventListener('click', (e) => {
      const issueIndex = parseInt((e.target as HTMLElement).dataset.issue || '0');
      const issue = report.issues[issueIndex];
      if (checker.autoFixIssue(editorView, issue)) {
        showNotification('Issue fixed', 'success');
        (e.target as HTMLElement).disabled = true;
        (e.target as HTMLElement).textContent = 'Fixed ✓';
      }
    });
  });

  function closePanel() {
    backdrop.remove();
    panel.remove();
  }

  backdrop.addEventListener('click', closePanel);
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