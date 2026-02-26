const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

module.exports = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' })
