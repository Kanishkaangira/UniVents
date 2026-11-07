module.exports = {
  preset: '@react-native/jest-preset',
  // React Navigation publishes ESM entry points; Jest must transform them
  // instead of loading their `export` syntax directly in the test runtime.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@supabase|@react-native-async-storage|react-native-safe-area-context|react-native-screens|react-native-url-polyfill|react-native-linear-gradient|react-native-vector-icons|react-native-pdf|react-native-blob-util)/)',
  ],
};
