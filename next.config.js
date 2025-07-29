module.exports = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-cropper/node_modules/cropperjs/dist/cropper.css': require.resolve('react-cropper/node_modules/cropperjs/dist/cropper.css')
    };
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
