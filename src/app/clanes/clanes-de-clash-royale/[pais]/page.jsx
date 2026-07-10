// src/app/clanes/clanes-de-clash-royale/[pais]/page.jsx
import { collection, getDocs, query, where } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import RegionalClansClient from './RegionalClansClient';

const SITE_URL = 'https://www.joingroups.lat';

const COUNTRIES = {
  mexico: {
    name: 'México',
    slug: 'mexico',
    flag: '🇲🇽',
    code: 'mx',
    gentilicio: 'mexicanos',
    keywords: 'clanes clash royale México, clanes mexicanos clash royale, unirse a clan clash royale México, reclutar miembros clash royale México',
    description: 'Encuentra los mejores clanes de Clash Royale en México, con jugadores activos, guerras de clanes y donaciones rápidas. Clanes mexicanos buscando miembros para crecer juntos.',
  },
  espana: {
    name: 'España',
    slug: 'espana',
    flag: '🇪🇸',
    code: 'es',
    gentilicio: 'españoles',
    keywords: 'clanes clash royale España, clanes españoles clash royale, clanes clash royale España 2026, clanes competitivos España clash royale',
    description: 'Descubre clanes de Clash Royale en España con comunidades activas, guerras semanales y donaciones constantes. Clanes españoles para jugadores de todos los niveles.',
  },
  argentina: {
    name: 'Argentina',
    slug: 'argentina',
    flag: '🇦🇷',
    code: 'ar',
    gentilicio: 'argentinos',
    keywords: 'clanes clash royale Argentina, clanes argentinos clash royale, unirse a clan clash royale Argentina, clanes competitivos Argentina clash royale',
    description: 'Los mejores clanes de Clash Royale en Argentina te esperan. Comunidades activas, guerras de clanes y donaciones para subir de arena rápidamente.',
  },
};

const COUNTRY_CODES = ['mx', 'es', 'ar', 'co', 'cl', 'pe', 'us'];
const COUNTRY_NAMES = ['méxico', 'mexico', 'españa', 'espana', 'spain', 'argentina', 'colombia', 'chile', 'perú', 'peru', 'colombia'];

// Map URL slugs to country configs
function getCountryConfig(slug) {
  const normalized = slugify(slug);
  // Direct match
  if (COUNTRIES[normalized]) return COUNTRIES[normalized];
  // Fuzzy match
  const match = Object.values(COUNTRIES).find(c => slugify(c.name) === normalized);
  return match || null;
}

function matchCountry(text, countryConfig) {
  if (!text) return false;
  const lower = String(text).toLowerCase().trim();
  const code = countryConfig.code;
  if (lower === code) return true;
  if (lower === countryConfig.name.toLowerCase()) return true;
  if (lower === countryConfig.gentilicio) return true;
  // Common variations
  const nameLower = countryConfig.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const textNoAccent = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return textNoAccent === nameLower;
}

export async function generateStaticParams() {
  return Object.keys(COUNTRIES).map((slug) => ({ pais: slug }));
}

export async function generateMetadata({ params }) {
  const { pais } = await params;
  const country = getCountryConfig(pais);

  if (!country) {
    return {
      title: 'País no encontrado | JoinGroups',
      robots: { index: false, follow: true },
    };
  }

  const title = `Clanes de Clash Royale en ${country.name} ${country.flag} | Buscar y unirse a clanes activos`;
  const description = country.description;

  return {
    title,
    description,
    keywords: country.keywords,
    alternates: {
      canonical: `${SITE_URL}/clanes/clanes-de-clash-royale/${country.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/clanes/clanes-de-clash-royale/${country.slug}`,
      siteName: 'JoinGroups',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/clashRoyaleFondo1.webp`,
          width: 1200,
          height: 630,
          alt: `Clanes de Clash Royale en ${country.name}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/clashRoyaleFondo1.webp`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

function buildBreadcrumbJsonLd(country) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Clanes', item: `${SITE_URL}/clanes` },
      { '@type': 'ListItem', position: 3, name: 'Clash Royale', item: `${SITE_URL}/clanes/clanes-de-clash-royale` },
      { '@type': 'ListItem', position: 4, name: country.name, item: `${SITE_URL}/clanes/clanes-de-clash-royale/${country.slug}` },
    ],
  };
}

function buildCollectionJsonLd(clanes, country) {
  const itemListElement = clanes.slice(0, 30).map((clan, index) => {
    const clanSlug = clan.slug || slugify(clan.name || clan.id);
    return {
      '@type': 'ListItem',
      position: index + 1,
      url: `${SITE_URL}/clanes/clanes-de-clash-royale/${clanSlug}`,
      name: clan.name,
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Clanes de Clash Royale en ${country.name}`,
    description: country.description,
    url: `${SITE_URL}/clanes/clanes-de-clash-royale/${country.slug}`,
    isPartOf: {
      '@type': 'WebSite',
      name: 'JoinGroups',
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      name: `Clanes de Clash Royale en ${country.name}`,
      numberOfItems: clanes.length,
      itemListElement,
    },
  };
}

export default async function RegionalClansPage({ params }) {
  const { pais } = await params;
  const country = getCountryConfig(pais);

  if (!country) notFound();

  // Fetch all clash-royale clans
  const snapshot = await getDocs(collection(db, 'clanes'));
  const allClans = snapshot.docs.map((doc) => {
    const data = doc.data();
    const { email, emailRepeat, ...publicData } = data;
    return {
      id: doc.id,
      ...publicData,
      createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt || null,
    };
  });

  // Filter by game type and country
  const clashRoyaleClans = allClans.filter((clan) => clan.tipo === 'clash-royale');
  const regionalClans = clashRoyaleClans.filter((clan) => {
    const countryField = clan.country || clan.pais || clan.país || clan.city || '';
    return matchCountry(countryField, country);
  });

  // Sort: featured first, then by visits
  const destacados = regionalClans.filter((c) => c.destacado);
  const normales = regionalClans.filter((c) => !c.destacado);
  const orderedClans = [...destacados, ...normales];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(country)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildCollectionJsonLd(orderedClans, country)) }}
      />
      <RegionalClansClient initialData={orderedClans} country={country} />
    </>
  );
}
