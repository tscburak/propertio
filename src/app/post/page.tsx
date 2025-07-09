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
  Thumbnail
} from '@shopify/polaris';
import { DeleteIcon, ImageIcon, NoteIcon } from '@shopify/polaris-icons';
import { useCallback, useState } from 'react';

export default function Post() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    propertyType: '',
    price: '',
    description: ''
  });

  const propertyTypes = [
    { label: 'House', value: 'house' },
    { label: 'Apartment', value: 'apartment' },
    { label: 'Office', value: 'office' },
    { label: 'Land', value: 'land' },
    { label: 'Condo', value: 'condo' },
    { label: 'Townhouse', value: 'townhouse' }
  ];

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
    setIsUploading(true);
    setTimeout(() => setIsUploading(false), 2000);
  }, []);

  // Form field change handlers
  const handleTitleChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
  }, []);

  const handlePropertyTypeChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, propertyType: value }));
  }, []);

  const handlePriceChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, price: value }));
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  }, []);

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

  return (
    <Page
      backAction={{ content: 'Home', url: '/' }}
      title="Post New Property"
      primaryAction={{
        content: isUploading ? 'Saving...' : 'Save Property',
        disabled: isUploading,
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
                />
                
                <Select
                  label="Property Type"
                  options={propertyTypes}
                  placeholder="Select property type"
                  value={formData.propertyType}
                  onChange={handlePropertyTypeChange}
                />

                <TextField
                  label="Price"
                  placeholder="e.g., 500000"
                  type="number"
                  prefix="$"
                  autoComplete="off"
                  value={formData.price}
                  onChange={handlePriceChange}
                />

                <TextField
                  label="Description"
                  placeholder="Describe your property..."
                  multiline={4}
                  autoComplete="off"
                  value={formData.description}
                  onChange={handleDescriptionChange}
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
    </Page>
  );
}