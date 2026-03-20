import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSubscription } from '@/contexts/SubscriptionContext';
import RevenueCatUI from 'react-native-purchases-ui';
import type { CustomerInfo } from 'react-native-purchases';
import type { PurchasesError } from 'react-native-purchases';

// Error boundary to catch RevenueCatUI.Paywall throws (e.g. native module not linked in Expo Go)
class PaywallErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    console.log('[Paywall] RevenueCatUI error caught by boundary:', error?.message);
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error) {
    console.log('[Paywall] PaywallErrorBoundary caught:', error?.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function PaywallScreen() {
  const router = useRouter();
  const { openCustomerCenter, refreshCustomerInfo, currentOffering, isLoading } = useSubscription();
  const [nativePaywallFailed, setNativePaywallFailed] = useState(false);

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

  // Loading state while RevenueCat initialises
  if (isLoading) {
    console.log('[Paywall] Showing loading state while RevenueCat initialises');
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

  // Fallback shown when native module is unavailable (Expo Go) or no offering is configured
  const fallbackUI = (
    <SafeAreaView style={styles.fallbackContainer}>
      <Text style={styles.fallbackTitle}>TracknBook Pro</Text>
      <Text style={styles.fallbackSubtitle}>
        {currentOffering
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
      <PaywallErrorBoundary fallback={fallbackUI}>
        <RevenueCatUI.Paywall
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
