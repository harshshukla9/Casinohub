import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add empty turbopack config to use webpack
  turbopack: {},
  webpack: (config, { isServer, webpack }) => {
    // Ignore dev dependencies that test files try to import
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(tap|desm|fastbench|pino-elasticsearch|why-is-node-running|tape)$/,
      }),
      // Ignore test files in thread-stream
      new webpack.IgnorePlugin({
        checkResource(resource: string, context: string) {
          // Ignore test files and benchmark files
          if (
            /node_modules[\/\\]thread-stream[\/\\]test/.test(context) ||
            /node_modules[\/\\]thread-stream[\/\\]bench\.js/.test(context) ||
            /node_modules[\/\\]@walletconnect[\/\\]ethereum-provider[\/\\]node_modules[\/\\]thread-stream[\/\\]test/.test(context) ||
            /node_modules[\/\\]@walletconnect[\/\\]ethereum-provider[\/\\]node_modules[\/\\]thread-stream[\/\\]bench\.js/.test(context)
          ) {
            return true;
          }
          return false;
        },
      })
    );

    // Ignore all warnings related to test files and missing dev dependencies
    config.ignoreWarnings = [
      { module: /node_modules\/thread-stream/ },
      { module: /node_modules\/@walletconnect\/ethereum-provider\/node_modules\/thread-stream/ },
      /Failed to parse source map/,
      /Can't resolve/,
      /Module not found/,
    ];

    return config;
  },
};

export default nextConfig;
