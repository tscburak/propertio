"use client"

import {
  Banner,
  Button,
  Card,
  DropZone,
  FormLayout,
  Icon,
  Layout,
  LegacyStack,
  Page,
  Select,
  Spinner,
  Text,
  TextField,
  Thumbnail,
  Toast
} from '@shopify/polaris';
import { CheckIcon, DeleteIcon, ImageIcon, NoteIcon, RefreshIcon } from '@shopify/polaris-icons';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { usePropertyTypes } from '@/lib/hooks';
import { useUploadManager } from '@/hooks/useUploadManager';

// Extend File interface to include UUID
interface FileWithUUID extends File {
  uuid: string;
}

export default function Post() {
  const router = useRouter();
  const { propertyTypes, loading: typesLoading } = usePropertyTypes();
  const { uploads, isUploading, uploadFiles, retryUpload, clearUploads } = useUploadManager();
  const [files, setFiles] = useState<FileWithUUID[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    propertyType: '',
    price: '',
    description: ''
  });

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.propertyType) {
      newErrors.propertyType = 'Property type is required';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = 'Price must be a positive number';
      }
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleDropZoneDrop = useCallback(
    (dropFiles: File[]) => {
      const validFiles = dropFiles.filter(file => 
        file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
      );
      
      // Add UUIDs to all valid files
      const filesWithUUIDs: FileWithUUID[] = validFiles.map(file => {
        const uuid = crypto.randomUUID();
        return Object.assign(file, { uuid }) as FileWithUUID;
      });
      
      setFiles((files) => [...files, ...filesWithUUIDs]);
    },
    [],
  );

  const removeFile = useCallback((index: number) => {
    setFiles(files => files.filter((_, i) => i !== index));
  }, []);

    const handleSubmit = useCallback(async () => {

    if (!validateForm()) {
      setToastMessage('Please fix the form errors');
      setToastError(true);
      setShowToast(true);
      return;
    }

    try {
      // Create property first
      const propertyData = {
        title: formData.title.trim(),
        type: formData.propertyType,
        price: parseFloat(formData.price),
        description: formData.description.trim(),
      };

      console.log('Creating property with data:', propertyData);
      const createResponse = await apiClient.createProperty(propertyData);

      if (!createResponse.success) {
        throw new Error(createResponse.error || 'Failed to create property');
      }

      const property = createResponse.data;
      console.log('Property created:', property?._id);

      // Start image uploads if any
      if (files.length > 0 && property && property._id) {
        console.log('Starting upload for', files.length, 'files');
        await uploadFiles(files, property._id.toString());
      }
      
      setToastMessage('Property created successfully! Images are uploading...');
      setToastError(false);
      setShowToast(true);

      // Reset form
      setFormData({
        title: '',
        propertyType: '',
        price: '',
        description: ''
      });
      
    } catch (error) {
      console.error('Error creating property:', error);
      setToastMessage(error instanceof Error ? error.message : 'Failed to create property');
      setToastError(true);
      setShowToast(true);
    }
  }, [formData, files, validateForm, router, uploadFiles, clearUploads]);

  useEffect(() => {
    console.log('Uploads changed:', uploads.map(u => ({ filename: u.filename, status: u.status })));
    
    if(uploads.filter(u => u.status === 'error').length > 0){
      setToastMessage('Some images failed to upload. Please try again.');
      setToastError(true);
      setShowToast(true);
    }else if (files.length && uploads.length && uploads.every(u => u.status === 'completed')){
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  }, [uploads, files.length, clearUploads, router]);

  // Form field change handlers
  const handleTitleChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  }, [errors.title]);

  const handlePropertyTypeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, propertyType: value }));
    if (errors.propertyType) {
      setErrors(prev => ({ ...prev, propertyType: '' }));
    }
  }, [errors.propertyType]);

  const handlePriceChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, price: value }));
    if (errors.price) {
      setErrors(prev => ({ ...prev, price: '' }));
    }
  }, [errors.price]);

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  }, [errors.description]);

  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  const uploadedFiles = (files.length > 0 || uploads.length > 0) && (
    <div style={{ marginTop: '1rem' }}>
      <Text variant="headingMd" as="h3">
        Images ({files.length + uploads.length})
        {isUploading && <span style={{ marginLeft: '0.5rem', color: '#007c5e' }}>• Uploading</span>}
      </Text>
      <LegacyStack vertical spacing="tight">
        {/* Show selected files */}
        {files.map((file, index) => (
          <LegacyStack alignment="center" key={`file-${index}`}>
            <Thumbnail
              size="small"
              alt={file.name}
              source={
                validImageTypes.includes(file.type)
                  ? window.URL.createObjectURL(file)
                  : NoteIcon
              }
            />
            <div style={{ flex: 1 }}>
              <Text variant="bodyMd" as="p">{file.name}</Text>
              <Text variant="bodySm" as="p" tone="subdued">
                {(file.size / 1024 / 1024).toFixed(2)} MB • ID: {file.uuid.slice(0, 8)}...
              </Text>
            </div>
            {(() => {
              const upload = uploads.find(u => u.file?.uuid === file.uuid);
              if (!upload) {
                return <></>
              }
              
              switch (upload.status) {
                case 'queued':
                case 'uploading':
                  return <Spinner size="small"/>;
                case 'completed':
                  return <Icon source={CheckIcon} tone="success" />;
                case 'error':
                  return (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Button
                        icon={RefreshIcon}
                        onClick={() => retryUpload(upload.id)}
                        variant="plain"
                        accessibilityLabel="Retry upload"
                      />
                    </div>
                  );
                default:
                  return <Spinner accessibilityLabel="Spinner example" size="small" />;
              }
            })()}
            <div onClick={(e) => e.stopPropagation()}>
              <Button
                icon={DeleteIcon}
                onClick={() => removeFile(index)}
                variant="plain"
                accessibilityLabel="Remove image"
              />
            </div>
          </LegacyStack>
        ))}
      </LegacyStack>
    </div>
  );

  const uploadMessage = !uploadedFiles && (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <Icon source={ImageIcon} tone="base" />
      <Text variant="bodyMd" as="p" tone="subdued">
        Drop images here or click to browse
      </Text>
      <Text variant="bodySm" as="p" tone="subdued">
        Supports JPG, PNG, WebP up to 10MB each
      </Text>
    </div>
  );

  const propertyTypeOptions = propertyTypes.map(type => ({
    label: type.label,
    value: type._id?.toString() || ''
  }));

  return (
    <Page
      backAction={{ content: 'Home', url: '/' }}
      title={
        isUploading 
          ? `Post New Property • Uploading ${uploads.filter(u => u.status === 'uploading').length}/3`
          : "Post New Property"
      }
      primaryAction={{
        content: isUploading ? 'Saving...' : 'Save Property',
        disabled: isUploading || typesLoading,
        loading: isUploading,
        onAction: handleSubmit
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              <Text variant="headingMd" as="h2">Property Information</Text>
              <FormLayout>
                <TextField
                  label="Property Title"
                  placeholder="e.g., Beautiful 3-bedroom house in downtown"
                  autoComplete="off"
                  value={formData.title}
                  onChange={handleTitleChange}
                  error={errors.title}
                />
                
                <Select
                  label="Property Type"
                  options={propertyTypeOptions}
                  placeholder="Select property type"
                  value={formData.propertyType}
                  onChange={handlePropertyTypeChange}
                  error={errors.propertyType}
                  disabled={typesLoading}
                />

                <TextField
                  label="Price"
                  placeholder="e.g., 500000"
                  type="number"
                  prefix="$"
                  autoComplete="off"
                  value={formData.price}
                  onChange={handlePriceChange}
                  error={errors.price}
                />

                <TextField
                  label="Description"
                  placeholder="Describe your property..."
                  multiline={4}
                  autoComplete="off"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  error={errors.description}
                />
              </FormLayout>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              <Text variant="headingMd" as="h2">Property Images</Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Upload high-quality images of your property. You can upload multiple images at once.
              </Text>
              
              <DropZone 
                dropOnPage={false}
                onDrop={handleDropZoneDrop}
                accept="image/*"
                allowMultiple
                type="image"
              >
                {uploadedFiles}
                {uploadMessage}
              </DropZone>

              {files.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <Banner tone="info">
                    <p>Images will be uploaded 3 at a time. The page will wait for all uploads to complete before redirecting.</p>
                  </Banner>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>

      {showToast && (
        <Toast
          content={toastMessage}
          error={toastError}
          onDismiss={() => setShowToast(false)}
          duration={4000}
        />
      )}
    </Page>
  );
}