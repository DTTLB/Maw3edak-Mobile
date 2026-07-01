const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (platform === 'web') {
      if (
        moduleName === '@react-native-firebase/app' ||
        moduleName === '@react-native-firebase/messaging' ||
        moduleName === 'expo-local-authentication'
      ) {
        return {
          type: 'empty',
        };
      }
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
