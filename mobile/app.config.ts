import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const appEnvironment = process.env.EXPO_PUBLIC_APP_ENV;
  const isStaging = appEnvironment === "staging";

  if (!isStaging && appEnvironment !== "production") {
    throw new Error(
      "EXPO_PUBLIC_APP_ENV must be set to either staging or production.",
    );
  }

  if (!config.name || !config.slug) {
    throw new Error("The Expo app name and slug must be configured.");
  }

  return {
    ...config,
    name: config.name,
    slug: config.slug,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: isStaging,
        },
      },
    },
    plugins: [
      ...(config.plugins ?? []),
      [
        "expo-build-properties",
        {
          android: {
            usesCleartextTraffic: isStaging,
          },
        },
      ],
    ],
  };
};
