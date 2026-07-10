import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import { blogs } from '@/app/data/blogs';

const SITE_URL = 'https://www.joingroups.lat';

// Regional countries for clash royale clan pages
const REGIONAL_COUNTRIES = ['mexico', 'espana', 'argentina'];

const RECENT_DATE = new Date('2026-07-10');

export default async function sitemap() {
  const staticEntries = [
    {
      url: `${SITE_URL}/`,
      lastModified: RECENT_DATE,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/clanes`,
      lastModified: RECENT_DATE,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/clanes/clanes-de-clash-royale`,
      lastModified: RECENT_DATE,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/clanes/clanes-de-clash-of-clans`,
      lastModified: RECENT_DATE,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/clanes/publicar-clan`,
      lastModified: RECENT_DATE,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/comunidades`,
      lastModified: RECENT_DATE,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/comunidades/grupos-de-telegram`,
      lastModified: RECENT_DATE,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/comunidades/grupos-de-whatsapp`,
      lastModified: RECENT_DATE,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacidad`,
      lastModified: RECENT_DATE,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Regional clan pages
    ...REGIONAL_COUNTRIES.map((country) => ({
      url: `${SITE_URL}/clanes/clanes-de-clash-royale/${country}`,
      lastModified: RECENT_DATE,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
  ];

  // Dynamic clan detail pages from Firestore
  let clanEntries = [];
  try {
    const snapshot = await getDocs(collection(db, 'clanes'));
    clanEntries = snapshot.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || slugify(data.name || doc.id);
      const tipo = data.tipo || 'clash-royale';
      let lastMod = RECENT_DATE;
      if (data.createdAt?.toDate) {
        lastMod = data.createdAt.toDate();
      } else if (data.createdAt) {
        lastMod = new Date(data.createdAt);
      }
      return {
        url: `${SITE_URL}/clanes/clanes-de-${tipo}/${slug}`,
        lastModified: lastMod,
        changeFrequency: 'weekly',
        priority: 0.6,
      };
    });
  } catch (e) {
    // If Firestore is unavailable during build, use empty array
    console.warn('Could not fetch clanes for sitemap:', e.message);
  }

  // Blog posts with real dates from blogs.js
  const blogEntries = blogs.map((post) => {
    const modDate = post.dateModified
      ? new Date(post.dateModified)
      : new Date('2026-06-30');
    return {
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: modDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    };
  });

  return [...staticEntries, ...clanEntries, ...blogEntries];
}
