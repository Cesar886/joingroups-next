/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/clanes/clash-royale',
        destination: '/clanes/clanes-de-clash-royale',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
