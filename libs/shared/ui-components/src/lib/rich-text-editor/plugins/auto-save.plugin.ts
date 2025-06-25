/**
 * Auto-Save Plugin for ProseMirror
 * Automatically saves content changes with conflict detection and recovery
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

interface AutoSaveConfig {
  enabled: boolean;
  interval: number;
  debounceDelay: number;
  conflictResolution: 'merge' | 'overwrite' | 'manual';
  retryAttempts: number;
  retryDelay: number;
}

interface SaveState {
  contentId: string;
  content: any;
  timestamp: string;
  userId: string;
  version: number;
  checksum: string;
}

interface ConflictInfo {
  local: SaveState;
  remote: SaveState;
  conflicts: ConflictDetail[];
}

interface ConflictDetail {
  path: string;
  localValue: any;
  remoteValue: any;
  type: 'content' | 'metadata' | 'structure';
}

interface SaveResult {
  success: boolean;
  version?: number;
  conflicts?: ConflictInfo;
  error?: string;
}

class AutoSaveManager {
  private config: AutoSaveConfig;
  private saveQueue: Map<string, Promise<SaveResult>> = new Map();
  private lastSaved: Map<string, SaveState> = new Map();
  private saveCallbacks: ((result: SaveResult) => void)[] = [];
  private conflictCallbacks: ((conflict: ConflictInfo) => void)[] = [];

  constructor(config: AutoSaveConfig) {
    this.config = config;
  }

  async saveContent(
    contentId: string, 
    content: any, 
    userId: string,
    onProgress?: (progress: number) => void
  ): Promise<SaveResult> {
    if (!this.config.enabled) {
      return { success: false, error: 'Auto-save disabled' };
    }

    // Check if save is already in progress
    const existingSave = this.saveQueue.get(contentId);
    if (existingSave) {
      return existingSave;
    }

    // Create save state
    const saveState: SaveState = {
      contentId,
      content,
      timestamp: new Date().toISOString(),
      userId,
      version: this.getNextVersion(contentId),
      checksum: this.calculateChecksum(content)
    };

    // Create save promise
    const savePromise = this.performSave(saveState, onProgress);
    this.saveQueue.set(contentId, savePromise);

    try {
      const result = await savePromise;
      this.saveQueue.delete(contentId);
      
      if (result.success) {
        this.lastSaved.set(contentId, saveState);
      }

      this.notifySaveCallbacks(result);
      return result;
    } catch (error) {
      this.saveQueue.delete(contentId);
      const result: SaveResult = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
      this.notifySaveCallbacks(result);
      throw error;
    }
  }

  private async performSave(
    saveState: SaveState, 
    onProgress?: (progress: number) => void
  ): Promise<SaveResult> {
    onProgress?.(10);

    // Check for conflicts
    const conflictCheck = await this.checkForConflicts(saveState);
    onProgress?.(30);

    if (conflictCheck.conflicts) {
      this.notifyConflictCallbacks(conflictCheck.conflicts);
      
      if (this.config.conflictResolution === 'manual') {
        return { success: false, conflicts: conflictCheck.conflicts };
      }
      
      if (this.config.conflictResolution === 'merge') {
        const merged = await this.mergeConflicts(conflictCheck.conflicts);
        saveState.content = merged;
        saveState.checksum = this.calculateChecksum(merged);
      }
    }

    onProgress?.(50);

    // Perform save with retry logic
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const result = await this.sendSaveRequest(saveState);
        onProgress?.(100);
        return result;
      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
        onProgress?.(50 + (attempt + 1) * 10);
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  private async checkForConflicts(saveState: SaveState): Promise<{ conflicts?: ConflictInfo }> {
    try {
      const response = await fetch(`/api/content/${saveState.contentId}/conflict-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: saveState.version,
          checksum: saveState.checksum,
          timestamp: saveState.timestamp
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      return {};
    } catch (error) {
      console.warn('Conflict check failed:', error);
      return {};
    }
  }

  private async mergeConflicts(conflictInfo: ConflictInfo): Promise<any> {
    const { local, remote, conflicts } = conflictInfo;
    let merged = { ...local.content };

    for (const conflict of conflicts) {
      switch (conflict.type) {
        case 'content':
          // Use three-way merge for content conflicts
          merged = this.mergeContent(merged, conflict);
          break;
        case 'metadata':
          // Prefer remote metadata updates
          this.setNestedValue(merged, conflict.path, conflict.remoteValue);
          break;
        case 'structure':
          // Use operational transformation for structure changes
          merged = this.mergeStructure(merged, conflict);
          break;
      }
    }

    return merged;
  }

  private mergeContent(content: any, conflict: ConflictDetail): any {
    // Simple merge strategy - could be enhanced with more sophisticated algorithms
    const path = conflict.path.split('.');
    const merged = { ...content };
    
    if (conflict.localValue && conflict.remoteValue) {
      // Attempt to merge text content
      if (typeof conflict.localValue === 'string' && typeof conflict.remoteValue === 'string') {
        const mergedText = this.mergeText(conflict.localValue, conflict.remoteValue);
        this.setNestedValue(merged, conflict.path, mergedText);
      } else {
        // Use remote value for non-text conflicts
        this.setNestedValue(merged, conflict.path, conflict.remoteValue);
      }
    }

    return merged;
  }

  private mergeText(local: string, remote: string): string {
    // Basic text merge - in production, use a more sophisticated algorithm
    if (local === remote) return local;
    
    // Simple line-based merge
    const localLines = local.split('\n');
    const remoteLines = remote.split('\n');
    const merged: string[] = [];

    const maxLines = Math.max(localLines.length, remoteLines.length);
    for (let i = 0; i < maxLines; i++) {
      const localLine = localLines[i] || '';
      const remoteLine = remoteLines[i] || '';
      
      if (localLine === remoteLine) {
        merged.push(localLine);
      } else if (localLine && remoteLine) {
        // Both lines exist but differ - mark conflict
        merged.push(`<<<<<<< LOCAL`);
        merged.push(localLine);
        merged.push('=======');
        merged.push(remoteLine);
        merged.push('>>>>>>> REMOTE');
      } else {
        // One line is empty - use the non-empty one
        merged.push(localLine || remoteLine);
      }
    }

    return merged.join('\n');
  }

  private mergeStructure(content: any, conflict: ConflictDetail): any {
    // Handle structural changes like node insertions, deletions, moves
    // This is a simplified version - real implementation would use operational transformation
    return { ...content, ...conflict.remoteValue };
  }

  private async sendSaveRequest(saveState: SaveState): Promise<SaveResult> {
    const response = await fetch(`/api/content/${saveState.contentId}/autosave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saveState)
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private getNextVersion(contentId: string): number {
    const last = this.lastSaved.get(contentId);
    return last ? last.version + 1 : 1;
  }

  private calculateChecksum(content: any): string {
    // Simple checksum - in production, use a proper hash function
    const str = JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  onSave(callback: (result: SaveResult) => void): () => void {
    this.saveCallbacks.push(callback);
    return () => {
      const index = this.saveCallbacks.indexOf(callback);
      if (index > -1) {
        this.saveCallbacks.splice(index, 1);
      }
    };
  }

  onConflict(callback: (conflict: ConflictInfo) => void): () => void {
    this.conflictCallbacks.push(callback);
    return () => {
      const index = this.conflictCallbacks.indexOf(callback);
      if (index > -1) {
        this.conflictCallbacks.splice(index, 1);
      }
    };
  }

  private notifySaveCallbacks(result: SaveResult): void {
    this.saveCallbacks.forEach(callback => callback(result));
  }

  private notifyConflictCallbacks(conflict: ConflictInfo): void {
    this.conflictCallbacks.forEach(callback => callback(conflict));
  }

  isPending(contentId: string): boolean {
    return this.saveQueue.has(contentId);
  }

  getLastSaved(contentId: string): SaveState | undefined {
    return this.lastSaved.get(contentId);
  }

  cancelSave(contentId: string): void {
    this.saveQueue.delete(contentId);
  }
}

const autoSaveKey = new PluginKey('autoSave');

export function autoSave(config: AutoSaveConfig): Plugin {
  const manager = new AutoSaveManager(config);
  let saveTimeout: NodeJS.Timeout | null = null;
  let lastContent: string | null = null;

  return new Plugin({
    key: autoSaveKey,
    state: {
      init() {
        return {
          manager,
          lastSave: null,
          conflicts: []
        };
      },
      apply(tr, state) {
        return state;
      }
    },
    view(editorView) {
      const statusElement = document.createElement('div');
      statusElement.className = 'autosave-status';
      statusElement.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        padding: 4px 8px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid #e2e8f0;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        z-index: 20;
        transition: all 0.2s ease;
      `;

      editorView.dom.parentElement?.appendChild(statusElement);

      // Auto-save setup
      const handleChange = () => {
        if (!config.enabled) return;

        const currentContent = editorView.state.doc.toString();
        if (currentContent === lastContent) return;

        lastContent = currentContent;

        // Clear existing timeout
        if (saveTimeout) {
          clearTimeout(saveTimeout);
        }

        // Update status
        updateStatus('pending', 'Changes pending...');

        // Schedule save
        saveTimeout = setTimeout(async () => {
          updateStatus('saving', 'Saving...');

          try {
            const result = await manager.saveContent(
              'current-content-id', // Get from context
              {
                doc: editorView.state.doc.toJSON(),
                selection: editorView.state.selection.toJSON()
              },
              'current-user-id', // Get from auth service
              (progress) => {
                updateStatus('saving', `Saving... ${progress}%`);
              }
            );

            if (result.success) {
              updateStatus('saved', 'All changes saved');
              setTimeout(() => updateStatus('idle', ''), 2000);
            } else if (result.conflicts) {
              updateStatus('conflict', 'Conflicts detected');
            } else {
              updateStatus('error', 'Save failed');
            }
          } catch (error) {
            updateStatus('error', 'Save failed');
            console.error('Auto-save error:', error);
          }
        }, config.debounceDelay);
      };

      const updateStatus = (type: string, message: string) => {
        statusElement.textContent = message;
        statusElement.className = `autosave-status ${type}`;

        const colors = {
          idle: '#6b7280',
          pending: '#f59e0b',
          saving: '#0284c7',
          saved: '#16a34a',
          conflict: '#dc2626',
          error: '#dc2626'
        };

        statusElement.style.color = colors[type as keyof typeof colors] || colors.idle;
      };

      // Listen to document changes
      const updateListener = editorView.updateState.bind(editorView);
      editorView.updateState = (state) => {
        updateListener(state);
        handleChange();
      };

      // Set up conflict resolution UI
      const unsubscribeConflict = manager.onConflict((conflict) => {
        showConflictDialog(conflict, editorView);
      });

      updateStatus('idle', '');

      return {
        destroy() {
          if (saveTimeout) {
            clearTimeout(saveTimeout);
          }
          unsubscribeConflict();
          statusElement.remove();
        }
      };
    }
  });
}

function showConflictDialog(conflict: ConflictInfo, editorView: EditorView): void {
  const dialog = document.createElement('div');
  dialog.className = 'conflict-resolution-dialog';
  dialog.style.cssText = `
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
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
  `;

  dialog.innerHTML = `
    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">
      Conflicting Changes Detected
    </h3>
    <p style="margin: 0 0 16px 0; color: #6b7280; line-height: 1.5;">
      Your changes conflict with recent updates. Choose how to resolve:
    </p>
    <div class="conflict-details" style="margin: 16px 0; padding: 16px; background: #f9fafb; border-radius: 4px;">
      <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Conflicts (${conflict.conflicts.length}):</h4>
      ${conflict.conflicts.map(c => `
        <div style="margin: 8px 0; padding: 8px; border-left: 3px solid #f59e0b;">
          <strong>${c.path}:</strong> ${c.type} conflict
        </div>
      `).join('')}
    </div>
    <div class="conflict-actions" style="display: flex; gap: 8px; justify-content: flex-end;">
      <button class="use-remote" style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer;">
        Use Remote Changes
      </button>
      <button class="use-local" style="padding: 8px 16px; border: 1px solid #e2e8f0; border-radius: 4px; background: white; cursor: pointer;">
        Keep Local Changes
      </button>
      <button class="merge-changes" style="padding: 8px 16px; border: none; border-radius: 4px; background: #0066cc; color: white; cursor: pointer;">
        Merge Changes
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
  document.body.appendChild(dialog);

  // Handle actions
  dialog.querySelector('.use-remote')?.addEventListener('click', () => {
    // Apply remote changes
    handleConflictResolution('remote', conflict, editorView);
    closeDialog();
  });

  dialog.querySelector('.use-local')?.addEventListener('click', () => {
    // Keep local changes
    handleConflictResolution('local', conflict, editorView);
    closeDialog();
  });

  dialog.querySelector('.merge-changes')?.addEventListener('click', () => {
    // Attempt automatic merge
    handleConflictResolution('merge', conflict, editorView);
    closeDialog();
  });

  function closeDialog() {
    backdrop.remove();
    dialog.remove();
  }

  // Close on backdrop click
  backdrop.addEventListener('click', closeDialog);
}

function handleConflictResolution(
  strategy: 'local' | 'remote' | 'merge',
  conflict: ConflictInfo,
  editorView: EditorView
): void {
  // Implementation would depend on the specific conflict resolution strategy
  // This is a simplified version
  console.log(`Resolving conflict with strategy: ${strategy}`, conflict);
  
  // In a real implementation, you would:
  // 1. Apply the chosen resolution strategy
  // 2. Update the editor state
  // 3. Save the resolved content
  // 4. Notify the user of the resolution
}