/**
 * Collaboration Plugin for ProseMirror
 * Enables real-time collaborative editing with cursor tracking and conflict resolution
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Step } from 'prosemirror-transform';

interface CollaborationConfig {
  enabled: boolean;
  websocketUrl: string;
  documentId: string;
  userId: string;
  userName: string;
  userColor: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval: number;
}

interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: number;
  selection?: { from: number; to: number };
  lastSeen: string;
  online: boolean;
}

interface CollaborationEvent {
  type: 'step' | 'cursor' | 'selection' | 'user-join' | 'user-leave' | 'heartbeat';
  userId: string;
  timestamp: string;
  data: any;
}

interface StepEvent extends CollaborationEvent {
  type: 'step';
  data: {
    step: any;
    version: number;
    clientId: string;
  };
}

interface CursorEvent extends CollaborationEvent {
  type: 'cursor';
  data: {
    position: number;
    visible: boolean;
  };
}

interface SelectionEvent extends CollaborationEvent {
  type: 'selection';
  data: {
    from: number;
    to: number;
  };
}

interface UserEvent extends CollaborationEvent {
  type: 'user-join' | 'user-leave';
  data: {
    user: CollaborationUser;
  };
}

class CollaborationManager {
  private config: CollaborationConfig;
  private websocket: WebSocket | null = null;
  private users = new Map<string, CollaborationUser>();
  private version = 0;
  private unconfirmedSteps: Step[] = [];
  private callbacks: Map<string, ((event: CollaborationEvent) => void)[]> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: CollaborationConfig) {
    this.config = config;
    if (config.enabled) {
      this.connect();
    }
  }

  private connect(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      this.websocket = new WebSocket(this.config.websocketUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.scheduleReconnect();
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.websocket) return;

    this.websocket.onopen = () => {
      console.log('Collaboration WebSocket connected');
      this.clearReconnectTimeout();
      this.startHeartbeat();
      
      // Send join event
      this.send({
        type: 'user-join',
        userId: this.config.userId,
        timestamp: new Date().toISOString(),
        data: {
          user: {
            id: this.config.userId,
            name: this.config.userName,
            color: this.config.userColor,
            lastSeen: new Date().toISOString(),
            online: true
          }
        }
      });
    };

    this.websocket.onmessage = (event) => {
      try {
        const message: CollaborationEvent = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse collaboration message:', error);
      }
    };

    this.websocket.onclose = (event) => {
      console.log('Collaboration WebSocket closed:', event.code, event.reason);
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    this.websocket.onerror = (error) => {
      console.error('Collaboration WebSocket error:', error);
    };
  }

  private handleMessage(event: CollaborationEvent): void {
    // Don't process our own events
    if (event.userId === this.config.userId) {
      return;
    }

    switch (event.type) {
      case 'step':
        this.handleStepEvent(event as StepEvent);
        break;
      case 'cursor':
        this.handleCursorEvent(event as CursorEvent);
        break;
      case 'selection':
        this.handleSelectionEvent(event as SelectionEvent);
        break;
      case 'user-join':
        this.handleUserJoinEvent(event as UserEvent);
        break;
      case 'user-leave':
        this.handleUserLeaveEvent(event as UserEvent);
        break;
      case 'heartbeat':
        this.handleHeartbeatEvent(event);
        break;
    }

    this.notifyCallbacks(event.type, event);
  }

  private handleStepEvent(event: StepEvent): void {
    // Handle operational transformation
    this.emit('step-received', event);
  }

  private handleCursorEvent(event: CursorEvent): void {
    const user = this.users.get(event.userId);
    if (user) {
      user.cursor = event.data.position;
      user.lastSeen = event.timestamp;
      this.emit('cursor-changed', event);
    }
  }

  private handleSelectionEvent(event: SelectionEvent): void {
    const user = this.users.get(event.userId);
    if (user) {
      user.selection = { from: event.data.from, to: event.data.to };
      user.lastSeen = event.timestamp;
      this.emit('selection-changed', event);
    }
  }

  private handleUserJoinEvent(event: UserEvent): void {
    const user = event.data.user;
    this.users.set(user.id, user);
    this.emit('user-joined', event);
  }

  private handleUserLeaveEvent(event: UserEvent): void {
    const user = event.data.user;
    this.users.delete(user.id);
    this.emit('user-left', event);
  }

  private handleHeartbeatEvent(event: CollaborationEvent): void {
    const user = this.users.get(event.userId);
    if (user) {
      user.lastSeen = event.timestamp;
      user.online = true;
    }
  }

  private send(event: CollaborationEvent): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(event));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.config.reconnectDelay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'heartbeat',
        userId: this.config.userId,
        timestamp: new Date().toISOString(),
        data: {}
      });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  sendStep(step: Step, version: number): void {
    const event: StepEvent = {
      type: 'step',
      userId: this.config.userId,
      timestamp: new Date().toISOString(),
      data: {
        step: step.toJSON(),
        version,
        clientId: this.config.userId
      }
    };

    this.send(event);
    this.unconfirmedSteps.push(step);
  }

  sendCursor(position: number, visible = true): void {
    const event: CursorEvent = {
      type: 'cursor',
      userId: this.config.userId,
      timestamp: new Date().toISOString(),
      data: { position, visible }
    };

    this.send(event);
  }

  sendSelection(from: number, to: number): void {
    const event: SelectionEvent = {
      type: 'selection',
      userId: this.config.userId,
      timestamp: new Date().toISOString(),
      data: { from, to }
    };

    this.send(event);
  }

  getUsers(): CollaborationUser[] {
    return Array.from(this.users.values());
  }

  getOnlineUsers(): CollaborationUser[] {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.getUsers().filter(user => 
      user.online && new Date(user.lastSeen) > fiveMinutesAgo
    );
  }

  on(eventType: string, callback: (event: CollaborationEvent) => void): () => void {
    if (!this.callbacks.has(eventType)) {
      this.callbacks.set(eventType, []);
    }
    this.callbacks.get(eventType)!.push(callback);

    return () => {
      const callbacks = this.callbacks.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  private emit(eventType: string, event: CollaborationEvent): void {
    this.notifyCallbacks(eventType, event);
  }

  private notifyCallbacks(eventType: string, event: CollaborationEvent): void {
    const callbacks = this.callbacks.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  disconnect(): void {
    this.clearReconnectTimeout();
    this.stopHeartbeat();
    
    if (this.websocket) {
      // Send leave event
      this.send({
        type: 'user-leave',
        userId: this.config.userId,
        timestamp: new Date().toISOString(),
        data: {
          user: {
            id: this.config.userId,
            name: this.config.userName,
            color: this.config.userColor,
            lastSeen: new Date().toISOString(),
            online: false
          }
        }
      });

      this.websocket.close();
      this.websocket = null;
    }
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }
}

const collaborationKey = new PluginKey('collaboration');

export function collaboration(config: CollaborationConfig): Plugin {
  const manager = new CollaborationManager(config);
  
  return new Plugin({
    key: collaborationKey,
    state: {
      init() {
        return {
          manager,
          decorations: DecorationSet.empty
        };
      },
      apply(tr, state) {
        let decorations = state.decorations.map(tr.mapping, tr.doc);

        // Send steps to other clients
        if (tr.steps.length > 0) {
          tr.steps.forEach(step => {
            manager.sendStep(step, state.manager.version++);
          });
        }

        // Update cursor/selection if changed
        if (tr.selectionSet) {
          const selection = tr.selection;
          if (selection.empty) {
            manager.sendCursor(selection.head);
          } else {
            manager.sendSelection(selection.from, selection.to);
          }
        }

        // Update decorations for other users' cursors and selections
        decorations = updateCollaborationDecorations(decorations, manager, tr.doc);

        return {
          ...state,
          decorations
        };
      }
    },
    props: {
      decorations(state) {
        return this.getState(state).decorations;
      }
    },
    view(editorView) {
      // Create collaboration UI
      const collaborationUI = createCollaborationUI(manager, editorView);
      
      // Set up event listeners
      const unsubscribers = [
        manager.on('user-joined', (event) => {
          updateUserList(collaborationUI.userList, manager);
          showNotification(`${(event as UserEvent).data.user.name} joined`, 'info');
        }),
        manager.on('user-left', (event) => {
          updateUserList(collaborationUI.userList, manager);
          showNotification(`${(event as UserEvent).data.user.name} left`, 'info');
        }),
        manager.on('cursor-changed', () => {
          // Decorations are updated in the state apply function
        }),
        manager.on('selection-changed', () => {
          // Decorations are updated in the state apply function
        })
      ];

      // Initial user list update
      updateUserList(collaborationUI.userList, manager);

      return {
        destroy() {
          unsubscribers.forEach(unsub => unsub());
          collaborationUI.container.remove();
          manager.disconnect();
        }
      };
    }
  });
}

function updateCollaborationDecorations(
  decorations: DecorationSet,
  manager: CollaborationManager,
  doc: any
): DecorationSet {
  const newDecorations: Decoration[] = [];
  const users = manager.getOnlineUsers();

  users.forEach(user => {
    if (user.id === manager.config.userId) return;

    // Add cursor decoration
    if (user.cursor !== undefined && user.cursor >= 0 && user.cursor <= doc.content.size) {
      const cursorDecoration = Decoration.widget(user.cursor, () => {
        const cursor = document.createElement('span');
        cursor.className = 'collaboration-cursor';
        cursor.style.cssText = `
          border-left: 2px solid ${user.color};
          position: absolute;
          height: 1em;
          pointer-events: none;
          z-index: 10;
        `;

        const label = document.createElement('span');
        label.className = 'cursor-label';
        label.textContent = user.name;
        label.style.cssText = `
          position: absolute;
          top: -24px;
          left: -4px;
          padding: 2px 6px;
          background: ${user.color};
          color: white;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
        `;

        cursor.appendChild(label);
        return cursor;
      });

      newDecorations.push(cursorDecoration);
    }

    // Add selection decoration
    if (user.selection && user.selection.from !== user.selection.to) {
      const from = Math.max(0, Math.min(user.selection.from, doc.content.size));
      const to = Math.max(0, Math.min(user.selection.to, doc.content.size));
      
      if (from < to) {
        const selectionDecoration = Decoration.inline(from, to, {
          class: 'collaboration-selection',
          style: `background: ${user.color}33; border-radius: 2px;`
        });

        newDecorations.push(selectionDecoration);
      }
    }
  });

  return DecorationSet.create(doc, newDecorations);
}

function createCollaborationUI(manager: CollaborationManager, editorView: EditorView) {
  const container = document.createElement('div');
  container.className = 'collaboration-ui';
  container.style.cssText = `
    position: absolute;
    top: 8px;
    right: 80px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 15;
  `;

  // Connection status
  const statusIndicator = document.createElement('div');
  statusIndicator.className = 'collaboration-status';
  statusIndicator.style.cssText = `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${manager.isConnected() ? '#16a34a' : '#dc2626'};
    transition: background 0.2s ease;
  `;

  // User list
  const userList = document.createElement('div');
  userList.className = 'collaboration-users';
  userList.style.cssText = `
    display: flex;
    align-items: center;
    gap: 4px;
  `;

  container.appendChild(statusIndicator);
  container.appendChild(userList);

  editorView.dom.parentElement?.appendChild(container);

  // Update connection status
  const updateStatus = () => {
    statusIndicator.style.background = manager.isConnected() ? '#16a34a' : '#dc2626';
    statusIndicator.title = manager.isConnected() ? 'Connected' : 'Disconnected';
  };

  setInterval(updateStatus, 1000);

  return { container, userList, statusIndicator };
}

function updateUserList(userList: HTMLElement, manager: CollaborationManager): void {
  userList.innerHTML = '';
  
  const users = manager.getOnlineUsers();
  const maxVisible = 5;
  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  visibleUsers.forEach(user => {
    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.textContent = user.name.charAt(0).toUpperCase();
    avatar.title = user.name;
    avatar.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: ${user.color};
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `;

    userList.appendChild(avatar);
  });

  if (remainingCount > 0) {
    const moreIndicator = document.createElement('div');
    moreIndicator.className = 'more-users';
    moreIndicator.textContent = `+${remainingCount}`;
    moreIndicator.title = `${remainingCount} more users`;
    moreIndicator.style.cssText = `
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #6b7280;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      border: 2px solid white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `;

    userList.appendChild(moreIndicator);
  }
}

function showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error'): void {
  const notification = document.createElement('div');
  notification.className = 'collaboration-notification';
  notification.textContent = message;
  
  const colors = {
    info: '#0284c7',
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#dc2626'
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
    font-weight: 500;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);

  // Auto remove
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}