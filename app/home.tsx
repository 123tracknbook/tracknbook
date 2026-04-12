
// This file is intentionally a minimal stub for non-web native platforms.
// The real home screen is at app/(tabs)/(home)/index.tsx (and index.ios.tsx).
// This route (app/home) is not used in navigation — it exists only to prevent
// Metro from complaining about a missing fallback for app/home.web.tsx.
import { Redirect } from "expo-router";

export default function HomeRedirect() {
  console.log('[home.tsx] Redirecting to (tabs)/(home)');
  return <Redirect href="/(tabs)/(home)" />;
}
