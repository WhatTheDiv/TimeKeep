const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

if (!defaultConfig) console.error('Error with defaultConfig!!!!!!!!!')
// @ts-ignore
defaultConfig.resolver.assetExts.push('db');

module.exports = defaultConfig;