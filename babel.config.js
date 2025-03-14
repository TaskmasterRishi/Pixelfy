module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }], // Expo + NativeWind
    ],
    plugins: [
      "nativewind/babel", // NativeWind plugin
      "react-native-reanimated/plugin", // Reanimated must be LAST in the list!
    ],
  };
};
