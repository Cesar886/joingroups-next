import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import ClashRoyaleClient from '@/app/clanes/clanes-de-clash-royale/ClashRoyaleClient';

const SITE_URL = 'https://www.joingroups.lat';
const PAGE_URL = `${SITE_URL}/clanes/clanes-de-clash-royale`;
const DETAIL_BASE_URL = `${SITE_URL}/clanes/clanes-de-clash-royale`;

export const metadata = {
  title: 'Clanes de Clash Royale | Buscar, unirse y publicar clanes activos',
  description:
    'Encuentra clanes de Clash Royale activos, revisa requisitos y publica tu clan gratis para reclutar miembros. Directorio de clanes para guerra de clanes, México, España y más.',
  keywords:
    'clanes de Clash Royale, buscar clan Clash Royale, publicar clan Clash Royale, reclutar miembros Clash Royale, unirse a clan Clash Royale, clanes activos Clash Royale, clanes Clash Royale México, clanes Clash Royale España, guerra de clanes Clash Royale',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: PAGE_URL,
  },
  openGraph: {
    title: 'Clanes de Clash Royale activos | JoinGroups',
    description:
      'Busca clanes de Clash Royale, compara actividad y publica el tuyo para reclutar jugadores activos.',
    url: PAGE_URL,
    siteName: 'JoinGroups',
    images: [
      {
        url: `${SITE_URL}/clashRoyaleFondo1.png`,
        width: 1200,
        height: 630,
        alt: 'Clanes de Clash Royale activos en JoinGroups',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clanes de Clash Royale | Buscar o publicar clan',
    description:
      'Encuentra clanes activos de Clash Royale o publica tu clan gratis para reclutar nuevos miembros.',
    images: [`${SITE_URL}/clashRoyaleFondo1.png`],
  },
};

const faqItems = [
  {
    question: '¿Cómo puedo buscar un clan de Clash Royale en JoinGroups?',
    answer:
      'Usa el buscador de la página para filtrar clanes por nombre o categoría. Cada ficha muestra datos útiles como miembros, trofeos requeridos, visitas y descripción cuando están disponibles.',
  },
  {
    question: '¿Puedo publicar mi clan de Clash Royale gratis?',
    answer:
      'Sí. Puedes publicar tu clan gratis desde el formulario de JoinGroups. El sistema valida el enlace de invitación y crea una ficha pública para ayudar a reclutar miembros.',
  },
  {
    question: '¿Qué datos ayudan a elegir un buen clan?',
    answer:
      'Conviene revisar miembros, requisitos de trofeos, descripción, país o ubicación, actividad y enfoque del clan, especialmente si quieres participar en guerra de clanes.',
  },
  {
    question: '¿Hay clanes de Clash Royale de México o España?',
    answer:
      'Cuando los datos públicos del clan incluyen ubicación, JoinGroups puede mostrar país o región. No se crean páginas regionales vacías si no hay suficientes clanes reales para sostenerlas.',
  },
  {
    question: '¿Cómo recluto miembros para mi clan?',
    answer:
      'Publica una descripción clara con requisitos, estilo de juego, actividad y objetivos del clan. Eso ayuda a que jugadores compatibles encuentren tu ficha y se unan desde el enlace oficial.',
  },
];

async function getClashRoyaleClans() {
  const snapshot = await getDocs(collection(db, 'clanes'));

  const clanes = snapshot.docs.map((doc) => {
    const data = doc.data();
    const { email, emailRepeat, ...publicData } = data;

    return {
      id: doc.id,
      ...publicData,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
    };
  });

  const clashRoyaleClans = clanes.filter((clan) => clan.tipo === 'clash-royale');
  const destacados = clashRoyaleClans.filter((clan) => clan.destacado);
  const normales = clashRoyaleClans.filter((clan) => !clan.destacado);

  return [...destacados, ...normales];
}

function getClanDescription(clan) {
  const rawDescription = typeof clan.description === 'string'
    ? clan.description
    : clan.description?.es || clan.description?.en || '';

  const cleanDescription = rawDescription
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanDescription.length > 180
    ? `${cleanDescription.slice(0, 177)}...`
    : cleanDescription;
}

function buildCollectionJsonLd(clanes) {
  const itemListElement = clanes.slice(0, 50).map((clan, index) => {
    const slug = clan.slug || slugify(clan.name || clan.id);

    return {
      '@type': 'ListItem',
      position: index + 1,
      url: `${DETAIL_BASE_URL}/${slug}`,
      name: clan.name,
      description: getClanDescription(clan) || undefined,
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Clanes de Clash Royale',
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
        { '@type': 'ListItem', position: 3, name: 'Clash Royale', item: PAGE_URL },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      name: 'Catálogo de clanes de Clash Royale',
      numberOfItems: clanes.length,
      itemListElement,
    },
  };
}

function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export default async function ClashRoyalePage() {
  const clanes = await getClashRoyaleClans();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildCollectionJsonLd(clanes)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqJsonLd()) }}
      />
      <ClashRoyaleClient initialData={clanes} faqItems={faqItems} />
    </>
  );
}
