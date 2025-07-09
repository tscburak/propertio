"use client"

import { Page, Layout, Card, Button, Text } from '@shopify/polaris';
import Link from 'next/link';

export default function Home() {
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
      </Layout>
    </Page>
  );
}
