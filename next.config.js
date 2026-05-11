/**
 * Next.js 16 defaults to Turbopack. Use `turbopack.resolveAlias` with project-relative paths
 * (not absolute paths — Turbopack rejects those for some targets).
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'standalone',

  serverExternalPackages: ['@xenova/transformers'],

  turbopack: {
    resolveAlias: {
      canvas: './src/lib/empty-module.js',
      sharp: './src/lib/empty-module.js',
      'onnxruntime-node': './src/lib/empty-module.js',
      // Server/RSC must not evaluate real pdfjs; browser keeps the real package.
      'pdfjs-dist': {
        browser: 'pdfjs-dist',
        default: './src/lib/pdfjs-stub.js',
      },
    },
  },
};

module.exports = nextConfig;
