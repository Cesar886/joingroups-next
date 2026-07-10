import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import HomeClient from './HomeClient';

const SITE_URL = 'https://www.joingroups.lat';

export const metadata = {
  title: 'Clanes de Clash Royale y comunidades activas | JoinGroups',
  description:
    'Encuentra clanes de Clash Royale activos, busca clan para unirte o publica tu clan gratis para reclutar miembros. También explora grupos de Telegram y WhatsApp por categoría.',
  keywords:
    'clanes de Clash Royale, buscar clan Clash Royale, publicar clan Clash Royale, reclutar miembros Clash Royale, unirse a clanes activos, grupos de Telegram, grupos de WhatsApp',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  openGraph: {
    title: 'Clanes de Clash Royale y comunidades activas | JoinGroups',
    description:
      'Busca clanes de Clash Royale, publica tu clan para reclutar miembros y descubre comunidades activas en Telegram y WhatsApp.',
    url: `${SITE_URL}/`,
    siteName: 'JoinGroups',
    images: [
      {
        url: `${SITE_URL}/JoinGroups.webp`,
        width: 1200,
        height: 630,
        alt: 'JoinGroups: clanes de Clash Royale y comunidades activas',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clanes de Clash Royale | Buscar o publicar clan',
    description:
      'Encuentra clanes activos de Clash Royale o publica tu clan gratis para reclutar miembros en JoinGroups.',
    images: [`${SITE_URL}/JoinGroups.webp`],
  },
  other: {
    'yandex-verification': '6a0e37aeb6ffa1fa',
  },
};

const homeJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'JoinGroups',
  url: SITE_URL,
  inLanguage: 'es',
  description:
    'Directorio para encontrar clanes de Clash Royale, publicar clanes y descubrir comunidades activas de Telegram y WhatsApp.',
  publisher: {
    '@type': 'Organization',
    name: 'JoinGroups',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/JoinGroups.webp`,
    },
  },
};

export default async function Page() {
  const snapshot = await getDocs(collection(db, 'groups'));
  const grupos = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
    };
  });

  const destacados = grupos.filter((g) => g.destacado);
  const normales = grupos.filter((g) => !g.destacado);
  const serverData = [...destacados, ...normales];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <HomeClient serverData={serverData} />
    </>
  );
}
