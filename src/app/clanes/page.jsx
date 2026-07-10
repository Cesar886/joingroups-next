import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import ClanesClient from './ClanesClient';

const SITE_URL = 'https://www.joingroups.lat';

export const metadata = {
  title: 'Clanes de Clash Royale y Clash of Clans | Únete o Publica tu Clan Gratis',
  description:
    'Encuentra y únete a los mejores clanes de videojuegos activos: clanes de Clash Royale y Clash of Clans. Publica tu clan gratis para reclutar miembros y conectar con comunidades de jugadores.',
  keywords:
    'clanes de Clash Royale, clanes de Clash of Clans, clanes activos, mejores clanes, unirse a clan, publicar clan, reclutar jugadores, comunidades de jugadores, clanes 2026',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: `${SITE_URL}/clanes`,
  },
  openGraph: {
    title: 'Clanes de Clash Royale y Clash of Clans | JoinGroups',
    description:
      'Encuentra clanes activos de Clash Royale y Clash of Clans, compara y únete o publica tu clan gratis.',
    url: `${SITE_URL}/clanes`,
    siteName: 'JoinGroups',
    images: [
      {
        url: `${SITE_URL}/JoinGroups.webp`,
        width: 1200,
        height: 630,
        alt: 'Directorio de clanes de videojuegos - JoinGroups',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clanes de Clash Royale y Clash of Clans | JoinGroups',
    description:
      'Encuentra clanes activos de Clash Royale y Clash of Clans o publica tu clan gratis.',
    images: [`${SITE_URL}/JoinGroups.webp`],
  },
};

const collectionPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Clanes de Clash Royale y Clash of Clans',
  description:
    'Directorio de clanes activos de Clash Royale y Clash of Clans. Publica tu clan gratis y recluta miembros.',
  url: `${SITE_URL}/clanes`,
  mainEntity: {
    '@type': 'ItemList',
    name: 'Clanes de Clash Royale y Clash of Clans',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: 'Clanes de Clash Royale',
          url: `${SITE_URL}/clanes/clanes-de-clash-royale`,
        },
      },
      {
        '@type': 'ListItem',
        position: 2,
        item: {
          '@type': 'Thing',
          name: 'Clanes de Clash of Clans',
          url: `${SITE_URL}/clanes/clanes-de-clash-of-clans`,
        },
      },
    ],
  },
};

export default async function ClanesPage() {
  const snapshot = await getDocs(collection(db, 'clanes'));
  const groups = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
    };
  });
  const ordered = [...groups.filter(g => g.destacado), ...groups.filter(g => !g.destacado)];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageJsonLd) }}
      />
      <ClanesClient serverData={ordered} />
    </>
  );
}
