import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

interface UploadTask {
  id: string;
  file: File;
  propertyId: string;
  onProgress?: (progress: number) => void;
  onComplete?: (url: string) => void;
  onError?: (error: Error) => void;
}

interface UploadResult {
  id: string;
  url: string;
  filename: string;
}

interface UploadManagerConfig {
  maxConcurrent?: number;
  baseLocation?: string;
}

class UploadManager {
  private queue: UploadTask[] = [];
  private activeUploads: Set<string> = new Set();
  private maxConcurrent: number = 3;
  private baseLocation: string = 'portfolio';
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(config?: UploadManagerConfig) {
    this.bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
    this.region = process.env.CLOUDFLARE_R2_REGION || 'auto';
    
    // Apply configuration
    if (config?.maxConcurrent !== undefined) {
      this.maxConcurrent = Math.max(1, Math.min(10, config.maxConcurrent)); // Limit between 1-10
    }
    if (config?.baseLocation !== undefined) {
      this.baseLocation = config.baseLocation.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
    }
    
    if (!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
      throw new Error('Cloudflare R2 credentials not configured');
    }

    this.s3Client = new S3Client({
      region: this.region,
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Add files to upload queue
   */
  addToQueue(files: File[], propertyId: string, callbacks?: {
    onProgress?: (taskId: string, progress: number) => void;
    onComplete?: (taskId: string, url: string) => void;
    onError?: (taskId: string, error: Error) => void;
  }): string[] {
    const taskIds: string[] = [];

    files.forEach(file => {
      const taskId = uuidv4();
      const task: UploadTask = {
        id: taskId,
        file,
        propertyId,
        onProgress: (progress) => callbacks?.onProgress?.(taskId, progress),
        onComplete: (url) => callbacks?.onComplete?.(taskId, url),
        onError: (error) => callbacks?.onError?.(taskId, error),
      };

      this.queue.push(task);
      taskIds.push(taskId);
    });

    // Start processing if not already running
    this.processQueue();
    
    return taskIds;
  }

  /**
   * Process the upload queue
   */
  private async processQueue() {
    if (this.activeUploads.size >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const availableSlots = this.maxConcurrent - this.activeUploads.size;
    const tasksToProcess = this.queue.splice(0, availableSlots);

    tasksToProcess.forEach(task => {
      this.activeUploads.add(task.id);
      this.uploadFile(task).finally(() => {
        this.activeUploads.delete(task.id);
        // Continue processing queue
        this.processQueue();
      });
    });
  }

  /**
   * Upload a single file to Cloudflare R2
   */
  private async uploadFile(task: UploadTask): Promise<void> {
    try {
      const fileExtension = task.file.name.split('.').pop();
      const filename = `${uuidv4()}.${fileExtension}`;
      const key = `${this.baseLocation}/${task.propertyId}/${filename}`;

      // Simulate progress updates
      let progress = 0;
      const progressInterval = setInterval(() => {
        if (progress < 90) {
          progress += Math.random() * 10;
          task.onProgress?.(progress);
        }
      }, 100);

      // Convert file to buffer
      const arrayBuffer = await task.file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: task.file.type,
        Metadata: {
          originalName: task.file.name,
          propertyId: task.propertyId,
          uploadedAt: new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      clearInterval(progressInterval);
      task.onProgress?.(100);

      // Construct the public URL
      const publicUrl = `https://${process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN}/${key}`;
      
      task.onComplete?.(publicUrl);

    } catch (error) {
      task.onError?.(error as Error);
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeUploads: this.activeUploads.size,
      maxConcurrent: this.maxConcurrent,
      baseLocation: this.baseLocation,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<UploadManagerConfig>) {
    if (config.maxConcurrent !== undefined) {
      this.maxConcurrent = Math.max(1, Math.min(10, config.maxConcurrent));
    }
    if (config.baseLocation !== undefined) {
      this.baseLocation = config.baseLocation.replace(/^\/+|\/+$/g, '');
    }
  }

  /**
   * Clear the queue (useful for cleanup)
   */
  clearQueue() {
    this.queue = [];
  }

  /**
   * Remove a specific task from queue
   */
  removeFromQueue(taskId: string): boolean {
    const index = this.queue.findIndex(task => task.id === taskId);
    if (index > -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Create a singleton instance with default configuration
const uploadManager = new UploadManager();

export default uploadManager;
export type { UploadTask, UploadResult, UploadManagerConfig };
