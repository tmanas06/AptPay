const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle web assets properly
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure asset extensions - but don't include audio/video for web
const isWeb = process.env.EXPO_PLATFORM === 'web' || process.env.EXPO_WEB_SKIP_AUDIO === 'true';

if (!isWeb) {
  config.resolver.assetExts.push(
    // Audio files
    'mp3', 'wav', 'aac', 'm4a', 'ogg', 'wma',
    // Video files  
    'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'
  );
} else {
  // For web builds, explicitly exclude audio/video files
  config.resolver.assetExts = config.resolver.assetExts.filter(ext => 
    !['mp3', 'wav', 'aac', 'm4a', 'ogg', 'wma', 'flac', 'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)
  );
}

// Configure source extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

// Block problematic node_modules from being processed
config.resolver.blockList = [
  /node_modules\/.*\/.*\.wav$/,
  /node_modules\/.*\/.*\.mp3$/,
  /node_modules\/.*\/.*\.aac$/,
  /node_modules\/.*\/.*\.m4a$/,
  /node_modules\/.*\/.*\.ogg$/,
  /node_modules\/.*\/.*\.wma$/,
  /node_modules\/.*\/.*\.flac$/,
  // Block all audio files from being processed by Jimp
  /\.mp3$/,
  /\.wav$/,
  /\.aac$/,
  /\.m4a$/,
  /\.ogg$/,
  /\.wma$/,
  /\.flac$/,
];

module.exports = config;
