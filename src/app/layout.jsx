// src/app/layout.jsx
import '@mantine/core/styles.css';
import { Geist, Geist_Mono } from 'next/font/google';
import '@/app/styles/globals.css';
import RootLayoutClient from './layout-client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClientOnly from '@/components/ClientOnly';


const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://www.joingroups.lat'),
  title: {
    default: 'JoinGroups | Clanes de Clash Royale y comunidades activas',
    template: '%s | JoinGroups',
  },
  description:
    'Directorio para encontrar clanes de Clash Royale, publicar clanes y descubrir comunidades activas de Telegram y WhatsApp.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    siteName: 'JoinGroups',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <ClientOnly>
          <RootLayoutClient>
            <Header />
              {children}
            <Footer />
          </RootLayoutClient>
        </ClientOnly>
      </body>
    </html>
  );
}
