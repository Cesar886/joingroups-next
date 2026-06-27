const VPS_URL = process.env.VPS_API_URL || 'http://157.230.188.120:7890';

const ALLOWED_TYPES = new Set(['info', 'members', 'war', 'warlog', 'riverrace', 'riverracelog', 'full']);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const type = searchParams.get('type') || 'info';

  if (!tag) {
    return new Response(JSON.stringify({ error: 'Missing tag' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!ALLOWED_TYPES.has(type)) {
    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const res = await fetch(
      `${VPS_URL}/api/clash?tag=${encodeURIComponent(tag)}&type=${encodeURIComponent(type)}`,
      { headers: { Accept: 'application/json' } }
    );

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Clash proxy error:', error.message);
    return new Response(
      JSON.stringify({ error: true, message: 'Error connecting to backend' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
