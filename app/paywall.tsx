import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '@/contexts/SubscriptionContext';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import type { CustomerInfo } from 'react-native-purchases';
import type { PurchasesError } from 'react-native-purchases';

// Error boundary to catch RevenueCatUI.Paywall throws (e.g. native module not linked in Expo Go)
class PaywallErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode; onError: () => void },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    console.log('[Paywall] RevenueCatUI error caught by boundary:', error?.message);
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error) {
    console.error('[Paywall] PaywallErrorBoundary componentDidCatch:', error?.message, error?.stack);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      console.log('[Paywall] Error boundary rendering fallback UI, error was:', this.state.errorMessage);
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function PaywallScreen() {
  console.log('[Paywall] PaywallScreen mounting');
  const router = useRouter();
  const { offeringId } = useLocalSearchParams<{ offeringId?: string }>();
  const { openCustomerCenter, refreshCustomerInfo, currentOffering, isLoading } = useSubscription();
  const [nativePaywallFailed, setNativePaywallFailed] = useState(false);
  const [resolvedOffering, setResolvedOffering] = useState<PurchasesOffering | null>(null);
  const [offeringLoading, setOfferingLoading] = useState(!!offeringId);

  useEffect(() => {
    console.log('[Paywall] PaywallScreen mounted — offeringId param:', offeringId ?? 'none (using default)');
    if (!offeringId) {
      console.log('[Paywall] No offeringId param — falling back to default offering from context');
      setOfferingLoading(false);
      return;
    }
    if (Platform.OS === 'web') {
      setOfferingLoading(false);
      return;
    }
    console.log('[Paywall] Fetching offerings to resolve offeringId:', offeringId);
    Purchases.getOfferings()
      .then((offerings) => {
        const match = offerings.all[offeringId] ?? null;
        console.log('[Paywall] Resolved offering for id "' + offeringId + '":', match ? match.identifier : 'NOT FOUND — falling back to default');
        if (match) {
          console.log('[Paywall] Offering packages:', JSON.stringify(match.availablePackages.map(p => ({ id: p.identifier, product: p.product.identifier }))));
        }
        setResolvedOffering(match);
      })
      .catch((e) => {
        console.error('[Paywall] Failed to fetch offerings for id "' + offeringId + '":', e);
      })
      .finally(() => {
        setOfferingLoading(false);
      });
  }, [offeringId]);

  useEffect(() => {
    if (!offeringId) {
      console.log('[Paywall] Context offering — isLoading:', isLoading, '| currentOffering:', currentOffering ? currentOffering.identifier : 'NULL');
      if (currentOffering) {
        console.log('[Paywall] currentOffering packages:', JSON.stringify(currentOffering.availablePackages.map(p => ({ id: p.identifier, product: p.product.identifier }))));
      }
    }
  }, [isLoading, currentOffering, offeringId]);

  const handleNativePaywallError = useCallback(() => {
    console.log('[Paywall] onError callback fired — setting nativePaywallFailed=true');
    setNativePaywallFailed(true);
  }, []);

  const handleDismiss = useCallback(() => {
    console.log('[Paywall] User dismissed paywall');
    router.back();
  }, [router]);

  const handlePurchaseCompleted = useCallback(async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
    console.log('[Paywall] Purchase completed, active entitlements:', Object.keys(customerInfo.entitlements.active));
    await refreshCustomerInfo();
    router.back();
  }, [router, refreshCustomerInfo]);

  const handleRestoreCompleted = useCallback(async ({ customerInfo }: { customerInfo: CustomerInfo }) => {
    console.log('[Paywall] Restore completed, active entitlements:', Object.keys(customerInfo.entitlements.active));
    await refreshCustomerInfo();
    router.back();
  }, [router, refreshCustomerInfo]);

  const handlePurchaseError = useCallback(({ error }: { error: PurchasesError }) => {
    console.error('[Paywall] Purchase error:', error?.message ?? error);
  }, []);

  const handlePurchaseCancelled = useCallback(() => {
    console.log('[Paywall] Purchase cancelled by user');
  }, []);

  const handleManageSubscription = useCallback(async () => {
    console.log('[Paywall] Manage Subscription / Customer Center tapped');
    await openCustomerCenter();
  }, [openCustomerCenter]);

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>TracknBook Pro</Text>
        <Text style={styles.fallbackSubtitle}>Subscriptions are available on iOS and Android.</Text>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Loading state while RevenueCat initialises or specific offering is being fetched
  if (isLoading || offeringLoading) {
    console.log('[Paywall] Showing loading state — isLoading:', isLoading, '| offeringLoading:', offeringLoading);
    return (
      <SafeAreaView style={styles.fallbackContainer}>
        <ActivityIndicator size="large" color="#5B5BFF" />
        <Text style={styles.fallbackSubtitle}>Loading plans...</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleDismiss}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // The offering to display: prefer the resolved specific offering, fall back to context default
  const activeOffering = resolvedOffering ?? currentOffering;

  // Fallback shown when native module is unavailable (Expo Go) or no offering is configured
  const fallbackUI = (
    <SafeAreaView style={styles.fallbackContainer}>
      <Text style={styles.fallbackTitle}>TracknBook Pro</Text>
      <Text style={styles.fallbackSubtitle}>
        {activeOffering
          ? 'Unlock all features with a Pro subscription.'
          : 'No subscription plans are configured yet.\nCheck your RevenueCat dashboard.'}
      </Text>
      <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
        <Text style={styles.dismissButtonText}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  // If a previous render already failed, skip straight to fallback
  if (nativePaywallFailed) {
    console.log('[Paywall] Rendering fallback UI (native paywall previously failed)');
    return fallbackUI;
  }

  return (
    <View style={styles.container}>
      <PaywallErrorBoundary fallback={fallbackUI} onError={handleNativePaywallError}>
        <RevenueCatUI.Paywall
          offering={activeOffering ?? undefined}
          onDismiss={handleDismiss}
          onPurchaseCompleted={handlePurchaseCompleted}
          onRestoreCompleted={handleRestoreCompleted}
          onPurchaseError={handlePurchaseError}
          onPurchaseCancelled={handlePurchaseCancelled}
        />
      </PaywallErrorBoundary>
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={handleManageSubscription}
          activeOpacity={0.7}
        >
          <Text style={styles.manageButtonText}>Manage Subscription</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 8,
    alignItems: 'center',
  },
  manageButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  manageButtonText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  // Fallback / loading UI
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  fallbackTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  dismissButton: {
    backgroundColor: '#5B5BFF',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  dismissButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backButtonText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    fontWeight: '500',
  },
});
