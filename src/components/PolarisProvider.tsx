"use client"

import { AppProvider, Frame } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";

export default function PolarisProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProvider i18n={{
      Polaris: {
        ResourceList: {
          sortingLabel: 'Sort by',
          defaultItemSingular: 'item',
          defaultItemPlural: 'items',
          showing: 'Showing {itemsCount} {resource}',
          Item: {
            viewItem: 'View details for {itemName}',
          },
        },
      },
    }}>
      <Frame>
        {children}
      </Frame>
    </AppProvider>
  );
} 