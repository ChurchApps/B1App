module.exports = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material', '@churchapps/apphelper']
  },
  // Webpack config (only used when Turbopack is disabled)
  webpack: (config, { dev }) => {
    // Only apply when not using Turbopack
    if (!process.env.TURBOPACK) {
      // Handle the cropperjs CSS import issue for webpack mode
      const path = require('path');
      const fs = require('fs');
      
      const cropperCssPath = 'react-cropper/node_modules/cropperjs/dist/cropper.css';
      let resolvedPath;
      
      try {
        resolvedPath = require.resolve(cropperCssPath);
      } catch (e) {
        // Fallback for different environments
        const possiblePaths = [
          path.join(process.cwd(), 'node_modules', cropperCssPath),
          path.join(process.cwd(), 'node_modules', 'cropperjs', 'dist', 'cropper.css'),
          path.join(process.cwd(), 'public', 'css', 'cropper.css')
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
  async rewrites() {
    return [
      {
        source: "/",
        has: [
          {
            type: "header",
            key: "x-site",
            value: "(?<subdomain>.*?)\\..*",
          },
        ],
        destination: "/:subdomain",
      },
      {
        source: "/:path*",
        has: [
          {
            type: "header",
            key: "x-site",
            value: "(?<subdomain>.*?)\\..*",
          },
        ],
        destination: "/:subdomain/:path*",
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "localhost",
          },
        ],
        destination: "/localhost",
      },
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "(?<subdomain>.*?)\\..*",
          },
        ],
        destination: "/:subdomain",
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?<subdomain>.*?)\\..*",
          },
        ],
        destination: "/:subdomain/:path*",
      },
    ]
  },
  images:{
    domains: ["content.staging.churchapps.org", "content.churchapps.org", "content.lessons.church"]
  },
  transpilePackages: ["@churchapps/apphelper", "@churchapps/apphelper-login", "@churchapps/apphelper-markdown", "@churchapps/apphelper-donations", "@churchapps/helpers", "mui-tel-input"]
};
