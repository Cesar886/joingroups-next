/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/clanes/clash-royale',
        destination: '/clanes/clanes-de-clash-royale',
        permanent: true,
      },
      // Redirect /telegram/* to programmatic SEO routes under /comunidades/grupos-de-telegram/*
      {
        source: '/telegram/tributos',
        destination: '/comunidades/grupos-de-telegram/tributos',
        permanent: true,
      },
      {
        source: '/telegram/grupos-caseros',
        destination: '/comunidades/grupos-de-telegram/grupos-caseros',
        permanent: true,
      },
      {
        source: '/telegram/packs',
        destination: '/comunidades/grupos-de-telegram/packs',
        permanent: true,
      },
      {
        source: '/telegram/desnudas',
        destination: '/comunidades/grupos-de-telegram/desnudas',
        permanent: true,
      },
      {
        source: '/telegram/peliculas',
        destination: '/comunidades/grupos-de-telegram/peliculas',
        permanent: true,
      },
      {
        source: '/telegram/grupos',
        destination: '/comunidades/grupos-de-telegram',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
