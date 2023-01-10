module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return process.env.NEXT_STAGE
      ? [
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
      : [];
  },
};
