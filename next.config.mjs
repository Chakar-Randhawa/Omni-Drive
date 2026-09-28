/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Strip the node: scheme so the aliases below can stub these modules out
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );
      // Node-only modules referenced by some libraries (e.g. pptxgenjs) must be
      // stubbed out for the browser bundle.
      config.resolve.alias = {
        ...config.resolve.alias,
        'node:https': false,
        'node:fs': false,
        https: false,
        fs: false,
        path: false,
        os: false,
        'image-size': false,
      };
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false, os: false, https: false };
    }
    return config;
  },
};

export default nextConfig;
