import { useState, useCallback, useRef } from 'react';
import uploadManager from '../lib/uploadManager';

interface UploadStatus {
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

  const uploadFiles = useCallback((files: File[], propertyId: string) => {
    // Create initial upload statuses
    const newUploads: UploadStatus[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      filename: file.name,
      progress: 0,
      status: 'queued' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);
    setIsUploading(true);

    // Add to upload manager queue
    const taskIds = uploadManager.addToQueue(files, propertyId, {
      onProgress: (taskId, progress) => {
        setUploads(prev => 
          prev.map(upload => 
            upload.id === taskId 
              ? { ...upload, progress, status: 'uploading' as const }
              : upload
          )
        );
      },
      onComplete: (taskId, url) => {
        setUploads(prev => 
          prev.map(upload => 
            upload.id === taskId 
              ? { ...upload, progress: 100, status: 'completed' as const, url }
              : upload
          )
        );

        // Check if all uploads are complete
        const updatedUploads = uploadsRef.current.map(upload => 
          upload.id === taskId 
            ? { ...upload, progress: 100, status: 'completed' as const, url }
            : upload
        );

        if (updatedUploads.every(upload => upload.status === 'completed' || upload.status === 'error')) {
          setIsUploading(false);
        }
      },
      onError: (taskId, error) => {
        setUploads(prev => 
          prev.map(upload => 
            upload.id === taskId 
              ? { ...upload, status: 'error' as const, error: error.message }
              : upload
          )
        );

        // Check if all uploads are complete
        const updatedUploads = uploadsRef.current.map(upload => 
          upload.id === taskId 
            ? { ...upload, status: 'error' as const, error: error.message }
            : upload
        );

        if (updatedUploads.every(upload => upload.status === 'completed' || upload.status === 'error')) {
          setIsUploading(false);
        }
      },
    });

    return taskIds;
  }, []);

  const removeUpload = useCallback((uploadId: string) => {
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
    uploadManager.removeFromQueue(uploadId);
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
    uploadManager.clearQueue();
    setIsUploading(false);
  }, []);

  const getCompletedUrls = useCallback(() => {
    return uploads
      .filter(upload => upload.status === 'completed' && upload.url)
      .map(upload => upload.url!);
  }, [uploads]);

  const getUploadStatus = useCallback(() => {
    return uploadManager.getStatus();
  }, []);

  return {
    uploads,
    isUploading,
    uploadFiles,
    removeUpload,
    clearUploads,
    getCompletedUrls,
    getUploadStatus,
  };
} 