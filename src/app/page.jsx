import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import HomeClient from './HomeClient';

export const metadata = {
  title: 'Grupos de Telegram, WhatsApp y Clanes de Videojuegos',
  description: 'Descubre y únete a miles de grupos de Telegram y WhatsApp activos. También encuentra clanes populares de videojuegos como Clash of Clans y más. Explora por país, categoría y tipo.',
  keywords: 'grupos de Telegram, grupos de WhatsApp, clanes de videojuegos, comunidades activas, clash royale, clash of clans, grupos por país',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://joingroups.lat',
    languages: {
      'es-ES': 'https://es.joingroups.lat',
      'en-US': 'https://en.joingroups.lat',
    },
  },
  openGraph: {
    title: 'Grupos de Telegram, WhatsApp y Clanes - joingroups.lat',
    description: 'Un catálogo completo de comunidades activas. Filtra y únete fácil por país y categoría.',
    url: 'https://joingroups.lat/',
    siteName: 'joingroups.lat',
    images: [
      {
        url: 'https://joingroups.lat/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Grupos y clanes activos de Telegram, WhatsApp y videojuegos',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Únete a Grupos de Telegram, WhatsApp y Clanes | joingroups.lat',
    description: 'Explora comunidades activas por categoría y país. Publica o descubre grupos fácilmente.',
    images: ['https://joingroups.lat/opengraph-image.png'],
  },
    other: {
    'yandex-verification': '6a0e37aeb6ffa1fa',
    }
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

  return <HomeClient serverData={serverData} />;
}
