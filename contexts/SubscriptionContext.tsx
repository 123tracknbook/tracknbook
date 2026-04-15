import React, { createContext, useContext, ReactNode } from "react";

interface SubscriptionContextType {
  isSubscribed: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({ isSubscribed: false });

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  return (
    <SubscriptionContext.Provider value={{ isSubscribed: false }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
