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
  Text,
  TextField,
  Thumbnail,
  Toast
} from '@shopify/polaris';
import { DeleteIcon, ImageIcon, NoteIcon } from '@shopify/polaris-icons';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { usePropertyTypes } from '@/lib/hooks';

export default function Post() {
  const router = useRouter();
  const { propertyTypes, loading: typesLoading } = usePropertyTypes();
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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
      setFiles((files) => [...files, ...validFiles]);
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

    setIsUploading(true);

    try {
      // Create property first
      const propertyData = {
        title: formData.title.trim(),
        type: formData.propertyType,
        price: parseFloat(formData.price),
        description: formData.description.trim(),
      };

      const createResponse = await apiClient.createProperty(propertyData);

      if (!createResponse.success) {
        throw new Error(createResponse.error || 'Failed to create property');
      }

      const property = createResponse.data;

      // Upload images if any
      if (files.length > 0 && property && property._id) {
        const uploadResponse = await apiClient.uploadPropertyImages(property._id.toString(), files);
        
        if (!uploadResponse.success) {
          console.warn('Failed to upload images:', uploadResponse.error);
          // Don't throw error here as property was created successfully
        }
      }

      setToastMessage('Property created successfully!');
      setToastError(false);
      setShowToast(true);

      // Reset form
      setFormData({
        title: '',
        propertyType: '',
        price: '',
        description: ''
      });
      setFiles([]);
      setErrors({});

      // Redirect to home page after a short delay
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (error) {
      console.error('Error creating property:', error);
      setToastMessage(error instanceof Error ? error.message : 'Failed to create property');
      setToastError(true);
      setShowToast(true);
    } finally {
      setIsUploading(false);
    }
  }, [formData, files, validateForm, router]);

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

  const uploadedFiles = files.length > 0 && (
    <div style={{ marginTop: '1rem' }}>
      <Text variant="headingMd" as="h3">Selected Images ({files.length})</Text>
      <LegacyStack vertical spacing="tight">
        {files.map((file, index) => (
          <LegacyStack alignment="center" key={index}>
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
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </div>
            <Button
              icon={DeleteIcon}
              onClick={() => removeFile(index)}
              variant="plain"
              accessibilityLabel="Remove image"
            />
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
      title="Post New Property"
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
                    <p>Images will be uploaded in the background. You can continue editing while uploads are in progress.</p>
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