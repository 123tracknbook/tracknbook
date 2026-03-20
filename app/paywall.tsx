import React, { useEffect, useCallback } from 'react';
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

export default function PaywallScreen() {
  const router = useRouter();
  const { openCustomerCenter, refreshCustomerInfo } = useSubscription();

  const handleDismiss = useCallback(() => {
    console.log('[Paywall] User dismissed paywall');
    router.back();
  }, [router]);

  const handlePurchaseCompleted = useCallback(async ({ customerInfo }: { customerInfo: import('react-native-purchases').CustomerInfo }) => {
    console.log('[Paywall] Purchase completed, active entitlements:', Object.keys(customerInfo.entitlements.active));
    await refreshCustomerInfo();
    router.back();
  }, [router, refreshCustomerInfo]);

  const handleRestoreCompleted = useCallback(async ({ customerInfo }: { customerInfo: import('react-native-purchases').CustomerInfo }) => {
    console.log('[Paywall] Restore completed, active entitlements:', Object.keys(customerInfo.entitlements.active));
    await refreshCustomerInfo();
    router.back();
  }, [router, refreshCustomerInfo]);

  const handleManageSubscription = useCallback(async () => {
    console.log('[Paywall] Manage Subscription / Customer Center tapped');
    await openCustomerCenter();
  }, [openCustomerCenter]);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.webContainer}>
        <Text style={styles.webTitle}>TracknBook Pro</Text>
        <Text style={styles.webSubtitle}>Subscriptions are available on iOS and Android.</Text>
        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <RevenueCatUI.Paywall
        onDismiss={handleDismiss}
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={handleRestoreCompleted}
        onPurchaseError={(error: Error) => {
          console.error('[Paywall] Purchase error:', error);
        }}
        onPurchaseCancelled={() => {
          console.log('[Paywall] Purchase cancelled by user');
        }}
      />
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
  // Web fallback
  webContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  webTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  webSubtitle: {
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
});
