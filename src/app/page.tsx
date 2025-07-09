"use client"

import { 
  Page, 
  Layout, 
  Card, 
  Button, 
  Text, 
  Thumbnail, 
  Badge,
  Spinner,
  EmptyState,
  Pagination
} from '@shopify/polaris';
import { ImageIcon } from '@shopify/polaris-icons';
import Link from 'next/link';
import { useProperties, usePropertyTypes } from '@/lib/hooks';
import { useCallback } from 'react';

export default function Home() {
  const { properties, loading, error, pagination, fetchProperties } = useProperties({
    initialParams: { page: 1, limit: 6 },
    autoFetch: true
  });
  const { propertyTypes } = usePropertyTypes();

  const handlePageChange = useCallback((page: number) => {
    fetchProperties({ page, limit: 6 });
  }, [fetchProperties]);

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
      month: 'short',
      day: 'numeric',
    });
  }, []);

  return (
    <Page title="Propertio - Real Estate Management">
      <Layout>
        <Layout.Section>
          <Card>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Text variant="headingLg" as="h1">
                Welcome to Propertio
              </Text>
              <Text variant="bodyMd" as="p" tone="subdued">
                Your comprehensive real estate management platform
              </Text>
              
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link href="/post">
                  <Button variant="primary" size="large">
                    Post New Property
                  </Button>
                </Link>
                <Button size="large">
                  Browse Properties
                </Button>
              </div>
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Text variant="headingMd" as="h2">
                  Recent Properties
                </Text>
                <Text variant="bodySm" as="p" tone="subdued">
                  {pagination.total} properties found
                </Text>
              </div>

              {loading && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Spinner size="large" />
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Loading properties...
                  </Text>
                </div>
              )}

              {error && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <Text variant="bodyMd" as="p" tone="critical">
                    Error: {error}
                  </Text>
                  <Button onClick={() => fetchProperties({ page: 1, limit: 6 })}>
                    Try Again
                  </Button>
                </div>
              )}

              {!loading && !error && properties.length === 0 && (
                <EmptyState
                  heading="No properties found"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>Get started by posting your first property.</p>
                  <Link href="/post">
                    <Button variant="primary">Post New Property</Button>
                  </Link>
                </EmptyState>
              )}

              {!loading && !error && properties.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                    {properties.map((property) => (
                      <Card key={property._id?.toString() || Math.random().toString()}>
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                          <div style={{ marginBottom: '1rem' }}>
                            <Thumbnail
                              size="large"
                              alt={property.title}
                              source={
                                property.images && property.images.length > 0
                                  ? property.images[0]
                                  : ImageIcon
                              }
                            />
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <Text variant="headingMd" as="h3" fontWeight="bold">
                              {property.title}
                            </Text>
                            
                            <div style={{ marginTop: '0.5rem' }}>
                              <Badge tone="info">
                                {getPropertyTypeLabel(property.type.toString())}
                              </Badge>
                            </div>
                            
                            <div style={{ marginTop: '0.5rem' }}>
                              <Text variant="headingLg" as="p" fontWeight="bold" tone="success">
                                {formatPrice(property.price)}
                              </Text>
                            </div>
                            
                            <div style={{ marginTop: '0.5rem' }}>
                              <Text variant="bodyMd" as="p" tone="subdued">
                                {property.description.length > 100
                                  ? `${property.description.substring(0, 100)}...`
                                  : property.description
                                }
                              </Text>
                            </div>
                            
                            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                          
                          <div style={{ marginTop: '1rem' }}>
                            <Link href={`/${property._id}`}>
                              <Button fullWidth variant="primary">
                                View Details
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {pagination.totalPages > 1 && (
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
                      <Pagination
                        label={`Page ${pagination.page} of ${pagination.totalPages}`}
                        hasPrevious={pagination.page > 1}
                        onPrevious={() => handlePageChange(pagination.page - 1)}
                        hasNext={pagination.page < pagination.totalPages}
                        onNext={() => handlePageChange(pagination.page + 1)}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
