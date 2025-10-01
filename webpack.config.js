const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['@expo/vector-icons']
      }
    },
    argv
  );

  // Add MIME type handling for web assets
  config.module.rules.push({
    test: /\.(mp3|wav|aac|m4a|ogg|wma)$/,
    type: 'asset/resource',
    generator: {
      filename: 'assets/audio/[name][ext]'
    }
  });

  config.module.rules.push({
    test: /\.(mp4|avi|mov|wmv|flv|webm)$/,
    type: 'asset/resource',
    generator: {
      filename: 'assets/video/[name][ext]'
    }
  });

  config.module.rules.push({
    test: /\.(pdf|doc|docx|txt|rtf)$/,
    type: 'asset/resource',
    generator: {
      filename: 'assets/docs/[name][ext]'
    }
  });

  // Handle font files
  config.module.rules.push({
    test: /\.(woff|woff2|eot|ttf|otf)$/,
    type: 'asset/resource',
    generator: {
      filename: 'assets/fonts/[name][ext]'
    }
  });

  return config;
};
