// ✅ Archivo: /app/comunidades/page.jsx

import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import TableSortClient from './TableSortClient'; // <-- Asegúrate de tener este componente

export const metadata = {
  title: 'Grupos de Telegram y WhatsApp por Categorías - joingroups.lat',
  description: 'Explora miles de grupos activos en Telegram y WhatsApp. Únete fácilmente a comunidades de amistad, hobbies, tecnología, noticias, y más.',
  keywords: 'grupos de telegram, grupos de whatsapp, enlaces de telegram, enlaces de whatsapp, unirse a grupos, grupos por categoría, grupos 2026, comunidades online, chats temáticos',
  robots: 'index, follow',
  alternates: {
    canonical: 'https://joingroups.lat/comunidades',
  },
  openGraph: {
    title: 'Grupos Activos de Telegram y WhatsApp - Categorías 2026',
    description: 'Únete a comunidades activas por intereses. Encuentra tu grupo ideal y publica el tuyo gratis en joingroups.lat.',
    url: 'https://joingroups.lat/comunidades',
    siteName: 'joingroups.lat',
    images: [
      {
        url: 'https://joingroups.lat/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Explora grupos por categorías - JoinGroups',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grupos de Telegram y WhatsApp por Temática - JoinGroups 2026',
    description: 'Encuentra comunidades por categoría: amistad, memes, tecnología, NSFW, y más. ¡Publica el tuyo gratis!',
    images: ['https://joingroups.lat/opengraph-image.png'],
  }
};

export default async function ComunidadesPage() {
  const snapshot = await getDocs(collection(db, 'groups'));

  const grupos = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() || null,
    };
  });

  const destacados = grupos.filter(g => g.destacado);
  const normales = grupos.filter(g => !g.destacado);
  const serverData = [...destacados, ...normales];

  return <TableSortClient serverData={serverData} />;
}
