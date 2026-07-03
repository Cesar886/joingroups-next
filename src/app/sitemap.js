import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import { blogs } from '@/app/data/blogs';

const SITE_URL = 'https://www.joingroups.lat';

export default async function sitemap() {
  const staticEntries = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/clanes`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/clanes/clanes-de-clash-royale`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/clanes/clanes-de-clash-of-clans`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/clanes/publicar-clan`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/comunidades`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/comunidades/grupos-de-telegram`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/comunidades/grupos-de-whatsapp`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic clan detail pages from Firestore
  let clanEntries = [];
  try {
    const snapshot = await getDocs(collection(db, 'clanes'));
    clanEntries = snapshot.docs.map((doc) => {
      const data = doc.data();
      const slug = data.slug || slugify(data.name || doc.id);
      const tipo = data.tipo || 'clash-royale';
      return {
        url: `${SITE_URL}/clanes/clanes-de-${tipo}/${slug}`,
        lastModified: data.createdAt?.toDate?.() || new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      };
    });
  } catch (e) {
    // If Firestore is unavailable during build, use empty array
    console.warn('Could not fetch clanes for sitemap:', e.message);
  }

  // Blog posts
  const blogEntries = blogs.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date('2026-06-30'),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...clanEntries, ...blogEntries];
}
