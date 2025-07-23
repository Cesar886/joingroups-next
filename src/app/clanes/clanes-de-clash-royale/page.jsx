// ✅ Archivo: /app/clanes/clanes-de-clash-royale/page.jsx

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import ClashRoyaleClient from './ClashRoyaleClient'; // ✅ Importación corregida

export const metadata = {
  title: 'Clanes de Clash Royale Activos 2025 ⚔️ | Únete, Busca o Recluta Jugadores',
  description: 'Explora la lista más actualizada de clanes activos de Clash Royale en 2025. Filtra por trofeos, encuentra tu clan ideal o publica el tuyo gratis para atraer nuevos miembros.',
  keywords: 'clanes Clash Royale, unirse a clan Clash Royale, reclutar jugadores, publicar clan gratis, guerra de clanes, clanes activos 2025, mejores clanes Clash Royale, clanes en español',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://joingroups.pro/clanes/clanes-de-clash-royale',
  },
  openGraph: {
    title: '🛡️ Mejores Clanes de Clash Royale 2025 | Encuentra o Publica el Tuyo',
    description: 'Descubre clanes activos de Clash Royale y encuentra el mejor para ti. ¿Eres líder? Publica tu clan gratis y consigue jugadores activos fácilmente.',
    url: 'https://joingroups.pro/clanes/clanes-de-clash-royale',
    siteName: 'JoinGroups.pro',
    images: [
      {
        url: 'https://joingroups.pro/clashRoyaleFondo1.png',
        width: 1200,
        height: 630,
        alt: 'Personajes de Clash Royale luchando en la arena',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clanes de Clash Royale Activos en 2025 | Publica o Únete Gratis',
    description: 'Busca clanes activos de Clash Royale o publica el tuyo gratis. Ideal para jugadores y líderes que quieren avanzar en guerra de clanes.',
    images: ['https://joingroups.pro/clashRoyaleFondo1.png'],
  },
};



export default async function ClashRoyalePage() {
    const snapshot = await getDocs(collection(db, 'clanes'));
    const groups = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.().toISOString() || null, // <-- 🔥 Esto es lo importante
    };
    });


  const clashRoyaleFilter = groups.filter(g => g.tipo === 'clash-royale');
  const destacados = clashRoyaleFilter.filter(g => g.destacado);
  const normales = clashRoyaleFilter.filter(g => !g.destacado);
  const serverData = [...destacados, ...normales];

  return <ClashRoyaleClient serverData={serverData} />;
}
