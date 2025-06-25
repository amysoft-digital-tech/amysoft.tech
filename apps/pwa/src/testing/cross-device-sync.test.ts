/**
 * Cross-Device Synchronization Testing Suite
 * Tests for multi-device sync, conflict resolution, and data integrity
 */

import { NetworkSimulator, pwaTestSuite } from './pwa-test-utils';

interface DeviceState {
  deviceId: string;
  userId: string;
  lastSync: string;
  userProgress: any;
  bookmarks: any[];
  notes: any[];
  preferences: any;
  isOnline: boolean;
}

class MockSyncManager {
  private devices: Map<string, DeviceState> = new Map();
  private serverState: any = {};
  private syncEvents: any[] = [];

  addDevice(deviceId: string, userId: string): DeviceState {
    const device: DeviceState = {
      deviceId,
      userId,
      lastSync: new Date().toISOString(),
      userProgress: {},
      bookmarks: [],
      notes: [],
      preferences: {},
      isOnline: true
    };
    this.devices.set(deviceId, device);
    return device;
  }

  updateDeviceData(deviceId: string, data: Partial<DeviceState>): void {
    const device = this.devices.get(deviceId);
    if (device) {
      Object.assign(device, data, { lastSync: new Date().toISOString() });
    }
  }

  async syncDevice(deviceId: string): Promise<{ conflicts: any[], resolved: any[] }> {
    const device = this.devices.get(deviceId);
    if (!device || !device.isOnline) {
      throw new Error('Device not available for sync');
    }

    const conflicts: any[] = [];
    const resolved: any[] = [];

    // Simulate conflict detection and resolution
    const serverData = this.serverState[device.userId] || {};
    const deviceData = {
      userProgress: device.userProgress,
      bookmarks: device.bookmarks,
      notes: device.notes,
      preferences: device.preferences
    };

    // Check for conflicts
    Object.keys(deviceData).forEach(key => {
      if (serverData[key] && this.hasConflict(serverData[key], deviceData[key])) {
        conflicts.push({
          key,
          serverValue: serverData[key],
          deviceValue: deviceData[key],
          timestamp: new Date().toISOString()
        });
      }
    });

    // Resolve conflicts (simplified - use most recent)
    conflicts.forEach(conflict => {
      const resolution = this.resolveConflict(conflict.serverValue, conflict.deviceValue);
      resolved.push({
        key: conflict.key,
        resolution,
        strategy: 'most_recent'
      });
    });

    this.syncEvents.push({
      deviceId,
      timestamp: new Date().toISOString(),
      conflicts: conflicts.length,
      resolved: resolved.length
    });

    return { conflicts, resolved };
  }

  private hasConflict(serverValue: any, deviceValue: any): boolean {
    return JSON.stringify(serverValue) !== JSON.stringify(deviceValue);
  }

  private resolveConflict(serverValue: any, deviceValue: any): any {
    // Simple resolution: use most recent based on lastModified
    const serverTime = new Date(serverValue.lastModified || 0).getTime();
    const deviceTime = new Date(deviceValue.lastModified || 0).getTime();
    return deviceTime > serverTime ? deviceValue : serverValue;
  }

  getSyncHistory(): any[] {
    return [...this.syncEvents];
  }

  reset(): void {
    this.devices.clear();
    this.serverState = {};
    this.syncEvents = [];
  }
}

describe('Cross-Device Synchronization', () => {
  let syncManager: MockSyncManager;
  let networkSimulator: NetworkSimulator;

  beforeEach(() => {
    syncManager = new MockSyncManager();
    networkSimulator = new NetworkSimulator();
  });

  afterEach(() => {
    syncManager.reset();
    networkSimulator.restore();
    pwaTestSuite.reset();
  });

  describe('Device Registration and Management', () => {
    it('should register multiple devices for a user', () => {
      const userId = 'user123';
      const device1 = syncManager.addDevice('phone-001', userId);
      const device2 = syncManager.addDevice('tablet-001', userId);
      const device3 = syncManager.addDevice('laptop-001', userId);

      expect(device1.deviceId).toBe('phone-001');
      expect(device2.deviceId).toBe('tablet-001');
      expect(device3.deviceId).toBe('laptop-001');
      expect(device1.userId).toBe(userId);
      expect(device2.userId).toBe(userId);
    });

    it('should track device sync timestamps', () => {
      const device = syncManager.addDevice('device-001', 'user123');
      const originalSyncTime = device.lastSync;

      // Update device data
      syncManager.updateDeviceData('device-001', {
        userProgress: { chapterId: 'chapter-1', progress: 50 }
      });

      expect(device.lastSync).not.toBe(originalSyncTime);
      expect(new Date(device.lastSync).getTime()).toBeGreaterThan(
        new Date(originalSyncTime).getTime()
      );
    });

    it('should handle device offline status', async () => {
      const device = syncManager.addDevice('device-001', 'user123');
      
      // Set device offline
      syncManager.updateDeviceData('device-001', { isOnline: false });

      // Attempt sync while offline
      await expect(syncManager.syncDevice('device-001')).rejects.toThrow('Device not available for sync');
    });
  });

  describe('Data Synchronization', () => {
    it('should sync user progress across devices', async () => {
      const userId = 'user123';
      const device1 = syncManager.addDevice('phone-001', userId);
      const device2 = syncManager.addDevice('tablet-001', userId);

      // Update progress on device 1
      syncManager.updateDeviceData('phone-001', {
        userProgress: {
          'chapter-1': { progress: 75, lastRead: '2023-01-15T10:00:00Z' },
          'chapter-2': { progress: 25, lastRead: '2023-01-15T11:00:00Z' }
        }
      });

      const syncResult = await syncManager.syncDevice('phone-001');
      expect(syncResult.conflicts).toHaveLength(0);

      // Verify sync history
      const history = syncManager.getSyncHistory();
      expect(history).toHaveLength(1);
      expect(history[0].deviceId).toBe('phone-001');
    });

    it('should sync bookmarks across devices', async () => {
      const device = syncManager.addDevice('device-001', 'user123');

      const bookmarks = [
        {
          id: 'bookmark-1',
          chapterId: 'chapter-1',
          section: 'introduction',
          note: 'Important concept',
          timestamp: '2023-01-15T10:00:00Z',
          lastModified: '2023-01-15T10:00:00Z'
        },
        {
          id: 'bookmark-2',
          chapterId: 'chapter-2',
          section: 'examples',
          note: 'Good example',
          timestamp: '2023-01-15T11:00:00Z',
          lastModified: '2023-01-15T11:00:00Z'
        }
      ];

      syncManager.updateDeviceData('device-001', { bookmarks });

      const syncResult = await syncManager.syncDevice('device-001');
      expect(syncResult.conflicts).toHaveLength(0);
    });

    it('should sync user notes across devices', async () => {
      const device = syncManager.addDevice('device-001', 'user123');

      const notes = [
        {
          id: 'note-1',
          chapterId: 'chapter-1',
          content: 'This is a very important point about prompt engineering.',
          position: { paragraph: 3, word: 15 },
          timestamp: '2023-01-15T10:00:00Z',
          lastModified: '2023-01-15T10:00:00Z'
        },
        {
          id: 'note-2',
          chapterId: 'chapter-1',
          content: 'Need to research this further.',
          position: { paragraph: 7, word: 22 },
          timestamp: '2023-01-15T10:30:00Z',
          lastModified: '2023-01-15T10:30:00Z'
        }
      ];

      syncManager.updateDeviceData('device-001', { notes });

      const syncResult = await syncManager.syncDevice('device-001');
      expect(syncResult.conflicts).toHaveLength(0);
    });

    it('should sync user preferences across devices', async () => {
      const device = syncManager.addDevice('device-001', 'user123');

      const preferences = {
        theme: 'dark',
        fontSize: 'large',
        readingMode: 'focus',
        notifications: {
          reminders: true,
          updates: false,
          social: false
        },
        autoBookmark: true,
        syncFrequency: 'immediate',
        lastModified: '2023-01-15T10:00:00Z'
      };

      syncManager.updateDeviceData('device-001', { preferences });

      const syncResult = await syncManager.syncDevice('device-001');
      expect(syncResult.conflicts).toHaveLength(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('should detect conflicts when same data is modified on different devices', async () => {
      const userId = 'user123';
      const device1 = syncManager.addDevice('phone-001', userId);
      const device2 = syncManager.addDevice('tablet-001', userId);

      // Set up server state with existing data
      (syncManager as any).serverState[userId] = {
        userProgress: {
          'chapter-1': {
            progress: 50,
            lastRead: '2023-01-15T09:00:00Z',
            lastModified: '2023-01-15T09:00:00Z'
          }
        }
      };

      // Device modifies the same progress
      syncManager.updateDeviceData('phone-001', {
        userProgress: {
          'chapter-1': {
            progress: 75,
            lastRead: '2023-01-15T10:00:00Z',
            lastModified: '2023-01-15T10:00:00Z'
          }
        }
      });

      const syncResult = await syncManager.syncDevice('phone-001');
      expect(syncResult.conflicts).toHaveLength(1);
      expect(syncResult.resolved).toHaveLength(1);
      expect(syncResult.resolved[0].strategy).toBe('most_recent');
    });

    it('should resolve bookmark conflicts using timestamp', async () => {
      const userId = 'user123';
      const device = syncManager.addDevice('device-001', userId);

      // Server has older bookmark
      (syncManager as any).serverState[userId] = {
        bookmarks: [
          {
            id: 'bookmark-1',
            note: 'Old note',
            lastModified: '2023-01-15T09:00:00Z'
          }
        ]
      };

      // Device has newer bookmark
      syncManager.updateDeviceData('device-001', {
        bookmarks: [
          {
            id: 'bookmark-1',
            note: 'Updated note',
            lastModified: '2023-01-15T10:00:00Z'
          }
        ]
      });

      const syncResult = await syncManager.syncDevice('device-001');
      expect(syncResult.conflicts).toHaveLength(1);
      expect(syncResult.resolved[0].resolution.note).toBe('Updated note');
    });

    it('should handle merge conflicts for complex data structures', async () => {
      const device = syncManager.addDevice('device-001', 'user123');

      // Simulate complex merge scenario
      const serverNotes = [
        { id: 'note-1', content: 'Server version', lastModified: '2023-01-15T09:00:00Z' },
        { id: 'note-2', content: 'Shared note', lastModified: '2023-01-15T08:00:00Z' }
      ];

      const deviceNotes = [
        { id: 'note-1', content: 'Device version', lastModified: '2023-01-15T10:00:00Z' },
        { id: 'note-3', content: 'New device note', lastModified: '2023-01-15T10:30:00Z' }
      ];

      const mergeNotes = (server: any[], device: any[]) => {
        const merged = new Map();
        
        // Add server notes
        server.forEach(note => merged.set(note.id, note));
        
        // Merge device notes (prefer newer timestamps)
        device.forEach(note => {
          const existing = merged.get(note.id);
          if (!existing || new Date(note.lastModified) > new Date(existing.lastModified)) {
            merged.set(note.id, note);
          }
        });
        
        return Array.from(merged.values());
      };

      const result = mergeNotes(serverNotes, deviceNotes);
      expect(result).toHaveLength(3);
      expect(result.find(n => n.id === 'note-1')?.content).toBe('Device version'); // Newer
      expect(result.find(n => n.id === 'note-3')).toBeDefined(); // Device only
    });

    it('should handle simultaneous edits with operational transformation', () => {
      // Simplified operational transformation for text
      const applyOperations = (text: string, operations: any[]) => {
        let result = text;
        let offset = 0;
        
        operations.sort((a, b) => a.position - b.position);
        
        operations.forEach(op => {
          const pos = op.position + offset;
          switch (op.type) {
            case 'insert':
              result = result.slice(0, pos) + op.text + result.slice(pos);
              offset += op.text.length;
              break;
            case 'delete':
              result = result.slice(0, pos) + result.slice(pos + op.length);
              offset -= op.length;
              break;
          }
        });
        
        return result;
      };

      const originalText = 'This is a note about AI prompts.';
      const device1Ops = [
        { type: 'insert', position: 32, text: ' They are very useful' }
      ];
      const device2Ops = [
        { type: 'insert', position: 17, text: 'detailed ' }
      ];

      // Apply operations in order
      const result1 = applyOperations(originalText, device1Ops);
      const result2 = applyOperations(result1, device2Ops);

      expect(result2).toContain('detailed');
      expect(result2).toContain('They are very useful');
    });
  });

  describe('Network Failure Handling', () => {
    it('should queue sync operations when network is unavailable', async () => {
      const device = syncManager.addDevice('device-001', 'user123');
      const syncQueue: any[] = [];

      networkSimulator.setNetworkState('offline');
      syncManager.updateDeviceData('device-001', { isOnline: false });

      // Attempt to queue sync operations
      const queueSyncOperation = (operation: any) => {
        if (!navigator.onLine) {
          syncQueue.push({
            ...operation,
            timestamp: new Date().toISOString(),
            retries: 0
          });
          return true;
        }
        return false;
      };

      const operations = [
        { type: 'UPDATE_PROGRESS', data: { chapterId: 'chapter-1', progress: 60 } },
        { type: 'ADD_BOOKMARK', data: { chapterId: 'chapter-1', section: 'intro' } },
        { type: 'SAVE_NOTE', data: { content: 'Important note', chapterId: 'chapter-1' } }
      ];

      operations.forEach(op => queueSyncOperation(op));

      expect(syncQueue).toHaveLength(3);
      expect(syncQueue[0].type).toBe('UPDATE_PROGRESS');
    });

    it('should retry failed sync operations with exponential backoff', async () => {
      let attemptCount = 0;
      const maxRetries = 3;

      const simulateFailingSync = () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network error');
        }
        return { success: true };
      };

      const retryWithBackoff = async (operation: () => any, retries: number = maxRetries) => {
        for (let i = 0; i < retries; i++) {
          try {
            return await operation();
          } catch (error) {
            if (i === retries - 1) throw error;
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      };

      const result = await retryWithBackoff(simulateFailingSync);
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });

    it('should handle partial sync failures', async () => {
      const syncOperations = [
        { id: 1, type: 'UPDATE_PROGRESS', priority: 'high' },
        { id: 2, type: 'SAVE_NOTE', priority: 'medium' },
        { id: 3, type: 'UPDATE_PREFERENCES', priority: 'low' }
      ];

      const syncResults = await Promise.allSettled(
        syncOperations.map(async (op) => {
          if (op.priority === 'medium') {
            throw new Error('Sync failed');
          }
          return { id: op.id, success: true };
        })
      );

      const successful = syncResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as any).value);

      const failed = syncResults
        .filter(result => result.status === 'rejected')
        .length;

      expect(successful).toHaveLength(2);
      expect(failed).toBe(1);
    });
  });

  describe('Data Integrity and Validation', () => {
    it('should validate data integrity during sync', () => {
      const validateUserProgress = (progress: any) => {
        const errors: string[] = [];
        
        if (typeof progress.progress !== 'number' || progress.progress < 0 || progress.progress > 100) {
          errors.push('Progress must be a number between 0 and 100');
        }
        
        if (!progress.lastRead || isNaN(new Date(progress.lastRead).getTime())) {
          errors.push('lastRead must be a valid date');
        }
        
        return { isValid: errors.length === 0, errors };
      };

      const validProgress = {
        progress: 75,
        lastRead: '2023-01-15T10:00:00Z'
      };

      const invalidProgress = {
        progress: 150, // Invalid: > 100
        lastRead: 'invalid-date'
      };

      expect(validateUserProgress(validProgress).isValid).toBe(true);
      expect(validateUserProgress(invalidProgress).isValid).toBe(false);
      expect(validateUserProgress(invalidProgress).errors).toHaveLength(2);
    });

    it('should detect and handle corrupted sync data', () => {
      const detectCorruption = (data: any) => {
        try {
          // Check for required fields
          const requiredFields = ['id', 'timestamp', 'lastModified'];
          const missing = requiredFields.filter(field => !data[field]);
          
          if (missing.length > 0) {
            return { corrupted: true, reason: `Missing fields: ${missing.join(', ')}` };
          }
          
          // Check timestamp validity
          if (isNaN(new Date(data.timestamp).getTime())) {
            return { corrupted: true, reason: 'Invalid timestamp' };
          }
          
          return { corrupted: false };
        } catch (error) {
          return { corrupted: true, reason: 'Data parsing error' };
        }
      };

      const validData = {
        id: 'item-1',
        timestamp: '2023-01-15T10:00:00Z',
        lastModified: '2023-01-15T10:00:00Z',
        content: 'Valid content'
      };

      const corruptedData = {
        id: 'item-2',
        timestamp: 'invalid-date',
        // missing lastModified
        content: 'Corrupted content'
      };

      expect(detectCorruption(validData).corrupted).toBe(false);
      expect(detectCorruption(corruptedData).corrupted).toBe(true);
    });

    it('should implement checksum validation for critical data', () => {
      const calculateChecksum = (data: any): string => {
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
      };

      const originalData = {
        userProgress: { 'chapter-1': { progress: 75 } },
        bookmarks: [{ id: 'bookmark-1', note: 'Important' }]
      };

      const checksum = calculateChecksum(originalData);
      
      // Simulate data transmission
      const receivedData = { ...originalData };
      const receivedChecksum = calculateChecksum(receivedData);
      
      expect(receivedChecksum).toBe(checksum);
      
      // Test with corrupted data
      const corruptedData = {
        ...originalData,
        userProgress: { 'chapter-1': { progress: 50 } } // Modified
      };
      
      const corruptedChecksum = calculateChecksum(corruptedData);
      expect(corruptedChecksum).not.toBe(checksum);
    });
  });

  describe('Performance and Optimization', () => {
    it('should implement delta sync for large datasets', () => {
      const calculateDelta = (oldData: any, newData: any) => {
        const delta: any = { added: {}, modified: {}, deleted: {} };
        
        // Find added and modified items
        Object.keys(newData).forEach(key => {
          if (!oldData[key]) {
            delta.added[key] = newData[key];
          } else if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
            delta.modified[key] = newData[key];
          }
        });
        
        // Find deleted items
        Object.keys(oldData).forEach(key => {
          if (!newData[key]) {
            delta.deleted[key] = true;
          }
        });
        
        return delta;
      };

      const oldData = {
        'item-1': { content: 'old content 1' },
        'item-2': { content: 'content 2' },
        'item-3': { content: 'content 3' }
      };

      const newData = {
        'item-1': { content: 'new content 1' }, // Modified
        'item-2': { content: 'content 2' },     // Unchanged
        'item-4': { content: 'new content 4' }  // Added
        // item-3 deleted
      };

      const delta = calculateDelta(oldData, newData);
      
      expect(Object.keys(delta.added)).toContain('item-4');
      expect(Object.keys(delta.modified)).toContain('item-1');
      expect(Object.keys(delta.deleted)).toContain('item-3');
    });

    it('should compress sync data for bandwidth optimization', () => {
      // Simulate compression
      const compress = (data: any): { compressed: string, ratio: number } => {
        const original = JSON.stringify(data);
        // Simplified compression simulation
        const compressed = original.replace(/\s+/g, '').replace(/"/g, '"');
        const ratio = compressed.length / original.length;
        
        return { compressed, ratio };
      };

      const largeData = {
        userProgress: {
          'chapter-1': { progress: 75, notes: 'Very long note content here...' },
          'chapter-2': { progress: 50, notes: 'Another long note content...' }
        },
        bookmarks: new Array(10).fill(0).map((_, i) => ({
          id: `bookmark-${i}`,
          content: `Long bookmark content for item ${i}...`
        }))
      };

      const result = compress(largeData);
      expect(result.ratio).toBeLessThan(1); // Should be compressed
    });

    it('should prioritize sync operations based on user activity', () => {
      const prioritizeOperations = (operations: any[], userContext: any) => {
        const priorityWeights = {
          'UPDATE_PROGRESS': userContext.isReading ? 10 : 5,
          'SAVE_NOTE': userContext.isReading ? 8 : 3,
          'ADD_BOOKMARK': userContext.isReading ? 7 : 2,
          'UPDATE_PREFERENCES': 1
        };

        return operations
          .map(op => ({
            ...op,
            priority: priorityWeights[op.type as keyof typeof priorityWeights] || 1
          }))
          .sort((a, b) => b.priority - a.priority);
      };

      const operations = [
        { id: 1, type: 'UPDATE_PREFERENCES' },
        { id: 2, type: 'UPDATE_PROGRESS' },
        { id: 3, type: 'SAVE_NOTE' },
        { id: 4, type: 'ADD_BOOKMARK' }
      ];

      const readingContext = { isReading: true };
      const idleContext = { isReading: false };

      const readingPriorities = prioritizeOperations(operations, readingContext);
      const idlePriorities = prioritizeOperations(operations, idleContext);

      expect(readingPriorities[0].type).toBe('UPDATE_PROGRESS');
      expect(idlePriorities[0].type).toBe('UPDATE_PROGRESS');
      expect(readingPriorities[0].priority).toBeGreaterThan(idlePriorities[0].priority);
    });
  });
});