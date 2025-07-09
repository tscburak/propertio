import { useState, useCallback, useRef } from 'react';
import apiClient from '../lib/apiClient';

export interface UploadStatus {
  id: string;
  filename: string;
  progress: number;
  status: 'queued' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

export function useUploadManager() {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const uploadsRef = useRef<UploadStatus[]>([]);

  // Update ref when uploads change
  uploadsRef.current = uploads;

  const uploadFiles = useCallback(async (files: File[], propertyId: string) => {
    // Create initial upload statuses
    const newUploads: UploadStatus[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      filename: file.name,
      progress: 0,
      status: 'queued' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);
    setIsUploading(true);

    // Upload files using our API
    try {
      const response = await apiClient.uploadPropertyImages(propertyId, files);
      
      if (response.success && response.data?.urls) {
        // Update all uploads to completed
        setUploads(prev => 
          prev.map(upload => 
            newUploads.some(newUpload => newUpload.id === upload.id)
              ? { 
                  ...upload, 
                  progress: 100, 
                  status: 'completed' as const, 
                  url: response.data!.urls[0] // For simplicity, use first URL
                }
              : upload
          )
        );
      } else {
        // Update all uploads to error
        setUploads(prev => 
          prev.map(upload => 
            newUploads.some(newUpload => newUpload.id === upload.id)
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
      // Update all uploads to error
      setUploads(prev => 
        prev.map(upload => 
          newUploads.some(newUpload => newUpload.id === upload.id)
            ? { 
                ...upload, 
                status: 'error' as const, 
                error: error instanceof Error ? error.message : 'Upload failed'
              }
            : upload
        )
      );
    } finally {
      setIsUploading(false);
    }

    return newUploads.map(upload => upload.id);
  }, []);

  const removeUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
    setIsUploading(false);
  }, []);

  const getCompletedUrls = useCallback(() => {
    return uploads
      .filter(upload => upload.status === 'completed' && upload.url)
      .map(upload => upload.url!);
  }, [uploads]);

  return {
    uploads,
    isUploading,
    uploadFiles,
    setUploads,
    removeUpload,
    clearUploads,
    getCompletedUrls,
  };
} 