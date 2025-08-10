// ✅ Next.js App Router - Communities API (server-safe con Firebase Admin)
// Pega este archivo en: src/app/api/communities/route.js

export const runtime = 'nodejs';          // asegúrate de NO correr en Edge
export const dynamic = 'force-dynamic';
import { collection, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/firebase/firebase';


import { NextResponse } from 'next/server';


// --- CORS (ajusta dominios permitidos) ---
const ALLOWED_ORIGINS = [
  'https://joingroups.pro',
  'http://localhost:3000',
];

function corsHeaders(origin = '') {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get('origin')) });
}

export async function GET(request) {
  const origin = request.headers.get('origin') || '';
  const { searchParams } = new URL(request.url);

  // Filtros
  const tipo = (searchParams.get('tipo') || '').trim().toLowerCase();      // 'telegram' | 'whatsapp'
  const category = (searchParams.get('category') || '').trim();            // slug o texto exacto
  const country = (searchParams.get('country') || '').trim().toLowerCase();// ej. 'mx'
  const adult = (searchParams.get('adult') || '').trim().toLowerCase();    // 'sí' | 'no'
  const qText = (searchParams.get('q') || '').trim();                      // búsqueda prefijo name

  // Orden/paginación
  const sort = (searchParams.get('sort') || 'destacados');                 // 'top'|'nuevos'|'destacados'
  const pageSize = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
  const cursorISO = searchParams.get('cursor') || '';

  try {

    // Construir filtros
    const filters = [];
    if (tipo) filters.push(where('tipo', '==', tipo));
    if (country) filters.push(where('city', '==', country));
    if (adult) filters.push(where('content18', '==', adult === 'sí' ? 'Sí' : 'No'));
    if (category) filters.push(where('categories', 'array-contains', category));

    // Orden
    const orderFields = [];
    if (sort === 'top') {
      orderFields.push(orderBy('visitas', 'desc'));
    } else if (sort === 'nuevos') {
      orderFields.push(orderBy('createdAt', 'desc'));
    } else {
      orderFields.push(orderBy('destacado', 'desc'));
      orderFields.push(orderBy('createdAt', 'desc'));
    }

    // Paginación
    let cursorFilter = [];
    if (cursorISO) {
      const d = new Date(cursorISO);
      if (!isNaN(d.getTime())) {
        cursorFilter.push(startAfter(d));
      }
    }

    // Limite
    const limitClause = limit(pageSize);

    // Construir query
    const q = query(
      collection(db, 'groups'),
      ...filters,
      ...orderFields,
      ...cursorFilter,
      limitClause
    );

    const snap = await getDocs(q);
    let items = snap.docs.map(d => {
      const data = d.data();
      // Eliminar campos sensibles
      delete data.email;
      delete data.gmail;
      // Normaliza createdAt
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

    // Filtro por prefijo en name (client-side en el server handler)
    if (qText) {
      const qLower = qText.toLowerCase();
      items = items.filter(it => (it.name || '').toLowerCase().startsWith(qLower));
    }

    const nextCursor = items.length ? items[items.length - 1].createdAt || '' : '';

    return new NextResponse(
      JSON.stringify({ ok: true, count: items.length, nextCursor, items }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    );
  } catch (err) {
    // 🔍 Devuelve info útil para que lo veas en Postman
    const code = err?.code || 'unknown';
    const msg = err?.message || String(err);

    // Caso típico: falta índice compuesto
    if (code === 9 || code === 'failed-precondition' || /index/i.test(msg)) {
      return new NextResponse(
        JSON.stringify({
          ok: false,
          error: 'missing_index',
          message: msg,
          hint: 'Crea el índice compuesto que te sugiere este mensaje y reintenta.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
      );
    }

    console.error('communities API error:', err);
    return new NextResponse(
      JSON.stringify({ ok: false, error: 'internal_error', message: msg, code }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) } }
    );
  }
}
