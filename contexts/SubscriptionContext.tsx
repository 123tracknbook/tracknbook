import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
} from "react-native-purchases";

const IOS_RC_KEY = "appl_VvUEhtaTtsgThAClFhpGuUaFcdc";
const ANDROID_RC_KEY = "ANDROID_RC_KEY_PLACEHOLDER";
const ENTITLEMENT_ID = "solo";

// Maximum time to wait for getCustomerInfo before giving up and unblocking.
const RC_INIT_TIMEOUT_MS = 4000;

interface SubscriptionContextType {
  isSubscribed: boolean;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  restorePurchases: () => Promise<CustomerInfo | null>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  customerInfo: null,
  isLoading: false,
  restorePurchases: async () => null,
});

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // All RC work is fire-and-forget. Nothing here must block children from rendering.
    let listenerCleanup: (() => void) | null = null;

    const init = async () => {
      const apiKey = Platform.OS === "ios" ? IOS_RC_KEY : ANDROID_RC_KEY;
      console.log("[SubscriptionContext] Configuring RevenueCat — platform:", Platform.OS);

      // Step 1: configure — must never throw outside try/catch
      try {
        if (__DEV__) {
          Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }
        Purchases.configure({ apiKey });
        console.log("[SubscriptionContext] RevenueCat configured successfully");
      } catch (e) {
        console.warn("[SubscriptionContext] RevenueCat configure error (non-fatal):", e);
        // RC is broken — bail out entirely, children are already rendered
        return;
      }

      // Step 2: attach listener — must never throw outside try/catch
      try {
        const listener = Purchases.addCustomerInfoUpdateListener((info) => {
          console.log(
            "[SubscriptionContext] CustomerInfo updated — entitlements:",
            Object.keys(info.entitlements.active)
          );
          setCustomerInfo(info);
        });
        listenerCleanup = () => {
          try {
            listener.remove();
          } catch (_) {
            // ignore
          }
        };
      } catch (e) {
        console.warn("[SubscriptionContext] addCustomerInfoUpdateListener error (non-fatal):", e);
      }

      // Step 3: fetch initial CustomerInfo with a hard timeout so it never hangs
      setIsLoading(true);
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("RC getCustomerInfo timeout")), RC_INIT_TIMEOUT_MS)
        );
        const info = await Promise.race([
          Purchases.getCustomerInfo(),
          timeoutPromise,
        ]);
        console.log(
          "[SubscriptionContext] Initial CustomerInfo fetched — entitlements:",
          Object.keys(info.entitlements.active)
        );
        setCustomerInfo(info);
      } catch (e) {
        console.warn("[SubscriptionContext] getCustomerInfo error (non-fatal):", e);
      } finally {
        setIsLoading(false);
      }
    };

    // Run async init — errors are fully contained inside init()
    init().catch((e) => {
      console.warn("[SubscriptionContext] Unexpected init error (non-fatal):", e);
      setIsLoading(false);
    });

    return () => {
      if (listenerCleanup) listenerCleanup();
    };
  }, []);

  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    console.log("[SubscriptionContext] restorePurchases called");
    try {
      const info = await Purchases.restorePurchases();
      console.log(
        "[SubscriptionContext] restorePurchases success — entitlements:",
        Object.keys(info.entitlements.active)
      );
      setCustomerInfo(info);
      return info;
    } catch (e) {
      console.error("[SubscriptionContext] restorePurchases error:", e);
      return null;
    }
  }, []);

  const isSubscribed =
    customerInfo?.entitlements.active[ENTITLEMENT_ID] !== undefined;

  console.log(
    "[SubscriptionContext] rendering — isSubscribed:",
    isSubscribed,
    "| isLoading:",
    isLoading
  );

  return (
    <SubscriptionContext.Provider
      value={{ isSubscribed, customerInfo, isLoading, restorePurchases }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
