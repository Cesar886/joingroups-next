// src/app/api/clash/route.js
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const type = searchParams.get('type') || 'info';
  const API_KEY = process.env.CLASH_API_KEY;

  if (!tag) {
    return new Response(JSON.stringify({ error: 'Missing tag' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encodedTag = encodeURIComponent(tag);
  const endpoints = {
    info: `/clans/${encodedTag}`,
    members: `/clans/${encodedTag}/members`,
    war: `/clans/${encodedTag}/currentwar`,
    warlog: `/clans/${encodedTag}/warlog`,
    riverrace: `/clans/${encodedTag}/currentriverrace`,
    riverracelog: `/clans/${encodedTag}/riverracelog`,
  };

  if (type !== 'full' && !endpoints[type]) {
    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fetchData = async (endpoint) => {
    const res = await fetch(`https://api.clashroyale.com/v1${endpoint}`, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      const error = new Error(errorData?.message || 'Fetch failed');
      error.status = res.status;
      error.responseData = errorData;
      throw error;
    }

    return await res.json();
  };

  try {
    if (type === 'full') {
      const entries = await Promise.allSettled(
        Object.entries(endpoints).map(async ([key, endpoint]) => {
          const data = await fetchData(endpoint);
          return { key, data };
        })
      );

      const fullData = {};
      for (const result of entries) {
        if (result.status === 'fulfilled') {
          const { key, data } = result.value;
          fullData[key] = data;
        }
      }

      return new Response(JSON.stringify(fullData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await fetchData(endpoints[type]);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in clash API:', error.responseData || error.message);
    return new Response(
      JSON.stringify({
        error: true,
        message: error.responseData?.message || 'Internal Server Error',
      }),
      {
        status: error.status || 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
