import { useState, useCallback, useRef } from 'react';
import apiClient from '../lib/apiClient';

// Extend File interface to include UUID
interface FileWithUUID extends File {
  uuid: string;
}

export interface UploadStatus {
  id: string;
  filename: string;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
  file?: FileWithUUID; // Store the original file for retry
  propertyId?: string; // Store property ID for retry
}

export function useUploadManager() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadsRef = useRef<UploadStatus[]>([]);
  const maxConcurrentUploads = 3;

  // Update ref when uploads change
  uploadsRef.current = uploads;

  const uploadFiles = useCallback(async (files: FileWithUUID[], propertyId: string) => {
    console.log('=== UPLOAD MANAGER START ===');
    console.log('Files received:', files.map(f => ({ name: f.name, uuid: f.uuid })));
    console.log('Property ID:', propertyId);
    
    // Clear any existing uploads first
    setUploads([]);
    
    // Create initial upload statuses
    const newUploads: UploadStatus[] = files.map(file => ({
      id: file.uuid,
      filename: file.name,
      progress: 0,
      status: 'queued' as const,
      file,
      propertyId,
    }));

    console.log('Created upload statuses:', newUploads.map(u => ({ id: u.id, filename: u.filename, uuid: u.file?.uuid })));
    setUploads(newUploads);
    setIsUploading(true);

    // Create a queue of files to upload
    const fileQueue = [...files.map((file, index) => ({
      file,
      uploadId: newUploads[index].id,
    }))];

    console.log('File queue created:', fileQueue.length, 'files');

    // Process queue with max 3 concurrent uploads
    const processQueue = async () => {
      const activeUploadsSet = new Set<string>();
      
      while (fileQueue.length > 0 || activeUploadsSet.size > 0) {
        console.log('Queue status:', { queueLength: fileQueue.length, activeUploads: activeUploadsSet.size });
        
        // Start new uploads if we have capacity
        while (fileQueue.length > 0 && activeUploadsSet.size < maxConcurrentUploads) {
          const { file, uploadId } = fileQueue.shift()!;
          activeUploadsSet.add(uploadId);
          
          console.log('Starting upload:', { filename: file.name, uploadId, activeCount: activeUploadsSet.size });
          
          // Start upload in background
          uploadSingleFile(file, uploadId, propertyId, activeUploadsSet);
        }
        
        // Wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('All uploads completed');
      setIsUploading(false);
    };

    // Start processing the queue
    processQueue();

    return newUploads.map(upload => upload.id);
  }, []);

  const uploadSingleFile = async (file: FileWithUUID, uploadId: string, propertyId: string, activeUploadsSet: Set<string>) => {
    console.log('Starting upload for file:', { name: file.name, uuid: file.uuid, uploadId });
    
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
      console.log('Calling API for file:', file.name);
      const response = await apiClient.uploadPropertyImages(propertyId, [file]);
      console.log('API response:', response);
      
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
      activeUploadsSet.delete(uploadId);
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

    // Create a new active uploads set for retry
    const activeUploadsSet = new Set<string>();
    activeUploadsSet.add(uploadId);
    
    // Start upload again
    uploadSingleFile(upload.file, uploadId, upload.propertyId, activeUploadsSet);
  }, [uploads]);

  const clearUploads = useCallback(() => {
    setUploads([]);
    setIsUploading(false);
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