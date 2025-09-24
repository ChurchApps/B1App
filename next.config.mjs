import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable Turbopack for faster development
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "@mui/lab",
      "@mui/x-date-pickers",
      "@churchapps/apphelper",
      "@churchapps/helpers",
      "react-big-calendar",
      "react-dnd",
      "react-dnd-html5-backend"
    ]
  },

  // Module federation for code splitting
  webpack: (config, { dev, isServer }) => {
    // Only apply when not using Turbopack
    if (!process.env.TURBOPACK) {
      // Optimize chunking strategy
      if (!isServer) {
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: false,
              vendors: false,
              // Vendor code splitting
              vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /node_modules/,
                priority: 20
              },
              // MUI components
              mui: {
                name: 'mui',
                test: /[\\/]node_modules[\\/]@mui[\\/]/,
                chunks: 'all',
                priority: 30
              },
              // ChurchApps packages
              churchapps: {
                name: 'churchapps',
                test: /[\\/]node_modules[\\/]@churchapps[\\/]/,
                chunks: 'all',
                priority: 25
              },
              // Common components
              common: {
                name: 'common',
                minChunks: 2,
                priority: 10,
                reuseExistingChunk: true,
                enforce: true
              }
            }
          }
        };
      }

      // Handle cropperjs CSS import issue
      const cropperCssPath = "react-cropper/node_modules/cropperjs/dist/cropper.css";
      let resolvedPath;

      try {
        resolvedPath = path.join(__dirname, 'node_modules', cropperCssPath);
      } catch (e) {
        const possiblePaths = [
          path.join(__dirname, "node_modules", cropperCssPath),
          path.join(__dirname, "node_modules", "cropperjs", "dist", "cropper.css"),
          path.join(__dirname, "public", "css", "cropper.css")
        ];

        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            resolvedPath = possiblePath;
            break;
          }
        }
      }

      if (resolvedPath) {
        config.resolve.alias = {
          ...config.resolve.alias,
          [cropperCssPath]: resolvedPath
        };
      }
    }

    return config;
  },

  // Rewrites for subdomain routing
  async rewrites() {
    return [
      {
        source: "/",
        has: [{ type: "header", key: "x-site", value: "(?<subdomain>.*?)\\..*" }],
        destination: "/:subdomain"
      },
      {
        source: "/:path*",
        has: [{ type: "header", key: "x-site", value: "(?<subdomain>.*?)\\..*" }],
        destination: "/:subdomain/:path*"
      },
      {
        source: "/",
        has: [{ type: "host", value: "localhost" }],
        destination: "/localhost"
      },
      {
        source: "/",
        has: [{ type: "host", value: "(?<subdomain>.*?)\\..*" }],
        destination: "/:subdomain"
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "(?<subdomain>.*?)\\..*" }],
        destination: "/:subdomain/:path*"
      }
    ];
  },

  // Image optimization
  images: {
    domains: [
      "content.staging.churchapps.org",
      "content.churchapps.org",
      "content.lessons.church"
    ],
    // Add image optimization settings
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },

  // Transpile packages
  transpilePackages: [
    "@churchapps/apphelper",
    "@churchapps/apphelper-login",
    "@churchapps/apphelper-markdown",
    "@churchapps/apphelper-donations",
    "@churchapps/helpers",
    "mui-tel-input"
  ],

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"]
    } : false,
  },


  // Optimize CSS
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}'
    },
    '@mui/material': {
      transform: '@mui/material/{{member}}'
    }
  },

  // Production optimizations
  productionBrowserSourceMaps: false,

  // Reduce build output verbosity
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  }
};

export default nextConfig;