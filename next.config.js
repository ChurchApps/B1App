module.exports = {
  reactStrictMode: true,
  experimental: {
    appDir: true
  },
  async rewrites() {
    return [
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
};
