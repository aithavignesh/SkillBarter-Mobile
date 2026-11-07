import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "react-native": path.resolve(__dirname, "./tests/mocks/react-native.ts"),
      "expo-secure-store": path.resolve(__dirname, "./tests/mocks/expo-secure-store.ts"),
    },
  },
});
