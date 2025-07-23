import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import HomeClient from './HomeClient';

export const metadata = {
  title: 'Grupos de Telegram, WhatsApp y Clanes de Videojuegos',
  description: 'Descubre y únete a miles de grupos de Telegram y WhatsApp activos. También encuentra clanes populares de videojuegos como Clash of Clans y más. Explora por país, categoría y tipo.',
  keywords: 'grupos de Telegram, grupos de WhatsApp, clanes de videojuegos, comunidades activas, clash royale, clash of clans, grupos por país',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://joingroups.pro/comunidades',
    languages: {
      'es-MX': 'https://mx.joingroups.pro/comunidades',
      'es-ES': 'https://es.joingroups.pro/comunidades',
      'pt-BR': 'https://br.joingroups.pro/comunidades',
      'en-US': 'https://us.joingroups.pro/comunidades',
    },
  },
  openGraph: {
    title: 'Grupos de Telegram, WhatsApp y Clanes - JoinGroups.pro',
    description: 'Un catálogo completo de comunidades activas. Filtra y únete fácil por país y categoría.',
    url: 'https://joingroups.pro/comunidades',
    siteName: 'JoinGroups.pro',
    images: [
      {
        url: 'https://joingroups.pro/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Grupos y clanes activos de Telegram, WhatsApp y videojuegos',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Únete a Grupos de Telegram, WhatsApp y Clanes | JoinGroups.pro',
    description: 'Explora comunidades activas por categoría y país. Publica o descubre grupos fácilmente.',
    images: ['https://joingroups.pro/opengraph-image.png'],
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

  return <HomeClient serverData={serverData} />;
}
