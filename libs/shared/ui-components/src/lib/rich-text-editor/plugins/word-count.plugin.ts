/**
 * Word Count Plugin for ProseMirror
 * Provides detailed content statistics and reading time estimation
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

interface WordCountConfig {
  enabled: boolean;
  showInStatusBar: boolean;
  includeSpaces: boolean;
  excludeCodeBlocks: boolean;
  readingSpeed: number; // words per minute
  updateInterval: number; // milliseconds
  showReadingTime: boolean;
  showCharacterCount: boolean;
  showParagraphCount: boolean;
  showEstimatedPages: boolean;
  wordsPerPage: number;
}

interface ContentStatistics {
  words: number;
  characters: number;
  charactersWithSpaces: number;
  paragraphs: number;
  sentences: number;
  readingTime: ReadingTime;
  estimatedPages: number;
  averageWordsPerSentence: number;
  averageSentencesPerParagraph: number;
  readabilityScore: number;
}

interface ReadingTime {
  minutes: number;
  seconds: number;
  formatted: string;
}

interface WordFrequency {
  word: string;
  count: number;
  percentage: number;
}

interface DetailedStatistics extends ContentStatistics {
  longestWord: string;
  averageWordLength: number;
  wordFrequency: WordFrequency[];
  commonWords: WordFrequency[];
  complexSentences: number;
  passiveSentences: number;
  textComplexity: 'simple' | 'moderate' | 'complex' | 'very complex';
}

class ContentAnalyzer {
  private config: WordCountConfig;
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ]);

  constructor(config: WordCountConfig) {
    this.config = config;
  }

  analyzeContent(doc: any): ContentStatistics {
    const text = this.extractText(doc);
    
    if (!text.trim()) {
      return this.getEmptyStatistics();
    }

    const words = this.countWords(text);
    const characters = this.countCharacters(text, false);
    const charactersWithSpaces = this.countCharacters(text, true);
    const paragraphs = this.countParagraphs(doc);
    const sentences = this.countSentences(text);
    const readingTime = this.calculateReadingTime(words);
    const estimatedPages = this.calculateEstimatedPages(words);
    const averageWordsPerSentence = sentences > 0 ? Math.round(words / sentences) : 0;
    const averageSentencesPerParagraph = paragraphs > 0 ? Math.round(sentences / paragraphs) : 0;
    const readabilityScore = this.calculateReadabilityScore(text, words, sentences);

    return {
      words,
      characters,
      charactersWithSpaces,
      paragraphs,
      sentences,
      readingTime,
      estimatedPages,
      averageWordsPerSentence,
      averageSentencesPerParagraph,
      readabilityScore
    };
  }

  analyzeDetailedContent(doc: any): DetailedStatistics {
    const basicStats = this.analyzeContent(doc);
    const text = this.extractText(doc);
    
    if (!text.trim()) {
      return {
        ...basicStats,
        longestWord: '',
        averageWordLength: 0,
        wordFrequency: [],
        commonWords: [],
        complexSentences: 0,
        passiveSentences: 0,
        textComplexity: 'simple'
      };
    }

    const words = this.getWords(text);
    const longestWord = this.findLongestWord(words);
    const averageWordLength = this.calculateAverageWordLength(words);
    const wordFrequency = this.calculateWordFrequency(words);
    const commonWords = this.getCommonWords(wordFrequency);
    const complexSentences = this.countComplexSentences(text);
    const passiveSentences = this.countPassiveSentences(text);
    const textComplexity = this.determineTextComplexity(basicStats.readabilityScore);

    return {
      ...basicStats,
      longestWord,
      averageWordLength,
      wordFrequency,
      commonWords,
      complexSentences,
      passiveSentences,
      textComplexity
    };
  }

  private extractText(doc: any): string {
    let text = '';
    
    doc.descendants((node: any) => {
      if (node.isText) {
        text += node.text;
      } else if (node.type.name === 'paragraph' || node.type.name === 'heading') {
        text += '\n';
      } else if (node.type.name === 'code_block' && this.config.excludeCodeBlocks) {
        // Skip code blocks if configured
        return false;
      } else if (node.type.name === 'hard_break') {
        text += '\n';
      }
    });
    
    return text;
  }

  private countWords(text: string): number {
    if (!text.trim()) return 0;
    
    // Remove extra whitespace and split by word boundaries
    const words = text
      .trim()
      .replace(/\s+/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0 && /\w/.test(word));
    
    return words.length;
  }

  private countCharacters(text: string, includeSpaces: boolean): number {
    if (includeSpaces || this.config.includeSpaces) {
      return text.length;
    }
    return text.replace(/\s/g, '').length;
  }

  private countParagraphs(doc: any): number {
    let count = 0;
    
    doc.descendants((node: any) => {
      if (node.type.name === 'paragraph' && node.content.size > 0) {
        count++;
      }
    });
    
    return count;
  }

  private countSentences(text: string): number {
    if (!text.trim()) return 0;
    
    // Split by sentence-ending punctuation
    const sentences = text
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 0);
    
    return sentences.length;
  }

  private calculateReadingTime(words: number): ReadingTime {
    const totalSeconds = Math.ceil((words / this.config.readingSpeed) * 60);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    let formatted = '';
    if (minutes > 0) {
      formatted = `${minutes}m`;
      if (seconds > 0) {
        formatted += ` ${seconds}s`;
      }
    } else {
      formatted = `${seconds}s`;
    }
    
    return { minutes, seconds, formatted };
  }

  private calculateEstimatedPages(words: number): number {
    return Math.ceil(words / this.config.wordsPerPage);
  }

  private calculateReadabilityScore(text: string, words: number, sentences: number): number {
    if (words === 0 || sentences === 0) return 0;
    
    // Simplified Flesch Reading Ease Score
    const avgSentenceLength = words / sentences;
    const avgSyllablesPerWord = this.estimateAverageSyllables(text);
    
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private estimateAverageSyllables(text: string): number {
    const words = this.getWords(text);
    if (words.length === 0) return 0;
    
    const totalSyllables = words.reduce((sum, word) => sum + this.countSyllables(word), 0);
    return totalSyllables / words.length;
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    
    // Remove ending e
    word = word.replace(/e$/, '');
    
    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g);
    let syllables = vowelGroups ? vowelGroups.length : 0;
    
    // Minimum of 1 syllable
    return Math.max(1, syllables);
  }

  private getWords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  private findLongestWord(words: string[]): string {
    return words.reduce((longest, current) => 
      current.length > longest.length ? current : longest, '');
  }

  private calculateAverageWordLength(words: string[]): number {
    if (words.length === 0) return 0;
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return Math.round((totalLength / words.length) * 10) / 10;
  }

  private calculateWordFrequency(words: string[]): WordFrequency[] {
    const frequency = new Map<string, number>();
    
    words.forEach(word => {
      if (!this.stopWords.has(word) && word.length > 2) {
        frequency.set(word, (frequency.get(word) || 0) + 1);
      }
    });
    
    const totalWords = Array.from(frequency.values()).reduce((sum, count) => sum + count, 0);
    
    return Array.from(frequency.entries())
      .map(([word, count]) => ({
        word,
        count,
        percentage: Math.round((count / totalWords) * 100 * 10) / 10
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }

  private getCommonWords(wordFrequency: WordFrequency[]): WordFrequency[] {
    return wordFrequency.slice(0, 10);
  }

  private countComplexSentences(text: string): number {
    // Count sentences with subordinating conjunctions
    const subordinatingConjunctions = /\b(although|because|since|unless|while|whereas|if|when|where|after|before|until)\b/gi;
    const sentences = text.split(/[.!?]+/);
    
    return sentences.filter(sentence => subordinatingConjunctions.test(sentence)).length;
  }

  private countPassiveSentences(text: string): number {
    // Simple passive voice detection
    const passivePatterns = /\b(is|are|was|were|been|being)\s+\w+ed\b/gi;
    const sentences = text.split(/[.!?]+/);
    
    return sentences.filter(sentence => passivePatterns.test(sentence)).length;
  }

  private determineTextComplexity(readabilityScore: number): 'simple' | 'moderate' | 'complex' | 'very complex' {
    if (readabilityScore >= 80) return 'simple';
    if (readabilityScore >= 60) return 'moderate';
    if (readabilityScore >= 30) return 'complex';
    return 'very complex';
  }

  private getEmptyStatistics(): ContentStatistics {
    return {
      words: 0,
      characters: 0,
      charactersWithSpaces: 0,
      paragraphs: 0,
      sentences: 0,
      readingTime: { minutes: 0, seconds: 0, formatted: '0s' },
      estimatedPages: 0,
      averageWordsPerSentence: 0,
      averageSentencesPerParagraph: 0,
      readabilityScore: 0
    };
  }
}

const wordCountKey = new PluginKey('wordCount');

export function wordCount(config: WordCountConfig): Plugin {
  const analyzer = new ContentAnalyzer(config);
  let updateTimeout: NodeJS.Timeout | null = null;
  
  return new Plugin({
    key: wordCountKey,
    state: {
      init() {
        return {
          analyzer,
          statistics: analyzer.analyzeContent({ descendants: () => {} })
        };
      },
      apply(tr, state) {
        let statistics = state.statistics;
        
        if (tr.docChanged) {
          // Debounce updates for performance
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }
          
          updateTimeout = setTimeout(() => {
            statistics = analyzer.analyzeContent(tr.doc);
            
            // Update status bar if enabled
            if (config.showInStatusBar) {
              updateStatusBar(statistics);
            }
          }, config.updateInterval);
        }
        
        return {
          analyzer,
          statistics
        };
      }
    },
    view(editorView) {
      // Create word count UI
      const wordCountUI = createWordCountUI(analyzer, editorView);
      
      return {
        destroy() {
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }
          wordCountUI.remove();
        }
      };
    }
  });
}

function createWordCountUI(analyzer: ContentAnalyzer, editorView: EditorView): HTMLElement {
  const container = document.createElement('div');
  container.className = 'word-count-ui';
  container.style.cssText = `
    position: absolute;
    top: 8px;
    right: 200px;
    z-index: 15;
  `;

  const statusButton = document.createElement('button');
  statusButton.className = 'word-count-status';
  statusButton.textContent = '📊';
  statusButton.title = 'Content statistics';
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
    showStatisticsPanel(analyzer, editorView);
  });

  container.appendChild(statusButton);
  editorView.dom.parentElement?.appendChild(container);

  return container;
}

function updateStatusBar(statistics: ContentStatistics): void {
  const statusBars = document.querySelectorAll('.editor-status-bar .editor-stats');
  
  statusBars.forEach(statusBar => {
    statusBar.innerHTML = `
      <span class="stat-item">${statistics.words} words</span>
      <span class="stat-separator">•</span>
      <span class="stat-item">${statistics.characters} chars</span>
      <span class="stat-separator">•</span>
      <span class="stat-item">${statistics.readingTime.formatted} read</span>
    `;
  });
}

function showStatisticsPanel(analyzer: ContentAnalyzer, editorView: EditorView): void {
  const detailedStats = analyzer.analyzeDetailedContent(editorView.state.doc);
  
  const panel = document.createElement('div');
  panel.className = 'statistics-panel';
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
    max-width: 700px;
    max-height: 600px;
    overflow-y: auto;
    z-index: 1000;
  `;

  const readabilityColor = detailedStats.readabilityScore >= 60 ? '#16a34a' : 
                          detailedStats.readabilityScore >= 30 ? '#f59e0b' : '#dc2626';

  panel.innerHTML = `
    <h3 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600;">
      Content Statistics
    </h3>
    
    <div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
      <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 600; color: #0066cc;">${detailedStats.words}</div>
        <div style="font-size: 12px; color: #6b7280;">Words</div>
      </div>
      <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 600; color: #0066cc;">${detailedStats.characters}</div>
        <div style="font-size: 12px; color: #6b7280;">Characters</div>
      </div>
      <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 600; color: #0066cc;">${detailedStats.paragraphs}</div>
        <div style="font-size: 12px; color: #6b7280;">Paragraphs</div>
      </div>
      <div style="text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 600; color: #0066cc;">${detailedStats.sentences}</div>
        <div style="font-size: 12px; color: #6b7280;">Sentences</div>
      </div>
    </div>

    <div class="reading-info" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;">
      <div style="text-align: center; padding: 16px; background: #f0f9ff; border-radius: 8px;">
        <div style="font-size: 20px; font-weight: 600; color: #0284c7;">${detailedStats.readingTime.formatted}</div>
        <div style="font-size: 12px; color: #0284c7;">Reading Time</div>
      </div>
      <div style="text-align: center; padding: 16px; background: #f0f9ff; border-radius: 8px;">
        <div style="font-size: 20px; font-weight: 600; color: #0284c7;">${detailedStats.estimatedPages}</div>
        <div style="font-size: 12px; color: #0284c7;">Estimated Pages</div>
      </div>
      <div style="text-align: center; padding: 16px; background: #f0f9ff; border-radius: 8px;">
        <div style="font-size: 20px; font-weight: 600; color: ${readabilityColor};">${detailedStats.readabilityScore}</div>
        <div style="font-size: 12px; color: ${readabilityColor};">Readability Score</div>
      </div>
    </div>

    <div class="detailed-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
      <div>
        <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Writing Metrics</h4>
        <div style="space-y: 8px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-size: 13px; color: #6b7280;">Avg. words per sentence</span>
            <span style="font-size: 13px; font-weight: 500;">${detailedStats.averageWordsPerSentence}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-size: 13px; color: #6b7280;">Avg. sentences per paragraph</span>
            <span style="font-size: 13px; font-weight: 500;">${detailedStats.averageSentencesPerParagraph}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-size: 13px; color: #6b7280;">Avg. word length</span>
            <span style="font-size: 13px; font-weight: 500;">${detailedStats.averageWordLength} chars</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-size: 13px; color: #6b7280;">Longest word</span>
            <span style="font-size: 13px; font-weight: 500;">${detailedStats.longestWord}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6;">
            <span style="font-size: 13px; color: #6b7280;">Text complexity</span>
            <span style="font-size: 13px; font-weight: 500; text-transform: capitalize;">${detailedStats.textComplexity}</span>
          </div>
        </div>
      </div>

      <div>
        <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Common Words</h4>
        <div style="max-height: 200px; overflow-y: auto;">
          ${detailedStats.commonWords.map(word => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0;">
              <span style="font-size: 13px;">${word.word}</span>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 60px; height: 4px; background: #f3f4f6; border-radius: 2px; overflow: hidden;">
                  <div style="height: 100%; background: #0066cc; width: ${word.percentage}%;"></div>
                </div>
                <span style="font-size: 12px; color: #6b7280; min-width: 30px;">${word.count}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="export-actions" style="margin-top: 24px; text-align: center;">
      <button class="export-stats" style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: #0066cc; color: white; cursor: pointer; margin-right: 8px;">
        Export Statistics
      </button>
      <button class="close-panel" style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer;">
        Close
      </button>
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
  panel.querySelector('.export-stats')?.addEventListener('click', () => {
    exportStatistics(detailedStats);
  });

  panel.querySelector('.close-panel')?.addEventListener('click', closePanel);

  function closePanel() {
    backdrop.remove();
    panel.remove();
  }

  backdrop.addEventListener('click', closePanel);
}

function exportStatistics(stats: DetailedStatistics): void {
  const data = {
    timestamp: new Date().toISOString(),
    statistics: stats
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `content-statistics-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
  
  showNotification('Statistics exported', 'success');
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