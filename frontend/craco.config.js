module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // face-api.js references Node.js built-ins (fs, path, os) in its ES6 build.
      // They are never actually called in a browser context, so we stub them out.
      webpackConfig.resolve.fallback = {
        ...(webpackConfig.resolve.fallback || {}),
        fs: false,
        path: false,
        os: false,
      };
      return webpackConfig;
    },
  },
};
