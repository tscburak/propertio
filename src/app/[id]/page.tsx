"use client"

import {
  Page,
  Layout,
  Card,
  Text,
  Thumbnail,
  Badge,
  Button,
  LegacyStack,
  Spinner,
  EmptyState,
  Banner,
  Icon
} from '@shopify/polaris';
import { ArrowLeftIcon, ImageIcon, ArrowRightIcon } from '@shopify/polaris-icons';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import { usePropertyTypes } from '@/lib/hooks';

interface Property {
  _id: string;
  title: string;
  type: string;
  price: number;
  description: string;
  images: string[];
  created_at: string | Date;
}

export default function PropertyDetails() {
  const router = useRouter();
  const { propertyTypes } = usePropertyTypes();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  // Get property ID from URL path
  useEffect(() => {
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    if (id && id !== '[id]') {
      setPropertyId(id);
    }
  }, []);

  const fetchProperty = useCallback(async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.getProperty(propertyId);
      
      if (response.success && response.data) {
        setProperty(response.data as unknown as Property);
      } else {
        setError(response.error || 'Failed to load property');
      }
    } catch (err) {
      console.error('Error fetching property:', err);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  // Fetch property when propertyId is available
  useEffect(() => {
    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId, fetchProperty]);



  const getPropertyTypeLabel = useCallback((typeId: string) => {
    const propertyType = propertyTypes.find(type => type._id?.toString() === typeId);
    return propertyType?.label || 'Unknown';
  }, [propertyTypes]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  const handleImageClick = useCallback((index: number) => {
    setSelectedImageIndex(index);
  }, []);

  const handlePreviousImage = useCallback(() => {
    if (property?.images && property.images.length > 0) {
      setSelectedImageIndex(prev => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  }, [property?.images]);

  const handleNextImage = useCallback(() => {
    if (property?.images && property.images.length > 0) {
      setSelectedImageIndex(prev => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  }, [property?.images]);

  if (loading) {
    return (
      <Page
        backAction={{ content: 'Back to Properties', url: '/' }}
        title="Loading Property..."
      >
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <Spinner size="large" />
                <Text variant="bodyMd" as="p" tone="subdued">
                  Loading property details...
                </Text>
              </div>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  if (error || !property) {
    return (
      <Page
        backAction={{ content: 'Back to Properties', url: '/' }}
        title="Property Not Found"
      >
        <Layout>
          <Layout.Section>
            <EmptyState
              heading="Property not found"
              image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
            >
              <p>{error || 'The property you are looking for does not exist.'}</p>
              <Button onClick={() => router.push('/')}>
                Back to Properties
              </Button>
            </EmptyState>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  const selectedImage = property.images && property.images.length > 0 
    ? property.images[selectedImageIndex] 
    : null;

  return (
    <Page
      backAction={{ content: 'Back to Properties', url: '/' }}
      title={property.title}
      primaryAction={{
        content: 'Contact Owner',
        onAction: () => {
          // TODO: Implement contact functionality
          console.log('Contact owner clicked');
        }
      }}
    >
      <Layout>
        {/* Main Image Gallery */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              {selectedImage ? (
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '100%', height: '400px', overflow: 'hidden', borderRadius: '0.5rem' }}>
                    <img
                      src={selectedImage}
                      alt={property.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  
                  {/* Image Navigation */}
                  {property.images && property.images.length > 1 && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0 1rem'
                    }}>
                      <Button
                        icon={ArrowLeftIcon}
                        onClick={handlePreviousImage}
                        variant="primary"
                        size="slim"
                      />
                      <Button
                        icon={ArrowRightIcon}
                        onClick={handleNextImage}
                        variant="primary"
                        size="slim"
                      />
                    </div>
                  )}
                  
                  {/* Image Counter */}
                  {property.images && property.images.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      bottom: '1rem',
                      right: '1rem',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '1rem',
                      fontSize: '0.875rem'
                    }}>
                      {selectedImageIndex + 1} of {property.images.length}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ 
                  height: '400px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f6f6f7',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Icon source={ImageIcon} tone="subdued" />
                    <Text variant="bodyMd" as="p" tone="subdued">
                      No images available
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </Layout.Section>

        {/* Property Information */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <Text variant="headingLg" as="h1" fontWeight="bold">
                  {property.title}
                </Text>
                
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Text variant="headingLg" as="p" fontWeight="bold" tone="success">
                    {formatPrice(property.price)}
                  </Text>
                  <Badge tone="info">
                    {getPropertyTypeLabel(property.type.toString())}
                  </Badge>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <Text variant="bodyMd" as="p" tone="subdued">
                  {property.description}
                </Text>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '1rem 0',
                borderTop: '1px solid #e1e3e5'
              }}>
                <Text variant="bodySm" as="p" tone="subdued">
                  Posted {formatDate(property.created_at)}
                </Text>
                
                {property.images && property.images.length > 0 && (
                  <Text variant="bodySm" as="p" tone="subdued">
                    {property.images.length} image{property.images.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </div>
            </div>
          </Card>
        </Layout.Section>

        {/* Thumbnail Gallery */}
        {property.images && property.images.length > 1 && (
          <Layout.Section>
            <Card>
              <div style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <Text variant="headingMd" as="h3">
                    All Images ({property.images.length})
                  </Text>
                </div>
                
                <LegacyStack spacing="tight">
                  {property.images.map((image, index) => (
                    <div 
                      key={index}
                      onClick={() => handleImageClick(index)}
                      style={{ 
                        cursor: 'pointer',
                        border: index === selectedImageIndex ? '2px solid #007c5e' : '2px solid transparent',
                        borderRadius: '0.5rem',
                        overflow: 'hidden'
                      }}
                    >
                      <Thumbnail
                        size="medium"
                        alt={`${property.title} - Image ${index + 1}`}
                        source={image}
                      />
                    </div>
                  ))}
                </LegacyStack>
              </div>
            </Card>
          </Layout.Section>
        )}

        {/* Contact Information */}
        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <Text variant="headingMd" as="h3">
                  Contact Information
                </Text>
              </div>
              
              <Banner tone="info">
                <p>Interested in this property? Contact the owner for more information.</p>
              </Banner>
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <Button variant="primary" fullWidth>
                  Contact Owner
                </Button>
                <Button variant="secondary" fullWidth>
                  Schedule Viewing
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
} 