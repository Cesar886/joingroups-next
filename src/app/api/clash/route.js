import axios from 'axios';

export default async function handler(req, res) {
  const { tag, type = 'info' } = req.query;
  const API_KEY = process.env.CLASH_API_KEY;

  if (!tag) return res.status(400).json({ error: 'Missing tag' });

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
    return res.status(400).json({ error: 'Invalid type' });
  }

  const fetchData = async (endpoint) => {
    const response = await axios.get(`https://api.clashroyale.com/v1${endpoint}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    return response.data;
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

      return res.status(200).json(fullData);
    }

    const data = await fetchData(endpoints[type]);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in clash API:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: true,
      message: error.response?.data?.message || 'Internal Server Error',
    });
  }
}
