const devRewrites = (process.env.NEXT_STAGE) ? {
  async rewrites() {
    return [
      {
        source: "/",
        has: [
          {
            type: 'host',
            value: '(?<subdomain>.*)\\..*',
          },
        ],
        destination: "/:subdomain"
      },
      {
        source: "/:path*",
        has: [
          {
            type: 'host',
            value: '(?<subdomain>.*)\\..*',
          },
        ],
        destination: "/:subdomain/:path*"
      }
    ]
  }
} : null;

module.exports = {
  reactStrictMode: true,
  devRewrites
};
