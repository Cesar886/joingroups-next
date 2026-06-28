export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEXT_LENGTH = 260;

function sanitize(value) {
  if (value == null) return value;

  if (typeof value === 'string') {
    return value.length > MAX_TEXT_LENGTH
      ? value.slice(0, MAX_TEXT_LENGTH) + '...'
      : value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitize).slice(0, 12);
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/email|mail|token|captcha/i.test(key))
        .map(([key, entry]) => [key, sanitize(entry)])
    );
  }

  return value;
}

export async function POST(request) {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(null, { status: 204 });
  }

  let payload = {};
  try {
    payload = await request.json();
  } catch (error) {
    payload = { event: 'invalid_json', error: error?.message || String(error) };
  }

  console.log('[publication-debug]', JSON.stringify({
    at: new Date().toISOString(),
    flow: payload.flow || 'unknown',
    event: payload.event || 'unknown',
    host: payload.host || '',
    path: payload.path || '',
    details: sanitize(payload.details || {}),
  }, null, 2));

  return Response.json({ ok: true });
}
