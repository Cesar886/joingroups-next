import '@mantine/core/styles.css';
import { Geist, Geist_Mono } from 'next/font/google';
import { ColorSchemeScript } from '@mantine/core';
import '@/app/styles/globals.css';
import RootLayoutClient from './layout-client';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = {
  title: 'JoinGroups Pro',
  description: 'Grupos y clanes en Telegram y más',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head suppressHydrationWarning={true}>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
