'use client';

import { MantineProvider } from '@mantine/core';

export default function RootLayoutClient({ children }) {
  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        fontFamily: 'var(--font-geist-sans)',
        headings: { fontFamily: 'var(--font-geist-mono)' },
      }}
    >
      {children}
    </MantineProvider>
  );
}
