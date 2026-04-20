import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL, CustomerInfo } from "react-native-purchases";

const ENTITLEMENT_ID = "solo";
const RC_IOS_KEY = "appl_VvUEhtaTtsgThAClFhpGuUaFcdc";
const RC_ANDROID_KEY = "ANDROID_RC_KEY_PLACEHOLDER";

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

function checkEntitlement(info: CustomerInfo | null): boolean {
  if (!info) return false;
  const entitlement = info.entitlements.active[ENTITLEMENT_ID];
  return !!entitlement;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("[SubscriptionContext] configuring RevenueCat");

    // Fire-and-forget — never block rendering
    (async () => {
      try {
        if (Platform.OS === 'android' && RC_ANDROID_KEY === 'ANDROID_RC_KEY_PLACEHOLDER') {
          console.warn('[SubscriptionContext] Android RevenueCat key not set — skipping RC configuration');
          setIsLoading(false);
          return;
        }
        Purchases.setLogLevel(LOG_LEVEL.WARN);
        const apiKey = Platform.OS === "ios" ? RC_IOS_KEY : RC_ANDROID_KEY;
        Purchases.configure({ apiKey });
        console.log("[SubscriptionContext] RevenueCat configured, apiKey platform:", Platform.OS);

        const info = await Purchases.getCustomerInfo();
        console.log(
          "[SubscriptionContext] initial customerInfo fetched — entitlement active:",
          checkEntitlement(info)
        );
        setCustomerInfo(info);
      } catch (e) {
        console.warn("[SubscriptionContext] RC configure/getCustomerInfo error:", e);
      } finally {
        setIsLoading(false);
      }
    })();

    // Listen for real-time CustomerInfo updates (e.g. after purchase)
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      console.log(
        "[SubscriptionContext] customerInfoUpdateListener fired — entitlement active:",
        checkEntitlement(info)
      );
      setCustomerInfo(info);
    });

    return () => {
      try {
        listener.remove();
      } catch (e) {
        console.warn("[SubscriptionContext] error removing listener:", e);
      }
    };
  }, []);

  const restorePurchases = useCallback(async (): Promise<CustomerInfo | null> => {
    console.log("[SubscriptionContext] restorePurchases called");
    try {
      const info = await Purchases.restorePurchases();
      console.log(
        "[SubscriptionContext] restorePurchases completed — entitlement active:",
        checkEntitlement(info)
      );
      setCustomerInfo(info);
      return info;
    } catch (e) {
      console.warn("[SubscriptionContext] restorePurchases error:", e);
      return null;
    }
  }, []);

  const isSubscribed = checkEntitlement(customerInfo);

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
