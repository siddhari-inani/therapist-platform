import type { ExpoConfig } from "expo/config";

const DEFAULT_WEB_APP_URL = "https://revora-health.vercel.app";

const webAppUrl =
  process.env.EXPO_PUBLIC_WEB_APP_URL?.replace(/\/$/, "") || DEFAULT_WEB_APP_URL;

const config: ExpoConfig = {
  name: "Revora Health",
  slug: "revora-health",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  scheme: "revora-health",
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0f172a",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.revorahealth.app",
    infoPlist: {
      NSMicrophoneUsageDescription:
        "Revora may use the microphone when you use voice and audio features in the app.",
      NSCameraUsageDescription:
        "Revora may use the camera if you choose to capture photos or video in the app.",
      NSPhotoLibraryUsageDescription:
        "Revora needs access to your library when you attach photos or files.",
      NSLocationWhenInUseUsageDescription:
        "Revora may use your location for maps and location-related features.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0f172a",
    },
    package: "com.revorahealth.app",
    edgeToEdgeEnabled: true,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  extra: {
    webAppUrl,
  },
};

export default config;
