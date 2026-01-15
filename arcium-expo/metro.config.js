const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Force the project root to be the current directory
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

module.exports = config;
