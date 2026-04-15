import React, {
  createContext,
  useContext,
  ReactNode,
} from "react";

// react-native-purchases is not installed in this project.
// This context provides a no-op stub so all consumers compile and run without errors.

interface SubscriptionContextType {
  isSubscribed: boolean;
  customerInfo: null;
  isLoading: boolean;
  restorePurchases: () => Promise<null>;
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
  console.log("[SubscriptionContext] rendering — stub provider (react-native-purchases not installed)");

  const restorePurchases = async (): Promise<null> => {
    console.log("[SubscriptionContext] restorePurchases called — stub, no-op");
    return null;
  };

  return (
    <SubscriptionContext.Provider
      value={{ isSubscribed: false, customerInfo: null, isLoading: false, restorePurchases }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
