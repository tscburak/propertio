import { useState, useCallback, useRef } from 'react';
import apiClient from '../lib/apiClient';

export interface UploadStatus {
  id: string;
  filename: string;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
  file?: File; // Store the original file for retry
  propertyId?: string; // Store property ID for retry
}

export function useUploadManager() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadsRef = useRef<UploadStatus[]>([]);
  const [activeUploads, setActiveUploads] = useState<Set<string>>(new Set());
  const maxConcurrentUploads = 3;

  // Update ref when uploads change
  uploadsRef.current = uploads;

  const uploadFiles = useCallback(async (files: File[], propertyId: string) => {
    // Create initial upload statuses
    const newUploads: UploadStatus[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      filename: file.name,
      progress: 0,
      status: 'queued' as const,
      file,
      propertyId,
    }));

    setUploads(prev => [...prev, ...newUploads]);
    setIsUploading(true);

    // Create a queue of files to upload
    const fileQueue = files.map((file, index) => ({
      file,
      uploadId: newUploads[index].id,
    }));

    // Process queue with max 3 concurrent uploads
    const processQueue = async () => {
      while (fileQueue.length > 0 || activeUploads.size > 0) {
        // Start new uploads if we have capacity
        while (fileQueue.length > 0 && activeUploads.size < maxConcurrentUploads) {
          const { file, uploadId } = fileQueue.shift()!;
          activeUploads.add(uploadId);
          
          // Start upload in background
          uploadSingleFile(file, uploadId, propertyId);
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setIsUploading(false);
    };

    // Start processing the queue
    processQueue();

    return newUploads.map(upload => upload.id);
  }, [activeUploads]);

  const uploadSingleFile = async (file: File, uploadId: string, propertyId: string) => {
    try {
      // Update status to uploading
      setUploads(prev => 
        prev.map(upload => 
          upload.id === uploadId
            ? { ...upload, status: 'uploading' as const, progress: 10 }
            : upload
        )
      );

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId && upload.status === 'uploading'
              ? { ...upload, progress: Math.min(upload.progress + 10, 90) }
              : upload
          )
        );
      }, 200);

      // Upload single file
      const response = await apiClient.uploadPropertyImages(propertyId, [file]);
      
      clearInterval(progressInterval);

      if (response.success && response.data?.urls) {
        // Update to completed
        setUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId
              ? { 
                  ...upload, 
                  progress: 100, 
                  status: 'completed' as const, 
                  url: response.data!.urls[0]
                }
              : upload
          )
        );
      } else {
        // Update to error
        setUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId
              ? { 
                  ...upload, 
                  status: 'error' as const, 
                  error: response.error || 'Upload failed'
                }
              : upload
          )
        );
      }
    } catch (error) {
      // Update to error
      setUploads(prev => 
        prev.map(upload => 
          upload.id === uploadId
            ? { 
                ...upload, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : upload
        )
      );
    } finally {
      // Remove from active uploads
      setActiveUploads(prev => {
        const newSet = new Set(prev);
        newSet.delete(uploadId);
        return newSet;
      });
    }
  };

  const removeUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  const retryUpload = useCallback(async (uploadId: string) => {
    const upload = uploads.find(u => u.id === uploadId);
    if (!upload || upload.status !== 'error' || !upload.file || !upload.propertyId) return;

    // Reset upload status
    setUploads(prev => 
      prev.map(upload => 
        upload.id === uploadId
          ? { ...upload, status: 'queued' as const, progress: 0, error: undefined }
          : upload
      )
    );

    // Start upload again
    uploadSingleFile(upload.file, uploadId, upload.propertyId);
  }, [uploads]);

  const clearUploads = useCallback(() => {
    setUploads([]);
    setIsUploading(false);
    setActiveUploads(new Set());
  }, []);

  const getCompletedUrls = useCallback(() => {
    return uploads
      .filter(upload => upload.status === 'completed' && upload.url)
      .map(upload => upload.url!);
  }, [uploads]);

  const isAllUploadsComplete = useCallback(() => {
    return uploads.length > 0 && uploads.every(upload => 
      upload.status === 'completed' || upload.status === 'error'
    );
  }, [uploads]);

  return {
    uploads,
    isUploading,
    uploadFiles,
    removeUpload,
    retryUpload,
    clearUploads,
    getCompletedUrls,
    isAllUploadsComplete,
  };
} 