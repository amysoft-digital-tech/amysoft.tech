/**
 * Image Upload Plugin for ProseMirror
 * Handles drag & drop, paste, and manual image uploads with optimization
 */

import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Slice, Fragment } from 'prosemirror-model';

interface ImageUploadConfig {
  enabled: boolean;
  maxSize: number;
  allowedTypes: string[];
  uploadUrl: string;
  resizeOptions: ImageResizeOptions;
  optimization: ImageOptimizationOptions;
}

interface ImageResizeOptions {
  enabled: boolean;
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: string;
}

interface ImageOptimizationOptions {
  enabled: boolean;
  progressive: boolean;
  lossless: boolean;
  webp: boolean;
  avif: boolean;
}

interface UploadResult {
  url: string;
  alt: string;
  title?: string;
  width?: number;
  height?: number;
  optimized?: OptimizedImage[];
}

interface OptimizedImage {
  url: string;
  format: string;
  width: number;
  height: number;
  size: number;
}

class ImageUploader {
  private config: ImageUploadConfig;
  private uploadQueue: Map<string, Promise<UploadResult>> = new Map();

  constructor(config: ImageUploadConfig) {
    this.config = config;
  }

  async uploadImage(file: File, progressCallback?: (progress: number) => void): Promise<UploadResult> {
    // Validate file
    this.validateFile(file);

    // Generate unique upload ID
    const uploadId = this.generateUploadId();

    // Create upload promise
    const uploadPromise = this.processUpload(file, uploadId, progressCallback);
    this.uploadQueue.set(uploadId, uploadPromise);

    try {
      const result = await uploadPromise;
      this.uploadQueue.delete(uploadId);
      return result;
    } catch (error) {
      this.uploadQueue.delete(uploadId);
      throw error;
    }
  }

  private validateFile(file: File): void {
    if (!this.config.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${this.config.allowedTypes.join(', ')}`);
    }

    if (file.size > this.config.maxSize) {
      const maxSizeMB = Math.round(this.config.maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      throw new Error(`File size ${fileSizeMB}MB exceeds maximum allowed size of ${maxSizeMB}MB`);
    }
  }

  private async processUpload(file: File, uploadId: string, progressCallback?: (progress: number) => void): Promise<UploadResult> {
    let processedFile = file;

    // Resize image if enabled
    if (this.config.resizeOptions.enabled) {
      processedFile = await this.resizeImage(file);
      progressCallback?.(20);
    }

    // Optimize image if enabled
    if (this.config.optimization.enabled) {
      processedFile = await this.optimizeImage(processedFile);
      progressCallback?.(40);
    }

    // Upload to server
    const result = await this.uploadToServer(processedFile, uploadId, progressCallback);
    progressCallback?.(100);

    return result;
  }

  private async resizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        const { width, height } = this.calculateDimensions(
          img.width,
          img.height,
          this.config.resizeOptions.maxWidth,
          this.config.resizeOptions.maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: this.config.resizeOptions.format === 'webp' ? 'image/webp' : file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          this.config.resizeOptions.format === 'webp' ? 'image/webp' : file.type,
          this.config.resizeOptions.quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private calculateDimensions(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number) {
    let { width, height } = { width: originalWidth, height: originalHeight };

    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  private async optimizeImage(file: File): Promise<File> {
    // For client-side optimization, we can implement basic compression
    // In a real application, this might be handled server-side
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        // Apply optimization settings
        if (this.config.optimization.progressive) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }

        ctx.drawImage(img, 0, 0);

        // Choose optimal format
        let outputFormat = file.type;
        let quality = 0.85;

        if (this.config.optimization.webp && this.supportsWebP()) {
          outputFormat = 'image/webp';
          quality = this.config.optimization.lossless ? 1.0 : 0.8;
        } else if (this.config.optimization.avif && this.supportsAVIF()) {
          outputFormat = 'image/avif';
          quality = this.config.optimization.lossless ? 1.0 : 0.7;
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: outputFormat,
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Failed to optimize image'));
            }
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = URL.createObjectURL(file);
    });
  }

  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  private supportsAVIF(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  }

  private async uploadToServer(file: File, uploadId: string, progressCallback?: (progress: number) => void): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadId', uploadId);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && progressCallback) {
          const progress = Math.round(40 + (event.loaded / event.total) * 60); // 40-100%
          progressCallback(progress);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const result: UploadResult = JSON.parse(xhr.responseText);
            resolve(result);
          } catch (error) {
            reject(new Error('Invalid response from server'));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.ontimeout = () => reject(new Error('Upload timeout'));

      xhr.open('POST', this.config.uploadUrl);
      xhr.timeout = 30000; // 30 second timeout
      xhr.send(formData);
    });
  }

  private generateUploadId(): string {
    return 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  cancelUpload(uploadId: string): void {
    this.uploadQueue.delete(uploadId);
  }

  getPendingUploads(): string[] {
    return Array.from(this.uploadQueue.keys());
  }
}

// Upload progress tracking
class UploadTracker {
  private uploads: Map<string, { progress: number; status: 'uploading' | 'completed' | 'error' }> = new Map();
  private callbacks: ((uploads: Map<string, any>) => void)[] = [];

  addUpload(uploadId: string): void {
    this.uploads.set(uploadId, { progress: 0, status: 'uploading' });
    this.notifyCallbacks();
  }

  updateProgress(uploadId: string, progress: number): void {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.progress = progress;
      this.notifyCallbacks();
    }
  }

  completeUpload(uploadId: string): void {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.status = 'completed';
      upload.progress = 100;
      this.notifyCallbacks();

      // Remove completed upload after 2 seconds
      setTimeout(() => {
        this.uploads.delete(uploadId);
        this.notifyCallbacks();
      }, 2000);
    }
  }

  errorUpload(uploadId: string): void {
    const upload = this.uploads.get(uploadId);
    if (upload) {
      upload.status = 'error';
      this.notifyCallbacks();

      // Remove error upload after 5 seconds
      setTimeout(() => {
        this.uploads.delete(uploadId);
        this.notifyCallbacks();
      }, 5000);
    }
  }

  subscribe(callback: (uploads: Map<string, any>) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback(new Map(this.uploads)));
  }
}

const imageUploadKey = new PluginKey('imageUpload');

export function imageUpload(config: ImageUploadConfig): Plugin {
  const uploader = new ImageUploader(config);
  const tracker = new UploadTracker();

  return new Plugin({
    key: imageUploadKey,
    state: {
      init() {
        return {
          uploader,
          tracker
        };
      },
      apply(tr, state) {
        return state;
      }
    },
    props: {
      handleDOMEvents: {
        drop(view: EditorView, event: DragEvent) {
          if (!config.enabled) return false;

          const files = Array.from(event.dataTransfer?.files || []);
          const imageFiles = files.filter(file => file.type.startsWith('image/'));

          if (imageFiles.length === 0) return false;

          event.preventDefault();
          event.stopPropagation();

          // Get drop position
          const coords = { left: event.clientX, top: event.clientY };
          const pos = view.posAtCoords(coords);

          if (pos) {
            imageFiles.forEach(file => handleImageUpload(view, file, pos.pos, uploader, tracker));
          }

          return true;
        },

        paste(view: EditorView, event: ClipboardEvent) {
          if (!config.enabled) return false;

          const items = Array.from(event.clipboardData?.items || []);
          const imageItems = items.filter(item => item.type.startsWith('image/'));

          if (imageItems.length === 0) return false;

          event.preventDefault();

          imageItems.forEach(item => {
            const file = item.getAsFile();
            if (file) {
              const pos = view.state.selection.head;
              handleImageUpload(view, file, pos, uploader, tracker);
            }
          });

          return true;
        }
      }
    },
    view(editorView) {
      // Create upload progress UI
      const progressContainer = document.createElement('div');
      progressContainer.className = 'upload-progress-container';
      progressContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 300px;
      `;

      document.body.appendChild(progressContainer);

      const unsubscribe = tracker.subscribe((uploads) => {
        updateProgressUI(progressContainer, uploads);
      });

      return {
        destroy() {
          unsubscribe();
          document.body.removeChild(progressContainer);
        }
      };
    }
  });
}

async function handleImageUpload(
  view: EditorView,
  file: File,
  pos: number,
  uploader: ImageUploader,
  tracker: UploadTracker
): Promise<void> {
  const uploadId = 'upload_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  tracker.addUpload(uploadId);

  // Insert placeholder
  const placeholderNode = view.state.schema.nodes.image.create({
    src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
    alt: 'Uploading...',
    title: 'Image uploading...',
    'data-upload-id': uploadId
  });

  const tr = view.state.tr.insert(pos, placeholderNode);
  view.dispatch(tr);

  try {
    const result = await uploader.uploadImage(file, (progress) => {
      tracker.updateProgress(uploadId, progress);
    });

    tracker.completeUpload(uploadId);

    // Replace placeholder with actual image
    const doc = view.state.doc;
    let placeholderPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs['data-upload-id'] === uploadId) {
        placeholderPos = pos;
        return false;
      }
    });

    if (placeholderPos !== null) {
      const imageNode = view.state.schema.nodes.image.create({
        src: result.url,
        alt: result.alt,
        title: result.title,
        width: result.width,
        height: result.height
      });

      const replaceTr = view.state.tr.replaceWith(
        placeholderPos,
        placeholderPos + placeholderNode.nodeSize,
        imageNode
      );

      view.dispatch(replaceTr);
    }
  } catch (error) {
    tracker.errorUpload(uploadId);

    // Remove placeholder on error
    const doc = view.state.doc;
    let placeholderPos: number | null = null;

    doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs['data-upload-id'] === uploadId) {
        placeholderPos = pos;
        return false;
      }
    });

    if (placeholderPos !== null) {
      const errorTr = view.state.tr.delete(placeholderPos, placeholderPos + placeholderNode.nodeSize);
      view.dispatch(errorTr);
    }

    console.error('Image upload failed:', error);
  }
}

function updateProgressUI(container: HTMLElement, uploads: Map<string, any>): void {
  container.innerHTML = '';

  uploads.forEach((upload, uploadId) => {
    const progressElement = document.createElement('div');
    progressElement.className = 'upload-progress-item';
    progressElement.style.cssText = `
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    `;

    const statusColor = upload.status === 'completed' ? '#16a34a' : 
                       upload.status === 'error' ? '#dc2626' : '#0284c7';

    progressElement.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="flex: 1;">
          <div style="font-size: 12px; font-weight: 500; margin-bottom: 4px;">
            ${upload.status === 'completed' ? 'Upload complete' : 
              upload.status === 'error' ? 'Upload failed' : 'Uploading image...'}
          </div>
          <div style="background: #f1f5f9; border-radius: 4px; height: 6px; overflow: hidden;">
            <div style="background: ${statusColor}; height: 100%; width: ${upload.progress}%; transition: width 0.3s ease;"></div>
          </div>
        </div>
        <div style="font-size: 12px; font-weight: 500; color: ${statusColor};">
          ${upload.progress}%
        </div>
      </div>
    `;

    container.appendChild(progressElement);
  });
}