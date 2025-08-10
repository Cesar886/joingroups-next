import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pageSize = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  try {
    const q = query(
      collection(db, 'clanes'),
      where('tipo', '==', 'clash-royale'),
      limit(pageSize)
    );
    const snap = await getDocs(q);
    let items = snap.docs.map(d => {
      const data = d.data();
      delete data.email;
      delete data.gmail;
      delete data.emailRepeat;
      delete data.visitas;
      let createdAt = null;
      if (data.createdAt instanceof Date) { 
        createdAt = data.createdAt.toISOString();
      } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        createdAt = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAt = data.createdAt;
      }
      return { id: d.id, ...data, createdAt };
    });
    if (!items || items.length === 0) {
      return NextResponse.json({
        ok: true,
        count: 1,
        items: [{
          name: "BLACKNIGTHMARE",
          link: "https://link.clashroyale.com/invite/clan/es?tag=GJ9PJRV9&token=ynhmx83g&platform=android",
          country: "México",
          description: "Este es un clan competitivo en guerra de clanes"
        }]
      });
    }
    return new NextResponse(
      JSON.stringify({ ok: true, count: items.length, items }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const code = err?.code || 'unknown';
    const msg = err?.message || String(err);
    return new NextResponse(
      JSON.stringify({ ok: false, error: 'internal_error', message: msg, code }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}