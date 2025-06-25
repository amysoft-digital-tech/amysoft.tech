/**
 * Code Highlighting Plugin for ProseMirror
 * Provides syntax highlighting for code blocks in educational content
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Node } from 'prosemirror-model';

interface CodeHighlightingConfig {
  enabled: boolean;
  languages: string[];
  theme: string;
  lineNumbers: boolean;
  lineWrapping: boolean;
  foldGutter: boolean;
}

interface HighlightResult {
  html: string;
  language: string;
}

// Language definitions for basic syntax highlighting
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  javascript: [
    /\b(const|let|var|function|class|if|else|for|while|return|import|export|async|await|try|catch|throw|new|this|super|extends|static|private|public|protected)\b/g,
    /\/\/.*$/gm,
    /\/\*[\s\S]*?\*\//g,
    /"([^"\\]|\\.)*"/g,
    /'([^'\\]|\\.)*'/g,
    /`([^`\\]|\\.)*`/g,
    /\b\d+\b/g,
    /[{}[\]()]/g
  ],
  typescript: [
    /\b(const|let|var|function|class|interface|type|enum|namespace|module|if|else|for|while|return|import|export|async|await|try|catch|throw|new|this|super|extends|implements|static|private|public|protected|readonly)\b/g,
    /\/\/.*$/gm,
    /\/\*[\s\S]*?\*\//g,
    /"([^"\\]|\\.)*"/g,
    /'([^'\\]|\\.)*'/g,
    /`([^`\\]|\\.)*`/g,
    /\b\d+\b/g,
    /[{}[\]()]/g,
    /:\s*[A-Z][a-zA-Z0-9<>[\]|&]*\b/g
  ],
  python: [
    /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|async|await|lambda|yield|global|nonlocal|pass|break|continue|and|or|not|in|is|True|False|None)\b/g,
    /#.*$/gm,
    /"""[\s\S]*?"""/g,
    /'''[\s\S]*?'''/g,
    /"([^"\\]|\\.)*"/g,
    /'([^'\\]|\\.)*'/g,
    /\b\d+\b/g,
    /[{}[\]()]/g
  ],
  html: [
    /<\/?[a-zA-Z][a-zA-Z0-9-]*\b[^>]*>/g,
    /<!--[\s\S]*?-->/g,
    /="([^"\\]|\\.)*"/g,
    /='([^'\\]|\\.)*'/g,
    /&[a-zA-Z][a-zA-Z0-9]*;/g
  ],
  css: [
    /\b(color|background|font|margin|padding|border|width|height|display|position|top|left|right|bottom|z-index|opacity|transform|transition|animation)\b/g,
    /\/\*[\s\S]*?\*\//g,
    /#[a-fA-F0-9]{3,6}\b/g,
    /\.[a-zA-Z][a-zA-Z0-9-]*/g,
    /#[a-zA-Z][a-zA-Z0-9-]*/g,
    /:[a-zA-Z][a-zA-Z0-9-]*/g,
    /"([^"\\]|\\.)*"/g,
    /'([^'\\]|\\.)*'/g,
    /\b\d+px\b|\b\d+em\b|\b\d+rem\b|\b\d+%\b/g
  ],
  json: [
    /"([^"\\]|\\.)*"\s*:/g,
    /"([^"\\]|\\.)*"/g,
    /\b(true|false|null)\b/g,
    /\b\d+\b/g,
    /[{}[\],]/g
  ]
};

const TOKEN_CLASSES: Record<string, string> = {
  keyword: 'hljs-keyword',
  comment: 'hljs-comment',
  string: 'hljs-string',
  number: 'hljs-number',
  bracket: 'hljs-punctuation',
  type: 'hljs-type',
  property: 'hljs-property',
  selector: 'hljs-selector',
  pseudo: 'hljs-pseudo',
  color: 'hljs-color',
  literal: 'hljs-literal'
};

class CodeHighlighter {
  private config: CodeHighlightingConfig;

  constructor(config: CodeHighlightingConfig) {
    this.config = config;
  }

  highlight(code: string, language: string): HighlightResult {
    if (!this.config.enabled || !this.config.languages.includes(language)) {
      return { html: this.escapeHtml(code), language };
    }

    const patterns = LANGUAGE_PATTERNS[language];
    if (!patterns) {
      return { html: this.escapeHtml(code), language };
    }

    let highlightedCode = this.escapeHtml(code);

    // Apply syntax highlighting patterns
    if (language === 'javascript' || language === 'typescript') {
      highlightedCode = this.highlightJavaScript(highlightedCode, language === 'typescript');
    } else if (language === 'python') {
      highlightedCode = this.highlightPython(highlightedCode);
    } else if (language === 'html') {
      highlightedCode = this.highlightHTML(highlightedCode);
    } else if (language === 'css') {
      highlightedCode = this.highlightCSS(highlightedCode);
    } else if (language === 'json') {
      highlightedCode = this.highlightJSON(highlightedCode);
    }

    if (this.config.lineNumbers) {
      highlightedCode = this.addLineNumbers(highlightedCode);
    }

    return { html: highlightedCode, language };
  }

  private highlightJavaScript(code: string, isTypeScript = false): string {
    // Keywords
    const keywords = isTypeScript
      ? ['const', 'let', 'var', 'function', 'class', 'interface', 'type', 'enum', 'namespace', 'module', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super', 'extends', 'implements', 'static', 'private', 'public', 'protected', 'readonly']
      : ['const', 'let', 'var', 'function', 'class', 'if', 'else', 'for', 'while', 'return', 'import', 'export', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super', 'extends', 'static', 'private', 'public', 'protected'];

    code = this.highlightKeywords(code, keywords);
    code = this.highlightComments(code);
    code = this.highlightStrings(code);
    code = this.highlightNumbers(code);
    code = this.highlightBrackets(code);

    if (isTypeScript) {
      code = this.highlightTypes(code);
    }

    return code;
  }

  private highlightPython(code: string): string {
    const keywords = ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'async', 'await', 'lambda', 'yield', 'global', 'nonlocal', 'pass', 'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None'];

    code = this.highlightKeywords(code, keywords);
    code = this.highlightPythonComments(code);
    code = this.highlightPythonStrings(code);
    code = this.highlightNumbers(code);
    code = this.highlightBrackets(code);

    return code;
  }

  private highlightHTML(code: string): string {
    // HTML tags
    code = code.replace(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g, (match, tagName) => {
      return `<span class="${TOKEN_CLASSES.keyword}">${match}</span>`;
    });

    // HTML comments
    code = code.replace(/<!--[\s\S]*?-->/g, (match) => {
      return `<span class="${TOKEN_CLASSES.comment}">${match}</span>`;
    });

    // Attributes
    code = code.replace(/(\s)([a-zA-Z-]+)(=)/g, `$1<span class="${TOKEN_CLASSES.property}">$2</span>$3`);

    // Attribute values
    code = code.replace(/="([^"]*)"/g, `="<span class="${TOKEN_CLASSES.string}">$1</span>"`);
    code = code.replace(/'([^']*)'/g, `'<span class="${TOKEN_CLASSES.string}">$1</span>'`);

    return code;
  }

  private highlightCSS(code: string): string {
    // CSS properties
    const properties = ['color', 'background', 'font', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom', 'z-index', 'opacity', 'transform', 'transition', 'animation'];
    code = this.highlightKeywords(code, properties);

    // CSS comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
      return `<span class="${TOKEN_CLASSES.comment}">${match}</span>`;
    });

    // Colors
    code = code.replace(/#[a-fA-F0-9]{3,6}\b/g, (match) => {
      return `<span class="${TOKEN_CLASSES.color}">${match}</span>`;
    });

    // Selectors
    code = code.replace(/\.[a-zA-Z][a-zA-Z0-9-]*/g, (match) => {
      return `<span class="${TOKEN_CLASSES.selector}">${match}</span>`;
    });

    code = code.replace(/#[a-zA-Z][a-zA-Z0-9-]*/g, (match) => {
      return `<span class="${TOKEN_CLASSES.selector}">${match}</span>`;
    });

    // Pseudo selectors
    code = code.replace(/:[a-zA-Z][a-zA-Z0-9-]*/g, (match) => {
      return `<span class="${TOKEN_CLASSES.pseudo}">${match}</span>`;
    });

    // Units
    code = code.replace(/\b\d+px\b|\b\d+em\b|\b\d+rem\b|\b\d+%\b/g, (match) => {
      return `<span class="${TOKEN_CLASSES.number}">${match}</span>`;
    });

    return code;
  }

  private highlightJSON(code: string): string {
    // JSON keys
    code = code.replace(/"([^"\\]|\\.)*"\s*:/g, (match) => {
      const key = match.slice(0, -1);
      return `<span class="${TOKEN_CLASSES.property}">${key}</span>:`;
    });

    // JSON strings
    code = code.replace(/"([^"\\]|\\.)*"/g, (match) => {
      return `<span class="${TOKEN_CLASSES.string}">${match}</span>`;
    });

    // JSON literals
    code = code.replace(/\b(true|false|null)\b/g, (match) => {
      return `<span class="${TOKEN_CLASSES.literal}">${match}</span>`;
    });

    // Numbers
    code = this.highlightNumbers(code);

    // Brackets
    code = this.highlightBrackets(code);

    return code;
  }

  private highlightKeywords(code: string, keywords: string[]): string {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      code = code.replace(regex, `<span class="${TOKEN_CLASSES.keyword}">${keyword}</span>`);
    });
    return code;
  }

  private highlightComments(code: string): string {
    // Single line comments
    code = code.replace(/\/\/.*$/gm, (match) => {
      return `<span class="${TOKEN_CLASSES.comment}">${match}</span>`;
    });

    // Multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
      return `<span class="${TOKEN_CLASSES.comment}">${match}</span>`;
    });

    return code;
  }

  private highlightPythonComments(code: string): string {
    // Python comments
    code = code.replace(/#.*$/gm, (match) => {
      return `<span class="${TOKEN_CLASSES.comment}">${match}</span>`;
    });

    // Python docstrings
    code = code.replace(/"""[\s\S]*?"""/g, (match) => {
      return `<span class="${TOKEN_CLASSES.comment}">${match}</span>`;
    });

    code = code.replace(/'''[\s\S]*?'''/g, (match) => {
      return `<span class="${TOKEN_CLASSES.comment}">${match}</span>`;
    });

    return code;
  }

  private highlightStrings(code: string): string {
    // Double quotes
    code = code.replace(/"([^"\\]|\\.)*"/g, (match) => {
      return `<span class="${TOKEN_CLASSES.string}">${match}</span>`;
    });

    // Single quotes
    code = code.replace(/'([^'\\]|\\.)*'/g, (match) => {
      return `<span class="${TOKEN_CLASSES.string}">${match}</span>`;
    });

    // Template literals
    code = code.replace(/`([^`\\]|\\.)*`/g, (match) => {
      return `<span class="${TOKEN_CLASSES.string}">${match}</span>`;
    });

    return code;
  }

  private highlightPythonStrings(code: string): string {
    // Triple quotes first (to avoid conflicts)
    code = code.replace(/"""[\s\S]*?"""/g, (match) => {
      return `<span class="${TOKEN_CLASSES.string}">${match}</span>`;
    });

    code = code.replace(/'''[\s\S]*?'''/g, (match) => {
      return `<span class="${TOKEN_CLASSES.string}">${match}</span>`;
    });

    // Regular strings
    code = code.replace(/"([^"\\]|\\.)*"/g, (match) => {
      return `<span class="${TOKEN_CLASSES.string}">${match}</span>`;
    });

    code = code.replace(/'([^'\\]|\\.)*'/g, (match) => {
      return `<span class="${TOKEN_CLASSES.string}">${match}</span>`;
    });

    return code;
  }

  private highlightNumbers(code: string): string {
    return code.replace(/\b\d+(\.\d+)?\b/g, (match) => {
      return `<span class="${TOKEN_CLASSES.number}">${match}</span>`;
    });
  }

  private highlightBrackets(code: string): string {
    return code.replace(/[{}[\]()]/g, (match) => {
      return `<span class="${TOKEN_CLASSES.bracket}">${match}</span>`;
    });
  }

  private highlightTypes(code: string): string {
    // TypeScript type annotations
    return code.replace(/:\s*([A-Z][a-zA-Z0-9<>[\]|&]*)\b/g, (match, type) => {
      return `: <span class="${TOKEN_CLASSES.type}">${type}</span>`;
    });
  }

  private addLineNumbers(code: string): string {
    const lines = code.split('\n');
    const numberedLines = lines.map((line, index) => {
      const lineNumber = index + 1;
      return `<span class="line-number" data-line="${lineNumber}">${lineNumber}</span>${line}`;
    });
    return numberedLines.join('\n');
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

const codeHighlightingKey = new PluginKey('codeHighlighting');

export function codeBlockHighlighting(config: CodeHighlightingConfig): Plugin {
  const highlighter = new CodeHighlighter(config);

  return new Plugin({
    key: codeHighlightingKey,
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, decorationSet) {
        decorationSet = decorationSet.map(tr.mapping, tr.doc);

        // Check if document has changed
        if (tr.docChanged) {
          // Find all code blocks and update decorations
          const decorations: Decoration[] = [];

          tr.doc.descendants((node, pos) => {
            if (node.type.name === 'code_block') {
              const language = node.attrs.language || 'text';
              const code = node.textContent;

              if (config.enabled && config.languages.includes(language)) {
                const result = highlighter.highlight(code, language);
                const decoration = Decoration.node(pos, pos + node.nodeSize, {
                  class: `code-block language-${language}`,
                  'data-language': language
                });
                decorations.push(decoration);
              }
            }
          });

          decorationSet = DecorationSet.create(tr.doc, decorations);
        }

        return decorationSet;
      }
    },
    props: {
      decorations(state) {
        return this.getState(state);
      }
    }
  });
}