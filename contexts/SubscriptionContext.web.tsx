import React, { createContext, useContext, ReactNode } from "react";

// Web stub — react-native-purchases has no web support.
// This file prevents Metro from bundling native RC code when targeting web.

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
  return (
    <SubscriptionContext.Provider
      value={{ isSubscribed: false, customerInfo: null, isLoading: false, restorePurchases: async () => null }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
