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

interface SubscriptionContextType {
  isSubscribed: boolean;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  restorePurchases: () => Promise<CustomerInfo | null>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isSubscribed: false,
  customerInfo: null,
  isLoading: true,
  restorePurchases: async () => null,
});

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const apiKey = Platform.OS === "ios" ? IOS_RC_KEY : ANDROID_RC_KEY;
    console.log("[SubscriptionContext] Configuring RevenueCat — platform:", Platform.OS);

    try {
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }
      Purchases.configure({ apiKey });
      console.log("[SubscriptionContext] RevenueCat configured successfully");
    } catch (e) {
      console.error("[SubscriptionContext] RevenueCat configure error:", e);
    }

    // Fetch initial CustomerInfo
    Purchases.getCustomerInfo()
      .then((info) => {
        console.log(
          "[SubscriptionContext] Initial CustomerInfo fetched — entitlements:",
          Object.keys(info.entitlements.active)
        );
        setCustomerInfo(info);
      })
      .catch((e) => {
        console.error("[SubscriptionContext] getCustomerInfo error:", e);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Listen for CustomerInfo updates (e.g. after a purchase)
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log(
        "[SubscriptionContext] CustomerInfo updated — entitlements:",
        Object.keys(info.entitlements.active)
      );
      setCustomerInfo(info);
    });

    return () => {
      listener.remove();
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
