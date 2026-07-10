import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import ClashOfClansClient from './ClashOfClansClient';

const SITE_URL = 'https://www.joingroups.lat';
const PAGE_URL = `${SITE_URL}/clanes/clanes-de-clash-of-clans`;

export const metadata = {
  title: 'Clanes de Clash of Clans | Únete o Publica tu Clan Gratis',
  description:
    'Encuentra los mejores clanes de Clash of Clans activos en 2026. Busca por nivel y únete, o publica tu clan GRATIS para reclutar nuevos miembros.',
  keywords:
    'clanes Clash of Clans, clanes CoC activos, reclutar miembros CoC, unirse a clan Clash of Clans, buscar clan Clash of Clans',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Clanes de Clash of Clans | Únete o Publica tu Clan Gratis',
    description:
      'La mejor lista de clanes de CoC. Filtra por tu nivel y encuentra tu comunidad ideal.',
    url: PAGE_URL,
    siteName: 'JoinGroups',
    images: [
      {
        url: `${SITE_URL}/clashOfClansFondo.webp`,
        width: 1200,
        height: 630,
        alt: 'Clanes de Clash of Clans activos en JoinGroups',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clanes de Clash of Clans | Únete o Publica tu Clan Gratis',
    description:
      'Encuentra los mejores clanes de Clash of Clans activos o publica tu clan gratis.',
    images: [`${SITE_URL}/clashOfClansFondo.webp`],
  },
};

function buildCollectionJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Clanes de Clash of Clans',
    description: metadata.description,
    url: PAGE_URL,
    isPartOf: {
      '@type': 'WebSite',
      name: 'JoinGroups',
      url: SITE_URL,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'Clanes', item: `${SITE_URL}/clanes` },
        { '@type': 'ListItem', position: 3, name: 'Clash of Clans', item: PAGE_URL },
      ],
    },
  };
}

export default async function ClashOfClansPage() {
  const snapshot = await getDocs(collection(db, 'clanes'));
  const groups = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
    };
  });
  const coc = groups.filter(g => g.tipo === 'clash-of-clans');
  const ordered = [...coc.filter(g => g.destacado), ...coc.filter(g => !g.destacado)];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildCollectionJsonLd()) }}
      />
      <ClashOfClansClient serverData={ordered} />
    </>
  );
}
