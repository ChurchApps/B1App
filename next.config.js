module.exports = {
  reactStrictMode: true,
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
  transpilePackages: ["@churchapps/apphelper", "mui-tel-input"]
};
