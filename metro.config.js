const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle web assets properly
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure asset extensions
config.resolver.assetExts.push(
  // Audio files
  'mp3', 'wav', 'aac', 'm4a', 'ogg', 'wma',
  // Video files  
  'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm',
  // Document files
  'pdf', 'doc', 'docx', 'txt', 'rtf'
);

// Configure source extensions
config.resolver.sourceExts.push('jsx', 'js', 'ts', 'tsx', 'json');

module.exports = config;
