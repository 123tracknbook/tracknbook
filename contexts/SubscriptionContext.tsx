import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI, { presentCustomerCenter } from 'react-native-purchases-ui';

const API_KEY = 'appl_VvUEhtaTtsgThAClFhpGuUaFcdc';
const ENTITLEMENT_ID = 'pro';

interface SubscriptionContextType {
  isSubscribed: boolean;
  isPro: boolean;
  currentOffering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  purchasePackage: (pkg: import('react-native-purchases').PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<void>;
  openPaywall: () => void;
  openCustomerCenter: () => Promise<void>;
  refreshCustomerInfo: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[SubscriptionContext] Initializing RevenueCat');
    if (Platform.OS === 'web') {
      console.log('[SubscriptionContext] Web platform detected, skipping RevenueCat init');
      setIsLoading(false);
      return;
    }

    try {
      Purchases.configure({ apiKey: API_KEY });
      console.log('[SubscriptionContext] RevenueCat configured successfully with key:', API_KEY);
    } catch (e) {
      console.error('[SubscriptionContext] Failed to configure RevenueCat:', e);
      setIsLoading(false);
      return;
    }

    loadData();
  }, [loadData]);

  const loadData = useCallback(async () => {
    console.log('[SubscriptionContext] Loading customer info and offerings');
    try {
      const [info, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      console.log('[SubscriptionContext] Customer info loaded');
      console.log('[SubscriptionContext] Active entitlements:', JSON.stringify(info.entitlements.active));
      console.log('[SubscriptionContext] All offerings:', JSON.stringify(offerings.all));
      console.log('[SubscriptionContext] Current offering:', offerings.current ? offerings.current.identifier : 'NULL — no current offering set in dashboard');
      console.log('[SubscriptionContext] Current offering packages:', offerings.current ? JSON.stringify(offerings.current.availablePackages.map(p => ({ id: p.identifier, product: p.product.identifier }))) : 'N/A');

      updateSubscriptionState(info);
      setCurrentOffering(offerings.current);
    } catch (e) {
      console.error('[SubscriptionContext] Error loading RevenueCat data:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSubscriptionState = (info: CustomerInfo) => {
    const subscribed = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
    console.log('[SubscriptionContext] Subscription state updated — isSubscribed:', subscribed);
    setCustomerInfo(info);
    setIsSubscribed(subscribed);
  };

  const refreshCustomerInfo = useCallback(async () => {
    console.log('[SubscriptionContext] Refreshing customer info');
    try {
      const info = await Purchases.getCustomerInfo();
      updateSubscriptionState(info);
    } catch (e) {
      console.error('[SubscriptionContext] Error refreshing customer info:', e);
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: import('react-native-purchases').PurchasesPackage): Promise<boolean> => {
    console.log('[SubscriptionContext] Purchasing package:', pkg.identifier);
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      updateSubscriptionState(info);
      const success = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      console.log('[SubscriptionContext] Purchase result — success:', success);
      return success;
    } catch (e: any) {
      if (e?.userCancelled) {
        console.log('[SubscriptionContext] Purchase cancelled by user');
      } else {
        console.error('[SubscriptionContext] Purchase error:', e);
      }
      return false;
    }
  }, []);

  const restorePurchases = useCallback(async () => {
    console.log('[SubscriptionContext] Restoring purchases');
    try {
      const info = await Purchases.restorePurchases();
      updateSubscriptionState(info);
      console.log('[SubscriptionContext] Restore complete — isSubscribed:', typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined');
    } catch (e) {
      console.error('[SubscriptionContext] Restore error:', e);
    }
  }, []);

  const openPaywall = useCallback(() => {
    console.log('[SubscriptionContext] openPaywall called');
  }, []);

  const openCustomerCenter = useCallback(async () => {
    console.log('[SubscriptionContext] Opening Customer Center');
    try {
      await presentCustomerCenter();
      console.log('[SubscriptionContext] Customer Center dismissed');
      await refreshCustomerInfo();
    } catch (e) {
      console.error('[SubscriptionContext] Customer Center error:', e);
    }
  }, [refreshCustomerInfo]);

  const value: SubscriptionContextType = {
    isSubscribed,
    isPro: isSubscribed,
    currentOffering,
    customerInfo,
    isLoading,
    purchasePackage,
    restorePurchases,
    openPaywall,
    openCustomerCenter,
    refreshCustomerInfo,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextType {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return ctx;
}
