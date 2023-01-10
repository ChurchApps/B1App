module.exports = {
  reactStrictMode: true,
  async rewrites() {
    [
      {
        source: "/",
        has: [
          {
            type: "host",
            value: "(?<subdomain>.*)\\..*",
          },
        ],
        destination: "/:subdomain",
      },
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?<subdomain>.*)\\..*",
          },
        ],
        destination: "/:subdomain/:path*",
      },
    ]
  },
};
