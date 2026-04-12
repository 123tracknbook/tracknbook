import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

// Safe no-op reload — only calls into @bacons/apple-targets on iOS native builds.
// The module is always present in the bundle but reloadWidget() is a no-op on
// Android/web and when no widget extension is linked.
function safeReloadWidget() {
  if (Platform.OS !== "ios") return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ExtensionStorage } = require("@bacons/apple-targets") as typeof import("@bacons/apple-targets");
    ExtensionStorage.reloadWidget();
  } catch {
    // Non-fatal: widget extension not linked in this build
  }
}

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    safeReloadWidget();
  }, []);

  const refreshWidget = useCallback(() => {
    safeReloadWidget();
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
