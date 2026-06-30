'use client';

import { MantineProvider } from '@mantine/core';
import { HelmetProvider } from 'react-helmet-async';
import FloatingButton from '@/components/FloatingButton'
import '@/locales/i18n';



export default function RootLayoutClient({ children }) {
  return (
    <HelmetProvider>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          fontFamily: 'var(--font-geist-sans)',
          headings: { fontFamily: 'var(--font-geist-mono)' },
        }}
      >
        {children}
        <FloatingButton />
      </MantineProvider>
    </HelmetProvider>
  );
}

