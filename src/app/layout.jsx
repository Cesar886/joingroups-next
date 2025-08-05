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
  title: 'JoinGroups Pro',
  description: 'Grupos y clanes en Telegram y más',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
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
