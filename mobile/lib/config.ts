export type AppEnvironment = "staging" | "production";

const configuredEnvironment = process.env.EXPO_PUBLIC_APP_ENV;
const configuredApiUrl = process.env.EXPO_PUBLIC_BACKEND_API_URL;

if (
  configuredEnvironment !== "staging" &&
  configuredEnvironment !== "production"
) {
  throw new Error(
    "EXPO_PUBLIC_APP_ENV must be set to either staging or production.",
  );
}

if (!configuredApiUrl) {
  throw new Error("EXPO_PUBLIC_BACKEND_API_URL is not configured.");
}

let apiUrl: URL;

try {
  apiUrl = new URL(configuredApiUrl);
} catch {
  throw new Error("EXPO_PUBLIC_BACKEND_API_URL must be a complete URL.");
}

if (apiUrl.protocol !== "http:" && apiUrl.protocol !== "https:") {
  throw new Error("EXPO_PUBLIC_BACKEND_API_URL must use http or https.");
}

if (configuredEnvironment === "production" && apiUrl.protocol !== "https:") {
  throw new Error("The production API URL must use https.");
}

export const APP_ENV: AppEnvironment = configuredEnvironment;
export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, "");
