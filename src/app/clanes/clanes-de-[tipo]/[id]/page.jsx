import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { notFound } from 'next/navigation';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import GroupDetailClanesClient from './GroupDetailClanesClient';

const SITE_URL = 'https://www.joingroups.lat';

function getGameName(tipo) {
  if (tipo === 'clash-royale') return 'Clash Royale';
  if (tipo === 'clash-of-clans') return 'Clash of Clans';
  return 'videojuegos';
}

function getLandingUrl(tipo) {
  if (tipo === "clash-royale") return SITE_URL + "/clanes/clanes-de-clash-royale";
  if (tipo === "clash-of-clans") return SITE_URL + "/clanes/clanes-de-clash-of-clans";
  return SITE_URL + "/clanes";
}

function resolveTipo(tipo, clan) {
  return tipo || clan?.tipo || clan?.juego || "";
}

function getDescription(clan) {
  if (typeof clan?.description === 'string') return clan.description;
  return clan?.description?.es || clan?.description?.en || '';
}

function cleanText(value, fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim();
}

async function getClanBySlug(slug, tipo) {
  const decodedSlug = decodeURIComponent(slug);
  const slugQuery = query(collection(db, 'clanes'), where('slug', '==', decodedSlug), limit(5));
  const slugSnapshot = await getDocs(slugQuery);
  let docs = slugSnapshot.docs;

  if (!docs.length) {
    const allSnapshot = await getDocs(query(collection(db, 'clanes'), limit(1000)));
    docs = allSnapshot.docs.filter((doc) => slugify(doc.data().name || doc.id) === decodedSlug);
  }

  const typedDoc = docs.find((doc) => doc.data().tipo === tipo) || docs[0];
  if (!typedDoc) return null;

  const data = typedDoc.data();
  const { email, emailRepeat, ...publicData } = data;

  return {
    id: typedDoc.id,
    ...publicData,
    slug: data.slug || slugify(data.name || typedDoc.id),
    createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt || null,
  };
}

export async function generateMetadata({ params }) {
  const { tipo, id } = await params;
  const clan = await getClanBySlug(id, tipo);

  if (!clan) {
    const gameName = getGameName(tipo);
    return {
      title: `Clan no encontrado de ${gameName}`,
      description: 'Este clan no está disponible en JoinGroups.',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const resolvedTipo = resolveTipo(tipo, clan);
  const gameName = getGameName(resolvedTipo);
  const clanName = cleanText(clan.name, 'Clan');
  const description = cleanText(getDescription(clan));
  const canonical = SITE_URL + "/clanes/clanes-de-" + resolvedTipo + "/" + (clan.slug || id);
  const metaDescription = description
    ? `${description.slice(0, 135)}${description.length > 135 ? '...' : ''}`
    : `Información de ${clanName}, clan de ${gameName}. Revisa descripción, requisitos, actividad y enlace para unirte desde JoinGroups.`;

  return {
    title: `${clanName} | Clan de ${gameName}`,
    description: metaDescription,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    },
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${clanName} | Clan de ${gameName}`,
      description: metaDescription,
      url: canonical,
      type: 'article',
      images: [
        {
          url: `${SITE_URL}/${resolvedTipo === 'clash-royale' ? 'clashRoyaleFondo1.png' : 'clashOfClansFondo.png'}`,
          width: 1200,
          height: 630,
          alt: `${clanName} - clan de ${gameName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${clanName} | Clan de ${gameName}`,
      description: metaDescription,
    },
  };
}

function buildClanJsonLd(clan, tipo) {
  const resolvedTipo = resolveTipo(tipo, clan);
  const gameName = getGameName(resolvedTipo);
  const clanName = cleanText(clan.name, 'Clan');
  const canonical = SITE_URL + "/clanes/clanes-de-" + resolvedTipo + "/" + clan.slug;
  const description = cleanText(getDescription(clan), `${clanName}, clan de ${gameName} publicado en JoinGroups.`);

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: clanName,
    description,
    url: canonical,
    sameAs: clan.link ? [clan.link] : undefined,
    identifier: clan.tag || undefined,
    knowsAbout: [gameName, 'clanes de videojuegos', 'reclutamiento de miembros', 'guerra de clanes'],
    isPartOf: {
      '@type': 'CollectionPage',
      name: `Clanes de ${gameName}`,
      url: getLandingUrl(resolvedTipo),
    },
  };
}

function buildBreadcrumbJsonLd(clan, tipo) {
  const resolvedTipo = resolveTipo(tipo, clan);
  const gameName = getGameName(resolvedTipo);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Clanes', item: `${SITE_URL}/clanes` },
      { '@type': 'ListItem', position: 3, name: gameName, item: getLandingUrl(resolvedTipo) },
      {
        '@type': 'ListItem',
        position: 4,
        name: cleanText(clan.name, 'Clan'),
        item: SITE_URL + "/clanes/clanes-de-" + resolvedTipo + "/" + clan.slug,
      },
    ],
  };
}

export default async function GroupDetailClanesPage({ params }) {
  const { tipo, id } = await params;
  const clan = await getClanBySlug(id, tipo);

  if (!clan) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildClanJsonLd(clan, tipo)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbJsonLd(clan, tipo)) }}
      />
      <GroupDetailClanesClient initialGroup={clan} />
    </>
  );
}
