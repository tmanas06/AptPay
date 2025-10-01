const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle web assets properly
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure asset extensions - but don't include audio/video for web
const isWeb = process.env.EXPO_PLATFORM === 'web';

if (!isWeb) {
  config.resolver.assetExts.push(
    // Audio files
    'mp3', 'wav', 'aac', 'm4a', 'ogg', 'wma',
    // Video files  
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'
  );
}

// Configure source extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Block problematic node_modules from being processed
config.resolver.blockList = [
  /node_modules\/.*\/.*\.wav$/,
  /node_modules\/.*\/.*\.mp3$/,
];

module.exports = config;
