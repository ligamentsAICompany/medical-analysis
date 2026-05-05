const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  serverExternalPackages: ['@xenova/transformers'],

  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;

    if (isServer) {
      // pdfjs-dist uses browser-only APIs (DOMMatrix etc.) — replace with empty stub on server
      config.resolve.alias['pdfjs-dist'] = path.resolve(__dirname, 'src/lib/pdfjs-stub.js');
    } else {
      config.resolve.alias = {
        ...config.resolve.alias,
        'sharp$': false,
        'onnxruntime-node$': false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
