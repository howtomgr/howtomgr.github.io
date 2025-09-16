/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true
  },

  // GitHub Pages configuration
  basePath: '',
  assetPrefix: '',

  // Optimize for static export
  poweredByHeader: false,
  compress: true,

  // Handle page extensions
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],

  // Webpack optimization
  webpack: (config) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      usedExports: true,
    };

    return config;
  },

  // Redirect configuration for clean URLs
  async redirects() {
    return [
      // Old guide URLs
      {
        source: '/guides/:guide',
        destination: '/infrastructure/:guide',
        permanent: true,
      },
      // Singular to plural category redirects
      {
        source: '/web-server/:path*',
        destination: '/web-servers/:path*',
        permanent: true,
      },
      {
        source: '/database/:path*',
        destination: '/databases/:path*',
        permanent: true,
      },
      {
        source: '/container/:path*',
        destination: '/containers/:path*',
        permanent: true,
      },
      {
        source: '/media/:path*',
        destination: '/media-servers/:path*',
        permanent: true,
      },
    ];
  },

  // Generate static params for all categories
  experimental: {
    // Enable app directory if needed in the future
    appDir: false,
  },
};

module.exports = nextConfig;